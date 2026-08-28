'use strict';
/**
 * leadService.js — lead CRUD, pipeline, search, notes, tags, conversion.
 *
 * The CRM system-of-record. Every mutation that belongs in the lead's history
 * also writes a lead_activities row (via activity.logActivity) so the timeline
 * is always complete.
 *
 * Dedup: phone is the primary key of identity in this product; upsertLead
 * matches on normalized phone, then email, and MERGES (never overwrites a
 * populated field with a blank) so re-running the backfill/import is safe.
 */
const { supabaseAdmin } = require('../../config/supabase');
const { normalizePhone } = require('../aisensyService');
const { logActivity } = require('./activity');
const { cleanAttribution, touchSnapshot, stripAttributionColumns, isMissingColumnError } = require('./attributionInput');
const rules = require('./lifecycleRules');

// The lifecycle state model lives in lifecycleRules (pure, unit-tested). Re-exported
// here so existing importers of leadService.FUNNEL / STATUSES keep working.
const { FUNNEL, STATUSES, CONVERTED, MONEY, TERMINAL, RANK } = rules;
const rankOf = rules.rankOf;

const norm = (p) => normalizePhone(p) || null;
const lc = (e) => (e ? String(e).trim().toLowerCase() : null);

// ── Create / upsert ───────────────────────────────────────────
/**
 * Insert or merge a lead. Match order: normalized phone → email.
 * `patch` may include any lead column; blanks never clobber existing values.
 * @returns {{ lead, created }}
 */
async function upsertLead(patch = {}, { source, createdBy = '', attribution } = {}) {
  const phone = norm(patch.phone);
  const email = lc(patch.email);
  const att = cleanAttribution(attribution || {});   // null when no usable UTM/referrer

  let existing = null;
  if (phone) ({ data: existing } = await supabaseAdmin.from('leads').select('*').eq('phone', phone).maybeSingle());
  if (!existing && email) ({ data: existing } = await supabaseAdmin.from('leads').select('*').eq('email', email).maybeSingle());

  const clean = { ...patch };
  if (phone) clean.phone = phone; else delete clean.phone;
  if (email) clean.email = email; else delete clean.email;
  // Flat utm_* columns join the patch so the blank-merge below preserves the
  // FIRST-touch source (never clobbered), while last_touch is refreshed each time.
  if (att) Object.assign(clean, att);

  if (existing) {
    // Merge: only fill blanks / update explicitly provided non-empty values.
    const merged = {};
    for (const [k, v] of Object.entries(clean)) {
      if (v === undefined || v === null || v === '') continue;
      if (k === 'status' || k === 'owner_admin_id' || k === 'source') continue; // never regress pipeline on re-sync
      if (existing[k] === null || existing[k] === '' || existing[k] === undefined) merged[k] = v;
    }
    if (att) {
      merged.last_touch = touchSnapshot(att);                 // last-touch always refreshes
      if (!existing.first_touch) merged.first_touch = touchSnapshot(att);
    }
    if (Object.keys(merged).length) {
      merged.updated_at = new Date().toISOString();
      await updateLeadTolerant(existing.id, merged);
    }
    return { lead: { ...existing, ...merged }, created: false };
  }

  const row = {
    ...clean,
    source: source || clean.source || 'manual',
    created_by: createdBy,
  };
  if (att) { const snap = touchSnapshot(att); row.first_touch = snap; row.last_touch = snap; }
  const data = await insertLeadTolerant(row);
  await logActivity(data.id, 'lead_created', { title: `Lead created (${row.source})`, meta: { source: row.source } });
  // Stitch any intent events that fired before this lead existed (best-effort).
  require('./intentEvents').attachToLead(data).catch(() => {});
  return { lead: data, created: true };
}

// Insert a lead; if the attribution columns don't exist yet (migration v3.120
// not applied on this DB), strip them and retry so lead capture never breaks.
async function insertLeadTolerant(row) {
  let { data, error } = await supabaseAdmin.from('leads').insert(row).select('*').single();
  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabaseAdmin.from('leads').insert(stripAttributionColumns(row)).select('*').single());
  }
  if (error) throw error;
  return data;
}

async function updateLeadTolerant(id, patch) {
  let { error } = await supabaseAdmin.from('leads').update(patch).eq('id', id);
  if (error && isMissingColumnError(error)) {
    ({ error } = await supabaseAdmin.from('leads').update(stripAttributionColumns(patch)).eq('id', id));
  }
  if (error) throw error;
}

async function getLead(id) {
  const { data } = await supabaseAdmin.from('leads').select('*').eq('id', id).maybeSingle();
  return data || null;
}

/**
 * upsertLead that NEVER throws — for real-time hooks on the signup / booking /
 * form paths where a CRM write must never break the primary flow. Callers await
 * this (so there is no floating promise / unhandled rejection), and it swallows
 * every error into a warn log. Returns the { lead, created } result or null.
 */
async function safeUpsertLead(patch = {}, opts = {}) {
  try {
    return await upsertLead(patch, opts);
  } catch (e) {
    console.warn('[crm] safeUpsertLead failed:', e?.message || e);
    return null;
  }
}

/**
 * Record a real-time account/money event on the lead timeline and (optionally)
 * promote the lead to 'paid' the instant it happens — instead of waiting up to an
 * hour for the attribution batch. Stitches/creates the lead from the profile's
 * identity so a host who was never cold-outreached still gets a lead + timeline.
 *
 * Never throws — a CRM write must not break a payment/webhook flow. Promotion
 * respects the no-regress rule (never touches lost / do_not_contact / already-paid).
 *
 * @param {object} p
 * @param {string} p.profileId    profiles.id of the host
 * @param {string} p.type         activity type (e.g. 'subscription_started')
 * @param {string} p.title        human-facing timeline title
 * @param {object} [p.meta]       activity meta (plan, cadence, payment_id, amount…)
 * @param {boolean} [p.promoteToPaid] set status→paid + converted_at if not already won
 * @param {string} [p.wonAt]      ISO timestamp to stamp converted_at with
 * @returns {Promise<string|null>} the lead id, or null on failure
 */
async function recordAccountEvent({ profileId, type, title, meta = {}, promoteToPaid = false, promoteTo = null, wonAt = null } = {}) {
  if (!profileId || !type) return null;
  try {
    const { data: p } = await supabaseAdmin.from('profiles')
      .select('name, email, phone').eq('id', profileId).maybeSingle();
    // Stitch by phone/email, ensure the profile link (blanks never clobber).
    const res = await safeUpsertLead(
      { name: p?.name, email: p?.email, phone: p?.phone, profile_id: profileId },
      { source: 'host_signup' },
    );
    const lead = res?.lead;
    if (!lead) return null;

    await logActivity(lead.id, type, { title, meta });

    // Immediate forward promotion (money fast-path). promoteToPaid is the legacy
    // boolean → 'paid' (Subscribed); promoteTo names any target. Never regresses a
    // higher money state and never resurrects a terminal/dnc lead (rank + NO_AUTO).
    const target = promoteTo || (promoteToPaid ? 'paid' : null);
    if (target && !rules.NO_AUTO.has(lead.status) && rankOf(target) > rankOf(lead.status)) {
      const patch = { status: target, updated_at: new Date().toISOString() };
      if (MONEY.has(target) && !lead.converted_at) patch.converted_at = wonAt || new Date().toISOString();
      await supabaseAdmin.from('leads').update(patch).eq('id', lead.id);
      await logActivity(lead.id, 'status_changed', {
        title: `Status → ${target}`, meta: { from: lead.status, to: target, via: type, change_type: 'auto' },
      });
    }
    return lead.id;
  } catch (e) {
    console.warn('[crm] recordAccountEvent failed:', e?.message || e);
    return null;
  }
}

/**
 * Real-time backstop: resolve a linked host's lead to the most-advanced status its
 * account has earned (Subscribed → Onboarded → Won → Sloth → Marketing) and apply
 * it. Runs the SAME pure resolver the 15-min engine uses, so a hook and the cron
 * can never disagree. Never throws — a CRM write must not break a payment/booking.
 *
 * @param {string} profileId  profiles.id of the host
 * @returns {Promise<string|null>} the resolved status, or null on no-op/failure
 */
async function recomputeFromAccount(profileId) {
  if (!profileId) return null;
  try {
    const { data: lead } = await supabaseAdmin.from('leads')
      .select('id, status, converted_at').eq('profile_id', profileId)
      .order('created_at', { ascending: true }).limit(1).maybeSingle();
    if (!lead) return null;
    const ctx = await loadAccountFacts(profileId);
    const next = rules.resolveAccountStatus(lead.status, ctx);
    if (next === lead.status) return lead.status;
    await changeStatus(lead.id, next, null, { via: 'account_recompute' });
    return next;
  } catch (e) {
    console.warn('[crm] recomputeFromAccount failed:', e?.message || e);
    return null;
  }
}

// Load the account facts the resolver needs for one host. Refund-aware earnings +
// last-30d activity + plan tenure cost + renewals + qualified referrals + enterprise.
async function loadAccountFacts(profileId) {
  const planService = require('../planService');
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const [profileRes, svcRes, availRes, bookedRes, recentRes, subsRes, refsRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('onboarding_completed, profile_image, plan, razorpay_subscription_id, subscription_status').eq('id', profileId).maybeSingle(),
    supabaseAdmin.from('services').select('id', { count: 'exact', head: true }).eq('host_id', profileId),
    supabaseAdmin.from('availability').select('host_id', { count: 'exact', head: true }).eq('host_id', profileId),
    supabaseAdmin.from('bookings').select('platform_fee_amount, status').eq('host_id', profileId).eq('payment_status', 'paid'),
    supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true }).eq('host_id', profileId).eq('payment_status', 'paid').gte('created_at', since30),
    supabaseAdmin.from('subscription_payments').select('total_charged, status').eq('vendor_id', profileId).eq('status', 'paid'),
    supabaseAdmin.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', profileId).in('status', ['qualified', 'rewarded']),
  ]);
  const profile = profileRes.data || {};
  const planSlug = planService.resolveVendorPlan ? planService.resolveVendorPlan(profile) : profile.plan;
  const isFree = planService.isFreeSlug ? planService.isFreeSlug(planSlug) : false;
  const isPaid = (!!profile.razorpay_subscription_id || (!!planSlug && !isFree)) && profile.subscription_status !== 'cancelled';
  // On-platform earnings = platform fee on non-dead paid bookings (refund-aware).
  const DEAD = new Set(['cancelled', 'no_show', 'refunded']);
  const earningsPaise = (bookedRes.data || [])
    .filter((b) => !(b.status && DEAD.has(String(b.status).toLowerCase())))
    .reduce((a, b) => a + Math.round((Number(b.platform_fee_amount) || 0) * 100), 0);
  const subs = subsRes.data || [];
  let planPricePaise = 0;
  try {
    const plan = planService.getPlan ? await planService.getPlan(planSlug) : null;
    planPricePaise = Math.round((Number(plan?.annual_price) || Number(plan?.monthly_price) || 0) * 100);
  } catch (_) { /* plan lookup best-effort */ }
  return {
    isPaid,
    onboardingComplete: !!profile.onboarding_completed,
    hasPhoto: !!profile.profile_image,
    hasBooking: (bookedRes.data || []).length > 0,
    bookingsLast30d: recentRes.count || 0,
    earningsPaise,
    planPricePaise,
    renewals: Math.max(0, subs.length - 1),          // charges beyond the first = renewals
    referralsQualified: refsRes.count || 0,
    isEnterprise: String(planSlug || '').toLowerCase().includes('enterprise'),
  };
}

// A lead is "due" from EITHER mechanism: an open lead_follow_ups task, or the
// leads.next_action_at the lifecycle automation writes. The task table is nearly
// empty in practice while next_action_at carries the real signal, so the work
// queue must union both or it reads as dead. Pure window bounds so it's testable.
function followupWindow(window, now = new Date()) {
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  if (window === 'overdue') return { to: now.toISOString(), inclusive: false };
  if (window === 'today') return { to: dayEnd, inclusive: true };
  return {}; // 'open' — no date bound
}

// Lead ids that are due in a given window ('overdue'|'today'|'open'), unioned
// across open follow-up tasks and open leads' next_action_at.
async function leadIdsWithFollowup(window) {
  const { to, inclusive } = followupWindow(window);

  let taskQ = supabaseAdmin.from('lead_follow_ups').select('lead_id').eq('status', 'open');
  let naQ = supabaseAdmin.from('leads').select('id')
    .not('next_action_at', 'is', null).not('status', 'in', rules.CLOSED_SQL);
  if (to) {
    taskQ = inclusive ? taskQ.lte('due_at', to) : taskQ.lt('due_at', to);
    naQ = inclusive ? naQ.lte('next_action_at', to) : naQ.lt('next_action_at', to);
  }
  const [{ data: tasks }, { data: nas }] = await Promise.all([taskQ.limit(5000), naQ.limit(5000)]);
  return Array.from(new Set([
    ...(tasks || []).map((r) => r.lead_id),
    ...(nas || []).map((r) => r.id),
  ]));
}

// ── List / search ─────────────────────────────────────────────
// followup: 'overdue' | 'today' | 'open'  — restrict to leads with such a task.
// createdSince: ISO — leads created on/after this instant (metric "New today").
// hasValue: true — only leads with revenue_paise > 0.
async function listLeads({ status, source, owner, tag, city, profession, q, followup, createdSince, hasValue, page = 1, pageSize = 25 } = {}) {
  let query = supabaseAdmin.from('leads').select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);
  if (owner) query = query.eq('owner_admin_id', owner);
  if (city) query = query.ilike('city', `%${city}%`);
  if (profession) query = query.ilike('profession', `%${profession}%`);
  if (tag) query = query.contains('tags', [tag]);
  if (createdSince) query = query.gte('created_at', createdSince);
  if (hasValue) query = query.gt('revenue_paise', 0);
  if (followup) {
    const ids = await leadIdsWithFollowup(followup);
    if (!ids.length) return { rows: [], total: 0, page, pageSize };
    query = query.in('id', ids);
  }
  if (q) {
    const s = String(q).replace(/[%,()]/g, ' ').trim();
    query = query.or(`name.ilike.%${s}%,business_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  const from = (Math.max(1, page) - 1) * pageSize;
  query = query.order('last_activity_at', { ascending: false, nullsFirst: false })
               .order('created_at', { ascending: false })
               .range(from, from + pageSize - 1);
  const { data, count, error } = await query;
  if (error) throw error;
  return { rows: data || [], total: count || 0, page, pageSize };
}

// ── Mutations (each writes an activity) ───────────────────────
async function changeStatus(id, status, actorAdminId, opts = {}) {
  if (!STATUSES.includes(status)) throw new Error(`invalid status: ${status}`);
  const before = await getLead(id);
  const reason = (opts.reason || '').trim();

  // Manual moves (a human actor) are guarded: backward moves and exits must carry
  // a reason so the timeline records *why* a lead was pulled back or dropped.
  // System/auto moves (actorAdminId null) bypass the guard — the resolver only ever
  // moves forward and to legitimate auto-exits (e.g. churn).
  if (actorAdminId && before) {
    const t = rules.manualTransition(before.status, status);
    if (t.needsReason && !reason) {
      throw new Error(`reason required to move ${before.status} → ${status}`);
    }
  }

  const patch = { status, updated_at: new Date().toISOString() };
  if (status === 'do_not_contact') patch.do_not_contact = true;
  if (CONVERTED.has(status) && before && !before.converted_at) patch.converted_at = new Date().toISOString();
  // An exit move with a reason records it on the lead (mirrors do_not_contact's flag).
  if (TERMINAL.has(status) && reason) patch.lost_reason = reason;
  await supabaseAdmin.from('leads').update(patch).eq('id', id);
  await logActivity(id, 'status_changed', {
    actorAdminId, title: `Status → ${status}`,
    meta: {
      from: before?.status, to: status,
      change_type: actorAdminId ? 'manual' : 'auto',
      ...(reason ? { reason } : {}),
      ...(opts.via ? { via: opts.via } : {}),
    },
  });
  return getLead(id);
}

async function assignOwner(id, ownerAdminId, actorAdminId) {
  await supabaseAdmin.from('leads').update({ owner_admin_id: ownerAdminId, updated_at: new Date().toISOString() }).eq('id', id);
  await logActivity(id, 'owner_assigned', { actorAdminId, title: 'Owner assigned', meta: { owner_admin_id: ownerAdminId } });
  return getLead(id);
}

async function addTag(id, tag, actorAdminId) {
  const lead = await getLead(id);
  const t = String(tag).trim();
  const tags = Array.from(new Set([...(lead.tags || []), t])).filter(Boolean);
  await supabaseAdmin.from('leads').update({ tags, updated_at: new Date().toISOString() }).eq('id', id);
  // Keep the tag catalogue in sync (default colour); ignore duplicate.
  if (t) { const { error } = await supabaseAdmin.from('crm_tags').insert({ name: t, color: 'gray' }); void error; }
  await logActivity(id, 'tag_added', { actorAdminId, title: `Tag +${t}`, meta: { tag: t } });
  return getLead(id);
}

async function removeTag(id, tag, actorAdminId) {
  const lead = await getLead(id);
  const tags = (lead.tags || []).filter((t) => t !== tag);
  await supabaseAdmin.from('leads').update({ tags, updated_at: new Date().toISOString() }).eq('id', id);
  await logActivity(id, 'tag_removed', { actorAdminId, title: `Tag -${tag}`, meta: { tag } });
  return getLead(id);
}

async function setDnc(id, value, actorAdminId) {
  const patch = { do_not_contact: !!value, updated_at: new Date().toISOString() };
  if (value) patch.status = 'do_not_contact';
  await supabaseAdmin.from('leads').update(patch).eq('id', id);
  await logActivity(id, 'status_changed', { actorAdminId, title: value ? 'Marked Do Not Contact' : 'Cleared Do Not Contact', meta: { do_not_contact: !!value } });
  return getLead(id);
}

async function addNote(id, body, authorAdminId) {
  if (!body || !String(body).trim()) throw new Error('note body required');
  const { data } = await supabaseAdmin.from('lead_notes')
    .insert({ lead_id: id, author_admin_id: authorAdminId || null, body: String(body).trim() })
    .select('*').single();
  await logActivity(id, 'note_added', { actorAdminId: authorAdminId, title: 'Note added', body: String(body).trim(), meta: { note_id: data.id } });
  return data;
}

async function logCall(id, { outcome, durationMin, body } = {}, actorAdminId) {
  await logActivity(id, 'call_logged', {
    actorAdminId, title: `Call logged${outcome ? ` — ${outcome}` : ''}`,
    body: body || '', meta: { outcome: outcome || null, duration_min: durationMin || null },
  });
  return getLead(id);
}

// ── Dashboard / pipeline ──────────────────────────────────────
async function pipelineCounts() {
  const entries = await Promise.all(STATUSES.map(async (s) => {
    const { count } = await supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }).eq('status', s);
    return [s, count || 0];
  }));
  return Object.fromEntries(entries);
}

// Pure: honest conversion summary. A "paid customer" is a lead at `paid` status
// (revenue-backed / paying subscriber) — NOT `activated`, which is a free host
// who is merely active. Counting activated as paid overstated conversion ~4×.
function conversionSummary(counts = {}, total = 0) {
  // A paying customer is a lead in any MONEY state — Subscribed(paid) through
  // Champion. Relations is subscription-only, so there is no "active free" tier in
  // the pipeline any more (free hosts stay in Presale); activeFree kept at 0 for
  // response-shape stability.
  const paidCustomers = [...MONEY].reduce((a, s) => a + (counts[s] || 0), 0);
  const activeFree = 0;
  const conversionRate = total ? +((paidCustomers / total) * 100).toFixed(1) : 0;
  return { paidCustomers, activeFree, conversionRate };
}

async function dashboardStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const counts = await pipelineCounts();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  // Due-today = due in today's window but not yet overdue; overdue = past. Both
  // union follow-up tasks with the automation's next_action_at (see above).
  const [{ count: addedThisWeek }, { count: contactedToday }, todayIds, overdueIds, openVal] = await Promise.all([
    supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }).gte('last_contacted_at', dayStart),
    leadIdsWithFollowup('today'),
    leadIdsWithFollowup('overdue'),
    // Open pipeline value = expected value of leads not yet won/lost.
    supabaseAdmin.from('leads').select('expected_value_paise').gt('expected_value_paise', 0)
      .not('status', 'in', rules.CLOSED_SQL),
  ]);
  const overdueSet = new Set(overdueIds);
  const dueTodayOnly = todayIds.filter((id) => !overdueSet.has(id)).length;

  // Revenue from converted leads (few rows; sum in JS). revenue_paise is now
  // refund-aware (see attribution.computeRevenuePaise).
  const { data: conv } = await supabaseAdmin.from('leads').select('revenue_paise').not('converted_at', 'is', null);
  const revenuePaise = (conv || []).reduce((a, r) => a + (Number(r.revenue_paise) || 0), 0);
  const pipelineValuePaise = (openVal.data || []).reduce((a, r) => a + (Number(r.expected_value_paise) || 0), 0);

  const { paidCustomers, activeFree, conversionRate } = conversionSummary(counts, total);

  return {
    total, byStatus: counts, funnel: FUNNEL.map((s) => ({ status: s, count: counts[s] || 0 })),
    addedThisWeek: addedThisWeek || 0,
    contactedToday: contactedToday || 0,
    followUpsDueToday: dueTodayOnly,
    followUpsOverdue: overdueSet.size,
    paidCustomers, activeFree, conversionRate, revenuePaise, pipelineValuePaise,
  };
}

module.exports = {
  FUNNEL, STATUSES,
  upsertLead, safeUpsertLead, getLead, listLeads,
  changeStatus, assignOwner, addTag, removeTag, setDnc, addNote, logCall,
  pipelineCounts, dashboardStats, recordAccountEvent,
  recomputeFromAccount, loadAccountFacts,
  conversionSummary, followupWindow, leadIdsWithFollowup,
};

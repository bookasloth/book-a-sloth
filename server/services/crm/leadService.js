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

const FUNNEL = ['new', 'contacted', 'replied', 'qualified', 'demo_scheduled', 'trial', 'activated', 'paid'];
const STATUSES = [...FUNNEL, 'lost', 'do_not_contact'];
const CONVERTED = new Set(['activated', 'paid']);

const norm = (p) => normalizePhone(p) || null;
const lc = (e) => (e ? String(e).trim().toLowerCase() : null);

// ── Create / upsert ───────────────────────────────────────────
/**
 * Insert or merge a lead. Match order: normalized phone → email.
 * `patch` may include any lead column; blanks never clobber existing values.
 * @returns {{ lead, created }}
 */
async function upsertLead(patch = {}, { source, createdBy = '' } = {}) {
  const phone = norm(patch.phone);
  const email = lc(patch.email);

  let existing = null;
  if (phone) ({ data: existing } = await supabaseAdmin.from('leads').select('*').eq('phone', phone).maybeSingle());
  if (!existing && email) ({ data: existing } = await supabaseAdmin.from('leads').select('*').eq('email', email).maybeSingle());

  const clean = { ...patch };
  if (phone) clean.phone = phone; else delete clean.phone;
  if (email) clean.email = email; else delete clean.email;

  if (existing) {
    // Merge: only fill blanks / update explicitly provided non-empty values.
    const merged = {};
    for (const [k, v] of Object.entries(clean)) {
      if (v === undefined || v === null || v === '') continue;
      if (k === 'status' || k === 'owner_admin_id' || k === 'source') continue; // never regress pipeline on re-sync
      if (existing[k] === null || existing[k] === '' || existing[k] === undefined) merged[k] = v;
    }
    if (Object.keys(merged).length) {
      merged.updated_at = new Date().toISOString();
      await supabaseAdmin.from('leads').update(merged).eq('id', existing.id);
    }
    return { lead: { ...existing, ...merged }, created: false };
  }

  const row = {
    ...clean,
    source: source || clean.source || 'manual',
    created_by: createdBy,
  };
  const { data, error } = await supabaseAdmin.from('leads').insert(row).select('*').single();
  if (error) throw error;
  await logActivity(data.id, 'lead_created', { title: `Lead created (${row.source})`, meta: { source: row.source } });
  // Stitch any intent events that fired before this lead existed (best-effort).
  require('./intentEvents').attachToLead(data).catch(() => {});
  return { lead: data, created: true };
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
async function recordAccountEvent({ profileId, type, title, meta = {}, promoteToPaid = false, wonAt = null } = {}) {
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

    if (promoteToPaid && !['paid', 'lost', 'do_not_contact'].includes(lead.status)) {
      const patch = { status: 'paid', updated_at: new Date().toISOString() };
      if (!lead.converted_at) patch.converted_at = wonAt || new Date().toISOString();
      await supabaseAdmin.from('leads').update(patch).eq('id', lead.id);
      await logActivity(lead.id, 'status_changed', {
        title: 'Status → paid', meta: { from: lead.status, to: 'paid', via: type },
      });
    }
    return lead.id;
  } catch (e) {
    console.warn('[crm] recordAccountEvent failed:', e?.message || e);
    return null;
  }
}

// Lead ids that have an open follow-up in a given window ('overdue'|'today'|'open').
async function leadIdsWithFollowup(window) {
  let q = supabaseAdmin.from('lead_follow_ups').select('lead_id').eq('status', 'open');
  const now = new Date();
  if (window === 'overdue') q = q.lt('due_at', now.toISOString());
  else if (window === 'today') {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    q = q.lte('due_at', end);
  }
  const { data } = await q.limit(5000);
  return Array.from(new Set((data || []).map((r) => r.lead_id)));
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
async function changeStatus(id, status, actorAdminId) {
  if (!STATUSES.includes(status)) throw new Error(`invalid status: ${status}`);
  const before = await getLead(id);
  const patch = { status, updated_at: new Date().toISOString() };
  if (status === 'do_not_contact') patch.do_not_contact = true;
  if (CONVERTED.has(status) && before && !before.converted_at) patch.converted_at = new Date().toISOString();
  await supabaseAdmin.from('leads').update(patch).eq('id', id);
  await logActivity(id, 'status_changed', {
    actorAdminId, title: `Status → ${status}`,
    meta: { from: before?.status, to: status },
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

async function dashboardStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const counts = await pipelineCounts();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const [{ count: addedThisWeek }, { count: contactedToday }, { count: dueToday }, { count: overdue }] = await Promise.all([
    supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
    supabaseAdmin.from('leads').select('id', { count: 'exact', head: true }).gte('last_contacted_at', dayStart),
    supabaseAdmin.from('lead_follow_ups').select('id', { count: 'exact', head: true }).eq('status', 'open').gte('due_at', dayStart).lt('due_at', dayEnd),
    supabaseAdmin.from('lead_follow_ups').select('id', { count: 'exact', head: true }).eq('status', 'open').lt('due_at', now.toISOString()),
  ]);

  // Revenue from converted leads (few rows; sum in JS).
  const { data: conv } = await supabaseAdmin.from('leads').select('revenue_paise').not('converted_at', 'is', null);
  const revenuePaise = (conv || []).reduce((a, r) => a + (Number(r.revenue_paise) || 0), 0);

  // Open pipeline value = expected value of leads not yet won/lost.
  const { data: openVal } = await supabaseAdmin.from('leads')
    .select('expected_value_paise').gt('expected_value_paise', 0)
    .not('status', 'in', '(paid,lost,do_not_contact)');
  const pipelineValuePaise = (openVal || []).reduce((a, r) => a + (Number(r.expected_value_paise) || 0), 0);

  const paidCustomers = (counts.paid || 0) + (counts.activated || 0);
  const conversionRate = total ? +(paidCustomers / total * 100).toFixed(1) : 0;

  return {
    total, byStatus: counts, funnel: FUNNEL.map((s) => ({ status: s, count: counts[s] || 0 })),
    addedThisWeek: addedThisWeek || 0,
    contactedToday: contactedToday || 0,
    followUpsDueToday: dueToday || 0,
    followUpsOverdue: overdue || 0,
    paidCustomers, conversionRate, revenuePaise, pipelineValuePaise,
  };
}

module.exports = {
  FUNNEL, STATUSES,
  upsertLead, safeUpsertLead, getLead, listLeads,
  changeStatus, assignOwner, addTag, removeTag, setDnc, addNote, logCall,
  pipelineCounts, dashboardStats, recordAccountEvent,
};

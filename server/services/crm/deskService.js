'use strict';
/**
 * deskService.js — the five Sales Desk queues.
 *
 * Each queue is a deterministic read over existing lead data (+ the score/intent
 * from v3.112 and last_reply_at from v3.113). No writes. The column-vs-column
 * comparisons Postgres/supabase-js can't express as filters (e.g. last_reply_at >
 * last_contacted_at) are refined in JS over a bounded candidate set — the pure
 * predicates/merge below are unit-tested; the query wrappers are thin.
 *
 * Reads the state the lifecycle engine (P0-4) writes; it never recomputes.
 */
const { supabaseAdmin } = require('../../config/supabase');

const OPEN_EXCLUDE = ['lost', 'do_not_contact', 'paid'];
const CANDIDATE_CAP = 200;   // upper bound scanned per queue; count is "N" or "N+" at the cap
const DEFAULT_LIMIT = 25;

// ── pure helpers (unit-tested) ───────────────────────────────────────────────

/** A reply came in after our last outbound (or with no outbound yet). */
function isUnansweredReply(lead) {
  if (!lead || !lead.last_reply_at) return false;
  const since = lead.last_contacted_at || lead.created_at;
  return !since || new Date(lead.last_reply_at) > new Date(since);
}

/** Activation reason for a linked lead, or null if not an activation case. */
function activationReason(onboarded, hasBooking) {
  if (onboarded === undefined) return null;      // profile not found → skip
  if (onboarded && !hasBooking) return 'Live — no booking yet';
  if (!onboarded) return 'Signed up — not activated';
  return null;                                    // onboarded AND booked → done
}

/**
 * Merge queue contributors into a deduped, order-preserving list, collecting the
 * reasons a lead qualifies. `entries` = [{ lead, reason }] in priority order.
 * @returns [{ ...lead, _reasons: string[] }]
 */
function mergeById(entries) {
  const byId = new Map();
  for (const { lead, reason } of entries) {
    if (!lead) continue;
    const seen = byId.get(lead.id);
    if (seen) { if (reason && !seen._reasons.includes(reason)) seen._reasons.push(reason); }
    else byId.set(lead.id, { ...lead, _reasons: reason ? [reason] : [] });
  }
  return [...byId.values()];
}

const FIELDS = ['id', 'name', 'business_name', 'status', 'score', 'intent', 'next_action',
  'owner_admin_id', 'last_contacted_at', 'last_reply_at', 'expected_value_paise'];

function shape(lead, reasons) {
  const out = {};
  for (const f of FIELDS) out[f] = lead[f] ?? null;
  out.reasons = reasons || lead._reasons || [];
  return out;
}

/** { count, leads } from a refined row set + a reason function. */
function pack(rows, limit, reasonFor) {
  return {
    count: rows.length,
    leads: rows.slice(0, limit).map((l) => shape(l, reasonFor ? reasonFor(l) : l._reasons)),
  };
}

// ── query wrappers (thin) ────────────────────────────────────────────────────

const openBase = () =>
  supabaseAdmin.from('leads').select('*').not('status', 'in', `(${OPEN_EXCLUDE.join(',')})`);

function endOfTodayIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
}

async function replies(limit) {
  const { data } = await openBase()
    .not('last_reply_at', 'is', null)
    .order('last_reply_at', { ascending: true }).limit(CANDIDATE_CAP);
  const rows = (data || []).filter(isUnansweredReply);
  return pack(rows, limit, () => ['Replied — unanswered']);
}

async function highIntent(limit) {
  const { data } = await supabaseAdmin.from('leads').select('*')
    .eq('intent', 'high').is('owner_admin_id', null)
    .in('status', ['new', 'contacted', 'replied', 'qualified'])
    .order('score', { ascending: false }).limit(CANDIDATE_CAP);
  return pack(data || [], limit, (l) => [`High intent (score ${l.score ?? 0})`]);
}

async function followupsDue(limit) {
  const end = endOfTodayIso();
  // Union both mechanisms: explicit follow-up tasks AND the automation's
  // next_action_at (which carries the real signal — the task table is near-empty).
  const [{ data: fus }, { data: naLeads }] = await Promise.all([
    supabaseAdmin.from('lead_follow_ups')
      .select('lead_id, due_at, title').eq('status', 'open')
      .lte('due_at', end).order('due_at', { ascending: true }).limit(CANDIDATE_CAP),
    openBase().not('next_action_at', 'is', null)
      .lte('next_action_at', end).order('next_action_at', { ascending: true }).limit(CANDIDATE_CAP),
  ]);
  const title = new Map(); const taskIds = [];
  for (const f of fus || []) if (!title.has(f.lead_id)) { title.set(f.lead_id, f.title); taskIds.push(f.lead_id); }
  let taskLeads = [];
  if (taskIds.length) {
    const { data } = await openBase().in('id', taskIds);        // drop non-open leads
    const byId = new Map((data || []).map((l) => [l.id, l]));
    taskLeads = taskIds.map((id) => byId.get(id)).filter(Boolean);
  }
  // Tasks first (they carry an explicit title), then next_action leads; dedup.
  const entries = [
    ...taskLeads.map((l) => ({ lead: l, reason: `Follow-up due: ${(title.get(l.id) || '').trim()}`.trim() })),
    ...(naLeads || []).map((l) => ({ lead: l, reason: `Next: ${(l.next_action || 'follow up').trim()}` })),
  ];
  return pack(mergeById(entries), limit);
}

// Linked-account state for a set of leads: onboarding + has-paid-booking.
async function accountCtx(profileIds) {
  const ids = [...new Set(profileIds.filter(Boolean))];
  const onboarded = new Map(); const hasBooking = new Set();
  if (!ids.length) return { onboarded, hasBooking };
  const { data: profs } = await supabaseAdmin.from('profiles').select('id, onboarding_completed').in('id', ids);
  const { data: booked } = await supabaseAdmin.from('bookings').select('host_id').eq('payment_status', 'paid').in('host_id', ids);
  for (const p of profs || []) onboarded.set(p.id, !!p.onboarding_completed);
  for (const b of booked || []) hasBooking.add(b.host_id);
  return { onboarded, hasBooking };
}

async function activation(limit) {
  const { data: cands } = await openBase().not('profile_id', 'is', null).limit(CANDIDATE_CAP);
  if (!cands?.length) return { count: 0, leads: [] };
  const { onboarded, hasBooking } = await accountCtx(cands.map((l) => l.profile_id));
  const rows = [];
  for (const l of cands) {
    const reason = activationReason(onboarded.get(l.profile_id), hasBooking.has(l.profile_id));
    if (reason) rows.push({ ...l, _reasons: [reason] });
  }
  return pack(rows, limit);
}

async function needsAttention(limit) {
  const nowIso = new Date().toISOString();
  const weekAgoIso = new Date(Date.now() - 7 * 864e5).toISOString();

  // 1. unanswered replies
  const { data: repCand } = await openBase()
    .not('last_reply_at', 'is', null).order('last_reply_at', { ascending: true }).limit(CANDIDATE_CAP);
  const replyRows = (repCand || []).filter(isUnansweredReply).map((l) => ({ lead: l, reason: 'Replied — unanswered' }));

  // 2. overdue follow-ups — union tasks with a past next_action_at.
  const [{ data: ovf }, { data: ovNa }] = await Promise.all([
    supabaseAdmin.from('lead_follow_ups').select('lead_id').eq('status', 'open').lt('due_at', nowIso).limit(CANDIDATE_CAP),
    openBase().not('next_action_at', 'is', null).lt('next_action_at', nowIso).limit(CANDIDATE_CAP),
  ]);
  const ovTaskIds = [...new Set((ovf || []).map((f) => f.lead_id))];
  const overdueRows = [];
  if (ovTaskIds.length) {
    const { data: ovLeads } = await openBase().in('id', ovTaskIds);
    for (const l of ovLeads || []) overdueRows.push({ lead: l, reason: 'Follow-up overdue' });
  }
  for (const l of ovNa || []) overdueRows.push({ lead: l, reason: 'Follow-up overdue' });

  // 3. high-value, gone quiet 7+ days
  const { data: hv } = await openBase()
    .gt('expected_value_paise', 0).lt('last_activity_at', weekAgoIso).limit(CANDIDATE_CAP);
  const hvRows = (hv || []).map((l) => ({ lead: l, reason: 'High value — no touch 7d' }));

  // Priority order: overdue first, then replies, then stale value.
  const merged = mergeById([...overdueRows, ...replyRows, ...hvRows]);
  return pack(merged, limit);
}

/** All five queues. */
async function getDesk(limit = DEFAULT_LIMIT) {
  const [needs_attention, repliesQ, followups, high_intent, activationQ] = await Promise.all([
    needsAttention(limit), replies(limit), followupsDue(limit), highIntent(limit), activation(limit),
  ]);
  return { needs_attention, replies: repliesQ, followups, high_intent, activation: activationQ };
}

module.exports = { getDesk, isUnansweredReply, activationReason, mergeById, shape };

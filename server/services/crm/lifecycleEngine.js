'use strict';
/**
 * lifecycleEngine.js — the one deterministic engine that moves leads.
 *
 * Every 15 min it reads the still-open leads, (re)computes the persisted score +
 * intent, advances status by fixed rules, records the recommended next action,
 * and — best-effort — enrolls the right nurture sequence / opens a sales task on
 * a high-intent lead. No AI: `decide()` is a pure function of the lead + its
 * linked account state, unit-tested in isolation.
 *
 * SAFE WITH SENDS OFF: it only writes lead state and enqueues/enrolls. Actual
 * delivery still passes the `crm_admin_sends` kill-switch (default OFF) in
 * messageService/sendGate, so nothing leaves the building until that flip (P0-5).
 *
 * Schema fallback: the score/intent/next_action columns (migration v3.112) may
 * not exist yet on a given DB. The first "column missing" error flips
 * `scoringColumns=false` and the engine simply stops writing those columns —
 * status progression (pre-existing columns) keeps working.
 */
const { supabaseAdmin } = require('../../config/supabase');
const leadScore = require('./leadScore');
const leadService = require('./leadService');
const sequenceService = require('./sequenceService');
const followUpService = require('./followUpService');

const BATCH = Number(process.env.LIFECYCLE_ENGINE_BATCH) || 500;
const DRYRUN = process.env.LIFECYCLE_ENGINE_DRYRUN === 'true';
const OPEN_EXCLUDE = ['lost', 'do_not_contact', 'paid'];
const STALE_SIGNUP_DAYS = 3;   // signed up but onboarding not finished this long → nurture
const INACTIVE_DAYS = 30;      // no activity this long, never converted → win-back

// Named sequences the engine enrolls into (created separately; enroll no-ops if
// a name is absent/inactive so the engine never hard-depends on seeded content).
const SEQ = {
  NEW_LEAD: 'New Lead nurture',
  NOT_ACTIVATED: 'Signed-up-not-activated',
  NO_BOOKING: 'Activated-no-booking',
  WINBACK: 'Win-back',
};

let scoringColumns = true; // flipped false on first "column missing" error

const daysSince = (iso, now) => (iso ? (now - new Date(iso).getTime()) / 864e5 : Infinity);
const engagedSinceContact = (lead) =>
  !!lead.last_engaged_at &&
  (!lead.last_contacted_at || new Date(lead.last_engaged_at) > new Date(lead.last_contacted_at));

/**
 * PURE decision for one lead. No I/O.
 * @param {object} lead                 a leads row
 * @param {object} ctx                  { onboardingComplete, hasBooking } from the linked profile (all false if unlinked)
 * @param {number} now                  epoch ms
 * @returns {{ score, intent, status, changed, nextAction, enroll }}
 *   status  = desired status (may equal current); changed = did it move
 *   enroll  = a SEQ.* name to enroll into, or null
 */
function decide(lead, ctx = {}, now = Date.now()) {
  if (!lead) return { score: 0, intent: 'low', status: null, changed: false, nextAction: 'Nurturing', enroll: null };
  const { score } = leadScore.compute(lead, now);
  const intent = leadScore.intentOf(lead, score);
  const cur = lead.status;
  const { onboardingComplete = false, hasBooking = false } = ctx;

  let status = cur;
  // 1. Lifecycle handoff: a linked host who finished onboarding but has no paid
  //    booking is out of acquisition and into activation.
  if (onboardingComplete && !hasBooking && !['activated', 'paid'].includes(cur)) status = 'activated';
  // 2. High intent → qualify for a human.
  else if (intent === 'high' && ['new', 'contacted', 'replied'].includes(cur)) status = 'qualified';
  // 3. Engaged since we last reached out → they responded.
  else if (engagedSinceContact(lead) && ['new', 'contacted'].includes(cur)) status = 'replied';
  // 4. We've contacted a brand-new lead → mark contacted.
  else if (cur === 'new' && lead.last_contacted_at) status = 'contacted';

  // Next action + which sequence (if any) to enroll. Order matters: the
  // lifecycle/activation handoff outranks the acquisition "human contact" cue.
  let nextAction = 'Nurturing';
  let enroll = null;
  if (status === 'activated') {
    if (!hasBooking) { nextAction = 'Enroll: Activated-no-booking'; enroll = SEQ.NO_BOOKING; }
  } else if (status === 'qualified' || status === 'replied' || intent === 'high') {
    nextAction = 'Human contact';
  } else if (lead.profile_id && !onboardingComplete && daysSince(lead.created_at, now) >= STALE_SIGNUP_DAYS) {
    nextAction = 'Enroll: Signed-up-not-activated';
    enroll = SEQ.NOT_ACTIVATED;
  } else if (cur === 'new' && !lead.last_contacted_at) {
    nextAction = 'Enroll: New Lead nurture';
    enroll = SEQ.NEW_LEAD;
  } else if (lead.last_activity_at && daysSince(lead.last_activity_at, now) >= INACTIVE_DAYS && !lead.converted_at) {
    nextAction = 'Enroll: Win-back';
    enroll = SEQ.WINBACK;
  }

  return { score, intent, status, changed: status !== cur, nextAction, enroll };
}

// ── I/O helpers ──────────────────────────────────────────────────────────────

async function loadOpenLeads() {
  const { data } = await supabaseAdmin.from('leads').select('*')
    .not('status', 'in', `(${OPEN_EXCLUDE.join(',')})`)
    .order('updated_at', { ascending: true }).limit(BATCH);
  return data || [];
}

// One batched read of linked-account state: onboarding_completed + has-any-paid-booking.
async function loadAccountCtx(leads) {
  const ids = [...new Set(leads.map((l) => l.profile_id).filter(Boolean))];
  const ctx = new Map();
  if (!ids.length) return ctx;
  const { data: profiles } = await supabaseAdmin.from('profiles')
    .select('id, onboarding_completed').in('id', ids);
  const { data: booked } = await supabaseAdmin.from('bookings')
    .select('host_id').eq('payment_status', 'paid').in('host_id', ids);
  const hasBooking = new Set((booked || []).map((b) => b.host_id));
  for (const p of profiles || []) {
    ctx.set(p.id, { onboardingComplete: !!p.onboarding_completed, hasBooking: hasBooking.has(p.id) });
  }
  return ctx;
}

// Active sequence id by name, cached per run. null if absent/inactive.
function seqResolver() {
  const cache = new Map();
  return async (name) => {
    if (!name) return null;
    if (cache.has(name)) return cache.get(name);
    const { data } = await supabaseAdmin.from('crm_sequences')
      .select('id').eq('name', name).eq('is_active', true).maybeSingle();
    const id = data?.id || null;
    cache.set(name, id);
    return id;
  };
}

// One open lifecycle-created sales task per lead — never pile them up.
async function hasOpenLifecycleTask(leadId) {
  const { data } = await supabaseAdmin.from('lead_follow_ups')
    .select('id').eq('lead_id', leadId).eq('status', 'open').eq('created_by', 'lifecycle').limit(1);
  return !!(data && data.length);
}

async function writeScoring(lead, d) {
  if (!scoringColumns) return;
  const { error } = await supabaseAdmin.from('leads')
    .update({ score: d.score, intent: d.intent, next_action: d.nextAction, next_action_at: new Date().toISOString() })
    .eq('id', lead.id);
  if (error && /column .* does not exist|Could not find/i.test(error.message || '')) {
    scoringColumns = false;
    console.warn('[crm] lifecycle: scoring columns missing (run v3.112) — skipping score writeback');
  }
}

/** Cron tick. Leader-elected by the caller. */
async function run() {
  const now = Date.now();
  const leads = await loadOpenLeads();
  if (!leads.length) return { scanned: 0, moved: 0, enrolled: 0, tasks: 0, dryRun: DRYRUN };
  const ctxMap = await loadAccountCtx(leads);
  const resolveSeq = seqResolver();

  let moved = 0, enrolled = 0, tasks = 0;
  for (const lead of leads) {
    try {
      const d = decide(lead, ctxMap.get(lead.profile_id) || {}, now);

      if (DRYRUN) {
        if (d.changed || d.enroll) console.log(`[dryrun] lead ${lead.id}: ${lead.status}->${d.status} score=${d.score} intent=${d.intent} next="${d.nextAction}" enroll=${d.enroll || '-'}`);
        continue;
      }

      await writeScoring(lead, d);

      if (d.changed) { await leadService.changeStatus(lead.id, d.status, null); moved++; }

      // High-intent → a human task (deduped to one open lifecycle task per lead).
      if (d.status === 'qualified' && !(await hasOpenLifecycleTask(lead.id))) {
        await followUpService.create({
          leadId: lead.id, ownerAdminId: lead.owner_admin_id || null,
          title: `New opportunity: ${lead.business_name || lead.name || 'lead'} (${d.intent} intent, score ${d.score})`,
          dueAt: new Date(now).toISOString(), remind: true, createdBy: 'lifecycle',
        });
        tasks++;
      }

      // Best-effort enroll — no-op if the named sequence is absent/inactive/empty.
      if (d.enroll) {
        const seqId = await resolveSeq(d.enroll);
        if (seqId) {
          try { await sequenceService.enroll(seqId, lead.id, 'lifecycle'); enrolled++; }
          catch (e) { /* e.g. sequence has no steps — skip */ }
        }
      }
    } catch (err) {
      console.error(`[crm] lifecycle: lead ${lead.id} failed:`, err.message);
    }
  }
  return { scanned: leads.length, moved, enrolled, tasks, dryRun: DRYRUN };
}

module.exports = { run, decide, SEQ };

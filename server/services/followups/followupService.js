/**
 * followupService.js — schedule + fire generic post-event follow-ups.
 *
 * scheduleFollowups: called from the shared markBookingCompleted (both the manual
 * and the auto-complete paths). Best-effort — never throws, never blocks completion.
 * processFollowups (Task 4): the leader-elected cron that fires due rows.
 */
const { supabaseAdmin } = require('../../config/supabase');
const featureFlags = require('../featureFlags');
const planService = require('../planService');
const { getFlow, entitledSteps } = require('./flowRegistry');

const DAY = 24 * 60 * 60 * 1000;

const scheduleFollowups = async ({ sourceType, sourceId, hostId, entity, completedAt, flowKey = 'rebook' }) => {
  try {
    if (!(await featureFlags.isFeatureEnabled('rebook_nudge'))) return { scheduled: 0, reason: 'flag_off' };
    const flow = getFlow(flowKey);
    if (!flow) return { scheduled: 0, reason: 'no_flow' };

    // Host plan → entitlement. The completion join doesn't carry plan columns,
    // so fetch them here (keeps this service self-contained / vertical-agnostic).
    const { data: hostRow } = await supabaseAdmin
      .from('profiles').select('plan, plan_expires_at').eq('id', hostId).maybeSingle();
    const slug = planService.resolveVendorPlan(hostRow || {});
    const n = await planService.getLimit(slug, 'followup_flows');
    const steps = entitledSteps(flow, n);
    if (!steps.length) return { scheduled: 0, reason: 'not_entitled' };

    const base = new Date(completedAt).getTime();
    const payload = flow.buildPayload(entity);
    const rows = steps.map((s) => ({
      source_type: sourceType,
      source_id: sourceId,
      host_id: hostId,
      recipient_user_id: entity.guest_id || null,
      flow_key: flow.flow_key,
      step: s.step,
      audience: flow.audience,
      event_key: flow.event,
      due_at: new Date(base + s.offsetDays * DAY).toISOString(),
      status: 'pending',
      payload,
    }));

    const { error } = await supabaseAdmin
      .from('scheduled_followups')
      .upsert(rows, { onConflict: 'source_type,source_id,flow_key,step', ignoreDuplicates: true });
    if (error) { console.error('scheduleFollowups upsert error:', error.message); return { scheduled: 0, reason: 'db_error' }; }
    return { scheduled: rows.length };
  } catch (e) {
    console.error('scheduleFollowups error:', e.message);
    return { scheduled: 0, reason: 'error' };
  }
};

module.exports = { scheduleFollowups };

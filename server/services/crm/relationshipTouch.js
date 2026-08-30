'use strict';
/**
 * relationshipTouch.js — turn a lead's health + account signals into a relationship
 * TOUCH RECOMMENDATION (relationship engine PR-3). Pure + deterministic, no I/O.
 *
 * Speaks in relationship moments — first success, cooling, at-risk, dormant — not
 * sales stages, and recommends WHO should reach out, WHY, VIA WHICH channel, and
 * whether it should be automated / recommended-to-a-human / human-only. It does NOT
 * send anything; touchRecommendationService persists the result and the Desk (PR-5)
 * surfaces it. The engine already owns the acquisition/nurture "next_action"; this is
 * the additive relationship layer on top.
 *
 * Scope (PR-3): the relationship moments that have NO existing automation. Onboarding
 * stalls are already handled by the engine's nurture sequences (not duplicated here);
 * anniversary / milestone touches arrive in PR-6.
 *
 * Returns the single most relevant touch for the lead this tick (an array of 0 or 1),
 * so the Desk stays a short, high-signal queue rather than a wall of nudges.
 */

const DAY = 864e5;
const daysSince = (iso, now) => (iso ? Math.floor((now - new Date(iso).getTime()) / DAY) : null);

function recommendationsFor(lead, health, ctx = {}, now = Date.now()) {
  if (!lead || !health) return [];
  const state = health.state;
  const dMean = daysSince(lead.last_meaningful_interaction_at, now);
  // High-value = the same ROI signal the lifecycle uses for the Sloth gate, or a
  // paying host who has already earned back ≥2× their plan cost.
  const highValue = !!ctx.meetsSloth
    || ((Number(ctx.earningsPaise) || 0) > 0
        && (Number(ctx.planPricePaise) || 0) > 0
        && Number(ctx.earningsPaise) >= 2 * Number(ctx.planPricePaise));

  const mk = (o) => [{
    subject_type: 'lead',
    lead_id: lead.id,
    reason: o.reason,
    touch_type: o.touch,
    priority: o.priority,
    suggested_channel: o.channel,
    suggested_sender: o.sender || 'owner',
    mode: o.mode,
    explanation: o.explanation,
    dedupe_key: `lead:${lead.id}:${o.reason}`,
  }];

  // Priority order — most urgent relationship moment wins.
  if (state === 'at_risk') {
    return mk({
      reason: 'at_risk', touch: 'winback', priority: 'high', channel: 'whatsapp',
      sender: highValue ? 'founder' : 'owner',
      mode: highValue ? 'human' : 'recommend',   // a valued at-risk customer is never an automated blast
      explanation: `Relationship at risk${dMean != null ? ` — no meaningful contact in ${dMean}d` : ''}.`,
    });
  }
  if (lead.status === 'won') {
    return mk({
      reason: 'first_success', touch: 'appreciation', priority: 'high', channel: 'whatsapp',
      mode: 'recommend',
      explanation: 'Landed their first paid booking — a personal congratulations lands well here.',
    });
  }
  if (state === 'cooling') {
    return mk({
      reason: 'cooling', touch: 'check_in', priority: 'medium', channel: 'email',
      mode: 'recommend',
      explanation: `Cooling${dMean != null ? ` — last meaningful contact ${dMean}d ago` : ''}. A light check-in re-warms it.`,
    });
  }
  // Only win back dormant leads who were once real customers — never nag a
  // never-activated dead lead.
  if (state === 'dormant' && ctx.hasBooking) {
    return mk({
      reason: 'dormant', touch: 'winback', priority: 'low', channel: 'email',
      mode: 'recommend',
      explanation: 'Gone quiet after being an active customer — worth one win-back.',
    });
  }
  return [];
}

module.exports = { recommendationsFor };

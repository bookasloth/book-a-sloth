'use strict';
/**
 * touchGovernor.js — the ONE master cap across every automated touch (PR-7).
 *
 * The MVP left the cap fragmented: sendGate throttled CRM sends (1 / 48h over
 * crm_messages), touchRecommendationService cooled the SAME reason for 14 days, and
 * birthdayGreetings sent straight through NotificationEngine with no cap at all. So a
 * single person could receive a cooling nudge, a birthday email and a milestone touch
 * in the same window — each "allowed" in isolation, spam together.
 *
 * The governor unifies them: one per-subject ceiling of N automated touches per
 * rolling window, counted from the durable ledger every automated touch already
 * writes — lead_activities automated rows (is_meaningful=false CONTACT types), which
 * activity.logActivity stamps and which also bumps leads.last_automated_touch_at.
 * sendGate delegates its cap here; birthday and any other NotificationEngine-direct
 * automated path call canTouch() before sending and recordTouch() after.
 *
 * SPLIT DESIGN:
 *   - withinCap(): PURE, source-agnostic, fully unit-tested — the decision.
 *   - canTouch()/recordTouch(): the DB adapter that gathers a subject's timestamps
 *     and records a touch. FAIL-OPEN on read error (an outage must never silently
 *     freeze legitimate sends), best-effort on write (never throws).
 *
 * Config (env-tunable; shipped defaults match sendGate's existing 1 / 48h ceiling so
 * the governor is not a behaviour change for CRM sends, only an extension to the rest):
 *   CRM_TOUCH_CAP       (default 1)   max automated touches per window per subject
 *   CRM_TOUCH_WINDOW_H  (default 48)  the rolling window, in hours
 */

const posInt = (v, dflt) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : dflt;
};

const CAP = posInt(process.env.CRM_TOUCH_CAP, 1);
const WINDOW_H = posInt(process.env.CRM_TOUCH_WINDOW_H, 48);
const WINDOW_MS = WINDOW_H * 3600e3;

/**
 * PURE decision. Given automated-touch timestamps for a subject, is another allowed?
 * @param {(string|null|undefined)[]} timestamps  ISO strings (any order; blanks ignored)
 * @param {number} now  epoch ms
 * @param {{cap?:number, windowMs?:number}} [o]  overrides (defaults = shipped config)
 * @returns {{ok:boolean, count:number, reason?:'frequency_capped'}}
 *   count = touches inside the window; ok=false once count >= cap.
 */
function withinCap(timestamps, now = Date.now(), o = {}) {
  const cap = o.cap != null ? o.cap : CAP;
  const windowMs = o.windowMs != null ? o.windowMs : WINDOW_MS;
  const cutoff = now - windowMs;
  let count = 0;
  for (const t of timestamps || []) {
    if (!t) continue;
    const ms = new Date(t).getTime();
    if (Number.isFinite(ms) && ms > cutoff) count += 1;
  }
  return count >= cap ? { ok: false, count, reason: 'frequency_capped' } : { ok: true, count };
}

module.exports = { withinCap, CAP, WINDOW_H, WINDOW_MS };

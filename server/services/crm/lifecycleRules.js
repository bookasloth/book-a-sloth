'use strict';
/**
 * lifecycleRules.js — the ONE pure source of truth for the CRM lead lifecycle.
 *
 * The lead pipeline is projected into four team-owned boards over a single
 * `leads.status`. This module owns, with zero I/O so it is exhaustively unit-
 * testable, three things every caller must agree on:
 *
 *   1. the state set + which board owns each state + their order (RANK),
 *   2. `resolveAccountStatus` — the most-advanced status a lead's linked account
 *      *earns* from verifiable facts (payment, onboarding, first booking, the
 *      Sloth ROI gate, renewals, referrals, enterprise). Both the 15-min engine
 *      and the real-time hooks call this so they can never disagree, and
 *   3. `manualTransition` — whether a human's drag is allowed and whether it must
 *      carry a reason (backward moves and exits do).
 *
 * DB keys kept, UI relabels (see client salesConstants): `paid`→"Subscribed",
 * `activated`→"Onboarded", `replied`→"Responded". We ADD the downstream states
 * (won…champion) + structured exits rather than renaming the two live money keys,
 * so nothing that reads booking/subscription `'paid'`/`'activated'` is disturbed.
 *
 * Design invariants (asserted in the tests):
 *  - a TERMINAL / do_not_contact lead is never auto-resurrected,
 *  - an UNPAID host never leaves Presale via account facts (Relations is paid-only),
 *  - a MONEY state is never auto-regressed (only churn/manual can pull it back),
 *  - Marketing states are gated behind the Sloth milestone (strict funnel).
 */

// ── Boards (order matters — index within a board is its column order) ──────────
const PRESALE   = ['new', 'contacted', 'replied', 'qualified', 'demo'];
const RELATIONS = ['paid', 'activated', 'won', 'sloth'];        // Subscribed · Onboarded · Won · The Sloth
const MARKETING = ['sloth', 'retained', 'ambassador', 'enterprised', 'champion']; // sloth = shared handoff column
const EXIT      = ['not_reachable', 'not_interested', 'disqualified', 'lost', 'churned'];
const DNC       = 'do_not_contact';                             // orthogonal send-gate, not a board column

const STATUSES = [
  ...PRESALE,
  ...RELATIONS.filter((s) => s !== 'sloth'), 'sloth',           // sloth once
  ...MARKETING.filter((s) => s !== 'sloth'),
  ...EXIT, DNC,
];

// Board a status is *owned* by (sloth hands off to marketing the moment it's set).
const PIPELINE_OF = {};
for (const s of PRESALE) PIPELINE_OF[s] = 'presale';
for (const s of ['paid', 'activated', 'won']) PIPELINE_OF[s] = 'relations';
for (const s of ['sloth', 'retained', 'ambassador', 'enterprised', 'champion']) PIPELINE_OF[s] = 'marketing';
for (const s of EXIT) PIPELINE_OF[s] = 'exit';
PIPELINE_OF[DNC] = 'exit';

// Columns each board renders (Relations shows sloth as its read-only handoff tail).
const BOARD_COLUMNS = { presale: PRESALE, relations: RELATIONS, marketing: MARKETING, exit: EXIT };

// Advancement order. Higher = further along. Terminals + dnc = 0 (off the funnel).
const RANK = {
  new: 1, contacted: 2, replied: 3, qualified: 4, demo: 5,
  paid: 6, activated: 7, won: 8, sloth: 9,
  retained: 10, ambassador: 11, enterprised: 12, champion: 13,
};
for (const s of EXIT) RANK[s] = 0;
RANK[DNC] = 0;

// A lead that has produced revenue / is a paying customer. Never auto-regressed;
// a manual move out of one requires a reason. converted_at is stamped on entry.
const MONEY = new Set(['paid', 'activated', 'won', 'sloth', 'retained', 'ambassador', 'enterprised', 'champion']);
const CONVERTED = MONEY;                                  // alias: entering any stamps converted_at
const TERMINAL = new Set(EXIT);                           // lost · churned · not_reachable · not_interested · disqualified
const NO_AUTO = new Set([...TERMINAL, DNC]);              // auto never moves a lead OUT of these

// "Closed" leads — converted past sales/relations follow-up, or exited — excluded
// from open-pipeline value, follow-up queues, and the Sales Desk. `activated`
// (Onboarded) stays OPEN: Relations is still actively working it toward Won.
const CLOSED = [...MONEY, ...TERMINAL, DNC].filter((s) => s !== 'activated');
const CLOSED_SQL = `(${CLOSED.join(',')})`;              // for supabase `.not('status','in', …)`

// The reporting funnel spine (acquisition → success). Marketing/exit are excluded
// from step-retention — they are post-conversion / terminal, not funnel steps.
const FUNNEL = ['new', 'contacted', 'replied', 'qualified', 'demo', 'paid', 'activated', 'won', 'sloth'];

const rankOf = (s) => (RANK[s] == null ? -1 : RANK[s]);
const higher = (a, b) => (rankOf(a) >= rankOf(b) ? a : b);
const pipelineOf = (status) => PIPELINE_OF[status] || 'exit';

/**
 * The Sloth ROI gate: the host has earned, on-platform, at least 2× what their
 * plan costs over its tenure AND is still active (≥5 paid bookings in 30d).
 * @param {object} ctx
 * @returns {boolean}
 */
function meetsSlothGate(ctx = {}) {
  const earnings = Number(ctx.earningsPaise) || 0;
  const planPrice = Number(ctx.planPricePaise) || 0;
  const last30 = Number(ctx.bookingsLast30d) || 0;
  return !!ctx.hasBooking && planPrice > 0 && earnings >= 2 * planPrice && last30 >= 5;
}

/**
 * PURE. The most-advanced status the lead's linked account has *earned* from
 * verifiable facts, given its current status. Returns `current` unchanged when no
 * account-driven advance applies (acquisition moves — contacted/qualified — are
 * the engine's job, not this function's).
 *
 * @param {string} current  the lead's current status
 * @param {object} ctx
 *   @param {boolean} ctx.isPaid              host has an active/paid subscription
 *   @param {boolean} ctx.onboardingComplete  profile live (photo+service+availability)
 *   @param {boolean} ctx.hasBooking          ≥1 paid booking ever
 *   @param {number}  ctx.bookingsLast30d     paid bookings in the last 30 days
 *   @param {number}  ctx.earningsPaise       on-platform earnings since plan start
 *   @param {number}  ctx.planPricePaise      the host's plan price (tenure cost)
 *   @param {number}  ctx.renewals            subscription renewals (≥1 ⇒ Retained-eligible)
 *   @param {number}  ctx.referralsQualified  qualified/rewarded referrals made
 *   @param {boolean} ctx.isEnterprise        on an Enterprise plan
 * @returns {string} the resolved status (may equal `current`)
 */
function resolveAccountStatus(current, ctx = {}) {
  if (NO_AUTO.has(current)) return current;                 // never resurrect a terminal / dnc lead
  if (!ctx.isPaid) return current;                          // O-1: unpaid hosts stay in Presale

  let target = 'paid';                                      // Subscribed
  if (ctx.onboardingComplete) target = 'activated';         // Onboarded
  if (ctx.hasBooking) target = 'won';                       // Won (first paid booking)

  if (meetsSlothGate(ctx)) {
    target = 'sloth';                                        // Marketing gated behind the Sloth milestone
    if (Number(ctx.renewals) >= 1) target = higher(target, 'retained');
    if (Number(ctx.referralsQualified) >= 1) target = higher(target, 'ambassador');
    if (Number(ctx.referralsQualified) >= 3) target = higher(target, 'champion');
    if (ctx.isEnterprise) target = higher(target, 'enterprised');
  }

  // Most-advanced-wins: never auto-regress a money state below where it already is.
  if (MONEY.has(current) && rankOf(target) < rankOf(current)) return current;
  return rankOf(target) >= rankOf(current) ? target : current;
}

/**
 * PURE. Whether a human may move a lead from → to, and whether that move must
 * carry a reason. Forward moves are frictionless; backward moves and exits
 * (lost/churned/…/do_not_contact) require a reason so the timeline records *why*.
 *
 * @param {string} from
 * @param {string} to
 * @returns {{ allowed:boolean, needsReason:boolean, reason?:string }}
 */
function manualTransition(from, to) {
  if (!STATUSES.includes(to)) return { allowed: false, needsReason: false, reason: `invalid status: ${to}` };
  if (from === to) return { allowed: true, needsReason: false };
  const backward = rankOf(to) < rankOf(from);
  const isExit = TERMINAL.has(to) || to === DNC;
  return { allowed: true, needsReason: backward || isExit };
}

module.exports = {
  PRESALE, RELATIONS, MARKETING, EXIT, DNC,
  STATUSES, PIPELINE_OF, BOARD_COLUMNS, RANK, FUNNEL,
  MONEY, CONVERTED, TERMINAL, NO_AUTO, CLOSED, CLOSED_SQL,
  rankOf, pipelineOf, meetsSlothGate, resolveAccountStatus, manualTransition,
};

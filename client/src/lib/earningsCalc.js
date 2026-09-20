/**
 * Annual/winner/ceiling orchestration for the earnings calculator.
 * Wraps morPricing (per-booking take-home authority) and pulls annual fees from
 * data/plans.js (single pricing source). Pure + unit-tested so the page stays
 * presentation-only. Display/illustration only — real pricing is server-side.
 */
import { computeMorBreakdown, CALC_PLANS, DEFAULT_GST_RATE } from './morPricing';
import { PREMIUM_PLAN } from '../data/plans';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Neither plan caps bookings since v3.165 — both are unlimited, so there is no
// "you can't accept booking #1,001" ceiling to model any more. The whole
// comparison is now a single question: at what volume does the flat annual fee
// beat 5% commission?
const ANNUAL_BOOKING_CAP = { free: null, premium: null };

// Annual fees from the single pricing source (GST-inclusive, as charged).
export const ANNUAL_FEE = {
  free: 0,
  premium: PREMIUM_PLAN.yearly,
};

export const annualBookings = (sessionsPerMonth) =>
  Math.max(0, Math.floor(Number(sessionsPerMonth) || 0)) * 12;

export function resultsFor(earning, sessionsPerMonth, cycle = 'annual') {
  const yearly = annualBookings(sessionsPerMonth);
  return CALC_PLANS.map((plan) => {
    const b = computeMorBreakdown({ targetEarning: earning, ...plan.charge, gstRate: DEFAULT_GST_RATE });
    const perBookingTakeHome = b.hostConsideration;
    const cap = ANNUAL_BOOKING_CAP[plan.key];
    // Kept as a hook: if a booking cap ever returns to a plan, a plan only earns
    // on the bookings it can actually accept. Both plans are uncapped today, so
    // this is always the full year.
    const earnableBookings = cap == null ? yearly : Math.min(yearly, cap);
    const uncollectedBookings = yearly - earnableBookings;
    const grossAnnual = round2(perBookingTakeHome * earnableBookings);
    const fee = cycle === 'annual' ? ANNUAL_FEE[plan.key] : plan.monthly * 12;
    const netAnnual = round2(grossAnnual - fee);
    const capped = plan.maxServicePrice != null && Number(earning) > plan.maxServicePrice;
    const outgrows = cap != null && yearly > cap;
    return {
      plan,
      perBookingTakeHome,
      guestPays: b.guestTotal,
      fee,
      grossAnnual,
      netAnnual,
      capped,
      outgrows,
      bookingCap: cap,
      earnableBookings,
      uncollectedBookings,
      uncollectedValue: round2(perBookingTakeHome * uncollectedBookings),
    };
  });
}

export function pickWinner(results) {
  const eligible = results.filter((r) => !r.capped && !r.outgrows);
  const pool = eligible.length ? eligible : results.filter((r) => !r.capped);
  const fallback = pool.length ? pool : results;
  return fallback.reduce((a, b) => (b.netAnnual > a.netAnnual ? b : a)).plan.key;
}

export function annualSaving(planKey) {
  const plan = CALC_PLANS.find((p) => p.key === planKey);
  if (!plan || plan.monthly === 0) return 0;
  return plan.monthly * 12 - ANNUAL_FEE[planKey];
}

// Commission a free host gives up over a year — the number the upgrade is
// measured against.
export function freeCommissionPerYear(earning, sessionsPerMonth) {
  const rate = CALC_PLANS.find((p) => p.key === 'free').charge.commissionRate;
  return round2(rate * (Number(earning) || 0) * annualBookings(sessionsPerMonth));
}

// The recommendation's headline number: how much more the winning plan keeps per
// year than free. 0 when free itself is the winner (nothing to beat).
export function deltaVsFree(results, winnerKey) {
  const winner = results.find((r) => r.plan.key === winnerKey);
  const free = results.find((r) => r.plan.key === 'free');
  if (!winner || !free) return 0;
  return round2(winner.netAnnual - free.netAnnual);
}

// Sessions/month at which Sloth Active (0% commission, flat annual fee) starts
// beating free for a given per-session price: it wins once a year of saved 5%
// commission clears the fee → ceil(fee / (rate·price·12)). Powers the honest
// "stay free until ~N/mo" message when free is the winner.
export function premiumCrossover(earning) {
  const rate = CALC_PLANS.find((p) => p.key === 'free').charge.commissionRate;
  const price = Math.max(0, Number(earning) || 0);
  if (price <= 0) return Infinity;
  return Math.ceil(ANNUAL_FEE.premium / (rate * price * 12));
}

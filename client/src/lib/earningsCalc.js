/**
 * Annual/winner/ceiling orchestration for the earnings calculator.
 * Wraps morPricing (per-booking take-home authority) and pulls annual fees from
 * data/plans.js (single pricing source). Pure + unit-tested so the page stays
 * presentation-only. Display/illustration only — real pricing is server-side.
 */
import { computeMorBreakdown, CALC_PLANS, DEFAULT_GST_RATE } from './morPricing';
import { PAID_PLANS } from '../data/plans';

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const HOSTPLUS_ANNUAL_CAP = 1000;

// Annual fees from the single pricing source. plans.js slugs: creator=Host+, professional=Studio.
const yearlyBySlug = Object.fromEntries(PAID_PLANS.map((p) => [p.slug, p.yearly]));
export const ANNUAL_FEE = {
  starter: 0,
  hostplus: yearlyBySlug.creator,
  studio: yearlyBySlug.professional,
};

export const annualBookings = (sessionsPerMonth) =>
  Math.max(0, Math.floor(Number(sessionsPerMonth) || 0)) * 12;

export function resultsFor(earning, sessionsPerMonth, cycle = 'annual') {
  const yearly = annualBookings(sessionsPerMonth);
  return CALC_PLANS.map((plan) => {
    const b = computeMorBreakdown({ targetEarning: earning, ...plan.charge, gstRate: DEFAULT_GST_RATE });
    const perBookingTakeHome = b.hostConsideration;
    const grossAnnual = round2(perBookingTakeHome * yearly);
    const fee = cycle === 'annual' ? ANNUAL_FEE[plan.key] : plan.monthly * 12;
    const netAnnual = round2(grossAnnual - fee);
    const capped = plan.maxServicePrice != null && Number(earning) > plan.maxServicePrice;
    const outgrows = plan.key === 'hostplus' && yearly > HOSTPLUS_ANNUAL_CAP;
    return {
      plan,
      perBookingTakeHome,
      guestPays: b.guestTotal,
      fee,
      feeCycleLabel: cycle === 'annual' ? '/year' : '/year (billed monthly)',
      grossAnnual,
      netAnnual,
      capped,
      outgrows,
    };
  });
}

export function pickWinner(results) {
  const eligible = results.filter((r) => !r.capped);
  const pool = eligible.length ? eligible : results;
  return pool.reduce((a, b) => (b.netAnnual > a.netAnnual ? b : a)).plan.key;
}

export function annualSaving(planKey) {
  const plan = CALC_PLANS.find((p) => p.key === planKey);
  if (!plan || plan.monthly === 0) return 0;
  return plan.monthly * 12 - ANNUAL_FEE[planKey];
}

export function ceilingState(sessionsPerMonth) {
  const yearly = annualBookings(sessionsPerMonth);
  if (yearly > HOSTPLUS_ANNUAL_CAP) return 'over';
  if (yearly > 840) return 'near'; // ~70/mo, approaching the cap
  return 'none';
}

export function starterCommissionPerYear(earning, sessionsPerMonth) {
  const rate = CALC_PLANS.find((p) => p.key === 'starter').charge.commissionRate;
  return round2(rate * (Number(earning) || 0) * annualBookings(sessionsPerMonth));
}

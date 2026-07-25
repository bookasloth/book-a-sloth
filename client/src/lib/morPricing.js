/**
 * Client-side merchant-of-record pricing — a faithful mirror of the server's
 * computeMorBreakdown (server/lib/pricingEngine.js). Kept as a tiny duplicate
 * rather than a shared package because the formula is a few lines and the two
 * runtimes (CJS server, ESM client) don't share a module boundary.
 *
 * SOURCE OF TRUTH IS THE SERVER. If the server formula changes, change this too,
 * and the drift test (__tests__/morPricing.test.js) — which asserts the same
 * published /host-fees §4 numbers the server test does — will fail if they drift.
 *
 * Used by the earnings calculator (pages/EarningsCalculator.jsx). Rates are
 * FRACTIONS (gstRate 0.18, commissionRate 0.05, pgRate 0.025).
 *
 * NOTE: this is display/illustration only. Real pricing at booking time comes
 * from the server. Until the CA confirms per-category treatment, the calculator
 * assumes the standard 18% rate (most categories); exempt/RCM categories differ.
 */

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const DEFAULT_GST_RATE = 0.18;

/**
 * @param {object}  p
 * @param {number}  p.targetEarning     what the host wants to earn (≥ 0)
 * @param {number}  [p.bookingCharge]   flat ₹ added to taxable value (default 10)
 * @param {number}  [p.commissionRate]  fraction, e.g. 0.05 / 0
 * @param {number}  [p.pgRate]          fraction, e.g. 0.025
 * @param {boolean} [p.absorbsPg]       true → platform bears processing (Starter)
 * @param {number}  [p.gstRate]         fraction, e.g. 0.18; 0 for an exempt category
 */
export function computeMorBreakdown({
  targetEarning,
  bookingCharge = 10,
  commissionRate = 0,
  pgRate = 0,
  absorbsPg = false,
  gstRate = DEFAULT_GST_RATE,
}) {
  const E = Math.max(0, Number(targetEarning) || 0);
  if (E === 0) {
    return {
      targetEarning: 0, bookingCharge: 0, commission: 0, pgCharge: 0,
      hostConsideration: 0, taxableValue: 0, gstAmount: 0, guestTotal: 0, platformMargin: 0,
    };
  }
  const taxableValue = round2(E + bookingCharge);
  const gstAmount    = round2(taxableValue * gstRate);
  const guestTotal   = round2(taxableValue + gstAmount);
  const commission   = round2(E * commissionRate);
  const pgCharge     = absorbsPg ? 0 : round2(guestTotal * pgRate);
  const hostConsideration = round2(E - commission - pgCharge);
  const platformMargin    = round2(bookingCharge + commission + pgCharge);
  return { targetEarning: round2(E), bookingCharge: round2(bookingCharge), commission, pgCharge, hostConsideration, taxableValue, gstAmount, guestTotal, platformMargin };
}

/**
 * Per-booking charge config for the three self-serve plans, plus their
 * subscription cost. Mirrors the future subscription_plans.limits rows and the
 * published /host-fees §1 table. Subscription prices are imported from the single
 * source (data/plans.js) so they never drift from the pricing page.
 */
export const CALC_PLANS = [
  {
    key: 'starter', name: 'Starter',
    charge: { bookingCharge: 10, commissionRate: 0.05, pgRate: 0.025, absorbsPg: true },
    monthly: 0, maxServicePrice: 5000,
    note: 'Free to start · 5% per booking',
  },
  {
    key: 'hostplus', name: 'Host+',
    charge: { bookingCharge: 10, commissionRate: 0, pgRate: 0.025, absorbsPg: false },
    monthly: 229, maxServicePrice: null,
    note: '0% commission · ₹229/mo',
  },
  {
    key: 'studio', name: 'Studio',
    charge: { bookingCharge: 10, commissionRate: 0, pgRate: 0.025, absorbsPg: false },
    monthly: 555, maxServicePrice: null,
    note: '0% commission · ₹555/mo',
  },
];

/**
 * Monthly income for one plan at a given per-booking earning and volume, net of
 * the subscription. Returns the per-booking and monthly figures the calculator
 * renders. `capped` flags a Starter earning above its ₹5,000 service-price cap.
 */
export function monthlyForPlan(plan, targetEarning, bookingsPerMonth, gstRate = DEFAULT_GST_RATE) {
  const b = computeMorBreakdown({ targetEarning, ...plan.charge, gstRate });
  const bookings = Math.max(0, Math.floor(Number(bookingsPerMonth) || 0));
  const grossMonthly = round2(b.hostConsideration * bookings);
  const netMonthly = round2(grossMonthly - plan.monthly);
  const capped = plan.maxServicePrice != null && Number(targetEarning) > plan.maxServicePrice;
  return {
    plan,
    perBookingTakeHome: b.hostConsideration,
    guestPays: b.guestTotal,
    subscription: plan.monthly,
    grossMonthly,
    netMonthly,
    capped,
  };
}

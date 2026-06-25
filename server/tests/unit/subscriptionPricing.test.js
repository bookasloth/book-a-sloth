/**
 * tests/unit/subscriptionPricing.test.js
 *
 * Pure helpers for the auto-renewing subscription model:
 *   - per-cadence price / GST-inclusive gross / Razorpay paise amount
 *   - RBI ₹15,000 auto-debit guardrail
 *   - Razorpay interval mapping
 *   - proration credit (forfeit-excess switch model)
 */
'use strict';

const {
  AUTO_DEBIT_THRESHOLD,
  normCadence,
  cadencePrice,
  cadenceGross,
  cadenceAmountPaise,
  exceedsAutoDebitThreshold,
  razorpayInterval,
  cadencePeriodDays,
  computeProrationCredit,
  computeSwitchCharge,
  computeSwitch,
  subscriptionTotalCount,
  MANDATE_END_CEILING_UNIX,
} = require('../../lib/subscriptionPricing');

const PLAN = { monthly_price: 99, annual_price: 999 };

describe('normCadence', () => {
  test('yearly is an alias for annual', () => {
    expect(normCadence('yearly')).toBe('annual');
    expect(normCadence('ANNUAL')).toBe('annual');
    expect(normCadence(' Monthly ')).toBe('monthly');
  });
});

describe('cadencePrice', () => {
  test('reads the matching cadence price', () => {
    expect(cadencePrice(PLAN, 'monthly')).toBe(99);
    expect(cadencePrice(PLAN, 'annual')).toBe(999);
    expect(cadencePrice(PLAN, 'yearly')).toBe(999);
  });
  test('unknown cadence / missing price → 0', () => {
    expect(cadencePrice(PLAN, 'weekly')).toBe(0);
    expect(cadencePrice({}, 'monthly')).toBe(0);
    expect(cadencePrice(null, 'monthly')).toBe(0);
  });
});

describe('cadenceGross — GST charged ON TOP (PRD §5.2)', () => {
  test('annual ₹999 → ₹1,178.82 incl 18% GST', () => {
    expect(cadenceGross(PLAN, 'annual', 0.18)).toBe(1178.82);
  });
  test('monthly ₹99 → ₹116.82 incl 18% GST', () => {
    expect(cadenceGross(PLAN, 'monthly', 0.18)).toBe(116.82);
  });
});

describe('cadenceAmountPaise — fixed recurring charge', () => {
  test('annual ₹1,178.82 → 117882 paise', () => {
    expect(cadenceAmountPaise(PLAN, 'annual', 0.18)).toBe(117882);
  });
  test('monthly ₹116.82 → 11682 paise', () => {
    expect(cadenceAmountPaise(PLAN, 'monthly', 0.18)).toBe(11682);
  });
});

describe('exceedsAutoDebitThreshold — RBI ₹15,000 ceiling', () => {
  test('at or under the threshold is frictionless', () => {
    expect(exceedsAutoDebitThreshold(AUTO_DEBIT_THRESHOLD)).toBe(false);
    expect(exceedsAutoDebitThreshold(1178.82)).toBe(false);
  });
  test('above the threshold needs per-charge re-auth', () => {
    expect(exceedsAutoDebitThreshold(15000.01)).toBe(true);
    expect(exceedsAutoDebitThreshold(20000)).toBe(true);
  });
});

describe('razorpayInterval', () => {
  test('maps cadence → Razorpay period', () => {
    expect(razorpayInterval('monthly')).toEqual({ period: 'monthly', interval: 1 });
    expect(razorpayInterval('annual')).toEqual({ period: 'yearly', interval: 1 });
    expect(razorpayInterval('yearly')).toEqual({ period: 'yearly', interval: 1 });
  });
  test('unknown cadence throws', () => {
    expect(() => razorpayInterval('weekly')).toThrow('unknown cadence');
  });
});

describe('computeProrationCredit', () => {
  const start = '2026-01-01T00:00:00Z';
  const end = '2026-01-31T00:00:00Z'; // 30-day period

  test('halfway through → half the amount credited', () => {
    const credit = computeProrationCredit({ amountPaid: 100, periodStart: start, periodEnd: end, now: '2026-01-16T00:00:00Z' });
    expect(credit).toBe(50);
  });
  test('switching on day one → ~full credit', () => {
    const credit = computeProrationCredit({ amountPaid: 100, periodStart: start, periodEnd: end, now: start });
    expect(credit).toBe(100);
  });
  test('period already expired → 0', () => {
    const credit = computeProrationCredit({ amountPaid: 100, periodStart: start, periodEnd: end, now: '2026-03-01T00:00:00Z' });
    expect(credit).toBe(0);
  });
  test('credit never exceeds amount paid', () => {
    const credit = computeProrationCredit({ amountPaid: 100, periodStart: start, periodEnd: end, now: '2025-12-01T00:00:00Z' });
    expect(credit).toBe(100);
  });
  test('invalid / empty inputs → 0', () => {
    expect(computeProrationCredit({ amountPaid: 0, periodStart: start, periodEnd: end, now: start })).toBe(0);
    expect(computeProrationCredit({ amountPaid: 100, periodStart: end, periodEnd: start, now: start })).toBe(0);
    expect(computeProrationCredit({ amountPaid: 100, periodStart: 'bad', periodEnd: end, now: start })).toBe(0);
  });
});

describe('cadencePeriodDays', () => {
  test('monthly → 30, annual → 365', () => {
    expect(cadencePeriodDays('monthly')).toBe(30);
    expect(cadencePeriodDays('annual')).toBe(365);
    expect(cadencePeriodDays('yearly')).toBe(365);
  });
});

describe('computeSwitch — credit becomes free days on the new plan', () => {
  const periodStart = '2026-01-01T00:00:00Z';
  const periodEnd = '2026-01-31T00:00:00Z'; // 30-day period
  const now = '2026-01-16T00:00:00Z';       // halfway → 50% credit

  test('monthly→monthly halfway: half a period of credit → ~15 free days', () => {
    // amountPaid 116.82, halfway → credit 58.41; new monthly gross 116.82 → 50% → 15 days
    const sw = computeSwitch({ amountPaid: 116.82, periodStart, periodEnd, now, newPeriodGross: 116.82, newCadence: 'monthly' });
    expect(sw.creditApplied).toBe(58.41);
    expect(sw.forfeited).toBe(0);
    expect(sw.creditDays).toBe(15);
    expect(sw.startAtUnix).toBe(Math.floor(new Date('2026-01-31T00:00:00Z').getTime() / 1000));
  });

  test('upgrade monthly→annual: credit is a small fraction of the bigger annual period', () => {
    // credit 58.41 of annual gross 1178.82 → ~5% of 365 ≈ 18 days
    const sw = computeSwitch({ amountPaid: 116.82, periodStart, periodEnd, now, newPeriodGross: 1178.82, newCadence: 'annual' });
    expect(sw.creditApplied).toBe(58.41);
    expect(sw.forfeited).toBe(0);
    expect(sw.creditDays).toBe(18);
  });

  test('downgrade annual→monthly: huge credit, capped at one monthly period, excess forfeited', () => {
    // half of annual ₹1178.82 = 589.41 credit; new monthly gross 116.82 →
    // creditApplied capped at 116.82, free days capped at 30, rest forfeited.
    const sw = computeSwitch({ amountPaid: 1178.82, periodStart, periodEnd: '2026-12-31T00:00:00Z', now: '2026-07-02T00:00:00Z', newPeriodGross: 116.82, newCadence: 'monthly' });
    expect(sw.creditApplied).toBe(116.82);
    expect(sw.creditDays).toBe(30);
    expect(sw.forfeited).toBeGreaterThan(0);
  });
});

describe('computeSwitchCharge — forfeit excess (Decision #4)', () => {
  test('upgrade: credit < new gross → pay the difference, nothing forfeited', () => {
    expect(computeSwitchCharge({ credit: 50, newPeriodGross: 200 }))
      .toEqual({ creditApplied: 50, forfeited: 0, chargeNow: 150 });
  });
  test('downgrade: credit > new gross → charge 0, excess forfeited', () => {
    expect(computeSwitchCharge({ credit: 500, newPeriodGross: 116.82 }))
      .toEqual({ creditApplied: 116.82, forfeited: 383.18, chargeNow: 0 });
  });
  test('credit exactly equals gross → free switch, no forfeit', () => {
    expect(computeSwitchCharge({ credit: 200, newPeriodGross: 200 }))
      .toEqual({ creditApplied: 200, forfeited: 0, chargeNow: 0 });
  });
  test('no credit → full charge', () => {
    expect(computeSwitchCharge({ credit: 0, newPeriodGross: 1178.82 }))
      .toEqual({ creditApplied: 0, forfeited: 0, chargeNow: 1178.82 });
  });
});

describe('subscriptionTotalCount — UPI AutoPay mandate end_time ceiling guard', () => {
  // Razorpay rejects UPI AutoPay mandates whose end_time exceeds ~2121
  // (end_time ≤ 4765046400 unix seconds). A subscription's mandate must span all
  // scheduled cycles, end ≈ start + total_count × period, so an "until cancelled"
  // cycle count (esp. annual) can push the mandate past the cap and Razorpay
  // rejects it at checkout: "end_time must be between 946684800 and 4765046400".
  const BASE_2026 = 1782000000;            // ~2026-06, a representative "now"
  const YEAR = 366 * 86400;                // conservative annual cycle (matches impl)
  const MONTH = 31 * 86400;                // conservative monthly cycle (matches impl)

  test('the ceiling constant matches Razorpay’s documented max (~2121)', () => {
    expect(MANDATE_END_CEILING_UNIX).toBe(4765046400);
  });

  test('annual is capped below the naive 100 cycles and keeps the mandate end under the ceiling', () => {
    const count = subscriptionTotalCount('annual', BASE_2026);
    expect(count).toBeLessThan(100);                 // the cap engaged
    expect(count).toBeGreaterThan(0);
    expect(BASE_2026 + count * YEAR).toBeLessThanOrEqual(MANDATE_END_CEILING_UNIX);
  });

  test('regression: the old fixed annual=100 WOULD have overflowed the ceiling', () => {
    // Documents the bug — proves the cap is load-bearing, not cosmetic.
    expect(BASE_2026 + 100 * (365 * 86400)).toBeGreaterThan(MANDATE_END_CEILING_UNIX);
  });

  test('monthly keeps its full 120 cycles (10yr — never near the ceiling)', () => {
    const count = subscriptionTotalCount('monthly', BASE_2026);
    expect(count).toBe(120);
    expect(BASE_2026 + count * MONTH).toBeLessThanOrEqual(MANDATE_END_CEILING_UNIX);
  });

  test('honours a deferred start_at base (switch) and still stays under the ceiling', () => {
    const deferred = BASE_2026 + 200 * 86400; // ~200 free days deferred start
    const count = subscriptionTotalCount('annual', deferred);
    expect(deferred + count * YEAR).toBeLessThanOrEqual(MANDATE_END_CEILING_UNIX);
  });

  test('never returns less than 1 even if the base sits at the ceiling', () => {
    expect(subscriptionTotalCount('annual', MANDATE_END_CEILING_UNIX)).toBeGreaterThanOrEqual(1);
  });

  test('yearly is an alias for annual', () => {
    expect(subscriptionTotalCount('yearly', BASE_2026)).toBe(subscriptionTotalCount('annual', BASE_2026));
  });

  test('unknown cadence throws', () => {
    expect(() => subscriptionTotalCount('weekly', BASE_2026)).toThrow('unknown cadence');
  });
});

/**
 * tests/unit/pricingEngineMor.test.js
 *
 * Merchant-of-record pricing (docs/payment-model.md v3). The four worked
 * examples here are the ones PUBLISHED on /host-fees §4 — a host can quote them
 * back at us, so they must match to the paisa. If a number changes, it changes
 * in three places at once: this test, /host-fees (HostFees.jsx), and the spec.
 *
 * Rates are FRACTIONS here (gstRate 0.18, commissionRate 0.05, pgRate 0.025),
 * unlike the legacy commission which is a percentage number.
 */

'use strict';

const { computeMorBreakdown } = require('../../lib/pricingEngine');

// Plan shapes as they will live in subscription_plans.limits.
const HOSTPLUS = { bookingCharge: 10, commissionRate: 0,    pgRate: 0.025, absorbsPg: false };
const STARTER  = { bookingCharge: 10, commissionRate: 0.05, pgRate: 0.025, absorbsPg: true  };
const GST18 = 0.18;

describe('computeMorBreakdown — published /host-fees §4 examples (E = ₹1,000)', () => {
  test('4.1 Host+ / Studio: guest ₹1191.80, host keeps ₹970.20, gross margin ₹39.80', () => {
    const b = computeMorBreakdown({ targetEarning: 1000, gstRate: GST18, ...HOSTPLUS });
    expect(b.taxableValue).toBe(1010);
    expect(b.gstAmount).toBe(181.8);
    expect(b.guestTotal).toBe(1191.8);
    expect(b.commission).toBe(0);
    expect(b.pgCharge).toBe(29.8);          // 2.5% of 1191.80
    expect(b.hostConsideration).toBe(970.2); // 1000 − 0 − 29.80
    expect(b.platformMargin).toBe(39.8);     // 10 booking + 29.80 pg (gross, before actual MDR)
  });

  test('4.2 Starter: same guest price ₹1191.80, host keeps ₹950.00, gross margin ₹60.00', () => {
    const b = computeMorBreakdown({ targetEarning: 1000, gstRate: GST18, ...STARTER });
    expect(b.guestTotal).toBe(1191.8);       // identical to Host+ — plan never moves guest price
    expect(b.commission).toBe(50);           // 5% of 1000
    expect(b.pgCharge).toBe(0);              // Starter absorbs processing
    expect(b.hostConsideration).toBe(950);   // 1000 − 50 − 0
    expect(b.platformMargin).toBe(60);       // 10 booking + 50 commission
  });

  test('guest price is identical across plans (the core invariant)', () => {
    const hostPlus = computeMorBreakdown({ targetEarning: 1000, gstRate: GST18, ...HOSTPLUS });
    const starter  = computeMorBreakdown({ targetEarning: 1000, gstRate: GST18, ...STARTER });
    expect(hostPlus.guestTotal).toBe(starter.guestTotal);
  });

  test('host consideration does not depend on GST status (registered vs not)', () => {
    // The function has no notion of host GST status — H is the same either way.
    // Registration only changes the DOCUMENT and how GST is remitted, not H.
    const b = computeMorBreakdown({ targetEarning: 1000, gstRate: GST18, ...HOSTPLUS });
    expect(b.hostConsideration).toBe(970.2);
  });
});

describe('computeMorBreakdown — Starter ₹5,000 price cap (guest ₹5,911.80)', () => {
  test('commission caps at ₹250 (5% of the ₹5,000 ceiling)', () => {
    const b = computeMorBreakdown({ targetEarning: 5000, gstRate: GST18, ...STARTER });
    expect(b.guestTotal).toBe(5911.8);       // (5000 + 10) × 1.18
    expect(b.commission).toBe(250);          // 5% of 5000
    expect(b.hostConsideration).toBe(4750);  // 5000 − 250
    expect(b.platformMargin).toBe(260);      // 10 + 250
  });
});

describe('computeMorBreakdown — exempt category (gstRate 0)', () => {
  test('no GST, guest pays taxable value only', () => {
    const b = computeMorBreakdown({ targetEarning: 1000, gstRate: 0, ...HOSTPLUS });
    expect(b.gstAmount).toBe(0);
    expect(b.guestTotal).toBe(1010);         // 1000 + 10, no tax added
    expect(b.pgCharge).toBe(25.25);          // 2.5% of 1010
    expect(b.hostConsideration).toBe(974.75);
  });
});

describe('computeMorBreakdown — free service (E = 0)', () => {
  test('everything is zero — no booking charge accrues on a ₹0 service', () => {
    const b = computeMorBreakdown({ targetEarning: 0, gstRate: GST18, ...HOSTPLUS });
    expect(b).toEqual({
      targetEarning: 0, bookingCharge: 0, commission: 0, pgCharge: 0,
      hostConsideration: 0, taxableValue: 0, gstAmount: 0, guestTotal: 0,
      platformMargin: 0,
    });
  });
});

describe('computeMorBreakdown — defaults and guards', () => {
  test('bookingCharge defaults to ₹10 and gstRate to 18%', () => {
    const b = computeMorBreakdown({ targetEarning: 1000 });
    expect(b.taxableValue).toBe(1010);
    expect(b.gstAmount).toBe(181.8);
  });

  test('negative inputs throw', () => {
    expect(() => computeMorBreakdown({ targetEarning: -1 })).toThrow('targetEarning cannot be negative');
    expect(() => computeMorBreakdown({ targetEarning: 100, commissionRate: -0.05 })).toThrow('commissionRate cannot be negative');
    expect(() => computeMorBreakdown({ targetEarning: 100, pgRate: -0.025 })).toThrow('pgRate cannot be negative');
    expect(() => computeMorBreakdown({ targetEarning: 100, gstRate: -0.18 })).toThrow('gstRate cannot be negative');
  });

  test('taxableValue + gstAmount always equals guestTotal (invoice consistency)', () => {
    for (const E of [1, 199, 333.33, 1000, 4999]) {
      const b = computeMorBreakdown({ targetEarning: E, gstRate: GST18, ...HOSTPLUS });
      expect(b.taxableValue + b.gstAmount).toBeCloseTo(b.guestTotal, 2);
    }
  });
});

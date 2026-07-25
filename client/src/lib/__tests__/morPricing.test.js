/**
 * Drift guard: the client MoR mirror must produce the same published /host-fees §4
 * numbers as the server (server/tests/unit/pricingEngineMor.test.js). If the two
 * formulas diverge, these paisa-level assertions fail.
 */
import { describe, it, expect } from 'vitest';
import { computeMorBreakdown, monthlyForPlan, CALC_PLANS } from '../morPricing';

const HOSTPLUS = { bookingCharge: 10, commissionRate: 0, pgRate: 0.025, absorbsPg: false };
const STARTER  = { bookingCharge: 10, commissionRate: 0.05, pgRate: 0.025, absorbsPg: true };

describe('computeMorBreakdown mirrors the server (E = ₹1,000, 18%)', () => {
  it('Host+ / Studio: guest ₹1191.80, host keeps ₹970.20', () => {
    const b = computeMorBreakdown({ targetEarning: 1000, ...HOSTPLUS });
    expect(b.guestTotal).toBe(1191.8);
    expect(b.pgCharge).toBe(29.8);
    expect(b.hostConsideration).toBe(970.2);
  });

  it('Starter: same guest price, host keeps ₹950.00', () => {
    const b = computeMorBreakdown({ targetEarning: 1000, ...STARTER });
    expect(b.guestTotal).toBe(1191.8);
    expect(b.commission).toBe(50);
    expect(b.pgCharge).toBe(0);
    expect(b.hostConsideration).toBe(950);
  });

  it('free service (E=0) → all zeros', () => {
    const b = computeMorBreakdown({ targetEarning: 0, ...HOSTPLUS });
    expect(b.guestTotal).toBe(0);
    expect(b.hostConsideration).toBe(0);
  });
});

describe('monthlyForPlan', () => {
  it('nets the subscription off gross monthly income', () => {
    const starter = monthlyForPlan(CALC_PLANS[0], 1000, 10);
    const hostplus = monthlyForPlan(CALC_PLANS[1], 1000, 10);
    expect(starter.netMonthly).toBe(9500);        // 950 × 10 − 0
    expect(hostplus.netMonthly).toBe(9473);        // 970.20 × 10 − 229
  });

  it('Host+ overtakes Starter once volume is high enough', () => {
    // At 10 bookings Starter still wins; by 20 Host+ is ahead — the upgrade story.
    const at10 = { s: monthlyForPlan(CALC_PLANS[0], 1000, 10).netMonthly, h: monthlyForPlan(CALC_PLANS[1], 1000, 10).netMonthly };
    const at20 = { s: monthlyForPlan(CALC_PLANS[0], 1000, 20).netMonthly, h: monthlyForPlan(CALC_PLANS[1], 1000, 20).netMonthly };
    expect(at10.s).toBeGreaterThan(at10.h);
    expect(at20.h).toBeGreaterThan(at20.s);
  });

  it('flags a Starter earning above the ₹5,000 cap', () => {
    expect(monthlyForPlan(CALC_PLANS[0], 6000, 5).capped).toBe(true);
    expect(monthlyForPlan(CALC_PLANS[0], 5000, 5).capped).toBe(false);
    expect(monthlyForPlan(CALC_PLANS[1], 6000, 5).capped).toBe(false); // Host+ has no cap
  });
});

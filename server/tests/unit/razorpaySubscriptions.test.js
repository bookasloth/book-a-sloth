/**
 * razorpaySubscriptions.test.js — call-site guard for the UPI AutoPay mandate
 * end_time ceiling.
 *
 * BUG: createSubscription passed a fixed total_count (annual = 100). Razorpay
 * derives the UPI AutoPay mandate end = start + total_count × period; annual × 100
 * lands ~2126, past Razorpay's ~2121 cap, so the mandate is rejected at checkout
 * with "end_time must be between 946684800 and 4765046400". These tests assert the
 * count handed to Razorpay is clamped under the ceiling (annual) and otherwise
 * unchanged (monthly).
 */
'use strict';

jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../services/planService', () => ({ clearCache: jest.fn() }));
jest.mock('../../services/platformConfig', () => ({ getConfig: jest.fn() }));
jest.mock('../../services/razorpayConfig', () => {
  const create = jest.fn(() => Promise.resolve({ id: 'sub_X' }));
  return {
    __create: create,
    getClient: jest.fn(() => Promise.resolve({ subscriptions: { create } })),
    getKeyId: jest.fn(() => Promise.resolve('rzp_test')),
  };
});

const razorpayConfig = require('../../services/razorpayConfig');
const create = razorpayConfig.__create;
const { subscriptionTotalCount, MANDATE_END_CEILING_UNIX } = require('../../lib/subscriptionPricing');
const razorpaySubscriptions = require('../../services/razorpaySubscriptions');

const YEAR = 366 * 86400;

beforeEach(() => jest.clearAllMocks());

describe('createSubscription — total_count stays under the mandate end_time ceiling', () => {
  test('annual is clamped well below the old fixed 100 and keeps the mandate end under the cap', async () => {
    await razorpaySubscriptions.createSubscription({ planId: 'plan_a', cadence: 'annual' });
    const arg = create.mock.calls[0][0];
    expect(arg.plan_id).toBe('plan_a');
    expect(arg.total_count).toBeLessThan(100);      // the bug: was a flat 100
    expect(arg.total_count).toBeGreaterThan(1);
    // The derived mandate end must sit under Razorpay's hard ceiling.
    const now = Math.floor(Date.now() / 1000);
    expect(now + arg.total_count * YEAR).toBeLessThanOrEqual(MANDATE_END_CEILING_UNIX);
  });

  test('monthly is unchanged at 120 cycles', async () => {
    await razorpaySubscriptions.createSubscription({ planId: 'plan_m', cadence: 'monthly' });
    expect(create.mock.calls[0][0].total_count).toBe(120);
  });

  test('a deferred start_at base shrinks the count to keep the mandate under the ceiling', async () => {
    const startAt = Math.floor(Date.now() / 1000) + 200 * 86400;
    await razorpaySubscriptions.createSubscription({ planId: 'plan_a', cadence: 'annual', startAt });
    const arg = create.mock.calls[0][0];
    expect(arg.start_at).toBe(startAt);
    expect(arg.total_count).toBe(subscriptionTotalCount('annual', startAt));
    expect(startAt + arg.total_count * YEAR).toBeLessThanOrEqual(MANDATE_END_CEILING_UNIX);
  });
});

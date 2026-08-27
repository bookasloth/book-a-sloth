'use strict';
// Honest conversion metric + follow-up window bounds. Pure, no DB.
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: () => ({}) } }));

const { conversionSummary, followupWindow } = require('../../services/crm/leadService');

describe('conversionSummary', () => {
  test('paid customers = paid status ONLY; activated is active-free, not paid', () => {
    // Live prod shape at audit time: 17 paid, 59 activated, 209 total.
    expect(conversionSummary({ paid: 17, activated: 59 }, 209))
      .toEqual({ paidCustomers: 17, activeFree: 59, conversionRate: 8.1 });
  });
  test('does NOT count activated as paid (the ~4× inflation bug)', () => {
    const { paidCustomers } = conversionSummary({ paid: 3, activated: 40 }, 100);
    expect(paidCustomers).toBe(3);            // not 43
  });
  test('zero total → 0% (no divide-by-zero)', () => {
    expect(conversionSummary({}, 0)).toEqual({ paidCustomers: 0, activeFree: 0, conversionRate: 0 });
  });
});

describe('followupWindow', () => {
  const now = new Date('2026-08-27T15:00:00Z');
  test('overdue → strictly before now', () => {
    expect(followupWindow('overdue', now)).toEqual({ to: now.toISOString(), inclusive: false });
  });
  test('today → up to and including end of today', () => {
    const { to, inclusive } = followupWindow('today', now);
    expect(inclusive).toBe(true);
    expect(new Date(to) > now).toBe(true);      // end-of-day is after now
  });
  test('open → no date bound', () => {
    expect(followupWindow('open', now)).toEqual({});
  });
});

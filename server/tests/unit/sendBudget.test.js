'use strict';
// sendBudget — the shared Resend daily budget + cold 18:00 window / ramp / skip rules.

const mockSupa = { supabaseAdmin: { from: jest.fn() } };
jest.mock('../../config/supabase', () => mockSupa);

// A thenable query stub: every chain method returns itself; awaiting resolves `result`.
function q(result) {
  const o = { select: () => o, eq: () => o, gte: () => o, in: () => o, then: (r) => Promise.resolve(result).then(r) };
  return o;
}
// email_logs (campaign) count + crm_messages (CRM) count.
function mockCounts(campaign, crm, err = false) {
  mockSupa.supabaseAdmin.from.mockImplementation((t) =>
    t === 'email_logs'
      ? q({ count: campaign, error: err ? { message: 'boom' } : null })
      : q({ count: crm, error: err ? { message: 'boom' } : null }));
}

let sendBudget;
function load() {
  jest.resetModules();
  process.env.RESEND_DAILY_CAP = '90';
  process.env.COLD_DAILY_MAX = '60';
  process.env.COLD_SEND_HOUR_IST = '18';
  process.env.COLD_WINDOW_END_IST = '20';
  sendBudget = require('../../services/email/sendBudget');
}

// IST anchors (verified): UTC+5:30.
const MON_18 = '2026-09-14T13:00:00Z'; // Mon, IST 18h — cold window open
const MON_11 = '2026-09-14T06:00:00Z'; // Mon, IST 11h — window closed
const SUN_18 = '2026-09-13T13:00:00Z'; // Sun, IST 18h — skip (Sunday)
const D31_18 = '2026-10-31T13:00:00Z'; // 31st, IST 18h — skip (month-end)

beforeEach(load);
afterEach(() => jest.useRealTimers());
function at(iso) { jest.useFakeTimers(); jest.setSystemTime(new Date(iso)); }

test('resendUsedToday sums both ledgers (campaign + CRM)', async () => {
  mockCounts(30, 15);
  await expect(sendBudget.resendUsedToday()).resolves.toBe(45);
});

test('remainingToday = soft cap minus usage', async () => {
  mockCounts(30, 15);
  await expect(sendBudget.remainingToday()).resolves.toBe(45); // 90 - 45
});

test('remainingToday fails OPEN on a counting error (returns full cap)', async () => {
  mockCounts(0, 0, true);
  await expect(sendBudget.remainingToday()).resolves.toBe(90);
});

test('coldAllowanceNow inside window = min(ramp, remainder)', async () => {
  at(MON_18); mockCounts(30, 0);            // used 30, remainder 60, ramp 60
  await expect(sendBudget.coldAllowanceNow()).resolves.toBe(60);
});

test('coldAllowanceNow squeezed by CRM usage (remainder < ramp)', async () => {
  at(MON_18); mockCounts(85, 0);            // remainder 5 < ramp 60
  await expect(sendBudget.coldAllowanceNow()).resolves.toBe(5);
});

test('coldAllowanceNow is 0 outside the 18:00 window', async () => {
  at(MON_11); mockCounts(0, 0);
  await expect(sendBudget.coldAllowanceNow()).resolves.toBe(0);
});

test('coldAllowanceNow is 0 on Sundays', async () => {
  at(SUN_18); mockCounts(0, 0);
  await expect(sendBudget.coldAllowanceNow()).resolves.toBe(0);
});

test('coldAllowanceNow is 0 on the 31st', async () => {
  at(D31_18); mockCounts(0, 0);
  await expect(sendBudget.coldAllowanceNow()).resolves.toBe(0);
});

test('coldAllowanceNow fails CLOSED on a counting error (returns 0)', async () => {
  at(MON_18); mockCounts(0, 0, true);
  await expect(sendBudget.coldAllowanceNow()).resolves.toBe(0);
});

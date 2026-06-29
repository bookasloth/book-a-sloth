/**
 * planService — reminder/reschedule plan-gating helpers.
 *
 * Forces the FALLBACK_PLANS path (subscription_plans query returns empty) so the
 * assertions pin the intended tiering independent of live DB rows:
 *   starter 0 flows → no reminders, creator 1 → 24h, professional 2 → 24h + 1h.
 */

jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: () => ({ select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
  },
}));

const planService = require('../../services/planService');

beforeEach(() => planService.clearCache());

describe('reminderWindowsForPlan', () => {
  test('starter → no reminder windows', async () => {
    expect(await planService.reminderWindowsForPlan('starter')).toEqual([]);
  });
  test('creator → 24h only', async () => {
    expect(await planService.reminderWindowsForPlan('creator')).toEqual([24]);
  });
  test('professional → 24h + 1h', async () => {
    expect(await planService.reminderWindowsForPlan('professional')).toEqual([24, 1]);
  });
  test('legacy "explorer" alias resolves to starter (no windows)', async () => {
    expect(await planService.reminderWindowsForPlan('explorer')).toEqual([]);
  });
  test('unknown slug falls back to starter (no windows)', async () => {
    expect(await planService.reminderWindowsForPlan('nope')).toEqual([]);
  });
});

describe('rescheduleNotifyForPlan', () => {
  test('starter / creator do NOT get reschedule notifications', async () => {
    expect(await planService.rescheduleNotifyForPlan('starter')).toBe(false);
    expect(await planService.rescheduleNotifyForPlan('creator')).toBe(false);
  });
  test('professional (full reminder set) DOES get reschedule notifications', async () => {
    expect(await planService.rescheduleNotifyForPlan('professional')).toBe(true);
  });
});

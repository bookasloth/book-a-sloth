jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn(() => ({ select: () => ({ order: () => Promise.resolve({ data: null, error: { message: 'relation "subscription_plans" does not exist' } }) }) })) } }));
const planService = require('../../services/planService');

test('followup_flows fallback: creator 0, professional 2, starter 0', async () => {
  expect(await planService.getLimit('creator', 'followup_flows')).toBe(0);
  expect(await planService.getLimit('professional', 'followup_flows')).toBe(2);
  expect(await planService.getLimit('starter', 'followup_flows')).toBe(0);
});

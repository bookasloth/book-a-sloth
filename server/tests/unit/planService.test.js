jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn(() => ({ select: () => ({ order: () => Promise.resolve({ data: null, error: { message: 'relation "subscription_plans" does not exist' } }) }) })) } }));
const planService = require('../../services/planService');

test('followup_flows fallback: free 0, premium/creator/professional unlimited', async () => {
  expect(await planService.getLimit('free', 'followup_flows')).toBe(0);
  expect(await planService.getLimit('premium', 'followup_flows')).toBe(-1);
  // Legacy paid rows were lifted to Sloth Active entitlements in v3.165.
  expect(await planService.getLimit('creator', 'followup_flows')).toBe(-1);
  expect(await planService.getLimit('professional', 'followup_flows')).toBe(-1);
});

test('legacy free slugs alias onto the free row', async () => {
  expect(planService.normalizeSlug('explorer')).toBe('free');
  expect(planService.normalizeSlug('starter')).toBe('free');
  // starter_legacy deliberately reads its own row (v3.56 grandfathering).
  expect(planService.normalizeSlug('starter_legacy')).toBe('starter_legacy');
});

test('an unknown slug resolves to the free plan, never a paid one', async () => {
  const plan = await planService.getPlan('does_not_exist');
  expect(plan.slug).toBe('free');
  expect(Number(plan.commission_percentage)).toBe(5);
});

test('an expired paid plan falls back to free', () => {
  const past = new Date(Date.now() - 86400000).toISOString();
  expect(planService.resolveVendorPlan({ plan: 'premium', plan_expires_at: past })).toBe('free');
  const future = new Date(Date.now() + 86400000).toISOString();
  expect(planService.resolveVendorPlan({ plan: 'premium', plan_expires_at: future })).toBe('premium');
});

// Archived rows still RESOLVE (existing subscribers keep renewing) but must
// never be purchasable from the public upgrade page.
test('isSelfServable gates archived rows out of self-serve checkout', () => {
  expect(planService.isSelfServable({ slug: 'premium', active: true })).toBe(true);
  expect(planService.isSelfServable({ slug: 'free', active: true })).toBe(true);
  expect(planService.isSelfServable({ slug: 'creator', active: false })).toBe(false);
  expect(planService.isSelfServable({ slug: 'supreme', active: false })).toBe(false);
  expect(planService.isSelfServable(null)).toBe(false);
});

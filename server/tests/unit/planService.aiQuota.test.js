// Mock supabase config to force fallback to FALLBACK_PLANS
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: null, error: new Error('subscription_plans table missing') }) })
    })
  }
}));

const planService = require('../../services/planService');

describe('ai_generations fallback limits', () => {
  // Clear cache before each test to force fresh read from fallback
  beforeEach(() => {
    planService.clearCache?.();
  });

  test('starter allows 1', async () => {
    const limit = await planService.getLimit('starter', 'ai_generations');
    expect(limit).toBe(1);
  });

  test('creator (Host+) allows 2', async () => {
    const limit = await planService.getLimit('creator', 'ai_generations');
    expect(limit).toBe(2);
  });

  test('professional (Studio) allows 2', async () => {
    const limit = await planService.getLimit('professional', 'ai_generations');
    expect(limit).toBe(2);
  });
});

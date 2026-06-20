jest.mock('../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));

const { FALLBACK_PLANS } = require('../services/planService');

describe('plan category caps (fallback)', () => {
  it('starter is locked (0)', () => {
    expect(FALLBACK_PLANS.starter.limits.categories).toBe(0);
  });
  it('creator allows 1', () => {
    expect(FALLBACK_PLANS.creator.limits.categories).toBe(1);
  });
  it('professional allows 3', () => {
    expect(FALLBACK_PLANS.professional.limits.categories).toBe(3);
  });
});

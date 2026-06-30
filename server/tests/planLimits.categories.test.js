jest.mock('../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));

const { FALLBACK_PLANS } = require('../services/planService');

// Caps mirror the published pricing matrix (migration v3.55):
// Starter 1 · Host+ (creator) 2 · Studio (professional) unlimited (-1).
describe('plan category caps (fallback)', () => {
  it('starter allows 1', () => {
    expect(FALLBACK_PLANS.starter.limits.categories).toBe(1);
  });
  it('creator allows 2', () => {
    expect(FALLBACK_PLANS.creator.limits.categories).toBe(2);
  });
  it('professional is unlimited (-1)', () => {
    expect(FALLBACK_PLANS.professional.limits.categories).toBe(-1);
  });
});

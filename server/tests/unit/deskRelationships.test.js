'use strict';
// PR-5: the Relationship Desk read — open touch recs ranked by priority, then worst
// health, then oldest, with the lead's identity/health flattened onto each rec.

jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
const { supabaseAdmin } = require('../../config/supabase');
const deskService = require('../../services/crm/deskService');

describe('rankRecommendations', () => {
  const { rankRecommendations } = deskService;

  test('priority wins first', () => {
    const out = rankRecommendations([
      { priority: 'low', health_state: 'at_risk', created_at: '2026-01-01' },
      { priority: 'high', health_state: 'steady', created_at: '2026-01-02' },
    ]);
    expect(out[0].priority).toBe('high');
  });

  test('within a priority, worse health ranks first', () => {
    const out = rankRecommendations([
      { priority: 'high', health_state: 'cooling', created_at: '2026-01-02' },
      { priority: 'high', health_state: 'at_risk', created_at: '2026-01-03' },
    ]);
    expect(out[0].health_state).toBe('at_risk');
  });

  test('ties break to the oldest rec', () => {
    const out = rankRecommendations([
      { priority: 'medium', health_state: 'cooling', created_at: '2026-02-01' },
      { priority: 'medium', health_state: 'cooling', created_at: '2026-01-01' },
    ]);
    expect(out[0].created_at).toBe('2026-01-01');
  });
});

describe('getRelationships', () => {
  test('flattens the embedded lead and ranks; caps to limit', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: () => ({ eq: () => ({ limit: () => Promise.resolve({
        data: [
          { id: 'r1', lead_id: 'L1', reason: 'cooling', priority: 'medium', created_at: '2026-01-02',
            leads: { name: 'Priya', health_state: 'cooling', health_score: 44, last_meaningful_interaction_at: '2026-01-01' } },
          { id: 'r2', lead_id: 'L2', reason: 'at_risk', priority: 'high', created_at: '2026-01-03',
            leads: { name: 'Rahul', health_state: 'at_risk', health_score: 20, last_meaningful_interaction_at: null } },
        ],
        error: null,
      }) }) }),
    });
    const { count, items } = await deskService.getRelationships(25);
    expect(count).toBe(2);
    expect(items[0]).toMatchObject({ id: 'r2', reason: 'at_risk', name: 'Rahul', health_state: 'at_risk' }); // high priority first
    expect(items[1]).toMatchObject({ id: 'r1', name: 'Priya', health_score: 44 });
    expect(items[0].last_meaningful_interaction_at).toBeNull();
  });

  test('missing table (pre-v3.136) → empty queue, not a 500', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: null, error: { message: 'relation "touch_recommendations" does not exist' } }) }) }),
    });
    expect(await deskService.getRelationships(25)).toEqual({ count: 0, items: [] });
  });
});

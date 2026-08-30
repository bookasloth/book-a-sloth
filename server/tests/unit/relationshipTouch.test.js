'use strict';
// PR-3: relationshipTouch maps a lead's health + account signals to the single most
// relevant relationship touch (who/why/channel/mode). Pure — one rec (or none) per lead.

const { recommendationsFor } = require('../../services/crm/relationshipTouch');

const NOW = new Date('2026-06-01T12:00:00Z').getTime();
const daysAgo = (n) => new Date(NOW - n * 864e5).toISOString();
const H = (state) => ({ state });

test('at_risk → high-priority winback; valued customer routes to a human founder note', () => {
  const lead = { id: 'L1', status: 'paid', last_meaningful_interaction_at: daysAgo(40) };

  const normal = recommendationsFor(lead, H('at_risk'), {}, NOW);
  expect(normal).toHaveLength(1);
  expect(normal[0]).toMatchObject({
    reason: 'at_risk', touch_type: 'winback', priority: 'high',
    suggested_channel: 'whatsapp', suggested_sender: 'owner', mode: 'recommend',
    dedupe_key: 'lead:L1:at_risk',
  });
  expect(normal[0].explanation).toContain('40d');

  const valued = recommendationsFor(lead, H('at_risk'), { meetsSloth: true }, NOW);
  expect(valued[0]).toMatchObject({ suggested_sender: 'founder', mode: 'human' });
});

test('first paid booking (won) → appreciation, recommend-to-human', () => {
  const recs = recommendationsFor({ id: 'L2', status: 'won' }, H('steady'), {}, NOW);
  expect(recs[0]).toMatchObject({
    reason: 'first_success', touch_type: 'appreciation', priority: 'high',
    suggested_channel: 'whatsapp', mode: 'recommend', dedupe_key: 'lead:L2:first_success',
  });
});

test('cooling → medium check-in by email', () => {
  const recs = recommendationsFor(
    { id: 'L3', status: 'paid', last_meaningful_interaction_at: daysAgo(25) }, H('cooling'), {}, NOW);
  expect(recs[0]).toMatchObject({
    reason: 'cooling', touch_type: 'check_in', priority: 'medium', suggested_channel: 'email', mode: 'recommend',
  });
  expect(recs[0].explanation).toContain('25d');
});

test('dormant wins back only a lead who was once a real customer', () => {
  const wasCustomer = recommendationsFor({ id: 'L4', status: 'paid' }, H('dormant'), { hasBooking: true }, NOW);
  expect(wasCustomer[0]).toMatchObject({ reason: 'dormant', touch_type: 'winback', priority: 'low' });

  const neverActivated = recommendationsFor({ id: 'L5', status: 'contacted' }, H('dormant'), { hasBooking: false }, NOW);
  expect(neverActivated).toEqual([]);
});

test('at_risk outranks a first-success celebration for the same lead', () => {
  // a won lead that has also gone at-risk → the urgent touch wins.
  const recs = recommendationsFor({ id: 'L6', status: 'won' }, H('at_risk'), {}, NOW);
  expect(recs[0].reason).toBe('at_risk');
});

test('healthy (thriving/steady) leads and null leads produce no touch', () => {
  expect(recommendationsFor({ id: 'L7', status: 'paid' }, H('thriving'), {}, NOW)).toEqual([]);
  expect(recommendationsFor({ id: 'L8', status: 'contacted' }, H('steady'), {}, NOW)).toEqual([]);
  expect(recommendationsFor(null, H('at_risk'), {}, NOW)).toEqual([]);
  expect(recommendationsFor({ id: 'L9' }, null, {}, NOW)).toEqual([]);
});

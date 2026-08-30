// recordEmailLogDelivery: Resend event → email_logs status, matched by message id.
const state = { row: null, updates: [] };
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: () => ({
      select() { return this; },
      eq(_c, v) { this._v = v; return this; },
      maybeSingle() { return Promise.resolve({ data: state.row, error: null }); },
      update(patch) { state.updates.push(patch); return { eq: () => Promise.resolve({ error: null }) }; },
    }),
  },
  supabase: {},
}));

const engine = require('../../services/email/communicationEngine');
beforeEach(() => { state.row = null; state.updates = []; });

test('delivered event stamps status=delivered + delivered_at', async () => {
  state.row = { id: 'log1', status: 'sent' };
  const r = await engine.recordEmailLogDelivery({ providerMessageId: 'rs_1', event: 'email.delivered' });
  expect(r.matched).toBe(true);
  expect(state.updates[0].status).toBe('delivered');
  expect(state.updates[0].delivered_at).toBeTruthy();
});

test('bounced event stamps status=bounced + bounced_at', async () => {
  state.row = { id: 'log2', status: 'sent' };
  await engine.recordEmailLogDelivery({ providerMessageId: 'rs_2', event: 'email.complained' });
  expect(state.updates[0].status).toBe('bounced');
  expect(state.updates[0].bounced_at).toBeTruthy();
});

test('a bounced row is terminal — a later delivered does not overwrite it', async () => {
  state.row = { id: 'log3', status: 'bounced' };
  await engine.recordEmailLogDelivery({ providerMessageId: 'rs_3', event: 'email.delivered' });
  expect(state.updates).toHaveLength(0);
});

test('unmatched id or non-delivery event no-ops', async () => {
  state.row = null; // no match
  expect((await engine.recordEmailLogDelivery({ providerMessageId: 'x', event: 'email.delivered' })).matched).toBe(false);
  state.row = { id: 'log4', status: 'sent' };
  await engine.recordEmailLogDelivery({ providerMessageId: 'rs_4', event: 'email.opened' }); // not mapped
  expect(state.updates).toHaveLength(0);
});

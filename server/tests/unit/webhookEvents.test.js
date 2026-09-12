// recordDeliveryEvent — lead-level engagement fires even without a crm_message
// (campaign blasts log to email_logs, not crm_messages) + click→follow-up task.
const state = { crmMessage: null, lead: null, inserts: [], updates: [] };
const openAutoCalls = [];

jest.mock('../../services/aisensyService', () => ({ normalizePhone: (p) => p }));
jest.mock('../../services/crm/followUpService', () => ({
  openAuto: (args) => { openAutoCalls.push(args); return Promise.resolve({ id: 'task1' }); },
}));
jest.mock('../../config/supabase', () => {
  const build = (table) => {
    const b = {
      select() { return b; },
      eq() { return b; },
      order() { return b; },
      limit() { return b; },
      maybeSingle() {
        if (table === 'crm_messages') return Promise.resolve({ data: state.crmMessage, error: null });
        if (table === 'leads') return Promise.resolve({ data: state.lead, error: null });
        return Promise.resolve({ data: null, error: null });
      },
      insert(row) { state.inserts.push({ table, row }); return Promise.resolve({ error: null }); },
      update(patch) { return { eq: (col, val) => { state.updates.push({ table, patch, col, val }); return Promise.resolve({ error: null }); } }; },
    };
    return b;
  };
  return { supabaseAdmin: { from: (t) => build(t) }, supabase: {} };
});

const { recordDeliveryEvent } = require('../../services/crm/webhookEvents');
const insertsTo = (t) => state.inserts.filter((i) => i.table === t);
const updatesTo = (t) => state.updates.filter((u) => u.table === t);
beforeEach(() => { state.crmMessage = null; state.lead = null; state.inserts = []; state.updates = []; openAutoCalls.length = 0; });

test('campaign open with no crm_message still stamps lead engagement + activity', async () => {
  state.lead = { id: 'lead1', status: 'list', converted_at: null }; // cold lead, no crm_message
  const r = await recordDeliveryEvent({ channel: 'email', event: 'email.opened', providerMessageId: 'rs_x', email: 'a@b.com' });
  expect(r.matched).toBe(true);
  expect(updatesTo('leads')[0].patch.last_engaged_at).toBeTruthy();
  expect(insertsTo('lead_activities')[0].row.type).toBe('email_opened');
  expect(insertsTo('crm_message_events')).toHaveLength(0); // no message row exists
  expect(openAutoCalls).toHaveLength(0); // opens don't open a task
});

test('campaign click by a not-converted lead opens an idempotent follow-up task', async () => {
  state.lead = { id: 'lead1', status: 'list', converted_at: null };
  await recordDeliveryEvent({ channel: 'email', event: 'email.clicked', providerMessageId: 'rs_x', email: 'a@b.com' });
  expect(insertsTo('lead_activities')[0].row.type).toBe('email_clicked');
  expect(openAutoCalls).toHaveLength(1);
  expect(openAutoCalls[0].key).toBe('auto:campaign-click');
  expect(openAutoCalls[0].leadId).toBe('lead1');
});

test('a click by a converted (paying) lead does NOT open a task', async () => {
  state.lead = { id: 'lead1', status: 'paid', converted_at: '2026-01-01T00:00:00Z' };
  await recordDeliveryEvent({ channel: 'email', event: 'email.clicked', email: 'a@b.com' });
  expect(openAutoCalls).toHaveLength(0);
});

test('a bounce with no crm_message suppresses the contact by email (compliance)', async () => {
  state.lead = null; // not even a lead — still suppress the contact address
  const r = await recordDeliveryEvent({ channel: 'email', event: 'email.bounced', email: 'a@b.com' });
  expect(r.matched).toBe(false);
  const supp = updatesTo('contacts')[0];
  expect(supp.patch.email_suppressed).toBe(true);
  expect(supp.col).toBe('email');
});

'use strict';
// Cold Calling extras: per-lead WhatsApp tracking link, signup setup steps, best hour
// to call, the callback-reminder cron and the 6 pm recap email.
const mockCalls = [];
let mockData = {};
function mockChain(table) {
  const o = { _table: table, _ops: [] };
  for (const m of ['select', 'eq', 'in', 'gte', 'lt', 'lte', 'is', 'not', 'neq', 'or', 'ilike', 'like', 'order', 'limit', 'range', 'maybeSingle', 'single']) {
    o[m] = jest.fn((...a) => { o._ops.push([m, ...a]); return o; });
  }
  o.update = jest.fn((p) => { o._ops.push(['update', p]); return o; });
  o.then = (res) => { mockCalls.push(o); return Promise.resolve(typeof mockData[table] === 'function' ? mockData[table](o) : (mockData[table] || { data: [], error: null })).then(res); };
  return o;
}
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn((t) => mockChain(t)) } }));
jest.mock('../../services/crm/leadService', () => ({ getLead: jest.fn() }));
jest.mock('../../services/crm/followUpService', () => ({ listOpen: jest.fn(), complete: jest.fn(), create: jest.fn() }));
jest.mock('../../services/crm/messageService', () => ({ enqueue: jest.fn() }));
jest.mock('../../services/crm/listService', () => ({ createList: jest.fn() }));
jest.mock('../../services/crm/activity', () => ({ logActivity: jest.fn() }));
jest.mock('../../utils/sendEmail', () => jest.fn());

const leadService = require('../../services/crm/leadService');
const messageService = require('../../services/crm/messageService');
const { logActivity } = require('../../services/crm/activity');
const sendEmail = require('../../utils/sendEmail');
const r = require('../../services/crm/coldCallRules');
const svc = require('../../services/crm/coldCallService');

const NOW = new Date('2026-10-06T12:30:00Z'); // 18:00 IST
const LEAD = { id: '40e43eb5-2511-433b-930c-62af03cb2a90', business_name: 'Bloom', phone: '9876543210', attributes: {} };
beforeEach(() => {
  jest.clearAllMocks(); mockCalls.length = 0; mockData = {};
  messageService.enqueue.mockImplementation(async () => ({ status: 'queued', created_at: NOW.toISOString() }));
});

describe('rules', () => {
  test('refCode ↔ refRange round-trips to an id range that contains the lead', () => {
    const code = r.refCode(LEAD.id);
    expect(code).toBe('40e43eb52511');
    const [lo, hi] = r.refRange(code);
    expect(lo <= LEAD.id && LEAD.id <= hi).toBe(true);
    expect(r.refRange('nope')).toBeNull();
    expect(r.refRange("40e43eb5251'")).toBeNull();
  });
  test('hourMix buckets calls by IST hour, connected excludes no-answer', () => {
    expect(r.hourMix([
      { meta: { outcome: 'interested' }, occurred_at: '2026-10-06T05:40:00Z' }, // 11:10 IST
      { meta: { outcome: 'no_answer' }, occurred_at: '2026-10-06T05:10:00Z' },  // 10:40 IST
      { meta: { outcome: 'not_now' }, occurred_at: '2026-10-06T05:50:00Z' },
      { meta: {}, occurred_at: '2026-10-06T05:50:00Z' },
    ])).toEqual([{ hour: 10, calls: 1, connected: 0 }, { hour: 11, calls: 2, connected: 2 }]);
  });
  test('setupSteps marks what a new host has done', () => {
    const s = r.setupSteps({ profile: { onboarding_completed: true }, services: 1, bookings: 0 });
    expect(s.filter((x) => !x.done).map((x) => x.key)).toEqual(['photo', 'booking']);
  });
  test('istHour', () => expect(r.istHour(NOW)).toBe(18));
});

describe('trackClick', () => {
  test('bad code never touches the DB', async () => {
    expect(await svc.trackClick('../etc')).toBe(false);
    expect(mockCalls).toHaveLength(0);
  });
  test('logs link_clicked on the lead found by id range', async () => {
    mockData = { leads: { data: { id: LEAD.id }, error: null } };
    expect(await svc.trackClick('40e43eb52511')).toBe(true);
    expect(mockCalls[0]._ops).toEqual(expect.arrayContaining([['gte', 'id', '40e43eb5-2511-0000-0000-000000000000'], ['lte', 'id', '40e43eb5-2511-ffff-ffff-ffffffffffff']]));
    expect(logActivity).toHaveBeenCalledWith(LEAD.id, 'link_clicked', expect.any(Object));
  });
});

describe('WhatsApp link button', () => {
  test('a template with a button variable sends the lead code as buttonParams, not a body param', async () => {
    leadService.getLead.mockResolvedValue(LEAD);
    mockData = { crm_templates: { data: { channel: 'whatsapp', name: 'Cold Call Missed - Vendor', is_active: true, variables: [{ key: 'business_name' }, { key: 'link_code', button: true }] } } };
    await svc.send(LEAD.id, { whatsapp: { category: 'cold_call_missed' } }, 'adm', NOW);
    expect(messageService.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      templateKey: 'Cold Call Missed - Vendor',
      variables: { params: ['{{business_name}}'], buttonParams: ['40e43eb52511'] },
    }));
  });
});

describe('callbackReminders', () => {
  test('does nothing until the template is approved', async () => {
    mockData = { crm_templates: { data: { is_active: false } } };
    expect(await svc.callbackReminders(NOW)).toEqual({ sent: 0 });
    expect(messageService.enqueue).not.toHaveBeenCalled();
  });
  test('sends once per callback, keyed on its due time', async () => {
    leadService.getLead.mockResolvedValue(LEAD);
    mockData = {
      crm_templates: (o) => (o._ops.some(([m, v]) => m === 'select' && v === 'is_active')
        ? { data: { is_active: true } }
        : { data: { channel: 'whatsapp', name: 'Cold Call Callback Reminder - Vendor', is_active: true, variables: [{ key: 'business_name' }, { key: 'callback_time' }] } }),
      lead_follow_ups: { data: [{ lead_id: LEAD.id, due_at: '2026-10-06T12:45:00.000Z' }] },
    };
    expect(await svc.callbackReminders(NOW)).toEqual({ sent: 1 });
    const call = messageService.enqueue.mock.calls[0][0];
    expect(call.idempotencyKey).toBe(`cold:${LEAD.id}:cb_reminder:whatsapp:2026-10-06:2026-10-06T12:45:00.000Z`);
    expect(call.variables.params[1]).toMatch(/6:15/);
  });
});

describe('dailyRecap', () => {
  test('skips a day with no calls and no callbacks', async () => {
    expect(await svc.dailyRecap(NOW)).toMatchObject({ sent: false });
    expect(sendEmail).not.toHaveBeenCalled();
  });
  test('emails the day and tomorrow\'s callbacks', async () => {
    mockData = {
      lead_activities: (o) => (o._ops.some(([m, v]) => m === 'eq' && v === 'type')
        ? { data: [{ meta: { outcome: 'interested' }, occurred_at: '2026-10-06T06:00:00Z' }, { meta: { outcome: 'no_answer' }, occurred_at: '2026-10-06T07:00:00Z' }] }
        : { data: [] }),
      lead_follow_ups: { data: [{ lead_id: 'B', due_at: '2026-10-07T05:30:00.000Z', title: 'Callback: x' }] },
      leads: { data: [{ id: 'B', business_name: 'Sunrise <Dental>' }] },
    };
    expect(await svc.dailyRecap(NOW)).toEqual({ sent: true });
    const mail = sendEmail.mock.calls[0][0];
    expect(mail.to).toBe('bookasloth@gmail.com');
    expect(mail.subject).toBe('Cold calling today: 2 calls · 1 interested');
    expect(mail.html).toContain('Sunrise &lt;Dental&gt;');
  });
});

describe('reports', () => {
  test('includes calls by hour', async () => {
    mockData = { lead_activities: { data: [{ lead_id: 'A', meta: { outcome: 'interested' }, occurred_at: '2026-10-06T05:40:00Z' }], error: null } };
    const out = await svc.reports({ days: 7 }, NOW);
    expect(out.byHour).toEqual([{ hour: 11, calls: 1, connected: 1 }]);
  });
});

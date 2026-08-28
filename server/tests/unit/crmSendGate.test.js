// CRM send gate — the safety checkpoint every outbound send passes.
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../services/featureFlags', () => ({ isFeatureEnabled: jest.fn() }));

const { supabaseAdmin } = require('../../config/supabase');
const featureFlags = require('../../services/featureFlags');
const { canSend, validEmail } = require('../../services/crm/sendGate');

// from(table) → chain resolving maybeSingle() to the row registered for that table.
const rows = {};
const chain = (table) => ({
  select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: rows[table] ?? null }) }) }),
});

beforeEach(() => {
  jest.clearAllMocks();
  for (const k of Object.keys(rows)) delete rows[k];
  supabaseAdmin.from.mockImplementation(chain);
  featureFlags.isFeatureEnabled.mockResolvedValue(true); // switch ON by default
});

test('kill-switch OFF blocks every send (fail-closed master gate)', async () => {
  featureFlags.isFeatureEnabled.mockResolvedValue(false);
  const r = await canSend({ email: 'a@b.com' }, 'email');
  expect(r).toEqual({ ok: false, reason: 'sends_disabled' });
});

test('do_not_contact flag blocks send', async () => {
  const r = await canSend({ email: 'a@b.com', do_not_contact: true }, 'email');
  expect(r.reason).toBe('do_not_contact');
});

test('status do_not_contact blocks send', async () => {
  const r = await canSend({ phone: '9876543210', status: 'do_not_contact' }, 'whatsapp');
  expect(r.reason).toBe('do_not_contact');
});

test('invalid phone blocks WhatsApp', async () => {
  const r = await canSend({ phone: '123' }, 'whatsapp');
  expect(r.reason).toBe('invalid_phone');
});

test('invalid email blocks email', async () => {
  const r = await canSend({ email: 'not-an-email' }, 'email');
  expect(r.reason).toBe('invalid_email');
});

test('unsubscribed email blocks send', async () => {
  rows.email_unsubscribes = { email: 'a@b.com' };
  const r = await canSend({ email: 'a@b.com' }, 'email');
  expect(r.reason).toBe('email_unsubscribed');
});

test('suppressed contact blocks that channel', async () => {
  rows.contacts = { email_suppressed: true, whatsapp_suppressed: false };
  const r = await canSend({ email: 'a@b.com' }, 'email');
  expect(r.reason).toBe('email_suppressed');
});

test('clean email lead passes', async () => {
  const r = await canSend({ email: 'a@b.com' }, 'email');
  expect(r).toEqual({ ok: true });
});

test('clean WhatsApp lead passes', async () => {
  const r = await canSend({ phone: '9876543210' }, 'whatsapp');
  expect(r).toEqual({ ok: true });
});

test('validEmail helper', () => {
  expect(validEmail('x@y.com')).toBe(true);
  expect(validEmail('x@y')).toBe(false);
  expect(validEmail('')).toBe(false);
});

// ── Coordinated-conversation throttle (automated sends only) ────────────────
// crm_messages count chain: from().select(id,{count}).eq().in(status,[…]).gte() → { count }.
// Captures the status list passed to .in() so we can assert delivered/read count too.
let capturedStatuses = null;
const countChain = (count) => ({
  select: () => ({ eq: () => ({ in: (_col, vals) => { capturedStatuses = vals; return { gte: () => Promise.resolve({ count }) }; } }) }),
});
// Route crm_messages to a count chain (n prior sends in window); everything else
// to the normal maybeSingle chain.
const withRecentSends = (n) =>
  supabaseAdmin.from.mockImplementation((t) => (t === 'crm_messages' ? countChain(n) : chain(t)));
beforeEach(() => { capturedStatuses = null; });

const IST_NOON = new Date('2025-01-15T06:30:00Z');  // 12:00 IST — inside window
const IST_NIGHT = new Date('2025-01-15T17:00:00Z'); // 22:30 IST — outside window
afterEach(() => jest.useRealTimers());

test('automated send is frequency-capped when a message went out in the last 48h', async () => {
  jest.useFakeTimers().setSystemTime(IST_NOON);
  withRecentSends(1);
  const r = await canSend({ id: 'L1', phone: '9876543210' }, 'whatsapp', { automated: true });
  expect(r).toEqual({ ok: false, reason: 'frequency_capped', defer: true });
});

test('the cap counts delivered/read too, not only sent (webhook-advanced messages still count)', async () => {
  jest.useFakeTimers().setSystemTime(IST_NOON);
  withRecentSends(1);
  await canSend({ id: 'L1', phone: '9876543210' }, 'whatsapp', { automated: true });
  expect(capturedStatuses).toEqual(expect.arrayContaining(['sent', 'delivered', 'read']));
});

test('automated send passes when no recent message and inside window', async () => {
  jest.useFakeTimers().setSystemTime(IST_NOON);
  withRecentSends(0);
  const r = await canSend({ id: 'L1', phone: '9876543210' }, 'whatsapp', { automated: true });
  expect(r).toEqual({ ok: true });
});

test('automated send is deferred outside quiet hours (before the cap query)', async () => {
  jest.useFakeTimers().setSystemTime(IST_NIGHT);
  withRecentSends(0);
  const r = await canSend({ id: 'L1', phone: '9876543210' }, 'whatsapp', { automated: true });
  expect(r).toEqual({ ok: false, reason: 'quiet_hours', defer: true });
});

test('human composer send is EXEMPT from cap + quiet hours', async () => {
  jest.useFakeTimers().setSystemTime(IST_NIGHT); // night AND recent send present
  withRecentSends(5);
  const r = await canSend({ id: 'L1', phone: '9876543210' }, 'whatsapp'); // automated omitted → false
  expect(r).toEqual({ ok: true });
});

test('cap query failure fails OPEN (send proceeds)', async () => {
  jest.useFakeTimers().setSystemTime(IST_NOON);
  supabaseAdmin.from.mockImplementation((t) =>
    t === 'crm_messages'
      ? ({ select: () => ({ eq: () => ({ in: () => ({ gte: () => { throw new Error('db down'); } }) }) }) })
      : chain(t));
  const r = await canSend({ id: 'L1', phone: '9876543210' }, 'whatsapp', { automated: true });
  expect(r).toEqual({ ok: true });
});

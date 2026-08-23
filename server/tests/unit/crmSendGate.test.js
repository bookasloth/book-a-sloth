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

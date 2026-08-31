/**
 * /be-a-sloth "Book a Demo" lead form — the security-critical guarantees:
 *  - a lead is NEVER created without a valid OTP,
 *  - a verified submit routes through the SHARED ingestion layer (safeUpsertLead)
 *    with source 'website',
 *  - the honeypot silently drops bots.
 */
jest.mock('../../utils/otpStore', () => ({
  generate: jest.fn(() => '123456'),
  set: jest.fn(async () => ({ ok: true })),
  verify: jest.fn(),
}));
jest.mock('../../utils/notify', () => ({ sendOtpNotification: jest.fn(async () => {}) }));
jest.mock('../../services/aisensyService', () => ({
  normalizePhone: (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : null),
}));
jest.mock('../../services/crm/leadService', () => ({ safeUpsertLead: jest.fn() }));
jest.mock('../../services/crm/intentEvents', () => ({ record: jest.fn(async () => {}) }));
jest.mock('../../utils/httpError', () => ({ safeError: (res, e) => res.status(500).json({ error: e.message }) }));

const otpStore = require('../../utils/otpStore');
const { safeUpsertLead } = require('../../services/crm/leadService');
const { submitLead } = require('../../controllers/beASlothLeadController');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};
const base = { name: 'Aditi', phone: '9876543210', profession: 'Coach', otp: '123456' };

beforeEach(() => {
  jest.clearAllMocks();
  safeUpsertLead.mockResolvedValue({ lead: { id: 'lead-1' }, created: true });
});

test('no lead is created when the OTP is invalid', async () => {
  otpStore.verify.mockResolvedValue({ valid: false, reason: 'Invalid OTP.' });
  const res = mockRes();
  await submitLead({ body: base, headers: {} }, res);
  expect(safeUpsertLead).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(400);
});

test('a verified submit creates a CRM lead via the shared layer with source=website', async () => {
  otpStore.verify.mockResolvedValue({ valid: true });
  const res = mockRes();
  await submitLead({ body: base, headers: {} }, res);
  expect(safeUpsertLead).toHaveBeenCalledTimes(1);
  const [patch, opts] = safeUpsertLead.mock.calls[0];
  expect(patch).toMatchObject({ name: 'Aditi', phone: '9876543210', profession: 'Coach' });
  expect(opts.source).toBe('website');
  expect(res.status).toHaveBeenCalledWith(201);
});

test('missing required fields are rejected before any OTP check', async () => {
  const res = mockRes();
  await submitLead({ body: { ...base, name: '' }, headers: {} }, res);
  expect(otpStore.verify).not.toHaveBeenCalled();
  expect(safeUpsertLead).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(400);
});

test('honeypot submissions are silently dropped without creating a lead', async () => {
  const res = mockRes();
  await submitLead({ body: { ...base, company_hp: 'bot' }, headers: {} }, res);
  expect(safeUpsertLead).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(201);
});

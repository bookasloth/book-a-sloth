jest.mock('../../config/google', () => ({ updateCalendarEvent: jest.fn().mockResolvedValue({}), createCalendarEvent: jest.fn() }));
jest.mock('../../services/featureFlags', () => ({ isFeatureEnabled: jest.fn() }));
jest.mock('../../utils/cryptoTokens', () => ({ decryptToken: (v) => v, decrypt: (v) => v }));
jest.mock('../../services/notificationEngine', () => ({ send: jest.fn().mockResolvedValue() }));
const mockPostSafe = jest.fn().mockResolvedValue({});
jest.mock('../../services/ledger/postingService', () => ({ postSafe: (...a) => mockPostSafe(...a) }));
const mockVerifySignature = jest.fn().mockReturnValue(true);
jest.mock('../../utils/razorpaySignature', () => ({ verifySignature: (...a) => mockVerifySignature(...a) }));

const featureFlags = require('../../services/featureFlags');
const mockFrom = jest.fn();
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: (...a) => mockFrom(...a) } }));
const { rescheduleBooking } = require('../../controllers/bookingController');

const res = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };
const future = '2099-01-01T05:00:00.000Z';
const req = (body) => ({ params: { id: 'b1' }, user: { id: 'g1' }, body, protocol: 'http', get: () => 'localhost' });
const mk = (count, fee) => ({
  id: 'b1', host_id: 'h1', guest_id: 'g1', status: 'confirmed', reschedule_count: count,
  scheduled_at: '2098-12-01T05:00:00.000Z', services: { duration: 30, grace_period_minutes: 10 },
  google_event_id: null,
  'profiles!bookings_host_id_fkey': { id: 'h1', reschedule_fee: fee },
});
const wire = (b) => mockFrom.mockImplementation(() => {
  const c = { select: jest.fn(() => c), eq: jest.fn(() => c), neq: jest.fn(() => c), gte: jest.fn(() => c),
    lte: jest.fn(() => c), order: jest.fn(() => c), update: jest.fn(() => c),
    single: jest.fn().mockResolvedValue({ data: b, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: { timezone: 'Asia/Kolkata', buffer_minutes: 0 } }),
    then: (resolve) => resolve({ data: [], error: null }) };
  return c;
});

beforeEach(() => { jest.clearAllMocks(); featureFlags.isFeatureEnabled.mockResolvedValue(true); });

test('1st guest reschedule is free even if vendor fee=10', async () => {
  wire(mk(0, 10));
  const r = res();
  await rescheduleBooking(req({ scheduled_at: future }), r);
  expect(r.status).not.toHaveBeenCalledWith(402);
  expect(mockPostSafe).not.toHaveBeenCalled();
});

test('2nd reschedule with fee=10 and no payment → 402', async () => {
  wire(mk(1, 10));
  const r = res();
  await rescheduleBooking(req({ scheduled_at: future }), r);
  expect(r.status).toHaveBeenCalledWith(402);
});

test('2nd reschedule with fee=10 + valid payment → posts ledger', async () => {
  wire(mk(1, 10));
  const r = res();
  await rescheduleBooking(req({ scheduled_at: future, fee_payment_id: 'p', fee_order_id: 'o', fee_signature: 's' }), r);
  expect(mockVerifySignature).toHaveBeenCalled();
  expect(mockPostSafe).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 'RESCHEDULE_FEE' }));
});

test('2nd reschedule but reschedule_fee flag off → free', async () => {
  featureFlags.isFeatureEnabled.mockImplementation((k) => Promise.resolve(k !== 'reschedule_fee'));
  wire(mk(1, 10));
  const r = res();
  await rescheduleBooking(req({ scheduled_at: future }), r);
  expect(r.status).not.toHaveBeenCalledWith(402);
});

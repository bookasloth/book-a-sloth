// Unit tests for financeAdminController.executeRefund — the admin "execute a real
// Razorpay refund" path. All external deps mocked; nothing leaves the process.

jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../services/auditService', () => ({ audit: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../services/ledger/journalTemplates', () => ({
  adjustmentEntry: jest.fn(), reversalEntry: jest.fn(), bankTransferEntry: jest.fn(),
}));
jest.mock('../../services/ledger/postingService', () => ({ post: jest.fn().mockResolvedValue('je-1') }));
jest.mock('../../services/bookingCapture', () => ({
  recordBookingRefund: jest.fn().mockResolvedValue({ posted: true, transferReversed: true }),
}));
jest.mock('../../services/razorpayConfig', () => ({ getClient: jest.fn() }));
jest.mock('../../utils/httpError', () => ({ safeError: (res, e) => res.status(500).json({ message: e.message }) }));

const { supabaseAdmin } = require('../../config/supabase');
const razorpayConfig = require('../../services/razorpayConfig');
const { recordBookingRefund } = require('../../services/bookingCapture');
const { executeRefund } = require('../../controllers/financeAdminController');

// Terminal .maybeSingle resolves `resolved`; .update(...).eq(...) resolves {error:null}.
const selChain = (resolved) => ({
  select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue(resolved),
});
const updChain = () => ({ update: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) });

const mkRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const mkClient = ({ amount_refunded = 0 } = {}) => ({
  payments: {
    fetch:  jest.fn().mockResolvedValue({ amount_refunded }),
    refund: jest.fn().mockResolvedValue({ id: 'rfnd_1' }),
  },
});

// A paid booking 48h out: service price 500, guest paid 590 (fee+GST), payout still held.
const booking = {
  id: 'b1', razorpay_payment_id: 'pay_1', payment_status: 'paid', transfer_status: 'pending',
  customer_total: 590, scheduled_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  services: { price: 500 },
};

beforeEach(() => jest.clearAllMocks());

test('tiered ≥24h refunds the full service price and records the refund', async () => {
  supabaseAdmin.from.mockReturnValueOnce(selChain({ data: booking, error: null }));
  const client = mkClient();
  razorpayConfig.getClient.mockResolvedValue(client);
  const res = mkRes();

  await executeRefund({ body: { booking_id: 'b1', mode: 'tiered' } }, res);

  expect(client.payments.refund).toHaveBeenCalledWith('pay_1', expect.objectContaining({ amount: 50000 })); // ₹500
  expect(recordBookingRefund).toHaveBeenCalledWith(expect.objectContaining({ refundAmountPaise: 50000, refundId: 'rfnd_1', reverseTransfer: true }));
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, amount: 500, refund_id: 'rfnd_1' }));
});

test('tiered 6–24h refunds 50% of the service price', async () => {
  const b = { ...booking, scheduled_at: new Date(Date.now() + 10 * 3600 * 1000).toISOString() };
  supabaseAdmin.from.mockReturnValueOnce(selChain({ data: b, error: null }));
  const client = mkClient();
  razorpayConfig.getClient.mockResolvedValue(client);
  const res = mkRes();

  await executeRefund({ body: { booking_id: 'b1', mode: 'tiered' } }, res);

  expect(client.payments.refund).toHaveBeenCalledWith('pay_1', expect.objectContaining({ amount: 25000 })); // ₹250
});

test('tiered <6h is not eligible — no Razorpay call, 400', async () => {
  const b = { ...booking, scheduled_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString() };
  supabaseAdmin.from.mockReturnValueOnce(selChain({ data: b, error: null }));
  const client = mkClient();
  razorpayConfig.getClient.mockResolvedValue(client);
  const res = mkRes();

  await executeRefund({ body: { booking_id: 'b1', mode: 'tiered' } }, res);

  expect(res.status).toHaveBeenCalledWith(400);
  expect(client.payments.refund).not.toHaveBeenCalled();
  expect(recordBookingRefund).not.toHaveBeenCalled();
});

test('full mode refunds the entire customer_total and flags payment_status=refunded', async () => {
  supabaseAdmin.from
    .mockReturnValueOnce(selChain({ data: booking, error: null }))  // load
    .mockReturnValueOnce(updChain());                               // payment_status update
  const client = mkClient();
  razorpayConfig.getClient.mockResolvedValue(client);
  const res = mkRes();

  await executeRefund({ body: { booking_id: 'b1', mode: 'full' } }, res);

  expect(client.payments.refund).toHaveBeenCalledWith('pay_1', expect.objectContaining({ amount: 59000 })); // ₹590
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true, amount: 590, payment_status: 'refunded' }));
});

test('blocks when the host payout is already settled (never absorb) — 409, no refund', async () => {
  supabaseAdmin.from.mockReturnValueOnce(selChain({ data: { ...booking, transfer_status: 'processed' }, error: null }));
  const client = mkClient();
  razorpayConfig.getClient.mockResolvedValue(client);
  const res = mkRes();

  await executeRefund({ body: { booking_id: 'b1', mode: 'full' } }, res);

  expect(res.status).toHaveBeenCalledWith(409);
  expect(razorpayConfig.getClient).not.toHaveBeenCalled();
  expect(client.payments.refund).not.toHaveBeenCalled();
});

test('blocks a double refund when Razorpay reports amount already refunded — 409', async () => {
  supabaseAdmin.from.mockReturnValueOnce(selChain({ data: booking, error: null }));
  razorpayConfig.getClient.mockResolvedValue(mkClient({ amount_refunded: 10000 }));
  const res = mkRes();

  await executeRefund({ body: { booking_id: 'b1', mode: 'tiered' } }, res);

  expect(res.status).toHaveBeenCalledWith(409);
  expect(recordBookingRefund).not.toHaveBeenCalled();
});

test('404 when the booking does not exist', async () => {
  supabaseAdmin.from.mockReturnValueOnce(selChain({ data: null, error: null }));
  const res = mkRes();
  await executeRefund({ body: { booking_id: 'nope', mode: 'tiered' } }, res);
  expect(res.status).toHaveBeenCalledWith(404);
});

test('400 when the booking is not paid', async () => {
  supabaseAdmin.from.mockReturnValueOnce(selChain({ data: { ...booking, payment_status: 'unpaid' }, error: null }));
  const res = mkRes();
  await executeRefund({ body: { booking_id: 'b1', mode: 'tiered' } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
});

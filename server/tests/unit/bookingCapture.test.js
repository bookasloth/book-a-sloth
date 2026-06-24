/**
 * tests/unit/bookingCapture.test.js — security audit H-3.
 * The shared finaliser used by verify + webhook + reconciler: flips a captured
 * booking to paid/confirmed, finalises the vendor payout with the real Razorpay
 * fee subtracted, and posts the ledger. Uses the REAL pricingEngine so the money
 * math is actually exercised; supabase + ledger are mocked.
 */
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../services/ledger/journalTemplates', () => ({ orderPaymentEntry: jest.fn((a) => ({ description: 'ORDER_PAYMENT', lines: [], args: a })) }));
jest.mock('../../services/ledger/postingService', () => ({ postSafe: jest.fn(() => Promise.resolve('je-1')) }));

const { supabaseAdmin } = require('../../config/supabase');
const { orderPaymentEntry } = require('../../services/ledger/journalTemplates');
const { postSafe } = require('../../services/ledger/postingService');
const { calculateVendorPayout } = require('../../lib/pricingEngine');
const { finalizeBookingCapture } = require('../../services/bookingCapture');

// Update chain that captures the patch and resolves to `result` when awaited.
const chainOf = (result) => {
  const c = { patch: null };
  c.update = jest.fn((p) => { c.patch = p; return c; });
  c.eq = jest.fn(() => c);
  c.neq = jest.fn(() => c);
  c.select = jest.fn(() => c);
  c.then = (resolve) => resolve(result);
  return c;
};

const PRICING = {
  service_price: 1000, commission_applied: 200, commission_gst: 36,
  platform_fee_amount: 1, platform_fee_gst: 0.18, customer_total: 1001.18, host_id: 'h1',
};

beforeEach(() => jest.clearAllMocks());

test('finalises payout with the real fee subtracted + posts the ledger', async () => {
  const chain = chainOf({ data: [{ id: 'b1', host_id: 'h1', services: { title: 'X' } }], error: null });
  supabaseAdmin.from.mockReturnValue(chain);

  const r = await finalizeBookingCapture({
    bookingId: 'b1', paymentId: 'pay_1', feePaise: 2360, taxPaise: 360, pricing: PRICING,
  });

  // fee 2360p = ₹23.60 (incl ₹3.60 tax) → excl-tax ₹20.00
  expect(chain.patch.payment_status).toBe('paid');
  expect(chain.patch.status).toBe('confirmed');
  expect(chain.patch.razorpay_payment_id).toBe('pay_1');
  expect(chain.patch.razorpay_tax_actual).toBeCloseTo(3.6, 5);
  expect(chain.patch.razorpay_fee_actual).toBeCloseTo(20, 5);
  expect(chain.patch.vendor_amount).toBe(calculateVendorPayout(1000, 200, 36, 23.6));
  // idempotency + anti-resurrection guards present
  expect(chain.neq).toHaveBeenCalledWith('payment_status', 'paid');
  expect(chain.neq).toHaveBeenCalledWith('status', 'cancelled');
  expect(postSafe).toHaveBeenCalledTimes(1);
  expect(postSafe.mock.calls[0][0].sourceType).toBe('ORDER_PAYMENT');
  expect(r.updated.id).toBe('b1');
});

test('no fee available → payout finalises without subtracting a fee (fee=0)', async () => {
  const chain = chainOf({ data: [{ id: 'b1' }], error: null });
  supabaseAdmin.from.mockReturnValue(chain);

  await finalizeBookingCapture({ bookingId: 'b1', paymentId: 'pay_1', pricing: PRICING });

  expect(chain.patch.razorpay_fee_actual).toBe(0);
  expect(chain.patch.razorpay_tax_actual).toBe(0);
  expect(chain.patch.vendor_amount).toBe(calculateVendorPayout(1000, 200, 36, 0));
});

test('idempotent: zero rows transitioned → updated null, no ledger post', async () => {
  const chain = chainOf({ data: [], error: null });
  supabaseAdmin.from.mockReturnValue(chain);

  const r = await finalizeBookingCapture({ bookingId: 'b1', paymentId: 'pay_1', feePaise: 100, pricing: PRICING });

  expect(r.updated).toBeNull();
  expect(postSafe).not.toHaveBeenCalled();
});

test('skips the ledger for a row without a customer_total snapshot', async () => {
  const chain = chainOf({ data: [{ id: 'b1' }], error: null });
  supabaseAdmin.from.mockReturnValue(chain);

  await finalizeBookingCapture({
    bookingId: 'b1', paymentId: 'pay_1', feePaise: 100,
    pricing: { ...PRICING, customer_total: 0 },
  });

  expect(postSafe).not.toHaveBeenCalled();
});

'use strict';
/**
 * routeAutoPayoutService — Phase 2 automatic held-transfer at capture.
 *
 * Guarantees under test:
 *   • DORMANT in fee_only_mode — no transfer.
 *   • No linked account → skipped (money stays owed), NOT an error.
 *   • Creates a payment-linked HELD transfer (on_hold:true, future on_hold_until,
 *     rupees→paise) and records the id + hold time on the booking.
 *   • Idempotent; never throws.
 */
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../services/razorpayConfig', () => ({
  isConfigured: jest.fn(() => Promise.resolve(true)),
  getClient: jest.fn(),
}));
jest.mock('../../services/platformConfig', () => ({ getConfig: jest.fn() }));
jest.mock('../../utils/logger', () => ({ securityLog: jest.fn() }));

const { supabaseAdmin } = require('../../config/supabase');
const razorpayConfig = require('../../services/razorpayConfig');
const platformConfig = require('../../services/platformConfig');
const svc = require('../../services/routeAutoPayoutService');

let state;
const wireSupabase = () => {
  state = { linkedAccountId: 'acc_HOST', updates: [] };
  supabaseAdmin.from.mockImplementation((table) => {
    const c = {};
    c.select = jest.fn(() => c);
    c.eq = jest.fn(() => c);
    c.update = jest.fn((patch) => { state.updates.push(patch); return c; });
    c.maybeSingle = jest.fn(() => {
      if (table === 'kyc_submissions') return Promise.resolve({ data: { razorpay_account_id: state.linkedAccountId }, error: null });
      if (table === 'services') return Promise.resolve({ data: { duration: 30 }, error: null });
      return Promise.resolve({ data: null, error: null });
    });
    // bookings.update(...).eq(...) resolves (no maybeSingle in patchBooking)
    c.then = undefined;
    return c;
  });
  // patchBooking does update().eq() and awaits the result → make eq resolve for bookings.
  supabaseAdmin.from.mockImplementation((table) => {
    const c = {};
    c.select = jest.fn(() => c);
    c.update = jest.fn((patch) => { state.updates.push(patch); return c; });
    c.eq = jest.fn(() => table === 'bookings' ? Promise.resolve({ error: null }) : c);
    c.maybeSingle = jest.fn(() => {
      if (table === 'kyc_submissions') return Promise.resolve({ data: { razorpay_account_id: state.linkedAccountId }, error: null });
      if (table === 'services') return Promise.resolve({ data: { duration: 30 }, error: null });
      return Promise.resolve({ data: null, error: null });
    });
    return c;
  });
};
const merged = () => Object.assign({}, ...state.updates);

// A booking scheduled 2h in the future, 30-min service.
const booking = (over = {}) => ({
  id: 'bk-1', host_id: 'host-1', service_id: 'svc-1',
  scheduled_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
  services: { duration: 30 },
  razorpay_transfer_id: null,
  ...over,
});

const clientWith = (transfer) => ({ payments: { transfer: jest.fn(() => Promise.resolve({ items: [transfer] })) } });

beforeEach(() => {
  jest.clearAllMocks();
  platformConfig.getConfig.mockResolvedValue({ feeOnlyMode: false });
  wireSupabase();
});

describe('createHeldTransferForBooking gating', () => {
  test('no-op in fee_only_mode', async () => {
    platformConfig.getConfig.mockResolvedValue({ feeOnlyMode: true });
    const res = await svc.createHeldTransferForBooking(booking(), { paymentId: 'pay_1', vendorAmount: 9.28 });
    expect(res).toEqual({ ok: false, skipped: 'fee_only_mode' });
    expect(razorpayConfig.getClient).not.toHaveBeenCalled();
  });

  test('no linked account → skipped (owed), not an error', async () => {
    state.linkedAccountId = null;
    const res = await svc.createHeldTransferForBooking(booking(), { paymentId: 'pay_1', vendorAmount: 9.28 });
    expect(res).toEqual({ ok: false, skipped: 'no_linked_account' });
  });

  test('nothing owed → skipped', async () => {
    const res = await svc.createHeldTransferForBooking(booking(), { paymentId: 'pay_1', vendorAmount: 0 });
    expect(res).toEqual({ ok: false, skipped: 'no_payout_due' });
  });

  test('idempotent — booking already has a transfer', async () => {
    const res = await svc.createHeldTransferForBooking(booking({ razorpay_transfer_id: 'trf_x' }), { paymentId: 'pay_1', vendorAmount: 9.28 });
    expect(res).toMatchObject({ ok: true, skipped: 'already_transferred' });
    expect(razorpayConfig.getClient).not.toHaveBeenCalled();
  });
});

describe('createHeldTransferForBooking happy path', () => {
  test('creates a held transfer and records id + hold time', async () => {
    const client = clientWith({ id: 'trf_1', status: 'pending' });
    razorpayConfig.getClient.mockResolvedValue(client);

    const res = await svc.createHeldTransferForBooking(booking(), { paymentId: 'pay_1', vendorAmount: 9.28 });
    expect(res).toMatchObject({ ok: true, transferId: 'trf_1', status: 'pending' });

    // payment-linked transfer, held, future on_hold_until, rupees→paise
    const [paymentId, body] = client.payments.transfer.mock.calls[0];
    expect(paymentId).toBe('pay_1');
    const tr = body.transfers[0];
    expect(tr).toMatchObject({ account: 'acc_HOST', amount: 928, currency: 'INR', on_hold: true });
    expect(tr.on_hold_until).toBeGreaterThan(Math.floor(Date.now() / 1000));

    // persisted bookkeeping
    expect(merged()).toMatchObject({ razorpay_transfer_id: 'trf_1', transfer_status: 'pending' });
    expect(merged().transfer_hold_until).toBeTruthy();
  });

  test('a Razorpay error is swallowed and recorded transfer_status=failed', async () => {
    const client = { payments: { transfer: jest.fn(() => Promise.reject({ error: { description: 'transfer not allowed' } })) } };
    razorpayConfig.getClient.mockResolvedValue(client);
    const res = await svc.createHeldTransferForBooking(booking(), { paymentId: 'pay_1', vendorAmount: 9.28 });
    expect(res).toEqual({ ok: false, error: 'transfer not allowed' });
    expect(merged()).toMatchObject({ transfer_status: 'failed', transfer_error: 'transfer not allowed' });
  });
});

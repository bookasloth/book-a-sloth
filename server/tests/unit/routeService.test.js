'use strict';
/**
 * routeService.test.js — Route split math + the fee-only DORMANCY guarantee.
 * The Razorpay Route API calls themselves are sandbox-verified separately; here
 * we prove the pure math and that NOTHING fires while fee_only_mode is on.
 */

const mockGetConfig = jest.fn();
const mockTransfer = jest.fn();
const mockEdit = jest.fn();
const mockReverse = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: (...a) => mockFrom(...a) } }));
jest.mock('../../services/platformConfig', () => ({ getConfig: (...a) => mockGetConfig(...a) }));
jest.mock('../../services/razorpayConfig', () => ({
  getClient: async () => ({
    payments: { transfer: (...a) => mockTransfer(...a) },
    transfers: { edit: (...a) => mockEdit(...a), reverse: (...a) => mockReverse(...a) },
  }),
}));
jest.mock('../../utils/logger', () => ({ securityLog: jest.fn() }));

const route = require('../../services/routeService');

beforeEach(() => jest.clearAllMocks());

// ─── computeRouteSplit ───────────────────────────────────────────────────────
describe('computeRouteSplit', () => {
  test('free plan ₹1000: host 909.76, BAS retains 102.04 (fee+comm+GST+TDS+TCS)', () => {
    // customerTotal 1011.80, vendorAmount 909.76, PG 0 (unknown at this point)
    const s = route.computeRouteSplit({ customerTotal: 1011.8, vendorAmount: 909.76, razorpayFee: 0 });
    expect(s.hostTransfer).toBe(909.76);
    expect(s.hostTransferPaise).toBe(90976);
    expect(s.basRetained).toBe(102.04); // 1011.80 − 909.76
  });
  test('with PG fee, BAS retained excludes what Razorpay took', () => {
    const s = route.computeRouteSplit({ customerTotal: 1011.8, vendorAmount: 909.76, razorpayFee: 20.24 });
    expect(s.basRetained).toBe(81.8); // 1011.80 − 909.76 − 20.24
  });
});

// ─── isReleaseDue ────────────────────────────────────────────────────────────
describe('isReleaseDue', () => {
  const H = 48 * 3600 * 1000;
  test('not due before window', () => {
    expect(route.isReleaseDue({ completedAtMs: 1000, nowMs: 1000 + H - 1 })).toBe(false);
  });
  test('due at/after window', () => {
    expect(route.isReleaseDue({ completedAtMs: 1000, nowMs: 1000 + H })).toBe(true);
  });
  test('never due while a dispute is open', () => {
    expect(route.isReleaseDue({ completedAtMs: 1000, nowMs: 1000 + H * 10, disputeOpen: true })).toBe(false);
  });
  test('never due without a completion time', () => {
    expect(route.isReleaseDue({ completedAtMs: null, nowMs: Date.now() })).toBe(false);
  });
});

// ─── DORMANCY: nothing fires while fee-only mode is on ───────────────────────
describe('fee-only dormancy', () => {
  test('createHeldTransferForBooking is a no-op under fee_only_mode', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: true });
    const r = await route.createHeldTransferForBooking({ id: 'b1', host_id: 'h1', razorpay_payment_id: 'pay_1', vendor_amount: 900, customer_total: 911.8 });
    expect(r).toEqual({ skipped: 'fee_only_mode' });
    expect(mockTransfer).not.toHaveBeenCalled();
  });

  test('releaseDueRoutePayouts is a no-op under fee_only_mode', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: true });
    const r = await route.releaseDueRoutePayouts();
    expect(r).toEqual({ skipped: 'fee_only_mode', released: 0 });
    expect(mockEdit).not.toHaveBeenCalled();
  });
});

// ─── Route ON but host not onboarded → still no transfer ─────────────────────
describe('host onboarding gate', () => {
  test('no transfer when host has no razorpay_route_account_id', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: false });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: async () => ({ data: { razorpay_route_account_id: null } }) }) }),
    });
    const r = await route.createHeldTransferForBooking({ id: 'b1', host_id: 'h1', razorpay_payment_id: 'pay_1', vendor_amount: 900, customer_total: 911.8 });
    expect(r).toEqual({ skipped: 'host_not_onboarded' });
    expect(mockTransfer).not.toHaveBeenCalled();
  });

  test('no transfer when account exists but onboarding is incomplete (not active)', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: false });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: async () => ({ data: { razorpay_route_account_id: 'acc_X', razorpay_route_status: 'created' } }) }) }),
    });
    const r = await route.createHeldTransferForBooking({ id: 'b1', host_id: 'h1', razorpay_payment_id: 'pay_1', vendor_amount: 900, customer_total: 911.8 });
    expect(r).toEqual({ skipped: 'onboarding_incomplete' });
    expect(mockTransfer).not.toHaveBeenCalled();
  });
});

// ─── Route ON + onboarded → creates a HELD transfer ──────────────────────────
describe('active Route path', () => {
  test('creates an on-hold transfer to the linked account and marks held', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: false });
    const updateSpy = jest.fn(() => ({ eq: async () => ({}) }));
    mockFrom.mockImplementation((table) => {
      if (table === 'profiles') return { select: () => ({ eq: () => ({ single: async () => ({ data: { razorpay_route_account_id: 'acc_XYZ', razorpay_route_status: 'active' } }) }) }) };
      return { update: updateSpy };
    });
    mockTransfer.mockResolvedValue({ items: [{ id: 'trf_123' }] });

    const r = await route.createHeldTransferForBooking({
      id: 'b1', host_id: 'h1', razorpay_payment_id: 'pay_1',
      vendor_amount: 909.76, customer_total: 1011.8, razorpay_fee_actual: 20, razorpay_tax_actual: 0.24,
    });
    expect(mockTransfer).toHaveBeenCalledWith('pay_1', {
      transfers: [{ account: 'acc_XYZ', amount: 90976, currency: 'INR', on_hold: true, notes: { booking_id: 'b1', host_id: 'h1' } }],
    });
    expect(r).toEqual({ transferId: 'trf_123', status: 'held' });
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ route_transfer_id: 'trf_123', route_payout_status: 'held' }));
  });

  test('a Route API failure is non-fatal and marks failed (never throws)', async () => {
    mockGetConfig.mockResolvedValue({ feeOnlyMode: false });
    const updateSpy = jest.fn(() => ({ eq: async () => ({}) }));
    mockFrom.mockImplementation((table) => {
      if (table === 'profiles') return { select: () => ({ eq: () => ({ single: async () => ({ data: { razorpay_route_account_id: 'acc_XYZ', razorpay_route_status: 'active' } }) }) }) };
      return { update: updateSpy };
    });
    mockTransfer.mockRejectedValue(new Error('razorpay 500'));

    const r = await route.createHeldTransferForBooking({
      id: 'b1', host_id: 'h1', razorpay_payment_id: 'pay_1', vendor_amount: 900, customer_total: 911.8,
    });
    expect(r).toEqual({ error: 'razorpay 500' });
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ route_payout_status: 'failed' }));
  });
});

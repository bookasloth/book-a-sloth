'use strict';

jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../services/razorpayConfig', () => ({ getClient: jest.fn() }));
jest.mock('../../services/platformConfig', () => ({ getConfig: jest.fn() }));
jest.mock('../../services/payoutEligibility', () => ({ isPayoutEligible: jest.fn() }));
jest.mock('../../services/routeAutoPayoutService', () => ({
  createHeldTransferForBooking: jest.fn(),
  finalizeReleasedTransfer: jest.fn(),
}));
jest.mock('../../utils/adminAlert', () => ({ adminAlert: jest.fn(() => Promise.resolve({ sent: true })) }));
jest.mock('../../utils/logger', () => ({ securityLog: jest.fn() }));

const { supabaseAdmin } = require('../../config/supabase');
const razorpayConfig = require('../../services/razorpayConfig');
const platformConfig = require('../../services/platformConfig');
const { isPayoutEligible } = require('../../services/payoutEligibility');
const routeAuto = require('../../services/routeAutoPayoutService');
const { adminAlert } = require('../../utils/adminAlert');
const { reconcile } = require('../../services/payoutReconciler');

// Read terminals resolve from readQueue in order (owed list, then stuck list);
// any chain that calls .update() resolves as a write ({error:null}).
let readQueue = [];
const makeChain = () => {
  const c = { _write: false };
  for (const m of ['select', 'eq', 'is', 'not', 'lt', 'limit']) c[m] = jest.fn(() => c);
  c.update = jest.fn(() => { c._write = true; return c; });
  c.then = (resolve) => resolve(c._write ? { data: null, error: null } : (readQueue.shift() || { data: [] }));
  return c;
};

const setReads = (...results) => { readQueue = results.map((data) => ({ data })); };

beforeEach(() => {
  jest.clearAllMocks();
  readQueue = [];
  supabaseAdmin.from.mockImplementation(() => makeChain());
  razorpayConfig.getClient.mockResolvedValue({ transfers: { fetch: jest.fn() } });
});

const owedBooking = (o = {}) => ({
  id: 'bk1', host_id: 'h1', scheduled_at: new Date().toISOString(), service_id: 'svc1',
  razorpay_payment_id: 'pay_1', vendor_amount: 10, settlement_status: 'eligible_for_settlement',
  transfer_status: null, transfer_attempts: 0, services: { duration: 30 }, ...o,
});

test('mode "off" is a no-op — no queries, no money, no alert', async () => {
  platformConfig.getConfig.mockResolvedValue({ payoutReconcilerMode: 'off' });
  const r = await reconcile();
  expect(r.skipped).toBe('off');
  expect(supabaseAdmin.from).not.toHaveBeenCalled();
  expect(routeAuto.createHeldTransferForBooking).not.toHaveBeenCalled();
  expect(adminAlert).not.toHaveBeenCalled();
});

test('observe: owed money to an INELIGIBLE host is counted + alerted, but NO transfer is created', async () => {
  platformConfig.getConfig.mockResolvedValue({ payoutReconcilerMode: 'observe' });
  isPayoutEligible.mockResolvedValue({ eligible: false, reasons: ['not_activated'] });
  setReads([owedBooking()], []); // owed, stuck
  const r = await reconcile();
  expect(r.owedBlocked).toBe(1);
  expect(r.owedBlockedSum).toBe(10);
  expect(r.created).toBe(0);
  expect(routeAuto.createHeldTransferForBooking).not.toHaveBeenCalled();
  expect(adminAlert).toHaveBeenCalledWith(expect.objectContaining({ key: 'payout_reconcile_blocked' }));
});

test('live: owed money to an ELIGIBLE host creates the held transfer', async () => {
  platformConfig.getConfig.mockResolvedValue({ payoutReconcilerMode: 'live' });
  isPayoutEligible.mockResolvedValue({ eligible: true, reasons: [] });
  routeAuto.createHeldTransferForBooking.mockResolvedValue({ ok: true, transferId: 'trf_new' });
  setReads([owedBooking()], []);
  const r = await reconcile();
  expect(r.created).toBe(1);
  expect(routeAuto.createHeldTransferForBooking).toHaveBeenCalledTimes(1);
  expect(adminAlert).not.toHaveBeenCalled();
});

test('a payout below the ₹1 floor is skipped entirely (no eligibility check, no attempt)', async () => {
  platformConfig.getConfig.mockResolvedValue({ payoutReconcilerMode: 'live' });
  setReads([owedBooking({ vendor_amount: 0.5 })], []);
  const r = await reconcile();
  expect(r.candidates).toBe(0);
  expect(isPayoutEligible).not.toHaveBeenCalled();
});

test('cancelled / not_eligible bookings are skipped', async () => {
  platformConfig.getConfig.mockResolvedValue({ payoutReconcilerMode: 'live' });
  setReads([owedBooking({ settlement_status: 'cancelled' })], []);
  const r = await reconcile();
  expect(r.candidates).toBe(0);
  expect(isPayoutEligible).not.toHaveBeenCalled();
});

test('a retry-capped booking is blocked (not attempted) and alerts', async () => {
  platformConfig.getConfig.mockResolvedValue({ payoutReconcilerMode: 'live' });
  setReads([owedBooking({ transfer_attempts: 5 })], []);
  const r = await reconcile();
  expect(r.blocked).toBe(1);
  expect(routeAuto.createHeldTransferForBooking).not.toHaveBeenCalled();
  expect(adminAlert).toHaveBeenCalled();
});

test('eligibility is checked once per host, not once per booking', async () => {
  platformConfig.getConfig.mockResolvedValue({ payoutReconcilerMode: 'live' });
  isPayoutEligible.mockResolvedValue({ eligible: true, reasons: [] });
  routeAuto.createHeldTransferForBooking.mockResolvedValue({ ok: true, transferId: 'trf' });
  setReads([owedBooking({ id: 'bk1' }), owedBooking({ id: 'bk2' })], []); // two bookings, same host h1
  const r = await reconcile();
  expect(r.created).toBe(2);
  expect(isPayoutEligible).toHaveBeenCalledTimes(1);
});

test('live: a stuck held transfer whose webhook was missed is finalized from Razorpay truth', async () => {
  platformConfig.getConfig.mockResolvedValue({ payoutReconcilerMode: 'live' });
  const fetch = jest.fn().mockResolvedValue({ status: 'processed' });
  razorpayConfig.getClient.mockResolvedValue({ transfers: { fetch } });
  routeAuto.finalizeReleasedTransfer.mockResolvedValue();
  setReads([], [{ id: 'bk9', host_id: 'h1', vendor_amount: 10, razorpay_transfer_id: 'trf_9', transfer_status: 'pending', transfer_hold_until: '2000-01-01' }]);
  const r = await reconcile();
  expect(fetch).toHaveBeenCalledWith('trf_9');
  expect(routeAuto.finalizeReleasedTransfer).toHaveBeenCalledTimes(1);
  expect(r.finalized).toBe(1);
});

test('observe does NOT finalize stuck transfers (no money movement)', async () => {
  platformConfig.getConfig.mockResolvedValue({ payoutReconcilerMode: 'observe' });
  setReads([], [{ id: 'bk9', razorpay_transfer_id: 'trf_9', transfer_status: 'pending', transfer_hold_until: '2000-01-01' }]);
  const r = await reconcile();
  expect(r.stuck).toBe(1);
  expect(routeAuto.finalizeReleasedTransfer).not.toHaveBeenCalled();
});

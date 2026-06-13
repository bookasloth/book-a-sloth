/**
 * financeAdminController.test.js — unit coverage for the P1 ledger admin API.
 * Supabase + auditService + postingService are mocked; assertions target the
 * controller's response shape, balance-keying, and manual-entry validation.
 */
'use strict';

jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn(), rpc: jest.fn() } }));
jest.mock('../../services/auditService', () => ({ audit: jest.fn() }));
jest.mock('../../services/ledger/postingService', () => ({ post: jest.fn(() => Promise.resolve('entry-uuid')) }));

const { supabaseAdmin } = require('../../config/supabase');
const { post } = require('../../services/ledger/postingService');
const { audit } = require('../../services/auditService');
const ctrl = require('../../controllers/financeAdminController');

const mockRes = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };
const makeChain = (result) => {
  const c = {};
  for (const m of ['select', 'eq', 'gt', 'gte', 'lte', 'in', 'order', 'range', 'limit', 'single', 'maybeSingle']) c[m] = jest.fn(() => c);
  c.then = (resolve) => resolve(result);
  return c;
};

beforeEach(() => jest.clearAllMocks());

test('getSummary keys balances by account code and returns metrics', async () => {
  supabaseAdmin.from.mockImplementation((t) => {
    if (t === 'account_balances') return makeChain({ data: [
      { balance: 917.4, chart_of_accounts: { code: '2000', name: 'Vendor Payables', type: 'LIABILITY' } },
      { balance: 10.8, chart_of_accounts: { code: '2100', name: 'GST Payable', type: 'LIABILITY' } },
    ], error: null });
    return makeChain({ data: [], error: null }); // bookings/subs aggregate selects
  });
  const res = mockRes();
  await ctrl.getSummary({ query: {} }, res);
  const body = res.json.mock.calls[0][0];
  expect(body.balances['2000'].balance).toBe(917.4);
  expect(body.metrics.outstanding_vendor_payables).toBe(917.4);
  expect(body.metrics.gst_liability).toBe(10.8);
});

test('getSummary JS-reduces booking + subscription rows into collection metrics', async () => {
  supabaseAdmin.from.mockImplementation((t) => {
    if (t === 'account_balances') return makeChain({ data: [], error: null });
    if (t === 'bookings') return makeChain({ data: [
      { customer_total: 100, razorpay_fee_actual: 2, razorpay_tax_actual: 0.36 },
      { customer_total: 50, razorpay_fee_actual: 1, razorpay_tax_actual: 0.18 },
    ], error: null });
    if (t === 'subscription_payments') return makeChain({ data: [{ total_charged: 499 }], error: null });
    return makeChain({ data: [], error: null });
  });
  const res = mockRes();
  await ctrl.getSummary({ query: {} }, res);
  const body = res.json.mock.calls[0][0];
  expect(body.metrics.gross_collections).toBe(649); // 100 + 50 + 499
  expect(body.metrics.razorpay_charges_orders).toBe(3.54); // (2+0.36)+(1+0.18)
});

test('postAdjustment rejects unbalanced lines with 400', async () => {
  const res = mockRes();
  await ctrl.postAdjustment({ admin: { id: 'a1' }, body: { description: 'x', lines: [
    { account_code: '1000', debit: 10, credit: 0 }, { account_code: '4000', debit: 0, credit: 9 },
  ] } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(post).not.toHaveBeenCalled();
});

test('postAdjustment posts balanced lines and audits', async () => {
  const res = mockRes();
  await ctrl.postAdjustment({ admin: { id: 'a1' }, body: { description: 'correct', lines: [
    { account_code: '1000', debit: 10, credit: 0 }, { account_code: '4000', debit: 0, credit: 10 },
  ] } }, res);
  expect(post).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 'ADJUSTMENT', createdBy: 'a1' }));
  expect(audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
    action: 'FINANCE_ADJUSTMENT_POSTED', resource_type: 'journal_entry', resource_id: 'entry-uuid',
  }));
  expect(res.json).toHaveBeenCalledWith({ id: 'entry-uuid' });
});

test('postBankTransfer requires positive amount', async () => {
  const res = mockRes();
  await ctrl.postBankTransfer({ admin: { id: 'a1' }, body: { amount: 0 } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(post).not.toHaveBeenCalled();
});

test('postBankTransfer posts a BANK_TRANSFER entry for a positive amount', async () => {
  const res = mockRes();
  await ctrl.postBankTransfer({ admin: { id: 'a1' }, body: { amount: 500, reference: 'STL123' } }, res);
  expect(post).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 'BANK_TRANSFER' }));
  expect(res.json).toHaveBeenCalledWith({ id: 'entry-uuid' });
});

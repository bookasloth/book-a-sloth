'use strict';
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../utils/httpError', () => ({ safeError: (res, e) => res.status(500).json({ message: e.message }) }));
jest.mock('../../services/platformConfig', () => ({ getConfig: jest.fn() }));
jest.mock('../../services/settlementService', () => ({ computeSettlementBalance: jest.fn() }));
const { supabaseAdmin } = require('../../config/supabase');
const platformConfig = require('../../services/platformConfig');
const { computeSettlementBalance } = require('../../services/settlementService');
const ctrl = require('../../controllers/vendorController');

const mockRes = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };
const insertChain = (result) => {
  const c = {};
  c.insert = jest.fn(() => c); c.select = jest.fn(() => c); c.single = () => Promise.resolve(result);
  return c;
};

beforeEach(() => {
  jest.clearAllMocks();
  platformConfig.getConfig.mockResolvedValue({ clearingDays: 7 });
});

test('rejects amount above available', async () => {
  computeSettlementBalance.mockResolvedValue({ available: 100 });
  const res = mockRes();
  await ctrl.requestPayout({ user: { id: 'h1' }, body: { amount: 500 } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json.mock.calls[0][0].message).toMatch(/exceed/i);
});

test('rejects amount below minimum 100', async () => {
  computeSettlementBalance.mockResolvedValue({ available: 1000 });
  const res = mockRes();
  await ctrl.requestPayout({ user: { id: 'h1' }, body: { amount: 50 } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
});

test('accepts valid amount within available', async () => {
  computeSettlementBalance.mockResolvedValue({ available: 1000 });
  supabaseAdmin.from.mockReturnValue(insertChain({ data: { id: 'p1', amount: 500 }, error: null }));
  const res = mockRes();
  await ctrl.requestPayout({ user: { id: 'h1' }, body: { amount: 500, notes: 'upi' } }, res);
  expect(res.status).toHaveBeenCalledWith(201);
});

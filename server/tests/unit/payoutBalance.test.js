'use strict';
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../utils/httpError', () => ({ safeError: (res, e) => res.status(500).json({ message: e.message }) }));
const { supabaseAdmin } = require('../../config/supabase');
const ctrl = require('../../controllers/vendorController');

const mockRes = () => { const r = {}; r.status = jest.fn(() => r); r.json = jest.fn(() => r); return r; };
const chain = (result) => {
  const c = {};
  for (const m of ['select', 'eq', 'order']) c[m] = jest.fn(() => c);
  c.then = (resolve) => resolve(result);
  return c;
};

beforeEach(() => jest.clearAllMocks());

test('getPayoutBalance counts paid payouts as withdrawn (available not inflated)', async () => {
  supabaseAdmin.from.mockImplementation((t) => {
    if (t === 'bookings') return chain({ data: [{ vendor_amount: 1000 }] });
    if (t === 'payout_requests') return chain({ data: [
      { amount: 300, status: 'paid' },
      { amount: 100, status: 'approved' },
    ] });
    return chain({ data: [] });
  });
  const res = mockRes();
  await ctrl.getPayoutBalance({ user: { id: 'h1' } }, res);
  const body = res.json.mock.calls[0][0];
  // earned 1000 - paid 300 - approved 100 - pending 0 = 600
  expect(body.available).toBe(600);
  expect(body.totalWithdrawn).toBe(400); // approved + paid
});

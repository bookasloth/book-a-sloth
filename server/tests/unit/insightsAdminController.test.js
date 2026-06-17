/**
 * Unit tests for insightsAdminController.getKpis — owned KPI tiles.
 * Mocks supabaseAdmin with thenable query builders (select/eq chain + awaitable).
 */
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../utils/httpError', () => ({
  safeError: jest.fn((res, err) => res.status(500).json({ message: err?.message || 'error' })),
}));

const { supabaseAdmin } = require('../../config/supabase');
const { getKpis } = require('../../controllers/insightsAdminController');

// Query builder that supports .select().eq() chaining and resolves to `result`.
const makeQuery = (result) => {
  const q = {
    select: jest.fn(() => q),
    eq: jest.fn(() => q),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return q;
};

const res = () => {
  const r = {};
  r.status = jest.fn(() => r);
  r.json = jest.fn(() => r);
  return r;
};

beforeEach(() => jest.clearAllMocks());

test('computes revenue, conversion, bookings and host tiles from Postgres rows', async () => {
  const nowIso = new Date().toISOString();
  const bookings = [
    { id: 1, payment_status: 'paid',   platform_fee_amount: 10, commission_applied: 5,  created_at: nowIso },
    { id: 2, payment_status: 'paid',   platform_fee_amount: 20, commission_applied: 0,  created_at: nowIso },
    { id: 3, payment_status: 'unpaid', platform_fee_amount: 0,  commission_applied: 0,  created_at: nowIso },
    { id: 4, payment_status: 'failed', platform_fee_amount: 0,  commission_applied: 0,  created_at: nowIso },
  ];
  supabaseAdmin.from
    .mockReturnValueOnce(makeQuery({ data: bookings, error: null }))           // bookings
    .mockReturnValueOnce(makeQuery({ data: [{ id: 'h1', created_at: nowIso }, { id: 'h2', created_at: nowIso }], error: null })) // hosts
    .mockReturnValueOnce(makeQuery({ count: 42, error: null }));               // guests

  const r = res();
  await getKpis({}, r);

  expect(r.json).toHaveBeenCalledTimes(1);
  const p = r.json.mock.calls[0][0];
  expect(p.revenue.total).toBe(35);          // 10+5 + 20
  expect(p.revenue.last30).toBe(35);
  expect(p.bookings).toEqual({ total: 4, paid: 2, last30: 2 });
  expect(p.conversion).toEqual({ created: 4, paid: 2, rate: 50 }); // 2/4 = 50%
  expect(p.hosts).toEqual({ total: 2, new30: 2 });
  expect(p.guests).toEqual({ total: 42 });
  expect(p.generatedAt).toEqual(expect.any(String));
});

test('falls back to fee-only select when commission_applied column is missing', async () => {
  const nowIso = new Date().toISOString();
  // First bookings query errors with missing-column; controller retries.
  const errQuery = makeQuery({ data: null, error: { message: 'column bookings.commission_applied does not exist' } });
  const retryQuery = makeQuery({ data: [{ id: 1, payment_status: 'paid', platform_fee_amount: 10, created_at: nowIso }], error: null });
  supabaseAdmin.from
    .mockReturnValueOnce(errQuery)                                              // bookings (errors)
    .mockReturnValueOnce(retryQuery)                                            // bookings retry
    .mockReturnValueOnce(makeQuery({ data: [], error: null }))                  // hosts
    .mockReturnValueOnce(makeQuery({ count: 0, error: null }));                 // guests

  const r = res();
  await getKpis({}, r);
  const p = r.json.mock.calls[0][0];
  expect(p.revenue.total).toBe(10);
  expect(p.bookings.paid).toBe(1);
});

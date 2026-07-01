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

const {
  bookingGrossValue, productGrossValue, median,
} = require('../../controllers/insightsAdminController');

describe('bookingGrossValue (spec D2)', () => {
  test('primary: customer_total minus platform fee and its GST', () => {
    expect(bookingGrossValue({ customer_total: 1180, platform_fee_amount: 10, platform_fee_gst: 1.8 }))
      .toBe(1168.2);
  });
  test('free booking (customer_total 0) => 0', () => {
    expect(bookingGrossValue({ customer_total: 0, platform_fee_amount: 0, platform_fee_gst: 0 })).toBe(0);
  });
  test('NULL fee/gst coalesced to 0', () => {
    expect(bookingGrossValue({ customer_total: 500 })).toBe(500);
  });
  test('pre-v2.2 fallback: NULL customer_total => vendor_amount + commission_applied', () => {
    expect(bookingGrossValue({ customer_total: null, vendor_amount: 900, commission_applied: 50 })).toBe(950);
  });
  test('negative reconstruction clamped to 0', () => {
    expect(bookingGrossValue({ customer_total: 5, platform_fee_amount: 10, platform_fee_gst: 1.8 })).toBe(0);
  });
});

describe('productGrossValue (spec D3)', () => {
  test('uses amount_paid', () => {
    expect(productGrossValue({ amount_paid: 299, platform_fee: 10 })).toBe(299);
  });
  test('free product (0) => 0; null => 0', () => {
    expect(productGrossValue({ amount_paid: 0 })).toBe(0);
    expect(productGrossValue({})).toBe(0);
  });
});

describe('median (spec D6)', () => {
  test('empty => null', () => expect(median([])).toBeNull());
  test('odd => middle', () => expect(median([3, 1, 2])).toBe(2));
  test('even => mean of two middle', () => expect(median([1, 2, 3, 4])).toBe(2.5));
  test('rounds to 1 decimal', () => expect(median([1.2, 2.2])).toBe(1.7));
});

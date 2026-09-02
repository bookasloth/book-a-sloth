/**
 * tests/unit/adminController.test.js
 * Tests for getStats, getUsers, updateUser, deleteUser,
 * getAllBookings, getAllServices, cleanupUsers.
 */
jest.mock('../../config/supabase', () => {
  const fluent = (resolved) => ({
    select:  jest.fn().mockReturnThis(),
    update:  jest.fn().mockReturnThis(),
    delete:  jest.fn().mockReturnThis(),
    eq:      jest.fn().mockReturnThis(),
    neq:     jest.fn().mockReturnThis(),
    order:   jest.fn().mockReturnThis(),
    range:   jest.fn().mockReturnThis(),
    ilike:   jest.fn().mockReturnThis(),
    or:      jest.fn().mockReturnThis(),
    single:  jest.fn().mockResolvedValue(resolved ?? { data: null, error: null }),
    then:    undefined,
    // Allow .select(...) to resolve as a query result too
  });

  return {
    supabaseAdmin: {
      from: jest.fn().mockImplementation(() => fluent()),
      auth: {
        admin: {
          listUsers:  jest.fn(),
          deleteUser: jest.fn(),
        },
      },
    },
  };
});

// audit() has its own dedicated test; stub it here so the per-test from() mocks
// (which don't stub .insert) don't emit benign "[audit] failed" console noise.
jest.mock('../../services/auditService', () => ({ audit: jest.fn() }));

const { supabaseAdmin } = require('../../config/supabase');
const {
  getStats, getUsers, getUserById, updateUser, deleteUser,
  getAllBookings, getAllServices, updateBooking,
} = require('../../controllers/adminController');

const req = (params = {}, body = {}, query = {}) => ({ params, body, query });
const res = () => {
  const r = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json   = jest.fn().mockReturnValue(r);
  return r;
};

// ── getStats ──────────────────────────────────────────────────────────────────

describe('getStats', () => {
  test('returns platform-level statistics object', async () => {
    // Build thenable fluent mocks: each supports .select().eq() chain AND is directly awaitable
    const makeThen = (val) => (res, rej) => Promise.resolve(val).then(res, rej);
    const countMock = (count, extra = {}) => ({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      neq:    jest.fn().mockReturnThis(),
      then:   makeThen({ count, data: null, error: null, ...extra }),
    });
    supabaseAdmin.from
      .mockReturnValueOnce(countMock(0, { data: [], count: 0 }))       // bookings (queried first)
      .mockReturnValueOnce(countMock(10))                               // users (guests)
      .mockReturnValueOnce(countMock(5))                                // vendors (hosts)
      .mockReturnValueOnce(countMock(12))                               // services
      .mockReturnValueOnce(countMock(0, { data: [] }));                 // subscription_payments

    const r = res();
    await getStats(req(), r);
    const payload = r.json.mock.calls[0][0];
    expect(payload).toHaveProperty('users');
    expect(payload).toHaveProperty('vendors');
    expect(payload).toHaveProperty('bookings');
    expect(payload).toHaveProperty('revenue');
  });
});

// ── getUsers ──────────────────────────────────────────────────────────────────

describe('getUsers', () => {
  test('returns array of users', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order:  jest.fn().mockReturnThis(),
      range:  jest.fn().mockResolvedValue({ data: [{ id: 'u1', name: 'Bob', role: 'guest' }], count: 1, error: null }),
      ilike:  jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
    });
    const r = res();
    await getUsers(req(), r);
    const payload = r.json.mock.calls[0][0];
    expect(Array.isArray(payload.users ?? payload)).toBe(true);
  });
});

// ── getUserById ───────────────────────────────────────────────────────────────

describe('getUserById', () => {
  test('returns 404 when user not found', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    });
    const r = res();
    await getUserById(req({ id: '00000000-0000-0000-0000-000000000000' }), r);
    expect(r.status).toHaveBeenCalledWith(404);
  });
});

// ── updateUser ────────────────────────────────────────────────────────────────

describe('updateUser', () => {
  test('updates user fields and returns updated profile', async () => {
    const UPDATED = { id: 'u1', name: 'New Name', role: 'guest', is_verified: true };
    supabaseAdmin.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: UPDATED, error: null }),
    });
    const r = res();
    await updateUser(req({ id: 'u1' }, { name: 'New Name', is_verified: true }), r);
    expect(r.json.mock.calls[0][0]).toMatchObject({ name: 'New Name' });
  });

  test('returns 500 on DB error', async () => {
    supabaseAdmin.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB err' } }),
    });
    const r = res();
    await updateUser(req({ id: 'u1' }, {}), r);
    expect(r.status).toHaveBeenCalledWith(500);
  });
});

// ── deleteUser ────────────────────────────────────────────────────────────────

describe('deleteUser', () => {
  test('deletes user and returns success message', async () => {
    // deleteUser now (1) pre-reads the profile's image URLs, then (2) deletes
    // the row. Same fluent object serves both: select→eq→maybeSingle and
    // delete→eq. Storage purge runs after; stub the storage client so the
    // best-effort sweep is a no-op here.
    supabaseAdmin.from.mockReturnValue({
      select:      jest.fn().mockReturnThis(),
      delete:      jest.fn().mockReturnThis(),
      eq:          jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      then:        (resolve) => resolve({ error: null }),
    });
    supabaseAdmin.storage = {
      from: jest.fn().mockReturnValue({
        list:   jest.fn().mockResolvedValue({ data: [], error: null }),
        remove: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    };
    const r = res();
    await deleteUser(req({ id: 'u1' }), r);
    expect(r.json.mock.calls[0][0].message).toMatch(/deleted/i);
  });
});

// ── getAllBookings ────────────────────────────────────────────────────────────

describe('getAllBookings', () => {
  test('returns bookings array', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order:  jest.fn().mockReturnThis(),
      range:  jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      eq:     jest.fn().mockReturnThis(),
    });
    const r = res();
    await getAllBookings(req(), r);
    const payload = r.json.mock.calls[0][0];
    expect(Array.isArray(payload.bookings ?? payload)).toBe(true);
  });
});

// ── getAllServices ─────────────────────────────────────────────────────────────

describe('getAllServices', () => {
  test('returns services array', async () => {
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order:  jest.fn().mockReturnThis(),
      limit:  jest.fn().mockResolvedValue({ data: [], error: null }),
    });
    const r = res();
    await getAllServices(req(), r);
    const payload = r.json.mock.calls[0][0];
    expect(Array.isArray(payload)).toBe(true);
  });
});

// ── updateBooking ─────────────────────────────────────────────────────────────

describe('updateBooking', () => {
  test('SECURITY: rejects payment_status="paid" with 400 and does NOT write to DB', async () => {
    // Set up a mock that lets us detect whether .update() was called
    const updateMock = jest.fn().mockReturnThis();
    supabaseAdmin.from.mockReturnValue({
      update: updateMock,
      eq:     jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    });
    const r = res();
    await updateBooking(req({ id: 'b1' }, { payment_status: 'paid' }), r);
    expect(r.status).toHaveBeenCalledWith(400);
    expect(r.json.mock.calls[0][0].message).toMatch(/paid/i);
    // Supabase .update() must NOT have been called — no fabricated balance write
    expect(updateMock).not.toHaveBeenCalled();
  });

  test('allows status="completed" (no payment_status) and updates successfully', async () => {
    const UPDATED = { id: 'b1', status: 'completed', payment_status: 'pending' };
    supabaseAdmin.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: UPDATED, error: null }),
    });
    const r = res();
    await updateBooking(req({ id: 'b1' }, { status: 'completed' }), r);
    expect(r.status).not.toHaveBeenCalled();
    expect(r.json.mock.calls[0][0]).toMatchObject({ status: 'completed' });
  });

  test('allows payment_status="refunded" (non-paid status) and updates successfully', async () => {
    const UPDATED = { id: 'b1', status: 'cancelled', payment_status: 'refunded' };
    supabaseAdmin.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: UPDATED, error: null }),
    });
    const r = res();
    await updateBooking(req({ id: 'b1' }, { payment_status: 'refunded' }), r);
    expect(r.status).not.toHaveBeenCalled();
    expect(r.json.mock.calls[0][0]).toMatchObject({ payment_status: 'refunded' });
  });

  test('returns 500 on DB error', async () => {
    supabaseAdmin.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB err' } }),
    });
    const r = res();
    await updateBooking(req({ id: 'b1' }, { status: 'completed' }), r);
    expect(r.status).toHaveBeenCalledWith(500);
  });
});

// NOTE: cleanupUsers was removed in M0 (destructive mass-delete must not live on
// the admin API), so its tests were removed with it.

// ── getBookingPaymentEvents (F15) ───────────────────────────────────────────
const { getBookingPaymentEvents } = require('../../controllers/adminController');
describe('getBookingPaymentEvents', () => {
  test('maps a booking\'s webhook payment events (declined card is visible)', async () => {
    const row = {
      id: 'we1', event_type: 'payment.failed', received_at: '2026-09-02T10:00:00Z',
      payload: { payload: { payment: { entity: { id: 'pay_9', amount: 59000, method: 'card', status: 'failed', error_code: 'BAD_REQUEST_ERROR', error_description: 'card declined', notes: { booking_id: 'bk1' } } } } },
    };
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue({ data: [row], error: null }),
    });
    const r = res();
    await getBookingPaymentEvents(req({ id: 'bk1' }), r);
    const out = r.json.mock.calls[0][0];
    expect(out[0]).toMatchObject({ event_type: 'payment.failed', payment_id: 'pay_9', amount: 590, error: 'card declined', status: 'failed' });
  });

  test('returns [] when the webhook_events table is absent (pre-v3.143)', async () => {
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'relation "webhook_events" does not exist' } }),
    });
    const r = res();
    await getBookingPaymentEvents(req({ id: 'bk1' }), r);
    expect(r.json).toHaveBeenCalledWith([]);
  });
});

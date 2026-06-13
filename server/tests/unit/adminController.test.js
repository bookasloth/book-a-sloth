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
  getAllBookings, getAllServices,
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
      .mockReturnValueOnce(countMock(12));                              // services

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
    supabaseAdmin.from.mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockResolvedValue({ error: null }),
    });
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

// NOTE: cleanupUsers was removed in M0 (destructive mass-delete must not live on
// the admin API), so its tests were removed with it.

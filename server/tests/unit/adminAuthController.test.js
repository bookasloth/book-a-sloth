/**
 * tests/unit/adminAuthController.test.js
 * Admin staff login against the SEPARATE credential store (admin_users):
 * username/email + bcrypt password -> isolated admin session token with the
 * role's resolved permissions. No Supabase Auth, no OTP.
 */
process.env.SUPER_ADMIN_JWT_SECRET = 'test-admin-secret';

const bcrypt = require('bcryptjs');

// Stateful supabase mock — globalThis.__staff / __rolePerms drive each test.
jest.mock('../../config/supabase', () => {
  const buildSelect = (table) => {
    const filters = {};
    const b = {
      select: jest.fn(() => b),
      eq: jest.fn((c, v) => { filters[c] = v; return b; }),
      maybeSingle: jest.fn(() => {
        if (table === 'admin_users') {
          const s = globalThis.__staff;
          if (!s) return Promise.resolve({ data: null });
          const hit =
            (filters.username && filters.username === s.username) ||
            (filters.email && filters.email === s.email) ||
            (filters.id && filters.id === s.id);
          return Promise.resolve({ data: hit ? s : null });
        }
        if (table === 'admin_roles') return Promise.resolve({ data: { permissions: globalThis.__rolePerms } });
        return Promise.resolve({ data: null });
      }),
    };
    return b;
  };
  return {
    supabaseAdmin: {
      from: jest.fn((table) => ({
        select: (...a) => buildSelect(table).select(...a),
        update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) })),
      })),
    },
  };
});

const { adminLogin, jwtVerify } = require('../../controllers/adminAuthController');

const PASSWORD = 'Secret123!';
const HASH = bcrypt.hashSync(PASSWORD, 10);

const mockReq = (body = {}) => ({ body });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const seedStaff = (over = {}) => {
  globalThis.__staff = {
    id: 'staff-1', email: 'ops@bookasloth.com', username: 'ops', name: 'Ops Admin',
    password_hash: HASH, role_key: 'operations', is_active: true,
    failed_attempts: 0, locked_until: null, ...over,
  };
  globalThis.__rolePerms = ['ops.view', 'bookings.view'];
};

describe('adminLogin (credential store)', () => {
  beforeEach(() => { jest.clearAllMocks(); seedStaff(); });

  test('400 — missing identifier or password', async () => {
    const res = mockRes();
    await adminLogin(mockReq({ password: 'x' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('401 — unknown account', async () => {
    globalThis.__staff = null;
    const res = mockRes();
    await adminLogin(mockReq({ username: 'nobody', password: PASSWORD }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('401 — wrong password', async () => {
    const res = mockRes();
    await adminLogin(mockReq({ username: 'ops', password: 'wrong' }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('401 — inactive account', async () => {
    seedStaff({ is_active: false });
    const res = mockRes();
    await adminLogin(mockReq({ username: 'ops', password: PASSWORD }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('429 — locked account', async () => {
    seedStaff({ locked_until: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
    const res = mockRes();
    await adminLogin(mockReq({ username: 'ops', password: PASSWORD }), res);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  test('200 — login by username returns a token + role + permissions', async () => {
    const res = mockRes();
    await adminLogin(mockReq({ username: 'ops', password: PASSWORD }), res);
    const payload = res.json.mock.calls[0][0];
    expect(payload.token).toBeDefined();
    expect(payload.type).toBe('admin');
    expect(payload.role).toBe('operations');
    expect(payload.permissions).toEqual(['ops.view', 'bookings.view']);
  });

  test('200 — login by email works too', async () => {
    const res = mockRes();
    await adminLogin(mockReq({ email: 'ops@bookasloth.com', password: PASSWORD }), res);
    expect(res.status).not.toHaveBeenCalledWith(401);
    const payload = res.json.mock.calls[0][0];
    expect(payload.username).toBe('ops');
  });

  test('issued token verifies as an admin session', async () => {
    const res = mockRes();
    await adminLogin(mockReq({ username: 'ops', password: PASSWORD }), res);
    const { token } = res.json.mock.calls[0][0];
    const decoded = jwtVerify(token);
    expect(decoded.type).toBe('admin');
    expect(decoded.role).toBe('operations');
    expect(decoded.permissions).toContain('ops.view');
  });
});

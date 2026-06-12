/**
 * tests/integration/adminAuth.test.js
 * Route tests for /api/admin-auth — credential-store login (username/email +
 * bcrypt password) and the /me identity echo behind requireAdmin().
 */
process.env.SUPER_ADMIN_JWT_SECRET = 'test-admin-secret';

const bcrypt = require('bcryptjs');
const PASSWORD = 'Secret123!';
const HASH = bcrypt.hashSync(PASSWORD, 10);

// Inline stateful supabase mock driven by globalThis.__staff / __rolePerms.
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

// Bypass rate limiters.
jest.mock('../../middleware/security', () => ({
  authLimiter:  (req, res, next) => next(),
  otpLimiter:   (req, res, next) => next(),
  apiLimiter:   (req, res, next) => next(),
  adminLimiter: (req, res, next) => next(),
}));

const request = require('supertest');
const express = require('express');
const adminAuthRoutes = require('../../routes/adminAuthRoutes');
const { jwtSign } = require('../../services/adminAuthService');

const app = express();
app.use(express.json());
app.use('/api/admin-auth', adminAuthRoutes);

const seedStaff = () => {
  globalThis.__staff = {
    id: 'staff-1', email: 'ops@bookasloth.com', username: 'ops', name: 'Ops Admin',
    password_hash: HASH, role_key: 'operations', is_active: true, failed_attempts: 0, locked_until: null,
  };
  globalThis.__rolePerms = ['ops.view'];
};

describe('POST /api/admin-auth/login', () => {
  beforeEach(() => { jest.clearAllMocks(); seedStaff(); });

  test('400 — missing credentials', async () => {
    const res = await request(app).post('/api/admin-auth/login').send({});
    expect(res.status).toBe(400);
  });

  test('401 — unknown account', async () => {
    globalThis.__staff = null;
    const res = await request(app).post('/api/admin-auth/login').send({ username: 'nobody', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  test('200 — success returns an admin session token', async () => {
    const res = await request(app).post('/api/admin-auth/login').send({ username: 'ops', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.type).toBe('admin');
    expect(res.body.role).toBe('operations');
    expect(res.body.permissions).toContain('ops.view');
  });
});

describe('GET /api/admin-auth/me', () => {
  test('401 — without a token', async () => {
    const res = await request(app).get('/api/admin-auth/me');
    expect(res.status).toBe(401);
  });

  test('200 — echoes the admin identity for a valid token', async () => {
    const token = jwtSign({ type: 'admin', sub: 's1', email: 'ops@bookasloth.com', username: 'ops', name: 'Ops Admin', role: 'operations', permissions: ['ops.view'] });
    const res = await request(app).get('/api/admin-auth/me').set({ Authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
    expect(res.body.admin).toMatchObject({ username: 'ops', role: 'operations' });
  });
});

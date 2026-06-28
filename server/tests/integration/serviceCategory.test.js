/**
 * tests/integration/serviceCategory.test.js
 *
 * Integration tests for the profession-scoped service_categories CRUD API (v3.53).
 * Covers: listAdmin (serviceCount by services.category slug), create (requires
 *         primary_category + name, slugify + de-dupe within profession),
 *         remove (409 on in-use, 200 when free), update (patch only),
 *         listPublic (requires ?primary, active only).
 */

jest.mock('../../config/supabase', () => require('./helpers').makeSbMock());

jest.mock('../../middleware/adminMiddleware', () => ({
  requireAdmin: (_permission) => (req, res, next) => {
    if (!req.headers.authorization?.includes('admin-token'))
      return res.status(403).json({ message: 'Admin access required' });
    req.admin = { id: 'test-admin', email: 'admin@test', role: 'super', permissions: ['*'] };
    next();
  },
  requireSuperAdmin: (req, res, next) => {
    if (!req.headers.authorization?.includes('admin-token'))
      return res.status(403).json({ message: 'Super admin access required' });
    req.admin = { id: 'test-admin', email: 'admin@test', role: 'super', permissions: ['*'] };
    next();
  },
}));

const request  = require('supertest');
const express  = require('express');
const { supabaseAdmin }             = require('../../config/supabase');
const { adminRouter, publicRouter } = require('../../routes/serviceCategoryRoutes');
const { adminAuth }                 = require('./helpers');

const app = express();
app.use(express.json());
app.use('/api/admin/service-categories', adminRouter);
app.use('/api/service-categories', publicRouter);

// Awaitable chain stub: every listed fluent method returns `this`, and awaiting
// the object resolves `resolved`.
const awaitable = (resolved, methods = ['select', 'eq', 'not', 'order', 'limit']) => {
  const obj = {};
  methods.forEach((m) => { obj[m] = jest.fn().mockReturnValue(obj); });
  obj.then = (resolve, reject) => Promise.resolve(resolved).then(resolve, reject);
  return obj;
};

afterEach(() => jest.clearAllMocks());

// ── listAdmin ─────────────────────────────────────────────────────────────────
describe('GET /api/admin/service-categories', () => {
  test('returns categories with serviceCount computed from services.category', async () => {
    const catA = { id: 'cat-1', primary_category: 'photographer', name: 'Wedding Photography', slug: 'wedding-photography', display_order: 0, is_active: true };
    const catB = { id: 'cat-2', primary_category: 'photographer', name: 'Portrait Photography', slug: 'portrait-photography', display_order: 1, is_active: true };

    supabaseAdmin.from
      .mockReturnValueOnce(awaitable({ data: [catA, catB], error: null }))   // service_categories list
      .mockReturnValueOnce(awaitable({                                       // services category counts
        data: [
          { category: 'wedding-photography' },
          { category: 'wedding-photography' },
          { category: 'portrait-photography' },
        ],
        error: null,
      }));

    const res = await request(app).get('/api/admin/service-categories').set(adminAuth());

    expect(res.status).toBe(200);
    const cats = res.body.categories;
    expect(cats).toHaveLength(2);
    expect(cats.find((c) => c.id === 'cat-1').serviceCount).toBe(2);
    expect(cats.find((c) => c.id === 'cat-2').serviceCount).toBe(1);
  });

  test('403 without admin token', async () => {
    const res = await request(app).get('/api/admin/service-categories');
    expect(res.status).toBe(403);
  });
});

// ── create ──────────────────────────────────────────────────────────────────
describe('POST /api/admin/service-categories', () => {
  test('400 when primary_category is missing', async () => {
    const res = await request(app).post('/api/admin/service-categories').set(adminAuth()).send({ name: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/primary_category is required/i);
  });

  test('400 when name is missing', async () => {
    const res = await request(app).post('/api/admin/service-categories').set(adminAuth()).send({ primary_category: 'photographer' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name is required/i);
  });

  test('creates category and slugifies the name', async () => {
    const inserted = { id: 'new-cat', primary_category: 'photographer', name: 'Drone Photography', slug: 'drone-photography', display_order: 0, is_active: true };

    supabaseAdmin.from
      // uniqueSlug → slug free
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null }) })
      // max display_order → none
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null }) })
      // insert
      .mockReturnValueOnce({ insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: inserted, error: null }) });

    const res = await request(app).post('/api/admin/service-categories').set(adminAuth())
      .send({ primary_category: 'photographer', name: 'Drone Photography' });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('drone-photography');
  });

  test('de-dupes slug within the profession — appends -2 when base is taken', async () => {
    const inserted = { id: 'new-2', primary_category: 'photographer', name: 'Photo Editing', slug: 'photo-editing-2', display_order: 1, is_active: true };

    supabaseAdmin.from
      // uniqueSlug: "photo-editing" taken
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' } }) })
      // uniqueSlug: "photo-editing-2" free
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: null }) })
      // max display_order
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), order: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { display_order: 0 } }) })
      // insert
      .mockReturnValueOnce({ insert: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: inserted, error: null }) });

    const res = await request(app).post('/api/admin/service-categories').set(adminAuth())
      .send({ primary_category: 'photographer', name: 'Photo Editing' });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('photo-editing-2');
  });
});

// ── remove ──────────────────────────────────────────────────────────────────
describe('DELETE /api/admin/service-categories/:id', () => {
  test('409 when services reference the category', async () => {
    supabaseAdmin.from
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { slug: 'wedding-photography' } }) }) // row lookup
      .mockReturnValueOnce(awaitable({ count: 3, error: null }));  // count

    const res = await request(app).delete('/api/admin/service-categories/cat-1').set(adminAuth());

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/in use by 3 services/i);
  });

  test('200 ok when no services reference the category', async () => {
    supabaseAdmin.from
      .mockReturnValueOnce({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { slug: 'wedding-photography' } }) }) // row lookup
      .mockReturnValueOnce(awaitable({ count: 0, error: null }))   // count
      .mockReturnValueOnce({ delete: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ error: null }) }); // delete

    const res = await request(app).delete('/api/admin/service-categories/cat-1').set(adminAuth());

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ── update ──────────────────────────────────────────────────────────────────
describe('PUT /api/admin/service-categories/:id', () => {
  test('patches only the fields provided in the body', async () => {
    const updated = { id: 'cat-1', primary_category: 'photographer', name: 'Wedding Photography (Premium)', slug: 'wedding-photography', display_order: 0, is_active: true };

    supabaseAdmin.from.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: updated, error: null }),
    });

    const res = await request(app).put('/api/admin/service-categories/cat-1').set(adminAuth())
      .send({ name: 'Wedding Photography (Premium)' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Wedding Photography (Premium)');
    expect(res.body.slug).toBe('wedding-photography');
  });

  test('404 when category not found', async () => {
    supabaseAdmin.from.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), select: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const res = await request(app).put('/api/admin/service-categories/nonexistent').set(adminAuth()).send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

// ── listPublic ────────────────────────────────────────────────────────────────
describe('GET /api/service-categories (public)', () => {
  test('returns [] when no ?primary is given', async () => {
    const res = await request(app).get('/api/service-categories');
    expect(res.status).toBe(200);
    expect(res.body.categories).toEqual([]);
  });

  test('returns active categories for the given profession', async () => {
    const active = [{ id: 'cat-1', name: 'Wedding Photography', slug: 'wedding-photography', primary_category: 'photographer' }];

    supabaseAdmin.from.mockReturnValueOnce(awaitable({ data: active, error: null }));

    const res = await request(app).get('/api/service-categories?primary=photographer');

    expect(res.status).toBe(200);
    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].slug).toBe('wedding-photography');
  });
});

/**
 * tests/integration/serviceCategory.test.js
 *
 * Integration tests for the service_categories CRUD API.
 * Covers: listAdmin (with serviceCount), create (slugify + de-dupe),
 *         remove (409 on in-use, 200 when free), update (patch only),
 *         listPublic (active only).
 */

// ── Supabase mock ─────────────────────────────────────────────────────────────
jest.mock('../../config/supabase', () => require('./helpers').makeSbMock());

// ── Admin middleware mock (same pattern as admin.test.js) ────────────────────
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
const { supabaseAdmin }                      = require('../../config/supabase');
const { adminRouter, publicRouter }          = require('../../routes/serviceCategoryRoutes');
const { adminAuth }                          = require('./helpers');

// Build a minimal app with both routers
const app = express();
app.use(express.json());
app.use('/api/admin/service-categories', adminRouter);
app.use('/api/service-categories', publicRouter);

// ─────────────────────────────────────────────────────────────────────────────
// 1. listAdmin — returns categories each with serviceCount
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/admin/service-categories', () => {
  test('returns categories with serviceCount computed from services table', async () => {
    const catA = { id: 'cat-1', name: 'Yoga', slug: 'yoga', display_order: 0, is_active: true };
    const catB = { id: 'cat-2', name: 'Cooking', slug: 'cooking', display_order: 1, is_active: true };

    // First call  → service_categories (list)
    // Second call → services (service_category_id counts)
    supabaseAdmin.from
      .mockReturnValueOnce({
        select:  jest.fn().mockReturnThis(),
        order:   jest.fn().mockReturnThis(),
        // second .order() resolves
        // we need the chain to resolve — use a custom then-able for the last order call
        // simplest: make order resolve on second call
        // Actually the mock returns `this` for order, so we need the whole chain to resolve.
        // Use a resolved thenable so the controller can `await` the fluent chain.
        then: (resolve, reject) => Promise.resolve({ data: [catA, catB], error: null }).then(resolve, reject),
      })
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        not:    jest.fn().mockReturnThis(),
        then:   (resolve, reject) =>
          Promise.resolve({
            data: [
              { service_category_id: 'cat-1' },
              { service_category_id: 'cat-1' },
              { service_category_id: 'cat-2' },
            ],
            error: null,
          }).then(resolve, reject),
      });

    const res = await request(app)
      .get('/api/admin/service-categories')
      .set(adminAuth());

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categories');
    const cats = res.body.categories;
    expect(cats).toHaveLength(2);

    const yoga = cats.find((c) => c.id === 'cat-1');
    const cook = cats.find((c) => c.id === 'cat-2');
    expect(yoga.serviceCount).toBe(2);
    expect(cook.serviceCount).toBe(1);
  });

  test('403 without admin token', async () => {
    const res = await request(app).get('/api/admin/service-categories');
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. create — slugifies name, de-dupes slug on conflict
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/admin/service-categories', () => {
  test('400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/admin/service-categories')
      .set(adminAuth())
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name is required/i);
  });

  test('creates category and slugifies the name', async () => {
    const inserted = {
      id: 'new-cat', name: 'Life Coaching', slug: 'life-coaching',
      display_order: 0, is_active: true,
    };

    // uniqueSlug check: maybeSingle returns null (slug is free)
    supabaseAdmin.from
      // call 1: uniqueSlug → service_categories.select.eq.maybeSingle
      .mockReturnValueOnce({
        select:      jest.fn().mockReturnThis(),
        eq:          jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      })
      // call 2: max display_order query → maybeSingle returns null
      .mockReturnValueOnce({
        select:      jest.fn().mockReturnThis(),
        order:       jest.fn().mockReturnThis(),
        limit:       jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      })
      // call 3: insert → single
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: inserted, error: null }),
      });

    const res = await request(app)
      .post('/api/admin/service-categories')
      .set(adminAuth())
      .send({ name: 'Life Coaching' });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('life-coaching');
    expect(res.body.name).toBe('Life Coaching');
  });

  test('de-dupes slug on conflict — appends -2 when base slug is taken', async () => {
    const inserted = {
      id: 'new-cat-2', name: 'Yoga', slug: 'yoga-2',
      display_order: 1, is_active: true,
    };

    supabaseAdmin.from
      // uniqueSlug: first check → slug "yoga" IS taken
      .mockReturnValueOnce({
        select:      jest.fn().mockReturnThis(),
        eq:          jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' } }),
      })
      // uniqueSlug: second check → slug "yoga-2" is free
      .mockReturnValueOnce({
        select:      jest.fn().mockReturnThis(),
        eq:          jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      })
      // max display_order
      .mockReturnValueOnce({
        select:      jest.fn().mockReturnThis(),
        order:       jest.fn().mockReturnThis(),
        limit:       jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: { display_order: 0 } }),
      })
      // insert
      .mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: inserted, error: null }),
      });

    const res = await request(app)
      .post('/api/admin/service-categories')
      .set(adminAuth())
      .send({ name: 'Yoga' });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('yoga-2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. remove — 409 when in use, 200 when free
// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/admin/service-categories/:id', () => {
  test('409 when services reference the category', async () => {
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      then:   (resolve, reject) =>
        Promise.resolve({ count: 3, error: null }).then(resolve, reject),
    });

    const res = await request(app)
      .delete('/api/admin/service-categories/cat-1')
      .set(adminAuth());

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/in use by 3 services/i);
  });

  test('200 ok when no services reference the category', async () => {
    // count query → 0
    supabaseAdmin.from
      .mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq:     jest.fn().mockReturnThis(),
        then:   (resolve, reject) =>
          Promise.resolve({ count: 0, error: null }).then(resolve, reject),
      })
      // delete call
      .mockReturnValueOnce({
        delete: jest.fn().mockReturnThis(),
        eq:     jest.fn().mockResolvedValue({ error: null }),
      });

    const res = await request(app)
      .delete('/api/admin/service-categories/cat-1')
      .set(adminAuth());

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. update — patches only provided fields
// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/admin/service-categories/:id', () => {
  test('patches only the fields provided in the body', async () => {
    const updated = {
      id: 'cat-1', name: 'Yoga & Wellness', slug: 'yoga',
      display_order: 0, is_active: true, description: 'Updated desc',
    };

    supabaseAdmin.from.mockReturnValueOnce({
      update:      jest.fn().mockReturnThis(),
      eq:          jest.fn().mockReturnThis(),
      select:      jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: updated, error: null }),
    });

    const res = await request(app)
      .put('/api/admin/service-categories/cat-1')
      .set(adminAuth())
      .send({ name: 'Yoga & Wellness', description: 'Updated desc' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Yoga & Wellness');
    // slug was NOT sent → should remain unchanged (the DB returned the original)
    expect(res.body.slug).toBe('yoga');
  });

  test('404 when category not found', async () => {
    supabaseAdmin.from.mockReturnValueOnce({
      update:      jest.fn().mockReturnThis(),
      eq:          jest.fn().mockReturnThis(),
      select:      jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const res = await request(app)
      .put('/api/admin/service-categories/nonexistent')
      .set(adminAuth())
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. listPublic — returns only active categories
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/service-categories (public)', () => {
  test('returns only is_active=true categories with picker columns', async () => {
    const activeCats = [
      { id: 'cat-1', name: 'Yoga', slug: 'yoga', icon_url: null, parent_id: null, description: null },
    ];

    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      order:  jest.fn().mockReturnThis(),
      then:   (resolve, reject) =>
        Promise.resolve({ data: activeCats, error: null }).then(resolve, reject),
    });

    const res = await request(app).get('/api/service-categories');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categories');
    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].slug).toBe('yoga');
    // Should NOT contain admin-only fields like seo_title
    expect(res.body.categories[0]).not.toHaveProperty('seo_title');
  });
});

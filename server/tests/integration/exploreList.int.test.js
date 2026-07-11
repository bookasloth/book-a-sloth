/**
 * tests/integration/exploreList.int.test.js
 *
 * Integration tests for the public Explore listing API (Task 9):
 * GET /api/explore — verified+active hosts via profiles + embedded
 * services!inner, filters `category` (profession slug), `service` (service
 * slug — REQUIRES `category`, pair discipline since slugs are only unique
 * per profession), `q` (ilike name/tagline), pagination.
 */

jest.mock('../../config/supabase', () => require('./helpers').makeSbMock());

const request = require('supertest');
const express = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const exploreRoutes = require('../../routes/exploreRoutes');

const app = express();
app.use(express.json());
app.use('/api/explore', exploreRoutes);

// Awaitable chain stub: every listed fluent method returns `this`, and awaiting
// the object resolves `resolved`. Mirrors servicesDirectory.int.test.js style.
// The `eq` method is instrumented to record (col, val) pairs for assertion.
const awaitable = (resolved, methods = ['select', 'eq', 'not', 'or', 'order', 'range']) => {
  const obj = {};
  obj.eq = jest.fn().mockReturnValue(obj);
  methods.filter(m => m !== 'eq').forEach((m) => { obj[m] = jest.fn().mockReturnValue(obj); });
  obj.then = (resolve, reject) => Promise.resolve(resolved).then(resolve, reject);
  return obj;
};

afterEach(() => jest.clearAllMocks());
// listVendors is now read-through cached (120s). Clear between tests so a shared
// filter+page key from one case can't serve a stale payload into the next and
// desync the per-test mockReturnValueOnce queue.
beforeEach(() => require('../../services/responseCache').clear());

describe('GET /api/explore', () => {
  test('service filter without category → 400', async () => {
    const res = await request(app).get('/api/explore?service=wedding-photography');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/requires.*category/i);
    // No query should have been attempted.
    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  test('category+service returns mapped vendors', async () => {
    const rows = [{
      id: 'h1', name: 'Asha', username: 'asha', tagline: 't', profile_image: 'p.jpg',
      primary_category: 'photographer',
      services: [{
        price: 999, rating: 4.8, total_reviews: 12, category: 'wedding-photography',
        primary_category: 'photographer', is_active: true,
      }],
    }];

    const mockQuery = awaitable({ data: rows, error: null, count: 1 });
    supabaseAdmin.from.mockReturnValueOnce(mockQuery);

    const res = await request(app).get('/api/explore?category=photographer&service=wedding-photography');

    expect(res.status).toBe(200);
    expect(res.body.vendors).toHaveLength(1);
    expect(res.body.vendors[0]).toMatchObject({
      username: 'asha', category: 'photographer', minPrice: 999, reviewCount: 12,
    });
    expect(res.body.meta.total).toBe(1);

    // Assert that both pair-filter .eq() calls were made with correct arguments
    const eqCalls = mockQuery.eq.mock.calls;
    expect(eqCalls.some(call => call[0] === 'services.category' && call[1] === 'wedding-photography'))
      .toBe(true);
    expect(eqCalls.some(call => call[0] === 'services.primary_category' && call[1] === 'photographer'))
      .toBe(true);
  });

  test('category alone (no service) returns vendors without requiring pair', async () => {
    const rows = [{
      id: 'h2', name: 'Beena', username: 'beena', tagline: '', profile_image: null,
      primary_category: 'photographer',
      services: [{
        price: 500, rating: 0, total_reviews: 0, category: 'portrait-photography',
        primary_category: 'photographer', is_active: true,
      }],
    }];

    supabaseAdmin.from.mockReturnValueOnce(awaitable({ data: rows, error: null, count: 1 }));

    const res = await request(app).get('/api/explore?category=photographer');

    expect(res.status).toBe(200);
    expect(res.body.vendors).toHaveLength(1);
    expect(res.body.vendors[0].avgRating).toBeNull(); // no rated services (total_reviews=0)
    expect(res.body.vendors[0].minPrice).toBe(500);
  });

  test('falls back to pre-migration select when primary_category column is missing', async () => {
    const rows = [{
      id: 'h1', name: 'Asha', username: 'asha', tagline: 't', profile_image: 'p.jpg',
      primary_category: 'photographer',
      services: [{
        price: 999, rating: 4.8, total_reviews: 12, category: 'wedding-photography',
        is_active: true,
      }],
    }];

    const failQuery = awaitable({ data: null, error: { message: 'column services.primary_category does not exist' } });
    const fallbackQuery = awaitable({ data: rows, error: null, count: 1 });

    supabaseAdmin.from
      .mockReturnValueOnce(failQuery)
      .mockReturnValueOnce(fallbackQuery);

    const res = await request(app).get('/api/explore?category=photographer&service=wedding-photography');

    expect(res.status).toBe(200);
    expect(res.body.vendors).toHaveLength(1);
    expect(res.body.vendors[0].username).toBe('asha');
    expect(supabaseAdmin.from).toHaveBeenCalledTimes(2);

    // Assert that the fallback query (second .from() call) does NOT include
    // services.primary_category filter (pre-migration schema)
    const fallbackEqCalls = fallbackQuery.eq.mock.calls;
    expect(fallbackEqCalls.some(call => call[0] === 'services.primary_category'))
      .toBe(false);
  });

  test('q is sanitized (PostgREST metachars stripped) before the ilike .or() filter', async () => {
    const mockQuery = awaitable({ data: [], error: null, count: 0 });
    supabaseAdmin.from.mockReturnValueOnce(mockQuery);

    const res = await request(app).get('/api/explore?q=' + encodeURIComponent('foo,bar(baz)'));

    expect(res.status).toBe(200);
    expect(res.body.vendors).toEqual([]);
    // Metachars ,() are stripped by sanitizeLikeTerm; the response echoes the
    // sanitized term (what was actually queried), and the ilike uses it too.
    expect(res.body.filters.q).toBe('foobarbaz');
    expect(mockQuery.or).toHaveBeenCalledWith('name.ilike.%foobarbaz%,tagline.ilike.%foobarbaz%');
  });

  test('q under 2 chars is ignored (no ilike filter, no wasteful near-full scan)', async () => {
    const mockQuery = awaitable({ data: [], error: null, count: 0 });
    supabaseAdmin.from.mockReturnValueOnce(mockQuery);

    const res = await request(app).get('/api/explore?q=a');

    expect(res.status).toBe(200);
    expect(res.body.filters.q).toBe('');
    expect(mockQuery.or).not.toHaveBeenCalled();
  });

  test('limit is clamped to 48 and page defaults to 1; hasMore computed from total', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      id: `h${i}`, name: `Host ${i}`, username: `host${i}`, tagline: '', profile_image: null,
      primary_category: 'photographer',
      services: [{ price: 100, rating: 5, total_reviews: 1, category: 'x', primary_category: 'photographer', is_active: true }],
    }));

    supabaseAdmin.from.mockReturnValueOnce(awaitable({ data: rows, error: null, count: 100 }));

    const res = await request(app).get('/api/explore?limit=999');

    expect(res.status).toBe(200);
    expect(res.body.meta.limit).toBe(48);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.total).toBe(100);
    expect(res.body.meta.hasMore).toBe(true);
  });

  test('500 on unexpected (non-schema) error', async () => {
    supabaseAdmin.from.mockReturnValueOnce(awaitable({ data: null, error: { message: 'connection refused' } }));

    const res = await request(app).get('/api/explore');

    expect(res.status).toBe(500);
  });
});

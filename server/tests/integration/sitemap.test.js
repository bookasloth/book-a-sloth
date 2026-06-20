/**
 * tests/integration/sitemap.test.js
 * Root-mounted dynamic sitemap: index + children, pagination, content-type.
 * DB fetchers are mocked; the pure mappers + XML builders run for real.
 */
process.env.SITE_URL = 'https://bookasloth.com';

jest.mock('../../config/supabase', () => ({ supabaseAdmin: {} }));
jest.mock('../../services/sitemapService', () => {
  const actual = jest.requireActual('../../services/sitemapService');
  return {
    ...actual,
    fetchHosts: jest.fn(),
    fetchServices: jest.fn(),
  };
});

const request = require('supertest');
const express = require('express');
const sitemapRoutes = require('../../routes/sitemapRoutes');
const { fetchHosts, fetchServices } = require('../../services/sitemapService');
const { bustSitemapCache } = require('../../utils/sitemapCache');

const app = express();
app.use(sitemapRoutes);

beforeEach(() => {
  bustSitemapCache(); // singleton cache leaks across tests otherwise
  fetchHosts.mockResolvedValue([{ username: 'john-doe', updated_at: '2026-06-20T10:00:00Z' }]);
  fetchServices.mockResolvedValue([
    { slug: 'business-consultation', updated_at: '2026-06-20T10:00:00Z', profiles: { username: 'john-doe' } },
  ]);
});

describe('GET /sitemap.xml (index)', () => {
  test('returns a sitemap index referencing the children, as XML', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/xml/);
    expect(res.text).toContain('<sitemapindex');
    expect(res.text).toContain('https://bookasloth.com/sitemap-pages.xml');
    expect(res.text).toContain('https://bookasloth.com/sitemap-hosts-1.xml');
    expect(res.text).toContain('https://bookasloth.com/sitemap-services-1.xml');
  });
});

describe('child sitemaps', () => {
  test('pages sitemap lists the homepage', async () => {
    const res = await request(app).get('/sitemap-pages.xml');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<urlset');
    expect(res.text).toContain('<loc>https://bookasloth.com/</loc>');
  });

  test('hosts sitemap lists the verified host profile URL', async () => {
    const res = await request(app).get('/sitemap-hosts-1.xml');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<loc>https://bookasloth.com/john-doe</loc>');
  });

  test('services sitemap lists the /username/slug URL', async () => {
    const res = await request(app).get('/sitemap-services-1.xml');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<loc>https://bookasloth.com/john-doe/business-consultation</loc>');
  });

  test('the non-numbered alias resolves to page 1', async () => {
    const res = await request(app).get('/sitemap-hosts.xml');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<loc>https://bookasloth.com/john-doe</loc>');
  });

  test('an out-of-range page is a 404', async () => {
    const res = await request(app).get('/sitemap-hosts-2.xml');
    expect(res.status).toBe(404);
  });
});

// server/tests/unit/gscSync.test.js
jest.mock('../../services/seo/gscClient');
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));

const gscClient = require('../../services/seo/gscClient');
const { supabaseAdmin } = require('../../config/supabase');
const gscSync = require('../../services/seo/gscSync');

const makeQuery = (result) => {
  const q = {};
  ['select', 'eq', 'order', 'limit', 'range', 'single', 'maybeSingle'].forEach((m) => (q[m] = jest.fn(() => q)));
  q.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return q;
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('run() no-ops and never touches supabase when unconfigured', async () => {
  gscClient.isConfigured.mockReturnValue(false);
  const result = await gscSync.run();
  expect(result).toEqual({ skipped: true });
  expect(supabaseAdmin.from).not.toHaveBeenCalled();
});

test('run() inspects each seeded URL, queries analytics once, and upserts merged rows', async () => {
  gscClient.isConfigured.mockReturnValue(true);
  gscClient.siteUrl.mockReturnValue('sc-domain:bookasloth.com');
  const inspect = jest.fn().mockImplementation(({ requestBody }) => Promise.resolve({
    data: {
      inspectionResult: {
        indexStatusResult: {
          coverageState: 'Submitted and indexed',
          indexingState: 'INDEXING_ALLOWED',
          googleCanonical: requestBody.inspectionUrl,
          userCanonical: requestBody.inspectionUrl,
          robotsTxtState: 'ALLOWED',
          lastCrawlTime: '2026-09-01T00:00:00Z',
        },
      },
    },
  }));
  const query = jest.fn().mockResolvedValue({
    data: {
      rows: [
        { keys: ['https://bookasloth.com/a'], clicks: 3, impressions: 10, ctr: 0.3, position: 4.2 },
      ],
    },
  });
  gscClient.getClient.mockReturnValue({
    urlInspection: { index: { inspect } },
    searchanalytics: { query },
  });

  const upsert = jest.fn().mockResolvedValue({ error: null });
  supabaseAdmin.from.mockImplementation((table) => {
    if (table === 'seo_crawls') return makeQuery({ data: [{ id: 'crawl-1' }], error: null });
    if (table === 'seo_crawl_pages') return makeQuery({ data: [{ url: 'https://bookasloth.com/a' }, { url: 'https://bookasloth.com/b' }], error: null });
    if (table === 'seo_gsc_urls') return { upsert };
    return makeQuery({ data: [], error: null });
  });

  const result = await gscSync.run();

  expect(inspect).toHaveBeenCalledTimes(2);
  expect(query).toHaveBeenCalledTimes(1);
  expect(query).toHaveBeenCalledWith(expect.objectContaining({
    siteUrl: 'sc-domain:bookasloth.com',
    requestBody: expect.objectContaining({ dimensions: ['page'], rowLimit: 25000 }),
  }));

  expect(upsert).toHaveBeenCalledTimes(1);
  const [rows, opts] = upsert.mock.calls[0];
  expect(opts).toEqual({ onConflict: 'url' });
  expect(rows).toHaveLength(2);
  const rowA = rows.find((r) => r.url === 'https://bookasloth.com/a');
  expect(rowA).toMatchObject({
    url: 'https://bookasloth.com/a',
    coverage_state: 'Submitted and indexed',
    impressions: 10,
    clicks: 3,
    ctr: 0.3,
    position: 4.2,
  });
  const rowB = rows.find((r) => r.url === 'https://bookasloth.com/b');
  expect(rowB).toMatchObject({ url: 'https://bookasloth.com/b', impressions: 0, clicks: 0 });

  expect(result).toEqual({ inspected: 2, analytics: 1, upserted: 2 });
});

test('run() isolates a single URL inspection failure — other URLs still upsert', async () => {
  gscClient.isConfigured.mockReturnValue(true);
  gscClient.siteUrl.mockReturnValue('sc-domain:bookasloth.com');
  const inspect = jest.fn()
    .mockRejectedValueOnce(new Error('quota exceeded'))
    .mockResolvedValueOnce({
      data: { inspectionResult: { indexStatusResult: { coverageState: 'Submitted and indexed' } } },
    });
  const query = jest.fn().mockResolvedValue({ data: { rows: [] } });
  gscClient.getClient.mockReturnValue({
    urlInspection: { index: { inspect } },
    searchanalytics: { query },
  });

  const upsert = jest.fn().mockResolvedValue({ error: null });
  supabaseAdmin.from.mockImplementation((table) => {
    if (table === 'seo_crawls') return makeQuery({ data: [{ id: 'crawl-1' }], error: null });
    if (table === 'seo_crawl_pages') return makeQuery({ data: [{ url: 'https://bookasloth.com/bad' }, { url: 'https://bookasloth.com/good' }], error: null });
    if (table === 'seo_gsc_urls') return { upsert };
    return makeQuery({ data: [], error: null });
  });

  const result = await gscSync.run();

  expect(inspect).toHaveBeenCalledTimes(2);
  const rows = upsert.mock.calls[0][0];
  expect(rows.map((r) => r.url)).toEqual(['https://bookasloth.com/good']);
  expect(result.upserted).toBe(1);
});

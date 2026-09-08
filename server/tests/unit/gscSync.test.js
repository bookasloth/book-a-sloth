// server/tests/unit/gscSync.test.js
jest.mock('../../services/seo/gscClient');
jest.mock('../../config/supabase', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('../../utils/jobLock', () => ({ runLocked: jest.fn((_n, fn) => fn()) }));

const gscClient = require('../../services/seo/gscClient');
const { supabaseAdmin } = require('../../config/supabase');
const { runLocked } = require('../../utils/jobLock');
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

test('run() upserts analytics first, then inspects and upserts each seeded URL', async () => {
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

  expect(query).toHaveBeenCalledTimes(1);
  expect(query).toHaveBeenCalledWith(expect.objectContaining({
    siteUrl: 'sc-domain:bookasloth.com',
    requestBody: expect.objectContaining({ dimensions: ['page'], rowLimit: 25000 }),
  }));
  expect(inspect).toHaveBeenCalledTimes(2);

  // One analytics upsert (batched) + one per inspected URL.
  expect(upsert).toHaveBeenCalledTimes(3);
  expect(upsert.mock.calls.every(([, opts]) => opts && opts.onConflict === 'url')).toBe(true);

  // First upsert is the analytics batch (impressions only, no coverage columns).
  const analyticsPayload = upsert.mock.calls[0][0];
  expect(analyticsPayload).toHaveLength(1);
  expect(analyticsPayload[0]).toMatchObject({ url: 'https://bookasloth.com/a', impressions: 10, clicks: 3, ctr: 0.3, position: 4.2 });
  expect(analyticsPayload[0]).not.toHaveProperty('coverage_state');

  // Subsequent upserts are per-URL inspection rows (coverage, no impressions).
  const inspectPayloads = upsert.mock.calls.slice(1).map(([rows]) => rows);
  const inspectedUrls = inspectPayloads.map((row) => row.url).sort();
  expect(inspectedUrls).toEqual(['https://bookasloth.com/a', 'https://bookasloth.com/b']);
  expect(inspectPayloads[0]).toMatchObject({ coverage_state: 'Submitted and indexed' });
  expect(inspectPayloads[0]).not.toHaveProperty('impressions');

  expect(result).toEqual({ analyticsRows: 1, analyticsUpserted: 1, inspected: 2, inspectUpserted: 2, urls: 2 });
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
  // Analytics had no rows → no analytics upsert. Only the good URL's inspection upserts.
  expect(upsert).toHaveBeenCalledTimes(1);
  expect(upsert.mock.calls[0][0]).toMatchObject({ url: 'https://bookasloth.com/good' });
  expect(result).toMatchObject({ analyticsUpserted: 0, inspected: 1, inspectUpserted: 1 });
});

test('run() survives a hung/slow inspection call via the per-call timeout', async () => {
  jest.useFakeTimers();
  gscClient.isConfigured.mockReturnValue(true);
  gscClient.siteUrl.mockReturnValue('sc-domain:bookasloth.com');
  // First inspect never resolves (hung); timeout must reject it and move on.
  const inspect = jest.fn()
    .mockImplementationOnce(() => new Promise(() => {}))
    .mockResolvedValueOnce({ data: { inspectionResult: { indexStatusResult: { coverageState: 'Indexed' } } } });
  const query = jest.fn().mockResolvedValue({ data: { rows: [] } });
  gscClient.getClient.mockReturnValue({ urlInspection: { index: { inspect } }, searchanalytics: { query } });

  const upsert = jest.fn().mockResolvedValue({ error: null });
  supabaseAdmin.from.mockImplementation((table) => {
    if (table === 'seo_crawls') return makeQuery({ data: [{ id: 'crawl-1' }], error: null });
    if (table === 'seo_crawl_pages') return makeQuery({ data: [{ url: 'https://bookasloth.com/hang' }, { url: 'https://bookasloth.com/ok' }], error: null });
    if (table === 'seo_gsc_urls') return { upsert };
    return makeQuery({ data: [], error: null });
  });

  const p = gscSync.run();
  // Let the microtasks settle, then fire the timeout on the hung call + the throttle sleeps.
  await jest.runAllTimersAsync();
  const result = await p;

  expect(inspect).toHaveBeenCalledTimes(2);
  expect(upsert).toHaveBeenCalledTimes(1); // only /ok upserts; /hang timed out
  expect(upsert.mock.calls[0][0]).toMatchObject({ url: 'https://bookasloth.com/ok' });
  expect(result).toMatchObject({ inspected: 1, inspectUpserted: 1, urls: 2 });
  jest.useRealTimers();
});

test('run() returns {skipped:true} without calling the API when a sync is already in flight', async () => {
  gscClient.isConfigured.mockReturnValue(true);
  runLocked.mockResolvedValueOnce(undefined); // lock held by a concurrent run

  const result = await gscSync.run();

  expect(result).toEqual({ skipped: true, reason: 'in-flight' });
  expect(gscClient.getClient).not.toHaveBeenCalled();
});

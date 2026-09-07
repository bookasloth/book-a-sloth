// server/tests/integration/seoCrawler.test.js
jest.mock('../../services/seo/seoFetch', () => ({
  fetchUrl: jest.fn(async (url) => ({
    status: 200, finalUrl: url, redirectChain: [], responseMs: 50, contentType: 'text/html',
    headers: {}, body: `<title>${url}</title><h1>${url}</h1><meta name="description" content="${'d'.repeat(150)}">`, error: null,
  })),
}));
jest.mock('../../services/seo/seoPersist', () => ({
  createCrawl: jest.fn(async () => 'crawl1'),
  finishCrawl: jest.fn(async () => {}),
  saveResults: jest.fn(async () => {}),
}));
jest.mock('../../services/sitemapService', () => ({
  STATIC_ROUTES: [{ path: '/', changefreq: 'daily', priority: 1 }],
  staticEntries: () => [{ loc: 'https://bookasloth.com/' }],
  hostUrl: (s, u) => `${s}/${u}`, serviceUrl: (s, u, sl) => `${s}/${u}/${sl}`,
  fetchHosts: async () => [{ username: 'jane', updated_at: null }],
  fetchServices: async () => [{ slug: 'intro', profiles: { username: 'jane' } }],
  fetchBlogs: async () => [{ slug: 'post-1' }],
  fetchProfessions: async () => [],
}));
jest.mock('../../utils/jobLock', () => ({ runLocked: jest.fn((_n, fn) => fn()) }));

const persist = require('../../services/seo/seoPersist');
const { runLocked } = require('../../utils/jobLock');
const { run, seedUrls } = require('../../services/seo/seoCrawler');

describe('seoCrawler', () => {
  test('seedUrls includes static, host, service, blog URLs', async () => {
    const urls = await seedUrls();
    const list = urls.map((u) => u.url);
    expect(list).toContain('https://bookasloth.com');
    expect(list).toContain('https://bookasloth.com/jane');
    expect(list).toContain('https://bookasloth.com/jane/intro');
    expect(list).toContain('https://bookasloth.com/blog/post-1');
  });
  test('run() crawls, scores and persists', async () => {
    const id = await run({ trigger: 'manual' });
    expect(id).toBe('crawl1');
    expect(persist.saveResults).toHaveBeenCalledTimes(1);
    const [, pages, issues, scores] = persist.saveResults.mock.calls[0];
    expect(pages.length).toBeGreaterThan(0);
    expect(Array.isArray(issues)).toBe(true);
    expect(scores.overall).toBeLessThanOrEqual(100);
  });

  // Regression: staticEntries' homepage loc AND an explicit add() both resolved to the
  // homepage — seeded twice, doubling titleCounts/descCounts and fabricating duplicate-title
  // issues against the homepage every crawl. Assert it now appears exactly once.
  test('seedUrls seeds the homepage exactly once (no static+explicit dupe)', async () => {
    const urls = await seedUrls();
    const list = urls.map((u) => u.url);
    const homepageHits = list.filter((u) => u === 'https://bookasloth.com' || u === 'https://bookasloth.com/');
    expect(homepageHits.length).toBe(1);
  });

  // Regression: a 200 page with no robots meta defaulted `noindex` to null, and
  // `null === false` is false, so normal pages were persisted indexable:false.
  test('indexable is true for a 200 page with no robots meta', async () => {
    await run({ trigger: 'manual' });
    const calls = persist.saveResults.mock.calls;
    const pages = calls[calls.length - 1][1];
    expect(pages.length).toBeGreaterThan(0);
    expect(pages.every((p) => p.indexable === true)).toBe(true);
  });

  // Regression: runLocked returns undefined (no throw) when a crawl is already in-flight
  // or another instance holds the lease. run()/start() must not leave the row 'running'
  // forever, and must not persist a partial/empty result for the skipped tick.
  test('when the lock is skipped, the crawl is marked skipped and nothing is persisted', async () => {
    const saveResultsCallsBefore = persist.saveResults.mock.calls.length;
    runLocked.mockImplementationOnce(() => undefined);
    const id = await run({ trigger: 'manual' });
    expect(id).toBe('crawl1');
    expect(persist.finishCrawl).toHaveBeenLastCalledWith('crawl1', { status: 'skipped' });
    expect(persist.saveResults.mock.calls.length).toBe(saveResultsCallsBefore);
  });
});

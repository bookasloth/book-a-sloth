// server/services/seo/seoCrawler.js
const sm = require('../sitemapService');
const { fetchUrl } = require('./seoFetch');
const { parse } = require('./seoParse');
const { buildContext, runRules, runSiteRules } = require('./rules');
const { prioritize } = require('./prioritize');
const { score } = require('./healthScore');
const persist = require('./seoPersist');
const { runLocked } = require('../../utils/jobLock');

const SITE_URL = (process.env.SITE_URL || 'https://bookasloth.com').replace(/\/$/, '');
const CONCURRENCY = Number(process.env.SEO_CRAWL_CONCURRENCY) || 4;
const DELAY_MS = Number(process.env.SEO_CRAWL_DELAY_MS) || 150;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function seedUrls() {
  const out = [];
  const seen = new Set();
  const add = (url, pageType) => { if (!seen.has(url)) { seen.add(url); out.push({ url, pageType, inSitemap: true }); } };
  for (const e of sm.staticEntries(SITE_URL)) add(e.loc.replace(/\/$/, '') || `${SITE_URL}/`, 'static');
  for (const h of await sm.fetchHosts()) add(sm.hostUrl(SITE_URL, h.username), 'host');
  for (const s of await sm.fetchServices()) if (s.profiles?.username) add(sm.serviceUrl(SITE_URL, s.profiles.username, s.slug), 'service');
  for (const b of await sm.fetchBlogs()) add(`${SITE_URL}/blog/${b.slug}`, 'blog');
  for (const p of await sm.fetchProfessions()) add(`${SITE_URL}/for/${p.slug}`, 'static');
  return out;
}

async function crawlOne(seed) {
  const r = await fetchUrl(seed.url);
  const parsed = r.status === 200 && (r.contentType || '').includes('html') ? parse(r.body, r.headers) : {};
  const noindex = parsed.robots ? parsed.robots.includes('noindex') : false;
  return {
    url: seed.url, pageType: seed.pageType, inSitemap: seed.inSitemap,
    httpStatus: r.status, finalUrl: r.finalUrl, redirectChain: r.redirectChain, responseMs: r.responseMs, contentType: r.contentType,
    title: parsed.title || null, metaDescription: parsed.metaDescription || null, canonical: parsed.canonical || null,
    robots: parsed.robots || null, h1: parsed.h1 || [], headings: parsed.headings || [],
    links: parsed.links || { internal: [], external: [] }, images: parsed.images || [], jsonLd: parsed.jsonLd || [],
    wordCount: parsed.wordCount || 0, viewport: parsed.viewport || null,
    indexable: r.status === 200 && noindex === false, fetchError: r.error,
  };
}

async function pool(items, n, worker) {
  const results = []; let idx = 0;
  const runners = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (idx < items.length) { const i = idx++; results[i] = await worker(items[i]); if (DELAY_MS) await sleep(DELAY_MS); }
  });
  await Promise.all(runners);
  return results;
}

async function _execute(crawlId, seeds) {
  // ponytail: distinct name from the outer runIfDue('seo-crawl', ...) lock in
  // server.js — same name here would collide with jobLock's _inFlight guard
  // and self-skip every nightly tick (manual start() has no outer lock, so it
  // never hit this). Nightly now holds BOTH locks; manual vs nightly still
  // serialize against each other via this inner lock.
  return runLocked('seo-crawl-exec', async () => {
    const sitemapUrls = new Set(seeds.map((s) => s.url));
    const pages = await pool(seeds, CONCURRENCY, crawlOne);
    const ctx = buildContext(pages, sitemapUrls);
    let issues = [];
    for (const p of pages) issues.push(...runRules(p, ctx));
    issues.push(...runSiteRules(ctx));
    issues = issues.map((i) => ({ ...i, ...prioritize(i, ctx) }));
    const scores = score(issues);
    await persist.saveResults(crawlId, pages, issues, scores);
    await persist.finishCrawl(crawlId, { status: 'done', counts: { url_count: seeds.length, page_count: pages.length, issue_count: issues.length } });
    return { pages, issues, scores };
  });
}

async function run({ trigger = 'manual', triggeredBy = null } = {}) {
  const crawlId = await persist.createCrawl({ trigger, triggeredBy });
  try {
    const result = await _execute(crawlId, await seedUrls());
    if (result === undefined) await persist.finishCrawl(crawlId, { status: 'skipped' });
  }
  catch (e) { await persist.finishCrawl(crawlId, { status: 'failed', error: e.message }); throw e; }
  return crawlId;
}
async function start({ trigger = 'manual', triggeredBy = null } = {}) {
  const crawlId = await persist.createCrawl({ trigger, triggeredBy });
  seedUrls().then((s) => _execute(crawlId, s)).then((result) => {
    if (result === undefined) return persist.finishCrawl(crawlId, { status: 'skipped' });
  }).catch((e) => persist.finishCrawl(crawlId, { status: 'failed', error: e.message }));
  return crawlId;
}
module.exports = { run, start, seedUrls };

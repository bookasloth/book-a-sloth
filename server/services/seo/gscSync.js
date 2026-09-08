// gscSync.js — pulls Google Search Console data into seo_gsc_urls (P1.5).
// No-ops gracefully when GSC creds aren't configured yet (ships pre-cutover).
const gscClient = require('./gscClient');
const { supabaseAdmin } = require('../../config/supabase');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isoDate = (d) => d.toISOString().slice(0, 10);

async function seedUrls() {
  const max = Number(process.env.GSC_INSPECT_MAX) || 2000;
  const { data: crawls } = await supabaseAdmin
    .from('seo_crawls')
    .select('id')
    .order('started_at', { ascending: false })
    .limit(1);
  const crawlId = crawls?.[0]?.id;
  if (!crawlId) return [];
  const { data: pages } = await supabaseAdmin
    .from('seo_crawl_pages')
    .select('url')
    .eq('crawl_id', crawlId)
    .eq('indexable', true)
    .limit(max);
  return (pages || []).map((p) => p.url);
}

async function run() {
  if (!gscClient.isConfigured()) {
    console.log('[gsc-sync] not configured (GSC_SA_KEY/GSC_PROPERTY unset) — skipping');
    return { skipped: true };
  }

  const sc = gscClient.getClient();
  const siteUrl = gscClient.siteUrl();

  const urls = await seedUrls();

  // URL Inspection — per URL, throttled, each failure isolated.
  const inspectionByUrl = new Map();
  for (const url of urls) {
    try {
      const res = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: url, siteUrl } });
      const result = res?.data?.inspectionResult?.indexStatusResult || {};
      inspectionByUrl.set(url, {
        coverage_state: result.coverageState || null,
        indexing_state: result.indexingState || null,
        google_canonical: result.googleCanonical || null,
        user_canonical: result.userCanonical || null,
        robots_txt_state: result.robotsTxtState || null,
        last_crawl_time: result.lastCrawlTime || null,
        inspection_raw: result,
      });
    } catch (err) {
      console.warn(`[gsc-sync] inspection failed for ${url}:`, err.message);
    }
    await sleep(120);
  }

  // Search Analytics — one batched call, last 28 days.
  const analyticsByUrl = new Map();
  const today = new Date();
  const start = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
  let analyticsRows = 0;
  try {
    const res = await sc.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: isoDate(start),
        endDate: isoDate(today),
        dimensions: ['page'],
        rowLimit: 25000,
      },
    });
    const rows = res?.data?.rows || [];
    analyticsRows = rows.length;
    for (const row of rows) {
      const page = row.keys?.[0];
      if (!page) continue;
      analyticsByUrl.set(page, {
        impressions: row.impressions || 0,
        clicks: row.clicks || 0,
        ctr: row.ctr || 0,
        position: row.position || null,
        analytics_raw: row,
      });
    }
  } catch (err) {
    console.warn('[gsc-sync] search analytics query failed:', err.message);
  }

  // Merge + upsert.
  const allUrls = new Set([...inspectionByUrl.keys(), ...analyticsByUrl.keys()]);
  const now = new Date().toISOString();
  const rows = [...allUrls].map((url) => {
    const insp = inspectionByUrl.get(url) || {};
    const an = analyticsByUrl.get(url) || {};
    return {
      url,
      coverage_state: insp.coverage_state ?? null,
      indexing_state: insp.indexing_state ?? null,
      google_canonical: insp.google_canonical ?? null,
      user_canonical: insp.user_canonical ?? null,
      robots_txt_state: insp.robots_txt_state ?? null,
      last_crawl_time: insp.last_crawl_time ?? null,
      impressions: an.impressions ?? 0,
      clicks: an.clicks ?? 0,
      ctr: an.ctr ?? 0,
      position: an.position ?? null,
      inspection_raw: insp.inspection_raw ?? {},
      analytics_raw: an.analytics_raw ?? {},
      last_synced: now,
    };
  });

  if (rows.length) {
    const { error } = await supabaseAdmin.from('seo_gsc_urls').upsert(rows, { onConflict: 'url' });
    if (error) throw error;
  }

  return { inspected: inspectionByUrl.size, analytics: analyticsRows, upserted: rows.length };
}

module.exports = { run };

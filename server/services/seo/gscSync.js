// gscSync.js — pulls Google Search Console data into seo_gsc_urls (P1.5).
// No-ops gracefully when GSC creds aren't configured yet (ships pre-cutover).
const gscClient = require('./gscClient');
const { supabaseAdmin } = require('../../config/supabase');
const { runLocked } = require('../../utils/jobLock');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isoDate = (d) => d.toISOString().slice(0, 10);

// A single GSC call must never hang the whole run: URL Inspection is a per-URL
// round-trip and one stalled request (no client-side timeout in googleapis by
// default) would block the sequential loop forever, so it never reaches the
// upsert/stamp. Race every call against a hard deadline.
const withTimeout = (p, ms, label) => {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
};

const INSPECT_TIMEOUT_MS = Number(process.env.GSC_INSPECT_TIMEOUT_MS) || 15000;
const ANALYTICS_TIMEOUT_MS = Number(process.env.GSC_ANALYTICS_TIMEOUT_MS) || 30000;

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

  // Distinct lock name from the scheduler's outer runLocked('gsc-sync') — a manual
  // trigger calls run() directly with no outer lock, so the sync body needs its own
  // lease here to stay safe against overlap with a concurrent run (manual or nightly).
  const result = await runLocked('gsc-sync-exec', async () => {
    const sc = gscClient.getClient();
    const siteUrl = gscClient.siteUrl();
    const now = new Date().toISOString();

    // --- Search Analytics FIRST: one batched call, cheap, and the highest-value
    // data (impressions/clicks/position). Upsert it immediately so it lands even
    // if the slow per-URL inspection loop later stalls or the pod is recycled. ---
    let analyticsRows = 0;
    let analyticsUpserted = 0;
    try {
      const today = new Date();
      const start = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
      const res = await withTimeout(
        sc.searchanalytics.query({
          siteUrl,
          requestBody: { startDate: isoDate(start), endDate: isoDate(today), dimensions: ['page'], rowLimit: 25000 },
        }),
        ANALYTICS_TIMEOUT_MS,
        'searchanalytics',
      );
      const rows = res?.data?.rows || [];
      analyticsRows = rows.length;
      const payload = rows
        .map((row) => {
          const url = row.keys?.[0];
          if (!url) return null;
          return {
            url,
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            ctr: row.ctr || 0,
            position: row.position || null,
            analytics_raw: row,
            last_synced: now,
          };
        })
        .filter(Boolean);
      if (payload.length) {
        // Partial upsert (only analytics columns) — coverage columns on existing
        // rows are left untouched by PostgREST merge-duplicates.
        const { error } = await supabaseAdmin.from('seo_gsc_urls').upsert(payload, { onConflict: 'url' });
        if (error) throw error;
        analyticsUpserted = payload.length;
      }
    } catch (err) {
      console.warn('[gsc-sync] search analytics query failed:', err.message);
    }

    // --- URL Inspection: per URL, throttled, each call time-boxed and isolated so
    // one stuck/failed URL can't hang or abort the run. ---
    const urls = await seedUrls();
    let inspected = 0;
    let inspectUpserted = 0;
    for (const url of urls) {
      try {
        const res = await withTimeout(
          sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: url, siteUrl } }),
          INSPECT_TIMEOUT_MS,
          'inspect',
        );
        const r = res?.data?.inspectionResult?.indexStatusResult || {};
        const { error } = await supabaseAdmin.from('seo_gsc_urls').upsert(
          {
            url,
            coverage_state: r.coverageState || null,
            indexing_state: r.indexingState || null,
            google_canonical: r.googleCanonical || null,
            user_canonical: r.userCanonical || null,
            robots_txt_state: r.robotsTxtState || null,
            last_crawl_time: r.lastCrawlTime || null,
            inspection_raw: r,
            last_synced: new Date().toISOString(),
          },
          { onConflict: 'url' },
        );
        if (error) throw error;
        inspected += 1;
        inspectUpserted += 1;
      } catch (err) {
        console.warn(`[gsc-sync] inspection failed for ${url}:`, err.message);
      }
      await sleep(120);
    }

    const summary = { analyticsRows, analyticsUpserted, inspected, inspectUpserted, urls: urls.length };
    console.log('[gsc-sync] done', JSON.stringify(summary));
    return summary;
  });

  if (result === undefined) return { skipped: true, reason: 'in-flight' };
  return result;
}

module.exports = { run };

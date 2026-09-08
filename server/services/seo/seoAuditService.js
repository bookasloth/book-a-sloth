'use strict';
// seoAuditService.js — read helpers for the SEO Audit Engine admin API (v3.145
// tables: seo_crawls, seo_crawl_pages, seo_issues, seo_score_snapshots,
// seo_issue_mutes). Read-only except muteIssue. Every query goes through
// supabaseAdmin; a Supabase error is thrown so the controller's try/catch ->
// safeError handles it uniformly.
const { supabaseAdmin } = require('../../config/supabase');
const { scorePage } = require('./healthScore');
const { categoryForType } = require('./pageClassify');

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// Newest done/skipped crawl id (falls back to newest of any status).
async function latestCrawlId() {
  const rows = unwrap(await supabaseAdmin.from('seo_crawls').select('id,status').order('started_at', { ascending: false }).limit(5));
  const done = (rows || []).find((c) => c.status === 'done');
  return (done || rows?.[0])?.id || null;
}

// Newest crawl + its score snapshot + open-issue counts by severity.
async function latestOverview() {
  const crawls = unwrap(await supabaseAdmin.from('seo_crawls').select('*').order('started_at', { ascending: false }).limit(1));
  const crawl = (crawls && crawls[0]) || null;
  if (!crawl) return { crawl: null, scores: null, counts: {} };

  const snaps = unwrap(await supabaseAdmin.from('seo_score_snapshots').select('*').eq('crawl_id', crawl.id).order('taken_at', { ascending: false }).limit(1));
  const scores = (snaps && snaps[0]) || null;

  const issues = unwrap(await supabaseAdmin.from('seo_issues').select('severity').eq('crawl_id', crawl.id));
  const counts = {};
  for (const i of issues || []) counts[i.severity] = (counts[i.severity] || 0) + 1;

  return { crawl, scores, counts };
}

async function listIssues(filters = {}) {
  let q = supabaseAdmin.from('seo_issues').select('*').order('priority_score', { ascending: false });
  if (filters.crawlId) q = q.eq('crawl_id', filters.crawlId);
  if (filters.severity) q = q.eq('severity', filters.severity);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.limit) q = q.limit(Number(filters.limit));
  return unwrap(await q);
}

async function getIssue(id) {
  return unwrap(await supabaseAdmin.from('seo_issues').select('*').eq('id', id).maybeSingle());
}

async function listPages(filters = {}) {
  let q = supabaseAdmin.from('seo_crawl_pages').select('*').order('created_at', { ascending: false });
  if (filters.crawlId) q = q.eq('crawl_id', filters.crawlId);
  if (filters.pageType) q = q.eq('page_type', filters.pageType);
  if (filters.indexable != null) q = q.eq('indexable', filters.indexable);
  if (filters.limit) q = q.limit(Number(filters.limit));
  return unwrap(await q);
}

async function getPage(id) {
  const page = unwrap(await supabaseAdmin.from('seo_crawl_pages').select('*').eq('id', id).maybeSingle());
  if (!page) return null;
  const issues = unwrap(await supabaseAdmin.from('seo_issues').select('severity,category,rule_key').eq('page_id', id));
  const decorated = (issues || []).map((i) => ({ severity: i.severity, category: i.category, ruleKey: i.rule_key }));
  const sp = scorePage(decorated, page.page_type);
  return { ...page, category: categoryForType(page.page_type), status: sp.status, health: sp.health,
    dimensions: sp.dimensions, critical_count: sp.criticalCount, issue_count: sp.issueCount };
}

// Score trend — most recent snapshots first, newest crawl last-in for a chart.
async function scoreHistory() {
  return unwrap(await supabaseAdmin.from('seo_score_snapshots').select('*').order('taken_at', { ascending: false }).limit(90));
}

async function getCrawl(id) {
  return unwrap(await supabaseAdmin.from('seo_crawls').select('*').eq('id', id).maybeSingle());
}

// GSC-synced URLs (seo_gsc_urls, populated by services/seo/gscSync). Fail soft:
// table may not exist yet pre-cutover, or the query may error — never throw.
async function listGscUrls({ limit = 500 } = {}) {
  try {
    return unwrap(await supabaseAdmin.from('seo_gsc_urls').select('*').order('impressions', { ascending: false }).limit(limit));
  } catch (e) {
    return [];
  }
}

// ── Phase 1 read-time intelligence (no writes, no migration) ─────────────────

// Evidence maturity (spec §1i): how many crawls a URL has appeared in. Thresholds
// configurable — one bad/good month must not make a page sacred or disposable.
// ponytail: tallies the whole url column in one query. Fine at current volume;
// swap for a grouped aggregate if seo_crawl_pages grows past a few 100k rows.
const MATURITY = { developing: Number(process.env.SEO_MATURITY_DEVELOPING) || 2, established: Number(process.env.SEO_MATURITY_ESTABLISHED) || 5, strong: Number(process.env.SEO_MATURITY_STRONG) || 12 };
function maturityLevel(n) {
  if (n >= MATURITY.strong) return 'STRONG';
  if (n >= MATURITY.established) return 'ESTABLISHED';
  if (n >= MATURITY.developing) return 'DEVELOPING';
  return 'NEW';
}
async function maturityByUrl() {
  const rows = unwrap(await supabaseAdmin.from('seo_crawl_pages').select('url').limit(100000));
  const counts = new Map();
  for (const r of rows || []) counts.set(r.url, (counts.get(r.url) || 0) + 1);
  return counts;
}

// Per-page report for one crawl: each page enriched with hard status, health
// score, per-dimension scores and evidence maturity (spec §1a/§1b/§1i).
async function pageReports({ crawlId } = {}) {
  const id = crawlId || (await latestCrawlId());
  if (!id) return { crawlId: null, pages: [] };
  const pages = unwrap(await supabaseAdmin.from('seo_crawl_pages').select('*').eq('crawl_id', id));
  const issues = unwrap(await supabaseAdmin.from('seo_issues').select('severity,category,rule_key,affected_url').eq('crawl_id', id));
  const byUrl = new Map();
  for (const i of issues || []) {
    if (!byUrl.has(i.affected_url)) byUrl.set(i.affected_url, []);
    byUrl.get(i.affected_url).push({ severity: i.severity, category: i.category, ruleKey: i.rule_key });
  }
  const maturity = await maturityByUrl();
  const out = (pages || []).map((p) => {
    const sp = scorePage(byUrl.get(p.url) || [], p.page_type);
    const seen = maturity.get(p.url) || 1;
    return { ...p, category: categoryForType(p.page_type), status: sp.status, health: sp.health,
      dimensions: sp.dimensions, critical_count: sp.criticalCount, issue_count: sp.issueCount,
      evidence_seen: seen, evidence_maturity: maturityLevel(seen) };
  });
  return { crawlId: id, pages: out };
}

// Category → page rollups (spec §1d). Pure aggregation over pageReports.
async function categoryRollups({ crawlId } = {}) {
  const { crawlId: id, pages } = await pageReports({ crawlId });
  const cats = new Map();
  const titles = new Map(); // per-category title -> count, for metadata-uniqueness
  for (const p of pages) {
    const c = p.category;
    if (!cats.has(c)) cats.set(c, { category: c, total: 0, indexable: 0, pass: 0, warning: 0, fail: 0, healthSum: 0, critical: 0, orphan: 0, dupTitle: 0, titlesSeen: 0 });
    const r = cats.get(c);
    r.total++;
    if (p.indexable) r.indexable++;
    if (p.status === 'PASS') r.pass++; else if (p.status === 'WARNING') r.warning++; else r.fail++;
    r.healthSum += p.health;
    r.critical += p.critical_count;
    if (p.title) { const k = `${c}::${p.title}`; titles.set(k, (titles.get(k) || 0) + 1); r.titlesSeen++; }
  }
  // second pass: duplicate-title rate needs the full title counts
  for (const p of pages) {
    if (!p.title) continue;
    if ((titles.get(`${p.category}::${p.title}`) || 0) > 1) cats.get(p.category).dupTitle++;
  }
  const rollups = [...cats.values()].map((r) => ({
    category: r.category, total: r.total, indexable: r.indexable,
    pass: r.pass, warning: r.warning, fail: r.fail,
    avg_health: r.total ? Math.round(r.healthSum / r.total) : 0,
    critical_issues: r.critical,
    duplicate_title_rate: r.titlesSeen ? Math.round((r.dupTitle / r.titlesSeen) * 100) : 0,
    metadata_uniqueness: r.titlesSeen ? Math.round(((r.titlesSeen - r.dupTitle) / r.titlesSeen) * 100) : 100,
  }));
  return { crawlId: id, rollups };
}

// "What changed since the previous crawl?" (spec §1h). Reconstructed from the
// per-crawl issue rows already stored — no new table.
async function changedSincePrevious() {
  const crawls = unwrap(await supabaseAdmin.from('seo_crawls').select('id,status,finished_at').eq('status', 'done').order('started_at', { ascending: false }).limit(2));
  if (!crawls || crawls.length < 2) return { latest: crawls?.[0]?.id || null, previous: null, added: 0, resolved: 0, total_latest: 0, total_previous: 0 };
  const [latest, prev] = crawls;
  const key = (i) => `${i.rule_key}::${i.affected_url}`;
  const latestIssues = unwrap(await supabaseAdmin.from('seo_issues').select('rule_key,affected_url,first_seen_crawl_id').eq('crawl_id', latest.id));
  const prevIssues = unwrap(await supabaseAdmin.from('seo_issues').select('rule_key,affected_url').eq('crawl_id', prev.id));
  const prevSet = new Set((prevIssues || []).map(key));
  const latestSet = new Set((latestIssues || []).map(key));
  const added = (latestIssues || []).filter((i) => !prevSet.has(key(i))).length;
  const resolved = (prevIssues || []).filter((i) => !latestSet.has(key(i))).length;
  return { latest: latest.id, previous: prev.id, added, resolved, total_latest: latestIssues?.length || 0, total_previous: prevIssues?.length || 0 };
}

// Mute an issue: rule-wide (ruleType 'rule', url_pattern null) or just this URL
// (ruleType 'url', url_pattern = the issue's affected_url). Matches seoPersist's
// isMuted() lookup (rule_key + optional url_pattern).
async function muteIssue(id, { ruleType, mutedBy } = {}) {
  const issue = await getIssue(id);
  if (!issue) throw new Error('Issue not found');
  const row = {
    rule_key: issue.rule_key,
    url_pattern: ruleType === 'url' ? issue.affected_url : null,
    muted_by: mutedBy || null,
  };
  const { data, error } = await supabaseAdmin.from('seo_issue_mutes').insert(row).select('*');
  if (error) {
    // 23505 = unique_violation on uq_seo_issue_mutes(rule_key, COALESCE(url_pattern,''))
    // — already muted (double-click, or another issue with the same rule_key).
    // Idempotent: treat as success rather than surfacing a 500.
    if (error.code === '23505') return row;
    throw error;
  }
  return (data && data[0]) || row;
}

module.exports = { latestOverview, listIssues, getIssue, listPages, getPage, scoreHistory, getCrawl, muteIssue, listGscUrls,
  pageReports, categoryRollups, changedSincePrevious, latestCrawlId };

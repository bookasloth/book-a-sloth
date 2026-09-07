'use strict';
// seoAuditService.js — read helpers for the SEO Audit Engine admin API (v3.145
// tables: seo_crawls, seo_crawl_pages, seo_issues, seo_score_snapshots,
// seo_issue_mutes). Read-only except muteIssue. Every query goes through
// supabaseAdmin; a Supabase error is thrown so the controller's try/catch ->
// safeError handles it uniformly.
const { supabaseAdmin } = require('../../config/supabase');

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

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
  return unwrap(await supabaseAdmin.from('seo_crawl_pages').select('*').eq('id', id).maybeSingle());
}

// Score trend — most recent snapshots first, newest crawl last-in for a chart.
async function scoreHistory() {
  return unwrap(await supabaseAdmin.from('seo_score_snapshots').select('*').order('taken_at', { ascending: false }).limit(90));
}

async function getCrawl(id) {
  return unwrap(await supabaseAdmin.from('seo_crawls').select('*').eq('id', id).maybeSingle());
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
  const saved = unwrap(await supabaseAdmin.from('seo_issue_mutes').insert(row).select('*'));
  return (saved && saved[0]) || row;
}

module.exports = { latestOverview, listIssues, getIssue, listPages, getPage, scoreHistory, getCrawl, muteIssue };

'use strict';
/**
 * seoAdminController.js — SEO Audit Engine admin API (read-only reporting +
 * an on-demand crawl trigger). Mirrors gstAdminController's shape: every
 * method is async(req,res) with try { … res.json(...) } catch (e) { safeError(res, e); }.
 * All numbers come from the v3.145 crawl tables via seoAuditService — this
 * controller does zero crawling/scoring itself.
 */
const { safeError } = require('../utils/httpError');
const { audit } = require('../services/auditService');
const crawler = require('../services/seo/seoCrawler');
const svc = require('../services/seo/seoAuditService');

// ── GET /admin/seo/overview ───────────────────────────────────
const getOverview = async (req, res) => {
  try {
    const { crawl, scores, counts } = await svc.latestOverview();
    res.json({ crawl, scores, counts });
  } catch (e) { safeError(res, e); }
};

// ── GET /admin/seo/issues ─────────────────────────────────────
const getIssues = async (req, res) => {
  try {
    const { crawlId, severity, category, status, limit } = req.query || {};
    const issues = await svc.listIssues({ crawlId, severity, category, status, limit });
    res.json({ issues });
  } catch (e) { safeError(res, e); }
};

// ── GET /admin/seo/issues/:id ─────────────────────────────────
const getIssue = async (req, res) => {
  try {
    const issue = await svc.getIssue(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ issue });
  } catch (e) { safeError(res, e); }
};

// ── GET /admin/seo/pages ──────────────────────────────────────
const getPages = async (req, res) => {
  try {
    const { crawlId, pageType, indexable, limit } = req.query || {};
    const filters = { crawlId, pageType, limit };
    if (indexable != null) filters.indexable = indexable === 'true';
    const pages = await svc.listPages(filters);
    res.json({ pages });
  } catch (e) { safeError(res, e); }
};

// ── GET /admin/seo/pages/:id ───────────────────────────────────
const getPage = async (req, res) => {
  try {
    const page = await svc.getPage(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json({ page });
  } catch (e) { safeError(res, e); }
};

// ── GET /admin/seo/scores/history ─────────────────────────────
const getScoreHistory = async (req, res) => {
  try {
    const history = await svc.scoreHistory();
    res.json({ history });
  } catch (e) { safeError(res, e); }
};

// ── POST /admin/seo/crawl ─────────────────────────────────────
// Kicks off a crawl in the background (seoCrawler.start resolves as soon as
// the crawl row exists — the crawl itself keeps running after this returns).
const postCrawl = async (req, res) => {
  try {
    const crawlId = await crawler.start({ trigger: 'manual', triggeredBy: req.admin.id });
    res.json({ crawlId });
  } catch (e) { safeError(res, e); }
};

// ── GET /admin/seo/crawl/:id ───────────────────────────────────
const getCrawl = async (req, res) => {
  try {
    const crawl = await svc.getCrawl(req.params.id);
    if (!crawl) return res.status(404).json({ message: 'Crawl not found' });
    res.json({ crawl });
  } catch (e) { safeError(res, e); }
};

// ── POST /admin/seo/issues/:id/mute ───────────────────────────
// body: { ruleType: 'rule' | 'url' } — 'rule' silences the rule everywhere,
// 'url' silences it only for this issue's affected URL.
const postMuteIssue = async (req, res) => {
  try {
    const mute = await svc.muteIssue(req.params.id, { ruleType: req.body?.ruleType, mutedBy: req.admin?.id });
    await audit(req, {
      action: 'SEO_ISSUE_MUTED', resource_type: 'seo_issue', resource_id: req.params.id,
      after: { rule_key: mute.rule_key, url_pattern: mute.url_pattern },
    });
    res.json({ ok: true, mute });
  } catch (e) { safeError(res, e); }
};

// ── GET /admin/seo/gsc ─────────────────────────────────────────
const getGsc = async (req, res) => {
  try {
    const gsc = await svc.listGscUrls(req.query);
    const configured = require('../services/seo/gscClient').isConfigured();
    res.json({ gsc, configured });
  } catch (e) { safeError(res, e); }
};

module.exports = {
  getOverview, getIssues, getIssue, getPages, getPage,
  getScoreHistory, postCrawl, getCrawl, postMuteIssue, getGsc,
};

// server/services/seo/rules/index.js
const { REGISTRY } = require('./registry');
const onpage = require('./onpage');
const technical = require('./technical');
const indexability = require('./indexability');
// Task 6 add: links/images/schema/sitemap groups. Push into GROUPS below.
const GROUPS = [onpage, technical, indexability];

const SHOULD_INDEX_TYPES = new Set(['host', 'service', 'blog', 'static']);

function buildContext(pages, sitemapUrls) {
  const titleCounts = new Map();
  const descCounts = new Map();
  const internalLinkTargets = new Set();
  let homepageTitle = null;
  const siteUrl = process.env.SITE_URL || 'https://bookasloth.com';
  for (const p of pages) {
    if (p.title) titleCounts.set(p.title, (titleCounts.get(p.title) || 0) + 1);
    if (p.metaDescription) descCounts.set(p.metaDescription, (descCounts.get(p.metaDescription) || 0) + 1);
    for (const l of p.links?.internal || []) internalLinkTargets.add(l.replace(/\/$/, ''));
    if (p.url === siteUrl || p.url === `${siteUrl}/`) homepageTitle = p.title;
  }
  return { pages, sitemapUrls: sitemapUrls || new Set(), titleCounts, descCounts,
    internalLinkTargets, homepageTitle, SHOULD_INDEX_TYPES };
}

function decorate(raw) {
  const meta = REGISTRY[raw.ruleKey] || { category: 'other', severity: 'P4', confidence: 0.5, autoFixable: false, title: raw.ruleKey };
  return { ruleKey: raw.ruleKey, affectedUrl: raw.affectedUrl, evidence: raw.evidence || {},
    category: meta.category, severity: meta.severity, confidence: meta.confidence,
    autoFixable: meta.autoFixable, title: meta.title, detail: raw.detail || null };
}

function runRules(pageData, ctx) {
  const out = [];
  for (const g of GROUPS) if (typeof g.check === 'function') for (const r of g.check(pageData, ctx)) out.push(decorate(r));
  return out;
}
function runSiteRules(ctx) {
  const out = [];
  for (const g of GROUPS) if (typeof g.siteCheck === 'function') for (const r of g.siteCheck(ctx)) out.push(decorate(r));
  return out;
}
module.exports = { buildContext, runRules, runSiteRules, GROUPS };

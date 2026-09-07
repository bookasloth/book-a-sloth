// server/services/seo/rules/registry.js
// Central metadata for every rule. Detection lives in the group modules;
// severity/category/confidence/autoFixable/title live here (one place).
const REGISTRY = {
  // on-page
  'onpage.missing_title':        { category: 'onpage', severity: 'P1', confidence: 1,   autoFixable: false, title: 'Missing <title>' },
  'onpage.title_length':         { category: 'onpage', severity: 'P3', confidence: 0.9, autoFixable: false, title: 'Title length outside 50–60' },
  'onpage.duplicate_title':      { category: 'onpage', severity: 'P2', confidence: 0.9, autoFixable: false, title: 'Duplicate title across pages' },
  'onpage.missing_description':  { category: 'onpage', severity: 'P2', confidence: 1,   autoFixable: true,  title: 'Missing meta description' },
  'onpage.description_length':   { category: 'onpage', severity: 'P3', confidence: 0.9, autoFixable: true,  title: 'Meta description length outside 140–160' },
  'onpage.duplicate_description':{ category: 'onpage', severity: 'P3', confidence: 0.9, autoFixable: false, title: 'Duplicate meta description across pages' },
  'onpage.missing_h1':           { category: 'onpage', severity: 'P2', confidence: 1,   autoFixable: false, title: 'Missing H1' },
  'onpage.multiple_h1':          { category: 'onpage', severity: 'P3', confidence: 1,   autoFixable: false, title: 'Multiple H1 tags' },
  'onpage.title_h1_mismatch':    { category: 'onpage', severity: 'P4', confidence: 0.6, autoFixable: false, title: 'Title / H1 mismatch' },
  // technical
  'technical.non_200':            { category: 'technical', severity: 'P0', confidence: 1,   autoFixable: false, title: 'Non-200 / unreachable' },
  'technical.redirect':           { category: 'technical', severity: 'P3', confidence: 0.9, autoFixable: false, title: 'URL redirects' },
  'technical.redirect_chain':     { category: 'technical', severity: 'P2', confidence: 1,   autoFixable: false, title: 'Redirect chain (>1 hop)' },
  'technical.slow_response':      { category: 'technical', severity: 'P3', confidence: 0.7, autoFixable: false, title: 'Slow response' },
  'technical.missing_canonical':  { category: 'technical', severity: 'P2', confidence: 1,   autoFixable: false, title: 'Missing canonical' },
  'technical.canonical_to_other': { category: 'technical', severity: 'P2', confidence: 0.7, autoFixable: false, title: 'Canonical points elsewhere' },
  'technical.missing_viewport':   { category: 'technical', severity: 'P3', confidence: 1,   autoFixable: false, title: 'Missing viewport meta' },
  // indexability
  'indexability.unexpected_noindex':         { category: 'indexability', severity: 'P0', confidence: 0.8, autoFixable: false, title: 'Unexpected noindex on indexable page' },
  'indexability.error_url_in_sitemap':       { category: 'indexability', severity: 'P1', confidence: 1,   autoFixable: false, title: 'Error/redirect URL in sitemap' },
  'indexability.canonical_sitemap_mismatch': { category: 'indexability', severity: 'P2', confidence: 0.8, autoFixable: false, title: 'Canonical ≠ sitemap URL' },
  'indexability.soft_404':                   { category: 'indexability', severity: 'P1', confidence: 0.6, autoFixable: false, title: 'Soft 404 (200 but thin)' },
  'indexability.prerender_regression':       { category: 'indexability', severity: 'P0', confidence: 0.7, autoFixable: false, title: 'Prerender regression (homepage title)' },
  // (links/images/schema/sitemap.* in Task 6)
};
module.exports = { REGISTRY };

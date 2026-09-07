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
  // (technical.* added in Task 5, indexability.* in Task 5, links/images/schema/sitemap.* in Task 6)
};
module.exports = { REGISTRY };

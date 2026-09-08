// server/tests/unit/seoRules.indexability.test.js
const tech = require('../../services/seo/rules/technical');
const idx = require('../../services/seo/rules/indexability');
const { buildContext } = require('../../services/seo/rules/index');

const base = (o = {}) => ({ url: 'https://bookasloth.com/jane', pageType: 'host', httpStatus: 200,
  canonical: 'https://bookasloth.com/jane', redirectChain: [], responseMs: 100, viewport: 'w', wordCount: 500, robots: 'index, follow', title: 'Jane', ...o });

describe('technical + indexability rules', () => {
  test('non_200 fires on 404', () => {
    const ctx = buildContext([], new Set());
    expect(tech.check(base({ httpStatus: 404 }), ctx).map((i) => i.ruleKey)).toContain('technical.non_200');
  });
  test('unexpected_noindex fires when robots has noindex', () => {
    const ctx = buildContext([], new Set());
    expect(idx.check(base({ robots: 'noindex, follow' }), ctx).map((i) => i.ruleKey)).toContain('indexability.unexpected_noindex');
  });
  test('prerender_regression fires when title equals homepage title', () => {
    const home = { url: 'https://bookasloth.com/', pageType: 'static', title: 'Book A Sloth' };
    const p = base({ title: 'Book A Sloth', pageType: 'service' });
    const ctx = buildContext([home, p], new Set());
    expect(idx.check(p, ctx).map((i) => i.ruleKey)).toContain('indexability.prerender_regression');
  });
  test('error_url_in_sitemap fires for a 404 that is in the sitemap', () => {
    const ctx = buildContext([], new Set(['https://bookasloth.com/jane']));
    expect(idx.check(base({ httpStatus: 404, inSitemap: true }), ctx).map((i) => i.ruleKey)).toContain('indexability.error_url_in_sitemap');
  });
});

// server/tests/unit/seoRules.misc.test.js
const links = require('../../services/seo/rules/links');
const images = require('../../services/seo/rules/images');
const schema = require('../../services/seo/rules/structuredData');
const sitemap = require('../../services/seo/rules/sitemap');
const { buildContext } = require('../../services/seo/rules/index');

test('broken_internal fires when a linked page is 404', () => {
  const target = { url: 'https://bookasloth.com/dead', httpStatus: 404 };
  const src = { url: 'https://bookasloth.com/a', pageType: 'static', httpStatus: 200, links: { internal: ['https://bookasloth.com/dead'], external: [] }, images: [] };
  const ctx = buildContext([src, target], new Set());
  expect(links.check(src, ctx).map((i) => i.ruleKey)).toContain('links.broken_internal');
});
test('missing_alt fires when an image has no alt', () => {
  const p = { url: 'https://bookasloth.com/a', pageType: 'static', httpStatus: 200, images: [{ src: '/x.jpg', alt: null }], links: { internal: [], external: [] } };
  expect(images.check(p, buildContext([p], new Set())).map((i) => i.ruleKey)).toContain('images.missing_alt');
});
test('schema.missing fires with no json-ld', () => {
  const p = { url: 'https://bookasloth.com/a', pageType: 'blog', httpStatus: 200, jsonLd: [], images: [], links: { internal: [], external: [] } };
  expect(schema.check(p, buildContext([p], new Set())).map((i) => i.ruleKey)).toContain('schema.missing');
});
test('sitemap.missing_indexable fires for a 200 indexable page not in the sitemap', () => {
  const p = { url: 'https://bookasloth.com/a', pageType: 'static', httpStatus: 200, robots: 'index', images: [], links: { internal: [], external: [] } };
  const ctx = buildContext([p], new Set()); // empty sitemap set
  expect(sitemap.siteCheck(ctx).map((i) => i.ruleKey)).toContain('sitemap.missing_indexable');
});

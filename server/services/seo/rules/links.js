// server/services/seo/rules/links.js
// Detection only. Internal link health — broken targets + orphaned pages.
// links.broken_external is deferred to P4 (external HEAD checks add crawl surface) — YAGNI.
const normalize = (u) => (u || '').replace(/\/$/, '');

function check(p, ctx) {
  const out = [];
  const at = p.url;
  const push = (ruleKey, evidence) => out.push({ ruleKey, affectedUrl: at, evidence });
  if (!p.pageType || !ctx.SHOULD_INDEX_TYPES.has(p.pageType)) return out; // only audit indexable page types
  if (p.httpStatus !== 200) return out;

  for (const href of p.links?.internal || []) {
    // ponytail: linear find is fine at audit scale (hundreds of pages); index ctx.pages by URL if this profiles hot.
    const target = ctx.pages.find((pg) => normalize(pg.url) === normalize(href));
    const status = target ? target.httpStatus : null;
    if (status == null || status >= 400) push('links.broken_internal', { href });
  }

  if (p.inSitemap && !ctx.internalLinkTargets.has(normalize(p.url))) push('links.orphan_page', {});
  return out;
}
module.exports = { check };

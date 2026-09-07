// server/services/seo/rules/onpage.js
// Detection only. Title/description length bands come from docs/seo-aeo-geo-plan.md.
const TITLE_MIN = 50, TITLE_MAX = 60, DESC_MIN = 140, DESC_MAX = 160;

function check(p, ctx) {
  const out = [];
  const at = p.url;
  const push = (ruleKey, evidence) => out.push({ ruleKey, affectedUrl: at, evidence });
  if (p.pageType && !ctx.SHOULD_INDEX_TYPES.has(p.pageType)) return out; // only audit indexable page types
  if (p.httpStatus && p.httpStatus !== 200) return out;                  // on-page rules need a real page

  if (!p.title) push('onpage.missing_title', {});
  else {
    if (p.title.length < TITLE_MIN || p.title.length > TITLE_MAX) push('onpage.title_length', { length: p.title.length });
    if ((ctx.titleCounts.get(p.title) || 0) > 1) push('onpage.duplicate_title', { title: p.title, count: ctx.titleCounts.get(p.title) });
  }
  if (!p.metaDescription) push('onpage.missing_description', {});
  else {
    if (p.metaDescription.length < DESC_MIN || p.metaDescription.length > DESC_MAX) push('onpage.description_length', { length: p.metaDescription.length });
    if ((ctx.descCounts.get(p.metaDescription) || 0) > 1) push('onpage.duplicate_description', { count: ctx.descCounts.get(p.metaDescription) });
  }
  if (!p.h1 || p.h1.length === 0) push('onpage.missing_h1', {});
  else if (p.h1.length > 1) push('onpage.multiple_h1', { count: p.h1.length });
  if (p.title && p.h1 && p.h1.length === 1 && p.h1[0].toLowerCase() !== p.title.toLowerCase())
    push('onpage.title_h1_mismatch', { title: p.title, h1: p.h1[0] });
  return out;
}
module.exports = { check };

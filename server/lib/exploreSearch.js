'use strict';
// exploreSearch — list the visible service catalog filtered by profession (and
// optional service slug), ordered by the precomputed quality score.
//
// The old text-search ranking engine (query parse, synonyms, city/mode detection
// and the relaxed-fallback tiers) was scrapped: Explore is now a browse-by-category
// page, not a free-text search box.
//
// ponytail: linear filter + sort over the whole visible catalog (59 rows on prod,
// 2026-10). Trivial at this size. If free-text search is ever wanted again, do it
// in Postgres (FTS tsvector + pg_trgm), not here.

const MAX_RESULTS = 96; // hard cap → at most 8 pages of 12

// Filter to a profession (+ optional service slug) and order by the precomputed
// effective_score (quality × penalties), review count breaking ties.
function listCatalog(catalog, { category = '', service = '' } = {}) {
  const pool = (catalog || []).filter((e) =>
    (!category || e.prof === category) && (!service || e.svc === service));
  pool.sort((a, b) =>
    (b.eff || 0) - (a.eff || 0) ||
    (b.card.reviewCount || 0) - (a.card.reviewCount || 0));
  return { cards: pool.slice(0, MAX_RESULTS).map((e) => e.card) };
}

module.exports = { listCatalog, MAX_RESULTS };

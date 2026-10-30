// exploreSearch — catalog filter + quality-score ordering. The free-text search
// ranking engine (parseQuery / synonyms / city+mode / relaxed fallbacks) was
// scrapped; Explore is now browse-by-category.
const { listCatalog, MAX_RESULTS } = require('../../lib/exploreSearch');

// Minimal catalog entry, shaped like exploreController.toEntry().
const entry = (id, o = {}) => ({
  card: { id, reviewCount: o.reviews || 0 },
  eff: o.eff ?? 50,
  prof: o.prof || '',
  svc: o.svc || '',
});

const CATALOG = [
  entry('a', { prof: 'photographer', svc: 'wedding', eff: 10 }),
  entry('b', { prof: 'photographer', svc: 'wedding', eff: 40 }),
  entry('c', { prof: 'chef', svc: 'catering', eff: 99 }),
  entry('d', { prof: 'photographer', svc: 'portrait', eff: 55 }),
];
const ids = (r) => r.cards.map((c) => c.id);

describe('listCatalog', () => {
  test('no filters → everything, ordered by quality score desc', () => {
    expect(ids(listCatalog(CATALOG, {}))).toEqual(['c', 'd', 'b', 'a']);
  });
  test('category scopes the pool', () => {
    expect(ids(listCatalog(CATALOG, { category: 'photographer' }))).toEqual(['d', 'b', 'a']);
  });
  test('category + service narrows further', () => {
    expect(ids(listCatalog(CATALOG, { category: 'photographer', service: 'wedding' }))).toEqual(['b', 'a']);
  });
  test('review count breaks ties at equal score', () => {
    const tie = [entry('x', { eff: 50, reviews: 2 }), entry('y', { eff: 50, reviews: 9 })];
    expect(ids(listCatalog(tie, {}))).toEqual(['y', 'x']);
  });
  test('caps at MAX_RESULTS', () => {
    const many = Array.from({ length: MAX_RESULTS + 20 }, (_, i) => entry(`s${i}`, { eff: i }));
    expect(listCatalog(many, {}).cards).toHaveLength(MAX_RESULTS);
  });
});

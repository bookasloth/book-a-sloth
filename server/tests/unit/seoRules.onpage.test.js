// server/tests/unit/seoRules.onpage.test.js
const { check } = require('../../services/seo/rules/onpage');
const { buildContext } = require('../../services/seo/rules/index');

const page = (over = {}) => ({
  url: 'https://bookasloth.com/jane', pageType: 'host', httpStatus: 200,
  title: 'A Great Coach You Should Book Today Right Now Here', metaDescription: 'x'.repeat(150),
  h1: ['A Great Coach You Should Book Today Right Now Here'], ...over,
});

describe('onpage rules', () => {
  test('flags missing title', () => {
    const ctx = buildContext([page({ title: null })], new Set());
    const keys = check(page({ title: null }), ctx).map((i) => i.ruleKey);
    expect(keys).toContain('onpage.missing_title');
  });

  test('flags title length outside 50-60', () => {
    const ctx = buildContext([page({ title: 'Short' })], new Set());
    const keys = check(page({ title: 'Short' }), ctx).map((i) => i.ruleKey);
    expect(keys).toContain('onpage.title_length');
  });

  test('flags duplicate titles across pages', () => {
    const p1 = page({ url: 'https://bookasloth.com/a', title: 'Same Title Here For Both Pages OK Yes Sure Indeed' });
    const p2 = page({ url: 'https://bookasloth.com/b', title: 'Same Title Here For Both Pages OK Yes Sure Indeed' });
    const ctx = buildContext([p1, p2], new Set());
    expect(check(p1, ctx).map((i) => i.ruleKey)).toContain('onpage.duplicate_title');
  });

  test('flags multiple H1', () => {
    const ctx = buildContext([page({ h1: ['one', 'two'] })], new Set());
    expect(check(page({ h1: ['one', 'two'] }), ctx).map((i) => i.ruleKey)).toContain('onpage.multiple_h1');
  });

  test('a failed-fetch page (httpStatus null) yields no on-page issues', () => {
    const p = page({ httpStatus: null, title: null, metaDescription: null, h1: [] });
    const ctx = buildContext([p], new Set());
    expect(check(p, ctx)).toEqual([]);
  });

  test('a bodiless (bodyCrawled:false) page with h1:[] does not fire missing_h1 or title_h1_mismatch', () => {
    const p = page({ bodyCrawled: false, h1: [] });
    const ctx = buildContext([p], new Set());
    const keys = check(p, ctx).map((i) => i.ruleKey);
    expect(keys).not.toContain('onpage.missing_h1');
    expect(keys).not.toContain('onpage.title_h1_mismatch');
  });

  test('a bodiless page still fires title_length for an out-of-band title (resolver-provided title stays valid)', () => {
    const short = page({ bodyCrawled: false, h1: [], title: 'Short' });
    const long = page({ bodyCrawled: false, h1: [], title: 'x'.repeat(90) });
    const ctx = buildContext([short, long], new Set());
    expect(check(short, ctx).map((i) => i.ruleKey)).toContain('onpage.title_length');
    expect(check(long, ctx).map((i) => i.ruleKey)).toContain('onpage.title_length');
  });
});

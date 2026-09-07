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
});

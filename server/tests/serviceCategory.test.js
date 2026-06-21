const { validateServiceCategory } = require('../lib/serviceCategory');

describe('validateServiceCategory', () => {
  const host = ['career-coach', 'life-coach'];

  test('accepts a category the host owns', () => {
    expect(validateServiceCategory({ category: 'career-coach', hostCategories: host }))
      .toEqual({ ok: true, value: 'career-coach' });
  });

  test('rejects a category the host does not own', () => {
    const r = validateServiceCategory({ category: 'dentist', hostCategories: host });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  test('required + host has categories + none given → 400', () => {
    const r = validateServiceCategory({ category: '', hostCategories: host, required: true });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  test('not required + none given → ok with null (unchanged)', () => {
    expect(validateServiceCategory({ category: undefined, hostCategories: host }))
      .toEqual({ ok: true, value: null });
  });

  test('host has no categories on record → drops value, ok null', () => {
    expect(validateServiceCategory({ category: 'anything', hostCategories: [], required: true }))
      .toEqual({ ok: true, value: null });
  });

  test('trims whitespace before matching', () => {
    expect(validateServiceCategory({ category: '  life-coach ', hostCategories: host }))
      .toEqual({ ok: true, value: 'life-coach' });
  });
});

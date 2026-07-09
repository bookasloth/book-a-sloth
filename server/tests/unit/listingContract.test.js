const { LISTING_TOOL, sanitizeListing } = require('../../services/ai/listingContract');

describe('LISTING_TOOL', () => {
  test('names the emit tool with required fields', () => {
    expect(LISTING_TOOL.name).toBe('emit_listing');
    expect(LISTING_TOOL.input_schema.properties.faqs).toBeDefined();
    expect(LISTING_TOOL.input_schema.properties.short_description).toBeDefined();
  });
});

describe('sanitizeListing', () => {
  test('clamps lengths and array counts', () => {
    const { fields } = sanitizeListing({
      title: 'x'.repeat(80),
      short_description: 'y'.repeat(200),
      important_note: 'z'.repeat(300),
      included_items: ['a','b','c','d','e','f','g'],
      faqs: Array.from({ length: 9 }, (_, i) => ({ question: `q${i}`, answer: `a${i}` })),
    }, {});
    expect(fields.title.length).toBeLessThanOrEqual(60);
    expect(fields.short_description.length).toBeLessThanOrEqual(160);
    expect(fields.important_note.length).toBeLessThanOrEqual(200);
    expect(fields.included_items).toHaveLength(6);
    expect(fields.faqs).toHaveLength(5);
  });

  test('keeps category only if allowed', () => {
    expect(sanitizeListing({ category: 'made-up' }, { allowedCategorySlugs: ['seo'] }).fields.category).toBeUndefined();
    expect(sanitizeListing({ category: 'seo' }, { allowedCategorySlugs: ['seo'] }).fields.category).toBe('seo');
  });

  test('strips fabricated-fact fields', () => {
    const { fields, dropped } = sanitizeListing({
      short_description: 'Only ₹499 with a money-back guarantee!',
      long_description: 'We are FDA certified and rated 5 stars.',
    }, {});
    expect(fields.short_description).toBe('');
    expect(fields.long_description).toBe('');
    expect(dropped).toEqual(expect.arrayContaining(['short_description', 'long_description']));
  });

  test('never throws on garbage input', () => {
    expect(() => sanitizeListing(null, {})).not.toThrow();
    expect(() => sanitizeListing({ faqs: 'not-an-array' }, {})).not.toThrow();
  });
});

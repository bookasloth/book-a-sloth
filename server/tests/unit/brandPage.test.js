const { brandPage, wantsBrandedHtml } = require('../../utils/brandPage');

// Fake req: `accepts(['json','html'])` returns the best match for the given
// Accept header, mirroring Express. Browsers → 'html'; curl `*/*` → 'json'.
const req = (path, acceptHtml) => ({
  path,
  accepts: (types) => (acceptHtml ? 'html' : types[0]),
});

describe('wantsBrandedHtml', () => {
  it('serves HTML to a browser on a non-API, non-ops path', () => {
    expect(wantsBrandedHtml(req('/', true))).toBe(true);
    expect(wantsBrandedHtml(req('/anything', true))).toBe(true);
  });

  it('never serves HTML for /api/* (API clients need JSON)', () => {
    expect(wantsBrandedHtml(req('/api/blogs', true))).toBe(false);
    expect(wantsBrandedHtml(req('/api', true))).toBe(false);
  });

  it('never serves HTML for machine endpoints', () => {
    for (const p of ['/health', '/ready', '/metrics', '/robots.txt']) {
      expect(wantsBrandedHtml(req(p, true))).toBe(false);
    }
  });

  it('serves JSON (not HTML) to non-browser clients like curl', () => {
    expect(wantsBrandedHtml(req('/', false))).toBe(false);
  });
});

describe('brandPage', () => {
  it('renders a full HTML doc with the heading and body', () => {
    const html = brandPage({ code: 404, heading: 'Took a nap', body: 'Not found here.' });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Took a nap');
    expect(html).toContain('Not found here.');
    expect(html).toContain('404');
    expect(html).toContain('Book A Sloth');
  });

  it('escapes dynamic text to prevent XSS from error messages', () => {
    const html = brandPage({ heading: 'x', body: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

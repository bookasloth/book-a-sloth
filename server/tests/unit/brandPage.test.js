const { brandPage, statusPage, wantsBrandedHtml } = require('../../utils/brandPage');

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

const { pickErrorImage, ERROR_IMAGE_BASE } = require('../../utils/brandPage');

describe('brandPage hero image', () => {
  it('renders an <img> with the given absolute src when image is set', () => {
    const html = brandPage({ code: 404, heading: 'h', body: 'b', image: 'https://assets.bookasloth.in/errors/sloth-glass.png' });
    expect(html).toContain('<img');
    expect(html).toContain('https://assets.bookasloth.in/errors/sloth-glass.png');
  });
  it('renders no <img> when image is absent', () => {
    const html = brandPage({ code: 500, heading: 'h', body: 'b' });
    expect(html).not.toContain('<img');
  });
  it('pickErrorImage returns a full CDN url', () => {
    expect(pickErrorImage().startsWith(ERROR_IMAGE_BASE + '/')).toBe(true);
  });
});

describe('statusPage', () => {
  it('shows all-operational + Ready when the DB is reachable', () => {
    const html = statusPage({ db: true, uptimeSec: 3661 });
    expect(html).toContain('All systems operational');
    expect(html).toContain('Ready');
    expect(html).toContain('1h 1m'); // uptime formatted
    expect(html).toContain('dot ok');
  });

  it('shows partial-outage + Unreachable when the DB check fails', () => {
    const html = statusPage({ db: false, uptimeSec: 0 });
    expect(html).toContain('Partial outage');
    expect(html).toContain('Unreachable');
    expect(html).toContain('dot bad');
  });
});

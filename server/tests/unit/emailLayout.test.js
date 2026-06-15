/**
 * tests/unit/emailLayout.test.js
 * Two recipient-driven layouts: customer (BAS-branded, nav+legal footer)
 * vs vendor (host-branded, minimal footer). Selection by audience.
 */
'use strict';

const { renderLayout } = require('../../services/email/emailLayout');

const settings = {
  brand_color: '#FE5100',
  website_url: 'https://x.test',
  support_email: 's@x.test',
  from_name: 'Book A Sloth',
  logo_url: 'https://cdn.test/bas-logo.png',
};

const vendorData = { company_logo: 'https://cdn.test/host-logo.png', company_name: 'Asha Studio' };

describe('renderLayout — selection by audience', () => {
  test("audience 'vendor' → vendor chrome (host logo, Powered by, no nav)", () => {
    const html = renderLayout({ audience: 'vendor', bodyHtml: '<p>hi</p>', settings, data: vendorData });
    expect(html).toContain('https://cdn.test/host-logo.png'); // host logo in header
    expect(html).toContain('Asha Studio');                    // host name in header
    expect(html).toMatch(/Powered by/i);                      // platform sign-off
    expect(html).not.toMatch(/My Bookings/i);                 // no customer nav
    expect(html).not.toMatch(/Unsubscribe/i);
  });

  test("audience 'customer' → customer chrome (BAS logo, nav, no Powered by)", () => {
    const html = renderLayout({ audience: 'customer', bodyHtml: '<p>hi</p>', settings, data: {} });
    expect(html).toContain('https://cdn.test/bas-logo.png');  // BAS logo in header
    expect(html).toMatch(/My Bookings/i);
    expect(html).toMatch(/Help/i);
    expect(html).toMatch(/Privacy/i);
    expect(html).toMatch(/Unsubscribe/i);
    expect(html).not.toMatch(/Powered by/i);                  // BAS is the sender, not powering
  });

  test("audience 'all' → customer chrome (safe default with unsubscribe)", () => {
    const html = renderLayout({ audience: 'all', bodyHtml: '<p>hi</p>', settings, data: {} });
    expect(html).toMatch(/My Bookings/i);
    expect(html).toMatch(/Unsubscribe/i);
  });

  test('missing audience → customer chrome', () => {
    const html = renderLayout({ bodyHtml: '<p>hi</p>', settings, data: {} });
    expect(html).toMatch(/My Bookings/i);
  });
});

describe('renderLayout — shared structure', () => {
  test('both layouts carry the 4px brand accent and 600px card', () => {
    for (const audience of ['customer', 'vendor']) {
      const html = renderLayout({ audience, bodyHtml: '<p>x</p>', settings, data: vendorData });
      expect(html).toContain('#FE5100');     // brand accent / chip
      expect(html).toContain('600');         // card width
      expect(html).toContain('<p>x</p>');    // body injected
    }
  });

  test('CTA renders only when both label and url present', () => {
    const withCta = renderLayout({ audience: 'customer', bodyHtml: '', ctaLabel: 'View', ctaUrl: 'https://x.test/b', settings, data: {} });
    expect(withCta).toContain('https://x.test/b');
    expect(withCta).toMatch(/View/);

    const noCta = renderLayout({ audience: 'customer', bodyHtml: '', ctaLabel: 'View', ctaUrl: '', settings, data: {} });
    expect(noCta).not.toMatch(/>View</);
  });
});

describe('renderLayout — customer footer links', () => {
  test('customer footer uses real routes and carries unsubscribe token from data', () => {
    const html = renderLayout({ audience: 'customer', bodyHtml: '', settings, data: { unsubscribe_token: 'TOK123' } });
    expect(html).toContain('https://x.test/my-bookings');
    expect(html).toContain('https://x.test/help');
    expect(html).toContain('https://x.test/privacy');
    expect(html).toContain('https://x.test/unsubscribe?u=TOK123');
  });
});

describe('renderLayout — vendor header fallbacks', () => {
  test('vendor header falls back to BAS logo + from_name when host values absent', () => {
    const html = renderLayout({ audience: 'vendor', bodyHtml: '', settings, data: {} });
    expect(html).toContain('https://cdn.test/bas-logo.png');
    expect(html).toContain('Book A Sloth');
  });
});

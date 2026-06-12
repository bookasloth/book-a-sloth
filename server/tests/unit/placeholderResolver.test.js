/**
 * tests/unit/placeholderResolver.test.js — pure resolver, no DB.
 */
'use strict';
const { buildGlobals, resolveString, resolveTemplate } = require('../../services/email/placeholderResolver');

describe('buildGlobals', () => {
  test('derives first/last name and profile url', () => {
    const g = buildGlobals(
      { website_url: 'https://x.test', support_email: 's@x.test' },
      { name: 'Asha Verma', email: 'a@x.test', username: 'asha' }
    );
    expect(g.first_name).toBe('Asha');
    expect(g.last_name).toBe('Verma');
    expect(g.profile_url).toBe('https://x.test/asha');
    expect(g.dashboard_url).toBe('https://x.test/dashboard');
    expect(g.support_email).toBe('s@x.test');
    expect(g.current_year).toMatch(/^\d{4}$/);
  });
  test('first_name falls back to "there" when no name', () => {
    expect(buildGlobals({}, {}).first_name).toBe('there');
  });
});

describe('resolveString', () => {
  test('substitutes known placeholders', () => {
    const { text } = resolveString('Hi {{first_name}}, code {{otp}}', { first_name: 'Asha', otp: '123456' });
    expect(text).toBe('Hi Asha, code 123456');
  });
  test('unknown placeholders resolve to empty and are reported', () => {
    const { text, missing } = resolveString('Hi {{nope}}!', {});
    expect(text).toBe('Hi !');
    expect(missing).toContain('nope');
  });
  test('is case-insensitive and tolerates spaces', () => {
    expect(resolveString('{{ First_Name }}', { first_name: 'X' }).text).toBe('X');
  });
  test('null input → empty string', () => {
    expect(resolveString(null, {}).text).toBe('');
  });
});

describe('resolveTemplate', () => {
  const tpl = {
    subject: 'Booking with {{vendor_name}}',
    html_content: '<p>Hi {{first_name}}, {{service_name}} on {{booking_date}}</p>',
    cta_url: '{{dashboard_url}}', cta_label: 'View',
  };
  test('data overrides globals; merges both', () => {
    const globals = buildGlobals({ website_url: 'https://x.test' }, { name: 'Asha Verma' });
    const r = resolveTemplate(tpl, { vendor_name: 'Studio', service_name: 'SEO', booking_date: 'Mon' }, globals);
    expect(r.subject).toBe('Booking with Studio');
    expect(r.html).toContain('Hi Asha, SEO on Mon');
    expect(r.ctaUrl).toBe('https://x.test/dashboard');
    expect(r.ctaLabel).toBe('View');
    expect(r.missing).toHaveLength(0);
  });
});

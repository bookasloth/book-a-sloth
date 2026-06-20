// supabase config throws without a service_role key; this suite only exercises
// the pure URL/entry mappers, so stub the side-effecting dep.
jest.mock('../../config/supabase', () => ({ supabaseAdmin: {} }));

const {
  toLastmod, hostUrl, serviceUrl, staticEntries, hostEntries, serviceEntries,
} = require('../../services/sitemapService');

const SITE = 'https://bookasloth.com';

describe('url builders', () => {
  test('hostUrl joins site + username', () => {
    expect(hostUrl(SITE, 'john-doe')).toBe('https://bookasloth.com/john-doe');
  });
  test('serviceUrl joins site + username + slug', () => {
    expect(serviceUrl(SITE, 'john-doe', 'business-consultation'))
      .toBe('https://bookasloth.com/john-doe/business-consultation');
  });
  test('trailing slash on site is normalised away', () => {
    expect(hostUrl('https://bookasloth.com/', 'jane')).toBe('https://bookasloth.com/jane');
  });
});

describe('toLastmod', () => {
  test('returns the YYYY-MM-DD date portion of an ISO timestamp', () => {
    expect(toLastmod('2026-06-20T14:33:00.000Z')).toBe('2026-06-20');
  });
  test('returns undefined for missing/invalid input', () => {
    expect(toLastmod(null)).toBeUndefined();
    expect(toLastmod('not-a-date')).toBeUndefined();
  });
});

describe('staticEntries', () => {
  test('includes the homepage as an absolute URL', () => {
    const entries = staticEntries(SITE);
    expect(entries.some(e => e.loc === 'https://bookasloth.com/')).toBe(true);
  });
  test('every entry is an absolute URL under the site', () => {
    for (const e of staticEntries(SITE)) {
      expect(e.loc.startsWith('https://bookasloth.com/')).toBe(true);
    }
  });
});

describe('hostEntries', () => {
  test('maps a host row to a profile URL with lastmod', () => {
    const entries = hostEntries([{ username: 'john-doe', updated_at: '2026-06-20T10:00:00Z' }], SITE);
    expect(entries).toEqual([
      { loc: 'https://bookasloth.com/john-doe', lastmod: '2026-06-20', changefreq: 'weekly', priority: '0.7' },
    ]);
  });
  test('skips rows with no username', () => {
    expect(hostEntries([{ username: null, updated_at: '2026-06-20T10:00:00Z' }], SITE)).toEqual([]);
  });
});

describe('serviceEntries', () => {
  const rows = [
    { slug: 'consult', updated_at: '2026-06-20T10:00:00Z', profiles: { username: 'john-doe' } },
    { slug: 'no-host', updated_at: '2026-06-20T10:00:00Z', profiles: { username: null } }, // unresolvable
    { slug: null, updated_at: '2026-06-20T10:00:00Z', profiles: { username: 'john-doe' } }, // no slug
  ];
  test('maps a service to /username/slug and skips unresolvable rows', () => {
    expect(serviceEntries(rows, SITE)).toEqual([
      { loc: 'https://bookasloth.com/john-doe/consult', lastmod: '2026-06-20', changefreq: 'weekly', priority: '0.8' },
    ]);
  });
});

// server/tests/unit/prerenderResolvers.test.js
// resolveProfileMeta/resolveServiceMeta are the pure meta-computation halves
// of renderProfileMeta/renderServiceMeta, extracted so the SEO crawler can
// call them in-process (no HTTP fetch -> no Cloudflare bot-UA 403).
jest.mock('../../controllers/hostController', () => ({ buildHostProfile: jest.fn() }));
jest.mock('../../controllers/serviceController', () => ({ buildPublicServiceByProfileAndSlug: jest.fn() }));

const { buildHostProfile } = require('../../controllers/hostController');
const { buildPublicServiceByProfileAndSlug } = require('../../controllers/serviceController');
const {
  resolveProfileMeta, resolveServiceMeta, renderProfileMeta,
} = require('../../controllers/prerenderController');

describe('resolveProfileMeta', () => {
  test('returns 200 with title/canonical/robots for a normal host', async () => {
    buildHostProfile.mockResolvedValueOnce({
      payload: {
        host: { username: 'jane', name: 'Jane', is_indexable: true },
        services: [],
      },
    });
    const m = await resolveProfileMeta('jane');
    expect(m.status).toBe(200);
    expect(m.buildHtmlArgs.title).toContain('Jane');
    expect(m.buildHtmlArgs.canonical).toBe('https://bookasloth.com/jane');
    expect(m.buildHtmlArgs.robots).toBe('index,follow');
  });

  test('returns 404 when host not found', async () => {
    buildHostProfile.mockResolvedValueOnce({ notFound: true });
    const m = await resolveProfileMeta('ghost');
    expect(m.status).toBe(404);
  });

  test('returns 301 + redirectTo when username has moved', async () => {
    buildHostProfile.mockResolvedValueOnce({ redirect: true, username: 'newname' });
    const m = await resolveProfileMeta('oldname');
    expect(m.status).toBe(301);
    expect(m.redirectTo).toBe('https://bookasloth.com/newname');
  });

  test('JSON-LD carries sameAs (http socials only) + dateModified for AEO/entity clarity', async () => {
    buildHostProfile.mockResolvedValueOnce({
      payload: {
        host: {
          username: 'jane', name: 'Jane', is_indexable: true,
          updated_at: '2026-09-01T10:00:00.000Z',
          social_links: {
            instagram: 'https://instagram.com/jane', linkedin: 'https://linkedin.com/in/jane',
            website: '', email: 'jane@x.com', whatsapp: '123456',
          },
        },
        services: [],
      },
    });
    const m = await resolveProfileMeta('jane');
    const person = m.buildHtmlArgs.jsonLd.mainEntity;
    expect(person.sameAs).toEqual(['https://instagram.com/jane', 'https://linkedin.com/in/jane']);
    expect(m.buildHtmlArgs.jsonLd.dateModified).toBe('2026-09-01T10:00:00.000Z');
  });

  test('no sameAs / dateModified keys when socials blank and no updated_at', async () => {
    buildHostProfile.mockResolvedValueOnce({
      payload: { host: { username: 'jane', name: 'Jane', is_indexable: true, social_links: {} }, services: [] },
    });
    const m = await resolveProfileMeta('jane');
    expect(m.buildHtmlArgs.jsonLd.mainEntity).not.toHaveProperty('sameAs');
    expect(m.buildHtmlArgs.jsonLd).not.toHaveProperty('dateModified');
  });

  test('robots is noindex,nofollow when is_indexable is false', async () => {
    buildHostProfile.mockResolvedValueOnce({
      payload: { host: { username: 'jane', name: 'Jane', is_indexable: false }, services: [] },
    });
    const m = await resolveProfileMeta('jane');
    expect(m.buildHtmlArgs.robots).toBe('noindex,nofollow');
  });
});

describe('resolveServiceMeta', () => {
  test('returns 200 with title/canonical/robots for a normal service', async () => {
    buildPublicServiceByProfileAndSlug.mockResolvedValueOnce({
      payload: {
        service: { title: 'Intro Call', slug: 'intro', is_indexable: true },
        vendor: { username: 'jane', name: 'Jane' },
        reviews: [],
      },
    });
    const m = await resolveServiceMeta('jane', 'intro');
    expect(m.status).toBe(200);
    expect(m.buildHtmlArgs.title).toContain('Intro Call');
    expect(m.buildHtmlArgs.canonical).toBe('https://bookasloth.com/jane/intro');
    expect(m.buildHtmlArgs.robots).toBe('index,follow');
  });

  test('drops the brand suffix (then the host) so a long title is not truncated', async () => {
    buildPublicServiceByProfileAndSlug.mockResolvedValueOnce({
      payload: {
        service: { title: 'Marketing Automation Consultation', slug: 's', is_indexable: true },
        vendor: { username: 'mohinidaf', name: 'Mohini Daf' }, reviews: [],
      },
    });
    const mid = await resolveServiceMeta('mohinidaf', 's');
    expect(mid.buildHtmlArgs.title).toBe('Marketing Automation Consultation with Mohini Daf');
    expect(mid.buildHtmlArgs.title.length).toBeLessThanOrEqual(60);

    buildPublicServiceByProfileAndSlug.mockResolvedValueOnce({
      payload: {
        service: { title: 'SEO Consultancy – Expert Guidance to Boost Your Rankings', slug: 's', is_indexable: true },
        vendor: { username: 'aastha', name: 'Aastha Nikhare' }, reviews: [],
      },
    });
    const long = await resolveServiceMeta('aastha', 's');
    expect(long.buildHtmlArgs.title).toBe('SEO Consultancy – Expert Guidance to Boost Your Rankings');
  });

  test('returns 404 when host or service not found', async () => {
    buildPublicServiceByProfileAndSlug.mockResolvedValueOnce({ hostNotFound: true });
    expect((await resolveServiceMeta('ghost', 'intro')).status).toBe(404);
    buildPublicServiceByProfileAndSlug.mockResolvedValueOnce({ notFound: true });
    expect((await resolveServiceMeta('jane', 'ghost')).status).toBe(404);
  });

  test('robots is noindex,nofollow when is_indexable is false', async () => {
    buildPublicServiceByProfileAndSlug.mockResolvedValueOnce({
      payload: {
        service: { title: 'Intro Call', slug: 'intro', is_indexable: false },
        vendor: { username: 'jane', name: 'Jane' },
        reviews: [],
      },
    });
    const m = await resolveServiceMeta('jane', 'intro');
    expect(m.buildHtmlArgs.robots).toBe('noindex,nofollow');
  });
});

// Confirms the bot-handler behavior is unchanged after extracting the resolver:
// renderProfileMeta must still send full HTML containing the title, via res.send.
describe('renderProfileMeta (bot handler, unchanged behavior)', () => {
  test('sends HTML containing the title', async () => {
    buildHostProfile.mockResolvedValueOnce({
      payload: { host: { username: 'jane', name: 'Jane', is_indexable: true }, services: [] },
    });
    const res = { status: jest.fn().mockReturnThis(), set: jest.fn(), send: jest.fn(), redirect: jest.fn() };
    await renderProfileMeta({ params: { username: 'jane' } }, res);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send.mock.calls[0][0]).toContain('Jane');
    expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/html');
  });
});

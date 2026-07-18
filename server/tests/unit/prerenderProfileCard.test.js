'use strict';
process.env.NODE_ENV = 'test';
process.env.PUBLIC_SITE_URL = 'https://bookasloth.com';

// The controller lazily require()s these inside the handler, so a module mock is
// enough — no Supabase, no network.
jest.mock('../../controllers/hostController', () => ({ buildHostProfile: jest.fn() }));

const { buildHostProfile } = require('../../controllers/hostController');
const { renderProfileMeta } = require('../../controllers/prerenderController');

const mockRes = () => {
  const r = {};
  r.set = jest.fn(() => r);
  r.status = jest.fn(() => r);
  r.send = jest.fn(() => r);
  r.redirect = jest.fn(() => r);
  return r;
};

const wireHost = (over) =>
  buildHostProfile.mockResolvedValue({
    payload: {
      host: { username: 'ketaki', name: 'Ketaki Dhande', profession: 'Coach', ...over },
      services: [],
    },
  });

const render = async () => {
  const res = mockRes();
  await renderProfileMeta({ params: { username: 'ketaki' } }, res);
  return res.send.mock.calls[0][0];
};

beforeEach(() => jest.clearAllMocks());

describe('profile OG card', () => {
  // The bug: Google hands back =s96-c, Facebook's card minimum is 200x200, so
  // hosts got NO card at all. If this regresses the avatar silently drops under
  // the floor again and nothing else in the suite notices.
  test('upscales a Google avatar past the 200px card floor', async () => {
    wireHost({
      profile_image:
        'https://lh3.googleusercontent.com/a/ACg8ocLZvMp-AmfFAiz5QpR8eTTT-MYDH5U4qD1ovA1CuByRIoFobQ=s96-c',
    });
    const html = await render();

    expect(html).toContain('=s512-c');
    expect(html).not.toContain('=s96-c');
  });

  test('leaves a non-Google image URL alone', async () => {
    wireHost({ profile_image: 'https://cdn.example.com/pic.png' });
    expect(await render()).toContain('content="https://cdn.example.com/pic.png"');
  });

  // A host photo is whatever they uploaded — usually square. Claiming 1200x630
  // over it is a lie scrapers act on.
  test('omits size hints when the image is the host\'s own photo', async () => {
    wireHost({ profile_image: 'https://cdn.example.com/pic.png' });
    const html = await render();

    expect(html).not.toContain('og:image:width');
    expect(html).not.toContain('og:image:height');
  });

  test('keeps size hints for the site fallback card, whose size we do know', async () => {
    wireHost({ profile_image: null });
    const html = await render();

    expect(html).toContain('https://bookasloth.com/og-image.png');
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:image:height" content="630">');
  });
});

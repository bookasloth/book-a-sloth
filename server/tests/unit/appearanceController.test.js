/**
 * tests/unit/appearanceController.test.js
 * Navbar logo appearance: defaults-on-missing, mode validation, persistence.
 */
'use strict';

let mockState = { row: null, rowError: null, upsertError: null, lastUpsert: null };

jest.mock('../../config/supabase', () => {
  const api = {
    select() { return api; },
    eq() { return api; },
    maybeSingle() { return Promise.resolve({ data: mockState.row, error: mockState.rowError }); },
    upsert(payload) { mockState.lastUpsert = payload; return api; },
    single() {
      if (mockState.upsertError) return Promise.resolve({ data: null, error: mockState.upsertError });
      return Promise.resolve({ data: { ...mockState.row, ...mockState.lastUpsert }, error: null });
    },
  };
  return { supabaseAdmin: { from: () => api } };
});

const ctrl = require('../../controllers/appearanceController');

const makeRes = () => {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
};

beforeEach(() => { mockState = { row: null, rowError: null, upsertError: null, lastUpsert: null }; });

describe('appearanceController.getPublic', () => {
  test('returns DB row when present', async () => {
    mockState.row = { navbar_logo_mode: 'image', icon_url: 'i', logo_image_url: 'L', festive_logo_url: 'F' };
    const res = makeRes();
    await ctrl.getPublic({}, res);
    expect(res.body.navbar_logo_mode).toBe('image');
    expect(res.body.logo_image_url).toBe('L');
  });

  test('falls back to defaults when the table is missing', async () => {
    mockState.rowError = { message: 'relation "appearance_settings" does not exist' };
    const res = makeRes();
    await ctrl.getPublic({}, res);
    expect(res.body.navbar_logo_mode).toBe('icon_text');
    expect(res.body.icon_url).toContain('sloth-icon-sqr.png');
  });
});

describe('appearanceController.update', () => {
  test('rejects an invalid mode with 400', async () => {
    const res = makeRes();
    await ctrl.update({ body: { navbar_logo_mode: 'rainbow' } }, res);
    expect(res.statusCode).toBe(400);
    expect(mockState.lastUpsert).toBeNull();
  });

  test('persists provided fields and returns the row', async () => {
    mockState.row = { navbar_logo_mode: 'icon_text', icon_url: 'i', logo_image_url: '', festive_logo_url: '' };
    const res = makeRes();
    await ctrl.update({ body: { navbar_logo_mode: 'festive', festive_logo_url: 'F.png' } }, res);
    expect(res.statusCode).toBe(200);
    expect(mockState.lastUpsert.navbar_logo_mode).toBe('festive');
    expect(mockState.lastUpsert.festive_logo_url).toBe('F.png');
    expect(res.body.navbar_logo_mode).toBe('festive');
  });

  test('surfaces a DB error as 500', async () => {
    mockState.upsertError = { message: 'boom' };
    const res = makeRes();
    await ctrl.update({ body: { navbar_logo_mode: 'image' } }, res);
    expect(res.statusCode).toBe(500);
  });
});

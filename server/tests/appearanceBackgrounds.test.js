// Stub supabase so requiring the controller does not assert on a service-role key.
jest.mock('../config/supabase', () => ({ supabaseAdmin: { from: () => ({}) } }));

const { sanitizeBackgrounds, resolveDefaultBackground } = require('../controllers/appearanceController');

describe('sanitizeBackgrounds', () => {
  it('drops unknown keys and coerces shape', () => {
    const out = sanitizeBackgrounds({
      dotgrid: { enabled: true, order: 2, params: { density: 'high' } },
      hacker: { enabled: true },
    });
    expect(out.hacker).toBeUndefined();
    expect(out.dotgrid).toEqual({ enabled: true, order: 2, params: { density: 'high' } });
  });
  it('coerces enabled to boolean and order to number', () => {
    const out = sanitizeBackgrounds({ galaxy: { enabled: 'yes', order: '3', params: 5 } });
    expect(out.galaxy.enabled).toBe(true);
    expect(out.galaxy.order).toBe(3);
    expect(out.galaxy.params).toEqual({});
  });
});

describe('resolveDefaultBackground', () => {
  const bg = { dotgrid: { enabled: false }, galaxy: { enabled: true } };
  it('keeps a valid enabled default', () => {
    expect(resolveDefaultBackground('galaxy', bg)).toBe('galaxy');
  });
  it('falls back to first enabled when default is disabled/unknown', () => {
    expect(resolveDefaultBackground('dotgrid', bg)).toBe('galaxy');
  });
  it('falls back to dotgrid when nothing enabled', () => {
    expect(resolveDefaultBackground('x', {})).toBe('dotgrid');
  });
});

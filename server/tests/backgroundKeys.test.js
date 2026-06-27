const { BACKGROUND_KEYS, isBackgroundKey } = require('../config/backgroundKeys');

describe('backgroundKeys', () => {
  it('is a non-empty unique list including dotgrid', () => {
    expect(BACKGROUND_KEYS).toContain('dotgrid');
    expect(new Set(BACKGROUND_KEYS).size).toBe(BACKGROUND_KEYS.length);
  });
  it('validates membership', () => {
    expect(isBackgroundKey('dotgrid')).toBe(true);
    expect(isBackgroundKey('nope')).toBe(false);
    expect(isBackgroundKey(null)).toBe(false);
  });
});

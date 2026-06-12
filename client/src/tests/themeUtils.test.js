/**
 * tests/themeUtils.test.js
 * Pure utility — no mocks, no DOM required.
 */
import {
  getLuminance,
  getContrastColor,
  getColorsForPlan,
  canUseCustomHex,
  getPlanBorderColor,
  isValidHex,
  FREE_COLORS,
  CREATOR_COLORS,
  DEFAULT_THEME_COLOR,
} from '../utils/themeUtils';

// ── getLuminance ──────────────────────────────────────────────────────────────

describe('getLuminance', () => {
  test('white (#ffffff) has luminance 1', () => {
    expect(getLuminance('#ffffff')).toBeCloseTo(1, 2);
  });

  test('black (#000000) has luminance 0', () => {
    expect(getLuminance('#000000')).toBeCloseTo(0, 2);
  });

  test('mid-grey is between 0 and 1', () => {
    const l = getLuminance('#808080');
    expect(l).toBeGreaterThan(0);
    expect(l).toBeLessThan(1);
  });

  test('returns 0 for invalid input', () => {
    expect(getLuminance('')).toBe(0);
    expect(getLuminance(null)).toBe(0);
    expect(getLuminance('#gg')).toBe(0);
  });
});

// ── getContrastColor ──────────────────────────────────────────────────────────

describe('getContrastColor', () => {
  test('dark bg (black) → white text', () => {
    expect(getContrastColor('#000000')).toBe('#ffffff');
  });

  test('light bg (white) → dark text', () => {
    expect(getContrastColor('#ffffff')).toBe('#111827');
  });

  test('brand orange (#FE5100) → white text (dark enough)', () => {
    expect(getContrastColor('#FE5100')).toBe('#ffffff');
  });

  test('yellow (#EAB308) → dark text (too light)', () => {
    expect(getContrastColor('#EAB308')).toBe('#111827');
  });

  test('lime (#84CC16) → dark text', () => {
    expect(getContrastColor('#84CC16')).toBe('#111827');
  });

  test('emerald (#10B981) → dark text (luminance 0.364 > threshold)', () => {
    expect(getContrastColor('#10B981')).toBe('#111827');
  });

  test('amber (#F59E0B) → dark text', () => {
    expect(getContrastColor('#F59E0B')).toBe('#111827');
  });

  test('charcoal (#1F2937) → white text', () => {
    expect(getContrastColor('#1F2937')).toBe('#ffffff');
  });

  test('invalid input falls back to white', () => {
    expect(getContrastColor('')).toBe('#ffffff');
    expect(getContrastColor(null)).toBe('#ffffff');
    expect(getContrastColor('not-a-hex')).toBe('#ffffff');
  });
});

// ── getColorsForPlan ──────────────────────────────────────────────────────────

describe('getColorsForPlan', () => {
  test('explorer → FREE_COLORS (3 swatches)', () => {
    const colors = getColorsForPlan('explorer');
    expect(colors).toHaveLength(3);
    expect(colors).toEqual(FREE_COLORS);
  });

  test('creator → CREATOR_COLORS (16 swatches)', () => {
    const colors = getColorsForPlan('creator');
    expect(colors).toHaveLength(16);
    expect(colors).toEqual(CREATOR_COLORS);
  });

  test('professional → CREATOR_COLORS (same palette)', () => {
    const colors = getColorsForPlan('professional');
    expect(colors).toEqual(CREATOR_COLORS);
  });

  test('unknown plan → FREE_COLORS (safe default)', () => {
    expect(getColorsForPlan('unknown')).toEqual(FREE_COLORS);
    expect(getColorsForPlan(null)).toEqual(FREE_COLORS);
  });

  test('all swatches have name and valid hex', () => {
    [...FREE_COLORS, ...CREATOR_COLORS].forEach(({ name, hex }) => {
      expect(typeof name).toBe('string');
      expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});

// ── canUseCustomHex ───────────────────────────────────────────────────────────

describe('canUseCustomHex', () => {
  test('professional → true', () => {
    expect(canUseCustomHex('professional')).toBe(true);
  });

  test('creator → false', () => {
    expect(canUseCustomHex('creator')).toBe(false);
  });

  test('explorer → false', () => {
    expect(canUseCustomHex('explorer')).toBe(false);
  });
});

// ── getPlanBorderColor ────────────────────────────────────────────────────────

describe('getPlanBorderColor', () => {
  test('professional → gold #D4AF37', () => {
    expect(getPlanBorderColor('professional')).toBe('#D4AF37');
  });

  test('creator → brand orange #FE5100', () => {
    expect(getPlanBorderColor('creator')).toBe('#FE5100');
  });

  test('explorer → grey #6B7280', () => {
    expect(getPlanBorderColor('explorer')).toBe('#6B7280');
  });

  test('unknown → grey', () => {
    expect(getPlanBorderColor(null)).toBe('#6B7280');
  });
});

// ── isValidHex ────────────────────────────────────────────────────────────────

describe('isValidHex', () => {
  test('valid 6-char hex with #', () => {
    expect(isValidHex('#FE5100')).toBe(true);
    expect(isValidHex('#000000')).toBe(true);
    expect(isValidHex('#ffffff')).toBe(true);
    expect(isValidHex('#1A2B3C')).toBe(true);
  });

  test('rejects 3-char shorthand', () => {
    expect(isValidHex('#fff')).toBe(false);
  });

  test('rejects missing hash', () => {
    expect(isValidHex('FE5100')).toBe(false);
  });

  test('rejects invalid characters', () => {
    expect(isValidHex('#GGGGGG')).toBe(false);
    expect(isValidHex('#FE510G')).toBe(false);
  });

  test('rejects empty / null', () => {
    expect(isValidHex('')).toBe(false);
    expect(isValidHex(null)).toBe(false);
    expect(isValidHex(undefined)).toBe(false);
  });
});

// ── DEFAULT_THEME_COLOR ───────────────────────────────────────────────────────

describe('DEFAULT_THEME_COLOR', () => {
  test('is brand orange #FE5100', () => {
    expect(DEFAULT_THEME_COLOR).toBe('#FE5100');
  });

  test('is a valid hex', () => {
    expect(isValidHex(DEFAULT_THEME_COLOR)).toBe(true);
  });

  test('produces white contrast text (dark enough for readability)', () => {
    expect(getContrastColor(DEFAULT_THEME_COLOR)).toBe('#ffffff');
  });
});

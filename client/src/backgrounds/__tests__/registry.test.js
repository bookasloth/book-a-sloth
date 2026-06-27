import { describe, it, expect } from 'vitest';
import { BACKGROUNDS, getBackground, backgroundKeys } from '../registry';

describe('background registry', () => {
  it('every entry has the required shape', () => {
    BACKGROUNDS.forEach((b) => {
      expect(typeof b.key).toBe('string');
      expect(typeof b.label).toBe('string');
      expect(b.Component).toBeTruthy();
      expect(b.defaultParams && typeof b.defaultParams).toBe('object');
      expect(Array.isArray(b.paramSchema)).toBe(true);
      expect(typeof b.thumbnail).toBe('string');
    });
  });
  it('keys are unique', () => {
    const keys = BACKGROUNDS.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('getBackground resolves by key and returns undefined for unknown', () => {
    expect(getBackground('dotgrid')?.key).toBe('dotgrid');
    expect(getBackground('nope')).toBeUndefined();
  });
  it('exports the flat key list', () => {
    expect(backgroundKeys).toContain('dotgrid');
  });
});

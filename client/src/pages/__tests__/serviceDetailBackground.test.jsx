import { describe, it, expect } from 'vitest';
import { resolveBackgroundKey } from '../ServiceDetail';

describe('resolveBackgroundKey', () => {
  const enabled = [{ key: 'galaxy', params: {} }, { key: 'rain', params: {} }];
  it('uses host pick when enabled', () => {
    expect(resolveBackgroundKey('galaxy', enabled, 'rain').key).toBe('galaxy');
  });
  it('falls back to default when host pick missing/disabled', () => {
    expect(resolveBackgroundKey(null, enabled, 'rain').key).toBe('rain');
    expect(resolveBackgroundKey('holi', enabled, 'rain').key).toBe('rain');
  });
  it('falls back to dotgrid when nothing matches', () => {
    expect(resolveBackgroundKey(null, [], null).key).toBe('dotgrid');
  });
});

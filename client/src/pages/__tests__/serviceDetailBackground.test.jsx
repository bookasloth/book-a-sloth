import { describe, it, expect } from 'vitest';
import { resolveBackgroundKey } from '../ServiceDetail';

describe('resolveBackgroundKey', () => {
  it('returns null key when no backgrounds enabled', () => {
    expect(resolveBackgroundKey(null, [], null).key).toBeNull();
  });
  it('returns null key for unknown host pick with empty list', () => {
    expect(resolveBackgroundKey('lines', [], null).key).toBeNull();
  });
});

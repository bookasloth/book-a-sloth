import { describe, it, expect } from 'vitest';
import { backgroundKeys } from '../registry';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { BACKGROUND_KEYS } = require('../../../../server/config/backgroundKeys.js');

describe('registry/server key parity', () => {
  it('client registry keys are all in the server allow-list', () => {
    backgroundKeys.forEach((k) => expect(BACKGROUND_KEYS).toContain(k));
  });
});

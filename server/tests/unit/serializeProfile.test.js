/**
 * tests/unit/serializeProfile.test.js
 * serializeProfile must project the new is_host capability (Phase 0), while
 * still returning role during the compatibility-shim phases.
 */
// authController loads config/supabase at require-time (throws without env) —
// mock it minimally so the module loads; serializeProfile itself is pure.
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {},
  signInWithPassword: jest.fn(),
  mintSessionForEmail: jest.fn(),
}));

const { serializeProfile } = require('../../controllers/authController');

describe('serializeProfile', () => {
  test('projects is_host from the profile row', () => {
    const out = serializeProfile({ id: 'u1', role: 'host', is_host: true }, null);
    expect(out.is_host).toBe(true);
    expect(out.role).toBe('host'); // role still returned during shim phases
  });

  test('is_host defaults to false when absent', () => {
    const out = serializeProfile({ id: 'u2', role: 'guest' }, null);
    expect(out.is_host).toBe(false);
  });
});

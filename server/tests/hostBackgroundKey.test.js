// Stub supabase so requiring the controller does not assert on a service-role key.
jest.mock('../config/supabase', () => ({ supabaseAdmin: { from: () => ({}) } }));

const { cleanBackgroundKey } = require('../controllers/hostController');
describe('cleanBackgroundKey', () => {
  it('keeps known keys', () => { expect(cleanBackgroundKey('galaxy')).toBe('galaxy'); });
  it('nulls unknown/empty', () => {
    expect(cleanBackgroundKey('nope')).toBeNull();
    expect(cleanBackgroundKey('')).toBeNull();
    expect(cleanBackgroundKey(undefined)).toBeNull();
  });
});

/**
 * tests/unit/bookingGrant.test.js — security audit H-1.
 * The short-lived OTP-verification grant that createBooking requires for
 * anonymous bookings. Issue/verify are pure (jwt + HMAC), no DB.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const guestGrant = require('../../utils/bookingGrant');

// Re-derive the module's secret the same way it does, so we can forge tokens.
const SECRET =
  process.env.OAUTH_STATE_SECRET ||
  crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-oauth-state')
    .update('oauth-state-v1').digest('hex');

describe('bookingGrant', () => {
  test('issue → verify round-trips (email, case-normalised)', () => {
    const t = guestGrant.issue({ email: 'A@X.com' });
    expect(typeof t).toBe('string');
    expect(guestGrant.verify(t, { email: 'a@x.com' })).toBe(true);
  });

  test('phone-first identifier round-trips through normalisation', () => {
    const t = guestGrant.issue({ email: 'a@x.com', phone: '+1 (555) 123-4567' });
    expect(guestGrant.verify(t, { phone: '+15551234567', email: 'a@x.com' })).toBe(true);
  });

  test('rejects a grant minted for a different contact', () => {
    const t = guestGrant.issue({ email: 'attacker@x.com' });
    expect(guestGrant.verify(t, { email: 'victim@x.com' })).toBe(false);
  });

  test('rejects missing, malformed and tampered tokens', () => {
    expect(guestGrant.verify(undefined, { email: 'a@x.com' })).toBe(false);
    expect(guestGrant.verify('', { email: 'a@x.com' })).toBe(false);
    expect(guestGrant.verify('not.a.jwt', { email: 'a@x.com' })).toBe(false);
    const t = guestGrant.issue({ email: 'a@x.com' });
    expect(guestGrant.verify(`${t}tamper`, { email: 'a@x.com' })).toBe(false);
  });

  test('rejects a token signed with the same secret but the wrong purpose', () => {
    // An OAuth-state-style token (carries `flow`, no guest_booking purpose).
    const forged = jwt.sign({ flow: 'vendor_auth', sub: 'a@x.com' }, SECRET);
    expect(guestGrant.verify(forged, { email: 'a@x.com' })).toBe(false);
  });

  test('verify with no identifier is false; issue with no identifier is null', () => {
    const t = guestGrant.issue({ email: 'a@x.com' });
    expect(guestGrant.verify(t, {})).toBe(false);
    expect(guestGrant.issue({})).toBe(null);
  });
});

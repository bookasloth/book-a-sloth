'use strict';

/**
 * bookingGrant.js — short-lived signed proof that a guest verified their contact
 * via OTP. `verifyOtp` issues one on success; `createBooking` requires + checks
 * it for anonymous (not-logged-in) bookings, so a booking is bound to the contact
 * that actually received the code.
 *
 * Security audit H-1: the booking OTP was previously enforced ONLY in the browser
 * (verify-otp and POST /bookings were two unlinked calls). The API trusted a bare
 * guest_email/guest_phone, letting anyone create bookings for any address
 * (notification/phishing relay + slot squatting). This grant closes that gap.
 *
 * Reuses OAUTH_STATE_SECRET (already present and validated in production); tokens
 * are namespaced by a `purpose` claim so they can never be confused with OAuth
 * state tokens (which carry `flow`, never `purpose`). No new env var required.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const SECRET =
  process.env.OAUTH_STATE_SECRET ||
  crypto
    .createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-oauth-state')
    .update('oauth-state-v1')
    .digest('hex');

const PURPOSE = 'guest_booking';
// 30m so a guest who verifies then takes their time on the details/payment step
// doesn't get a 401 at submit. Matches the 30-min pending-hold window (UX rec).
const TTL = '30m';

// Mirrors authController's OTP identifier normalisation (phone-first, email
// fallback) so the grant subject lines up with what was actually verified.
const normalizePhone = (p) => {
  const cleaned = String(p || '').replace(/[\s\-().]/g, '');
  return /^\+?\d{8,15}$/.test(cleaned) ? cleaned : null;
};

const identifierOf = ({ email, phone } = {}) =>
  normalizePhone(phone) || String(email || '').toLowerCase().trim();

/** Issue a grant for a freshly-verified contact. Returns null if no identifier. */
const issue = ({ email, phone } = {}) => {
  const sub = identifierOf({ email, phone });
  if (!sub) return null;
  return jwt.sign({ purpose: PURPOSE, sub }, SECRET, { expiresIn: TTL });
};

/**
 * True only if `token` is a valid, unexpired guest_booking grant whose subject
 * matches the contact being booked. Never throws.
 */
const verify = (token, { email, phone } = {}) => {
  if (!token || typeof token !== 'string') return false;
  const expected = identifierOf({ email, phone });
  if (!expected) return false;
  try {
    const claims = jwt.verify(token, SECRET);
    if (!claims || claims.purpose !== PURPOSE || !claims.sub) return false;
    const a = Buffer.from(String(claims.sub));
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

module.exports = { issue, verify, identifierOf, normalizePhone };

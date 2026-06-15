/**
 * unsubscribeToken.js — stateless, tamper-proof unsubscribe links.
 *
 * A link must identify the recipient when clicked from an email — possibly by a
 * guest who has no account and is not logged in. Rather than store a random
 * token per send, we sign the email address:
 *
 *   token = base64url(email) + '.' + base64url(HMAC-SHA256(email, SECRET))
 *
 * verifyToken recomputes the HMAC and constant-time compares it, so a token
 * cannot be forged or pointed at a different address without the server secret.
 * Nothing is persisted; the email is recovered from the token itself.
 */

'use strict';

const crypto = require('crypto');

// Reuse an existing server-only secret if a dedicated one isn't configured.
// Never exposed to the browser; rotating it invalidates outstanding links.
const SECRET =
  process.env.UNSUBSCRIBE_SECRET ||
  process.env.SUPER_ADMIN_JWT_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'dev-unsubscribe-secret';

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromB64url = (s) => {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
};

const sign = (email) =>
  b64url(crypto.createHmac('sha256', SECRET).update(email).digest());

/** Build an unsubscribe token for an email address. */
function makeToken(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return '';
  return `${b64url(e)}.${sign(e)}`;
}

/**
 * Verify a token and recover the email.
 * @returns {string|null} the email if valid, else null.
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  let email;
  try {
    email = fromB64url(payload).toString('utf8').trim().toLowerCase();
  } catch (_) {
    return null;
  }
  if (!email) return null;
  const expected = sign(email);
  // Constant-time compare; bail if lengths differ (timingSafeEqual throws then).
  if (sig.length !== expected.length) return null;
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return ok ? email : null;
}

module.exports = { makeToken, verifyToken };

/**
 * adminAuthService.js — crypto primitives for the admin platform.
 *
 * Pure-ish helper module (crypto + bcrypt only, no DB) so it is fully unit
 * testable. Holds the isolated admin session token logic and password hashing
 * for the SEPARATE staff credential store (admin_users.password_hash).
 *
 * Token: self-contained HS256 JWT signed with SUPER_ADMIN_JWT_SECRET, carrying
 * the resolved permission array so middleware checks are stateless. Completely
 * isolated from the Supabase vendor/user session.
 *
 * FAIL CLOSED: in production a missing SUPER_ADMIN_JWT_SECRET is a hard startup
 * error — admin sessions must never fall back to a guessable/ephemeral secret.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SESSION_TTL_SEC = 8 * 60 * 60; // 8 hours
const BCRYPT_ROUNDS   = 10;

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.SUPER_ADMIN_JWT_SECRET) {
  throw new Error('[ADMIN] SUPER_ADMIN_JWT_SECRET must be set in production — refusing to start.');
}

// Outside production we allow a stable dev secret so local sessions survive a
// nodemon restart; never used when NODE_ENV=production (guarded above).
const JWT_SECRET = process.env.SUPER_ADMIN_JWT_SECRET || 'dev-only-insecure-admin-secret';

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

/** Sign an admin session token. `payload` should include type/sub/role/permissions. */
const jwtSign = (payload) => {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const now    = Math.floor(Date.now() / 1000);
  const body   = b64url({ ...payload, iat: now, exp: now + SESSION_TTL_SEC });
  const sig    = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64url');
  return `${header}.${body}.${sig}`;
};

/** Verify + decode an admin token. Throws on tamper/expiry. Does NOT check type/role. */
const jwtVerify = (token) => {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(header + '.' + body).digest('base64url');

  // Constant-time compare, length-safe.
  const maxLen = Math.max(sig.length, expected.length);
  const sigBuf = Buffer.alloc(maxLen);
  const expBuf = Buffer.alloc(maxLen);
  Buffer.from(sig).copy(sigBuf);
  Buffer.from(expected).copy(expBuf);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw new Error('Invalid signature');
  }

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Token expired');
  return payload;
};

const hashPassword   = (plain)       => bcrypt.hash(String(plain), BCRYPT_ROUNDS);
const verifyPassword = (plain, hash) => (hash ? bcrypt.compare(String(plain), hash) : Promise.resolve(false));

module.exports = { jwtSign, jwtVerify, hashPassword, verifyPassword, SESSION_TTL_SEC };

/**
 * admin2faService.js — pure TOTP + recovery-code helpers for admin 2FA.
 * No DB, no Express — fully unit testable.
 * Implements RFC 6238 (TOTP) via Node built-in crypto only; no ESM deps.
 * Uses bcryptjs for recovery-code hashing.
 */
'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ---------------------------------------------------------------------------
// Internal base-32 helpers (RFC 4648 alphabet, no padding required)
// ---------------------------------------------------------------------------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function _b32Encode(buf) {
  let bits = 0, val = 0, out = '';
  for (const byte of buf) {
    val = (val << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32[(val >> bits) & 0x1f];
    }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 0x1f];
  return out;
}

function _b32Decode(s) {
  const clean = String(s || '').toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0, val = 0;
  const out = [];
  for (const c of clean) {
    const idx = B32.indexOf(c);
    if (idx < 0) continue;
    val = (val << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((val >> bits) & 0xff);
    }
  }
  return Buffer.from(out);
}

// ---------------------------------------------------------------------------
// TOTP core (RFC 6238 / RFC 4226 HOTP)
// ---------------------------------------------------------------------------
function _hotpCode(secretB32, counter, digits = 6) {
  const key = _b32Decode(secretB32);
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  msg.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac('sha1', key).update(msg).digest();
  const offset = hmac[19] & 0xf;
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      (hmac[offset + 1] << 16) |
      (hmac[offset + 2] << 8) |
      hmac[offset + 3]) %
    10 ** digits;
  return String(code).padStart(digits, '0');
}

function _timeStep() {
  return Math.floor(Date.now() / 1000 / 30);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
const ISSUER = 'Book A Sloth Admin';

/**
 * Generate a fresh TOTP secret and the otpauth:// URI to encode as a QR code.
 * @param {string} label  — email / identifier shown in the authenticator app
 * @returns {{ secret: string, otpauth: string }}
 */
const newSecret = (label) => {
  const secret = _b32Encode(crypto.randomBytes(20));
  const otpauth =
    'otpauth://totp/' +
    encodeURIComponent(label) +
    '?secret=' +
    secret +
    '&issuer=' +
    encodeURIComponent(ISSUER);
  return { secret, otpauth };
};

/**
 * Generate a TOTP token for the given secret (current time-step).
 * Primarily used in tests; the auth flow reads the token from the user.
 * @param {string} secret
 * @returns {string}
 */
const generateToken = (secret) => _hotpCode(secret, _timeStep());

/**
 * Verify a 6-digit TOTP token. Tolerates ±1 time-step (30 s) of clock skew.
 * @param {string|number} token
 * @param {string}        secret
 * @returns {boolean}
 */
const verifyToken = (token, secret) => {
  if (!token || !secret) return false;
  const t = String(token).trim();
  const step = _timeStep();
  try {
    for (let d = -1; d <= 1; d++) {
      if (_hotpCode(secret, step + d) === t) return true;
    }
  } catch (_) {
    // malformed secret → reject
  }
  return false;
};

/**
 * Generate n unique recovery codes in XXXX-XXXX format.
 * Uses an unambiguous alphabet (no I, O, 0, 1).
 * @param {number} n
 * @returns {string[]}
 */
const generateRecoveryCodes = (n = 8) => {
  const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1
  const one = () => {
    const bytes = Array.from(crypto.randomBytes(8));
    return bytes.map((b) => ALPH[b % ALPH.length]).join('');
  };
  const codes = new Set();
  while (codes.size < n) {
    const c = one();
    codes.add(`${c.slice(0, 4)}-${c.slice(4, 8)}`);
  }
  return [...codes];
};

/**
 * Hash recovery codes with bcrypt (cost 10).
 * @param {string[]} codes
 * @returns {Promise<string[]>}
 */
const hashRecoveryCodes = (codes) =>
  Promise.all(codes.map((c) => bcrypt.hash(c, 10)));

/**
 * Find which hashed recovery code matches the plaintext input.
 * Returns the index (0-based) of the match, or -1 if none.
 * @param {string}   code    — plaintext code supplied by the admin
 * @param {string[]} hashes  — stored bcrypt hashes
 * @returns {Promise<number>}
 */
const matchRecoveryCode = async (code, hashes) => {
  const list = hashes || [];
  const c = String(code || '').trim();
  for (let i = 0; i < list.length; i++) {
    if (await bcrypt.compare(c, list[i])) return i;
  }
  return -1;
};

module.exports = {
  newSecret,
  generateToken,
  verifyToken,
  generateRecoveryCodes,
  hashRecoveryCodes,
  matchRecoveryCode,
};

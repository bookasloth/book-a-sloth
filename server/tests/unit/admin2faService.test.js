'use strict';
// NOTE: otplib v13 uses ESM sub-deps (@scure/base) that Jest (CJS mode) cannot
// transform. The service is implemented with Node built-in crypto (RFC 6238)
// so no ESM deps are needed in tests either. We use svc.generateToken() to
// produce a current TOTP code for the "good token" case — same algorithm,
// fully synchronous, no external imports.
const svc = require('../../services/admin2faService');

test('newSecret returns a base32 secret and a keyuri', () => {
  const { secret, otpauth } = svc.newSecret('admin@x.com');
  expect(typeof secret).toBe('string');
  expect(secret.length).toBeGreaterThan(10);
  expect(otpauth).toMatch(/^otpauth:\/\/totp\//);
});

test('verifyToken accepts a current code and rejects a wrong one', () => {
  const { secret } = svc.newSecret('admin@x.com');
  const good = svc.generateToken(secret);
  expect(svc.verifyToken(good, secret)).toBe(true);
  expect(svc.verifyToken('000000', secret)).toBe(false);
});

test('generateRecoveryCodes returns N distinct codes; hash + match roundtrip', async () => {
  const codes = svc.generateRecoveryCodes(8);
  expect(new Set(codes).size).toBe(8);
  const hashes = await svc.hashRecoveryCodes(codes);
  expect(hashes.length).toBe(8);
  expect(await svc.matchRecoveryCode(codes[2], hashes)).toBe(2);
  expect(await svc.matchRecoveryCode('not-a-code', hashes)).toBe(-1);
});

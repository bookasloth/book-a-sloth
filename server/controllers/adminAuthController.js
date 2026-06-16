/**
 * adminAuthController.js — Admin staff authentication (separate credential store)
 *
 * SECURITY MODEL (M1, v2.4 → v2.5 with mandatory 2FA):
 *   - Staff live in `admin_users` with their own bcrypt password_hash — NOT in
 *     auth.users. Customer auth and staff auth never intersect.
 *   - Login is now a TWO-STEP flow:
 *       1. POST /login  → password checked → returns a short-lived pending token
 *          (type 'admin_2fa' or 'admin_2fa_enroll'); NO full session issued.
 *       2a. POST /2fa-verify  → TOTP or recovery code checked → full session.
 *       2b. POST /2fa-setup   → generate QR (enrollment step 1).
 *           POST /2fa-confirm → confirm first TOTP code → enable 2FA + full session.
 *   - Full session token only ever issued AFTER the second factor clears.
 *   - Secret stored encrypted at rest via cryptoTokens (AES-256-GCM).
 *   - Brute-force protection on both password and TOTP steps (MAX_FAILED attempts).
 */

const { supabaseAdmin } = require('../config/supabase');
const { jwtSign, jwtVerify, verifyPending, verifyPassword } = require('../services/adminAuthService');
const { encrypt, decrypt } = require('../utils/cryptoTokens');
const twofa = require('../services/admin2faService');
const { audit } = require('../services/auditService');
const { roleGrants } = require('../lib/adminPermissions');

const MAX_FAILED  = 5;
const LOCK_MS     = 15 * 60 * 1000; // 15 min
const PENDING_TTL = 5 * 60;         // 5 min for 2FA/enroll pending tokens

const normalize = (s) => (s || '').toLowerCase().trim();

// Look the staff member up by username first, then email — both via parameterized
// .eq() (never string-interpolated) so the identifier can't inject into the filter.
const findStaff = async (identifier) => {
  let { data } = await supabaseAdmin.from('admin_users').select('*').eq('username', identifier).maybeSingle();
  if (!data) ({ data } = await supabaseAdmin.from('admin_users').select('*').eq('email', identifier).maybeSingle());
  return data || null;
};

// Resolve the role's permission array from the DB (fresh), falling back to the
// canonical lib definition if the role row is somehow missing.
const resolvePermissions = async (roleKey) => {
  const { data: role } = await supabaseAdmin.from('admin_roles').select('permissions').eq('key', roleKey).maybeSingle();
  if (role && Array.isArray(role.permissions)) return role.permissions;
  return roleGrants(roleKey);
};

// Build the full admin session response object — used by verify2fa and confirm2fa.
const fullSession = async (staff) => {
  const permissions = await resolvePermissions(staff.role_key);
  const token = jwtSign({
    type: 'admin',
    sub: staff.id,
    email: staff.email,
    username: staff.username,
    name: staff.name,
    role: staff.role_key,
    permissions,
  });
  return {
    token,
    type: 'admin',
    role: staff.role_key,
    name: staff.name,
    email: staff.email,
    username: staff.username,
    permissions,
  };
};

// POST /api/admin-auth/login   body: { username | email, password }
const adminLogin = async (req, res) => {
  try {
    const body = req.body || {};
    const identifier = normalize(body.identifier || body.username || body.email);
    const password   = body.password;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Username/email and password are required.' });
    }

    const staff = await findStaff(identifier);

    // Generic message on lookup failure — never reveal whether the account exists.
    if (!staff || !staff.is_active) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Lockout gate
    if (staff.locked_until && new Date(staff.locked_until).getTime() > Date.now()) {
      const mins = Math.ceil((new Date(staff.locked_until).getTime() - Date.now()) / 60000);
      return res.status(429).json({ message: `Account locked. Try again in ${mins} minute(s).` });
    }

    const ok = await verifyPassword(password, staff.password_hash);
    if (!ok) {
      const failed = (staff.failed_attempts || 0) + 1;
      const updates = { failed_attempts: failed, updated_at: new Date().toISOString() };
      if (failed >= MAX_FAILED) updates.locked_until = new Date(Date.now() + LOCK_MS).toISOString();
      await supabaseAdmin.from('admin_users').update(updates).eq('id', staff.id);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Success — reset counters, stamp login.
    await supabaseAdmin.from('admin_users')
      .update({ failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
      .eq('id', staff.id);

    // SECOND FACTOR GATE: never issue a full session from the password step alone.
    if (staff.totp_enabled) {
      return res.json({
        twofa_required: true,
        pending_token: jwtSign({ type: 'admin_2fa', sub: staff.id }, PENDING_TTL),
      });
    }
    return res.json({
      enroll_required: true,
      pending_token: jwtSign({ type: 'admin_2fa_enroll', sub: staff.id }, PENDING_TTL),
    });
  } catch (err) {
    console.error('[adminLogin]', err.message);
    return res.status(500).json({ message: 'Internal error.' });
  }
};

// POST /api/admin-auth/2fa-setup  body: { pending_token }
// Step 1 of enrollment: generate a TOTP secret + QR code, store encrypted secret.
// totp_enabled stays false until confirm2fa succeeds.
const setup2fa = async (req, res) => {
  try {
    let p;
    try {
      p = verifyPending((req.body || {}).pending_token, 'admin_2fa_enroll');
    } catch (_) {
      return res.status(401).json({ message: 'Enrollment session expired. Log in again.' });
    }

    const { data: staff } = await supabaseAdmin
      .from('admin_users').select('id, email').eq('id', p.sub).maybeSingle();
    if (!staff) return res.status(401).json({ message: 'Invalid session.' });

    const { secret, otpauth } = twofa.newSecret(staff.email);
    // eslint-disable-next-line global-require
    const qrcode = require('qrcode');
    const qr_data_url = await qrcode.toDataURL(otpauth);

    // Store the encrypted secret; totp_enabled stays false until the first code confirms it.
    await supabaseAdmin.from('admin_users')
      .update({ totp_secret: encrypt(secret), updated_at: new Date().toISOString() })
      .eq('id', staff.id);

    return res.json({ qr_data_url, otpauth_uri: otpauth, secret });
  } catch (e) {
    console.error('[setup2fa]', e.message);
    return res.status(500).json({ message: 'Internal error.' });
  }
};

// POST /api/admin-auth/2fa-confirm  body: { pending_token, code }
// Step 2 of enrollment: verify the first code, enable 2FA, issue full session + recovery codes.
const confirm2fa = async (req, res) => {
  try {
    let p;
    try {
      p = verifyPending((req.body || {}).pending_token, 'admin_2fa_enroll');
    } catch (_) {
      return res.status(401).json({ message: 'Enrollment session expired. Log in again.' });
    }

    const { data: staff } = await supabaseAdmin
      .from('admin_users').select('*').eq('id', p.sub).maybeSingle();
    if (!staff || !staff.totp_secret) {
      return res.status(400).json({ message: 'Start enrollment first.' });
    }

    if (!twofa.verifyToken((req.body || {}).code, decrypt(staff.totp_secret))) {
      return res.status(400).json({ message: 'Invalid code. Try the current 6 digits.' });
    }

    const codes  = twofa.generateRecoveryCodes(8);
    const hashes = await twofa.hashRecoveryCodes(codes);

    await supabaseAdmin.from('admin_users').update({
      totp_enabled:         true,
      totp_recovery_codes:  hashes,
      totp_enrolled_at:     new Date().toISOString(),
      failed_attempts:      0,
      locked_until:         null,
      last_login_at:        new Date().toISOString(),
      updated_at:           new Date().toISOString(),
    }).eq('id', staff.id);

    // Best-effort audit — must not break enrollment if req.admin is absent.
    try {
      await audit(req, { action: 'admin.2fa.enrolled', resource_type: 'admin_user', resource_id: staff.id });
    } catch (_) { /* swallowed */ }

    const session = await fullSession(staff);
    return res.json({ ...session, recovery_codes: codes });
  } catch (e) {
    console.error('[confirm2fa]', e.message);
    return res.status(500).json({ message: 'Internal error.' });
  }
};

// POST /api/admin-auth/2fa-verify  body: { pending_token, code }
// Second factor for accounts that already have totp_enabled=true.
// Accepts a TOTP code OR a recovery code (single-use, consumed on success).
const verify2fa = async (req, res) => {
  try {
    let p;
    try {
      p = verifyPending((req.body || {}).pending_token, 'admin_2fa');
    } catch (_) {
      return res.status(401).json({ message: '2FA session expired. Log in again.' });
    }

    const { data: staff } = await supabaseAdmin
      .from('admin_users').select('*').eq('id', p.sub).maybeSingle();
    if (!staff || !staff.is_active || !staff.totp_enabled) {
      return res.status(401).json({ message: 'Invalid session.' });
    }

    // Lockout check (shared counter with password attempts).
    if (staff.locked_until && new Date(staff.locked_until).getTime() > Date.now()) {
      const mins = Math.ceil((new Date(staff.locked_until).getTime() - Date.now()) / 60000);
      return res.status(429).json({ message: `Locked. Try again in ${mins} minute(s).` });
    }

    const code = (req.body || {}).code;
    let ok           = twofa.verifyToken(code, decrypt(staff.totp_secret));
    let usedRecovery = false;

    if (!ok) {
      const idx = await twofa.matchRecoveryCode(code, staff.totp_recovery_codes || []);
      if (idx >= 0) {
        ok = true;
        usedRecovery = true;
        // Consume the used recovery code immediately.
        const remaining = (staff.totp_recovery_codes || []).filter((_, i) => i !== idx);
        await supabaseAdmin.from('admin_users')
          .update({ totp_recovery_codes: remaining })
          .eq('id', staff.id);
        try {
          await audit(req, { action: 'admin.2fa.recovery_used', resource_type: 'admin_user', resource_id: staff.id });
        } catch (_) { /* swallowed */ }
      }
    }

    if (!ok) {
      const failed  = (staff.failed_attempts || 0) + 1;
      const updates = { failed_attempts: failed, updated_at: new Date().toISOString() };
      if (failed >= MAX_FAILED) updates.locked_until = new Date(Date.now() + LOCK_MS).toISOString();
      await supabaseAdmin.from('admin_users').update(updates).eq('id', staff.id);
      try {
        await audit(req, { action: 'admin.2fa.failed', resource_type: 'admin_user', resource_id: staff.id });
      } catch (_) { /* swallowed */ }
      return res.status(401).json({ message: 'Invalid code.' });
    }

    // Success — reset failure counters, stamp login time.
    await supabaseAdmin.from('admin_users')
      .update({ failed_attempts: 0, locked_until: null, last_login_at: new Date().toISOString() })
      .eq('id', staff.id);

    try {
      await audit(req, {
        action: usedRecovery ? 'admin.2fa.success_recovery' : 'admin.2fa.success',
        resource_type: 'admin_user',
        resource_id: staff.id,
      });
    } catch (_) { /* swallowed */ }

    return res.json(await fullSession(staff));
  } catch (e) {
    console.error('[verify2fa]', e.message);
    return res.status(500).json({ message: 'Internal error.' });
  }
};

// GET /api/admin-auth/me — echo the session identity + permissions (behind requireAdmin).
const adminMe = (req, res) => res.json({ admin: req.admin });

module.exports = { adminLogin, adminMe, setup2fa, confirm2fa, verify2fa, jwtVerify };

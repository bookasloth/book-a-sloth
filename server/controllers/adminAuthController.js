/**
 * adminAuthController.js — Admin staff authentication (separate credential store)
 *
 * SECURITY MODEL (M1, v2.4):
 *   - Staff live in `admin_users` with their own bcrypt password_hash — NOT in
 *     auth.users. Customer auth and staff auth never intersect.
 *   - Login accepts a username OR email + password (single step, no OTP).
 *   - On success we mint an isolated HS256 session token (adminAuthService)
 *     carrying the role and its resolved permission array. Stored client-side
 *     under `bas_admin`, verified only by adminMiddleware.
 *   - Brute-force protection: MAX_FAILED wrong passwords → LOCK_MS lockout,
 *     mirroring the otp_codes hardening.
 */

const { supabaseAdmin } = require('../config/supabase');
const { jwtSign, jwtVerify, verifyPassword } = require('../services/adminAuthService');
const { roleGrants } = require('../lib/adminPermissions');

const MAX_FAILED = 5;
const LOCK_MS    = 15 * 60 * 1000; // 15 min

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

    return res.json({
      token,
      type: 'admin',
      role: staff.role_key,
      name: staff.name,
      email: staff.email,
      username: staff.username,
      permissions,
    });
  } catch (err) {
    console.error('[adminLogin]', err.message);
    return res.status(500).json({ message: 'Internal error.' });
  }
};

// GET /api/admin-auth/me — echo the session identity + permissions (behind requireAdmin).
const adminMe = (req, res) => res.json({ admin: req.admin });

module.exports = { adminLogin, adminMe, jwtVerify };

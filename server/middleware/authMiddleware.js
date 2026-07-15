const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

// Global session-invalidation check (Google RISC / "sign out everywhere").
// Returns true if this token must be rejected because it was issued BEFORE the
// user's sessions_valid_after watermark (stamped on a Google account-compromise
// event — see controllers/securityRiscController.js).
//
// FAIL-OPEN by design: this is a revocation add-on, not the primary auth gate
// (getUser already validated the token). Any error here — column missing before
// v3.79 is applied, transient DB blip, unparseable token — must NOT lock out a
// legitimate host, so we return false (allow) and let the token live out its
// short TTL. Inert for everyone whose watermark is null (the normal case).
const isTokenRevoked = async (userId, token) => {
  try {
    const iat = jwt.decode(token)?.iat; // seconds since epoch; no verify (getUser did)
    if (!iat) return false;
    const { data, error } = await supabaseAdmin
      .from('profiles').select('sessions_valid_after').eq('id', userId).maybeSingle();
    if (error || !data?.sessions_valid_after) return false;
    return iat * 1000 < new Date(data.sessions_valid_after).getTime();
  } catch (_) {
    return false; // fail-open — never block a valid user on a revocation-check error
  }
};

// Verify the Supabase access token. Network verification via getUser is kept:
// measured at ~175ms and NOT the source of the /api/auth/me latency (that was
// express-slow-down — see middleware/security.js). Project tokens are ES256
// (asymmetric signing keys), so a shared-secret local verify is not applicable.
const PERF = process.env.NODE_ENV !== 'production'
  ? process.env.PERF_LOG !== 'false'
  : process.env.PERF_LOG === 'true';

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const t0 = process.hrtime.bigint();
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (PERF) console.log(`[perf:auth] getUser → ${(Number(process.hrtime.bigint() - t0) / 1e6).toFixed(1)}ms`);

    if (error || !user) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // Global logout: reject tokens issued before a RISC-stamped watermark.
    if (await isTokenRevoked(user.id, token)) {
      return res.status(401).json({ message: 'Session revoked, sign in again' });
    }

    req.user = { id: user.id, email: user.email };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Like `protect`, but never rejects: if a valid Bearer token is present it
// attaches req.user; otherwise the request proceeds anonymously. Used by mixed
// endpoints such as guest booking (logged-in user OR OTP-verified guest).
const optionalProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  try {
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && user) req.user = { id: user.id, email: user.email };
  } catch (_) {
    /* invalid token → treat as anonymous guest */
  }
  return next();
};

// Authorization guard for host-capability routes. Runs after `protect`.
// Self-contained: reads the caller's role (or reuses req.user.role if an
// earlier middleware attached it). FAIL-CLOSED — a lookup error or missing
// profile yields 403, never an accidental pass. `superadmin` is allowed so
// staff tooling keeps working.
const requireHost = async (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    // is_host (v3.34) is the source of truth; role is the auto-mirrored shim and
    // the fallback for any path that hasn't been migrated yet. superadmin (role)
    // is always allowed so staff tooling keeps working.
    let { is_host: isHost, role } = req.user;
    if (isHost === undefined && !role) {
      const { data: profile } = await supabaseAdmin
        .from('profiles').select('is_host, role').eq('id', req.user.id).single();
      isHost = profile?.is_host;
      role = profile?.role;
      req.user.is_host = isHost;
      req.user.role = role;
    }
    if (isHost === true || role === 'host' || role === 'superadmin') return next();
    return res.status(403).json({
      message: 'Host account required. Turn on hosting to access this.',
      host_required: true,
    });
  } catch (_) {
    return res.status(403).json({ message: 'Host account required.', host_required: true });
  }
};

module.exports = { protect, optionalProtect, requireHost };

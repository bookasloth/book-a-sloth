const { supabaseAdmin } = require('../config/supabase');

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

module.exports = { protect, optionalProtect };

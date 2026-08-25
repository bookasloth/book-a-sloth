/**
 * ipGuard.js — early ban-enforcement + offense-tracking middleware.
 *
 *   ipGuard         : runs near the top of the chain (after trust proxy, before the
 *                     rate limiters). 403s any banned IP in O(1) from the in-memory
 *                     cache. Allowlist-wins is enforced inside ipBlocklist.isBlocked.
 *   offenseTracker  : watches responses; a 429 (rate-limit rejection) feeds the
 *                     general auto-ban counter via res.on('finish').
 *
 * Both are no-ops when the feature is disabled (IP_BLOCK_ENABLED=false) or under
 * load-test mode, and ipGuard fails OPEN on any internal error — a broken blocklist
 * must never take the site down.
 */

const config = require('../config/ipBlockConfig');
const { isLoadTestMode } = require('../config/loadTestMode');
const { isOpenAccess } = require('../config/openAccessWindow');
const { getClientIp } = require('../lib/clientIp');
const ipBlocklist = require('../lib/ipBlocklist');

// Paths that must NEVER be IP-blocked:
//   - the Razorpay webhook is HMAC-verified; a 403 here would silently break
//     payment reconciliation.
//   - the health probe must stay reachable for Render/UptimeRobot.
//   - /sitemap and /api/blogs are public, read-only SEO content that the Vercel
//     prerender fetches at build time; a banned build IP 403ing here fails the
//     whole deploy ("[prerender] blog posts unresolvable (HTTP 403)"). They carry
//     no private data, so exempting them from the IP ban is safe (the rate
//     limiter still applies).
const EXEMPT_PREFIXES = ['/api/payment/webhook', '/health', '/prerender', '/sitemap', '/api/blogs'];

function isExempt(req) {
  const p = (req && (req.path || req.url)) || '';
  return EXEMPT_PREFIXES.some((e) => p === e || p.startsWith(e + '/') || p.startsWith(e + '?') || p === e);
}

// A request carrying a VALID admin JWT is an already-authenticated admin. They
// are still rate-limited (429s are returned), but must never be counted toward
// an auto-ban: the admin panel fires several API calls per page load, so normal
// use could otherwise trip the offense threshold and lock an admin out of their
// own dashboard. Attackers can't forge a valid admin token, and failed logins
// carry no token, so brute-force protection is unaffected. Lazy require so the
// auth service (and its JWT secret) only loads when a 429 actually fires.
function isAuthenticatedAdmin(req) {
  const h = req && req.headers && req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return false;
  try {
    const { jwtVerify } = require('../services/adminAuthService');
    const payload = jwtVerify(h.slice(7));
    return !!payload && payload.type === 'admin';
  } catch (_) {
    return false;
  }
}

function ipGuard(req, res, next) {
  try {
    if (!config.enabled) return next();
    if (isLoadTestMode()) return next();
    if (isOpenAccess()) return next();  // launch/event window — don't block any IP
    if (isExempt(req)) return next();
    if (ipBlocklist.isBlocked(getClientIp(req))) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    return next();
  } catch (e) {
    // Fail-open.
    console.error('[ipGuard] error (failing open):', e.message);
    return next();
  }
}

function offenseTracker(req, res, next) {
  if (config.enabled && !isLoadTestMode() && !isOpenAccess()) {
    res.on('finish', () => {
      // A 429 means a rate limiter rejected this request → count it toward an
      // auto-ban. Fire-and-forget; the recorder swallows its own errors.
      // Authenticated admins are exempt (still rate-limited, never auto-banned).
      if (res.statusCode === 429 && !isAuthenticatedAdmin(req)) {
        Promise.resolve(ipBlocklist.recordRateLimitViolation(getClientIp(req))).catch(() => {});
      }
    });
  }
  next();
}

module.exports = { ipGuard, offenseTracker, isExempt, getClientIp };

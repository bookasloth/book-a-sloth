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
const { getClientIp } = require('../lib/clientIp');
const ipBlocklist = require('../lib/ipBlocklist');

// Paths that must NEVER be IP-blocked:
//   - the Razorpay webhook is HMAC-verified; a 403 here would silently break
//     payment reconciliation.
//   - the health probe must stay reachable for Render/UptimeRobot.
const EXEMPT_PREFIXES = ['/api/payment/webhook', '/health', '/prerender', '/sitemap'];

function isExempt(req) {
  const p = (req && (req.path || req.url)) || '';
  return EXEMPT_PREFIXES.some((e) => p === e || p.startsWith(e + '/') || p.startsWith(e + '?') || p === e);
}

function ipGuard(req, res, next) {
  try {
    if (!config.enabled) return next();
    if (isLoadTestMode()) return next();
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
  if (config.enabled && !isLoadTestMode()) {
    res.on('finish', () => {
      // A 429 means a rate limiter rejected this request → count it toward an
      // auto-ban. Fire-and-forget; the recorder swallows its own errors.
      if (res.statusCode === 429) {
        Promise.resolve(ipBlocklist.recordRateLimitViolation(getClientIp(req))).catch(() => {});
      }
    });
  }
  next();
}

module.exports = { ipGuard, offenseTracker, isExempt, getClientIp };

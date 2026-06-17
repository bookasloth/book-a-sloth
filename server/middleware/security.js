/**
 * Centralized security middleware for BookASloth API
 * Covers: Helmet, CSP, HSTS, rate limiting, XSS, HPP, request hardening
 */
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const hpp = require('hpp');

// ── Helmet — security headers ─────────────────────────────────
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "https://checkout.razorpay.com"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://*.supabase.co"],
      frameSrc:   ["'self'", "https://api.razorpay.com"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,          // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard:          { action: 'deny' },
  noSniff:             true,
  xssFilter:           true,
  referrerPolicy:      { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: false,
});

// ── Rate limiters ─────────────────────────────────────────────

// Auth endpoints: strict — 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: false,
});

// OTP endpoints: very strict — 5 sends per hour per IP
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please wait before requesting another.' },
});

// General API: 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

// Admin endpoints: 30 per minute per IP
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many admin requests.' },
});

// Payment endpoints: 20 per hour per IP (prevent order flooding)
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many payment requests. Please try again later.' },
});

// Username/slug availability check — prevent vendor-username enumeration.
const slugLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

// Public availability lookup — each call can hit the Google Calendar FreeBusy
// API, so cap it tighter than the global limiter to protect the API quota.
const slotsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many availability checks. Please wait a moment.' },
});

// Booking creation — public + fires email/WhatsApp notifications; cap per IP.
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many booking attempts. Please try again later.' },
});

// Free digital-product download — keyed by EMAIL (falling back to IP) so an
// attacker can't spam purchase rows / a victim's address by rotating IPs.
const freeDownloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String(req.body?.buyer_email || '').toLowerCase().trim();
    return email || req.ip;
  },
  message: { message: 'Too many download requests for this email. Please try again later.' },
});

// Companion to freeDownloadLimiter, keyed by IP. The email-keyed limiter alone
// is bypassed by rotating buyer_email per request (each unique email = a fresh
// bucket) → unlimited purchase-row spam from one IP. This caps total free-download
// requests per IP regardless of how many distinct emails are used. Stack BOTH.
const freeDownloadIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many download requests. Please try again later.' },
});

// Slow down abusive request floods — secondary to apiLimiter (100/min hard cap).
//
// PROVEN BUG (fixed): the old config (delayAfter:50, delayMs: hits*200, no cap)
// multiplied the delay by TOTAL hits in the 15-min window, so a normal dev/app
// session that legitimately makes 50+ calls (/auth/me fires on every mount) got
// 10–13s added to EVERY subsequent request. Measured: req #50 = 11,050ms,
// #60 = 12,971ms. Now: threshold raised well above normal usage, delay grows
// from the EXCESS over the threshold, and is hard-capped at 2s.
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 300,                          // normal sessions never reach this
  delayMs: (used) => (used - 300) * 100,    // gentle ramp only past the threshold
  maxDelayMs: 2000,                         // never add more than 2s, ever
  validate: { delayMs: false },             // silence express-slow-down v2 notice
});

// Permissions-Policy — deny powerful features the app never uses.
const permissionsPolicy = (req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), browsing-topics=()');
  next();
};

// ── Request hardening ─────────────────────────────────────────

// Prevent HTTP Parameter Pollution
const hppMiddleware = hpp({
  whitelist: ['tags', 'sort', 'filter'], // arrays allowed for these keys
});

// Strip dangerous characters from request body strings
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(req.body);
  }
  next();
};

const deepSanitize = (obj) => {
  if (typeof obj === 'string') {
    // Remove script tags and null bytes
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\0/g, '')
      .trim();
  }
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[k] = deepSanitize(v);
    }
    return clean;
  }
  return obj;
};

// Block requests with suspicious patterns
const blockSuspiciousRequests = (req, res, next) => {
  const suspicious = [
    /(\.\.|\/etc\/passwd|\/proc\/)/i,  // path traversal
    /(union\s+select|drop\s+table|insert\s+into)/i, // SQL injection hints
    /(<script|javascript:|vbscript:|data:text\/html)/i, // XSS
  ];
  const payload = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
  if (suspicious.some(p => p.test(payload))) {
    return res.status(400).json({ message: 'Invalid request.' });
  }
  next();
};

module.exports = {
  helmetMiddleware,
  authLimiter,
  otpLimiter,
  apiLimiter,
  adminLimiter,
  paymentLimiter,
  bookingLimiter,
  slugLimiter,
  slotsLimiter,
  freeDownloadLimiter,
  freeDownloadIpLimiter,
  speedLimiter,
  hppMiddleware,
  sanitizeBody,
  blockSuspiciousRequests,
  permissionsPolicy,
};

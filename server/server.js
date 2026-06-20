const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Fail fast on an incomplete environment (prod), or warn loudly (dev/test),
// instead of 500-ing later at request time deep inside a controller.
require('./config/validateEnv').validateEnv();

// Error tracking. No-op unless SENTRY_DSN is set, so local/CI are unaffected.
const { initSentry, captureException, flushSentry } = require('./utils/sentry');
const sentryStatus = initSentry();
if (sentryStatus.enabled) console.log('Sentry error tracking enabled');

const app = express();

// Behind a reverse proxy (Render/Heroku/Nginx) the client IP is in
// X-Forwarded-For. Trust the first proxy hop so express-rate-limit and the
// security middleware key on the real client IP instead of the proxy's (which
// would otherwise lump all users into one bucket or be spoofable). Adjust the
// hop count if more proxies sit in front.
app.set('trust proxy', 1);

// CORS: in production lock to CLIENT_URL. In dev, also accept any localhost port
// so Vite drifting (5173 → 5174 → 5175 when ports are busy) doesn't break the
// API with origin-mismatch failures that surface as "Could not start..." toasts.
const isProd = process.env.NODE_ENV === 'production';
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / curl / server-to-server
    if (origin === process.env.CLIENT_URL) return cb(null, true);
    if (!isProd && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// Raw body for Razorpay webhook (must come before express.json)
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// ── Perf instrumentation ────────────────────────────────────────────────
// Logs real wall-clock per /api request so the actual slow endpoints behind the
// "20s+ vendor page" reports are visible. Disable with PERF_LOG=false.
if (process.env.NODE_ENV !== 'production'
  ? process.env.PERF_LOG !== 'false'
  : process.env.PERF_LOG === 'true') {
  app.use('/api', (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      const tag = ms > 1000 ? 'SLOW' : 'ok';
      console.log(`[perf:${tag}] ${req.method} ${req.originalUrl} → ${res.statusCode} ${ms.toFixed(0)}ms`);
    });
    next();
  });
}

// BUG-03: Apply all security middleware that was defined but never used
const {
  helmetMiddleware,
  apiLimiter,
  adminLimiter,
  speedLimiter,
  hppMiddleware,
  sanitizeBody,
  blockSuspiciousRequests,
  permissionsPolicy,
} = require('./middleware/security');

app.use(helmetMiddleware);
app.use(permissionsPolicy);
app.use(hppMiddleware);
app.use(sanitizeBody);
app.use(blockSuspiciousRequests);
app.use(speedLimiter);
app.use('/api', apiLimiter);

// Maintenance mode — 503s public/vendor traffic when enabled; admin stays reachable.
const { maintenanceMiddleware } = require('./middleware/maintenanceMiddleware');
app.use('/api', maintenanceMiddleware);

app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/admin-auth',  adminLimiter, require('./routes/adminAuthRoutes'));
app.use('/api/onboarding',  require('./routes/vendorOnboardingRoutes'));
app.use('/api/host',        require('./routes/hostRoutes'));
app.use('/api/bookings',    require('./routes/bookingRoutes'));
app.use('/api/payment',     require('./routes/paymentRoutes'));
app.use('/api/admin',       adminLimiter, require('./routes/adminRoutes'));
app.use('/api/reviews',     require('./routes/reviewRoutes'));
app.use('/api/products',    require('./routes/productRoutes'));
app.use('/api/upload',      require('./routes/uploadRoutes'));
app.use('/api/vendor',      require('./routes/vendorRoutes'));
app.use('/api/services',    require('./routes/serviceRoutes'));
app.use('/api/categories',  require('./routes/categoryRoutes'));
app.use('/api/explore',     require('./routes/exploreRoutes'));
app.use('/api/vendors',        require('./routes/badgePublicRoutes'));
app.use('/api/feature-flags',  require('./routes/featureFlagRoutes'));
app.use('/api/notifications', require('./routes/notificationWebhookRoutes')); // public AiSensy webhook (secret-gated)
app.use('/api/email',         require('./routes/emailRoutes')); // public unsubscribe (signed-token gated)
app.use('/api/whatsapp',      require('./routes/whatsappRoutes'));
app.use('/api/username',      require('./routes/usernameRoutes')); // public resolve (edge 301) + auth check
app.get('/api/appearance',  require('./controllers/appearanceController').getPublic); // public navbar logo
app.get('/api/plans',       require('./controllers/planAdminController').publicPlans);

// Dynamic sitemap — root-mounted (NOT /api) so the public URLs are
// bookasloth.com/sitemap*.xml via the Vercel rewrite. DB-driven, cached, busted
// on service/profile mutations. Bypasses the /api rate limiter + maintenance 503.
app.use(require('./routes/sitemapRoutes'));

// Health check — used by Render's health probe and UptimeRobot. Mounted outside
// /api so it bypasses the API rate limiter and maintenance-mode 503s, staying
// reachable even while the app is in maintenance. Intentionally does NOT touch
// the DB so a slow Supabase round-trip can't flap the platform health check.
app.get('/health', (req, res) =>
  res.status(200).json({ status: 'ok', uptime: process.uptime(), ts: Date.now() })
);

app.get('/', (req, res) => res.json({ message: 'Book A Sloth API v1.4 running' }));

app.use(require('./middleware/errorMiddleware'));

const { processReminders, autoCompleteBookings } = require('./controllers/bookingController');
const { cleanup: cleanupOtps } = require('./utils/otpStore');

setInterval(async () => {
  try { await processReminders(); } catch (err) { console.error('Reminder cron error:', err.message); }
}, 5 * 60 * 1000);

// Auto-complete elapsed bookings so the lifecycle closes (and revenue becomes
// settle-able) without depending on anyone clicking "Mark Completed". Interval
// configurable via env, default 15 min; the per-booking hold/cutoff live in
// the controller (AUTO_COMPLETE_HOLD_MIN / AUTO_COMPLETE_CUTOFF).
const AUTO_COMPLETE_INTERVAL_MIN = Number(process.env.AUTO_COMPLETE_INTERVAL_MIN) || 15;
setInterval(async () => {
  try { await autoCompleteBookings(); } catch (err) { console.error('Auto-complete cron error:', err.message); }
}, AUTO_COMPLETE_INTERVAL_MIN * 60 * 1000);

setInterval(async () => {
  try { await cleanupOtps(); } catch (err) { console.error('OTP cleanup error:', err.message); }
}, 60 * 60 * 1000);

// Email queue worker — processes queued emails with retry backoff (every 60s)
const communicationEngine = require('./services/email/communicationEngine');
setInterval(async () => {
  try {
    const r = await communicationEngine.processQueue();
    if (r.sent || r.failed) console.log(`Email queue: ${r.sent} sent, ${r.retried} retried, ${r.failed} failed`);
  } catch (err) { console.error('Email queue worker error:', err.message); }
}, 60 * 1000);

// Campaign worker — drives 'sending' campaigns under their throttle (every 60s)
const campaignWorker = require('./services/campaignWorker');
setInterval(async () => {
  try {
    const r = await campaignWorker.processDue();
    if (r.enqueued || r.failed) console.log(`Campaign worker: ${r.enqueued} enqueued, ${r.failed} failed`);
  } catch (err) { console.error('Campaign worker error:', err.message); }
}, 60 * 1000);

// Badge engine: scheduled full evaluation (interval configurable via env, default 60 min)
const badgeEngine = require('./services/badgeEngine');
const BADGE_EVAL_INTERVAL_MIN = parseInt(process.env.BADGE_EVAL_INTERVAL_MIN) || 60;
setInterval(async () => {
  try {
    const r = await badgeEngine.evaluate();
    if (r.awarded || r.revoked) console.log(`Badge engine: +${r.awarded} awarded, -${r.revoked} revoked`);
  } catch (err) { console.error('Badge engine cron error:', err.message); }
}, BADGE_EVAL_INTERVAL_MIN * 60 * 1000);

// Ledger reconciler — self-heals missed journal postings (hourly, idempotent)
const ledgerReconciler = require('./services/ledger/ledgerReconciler');
const LEDGER_RECONCILE_MIN = Number(process.env.LEDGER_RECONCILE_INTERVAL_MIN || 60);
setInterval(async () => {
  try {
    const r = await ledgerReconciler.reconcile();
    if (r.reposted > 0) console.log(`Ledger reconciler: reposted ${r.reposted} missed entries`);
  } catch (err) { console.error('Ledger reconciler cron error:', err.message); }
}, LEDGER_RECONCILE_MIN * 60 * 1000);

// Subscription reconciler — heals subscriptions whose activation webhook was
// missed (vendor stuck 'pending'). Idempotent; interval configurable (default 15 min).
const subscriptionReconciler = require('./services/subscriptionReconciler');
const SUB_RECONCILE_MIN = Number(process.env.SUBSCRIPTION_RECONCILE_INTERVAL_MIN || 15);
setInterval(async () => {
  try {
    const r = await subscriptionReconciler.reconcile();
    if (r.healed > 0) console.log(`Subscription reconciler: activated ${r.healed} pending subscriptions`);
  } catch (err) { console.error('Subscription reconciler cron error:', err.message); }
}, SUB_RECONCILE_MIN * 60 * 1000);

// Booking-payment reconciler — heals one-off bookings stuck 'unpaid' whose
// payment.captured webhook was missed/exhausted, by asking Razorpay directly.
// Idempotent; interval configurable (default 15 min).
const bookingPaymentReconciler = require('./services/bookingPaymentReconciler');
const BOOKING_RECONCILE_MIN = Number(process.env.BOOKING_RECONCILE_INTERVAL_MIN || 15);
setInterval(async () => {
  try {
    const r = await bookingPaymentReconciler.reconcile();
    if (r.healed > 0) console.log(`Booking reconciler: confirmed ${r.healed} paid bookings (of ${r.checked} checked)`);
  } catch (err) { console.error('Booking reconciler cron error:', err.message); }
}, BOOKING_RECONCILE_MIN * 60 * 1000);

// Feature flags — seed any registry keys missing from the DB on boot (all ON,
// never overwrites an admin's existing on/off choice). Best-effort; the admin
// GET also re-syncs, so a transient boot failure self-heals.
require('./controllers/featureFlagController').syncRegistry()
  .then(() => console.log('Feature flags synced'))
  .catch((err) => console.error('Feature flag sync error:', err.message));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log('Server running on port ' + PORT));

// Graceful shutdown: flush buffered PostHog events before exit (Render sends
// SIGTERM on deploy/restart). Best-effort, then close the HTTP server.
const { shutdown: posthogShutdown } = require('./utils/posthog');
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received — flushing analytics and shutting down`);
  await Promise.allSettled([posthogShutdown(), flushSentry()]);
  server.close(() => process.exit(0));
  // Hard cap so a stuck connection can't hang the deploy.
  setTimeout(() => process.exit(0), 5000).unref();
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Last-resort safety nets. Without these, an unhandled promise rejection or a
// stray synchronous throw outside Express's try/catch (e.g. inside a setInterval
// cron callback) crashes the process silently with no captured context.
//
// uncaughtException: state is unknown/corrupt after one — log it, then exit so
// Render restarts a clean process rather than serving from a poisoned one.
// unhandledRejection: log at error level but do NOT exit — exiting on every
// rejected promise (an awaited fetch that 500s, etc.) would crash-loop the
// service. Surface it so it gets fixed; keep serving.
const { logger } = require('./utils/logger');
process.on('uncaughtException', (err) => {
  logger.error({ event: 'uncaughtException', message: err.message, stack: err.stack });
  captureException(err, { event: 'uncaughtException' });
  // Flush analytics + Sentry best-effort, then exit non-zero so Render restarts
  // a clean process. Hard cap so a stuck flush can't hang the restart.
  Promise.allSettled([posthogShutdown(), flushSentry()]).finally(() => process.exit(1));
  setTimeout(() => process.exit(1), 5000).unref();
});
process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error({ event: 'unhandledRejection', message: err.message, stack: err.stack });
  captureException(err, { event: 'unhandledRejection' });
});

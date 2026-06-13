const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

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
if (process.env.PERF_LOG !== 'false') {
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
  speedLimiter,
  hppMiddleware,
  sanitizeBody,
  blockSuspiciousRequests,
} = require('./middleware/security');

app.use(helmetMiddleware);
app.use(hppMiddleware);
app.use(sanitizeBody);
app.use(blockSuspiciousRequests);
app.use(speedLimiter);
app.use('/api', apiLimiter);

// Maintenance mode — 503s public/vendor traffic when enabled; admin stays reachable.
const { maintenanceMiddleware } = require('./middleware/maintenanceMiddleware');
app.use('/api', maintenanceMiddleware);

app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/admin-auth',  require('./routes/adminAuthRoutes'));
app.use('/api/onboarding',  require('./routes/vendorOnboardingRoutes'));
app.use('/api/host',        require('./routes/hostRoutes'));
app.use('/api/bookings',    require('./routes/bookingRoutes'));
app.use('/api/payment',     require('./routes/paymentRoutes'));
app.use('/api/admin',       require('./routes/adminRoutes'));
app.use('/api/reviews',     require('./routes/reviewRoutes'));
app.use('/api/products',    require('./routes/productRoutes'));
app.use('/api/upload',      require('./routes/uploadRoutes'));
app.use('/api/vendor',      require('./routes/vendorRoutes'));
app.use('/api/services',    require('./routes/serviceRoutes'));
app.use('/api/categories',  require('./routes/categoryRoutes'));
app.use('/api/vendors',     require('./routes/badgePublicRoutes'));
app.use('/api/notifications', require('./routes/notificationWebhookRoutes')); // public AiSensy webhook (secret-gated)
app.get('/api/plans',       require('./controllers/planAdminController').publicPlans);

app.get('/', (req, res) => res.json({ message: 'Book A Sloth API v1.4 running' }));

app.use(require('./middleware/errorMiddleware'));

const { processReminders } = require('./controllers/bookingController');
const { cleanup: cleanupOtps } = require('./utils/otpStore');

setInterval(async () => {
  try { await processReminders(); } catch (err) { console.error('Reminder cron error:', err.message); }
}, 5 * 60 * 1000);

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));

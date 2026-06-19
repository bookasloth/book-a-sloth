// Best-effort operational alerts to the founder (payment/webhook/cron failures).
//
// Two design rules, both load-bearing:
//   1. NEVER throws. Alerting must not break the request path it's called from.
//      A failed alert is logged and swallowed.
//   2. Throttled per `key`. A burst of identical failures — e.g. Razorpay
//      retrying the SAME failing webhook several times — must send one email,
//      not one per retry. Cooldown is in-memory (resets on deploy), which is
//      fine for alerting.
//
// Call it fire-and-forget (no await) from request handlers so it never adds
// latency to the response.

const sendEmail = require('./sendEmail');
const { logger } = require('./logger');

const ADMIN_ALERT_EMAIL =
  process.env.ADMIN_ALERT_EMAIL || process.env.SUPER_ADMIN_EMAIL || process.env.SMTP_USER;

const COOLDOWN_MS = Number(process.env.ADMIN_ALERT_COOLDOWN_MS) || 15 * 60 * 1000;
const lastSentAt = new Map(); // throttleKey -> epoch ms

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Send a best-effort operational alert email to the founder. Never rejects.
 *
 * @param {object}   opts
 * @param {string}   opts.subject  Short subject (sent prefixed with "[Book A Sloth] ").
 * @param {string[]} [opts.lines]  Body lines; each is HTML-escaped.
 * @param {string}   [opts.key]    Throttle key; defaults to `subject`. Same key
 *                                 within the cooldown window is suppressed.
 * @returns {Promise<{sent:boolean, reason?:string}>}
 */
async function adminAlert({ subject, lines = [], key } = {}) {
  if (!ADMIN_ALERT_EMAIL) return { sent: false, reason: 'no_recipient' };
  if (!subject) return { sent: false, reason: 'no_subject' };

  const throttleKey = key || subject;
  const now = Date.now();
  const prev = lastSentAt.get(throttleKey);
  if (prev && now - prev < COOLDOWN_MS) return { sent: false, reason: 'throttled' };
  lastSentAt.set(throttleKey, now);

  try {
    const body = lines.length ? lines.map(escapeHtml).join('<br/>') : escapeHtml(subject);
    await sendEmail({
      to: ADMIN_ALERT_EMAIL,
      subject: `[Book A Sloth] ${subject}`,
      html:
        `<p>${body}</p>` +
        `<p style="color:#888;font-size:12px">Automated operational alert. ` +
        `Check Render logs and the Razorpay dashboard.</p>`,
    });
    return { sent: true };
  } catch (err) {
    logger.error({ event: 'admin_alert_failed', subject, message: err.message });
    return { sent: false, reason: 'send_error' };
  }
}

// Test-only: clear the throttle map between cases.
adminAlert._resetThrottle = () => lastSentAt.clear();

module.exports = { adminAlert };

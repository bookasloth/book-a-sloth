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

// Comma-separated list supported (e.g. "bolt@bookasloth.in, ops@bookasloth.in").
// Providers wrap `to` as [to], so a comma string can't be one recipient — split
// and send one email per address.
const ADMIN_ALERT_EMAIL =
  process.env.ADMIN_ALERT_EMAIL || process.env.SUPER_ADMIN_EMAIL || process.env.SMTP_USER;
const recipients = () =>
  String(ADMIN_ALERT_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean);

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
 * @param {string}   [opts.link]   Optional review URL rendered as a button.
 * @returns {Promise<{sent:boolean, reason?:string}>}
 */
async function adminAlert({ subject, lines = [], key, link } = {}) {
  const to = recipients();
  if (!to.length) return { sent: false, reason: 'no_recipient' };
  if (!subject) return { sent: false, reason: 'no_subject' };

  const throttleKey = key || subject;
  const now = Date.now();
  const prev = lastSentAt.get(throttleKey);
  if (prev && now - prev < COOLDOWN_MS) return { sent: false, reason: 'throttled' };
  lastSentAt.set(throttleKey, now);

  // Rendered as a plain, transactional 1:1 note (not a marketing layout): a
  // single accent, no images, no unsubscribe link — the signals that keep Gmail
  // from filing it under Promotions/Updates. A text/plain twin is sent alongside
  // the HTML (see below) for the same reason.
  const rows = (lines.length ? lines : [subject])
    .map((l, i) => {
      const t = escapeHtml(l);
      // First line rendered a touch stronger (usually "who"); rest muted-normal.
      return i === 0
        ? `<div style="font-size:15px;color:#111;margin:0 0 4px">${t}</div>`
        : `<div style="font-size:14px;color:#444;margin:2px 0">${t}</div>`;
    })
    .join('');
  const button = link
    ? `<div style="margin:20px 0 4px"><a href="${escapeHtml(link)}" ` +
      `style="display:inline-block;padding:9px 18px;background:#111;color:#fff;` +
      `text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Open in admin →</a></div>`
    : '';
  const html =
    `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;` +
    `max-width:480px;margin:0 auto;padding:4px 2px;line-height:1.5">` +
    `<div style="font-size:16px;font-weight:700;color:#111;margin:0 0 12px">${escapeHtml(subject)}</div>` +
    `${rows}${button}` +
    `<div style="margin-top:20px;padding-top:12px;border-top:1px solid #eee;` +
    `font-size:12px;color:#999">Book A Sloth · internal ops notification</div>` +
    `</div>`;

  // text/plain twin — a strong "this is a personal/transactional message" signal
  // for inbox placement, and a graceful fallback for text-only clients.
  const text = [subject, '', ...(lines.length ? lines : []), link ? `\nOpen: ${link}` : '']
    .filter((l) => l !== undefined)
    .join('\n')
    .trim();

  // One email per recipient (providers can't split a comma string). A single
  // failure doesn't abort the rest; we report sent if at least one went out.
  let sentAny = false;
  for (const addr of to) {
    try {
      await sendEmail({ to: addr, subject: `[Book A Sloth] ${subject}`, html, text });
      sentAny = true;
    } catch (err) {
      logger.error({ event: 'admin_alert_failed', subject, to: addr, message: err.message });
    }
  }
  return sentAny ? { sent: true } : { sent: false, reason: 'send_error' };
}

// Test-only: clear the throttle map between cases.
adminAlert._resetThrottle = () => lastSentAt.clear();

module.exports = { adminAlert };

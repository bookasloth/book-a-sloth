'use strict';
/**
 * EmailService — the ONLY way CRM code sends email.
 *
 * Wraps the existing sendEmail util (which routes through email_settings.provider
 * → Resend/SMTP), so the CRM never touches Resend directly. Passes through
 * sendGate first (kill-switch + DNC + unsubscribe/suppression + valid email).
 *
 * BRANDING: the CRM body is wrapped in the shared branded template (renderLayout —
 * the same shell transactional email uses) so every send carries the Book A Sloth
 * header, brand colour, legal footer, and a valid unsubscribe link. Inline body
 * links become branded buttons and the copy gets house typography. Fails OPEN: if
 * the layout/settings can't load, it falls back to the raw body rather than blocking.
 *
 * Returns a normalized result; never throws.
 */
const sendEmail = require('../../utils/sendEmail');
const { canSend } = require('./sendGate');
const { renderLayout } = require('../email/emailLayout');
const { makeToken } = require('../email/unsubscribeToken');
const { loadSettings } = require('../email/communicationEngine');

const BRAND = '#FE5100';
const FONT = "'Poppins','Plus Jakarta Sans',Arial,sans-serif";

// Turn the raw sequence body into house-styled HTML: readable typography + any
// inline link promoted to a branded button (email clients need inline styles).
function styleBody(html) {
  const withButtons = String(html || '').replace(
    /<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href, label) =>
      `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;` +
      `text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:6px;` +
      `margin:8px 0;font-family:${FONT};">${label}</a>`,
  );
  return `<div style="font-family:${FONT};font-size:15px;line-height:1.65;color:#3c4043;">${withButtons}</div>`;
}

/**
 * @param {object} p
 * @param {object} p.lead     leads row (uses lead.email)
 * @param {string} p.subject
 * @param {string} p.html     the body HTML (branded shell is applied here)
 * @param {string} [p.text]
 * @param {string} [p.category] optional header pill label (e.g. 'Offer')
 * @param {string} [p.fromName] [p.fromEmail] persona override
 * @returns {{success:boolean, skipped?:boolean, reason?:string, providerMessageId?:string, error?:string}}
 */
async function send({ lead, subject, html, text, category, fromName, fromEmail, automated = false }) {
  const gate = await canSend(lead, 'email', { automated });
  if (!gate.ok) return { success: false, skipped: true, reason: gate.reason, defer: gate.defer };

  if (!subject || !html) return { success: false, error: 'missing_subject_or_body' };

  // Brand the email — per-recipient unsubscribe token so the footer link works.
  let finalHtml = html;
  try {
    const settings = await loadSettings();
    finalHtml = renderLayout({
      audience: 'customer',
      bodyHtml: styleBody(html),
      previewText: subject,
      emailCategory: category || '',
      settings,
      data: { unsubscribe_token: makeToken(lead.email) },
    });
  } catch (_) { /* fail open: send the raw body rather than nothing */ }

  try {
    const res = await sendEmail({ to: lead.email, subject, html: finalHtml, text, fromName, fromEmail });
    // Resend provider returns { success, id }; SMTP returns { success, messageId }.
    const providerMessageId = res?.id || res?.messageId || null;
    return { success: true, providerMessageId };
  } catch (err) {
    return { success: false, error: err.message || 'email_send_failed' };
  }
}

module.exports = { send, styleBody };

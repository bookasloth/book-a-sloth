'use strict';
/**
 * EmailService — the ONLY way CRM code sends email.
 *
 * Wraps the existing sendEmail util (which routes through email_settings.provider
 * → Resend/SMTP), so the CRM never touches Resend directly. Passes through
 * sendGate first (kill-switch + DNC + unsubscribe/suppression + valid email).
 * Returns a normalized result; never throws.
 */
const sendEmail = require('../../utils/sendEmail');
const { canSend } = require('./sendGate');

/**
 * @param {object} p
 * @param {object} p.lead     leads row (uses lead.email)
 * @param {string} p.subject
 * @param {string} p.html
 * @param {string} [p.text]
 * @returns {{success:boolean, skipped?:boolean, reason?:string, providerMessageId?:string, error?:string}}
 */
async function send({ lead, subject, html, text, fromName, fromEmail, automated = false }) {
  const gate = await canSend(lead, 'email', { automated });
  if (!gate.ok) return { success: false, skipped: true, reason: gate.reason, defer: gate.defer };

  if (!subject || !html) return { success: false, error: 'missing_subject_or_body' };

  try {
    const res = await sendEmail({ to: lead.email, subject, html, text, fromName, fromEmail });
    // Resend provider returns { success, id }; SMTP returns { success, messageId }.
    const providerMessageId = res?.id || res?.messageId || null;
    return { success: true, providerMessageId };
  } catch (err) {
    return { success: false, error: err.message || 'email_send_failed' };
  }
}

module.exports = { send };

/**
 * marketingSmtpProvider.js — SMTP provider for BULK / marketing / sales-automation
 * email, deliberately kept OFF Resend so the Resend transactional quota stays
 * reserved for booking confirmations, reminders and other system mail.
 *
 * Reads its OWN MARKETING_SMTP_* env (Google Workspace: aastha@bookasloth.in via
 * smtp.gmail.com) so it is fully independent of the default SMTP_* transport and
 * of email_settings.provider. Same interface as every other provider:
 *   sendEmail({ to, subject, html, ... }) → { success, id?, response?, error? }
 *
 * A failed send returns { success:false }, never falls back to another provider —
 * the callers (communicationEngine.processQueue / crm messageService) keep the row
 * queued and retry on THIS provider, so bulk failures never spill onto Resend.
 */
'use strict';
const nodemailer = require('nodemailer');

let _transporter = null;
const transporter = () => {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.MARKETING_SMTP_HOST,
    port: parseInt(process.env.MARKETING_SMTP_PORT) || 465,
    secure: String(process.env.MARKETING_SMTP_SECURE ?? 'true') !== 'false',
    auth: { user: process.env.MARKETING_SMTP_USER, pass: process.env.MARKETING_SMTP_PASS },
    // Fail fast on a dead relay — same rationale as smtpProvider, roomier defaults
    // because a bulk relay handshake can be a touch slower than the transactional one.
    connectionTimeout: parseInt(process.env.MARKETING_SMTP_CONNECTION_TIMEOUT_MS) || 10000,
    greetingTimeout: parseInt(process.env.MARKETING_SMTP_GREETING_TIMEOUT_MS) || 7000,
    socketTimeout: parseInt(process.env.MARKETING_SMTP_SOCKET_TIMEOUT_MS) || 15000,
  });
  return _transporter;
};

async function sendEmail({ to, subject, html, text, fromName = 'Book A Sloth', fromEmail, replyTo }) {
  // ponytail: Gmail / Google Workspace SMTP only sends AS the authenticated mailbox
  // (or a verified "send mail as" alias on it). Force the envelope + From to
  // MARKETING_SMTP_USER so ANY persona still delivers — even an off-marketing
  // campaign sender — instead of being silently rewritten or rejected. Persona
  // display name is preserved; add per-persona send-as aliases in Google Admin if
  // a persona must keep its own address.
  const authUser = process.env.MARKETING_SMTP_USER;
  const from = `"${fromName}" <${authUser}>`;
  try {
    const info = await transporter().sendMail({
      from, to, subject, html,
      ...(text ? { text } : {}),
      // Replies land in the persona's inbox if it has one, else the marketing box.
      replyTo: replyTo || fromEmail || authUser,
    });
    return { success: true, id: info.messageId, response: { accepted: info.accepted, response: info.response } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { name: 'marketing_smtp', sendEmail };

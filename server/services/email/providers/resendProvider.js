/**
 * resendProvider.js — Resend (resend.com) implementation of the provider
 * interface. Active when email_settings.provider = 'resend' and RESEND_API_KEY
 * is set. Uses the HTTP API directly (no SDK dependency).
 */
'use strict';

async function sendEmail({ to, subject, html, fromName = 'Book A Sloth', fromEmail }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY not configured' };
  const from = `${fromName} <${fromEmail || process.env.RESEND_FROM || 'noreply@bookasloth.in'}>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: body?.message || `HTTP ${res.status}`, response: body };
    return { success: true, id: body.id, response: body };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { name: 'resend', sendEmail };

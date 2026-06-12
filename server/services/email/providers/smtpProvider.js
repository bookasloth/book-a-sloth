/**
 * smtpProvider.js — Nodemailer/SMTP implementation of the provider interface.
 * Reuses the existing SMTP env config; this is the default provider.
 */
'use strict';
const nodemailer = require('nodemailer');

let _transporter = null;
const transporter = () => {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transporter;
};

async function sendEmail({ to, subject, html, fromName = 'Book A Sloth', fromEmail }) {
  try {
    const from = `"${fromName}" <${fromEmail || process.env.SMTP_USER}>`;
    const info = await transporter().sendMail({ from, to, subject, html });
    return { success: true, id: info.messageId, response: { accepted: info.accepted, response: info.response } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { name: 'smtp', sendEmail };

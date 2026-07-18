const nodemailer = require('nodemailer');
const { isLoadTestMode } = require('../config/loadTestMode');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Fail fast on a dead/misconfigured SMTP host. Nodemailer's defaults let a
  // send hang for minutes (connectionTimeout defaults to 2min, socketTimeout
  // to 10min) — that stalled every request that awaits sendEmail inline (contact
  // form, enterprise lead, password reset, bot escalation) when prod's SMTP_*
  // vars went stale after mail moved to Resend. These caps reject in ~7s so the
  // caller can log/return instead of blocking. Override via env if a slow relay
  // needs more headroom.
  connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 7000,
  greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT_MS) || 5000,
  socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS) || 10000,
});

const sendEmail = async ({ to, subject, html }) => {
  if (isLoadTestMode()) return; // no SMTP egress in load mode
  await transporter.sendMail({
    from: `"Book A Sloth" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;

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

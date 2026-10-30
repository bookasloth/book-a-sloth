'use strict';
/**
 * beASlothLeadController — public "Book a Demo" OTP form on /be-a-sloth.
 *
 * CRM lead capture + Meta Lead events were REMOVED in the growth-stack removal, so
 * this now only runs the phone-OTP handshake (so the /be-a-sloth page keeps working).
 * A verified demo request is no longer persisted anywhere.
 * ponytail: if demo requests must land somewhere, email the founder here instead of
 * re-adding the CRM.
 */
const otpStore = require('../utils/otpStore');
const { sendOtpNotification } = require('../utils/notify');
const { normalizePhone } = require('../services/aisensyService');
const { safeError } = require('../utils/httpError');

const OTP_TYPE = 'lead';                       // isolates this from login/booking OTPs
const cap = (s = '', n) => String(s).trim().slice(0, n);

// POST /api/be-a-sloth-lead/send-otp — sends the OTP (no lead stored anymore).
async function sendLeadOtp(req, res) {
  try {
    const b = req.body || {};
    if (b.company_hp) return res.json({ message: 'Verification code sent' }); // honeypot: pretend, drop
    const phone = normalizePhone(b.phone);
    if (!phone) return res.status(400).json({ message: 'A valid mobile number is required.' });

    const otp = otpStore.generate();
    const stored = await otpStore.set(phone, otp, OTP_TYPE);   // bcrypt-hashed, rate-limited
    if (stored && stored.ok === false) return res.status(429).json({ message: stored.reason });

    res.json({ message: 'Verification code sent' });
    Promise.resolve(sendOtpNotification({ phone, name: cap(b.name, 120), otp }))
      .catch((e) => console.error('[be-a-sloth] send-otp notify (non-fatal):', e.message));
  } catch (e) { safeError(res, e); }
}

// POST /api/be-a-sloth-lead — verifies the OTP (no lead stored/tagged anymore).
async function submitLead(req, res) {
  try {
    const b = req.body || {};
    if (b.company_hp) return res.status(201).json({ ok: true }); // honeypot
    const phone = normalizePhone(b.phone);
    const otp = String(b.otp || '').trim();
    if (!phone) return res.status(400).json({ error: 'A valid mobile number is required.' });
    if (!otp)   return res.status(400).json({ error: 'Enter the verification code.' });

    const check = await otpStore.verify(phone, otp, OTP_TYPE); // single-use
    if (!check.valid) return res.status(400).json({ error: check.reason || 'Invalid verification code.' });

    return res.status(201).json({ ok: true });
  } catch (e) { safeError(res, e); }
}

module.exports = { sendLeadOtp, submitLead };

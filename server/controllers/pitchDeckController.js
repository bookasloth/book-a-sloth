'use strict';

/**
 * pitchDeckController.js — passcode + WhatsApp-OTP gate for the investor deck.
 *
 * Flow (see routes/pitchDeckRoutes.js):
 *   1. POST /request-otp {passcode, phone} → check passcode + not-expired → send WhatsApp OTP
 *   2. POST /verify-otp  {passcode, phone, otp} → verify OTP → issue 45-min token
 *   3. GET  /data  (Bearer <token>) → verify token + not-expired → return confidential figures
 *
 * Reuses: otpStore (type 'pitch_deck'), notify.sendWhatsAppVerifyOtp, aisensy
 * normalizePhone, pitchDeckToken (OAUTH_STATE_SECRET). No new store/secret/template.
 */

const otpStore = require('../utils/otpStore');
const { sendWhatsAppVerifyOtp } = require('../utils/notify');
const { normalizePhone } = require('../services/aisensyService');
const pitchToken = require('../utils/pitchDeckToken');
const { DATA, isConfigured, isExpired, checkPasscode } = require('../data/pitchDeck');

// OTP store key is namespaced so it can't collide with booking/guest OTPs.
const otpKey = (phone) => `pitch:${phone}`;

// Shared gate guard — returns true (and responds) if the request should stop.
const gated = (res) => {
  if (!isConfigured()) {
    res.status(503).json({ message: 'Pitch deck access is not configured yet.' });
    return true;
  }
  if (isExpired()) {
    res.status(410).json({ message: 'This pitch deck link has expired.' });
    return true;
  }
  return false;
};

// POST /request-otp
const requestOtp = async (req, res) => {
  try {
    if (gated(res)) return;
    const { passcode, phone } = req.body || {};
    if (!checkPasscode(passcode)) {
      return res.status(401).json({ message: 'Invalid access code.' });
    }
    const norm = normalizePhone(phone);
    if (!norm) return res.status(400).json({ message: 'Enter a valid phone number.' });

    const otp = otpStore.generate();
    const stored = await otpStore.set(otpKey(norm), otp, 'pitch_deck');
    if (stored.ok === false) {
      return res.status(429).json({ message: stored.reason || 'Too many code requests. Please wait.' });
    }

    // Respond immediately; deliver the code out-of-band (fire-and-forget).
    res.json({ message: 'Verification code sent on WhatsApp.' });
    sendWhatsAppVerifyOtp({ phone: norm, otp, name: 'Investor' })
      .catch((err) => console.error('[pitch-deck] OTP send failed:', err?.message || err));
  } catch (err) {
    console.error('[pitch-deck] requestOtp error:', err?.message || err);
    if (!res.headersSent) res.status(500).json({ message: 'Could not send code. Try again.' });
  }
};

// POST /verify-otp
const verifyOtp = async (req, res) => {
  try {
    if (gated(res)) return;
    const { passcode, phone, otp } = req.body || {};
    if (!checkPasscode(passcode)) {
      return res.status(401).json({ message: 'Invalid access code.' });
    }
    const norm = normalizePhone(phone);
    if (!norm) return res.status(400).json({ message: 'Enter a valid phone number.' });
    if (!otp) return res.status(400).json({ message: 'Enter the code.' });

    const result = await otpStore.verify(otpKey(norm), otp, 'pitch_deck');
    if (!result.valid) {
      return res.status(400).json({ message: result.reason || 'Incorrect or expired code.' });
    }

    const token = pitchToken.issue(norm);
    return res.json({ token, expiresInSec: pitchToken.TTL_SEC });
  } catch (err) {
    console.error('[pitch-deck] verifyOtp error:', err?.message || err);
    return res.status(500).json({ message: 'Could not verify. Try again.' });
  }
};

// GET /data — the confidential payload, token-gated.
const getData = (req, res) => {
  try {
    if (gated(res)) return;
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!pitchToken.verifyToken(token)) {
      return res.status(401).json({ message: 'Session expired. Please verify again.' });
    }
    return res.json(DATA);
  } catch (err) {
    console.error('[pitch-deck] getData error:', err?.message || err);
    return res.status(500).json({ message: 'Could not load deck.' });
  }
};

module.exports = { requestOtp, verifyOtp, getData };

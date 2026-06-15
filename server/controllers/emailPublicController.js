/**
 * emailPublicController.js — public (no-auth) email preference endpoints.
 *
 * The signed unsubscribe token IS the authentication: it proves the caller holds
 * a link we issued for a specific address, so a guest with no account can opt out
 * straight from an email. Routes are mounted at /api/email and rate-limited by the
 * global apiLimiter.
 *
 * Opt-out applies to MARKETING email only; transactional mail (OTP, booking,
 * payment, security) always sends — enforced in communicationEngine.
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { verifyToken } = require('../services/email/unsubscribeToken');

const emailFromToken = (token) => verifyToken(token);

/** GET /api/email/unsubscribe?token= → { email, unsubscribed } for the page to render. */
async function getUnsubscribeStatus(req, res) {
  const email = emailFromToken(req.query.token);
  if (!email) return res.status(400).json({ message: 'Invalid or expired link.' });
  try {
    const { data } = await supabaseAdmin
      .from('email_unsubscribes').select('email').eq('email', email).maybeSingle();
    return res.json({ email, unsubscribed: !!data });
  } catch (_) {
    return res.json({ email, unsubscribed: false });
  }
}

/** POST /api/email/unsubscribe { token } → opt the address out of marketing email. */
async function unsubscribe(req, res) {
  const email = emailFromToken(req.body.token);
  if (!email) return res.status(400).json({ message: 'Invalid or expired link.' });
  try {
    const { error } = await supabaseAdmin
      .from('email_unsubscribes')
      .upsert({ email, unsubscribed_at: new Date().toISOString(), source: 'email_link' }, { onConflict: 'email' });
    if (error) return res.status(500).json({ message: 'Could not update your preference. Please try again.' });
    return res.json({ ok: true, email, unsubscribed: true });
  } catch (_) {
    return res.status(500).json({ message: 'Could not update your preference. Please try again.' });
  }
}

/** POST /api/email/resubscribe { token } → opt the address back in. */
async function resubscribe(req, res) {
  const email = emailFromToken(req.body.token);
  if (!email) return res.status(400).json({ message: 'Invalid or expired link.' });
  try {
    const { error } = await supabaseAdmin.from('email_unsubscribes').delete().eq('email', email);
    if (error) return res.status(500).json({ message: 'Could not update your preference. Please try again.' });
    return res.json({ ok: true, email, unsubscribed: false });
  } catch (_) {
    return res.status(500).json({ message: 'Could not update your preference. Please try again.' });
  }
}

module.exports = { getUnsubscribeStatus, unsubscribe, resubscribe };

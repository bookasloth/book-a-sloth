'use strict';
/**
 * beASlothLeadController — public "Book a Demo" lead form on /be-a-sloth.
 *
 * Two steps, both public + rate-limited at the route:
 *   POST /api/be-a-sloth-lead/send-otp  { phone, name }        → WhatsApp OTP
 *   POST /api/be-a-sloth-lead           { name, phone, profession, otp, attribution }
 *
 * The lead is created ONLY after the OTP verifies, so every website lead has a
 * reachable, verified phone — which is what the sales team actually needs.
 *
 * Deliberately reuses shared infrastructure rather than inventing a parallel flow:
 *   - OTP:  utils/otpStore (type 'lead', phone-keyed) + utils/notify's
 *           sendOtpNotification (the existing AiSensy BOOKING_OTP template). Phone-
 *           only, so NO guest account is created (that only happens for email).
 *   - Lead: services/crm/leadService.safeUpsertLead — the ONE lead-ingestion layer
 *           (same as the Meta Lead Ads webhook + the enterprise form). Dedup,
 *           lifecycle (status defaults to 'new' → Presale board), attribution,
 *           notifications, assignment, activity history and follow-ups all come
 *           from there. source = 'website'.
 */
const otpStore = require('../utils/otpStore');
const { sendOtpNotification } = require('../utils/notify');
const { normalizePhone } = require('../services/aisensyService');
const { safeUpsertLead } = require('../services/crm/leadService');
const { safeError } = require('../utils/httpError');

const OTP_TYPE = 'lead';                       // isolates this code from login/booking OTPs
const cap = (s = '', n) => String(s).trim().slice(0, n);

// POST /api/be-a-sloth-lead/send-otp
async function sendLeadOtp(req, res) {
  try {
    const phone = normalizePhone(req.body && req.body.phone);
    if (!phone) return res.status(400).json({ message: 'A valid mobile number is required.' });

    const otp = otpStore.generate();
    const stored = await otpStore.set(phone, otp, OTP_TYPE);   // bcrypt-hashed, rate-limited
    if (stored && stored.ok === false) return res.status(429).json({ message: stored.reason });

    // Respond immediately; WhatsApp delivery is slow (~6s) + best-effort. The
    // rate-limit + otpStore.set above already gate correctness.
    res.json({ message: 'Verification code sent' });
    Promise.resolve(sendOtpNotification({ phone, name: cap(req.body && req.body.name, 120), otp }))
      .catch((e) => console.error('[be-a-sloth] send-otp notify (non-fatal):', e.message));
  } catch (e) { safeError(res, e); }
}

// POST /api/be-a-sloth-lead
async function submitLead(req, res) {
  try {
    const b = req.body || {};
    if (b.company_hp) return res.status(201).json({ ok: true }); // honeypot: silently drop bots

    const name = cap(b.name, 120);
    const phone = normalizePhone(b.phone);
    const profession = cap(b.profession, 120);
    const otp = String(b.otp || '').trim();

    if (!name)       return res.status(400).json({ error: 'Name is required.' });
    if (!phone)      return res.status(400).json({ error: 'A valid mobile number is required.' });
    if (!profession) return res.status(400).json({ error: 'Please tell us what you do.' });
    if (!otp)        return res.status(400).json({ error: 'Enter the verification code.' });

    // Gate: no lead until the phone is proven. otpStore.verify is single-use.
    const check = await otpStore.verify(phone, otp, OTP_TYPE);
    if (!check.valid) return res.status(400).json({ error: check.reason || 'Invalid verification code.' });

    // Verified inbound → CRM via the SHARED ingestion layer (identical path to the
    // Meta webhook + enterprise form). source 'website'; dedup, lifecycle,
    // notifications, assignment, activity + follow-ups are all handled inside.
    // metaReq forwards the browser request so the auto-fired Meta Lead event gets
    // IP/UA/fbp/fbc match keys (ties the lead to the ad click).
    const result = await safeUpsertLead(
      { name, phone, profession },
      { source: 'website', createdBy: 'be_a_sloth_form', attribution: b.attribution, metaReq: req }
    );

    // High-intent inbound → feed the lead score (matched by phone). Best-effort.
    require('../services/crm/intentEvents')
      .record({ event: 'demo_request', phone, meta: { profession, page: 'be_a_sloth' }, source: 'website' })
      .catch(() => {});

    return res.status(201).json({ ok: true, lead_id: result && result.lead && result.lead.id });
  } catch (e) { safeError(res, e); }
}

module.exports = { sendLeadOtp, submitLead };

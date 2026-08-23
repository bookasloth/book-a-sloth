'use strict';
/**
 * sendGate.js — the single safety checkpoint EVERY CRM outbound send passes.
 *
 * A send is only allowed when ALL hold:
 *   1. The global CRM send kill-switch is ON (feature flag `crm_admin_sends`).
 *      This flag is FAIL-CLOSED (see services/featureFlags.js) and seeded
 *      disabled — sends are impossible until an admin explicitly enables it.
 *   2. The lead is not do_not_contact and not status='do_not_contact'.
 *   3. A valid destination exists for the channel (phone for WhatsApp, email
 *      for email).
 *   4. The recipient hasn't opted out on that channel:
 *        - email  → email_unsubscribes (HMAC list) OR contacts.email_suppressed
 *        - whatsapp → contacts.whatsapp_suppressed
 *
 * Returns { ok: boolean, reason?: string }. `reason` is a stable slug so the
 * caller can record why a send was skipped (crm_messages.status='skipped').
 */
const { supabaseAdmin } = require('../../config/supabase');
const { isFeatureEnabled } = require('../featureFlags');
const { normalizePhone } = require('../aisensyService');

const SEND_FLAG = 'crm_admin_sends';

const validEmail = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/**
 * @param {object} lead   a leads row (needs phone/whatsapp_phone/email, do_not_contact, status, contact_id)
 * @param {'whatsapp'|'email'} channel
 */
async function canSend(lead, channel) {
  if (!lead) return { ok: false, reason: 'no_lead' };

  // 1. Global kill-switch (fail-closed).
  if (!(await isFeatureEnabled(SEND_FLAG))) return { ok: false, reason: 'sends_disabled' };

  // 2. Do Not Contact.
  if (lead.do_not_contact || lead.status === 'do_not_contact') return { ok: false, reason: 'do_not_contact' };

  if (channel === 'whatsapp') {
    const dest = normalizePhone(lead.whatsapp_phone || lead.phone);
    if (!dest) return { ok: false, reason: 'invalid_phone' };
    if (await isSuppressed(lead, 'whatsapp')) return { ok: false, reason: 'whatsapp_suppressed' };
    return { ok: true };
  }

  if (channel === 'email') {
    const email = (lead.email || '').trim().toLowerCase();
    if (!validEmail(email)) return { ok: false, reason: 'invalid_email' };
    if (await isEmailUnsubscribed(email)) return { ok: false, reason: 'email_unsubscribed' };
    if (await isSuppressed(lead, 'email')) return { ok: false, reason: 'email_suppressed' };
    return { ok: true };
  }

  return { ok: false, reason: 'unknown_channel' };
}

// email_unsubscribes is the platform-wide HMAC opt-out list (v3.7). Fail OPEN on
// error (matches communicationEngine.isUnsubscribed) — an outage shouldn't block
// legitimate sends, but a real opt-out row always wins.
async function isEmailUnsubscribed(email) {
  try {
    const { data } = await supabaseAdmin
      .from('email_unsubscribes').select('email').eq('email', email).maybeSingle();
    return !!data;
  } catch (_) { return false; }
}

// contacts carries per-channel suppression flags set by prior campaign activity.
// Matched by the lead's linked contact_id, else by email/phone.
async function isSuppressed(lead, channel) {
  try {
    let contact = null;
    if (lead.contact_id) {
      ({ data: contact } = await supabaseAdmin
        .from('contacts').select('email_suppressed, whatsapp_suppressed')
        .eq('id', lead.contact_id).maybeSingle());
    }
    if (!contact && lead.email) {
      ({ data: contact } = await supabaseAdmin
        .from('contacts').select('email_suppressed, whatsapp_suppressed')
        .eq('email', lead.email.trim().toLowerCase()).maybeSingle());
    }
    if (!contact) return false;
    return channel === 'email' ? !!contact.email_suppressed : !!contact.whatsapp_suppressed;
  } catch (_) { return false; }
}

module.exports = { canSend, SEND_FLAG, validEmail };

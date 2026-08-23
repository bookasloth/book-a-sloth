'use strict';
/**
 * webhookEvents.js — normalize provider delivery events into the CRM.
 *
 * Both the Resend (email) and AiSensy (WhatsApp) webhooks funnel here so the
 * status/timeline logic lives in one place:
 *   1. find the crm_messages row (by provider_message_id, else by lead phone/email)
 *   2. advance its status (forward-only) + stamp the matching *_at column
 *   3. append a crm_message_events row (audit trail)
 *   4. for POSITIVE engagement (open/click/read/reply) → write a lead_activity
 *      and bump leads.last_engaged_at (feeds the behavioural lead score)
 *   5. for a bounce/complaint → suppress the contact's email (compliance)
 *
 * Best-effort + defensive: a provider we can't match is recorded and skipped,
 * never throws (a webhook must always 200 or the provider retries forever).
 */
const { supabaseAdmin } = require('../../config/supabase');
const { normalizePhone } = require('../aisensyService');

// Forward-only status ranking so a late 'sent' can't overwrite 'read'.
const RANK = { queued: 0, processing: 1, sent: 2, delivered: 3, read: 4 };
const TERMINAL = new Set(['failed', 'bounced']);

// Provider event → { status?, stamp?, activity?, engaged?, suppressEmail? }
const EMAIL_MAP = {
  'email.sent': { status: 'sent', stamp: 'sent_at' },
  'email.delivered': { status: 'delivered', stamp: 'delivered_at' },
  'email.opened': { activity: 'email_opened', engaged: true },
  'email.clicked': { activity: 'email_clicked', engaged: true },
  'email.bounced': { status: 'bounced', stamp: 'failed_at', suppressEmail: true },
  'email.complained': { status: 'bounced', stamp: 'failed_at', suppressEmail: true },
};
const WA_MAP = {
  sent: { status: 'sent', stamp: 'sent_at' },
  delivered: { status: 'delivered', stamp: 'delivered_at' },
  read: { status: 'read', stamp: 'read_at', activity: 'whatsapp_read', engaged: true },
  failed: { status: 'failed', stamp: 'failed_at' },
  replied: { activity: 'whatsapp_reply', engaged: true },
};

async function findMessage({ providerMessageId, channel, phone, email }) {
  if (providerMessageId) {
    const { data } = await supabaseAdmin.from('crm_messages').select('*').eq('provider_message_id', providerMessageId).maybeSingle();
    if (data) return data;
  }
  // Fallback: newest outbound message to the lead on this channel.
  let leadId = null;
  if (channel === 'whatsapp' && phone) {
    const np = normalizePhone(phone);
    if (np) { const { data: l } = await supabaseAdmin.from('leads').select('id').eq('phone', np).maybeSingle(); leadId = l?.id; }
  } else if (channel === 'email' && email) {
    const { data: l } = await supabaseAdmin.from('leads').select('id').eq('email', email.trim().toLowerCase()).maybeSingle(); leadId = l?.id;
  }
  if (!leadId) return null;
  const { data } = await supabaseAdmin.from('crm_messages').select('*')
    .eq('lead_id', leadId).eq('channel', channel).eq('direction', 'outbound')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data || null;
}

async function recordDeliveryEvent({ channel, event, providerMessageId, payload = {}, phone, email }) {
  try {
    const map = channel === 'email' ? EMAIL_MAP[event] : WA_MAP[event];
    const msg = await findMessage({ providerMessageId, channel, phone, email });

    // Always keep the raw event if we matched a message (audit trail).
    if (msg) {
      await supabaseAdmin.from('crm_message_events').insert({ message_id: msg.id, event_type: event, payload });

      if (map) {
        const now = new Date().toISOString();
        const patch = { updated_at: now };
        if (map.status) {
          const cur = RANK[msg.status] ?? -1;
          const next = RANK[map.status] ?? -1;
          if (TERMINAL.has(map.status) || next > cur) patch.status = map.status;
        }
        if (map.stamp) patch[map.stamp] = now;
        if (Object.keys(patch).length > 1) await supabaseAdmin.from('crm_messages').update(patch).eq('id', msg.id);

        if (map.engaged) {
          await supabaseAdmin.from('leads').update({ last_engaged_at: now, last_activity_at: now, updated_at: now }).eq('id', msg.lead_id);
        }
        if (map.activity) {
          await supabaseAdmin.from('lead_activities').insert({
            lead_id: msg.lead_id, type: map.activity, title: activityTitle(map.activity),
            meta: { message_id: msg.id, channel }, occurred_at: new Date().toISOString(),
          });
        }
        if (map.suppressEmail && msg.contact_id) {
          await supabaseAdmin.from('contacts').update({ email_suppressed: true, updated_at: now }).eq('id', msg.contact_id);
        }
      }
    }
    return { ok: true, matched: !!msg };
  } catch (err) {
    console.error('[crm] recordDeliveryEvent failed:', err.message);
    return { ok: false };
  }
}

function activityTitle(a) {
  return { email_opened: 'Email opened', email_clicked: 'Email link clicked', whatsapp_read: 'WhatsApp read', whatsapp_reply: 'WhatsApp reply received' }[a] || a;
}

module.exports = { recordDeliveryEvent };

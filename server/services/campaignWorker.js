/**
 * campaignWorker — drives 'sending' campaigns. Each tick, for every sending
 * campaign, enqueue up to throttle_per_min recipients into the email queue.
 * Idempotent per recipient (only 'queued' rows are picked). Flips campaign to
 * 'sent' when no queued recipients remain.
 *
 * Phase 1: email channel only. The WhatsApp branch is added in Phase 2 (Task 15).
 */
'use strict';
const { supabaseAdmin } = require('../config/supabase');
const communicationEngine = require('./email/communicationEngine');

async function processDue() {
  const { data: campaigns } = await supabaseAdmin.from('email_campaigns').select('*').eq('status', 'sending');
  let enqueued = 0, failed = 0;

  for (const campaign of campaigns || []) {
    const cap = campaign.throttle_per_min || 120;
    const { data: recipients } = await supabaseAdmin
      .from('campaign_recipients').select('*').eq('campaign_id', campaign.id).eq('status', 'queued').limit(cap);

    for (const rcpt of recipients || []) {
      const { data: contact } = await supabaseAdmin.from('contacts').select('*').eq('id', rcpt.contact_id).single();
      if (!contact || !contact.email || !contact.email_opt_in || contact.email_suppressed) {
        await mark(rcpt.id, 'skipped', 'not_contactable');
        continue;
      }
      const data = { first_name: (contact.name || '').split(' ')[0], name: contact.name, email: contact.email, ...(contact.attributes || {}) };
      const r = await communicationEngine.enqueueCampaignEmail({
        templateId: campaign.template_id, to: contact.email, data,
        user: { name: contact.name, email: contact.email },
        campaignId: campaign.id, subjectOverride: campaign.subject_override || null,
        recipientUserId: contact.user_id || null,
      });
      if (r.ok) { await mark(rcpt.id, 'sent', null, r.logId); enqueued++; }
      else      { await mark(rcpt.id, 'failed', r.reason || 'enqueue_failed'); failed++; }
    }

    // Drained? Mark the campaign complete.
    const { data: remaining } = await supabaseAdmin
      .from('campaign_recipients').select('id').eq('campaign_id', campaign.id).eq('status', 'queued').limit(1);
    if (!remaining || remaining.length === 0) {
      await supabaseAdmin.from('email_campaigns').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', campaign.id);
    }
  }
  return { enqueued, failed };
}

async function mark(id, status, error = null, email_log_id = null) {
  const patch = { status, error, updated_at: new Date().toISOString() };
  if (status === 'sent') { patch.sent_at = new Date().toISOString(); if (email_log_id) patch.email_log_id = email_log_id; }
  await supabaseAdmin.from('campaign_recipients').update(patch).eq('id', id);
}

module.exports = { processDue };

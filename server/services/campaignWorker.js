/**
 * campaignWorker — drives 'sending' campaigns. Each tick, for every sending
 * campaign, process up to throttle_per_min queued recipients.
 *   - email    → render template + enqueue into the email queue (delivered by
 *                communicationEngine.processQueue with retry/backoff)
 *   - whatsapp → send the approved AiSensy template now, throttled
 * Idempotent per recipient (only 'queued' rows are picked). Flips campaign to
 * 'sent' when no queued recipients remain. Consent/suppression is re-checked
 * here per channel (defence in depth over segment resolution).
 */
'use strict';
const { supabaseAdmin } = require('../config/supabase');
const communicationEngine = require('./email/communicationEngine');
const aisensy = require('./aisensyService');
const waTemplates = require('./whatsappTemplateService');
const NotificationEngine = require('./notificationEngine');

async function processDue() {
  const { data: campaigns } = await supabaseAdmin.from('email_campaigns').select('*').eq('status', 'sending');
  let enqueued = 0, failed = 0;

  for (const campaign of campaigns || []) {
    const cap = campaign.throttle_per_min || 120;
    const { data: recipients } = await supabaseAdmin
      .from('campaign_recipients').select('*').eq('campaign_id', campaign.id).eq('status', 'queued').limit(cap);

    // Pre-load WhatsApp config once per campaign (not per recipient).
    let waTpl = null, waProvider = null;
    if (campaign.channel === 'whatsapp') {
      ({ data: waTpl } = await supabaseAdmin.from('whatsapp_templates').select('*').eq('id', campaign.whatsapp_template_id).single());
      ({ data: waProvider } = await supabaseAdmin.from('notification_providers').select('*').eq('provider', 'aisensy').single());
    }

    for (const rcpt of recipients || []) {
      const { data: contact } = await supabaseAdmin.from('contacts').select('*').eq('id', rcpt.contact_id).single();

      // ── WhatsApp ──
      if (campaign.channel === 'whatsapp') {
        if (!contact || !contact.phone || !contact.whatsapp_opt_in || contact.whatsapp_suppressed) {
          await mark(rcpt.id, 'skipped', 'not_contactable'); continue;
        }
        if (!waTpl || !waProvider || !waProvider.is_active || !waProvider.api_key) {
          await mark(rcpt.id, 'failed', 'whatsapp_not_configured'); failed++; continue;
        }
        const cdata = { first_name: (contact.name || '').split(' ')[0], name: contact.name, ...(contact.attributes || {}) };
        const params = waTemplates.buildParams(waTpl, cdata);
        const r = await aisensy.sendCampaign({
          apiKey: waProvider.api_key, campaignName: waTpl.aisensy_campaign_name,
          destination: contact.phone, userName: contact.name, templateParams: params,
        });
        await NotificationEngine.logResult({
          event: `CAMPAIGN:${campaign.id}`, channel: 'whatsapp', destination: contact.phone,
          status: r.success ? 'sent' : 'failed', response: r.response, error: r.error,
          payload: { campaignName: waTpl.aisensy_campaign_name, templateParams: params },
        });
        if (r.success) { await mark(rcpt.id, 'sent'); enqueued++; }
        else           { await mark(rcpt.id, 'failed', r.error); failed++; }
        continue;
      }

      // ── Email ──
      if (!contact || !contact.email || !contact.email_opt_in || contact.email_suppressed) {
        await mark(rcpt.id, 'skipped', 'not_contactable'); continue;
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

/**
 * notificationEngine.js — central, DB-configured notification dispatcher.
 *
 * Business logic emits semantic events:
 *   NotificationEngine.send({ event: 'BOOKING_CONFIRMED_CUSTOMER', data: {...} })
 *
 * The engine — never the callers — decides:
 *   - WhatsApp enabled? (notification_events.whatsapp_enabled + provider active)
 *   - Email enabled?    (notification_events.email_enabled)
 *   - Which AiSensy campaign? (notification_events.campaign_name)
 *   - Which provider credentials? (notification_providers)
 * Every attempt is written to notification_logs.
 *
 * data contract:
 *   {
 *     phone:          recipient phone (WhatsApp)
 *     name:           recipient display name
 *     templateParams: ordered array for the WhatsApp template
 *     email:          recipient email address
 *     emailHtml:      rendered HTML body (callers keep their templates)
 *     emailSubject:   optional override; falls back to event.email_subject
 *   }
 *
 * Resilient by design: if the v1.9 tables don't exist yet (schema fallback
 * pattern), the engine falls back to email-only with defaults so production
 * never breaks.
 */

const { supabaseAdmin } = require('../config/supabase');
const aisensy = require('./aisensyService');
const communicationEngine = require('./email/communicationEngine');

const CACHE_TTL_MS = 60 * 1000;
let _cache = { at: 0, events: null, providers: null };

const _isMissingSchema = (error) =>
  error && /Could not find the|does not exist|relation .* does not exist/i.test(error.message || '');

const loadConfig = async () => {
  const now = Date.now();
  if (_cache.events && now - _cache.at < CACHE_TTL_MS) return _cache;

  const [evRes, prRes] = await Promise.all([
    supabaseAdmin.from('notification_events').select('*'),
    supabaseAdmin.from('notification_providers').select('*'),
  ]);

  if (_isMissingSchema(evRes.error) || _isMissingSchema(prRes.error)) {
    // v1.9 migration not applied — email-only fallback
    _cache = { at: now, events: new Map(), providers: new Map(), schemaMissing: true };
    return _cache;
  }

  const events = new Map((evRes.data || []).map((e) => [e.event_key, e]));
  const providers = new Map((prRes.data || []).map((p) => [p.provider, p]));
  _cache = { at: now, events, providers, schemaMissing: false };
  return _cache;
};

const clearCache = () => { _cache = { at: 0, events: null, providers: null }; };

const logResult = async ({ event, channel, destination, status, response, error, payload }) => {
  try {
    await supabaseAdmin.from('notification_logs').insert({
      event_key: event,
      channel,
      destination: destination || 'unknown',
      status,
      response: response || {},
      error: error || null,
      payload: payload || {},
    });
  } catch (_) { /* logging must never break the flow */ }
};

/**
 * Send a notification for a semantic event.
 * Never throws — returns { whatsapp, email } result objects.
 */
const send = async ({ event, data = {} }) => {
  const results = { event, whatsapp: { attempted: false }, email: { attempted: false } };
  if (!event) return results;

  let cfg;
  try {
    cfg = await loadConfig();
  } catch (err) {
    cfg = { events: new Map(), providers: new Map(), schemaMissing: true };
  }

  const evt = cfg.events.get(event);
  // Defaults when event row missing / schema missing: email on, whatsapp off
  const emailEnabled    = evt ? !!evt.email_enabled && !!evt.is_active : true;
  const whatsappEnabled = evt ? !!evt.whatsapp_enabled && !!evt.is_active : false;

  // ── WhatsApp via AiSensy ─────────────────────────────────────
  const provider = cfg.providers.get('aisensy');
  if (whatsappEnabled && provider && provider.is_active && data.phone) {
    results.whatsapp.attempted = true;
    const params = {
      apiKey: provider.api_key,
      campaignName: evt.campaign_name,
      destination: data.phone,
      userName: data.name,
      templateParams: data.templateParams || [],
      buttonParams: data.buttonParams || [],   // copy-code button (auth/OTP templates)
    };
    const r = await aisensy.sendCampaign(params);
    results.whatsapp = { attempted: true, ...r };
    await logResult({
      event, channel: 'whatsapp', destination: data.phone,
      status: r.success ? 'sent' : 'failed',
      response: r.response, error: r.error,
      payload: { campaignName: evt.campaign_name, userName: data.name, templateParams: data.templateParams || [], buttonParams: data.buttonParams || [] },
    });
  }

  // ── Email via the Communication Engine (DB template + queue + log) ───
  // No inline HTML here: business logic passes structured placeholder data and
  // the engine resolves the DB template, renders the standard layout, queues,
  // sends via the configured provider and records to email_logs.
  if (emailEnabled && data.email) {
    results.email.attempted = true;
    const r = await communicationEngine.send({
      event,
      to: data.email,
      audience: data.audience || 'all',
      data: data.emailData || {},
      user: data.emailUser || { email: data.email, name: data.name },
      recipientUserId: data.recipientUserId || null,
      bookingId: data.bookingId || null,
      immediate: !!data.immediateEmail,
    });
    results.email = { attempted: true, success: !!r.ok, status: r.status, error: r.error || r.reason };
    // notification_logs keeps the cross-channel summary; email_logs has detail.
    await logResult({
      event, channel: 'email', destination: data.email,
      status: r.status === 'sent' ? 'sent' : (r.status === 'queued' ? 'pending' : 'failed'),
      error: r.error || r.reason || null,
      payload: { via: 'communicationEngine', logId: r.logId || null },
    });
  }

  return results;
};

module.exports = { send, loadConfig, clearCache, logResult };

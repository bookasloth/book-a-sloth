/**
 * communicationEngine.js — centralized email authority (PRD).
 *
 * Business event → resolve template → resolve placeholders → layout →
 * (OTP: send now | else: queue) → provider → delivery log.
 *
 * Business logic NEVER builds HTML or calls a provider directly. It calls:
 *   communicationEngine.send({ event, to, data, user, immediate?, bookingId? })
 *
 * Everything is logged in email_logs, which also backs the retry queue.
 */

'use strict';

const { supabaseAdmin } = require('../../config/supabase');
const { buildGlobals, resolveTemplate, resolveString } = require('./placeholderResolver');
const { renderLayout } = require('./emailLayout');
const { getProvider } = require('./providers');
const { makeToken } = require('./unsubscribeToken');

// Marketing / lifecycle events that honor the unsubscribe list. Everything NOT
// listed here (OTP, auth, security, booking confirmations, payment receipts,
// subscription receipts) is transactional and ALWAYS sends — the CAN-SPAM /
// GDPR carve-out. Bulk campaigns (event_key 'CAMPAIGN:<id>') are always marketing.
const MARKETING_EVENTS = new Set([
  'BADGE_UNLOCKED',
  'MILESTONE_FIRST_BOOKING', 'MILESTONE_10_BOOKINGS', 'MILESTONE_50_BOOKINGS', 'MILESTONE_100_BOOKINGS',
  'BIRTHDAY', 'ACCOUNT_ANNIVERSARY',
  'PROFILE_COMPLETION_REMINDER',
]);

const isMarketing = (event) => MARKETING_EVENTS.has(event) || String(event).startsWith('CAMPAIGN:');

/**
 * Has this address opted out of marketing email? Fails OPEN: if the table is
 * missing or the query errors, returns false so transactional/lifecycle mail is
 * never silently dropped by an infra problem.
 */
async function isUnsubscribed(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return false;
  try {
    const { data, error } = await supabaseAdmin
      .from('email_unsubscribes').select('email').eq('email', e).maybeSingle();
    if (error) return false;
    return !!data;
  } catch (_) {
    return false;
  }
}

// Retry delays (minutes) after a failed send: 5m, 30m, 2h, then permanent fail.
const BACKOFFS_MIN = [5, 30, 120];
const CACHE_TTL_MS = 60 * 1000;

let _settingsCache = { at: 0, value: null };
let _templateCache = { at: 0, map: null };

const isMissingSchema = (e) =>
  e && /Could not find the|does not exist|relation .* does not exist/i.test(e.message || '');

async function loadSettings() {
  const now = Date.now();
  if (_settingsCache.value && now - _settingsCache.at < CACHE_TTL_MS) return _settingsCache.value;
  let value = {
    provider: 'smtp', from_name: 'Book A Sloth', from_email: '',
    support_email: 'support@bookasloth.in', website_url: 'https://bookasloth.in',
    logo_url: '', brand_color: '#FE5100', footer_html: '',
  };
  try {
    const { data } = await supabaseAdmin.from('email_settings').select('*').eq('id', 1).maybeSingle();
    if (data) value = { ...value, ...data };
  } catch (_) { /* defaults */ }
  _settingsCache = { at: now, value };
  return value;
}

async function loadTemplates() {
  const now = Date.now();
  if (_templateCache.map && now - _templateCache.at < CACHE_TTL_MS) return _templateCache.map;
  const map = new Map(); // `${event_key}:${audience}` → template
  try {
    const { data, error } = await supabaseAdmin
      .from('email_templates').select('*').eq('status', 'active');
    if (!error) for (const t of data || []) map.set(`${t.event_key}:${t.audience}`, t);
  } catch (_) { /* empty */ }
  _templateCache = { at: now, map };
  return map;
}

function clearCache() {
  _settingsCache = { at: 0, value: null };
  _templateCache = { at: 0, map: null };
}

/** Active template for an event; prefers an exact audience, falls back to 'all'. */
async function getTemplate(event, audience = 'all') {
  const map = await loadTemplates();
  return map.get(`${event}:${audience}`) || map.get(`${event}:all`) || null;
}

/**
 * Render a template to a full HTML document (no DB writes).
 * `audience` selects the layout shell (vendor vs customer); it is the RECIPIENT
 * audience, not the template row tag. Defaults to 'all' → customer shell.
 */
function renderEmail(template, { data = {}, user = {}, settings, audience = 'all' }) {
  const globals = buildGlobals(settings, user);
  const r = resolveTemplate(template, data, globals);
  // Resolve the preheader too — otherwise raw {{tokens}} leak into the inbox preview.
  const previewText = resolveString(data.preview_text || template.preview_text || '', { ...globals, ...data }).text;
  const html = renderLayout({
    audience,
    bodyHtml: r.html, previewText,
    ctaLabel: r.ctaLabel, ctaUrl: r.ctaUrl, settings,
    emailCategory: template.email_category || '',
    data,
  });
  return { subject: r.subject, html, missing: r.missing };
}

async function insertLog(row) {
  const { data, error } = await supabaseAdmin.from('email_logs').insert(row).select('id').single();
  if (error) { console.error('email_logs insert failed:', error.message); return null; }
  return data?.id || null;
}

async function deliver({ settings, to, subject, html }) {
  const provider = getProvider(settings.provider);
  const res = await provider.sendEmail({
    to, subject, html,
    fromName: settings.from_name, fromEmail: settings.from_email,
  });
  return { provider: provider.name, ...res };
}

/**
 * Send an email for a business event.
 * @param {object} opts
 * @param {string} opts.event       event key (must have an active template)
 * @param {string} opts.to          recipient email
 * @param {object} [opts.data]      placeholder values (booking_date, otp, ...)
 * @param {object} [opts.user]      { name, email, username } for global placeholders
 * @param {string} [opts.audience]  'customer' | 'vendor' | 'all'
 * @param {string} [opts.recipientUserId]
 * @param {string} [opts.bookingId]
 * @param {boolean} [opts.immediate] true for OTP — bypasses the queue
 * @param {boolean} [opts.isTest]   test send (marked, excluded from normal logs)
 * @returns {{ ok, status, logId?, reason?, error? }}
 */
async function send(opts) {
  const {
    event, to, data = {}, user = {}, audience = 'all',
    recipientUserId = null, bookingId = null, immediate = false, isTest = false,
  } = opts || {};
  if (!event || !to) return { ok: false, reason: 'event and to are required' };

  const settings = await loadSettings();
  const template = await getTemplate(event, audience);
  if (!template) {
    console.warn(`communicationEngine: no active template for ${event} (${audience})`);
    return { ok: false, reason: 'no_template' };
  }

  // Signed unsubscribe token for the customer-footer link (recovered statelessly
  // on click). Harmless for shells without an unsubscribe link (vendor).
  const sendData = { ...data, unsubscribe_token: data.unsubscribe_token || makeToken(to) };
  const { subject, html } = renderEmail(template, { data: sendData, user, settings, audience });

  const baseLog = {
    event_key: event, template_id: template.id, audience: template.audience,
    recipient: to, recipient_user_id: recipientUserId, booking_id: bookingId,
    subject, html, is_test: isTest,
  };

  // Marketing email to an opted-out address → suppress (never reaches the queue).
  // Transactional events bypass this entirely. Real sends only (not test/immediate-OTP).
  if (!isTest && !immediate && isMarketing(event) && await isUnsubscribed(to)) {
    const logId = await insertLog({ ...baseLog, status: 'suppressed', attempts: 0, sent_at: null });
    return { ok: true, status: 'suppressed', logId };
  }

  // Test send → deliver now, mark TEST (kept out of the normal logs view)
  if (isTest) {
    const r = await deliver({ settings, to, subject, html });
    await insertLog({ ...baseLog, status: r.success ? 'test' : 'failed',
      provider: r.provider, provider_response: r.response || {}, error: r.error || null,
      attempts: 1, sent_at: new Date().toISOString() });
    return { ok: r.success, status: 'test', error: r.error };
  }

  // OTP / critical → immediate send (PRD §17)
  if (immediate) {
    const r = await deliver({ settings, to, subject, html });
    const logId = await insertLog({ ...baseLog,
      status: r.success ? 'sent' : 'queued', provider: r.provider,
      provider_response: r.response || {}, error: r.error || null,
      attempts: 1, sent_at: r.success ? new Date().toISOString() : null,
      next_attempt_at: r.success ? null : new Date(Date.now() + BACKOFFS_MIN[0] * 60000).toISOString() });
    return { ok: r.success, status: r.success ? 'sent' : 'queued', logId, error: r.error };
  }

  // Everything else → queue for the worker
  const logId = await insertLog({ ...baseLog, status: 'queued', attempts: 0,
    next_attempt_at: new Date().toISOString() });
  return { ok: true, status: 'queued', logId };
}

/**
 * Queue worker — processes due 'queued' emails with retry backoff.
 * Called on an interval from server.js.
 * @returns {{ processed, sent, failed, retried }}
 */
async function processQueue(limit = 25) {
  const settings = await loadSettings();
  const nowIso = new Date().toISOString();

  let rows = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('email_logs').select('*')
      .eq('status', 'queued').lte('next_attempt_at', nowIso)
      .order('next_attempt_at', { ascending: true }).limit(limit);
    if (error) { if (!isMissingSchema(error)) console.error('queue read:', error.message); return { processed: 0, sent: 0, failed: 0, retried: 0 }; }
    rows = data || [];
  } catch (_) { return { processed: 0, sent: 0, failed: 0, retried: 0 }; }

  let sent = 0, failed = 0, retried = 0;
  for (const row of rows) {
    const attemptsMade = (row.attempts || 0) + 1;
    const r = await deliver({ settings, to: row.recipient, subject: row.subject, html: row.html });

    if (r.success) {
      await supabaseAdmin.from('email_logs').update({
        status: 'sent', attempts: attemptsMade, provider: r.provider,
        provider_response: r.response || {}, error: null,
        sent_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      sent++;
    } else if (attemptsMade <= BACKOFFS_MIN.length) {
      // schedule the next retry (5m → 30m → 2h)
      const delayMin = BACKOFFS_MIN[attemptsMade - 1];
      await supabaseAdmin.from('email_logs').update({
        status: 'queued', attempts: attemptsMade, provider: r.provider,
        error: r.error || 'send failed',
        next_attempt_at: new Date(Date.now() + delayMin * 60000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      retried++;
    } else {
      // exhausted retries → permanent failure
      await supabaseAdmin.from('email_logs').update({
        status: 'failed', attempts: attemptsMade, provider: r.provider,
        error: r.error || 'send failed (max retries)', updated_at: new Date().toISOString(),
      }).eq('id', row.id);
      failed++;
    }
  }
  return { processed: rows.length, sent, failed, retried };
}

/**
 * Enqueue one campaign email (render chosen template for one contact → queued log).
 * The standard processQueue() worker delivers it. Subject override optional.
 */
async function enqueueCampaignEmail({ templateId, to, data = {}, user = {}, campaignId, subjectOverride, recipientUserId = null }) {
  if (!templateId || !to) return { ok: false, reason: 'templateId and to required' };
  const settings = await loadSettings();
  const { data: template } = await supabaseAdmin.from('email_templates').select('*').eq('id', templateId).single();
  if (!template) return { ok: false, reason: 'no_template' };

  // Campaigns are bulk marketing — honor the unsubscribe list (legal requirement).
  if (await isUnsubscribed(to)) {
    const logId = await insertLog({
      event_key: `CAMPAIGN:${campaignId || ''}`, template_id: template.id, audience: template.audience,
      recipient: to, recipient_user_id: recipientUserId, campaign_id: campaignId || null,
      subject: subjectOverride || '', html: '', status: 'suppressed', attempts: 0, is_test: false,
    });
    return { ok: true, status: 'suppressed', logId };
  }

  // Campaigns target a specific audience template; render that audience's shell.
  const sendData = { ...data, unsubscribe_token: data.unsubscribe_token || makeToken(to) };
  const rendered = renderEmail(template, { data: sendData, user, settings, audience: template.audience });
  const subject = subjectOverride || rendered.subject;
  const logId = await insertLog({
    event_key: `CAMPAIGN:${campaignId || ''}`, template_id: template.id, audience: template.audience,
    recipient: to, recipient_user_id: recipientUserId, campaign_id: campaignId || null,
    subject, html: rendered.html, status: 'queued', attempts: 0,
    next_attempt_at: new Date().toISOString(), is_test: false,
  });
  return { ok: true, status: 'queued', logId };
}

module.exports = {
  send, processQueue, renderEmail, getTemplate, loadSettings, loadTemplates,
  clearCache, BACKOFFS_MIN, enqueueCampaignEmail, isMarketing, isUnsubscribed,
};

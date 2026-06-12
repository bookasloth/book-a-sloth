/**
 * notificationAdminController.js — Super Admin → Notification Settings.
 *
 * Provider config (AiSensy), event registry CRUD, test sends, logs, retry.
 * Secrets never leave the server unmasked.
 */
const { supabaseAdmin } = require('../config/supabase');
const NotificationEngine = require('../services/notificationEngine');
const aisensy = require('../services/aisensyService');
const sendEmail = require('../utils/sendEmail');

const maskKey = (key) => {
  if (!key) return '';
  const tail = key.slice(-6);
  return `${'*'.repeat(14)}${tail}`;
};

const isMasked = (v) => typeof v === 'string' && v.startsWith('****');

// ── GET /api/admin/notifications/provider ───────────────────────
const getProvider = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_providers')
      .select('*')
      .eq('provider', 'aisensy')
      .maybeSingle();
    if (error) return res.status(500).json({ message: error.message });
    if (!data) return res.json({ provider: 'aisensy', api_key_masked: '', settings_json: {}, is_active: false, configured: false });
    res.json({
      provider: data.provider,
      api_key_masked: maskKey(data.api_key),
      settings_json: data.settings_json || {},
      is_active: data.is_active,
      configured: !!data.api_key,
      updated_at: data.updated_at,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/admin/notifications/provider ───────────────────────
const updateProvider = async (req, res) => {
  try {
    const { api_key, connected_number, webhook_url, is_active } = req.body;
    const updates = {
      settings_json: { connected_number: connected_number || '', webhook_url: webhook_url || '' },
      is_active: !!is_active,
      updated_at: new Date().toISOString(),
    };
    // Only overwrite the key when a real (non-masked) value was supplied
    if (api_key && !isMasked(api_key)) updates.api_key = api_key.trim();

    const { data, error } = await supabaseAdmin
      .from('notification_providers')
      .upsert({ provider: 'aisensy', ...updates }, { onConflict: 'provider' })
      .select()
      .single();
    if (error) return res.status(500).json({ message: error.message });

    NotificationEngine.clearCache();
    res.json({
      message: 'Provider settings saved',
      api_key_masked: maskKey(data.api_key),
      settings_json: data.settings_json,
      is_active: data.is_active,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/admin/notifications/provider/test ─────────────────
const testProvider = async (req, res) => {
  try {
    const { data } = await supabaseAdmin
      .from('notification_providers')
      .select('api_key')
      .eq('provider', 'aisensy')
      .maybeSingle();
    const result = await aisensy.testConnection({ apiKey: data?.api_key });
    res.status(result.ok ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
};

// ── GET /api/admin/notifications/events ─────────────────────────
const getEvents = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_events')
      .select('*')
      .order('event_key');
    if (error) return res.status(500).json({ message: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/admin/notifications/events/:id ─────────────────────
const updateEvent = async (req, res) => {
  try {
    const allowed = ['display_name', 'whatsapp_enabled', 'email_enabled', 'campaign_name', 'email_subject', 'is_active'];
    const updates = { updated_at: new Date().toISOString() };
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

    const { data, error } = await supabaseAdmin
      .from('notification_events')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ message: error.message });

    NotificationEngine.clearCache();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/admin/notifications/test-send ─────────────────────
// { event_key, channel: 'whatsapp'|'email', destination }
const testSend = async (req, res) => {
  try {
    const { event_key, channel, destination } = req.body;
    if (!event_key || !channel || !destination)
      return res.status(400).json({ message: 'event_key, channel and destination are required' });

    const sampleParams = event_key === 'BOOKING_OTP'
      ? ['123456']
      : ['Test Customer', 'Sample Service', 'Test Vendor', new Date().toLocaleString('en-IN')];

    const result = await NotificationEngine.send({
      event: event_key,
      data: {
        phone: channel === 'whatsapp' ? destination : undefined,
        email: channel === 'email' ? destination : undefined,
        name: 'Test User',
        templateParams: sampleParams,
        // OTP templates carry a copy-code button that needs the code too.
        buttonParams: event_key === 'BOOKING_OTP' ? sampleParams : [],
        emailSubject: `[TEST] ${event_key}`,
        emailHtml: channel === 'email'
          ? `<div style="font-family:sans-serif;padding:24px;"><h2>Test notification</h2><p>This is a test of <strong>${event_key}</strong> from Book A Sloth Super Admin.</p><p>Params: ${sampleParams.join(', ')}</p></div>`
          : undefined,
      },
    });

    const ch = channel === 'whatsapp' ? result.whatsapp : result.email;
    if (!ch.attempted) {
      return res.status(400).json({ message: `${channel} not attempted — check that the channel is enabled for this event and the provider is active.`, result });
    }
    res.status(ch.success ? 200 : 502).json({ message: ch.success ? 'Test sent' : `Send failed: ${ch.error}`, result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/admin/notifications/logs ───────────────────────────
const getLogs = async (req, res) => {
  try {
    const { event_key, channel, status, limit = 100 } = req.query;
    let q = supabaseAdmin
      .from('notification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(parseInt(limit) || 100, 500));
    if (event_key) q = q.eq('event_key', event_key);
    if (channel)   q = q.eq('channel', channel);
    if (status)    q = q.eq('status', status);
    const { data, error } = await q;
    if (error) return res.status(500).json({ message: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/admin/notifications/logs/:id/retry ────────────────
const retryLog = async (req, res) => {
  try {
    const { data: log, error } = await supabaseAdmin
      .from('notification_logs')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !log) return res.status(404).json({ message: 'Log entry not found' });

    if (log.channel === 'whatsapp') {
      const { data: provider } = await supabaseAdmin
        .from('notification_providers').select('*').eq('provider', 'aisensy').maybeSingle();
      const p = log.payload || {};
      const r = await aisensy.sendCampaign({
        apiKey: provider?.api_key,
        campaignName: p.campaignName,
        destination: log.destination,
        userName: p.userName,
        templateParams: p.templateParams || [],
      });
      await NotificationEngine.logResult({
        event: log.event_key, channel: 'whatsapp', destination: log.destination,
        status: r.success ? 'sent' : 'failed', response: r.response, error: r.error, payload: p,
      });
      return res.status(r.success ? 200 : 502).json({ message: r.success ? 'Retried successfully' : `Retry failed: ${r.error}` });
    }

    if (log.channel === 'email') {
      const subject = (log.payload && log.payload.subject) || `Book A Sloth — ${log.event_key}`;
      try {
        await sendEmail({
          to: log.destination,
          subject,
          html: `<div style="font-family:sans-serif;padding:24px;"><p>Retried notification for event <strong>${log.event_key}</strong>.</p></div>`,
        });
        await NotificationEngine.logResult({ event: log.event_key, channel: 'email', destination: log.destination, status: 'sent', payload: log.payload });
        return res.json({ message: 'Retried successfully' });
      } catch (e) {
        await NotificationEngine.logResult({ event: log.event_key, channel: 'email', destination: log.destination, status: 'failed', error: e.message, payload: log.payload });
        return res.status(502).json({ message: `Retry failed: ${e.message}` });
      }
    }

    res.status(400).json({ message: `Unknown channel: ${log.channel}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProvider, updateProvider, testProvider, getEvents, updateEvent, testSend, getLogs, retryLog, maskKey };

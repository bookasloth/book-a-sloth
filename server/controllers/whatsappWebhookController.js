/**
 * whatsappWebhookController — inbound AiSensy webhook (public, secret-gated).
 *
 * COMPLIANCE-CRITICAL: an inbound STOP / opt-out must permanently suppress the
 * contact for WhatsApp. That path is matched leniently and is the main reason
 * this endpoint exists.
 *
 * NOTE: AiSensy's exact webhook payload shape is account-configured. Fields are
 * extracted defensively across common names. CONFIRM the live payload before
 * relying on delivery/read status (the full delivery funnel is a v2 concern —
 * here we only acknowledge status events). The secret is read from
 * notification_providers.settings_json.webhook_secret (or AISENSY_WEBHOOK_SECRET)
 * and passed as ?secret= or the x-webhook-secret header.
 */
'use strict';
const { supabaseAdmin } = require('../config/supabase');
const aisensy = require('../services/aisensyService');

async function getSecret() {
  if (process.env.AISENSY_WEBHOOK_SECRET) return process.env.AISENSY_WEBHOOK_SECRET;
  try {
    const { data } = await supabaseAdmin.from('notification_providers').select('settings_json').eq('provider', 'aisensy').single();
    return data?.settings_json?.webhook_secret || null;
  } catch (_) { return null; }
}

const OPT_OUT_RE = /\b(stop|unsubscribe|opt[\s-]?out)\b/i;

const handleWebhook = async (req, res) => {
  try {
    const expected = await getSecret();
    const provided = req.query?.secret || req.headers?.['x-webhook-secret'];
    if (expected && provided !== expected) return res.status(401).json({ message: 'invalid secret' });

    const body = req.body || {};
    const phoneRaw = body.destination || body.phone || body.from || body.mobile || body.waId || '';
    const text = body.text || body.message || body.body || '';
    const status = body.status || body.eventType || body.event || '';

    // Inbound opt-out → suppress WhatsApp for this contact (never message again).
    if (phoneRaw && OPT_OUT_RE.test(String(text))) {
      const phone = aisensy.normalizePhone(phoneRaw) || String(phoneRaw);
      await supabaseAdmin.from('contacts')
        .update({ whatsapp_suppressed: true, whatsapp_opt_in: false, updated_at: new Date().toISOString() })
        .eq('phone', phone);
      return res.json({ ok: true, action: 'opted_out' });
    }

    // Delivery/read status: acknowledged; funnel beyond sent/failed is v2.
    return res.json({ ok: true, action: status ? 'status_ack' : 'ignored' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { handleWebhook, OPT_OUT_RE };

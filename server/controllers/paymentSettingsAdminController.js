/**
 * paymentSettingsAdminController.js — Admin → Settings → Payment → Razorpay.
 *
 * Stores Razorpay credentials in platform_settings (secret + webhook secret
 * encrypted at rest). The GET never returns plaintext secrets — only whether
 * they are set, plus a masked hint. All routes behind requireAdmin.
 */
'use strict';

const Razorpay = require('razorpay');
const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');
const razorpayConfig = require('../services/razorpayConfig');
const { auditLog } = require('../utils/logger');

const { KEYS } = razorpayConfig;

const maskTail = (val) => (val && val.length > 4 ? `••••${val.slice(-4)}` : (val ? '••••' : ''));

const upsertSetting = async (key, value) =>
  supabaseAdmin.from('platform_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

// ── GET /api/admin/settings/payment/razorpay ─────────────────────
// Returns config WITHOUT plaintext secrets (only "is it set" + a masked hint).
const getRazorpay = async (req, res) => {
  try {
    const cfg = await razorpayConfig.getConfig();
    res.json({
      key_id: cfg.keyId || '',
      key_secret_set: !!cfg.keySecret,
      key_secret_hint: maskTail(cfg.keySecret),
      webhook_secret_set: !!cfg.webhookSecret,
      enabled: !!cfg.enabled,
      mode: cfg.mode || 'test',
      // The webhook URL the admin must paste into the Razorpay dashboard.
      webhook_url: `${process.env.API_URL || ''}/api/payment/webhook`,
    });
  } catch (err) {
    safeError(res, err);
  }
};

// ── PUT /api/admin/settings/payment/razorpay ─────────────────────
// Secrets are only updated when a non-empty value is supplied, so re-saving the
// form (which never receives the plaintext secret back) doesn't wipe them.
const updateRazorpay = async (req, res) => {
  try {
    const { key_id, key_secret, webhook_secret, enabled, mode } = req.body;

    if (key_id != null) await upsertSetting(KEYS.keyId, String(key_id).trim());
    if (typeof key_secret === 'string' && key_secret.trim()) {
      await upsertSetting(KEYS.keySecret, razorpayConfig.encryptSecret(key_secret.trim()));
    }
    if (typeof webhook_secret === 'string' && webhook_secret.trim()) {
      await upsertSetting(KEYS.webhookSecret, razorpayConfig.encryptSecret(webhook_secret.trim()));
    }
    if (enabled != null) await upsertSetting(KEYS.enabled, enabled ? 'true' : 'false');
    if (mode != null) await upsertSetting(KEYS.mode, String(mode));

    razorpayConfig.clearCache();
    auditLog('RAZORPAY_SETTINGS_UPDATED', req.admin?.id || null, { key_id_set: key_id != null, enabled });

    return getRazorpay(req, res);
  } catch (err) {
    safeError(res, err);
  }
};

// ── POST /api/admin/settings/payment/razorpay/test ───────────────
// Validates credentials by making a cheap authenticated Razorpay call. Uses the
// submitted key/secret if provided (test-before-save), else the stored ones.
const testRazorpay = async (req, res) => {
  try {
    const { key_id, key_secret } = req.body || {};
    let keyId = key_id, keySecret = key_secret;
    if (!keyId || !keySecret) {
      const cfg = await razorpayConfig.getConfig();
      keyId = keyId || cfg.keyId;
      keySecret = keySecret || cfg.keySecret;
    }
    if (!keyId || !keySecret) {
      return res.status(400).json({ ok: false, message: 'Enter a key id and secret first.' });
    }
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    await client.orders.all({ count: 1 }); // 401 here means bad credentials
    res.json({ ok: true, message: 'Razorpay credentials are valid.' });
  } catch (err) {
    const desc = err?.error?.description || err?.message || 'Razorpay rejected the credentials.';
    res.status(400).json({ ok: false, message: desc });
  }
};

module.exports = { getRazorpay, updateRazorpay, testRazorpay };

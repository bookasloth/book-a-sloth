/**
 * platformConfig.js — reads admin-editable money settings from platform_settings.
 *
 * platform_settings is a key/value table; values may be stored as raw numbers,
 * numeric strings, or JSON-stringified numbers depending on who wrote them, so
 * we coerce defensively. 60s cache; clearCache() after admin edits.
 *
 * Keys:
 *   platform_fee           default ₹10 (flat fee charged to the customer)
 *   platform_fee_gst_rate  default 0.18 (18% GST on the platform fee)
 */

const { supabaseAdmin } = require('../config/supabase');

const DEFAULTS = { platformFee: 10, gstRate: 0.18 };
const CACHE_TTL_MS = 60 * 1000;
let _cache = { at: 0, value: null };

// Coerce a platform_settings value (number | "10" | "\"10\"") into a finite number.
const toNumber = (raw, fallback) => {
  if (raw == null) return fallback;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : fallback;
  let s = String(raw).trim();
  // strip one layer of JSON quoting if present
  if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
};

const getConfig = async () => {
  const now = Date.now();
  if (_cache.value && now - _cache.at < CACHE_TTL_MS) return _cache.value;

  let platformFee = DEFAULTS.platformFee;
  let gstRate = DEFAULTS.gstRate;
  try {
    const { data } = await supabaseAdmin
      .from('platform_settings')
      .select('key, value')
      .in('key', ['platform_fee', 'platform_fee_gst_rate']);
    for (const row of data || []) {
      if (row.key === 'platform_fee') platformFee = toNumber(row.value, DEFAULTS.platformFee);
      if (row.key === 'platform_fee_gst_rate') gstRate = toNumber(row.value, DEFAULTS.gstRate);
    }
  } catch (_) { /* fall back to defaults */ }

  // Guard against nonsensical config
  if (platformFee < 0) platformFee = DEFAULTS.platformFee;
  if (gstRate < 0 || gstRate > 1) gstRate = DEFAULTS.gstRate;

  _cache = { at: now, value: { platformFee, gstRate } };
  return _cache.value;
};

const clearCache = () => { _cache = { at: 0, value: null }; };

module.exports = { getConfig, clearCache, DEFAULTS };

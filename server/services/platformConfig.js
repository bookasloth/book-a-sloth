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

// Coerce a platform_settings value into a finite number. Values may be raw
// numbers, numeric strings, or JSON-stringified MULTIPLE times (a buggy admin
// save re-encoded them, e.g. "\"\\\"0.18\\\"\""). Unwrap every JSON layer
// before parsing so corrupted rows resolve instead of silently falling back.
const toNumber = (raw, fallback) => {
  if (raw == null) return fallback;
  let v = raw;
  for (let i = 0; i < 8 && typeof v === 'string'; i++) {
    const s = v.trim();
    let parsed;
    try { parsed = JSON.parse(s); } catch { break; }
    if (parsed === v) break; // converged (e.g. JSON.parse('0.18') === '0.18' never, but guard anyway)
    v = parsed;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = parseFloat(String(v));
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

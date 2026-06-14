const { supabaseAdmin } = require('../config/supabase');

const CACHE_TTL_MS = 60 * 1000;
let _cache = { at: 0, map: null };

async function loadFlags() {
  const now = Date.now();
  if (_cache.map && now - _cache.at < CACHE_TTL_MS) return _cache.map;
  const map = {};
  try {
    const { data, error } = await supabaseAdmin.from('feature_flags').select('key, enabled');
    if (!error) for (const row of data || []) map[row.key] = !!row.enabled;
  } catch (_) { /* fail-open below */ }
  _cache = { at: now, map };
  return map;
}

// Fail-open: unknown / errored flags default to enabled so a missing
// migration never bricks a feature.
async function isFeatureEnabled(key) {
  const map = await loadFlags();
  return key in map ? map[key] : true;
}

function clearCache() { _cache = { at: 0, map: null }; }

module.exports = { isFeatureEnabled, loadFlags, clearCache };

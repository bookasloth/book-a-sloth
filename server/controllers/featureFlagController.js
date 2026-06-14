const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');
const featureFlags = require('../services/featureFlags');

// Flags safe to expose to unauthenticated clients (UI gating only).
const PUBLIC_KEYS = ['reschedule', 'reschedule_fee'];

// GET /api/admin/features
const getFlags = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('feature_flags').select('*').order('key');
    if (error) return safeError(res, error);
    res.json(data || []);
  } catch (e) { safeError(res, e); }
};

// PATCH /api/admin/features/:key
const toggleFlag = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean')
      return res.status(400).json({ message: 'enabled (boolean) is required' });
    const { data, error } = await supabaseAdmin
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString(), updated_by: req.admin?.id || req.user?.id || null })
      .eq('key', req.params.key)
      .select().single();
    if (error) return safeError(res, error);
    if (!data) return res.status(404).json({ message: 'Flag not found' });
    featureFlags.clearCache();
    res.json(data);
  } catch (e) { safeError(res, e); }
};

// GET /api/feature-flags  (public)
const getPublicFlags = async (req, res) => {
  try {
    const map = await featureFlags.loadFlags();
    const out = {};
    for (const k of PUBLIC_KEYS) out[k] = k in map ? map[k] : true;
    res.json(out);
  } catch (e) { safeError(res, e); }
};

module.exports = { getFlags, toggleFlag, getPublicFlags };

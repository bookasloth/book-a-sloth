/**
 * appearanceController.js — site appearance (navbar logo).
 *
 * One row in appearance_settings (id = 1) is the source of truth for the active
 * navbar logo. Public read feeds the website navbar; admin read/update is gated
 * by the isolated admin RBAC session. Fails OPEN: if the table is missing or a
 * read errors, callers get sensible defaults so the navbar never breaks.
 *
 * The email header logo is NOT managed here — it is a fixed image on
 * email_settings.logo_url, decoupled from these navbar modes.
 */

'use strict';

const { supabaseAdmin } = require('../config/supabase');

const MODES = ['icon_text', 'image', 'festive'];

const DEFAULTS = {
  navbar_logo_mode: 'icon_text',
  icon_url: 'https://company-assets.bookasloth.in/images/email/sloth-icon-sqr.png',
  logo_image_url: '',
  festive_logo_url: '',
};

/** Read the single appearance row, falling back to defaults on any problem. */
async function loadRow() {
  try {
    const { data, error } = await supabaseAdmin
      .from('appearance_settings').select('*').eq('id', 1).maybeSingle();
    if (error || !data) return { ...DEFAULTS };
    return data;
  } catch (_) {
    return { ...DEFAULTS };
  }
}

const publicShape = (row) => ({
  navbar_logo_mode: row.navbar_logo_mode || DEFAULTS.navbar_logo_mode,
  icon_url: row.icon_url || DEFAULTS.icon_url,
  logo_image_url: row.logo_image_url || '',
  festive_logo_url: row.festive_logo_url || '',
});

/** GET /api/appearance — public; navbar reads this (no auth). */
async function getPublic(req, res) {
  const row = await loadRow();
  res.json(publicShape(row));
}

/** GET /api/admin/appearance — admin; full row. */
async function getAdmin(req, res) {
  const row = await loadRow();
  res.json(publicShape(row));
}

/** PUT /api/admin/appearance — admin; update mode + image URLs. */
async function update(req, res) {
  const { navbar_logo_mode, icon_url, logo_image_url, festive_logo_url } = req.body || {};

  if (navbar_logo_mode != null && !MODES.includes(navbar_logo_mode)) {
    return res.status(400).json({ message: `navbar_logo_mode must be one of: ${MODES.join(', ')}` });
  }

  // Only update provided fields; keep the others as-is.
  const patch = { updated_at: new Date().toISOString() };
  if (navbar_logo_mode != null) patch.navbar_logo_mode = navbar_logo_mode;
  if (icon_url != null)         patch.icon_url = String(icon_url);
  if (logo_image_url != null)   patch.logo_image_url = String(logo_image_url);
  if (festive_logo_url != null) patch.festive_logo_url = String(festive_logo_url);

  try {
    const { data, error } = await supabaseAdmin
      .from('appearance_settings')
      .upsert({ id: 1, ...patch }, { onConflict: 'id' })
      .select('*')
      .single();
    if (error) return res.status(500).json({ message: 'Could not save appearance settings.' });
    res.json(publicShape(data));
  } catch (_) {
    res.status(500).json({ message: 'Could not save appearance settings.' });
  }
}

module.exports = { getPublic, getAdmin, update, MODES, DEFAULTS };

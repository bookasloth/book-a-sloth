/**
 * serviceCategoryController.js
 *
 * Profession-scoped service taxonomy (service_categories table, v3.53).
 * Each row is an ACTUAL bookable service belonging to a PRIMARY CATEGORY
 * (a profession, categories.slug) — e.g. photographer → "Wedding Photography".
 *
 * Hosts pick from the active list for their own primary_category; the chosen
 * slug is stored on services.category. Admin manages the lists. All writes go
 * through supabaseAdmin (service_role); RLS revokes anon/authenticated.
 */

const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');

// ── slug helper (mirrors scripts/seedServiceCategories.js) ───────────────────
const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

// Build a slug unique WITHIN a profession (primary_category, slug) is the key.
const uniqueSlug = async (base, primary, ignoreId = null) => {
  let candidate = base || 'service';
  let suffix = 2;
  while (suffix <= 1001) {
    let q = supabaseAdmin
      .from('service_categories')
      .select('id')
      .eq('primary_category', primary)
      .eq('slug', candidate);
    if (ignoreId) q = q.neq('id', ignoreId);
    const { data } = await q.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  throw new Error(`Could not generate a unique slug for "${base}"`);
};

// ── Admin: list ALL categories (optionally one profession) with serviceCount ──
// GET /api/admin/service-categories?primary=<slug>
const listAdmin = async (req, res) => {
  try {
    let q = supabaseAdmin
      .from('service_categories')
      .select('*')
      .order('primary_category', { ascending: true })
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (req.query.primary) q = q.eq('primary_category', req.query.primary);

    const { data: categories, error } = await q;
    if (error) throw error;
    if (!categories || categories.length === 0) return res.json({ categories: [] });

    // serviceCount: services.category stores the slug. Count by slug.
    const { data: svcRows } = await supabaseAdmin
      .from('services')
      .select('category')
      .not('category', 'is', null);
    const countMap = {};
    for (const row of svcRows || []) {
      countMap[row.category] = (countMap[row.category] || 0) + 1;
    }

    res.json({
      categories: categories.map((c) => ({ ...c, serviceCount: countMap[c.slug] || 0 })),
    });
  } catch (error) {
    safeError(res, error);
  }
};

// ── Public: active categories for ONE profession (host picker) ───────────────
// GET /api/service-categories?primary=<slug>
const listPublic = async (req, res) => {
  try {
    const primary = req.query.primary;
    if (!primary) return res.json({ categories: [] });

    const { data, error } = await supabaseAdmin
      .from('service_categories')
      .select('id, name, slug, primary_category')
      .eq('primary_category', primary)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    res.json({ categories: data || [] });
  } catch (error) {
    safeError(res, error);
  }
};

// ── Admin: create ────────────────────────────────────────────────────────────
// POST /api/admin/service-categories  body: { primary_category, name, display_order?, is_active? }
const create = async (req, res) => {
  try {
    const primary = (req.body.primary_category || '').trim();
    const name = (req.body.name || '').trim();
    if (!primary) return res.status(400).json({ message: 'primary_category is required' });
    if (!name)    return res.status(400).json({ message: 'name is required' });

    const slug = await uniqueSlug(slugify(name), primary);

    let displayOrder = req.body.display_order;
    if (displayOrder === undefined || displayOrder === null) {
      const { data: maxRow } = await supabaseAdmin
        .from('service_categories')
        .select('display_order')
        .eq('primary_category', primary)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      displayOrder = maxRow ? (maxRow.display_order + 1) : 0;
    }

    const { data, error } = await supabaseAdmin
      .from('service_categories')
      .insert({
        primary_category: primary,
        name,
        slug,
        display_order: displayOrder,
        is_active: req.body.is_active !== undefined ? Boolean(req.body.is_active) : true,
      })
      .select()
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// ── Admin: update (patch provided fields) ────────────────────────────────────
// PUT /api/admin/service-categories/:id
const update = async (req, res) => {
  try {
    const updates = { updated_at: new Date().toISOString() };
    if (req.body.name !== undefined)          updates.name          = String(req.body.name).trim();
    if (req.body.display_order !== undefined) updates.display_order = req.body.display_order;
    if (req.body.is_active !== undefined)     updates.is_active     = Boolean(req.body.is_active);

    // Renaming can re-derive the slug only when explicitly requested, scoped to
    // the row's own profession to keep (primary_category, slug) unique.
    if (req.body.slug !== undefined) {
      const { data: row } = await supabaseAdmin
        .from('service_categories').select('primary_category').eq('id', req.params.id).maybeSingle();
      if (!row) return res.status(404).json({ message: 'Service category not found' });
      updates.slug = await uniqueSlug(slugify(req.body.slug), row.primary_category, req.params.id);
    }

    const { data, error } = await supabaseAdmin
      .from('service_categories')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'Service category not found' });

    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// ── Admin: delete (blocked if in use) ────────────────────────────────────────
// DELETE /api/admin/service-categories/:id
const remove = async (req, res) => {
  try {
    const { data: row } = await supabaseAdmin
      .from('service_categories').select('slug').eq('id', req.params.id).maybeSingle();
    if (!row) return res.status(404).json({ message: 'Service category not found' });

    const { count } = await supabaseAdmin
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('category', row.slug);
    if ((count || 0) > 0) {
      return res.status(409).json({
        message: `Category is in use by ${count} service${count === 1 ? '' : 's'}`,
      });
    }

    const { error } = await supabaseAdmin
      .from('service_categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    safeError(res, error);
  }
};

// ── Admin: bulk reorder ───────────────────────────────────────────────────────
// PUT /api/admin/service-categories/reorder  body: { rows: [{ id, display_order }] }
const reorder = async (req, res) => {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    await Promise.all(
      rows.map(({ id, display_order }) =>
        supabaseAdmin
          .from('service_categories')
          .update({ display_order, updated_at: new Date().toISOString() })
          .eq('id', id)
      )
    );
    res.json({ ok: true });
  } catch (error) {
    safeError(res, error);
  }
};

module.exports = { listAdmin, listPublic, create, update, remove, reorder };

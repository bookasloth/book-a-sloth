/**
 * serviceCategoryController.js
 *
 * Admin-managed marketplace taxonomy for services (service_categories table).
 * Separate from `categories` (host industry/profession) and from
 * the per-service `services.category` slug field.
 *
 * All DB writes go through supabaseAdmin (service_role); RLS on the table
 * is locked down — anon/authenticated have no grants. This matches the
 * established secure pattern used across the codebase (v3.7/v3.10 etc.).
 */

const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');

// ── slug helper (mirrors categoryController.js pattern) ──────────────────────
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // strip non-word, non-space, non-dash
    .replace(/[\s_]+/g, '-')    // spaces/underscores → dash
    .replace(/--+/g, '-')       // collapse repeated dashes
    .replace(/^-+|-+$/g, '')    // strip leading/trailing dashes
    .slice(0, 80);

/**
 * Build a unique slug derived from `base`, avoiding collisions against the DB.
 * Tries base, base-2, base-3, … until one is free.
 * Throws if more than 1000 attempts are needed to prevent infinite loops.
 */
const uniqueSlug = async (base) => {
  let candidate = base;
  let suffix = 2;
  while (suffix <= 1001) {
    const { data } = await supabaseAdmin
      .from('service_categories')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
    if (suffix > 1000) throw new Error(`Could not generate a unique slug for "${base}" after 1000 attempts`);
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
};

// ── Admin: list ALL categories with serviceCount ──────────────────────────────
// GET /api/admin/service-categories
const listAdmin = async (req, res) => {
  try {
    // 1. Fetch all categories
    const { data: categories, error: catErr } = await supabaseAdmin
      .from('service_categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (catErr) throw catErr;

    if (!categories || categories.length === 0) {
      return res.json({ categories: [] });
    }

    // 2. Fetch service counts grouped by service_category_id
    //    We query the services table and group; Supabase PostgREST supports
    //    select with count via a relation, but the simplest correct approach
    //    is to fetch all non-null service_category_id values and count in JS.
    const { data: svcRows, error: svcErr } = await supabaseAdmin
      .from('services')
      .select('service_category_id')
      .not('service_category_id', 'is', null);
    if (svcErr) throw svcErr;

    const countMap = {};
    for (const row of svcRows || []) {
      const cid = row.service_category_id;
      countMap[cid] = (countMap[cid] || 0) + 1;
    }

    const result = categories.map((cat) => ({
      ...cat,
      serviceCount: countMap[cat.id] || 0,
    }));

    res.json({ categories: result });
  } catch (error) {
    safeError(res, error);
  }
};

// ── Public: list active categories (picker use) ───────────────────────────────
// GET /api/service-categories
const listPublic = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('service_categories')
      .select('id, name, slug, icon_url, parent_id, description')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    res.json({ categories: data || [] });
  } catch (error) {
    safeError(res, error);
  }
};

// ── Admin: create a category ──────────────────────────────────────────────────
// POST /api/admin/service-categories
const create = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const baseSlug = slugify(name);
    const slug = await uniqueSlug(baseSlug);

    // Default display_order to (max + 1) when not provided
    let displayOrder = req.body.display_order;
    if (displayOrder === undefined || displayOrder === null) {
      const { data: maxRow } = await supabaseAdmin
        .from('service_categories')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      displayOrder = maxRow ? (maxRow.display_order + 1) : 0;
    }

    const isActive = req.body.is_active !== undefined ? Boolean(req.body.is_active) : true;

    const payload = {
      name,
      slug,
      description:     req.body.description     ?? null,
      icon_url:        req.body.icon_url         ?? null,
      parent_id:       req.body.parent_id        ?? null,
      display_order:   displayOrder,
      is_active:       isActive,
      seo_title:       req.body.seo_title        ?? null,
      seo_description: req.body.seo_description  ?? null,
      seo_keywords:    req.body.seo_keywords     ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from('service_categories')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// ── Admin: update a category (patch provided fields only) ────────────────────
// PUT /api/admin/service-categories/:id
const update = async (req, res) => {
  try {
    if (req.body.parent_id && req.body.parent_id === req.params.id)
      return res.status(400).json({ message: "A category can't be its own parent" });

    const updates = { updated_at: new Date().toISOString() };

    // Patch only the fields the caller supplies.
    if (req.body.name !== undefined)            updates.name            = String(req.body.name).trim();
    if (req.body.description !== undefined)     updates.description     = req.body.description     ?? null;
    if (req.body.icon_url !== undefined)        updates.icon_url        = req.body.icon_url        ?? null;
    if (req.body.parent_id !== undefined)       updates.parent_id       = req.body.parent_id       ?? null;
    if (req.body.display_order !== undefined)   updates.display_order   = req.body.display_order;
    if (req.body.is_active !== undefined)       updates.is_active       = Boolean(req.body.is_active);
    if (req.body.seo_title !== undefined)       updates.seo_title       = req.body.seo_title       ?? null;
    if (req.body.seo_description !== undefined) updates.seo_description = req.body.seo_description ?? null;
    if (req.body.seo_keywords !== undefined)    updates.seo_keywords    = req.body.seo_keywords    ?? null;
    // slug: only update when explicitly provided (avoids breaking existing links)
    if (req.body.slug !== undefined)            updates.slug            = slugify(String(req.body.slug));

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

// ── Admin: delete a category (blocked if in use) ──────────────────────────────
// DELETE /api/admin/service-categories/:id
const remove = async (req, res) => {
  try {
    // Count services referencing this category
    const { count, error: countErr } = await supabaseAdmin
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('service_category_id', req.params.id);
    if (countErr) throw countErr;

    if ((count || 0) > 0) {
      return res.status(409).json({
        message: `Category is in use by ${count} service${count === 1 ? '' : 's'}`,
      });
    }

    const { error } = await supabaseAdmin
      .from('service_categories')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;

    res.json({ ok: true });
  } catch (error) {
    safeError(res, error);
  }
};

// ── Admin: bulk reorder ───────────────────────────────────────────────────────
// PUT /api/admin/service-categories/reorder
// body: { rows: [{ id, display_order }] }
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

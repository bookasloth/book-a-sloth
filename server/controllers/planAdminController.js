/**
 * planAdminController.js — Super Admin subscription plan management.
 * Spec v1.1 rules enforced here:
 *   - min_active_plans: 2, max_active_plans: 3
 *   - create / edit / archive / clone / reorder all DB-driven, no deploys
 * All routes behind requireSuperAdmin.
 */
const { supabaseAdmin } = require('../config/supabase');
const planService = require('../services/planService');

const RULES = { min_active_plans: 2, max_active_plans: 3 };

const slugify = (text) =>
  String(text).toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/--+/g, '-').slice(0, 50);

const countActive = async (excludeId = null) => {
  let q = supabaseAdmin.from('subscription_plans').select('id', { count: 'exact', head: true }).eq('active', true);
  if (excludeId) q = q.neq('id', excludeId);
  const { count } = await q;
  return count || 0;
};

// ── GET /api/admin/plans ─────────────────────────────────────────
const listPlans = async (req, res) => {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans').select('*').order('sort_order');
    if (error) return res.status(500).json({ message: error.message });

    // Subscriber counts per plan slug (legacy 'explorer' counts toward starter)
    const { data: profiles } = await supabaseAdmin
      .from('profiles').select('plan').eq('role', 'host');
    const counts = {};
    for (const p of profiles || []) {
      const slug = planService.normalizeSlug(p.plan);
      counts[slug] = (counts[slug] || 0) + 1;
    }
    res.json({
      rules: RULES,
      plans: (plans || []).map((p) => ({ ...p, subscriber_count: counts[p.slug] || 0 })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/admin/plans ────────────────────────────────────────
const createPlan = async (req, res) => {
  try {
    const { name, annual_price, billing_cycle, commission_percentage, limits, features, integrations, support_type, active } = req.body;
    if (!name) return res.status(400).json({ message: 'Plan name is required' });

    if (active !== false) {
      const activeCount = await countActive();
      if (activeCount >= RULES.max_active_plans)
        return res.status(400).json({ message: `Maximum ${RULES.max_active_plans} active plans allowed. Archive a plan first or create this one as inactive.` });
    }

    const { data: maxSort } = await supabaseAdmin
      .from('subscription_plans').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .insert({
        name: name.trim(),
        slug: slugify(name),
        annual_price: Number(annual_price) || 0,
        billing_cycle: billing_cycle || 'yearly',
        commission_percentage: Number(commission_percentage) || 0,
        limits: limits || {},
        features: features || {},
        integrations: integrations || {},
        support_type: support_type || 'standard',
        active: active !== false,
        sort_order: (maxSort?.sort_order || 0) + 1,
      })
      .select().single();
    if (error) {
      if (/duplicate key/i.test(error.message)) return res.status(409).json({ message: 'A plan with this name/slug already exists' });
      return res.status(500).json({ message: error.message });
    }
    planService.clearCache();
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/admin/plans/:id ─────────────────────────────────────
const updatePlan = async (req, res) => {
  try {
    const allowed = ['name', 'annual_price', 'billing_cycle', 'commission_percentage', 'limits', 'features', 'integrations', 'support_type'];
    const updates = { updated_at: new Date().toISOString() };
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
    if (updates.name) updates.slug = req.body.keep_slug ? undefined : undefined; // slug is stable after creation — code references it

    const { data, error } = await supabaseAdmin
      .from('subscription_plans').update(updates).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Plan not found' });
    planService.clearCache();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/admin/plans/:id/archive  (and /restore) ───────────
const setPlanActive = async (req, res) => {
  try {
    const makeActive = req.path.endsWith('/restore');
    if (!makeActive) {
      const activeCount = await countActive(req.params.id);
      if (activeCount < RULES.min_active_plans)
        return res.status(400).json({ message: `At least ${RULES.min_active_plans} plans must remain active. Restore or create another plan first.` });
    } else {
      const activeCount = await countActive(req.params.id);
      if (activeCount >= RULES.max_active_plans)
        return res.status(400).json({ message: `Maximum ${RULES.max_active_plans} active plans allowed.` });
    }

    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .update({ active: makeActive, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Plan not found' });
    planService.clearCache();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/admin/plans/:id/clone ──────────────────────────────
const clonePlan = async (req, res) => {
  try {
    const { data: src } = await supabaseAdmin
      .from('subscription_plans').select('*').eq('id', req.params.id).single();
    if (!src) return res.status(404).json({ message: 'Plan not found' });

    let name = `${src.name} (Copy)`, slug = slugify(name), i = 2;
    while (true) {
      const { data: clash } = await supabaseAdmin.from('subscription_plans').select('id').eq('slug', slug).maybeSingle();
      if (!clash) break;
      name = `${src.name} (Copy ${i})`; slug = slugify(name); i++;
    }

    const { data: maxSort } = await supabaseAdmin
      .from('subscription_plans').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();

    // Clones start inactive so they never violate max_active_plans
    const { data, error } = await supabaseAdmin
      .from('subscription_plans')
      .insert({
        name, slug,
        annual_price: src.annual_price, billing_cycle: src.billing_cycle,
        commission_percentage: src.commission_percentage,
        limits: src.limits, features: src.features, integrations: src.integrations,
        support_type: src.support_type, active: false,
        sort_order: (maxSort?.sort_order || 0) + 1,
      })
      .select().single();
    if (error) return res.status(500).json({ message: error.message });
    planService.clearCache();
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/admin/plans/reorder  { order: [planId, ...] } ─────
const reorderPlans = async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || !order.length)
      return res.status(400).json({ message: 'order must be a non-empty array of plan ids' });
    for (let i = 0; i < order.length; i++) {
      await supabaseAdmin.from('subscription_plans')
        .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
        .eq('id', order[i]);
    }
    planService.clearCache();
    res.json({ message: 'Plans reordered' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/admin/plans/assign  { vendor_id, plan_slug, expires_at? } ──
// Manual admin assignment / upgrade / downgrade (comp plans, support fixes)
const assignPlan = async (req, res) => {
  try {
    const { vendor_id, plan_slug, expires_at } = req.body;
    if (!vendor_id || !plan_slug) return res.status(400).json({ message: 'vendor_id and plan_slug are required' });

    const plan = await planService.getPlan(plan_slug);
    if (!plan || plan.slug !== planService.normalizeSlug(plan_slug))
      return res.status(404).json({ message: 'Plan not found' });

    const isFree = Number(plan.annual_price) === 0;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        plan: plan.slug,
        plan_expires_at: isFree ? null : (expires_at || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()),
        plan_updated_at: new Date().toISOString(),
        plan_activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendor_id)
      .select('id, name, email, plan, plan_expires_at').single();
    if (error || !data) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ message: `Vendor moved to ${plan.name}`, vendor: data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/plans (public pricing page) ─────────────────────────
const publicPlans = async (req, res) => {
  try {
    const plans = await planService.loadPlans();
    res.json([...plans.values()].filter((p) => p.active !== false)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(({ id, name, slug, annual_price, billing_cycle, commission_percentage, limits, features, integrations, support_type }) =>
        ({ id, name, slug, annual_price, billing_cycle, commission_percentage, limits, features, integrations, support_type })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { listPlans, createPlan, updatePlan, setPlanActive, clonePlan, reorderPlans, assignPlan, publicPlans, RULES };

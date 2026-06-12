// Plan enforcement middleware — fully database-driven (spec v1.1).
// Limits come from subscription_plans via planService; nothing hardcoded here.
// -1 = unlimited. Every block response includes an upgrade prompt.
const { supabaseAdmin } = require('../config/supabase');
const planService = require('../services/planService');

// Attach vendorPlan (slug) + vendorPlanData (full row) to req — call before limit checks
const attachPlan = async (req, res, next) => {
  try {
    if (!req.user?.id) return next();
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('plan, plan_expires_at').eq('id', req.user.id).single();

    req.vendorPlan = planService.resolveVendorPlan(profile);
    req.vendorPlanData = await planService.getPlan(req.vendorPlan);
    next();
  } catch { req.vendorPlan = 'starter'; next(); }
};

const blockResponse = (res, { message, plan, limit }) =>
  res.status(403).json({ message, upgrade_required: true, current_plan: plan, limit });

// Block service creation beyond the plan's service limit
const checkServiceLimit = async (req, res, next) => {
  try {
    const plan = req.vendorPlan || 'starter';
    const planData = req.vendorPlanData || await planService.getPlan(plan);
    const limit = planData.limits?.services ?? 0;
    if (limit === -1) return next();

    const { count } = await supabaseAdmin
      .from('services').select('id', { count: 'exact', head: true })
      .eq('host_id', req.user.id).eq('is_active', true);

    if ((count || 0) >= limit) {
      return blockResponse(res, {
        message: `You've reached your ${limit}-service limit on the ${planData.name} plan. Upgrade for more services.`,
        plan, limit,
      });
    }
    next();
  } catch { next(); }
};

// Block product creation beyond the plan's digital_products limit
const checkProductLimit = async (req, res, next) => {
  try {
    const plan = req.vendorPlan || 'starter';
    const planData = req.vendorPlanData || await planService.getPlan(plan);
    const limit = planData.limits?.digital_products ?? 0;

    if (limit === 0) {
      return blockResponse(res, {
        message: 'Digital products are not included in your plan. Upgrade to sell products.',
        plan, limit,
      });
    }
    if (limit === -1) return next();

    const { count } = await supabaseAdmin
      .from('products').select('id', { count: 'exact', head: true })
      .eq('host_id', req.user.id).eq('is_active', true);

    if ((count || 0) >= limit) {
      return blockResponse(res, {
        message: `You've used all ${limit} digital product slots on the ${planData.name} plan. Upgrade for more.`,
        plan, limit,
      });
    }
    next();
  } catch { next(); }
};

// Yearly booking-receive limit (spec v1.1: bookings_per_year, all plans capped)
const checkBookingReceiveLimit = async (hostId) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('plan, plan_expires_at, plan_activated_at, created_at').eq('id', hostId).single();

    const plan = planService.resolveVendorPlan(profile);
    const planData = await planService.getPlan(plan);
    const limit = planData.limits?.bookings_per_year ?? 0;
    if (limit === -1) return { allowed: true };

    // Subscription year starts at plan activation (or account creation for free tier)
    const anchor = new Date(profile?.plan_activated_at || profile?.created_at || Date.now());
    const yearStart = new Date(anchor);
    yearStart.setFullYear(yearStart.getFullYear() + Math.floor((Date.now() - anchor.getTime()) / (365 * 24 * 3600 * 1000)));

    const { count } = await supabaseAdmin
      .from('bookings').select('id', { count: 'exact', head: true })
      .eq('host_id', hostId).neq('status', 'cancelled')
      .gte('created_at', yearStart.toISOString());

    if ((count || 0) >= limit) {
      return {
        allowed: false,
        message: `This creator has reached their booking limit for this subscription year (${planData.name} plan: ${limit}/year). Bookings resume when the plan renews or upgrades.`,
      };
    }
    return { allowed: true };
  } catch { return { allowed: true }; }
};

module.exports = { attachPlan, checkServiceLimit, checkProductLimit, checkBookingReceiveLimit };

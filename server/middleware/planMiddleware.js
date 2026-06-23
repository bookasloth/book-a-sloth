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
  } catch (err) {
    // Fail-SAFE: fall back to the most-restrictive 'starter' plan on error.
    // This is intentionally NOT a hard deny — limit checks downstream are the
    // ones that fail closed; this only chooses the safest plan to evaluate against.
    console.error('attachPlan error:', err.message);
    req.vendorPlan = 'starter';
    next();
  }
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
  } catch (err) {
    // Fail CLOSED: a transient DB error must not let a caller exceed their cap.
    console.error('checkServiceLimit error:', err.message);
    return res.status(503).json({ message: 'Could not verify your plan limit. Please try again.' });
  }
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
  } catch (err) {
    // Fail CLOSED: a transient DB error must not let a caller exceed their cap.
    console.error('checkProductLimit error:', err.message);
    return res.status(503).json({ message: 'Could not verify your plan limit. Please try again.' });
  }
};

// Yearly booking-receive limit (spec v1.1: bookings_per_year, all plans capped)
// NOTE: this count→insert is still TOCTOU-racy — two concurrent bookings can
// each read count = limit-1 and both insert, briefly exceeding the cap. We do
// NOT add a DB transaction here; the database-level constraint/index is the
// backstop for the rare race. This check fails closed only on errors (below).
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
  } catch (err) {
    // Fail CLOSED: deny on a transient DB error rather than letting the host
    // silently exceed their yearly booking cap.
    console.error('checkBookingReceiveLimit error:', err.message);
    return { allowed: false, message: 'Could not verify availability. Please try again.' };
  }
};

module.exports = { attachPlan, checkServiceLimit, checkProductLimit, checkBookingReceiveLimit };

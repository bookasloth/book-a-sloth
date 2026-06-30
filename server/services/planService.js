/**
 * planService.js — database-driven subscription plan reads.
 *
 * Single source of truth for plan limits, features, commission and pricing.
 * No plan logic in code (spec v1.1 rule: database_driven, hardcoded_plans=false).
 *
 * - 60s in-process cache (clearCache() after admin edits)
 * - Legacy alias: profiles still carrying plan='explorer' resolve to 'starter'
 * - Fallback defaults if the v2.1 migration hasn't been applied, so production
 *   never breaks (schema fallback pattern from docs/ai-context.md)
 */

const { supabaseAdmin } = require('../config/supabase');

const LEGACY_ALIASES = { explorer: 'starter' };

// Fallback only used when subscription_plans table is missing. Kept in lockstep
// with migration v3.55 (the published pricing matrix) so a missing table never
// advertises numbers the live DB wouldn't enforce.
const FALLBACK_PLANS = {
  starter:      { name: 'Starter', slug: 'starter', annual_price: 0, monthly_price: 0, commission_percentage: 5, active: true,
    razorpay_plan_id_monthly: null, razorpay_plan_id_annual: null,
    limits: { services: 3, free_services: 2, bookings_per_year: 300, digital_products: 1, calendar_integrations: 1, profile_theme_colors: 3, reminder_flows: 0, followup_flows: 0, categories: 1 },
    features: {}, integrations: { calendar_apps: ['google_calendar'] }, support_type: 'standard', sort_order: 1 },
  creator:      { name: 'Creator', slug: 'creator', annual_price: 999, monthly_price: 199, commission_percentage: 0, active: true,
    razorpay_plan_id_monthly: null, razorpay_plan_id_annual: null,
    limits: { services: 5, free_services: -1, bookings_per_year: 1000, digital_products: 5, calendar_integrations: 1, profile_theme_colors: 16, reminder_flows: 1, followup_flows: 1, categories: 2 },
    features: {}, integrations: { calendar_apps: ['google_calendar'] }, support_type: 'priority_email', sort_order: 2 },
  professional: { name: 'Professional', slug: 'professional', annual_price: 3650, monthly_price: 499, commission_percentage: 0, active: true,
    razorpay_plan_id_monthly: null, razorpay_plan_id_annual: null,
    limits: { services: -1, free_services: -1, bookings_per_year: -1, digital_products: -1, calendar_integrations: 2, profile_theme_colors: -1, reminder_flows: -1, followup_flows: 2, categories: -1 },
    features: {}, integrations: { calendar_apps: ['google_calendar', 'ical'] }, support_type: 'priority', sort_order: 3 },
};

const CACHE_TTL_MS = 60 * 1000;
let _cache = { at: 0, plans: null };

const _isMissingSchema = (error) =>
  error && /Could not find the|does not exist|relation .* does not exist/i.test(error.message || '');

const normalizeSlug = (slug) => {
  const s = (slug || 'starter').toLowerCase().trim();
  return LEGACY_ALIASES[s] || s;
};

/** All plans (active + archived), as a Map keyed by slug. */
const loadPlans = async () => {
  const now = Date.now();
  if (_cache.plans && now - _cache.at < CACHE_TTL_MS) return _cache.plans;

  const { data, error } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .order('sort_order');

  let plans;
  if (error || !data || data.length === 0) {
    if (error && !_isMissingSchema(error)) console.error('planService read error:', error.message);
    plans = new Map(Object.entries(FALLBACK_PLANS));
  } else {
    plans = new Map(data.map((p) => [p.slug, p]));
  }
  _cache = { at: now, plans };
  return plans;
};

const clearCache = () => { _cache = { at: 0, plans: null }; };

/** Plan by slug (legacy-alias aware). Unknown slug → starter (free tier). */
const getPlan = async (slug) => {
  const plans = await loadPlans();
  return plans.get(normalizeSlug(slug)) || plans.get('starter') || FALLBACK_PLANS.starter;
};

/** Numeric limit for a plan. -1 = unlimited. Missing key = 0 (most restrictive). */
const getLimit = async (slug, key) => {
  const plan = await getPlan(slug);
  const v = plan.limits?.[key];
  return typeof v === 'number' ? v : 0;
};

// Booking-reminder lead-times, in flow-priority order: flow 1 = 24h, flow 2 = 1h.
// A plan's `reminder_flows` limit (DB-driven, admin-editable) decides how many of
// these a host's bookings get: 0 = none, 1 = 24h only, 2 = 24h + 1h, -1 = all.
const REMINDER_WINDOWS = [24, 1];

/** Reminder windows (hours-before-start) a plan is entitled to. Derived from the
 *  DB-driven `reminder_flows` limit so admins tune gating without code changes. */
const reminderWindowsForPlan = async (slug) => {
  const n = await getLimit(slug, 'reminder_flows');
  if (n < 0) return [...REMINDER_WINDOWS];          // unlimited (e.g. supreme)
  return REMINDER_WINDOWS.slice(0, n);
};

/** Whether a plan receives BOOKING_RESCHEDULED notifications — a perk of the top
 *  reminder tier (a plan entitled to every reminder window). */
const rescheduleNotifyForPlan = async (slug) => {
  const n = await getLimit(slug, 'reminder_flows');
  return n < 0 || n >= REMINDER_WINDOWS.length;
};

/** Resolve a vendor's effective plan slug — expired paid plan falls back to free tier. */
const resolveVendorPlan = (profile) => {
  const raw = normalizeSlug(profile?.plan);
  const expired = profile?.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
  return expired ? 'starter' : raw;
};

module.exports = { loadPlans, getPlan, getLimit, reminderWindowsForPlan, rescheduleNotifyForPlan, resolveVendorPlan, normalizeSlug, clearCache, FALLBACK_PLANS, REMINDER_WINDOWS };

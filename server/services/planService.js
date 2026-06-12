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

// Fallback only used when subscription_plans table is missing.
const FALLBACK_PLANS = {
  starter:      { name: 'Starter', slug: 'starter', annual_price: 0, commission_percentage: 5, active: true,
    limits: { services: 10, bookings_per_year: 1000, digital_products: 3, calendar_integrations: 1, profile_theme_colors: 3, reminder_flows: 0, followup_flows: 0 },
    features: {}, integrations: { calendar_apps: ['google_calendar'] }, support_type: 'standard', sort_order: 1 },
  creator:      { name: 'Creator', slug: 'creator', annual_price: 999, commission_percentage: 5, active: true,
    limits: { services: 20, bookings_per_year: 2000, digital_products: 10, calendar_integrations: 2, profile_theme_colors: 16, reminder_flows: 1, followup_flows: 1 },
    features: {}, integrations: { calendar_apps: ['google_calendar', 'zoom'] }, support_type: 'priority_email', sort_order: 2 },
  professional: { name: 'Professional', slug: 'professional', annual_price: 3650, commission_percentage: 5, active: true,
    limits: { services: 30, bookings_per_year: 3000, digital_products: 20, calendar_integrations: 3, profile_theme_colors: -1, reminder_flows: 2, followup_flows: 2 },
    features: {}, integrations: { calendar_apps: ['google_calendar', 'zoom', 'ical'] }, support_type: 'priority', sort_order: 3 },
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

/** Resolve a vendor's effective plan slug — expired paid plan falls back to free tier. */
const resolveVendorPlan = (profile) => {
  const raw = normalizeSlug(profile?.plan);
  const expired = profile?.plan_expires_at && new Date(profile.plan_expires_at) < new Date();
  return expired ? 'starter' : raw;
};

module.exports = { loadPlans, getPlan, getLimit, resolveVendorPlan, normalizeSlug, clearCache, FALLBACK_PLANS };

const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');
const { audit } = require('../services/auditService');
const { sanitizeLikeTerm, isUuid } = require('../utils/searchSanitize');
const { bustSitemapCache } = require('../utils/sitemapCache');
const { validateCategorySelection } = require('../lib/categoryRules');

// Admin-managed SEO fields (v3.19) — shared whitelist for service + profile SEO.
// Builds a sanitised update payload from the request body; only provided keys
// are touched. is_indexable is coerced to a real boolean.
const buildSeoUpdate = (body, actor) => {
  const u = { seo_updated_at: new Date().toISOString(), seo_updated_by: actor || null };
  ['seo_title', 'seo_description', 'og_title', 'og_description', 'seo_image'].forEach((k) => {
    if (body[k] !== undefined) u[k] = body[k] === null ? null : String(body[k]);
  });
  if (body.is_indexable !== undefined) u.is_indexable = !!body.is_indexable;
  return u;
};

const SEO_MIGRATION_HINT =
  'SEO columns are not present yet. Run migration v3.19_service_seo.sql in Supabase, then retry.';

// Coerce + clamp pagination so a client can't request an unbounded page size.
const clampPage = (p) => Math.max(1, parseInt(p, 10) || 1);
const clampLimit = (l, max = 100) => Math.min(max, Math.max(1, parseInt(l, 10) || 20));

// ══════════════════════════════════════
// PLATFORM STATS
// ══════════════════════════════════════

const getStats = async (req, res) => {
  try {
    // M0 fix: the snapshot columns must be SELECTed to be summable. The old code
    // summed b.platform_fee_amount from a query that only selected services(price),
    // so platform revenue always read ₹0. Platform revenue = platform fee + commission
    // collected on paid bookings (GST is a pass-through liability, not revenue).
    let bookingsRes = await supabaseAdmin
      .from('bookings')
      .select('id, payment_status, platform_fee_amount, commission_applied', { count: 'exact' });

    if (bookingsRes.error && /Could not find the|column.*does not exist/i.test(bookingsRes.error.message)) {
      // Pre-v1.7 DB without commission_applied — fall back to the fee column only.
      bookingsRes = await supabaseAdmin
        .from('bookings')
        .select('id, payment_status, platform_fee_amount', { count: 'exact' });
    }

    const [usersRes, vendorsRes, servicesRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'guest'),
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'host'),
      supabaseAdmin.from('services').select('id', { count: 'exact', head: true }),
    ]);

    const allBookings = bookingsRes.data || [];
    const paid = allBookings.filter(b => b.payment_status === 'paid');
    const revenue = paid.reduce(
      (s, b) => s + (Number(b.platform_fee_amount) || 0) + (Number(b.commission_applied) || 0),
      0
    );

    res.json({
      users: usersRes.count || 0,
      vendors: vendorsRes.count || 0,
      bookings: bookingsRes.count || 0,
      services: servicesRes.count || 0,
      revenue,
      confirmed: paid.length,
      cancelled: allBookings.filter(b => b.payment_status === 'refunded').length,
    });
  } catch (error) {
    safeError(res, error);
  }
};

// ══════════════════════════════════════
// USERS
// ══════════════════════════════════════

const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit);
    let query = supabaseAdmin
      .from('profiles')
      .select('id, name, email, role, username, is_verified, is_banned, google_calendar_connected, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (role && role !== 'all') query = query.eq('role', role);
    // Sanitize the term so commas/parens/wildcards can't break out of the or().
    const search = sanitizeLikeTerm(req.query.search);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`);

    const { data, count, error } = await query;
    if (error) return safeError(res, error);

    res.json({ users: data, total: count, page, limit });
  } catch (error) {
    safeError(res, error);
  }
};

const getUserById = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) return res.status(404).json({ message: 'User not found' });

    // Strip sensitive tokens
    delete user.google_access_token;
    delete user.google_refresh_token;
    delete user.otp_code;
    delete user.otp_expires_at;

    // Get their bookings and services count
    const [bookingsRes, servicesRes] = await Promise.all([
      supabaseAdmin.from('bookings').select('id', { count: 'exact', head: true })
        .or(`host_id.eq.${req.params.id},guest_id.eq.${req.params.id}`),
      supabaseAdmin.from('services').select('id', { count: 'exact', head: true }).eq('host_id', req.params.id),
    ]);

    res.json({ user, bookings: bookingsRes.count || 0, services: servicesRes.count || 0 });
  } catch (error) {
    safeError(res, error);
  }
};

// Roles an admin may assign to a profile. Anything else (e.g. a privileged
// internal role) is rejected so a crafted body can't escalate a profile.
const ASSIGNABLE_USER_ROLES = ['guest', 'host'];

const updateUser = async (req, res) => {
  try {
    const { role, is_verified, is_banned, admin_notes, name, email } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (role !== undefined) {
      if (!ASSIGNABLE_USER_ROLES.includes(role))
        return res.status(400).json({ message: `Invalid role: ${role}` });
      updates.role = role;
    }
    if (is_verified !== undefined) updates.is_verified = is_verified;
    if (is_banned !== undefined) updates.is_banned = is_banned;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    // Verifying/unverifying/banning a host changes who appears in the sitemap.
    const visibilityChanged = is_verified !== undefined || is_banned !== undefined;
    if (name !== undefined) updates.name = name;
    if (email !== undefined) {
      updates.email = email;
      // BUG-07 fixed: sync email to Supabase Auth so the user can still log in
      await supabaseAdmin.auth.admin.updateUserById(req.params.id, { email });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return safeError(res, error);
    if (visibilityChanged) bustSitemapCache();
    await audit(req, { action: 'user.update', resource_type: 'profile', resource_id: req.params.id,
      after: { role: updates.role, is_verified: updates.is_verified, is_banned: updates.is_banned,
        name: updates.name, email: updates.email } });
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

const deleteUser = async (req, res) => {
  try {
    // Delete profile row (cascade deletes related data via FK)
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', req.params.id);
    if (error) return safeError(res, error);
    await audit(req, { action: 'user.delete', resource_type: 'profile', resource_id: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    safeError(res, error);
  }
};

// PATCH /api/admin/users/:id/categories — admin override, no plan cap.
const adminSetUserCategories = async (req, res) => {
  try {
    const { data: activeRows, error: actErr } = await supabaseAdmin
      .from('categories').select('slug').eq('status', 'active');
    if (actErr) return safeError(res, actErr);
    const activeSlugs = (activeRows || []).map((r) => r.slug);

    const result = validateCategorySelection({
      primary_category: req.body.primary_category,
      categories: req.body.categories,
      activeSlugs,
      max: -1, // admin bypasses plan caps
    });
    if (!result.ok) return res.status(result.status).json({ message: result.message });

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        primary_category: result.primary_category,
        categories: result.categories,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('id, primary_category, categories')
      .single();
    if (error) return safeError(res, error);

    await audit(req, { action: 'user.set_categories', resource_type: 'profile', resource_id: req.params.id,
      after: { primary_category: result.primary_category, categories: result.categories } });
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// ══════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════

const getAllBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const page = clampPage(req.query.page);
    const limit = clampLimit(req.query.limit);
    let query = supabaseAdmin
      .from('bookings')
      .select('*, services(title, price, duration), profiles!bookings_host_id_fkey(name, email, username)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, count, error } = await query;
    if (error) return safeError(res, error);

    res.json({ bookings: data, total: count, page, limit });
  } catch (error) {
    safeError(res, error);
  }
};

const updateBooking = async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (payment_status) {
      // SECURITY: 'paid' may ONLY be set by the verified Razorpay payment flow.
      // Allowing it here lets an admin fabricate a withdrawable vendor balance.
      // Case-insensitive guard so 'PAID'/'Paid' can't slip past the app layer.
      if (String(payment_status).toLowerCase() === 'paid') {
        return res.status(400).json({
          message: "payment_status 'paid' can only be set by a verified payment, not a manual edit.",
        });
      }
      updates.payment_status = payment_status;
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return safeError(res, error);
    await audit(req, { action: 'booking.update', resource_type: 'booking', resource_id: req.params.id,
      after: { status: updates.status, payment_status: updates.payment_status } });
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('bookings').delete().eq('id', req.params.id);
    if (error) return safeError(res, error);
    await audit(req, { action: 'booking.delete', resource_type: 'booking', resource_id: req.params.id });
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    safeError(res, error);
  }
};

// ══════════════════════════════════════
// SERVICES
// ══════════════════════════════════════

const getAllServices = async (req, res) => {
  try {
    // Hard cap to avoid dumping the entire services table in one unbounded query.
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*, profiles!services_host_id_fkey(name, username)')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return safeError(res, error);
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

const deleteService = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('services').delete().eq('id', req.params.id);
    if (error) return safeError(res, error);
    bustSitemapCache();
    await audit(req, { action: 'service.delete', resource_type: 'service', resource_id: req.params.id });
    res.json({ message: 'Service deleted' });
  } catch (error) {
    safeError(res, error);
  }
};

// PUT /api/admin/services/:id/seo — admin-only SEO + index control for a service.
// Vendors never reach this. is_indexable drives the page robots meta AND sitemap
// inclusion. Canonical is derived from the live URL, so there is no field for it.
const updateServiceSeo = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(400).json({ message: 'Invalid service id' });
    const updates = buildSeoUpdate(req.body, req.admin?.email || req.admin?.id);

    let { data, error } = await supabaseAdmin
      .from('services').update(updates).eq('id', req.params.id)
      .select('*, profiles!services_host_id_fkey(name, username)').single();

    if (error && /Could not find the|column.*does not exist/i.test(error.message)) {
      return res.status(409).json({ message: SEO_MIGRATION_HINT });
    }
    if (error) return safeError(res, error);

    bustSitemapCache();
    await audit(req, { action: 'service.seo.update', resource_type: 'service', resource_id: req.params.id,
      after: { is_indexable: updates.is_indexable } });
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// PUT /api/admin/providers/:id/seo — admin-only SEO + index control for a host
// profile. Same contract as service SEO; a noindexed host also drops its service
// pages from the sitemap (the canonical lives under the host path).
const updateProviderSeo = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(400).json({ message: 'Invalid provider id' });
    const updates = buildSeoUpdate(req.body, req.admin?.email || req.admin?.id);

    let { data, error } = await supabaseAdmin
      .from('profiles').update(updates).eq('id', req.params.id).eq('role', 'host')
      .select('id, name, username, is_verified, is_banned, seo_title, seo_description, og_title, og_description, seo_image, is_indexable, seo_updated_at, seo_updated_by')
      .single();

    if (error && /Could not find the|column.*does not exist/i.test(error.message)) {
      return res.status(409).json({ message: SEO_MIGRATION_HINT });
    }
    if (error) return safeError(res, error);
    if (!data) return res.status(404).json({ message: 'Provider not found' });

    bustSitemapCache();
    await audit(req, { action: 'provider.seo.update', resource_type: 'profile', resource_id: req.params.id,
      after: { is_indexable: updates.is_indexable } });
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// ══════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════

// Unwrap any number of JSON-stringify layers. updateSettings JSON.stringifies on
// every save, so a value the UI reads-then-resaves gains a quote layer each round
// trip ("10" → "\"10\"" → …). Returning the fully-unwrapped value here keeps the
// round trip flat and stops the corruption that broke platform_fee_gst_rate.
const deepUnwrap = (raw) => {
  let v = raw;
  for (let i = 0; i < 8 && typeof v === 'string'; i++) {
    let parsed;
    try { parsed = JSON.parse(v.trim()); } catch { break; }
    if (parsed === v) break;
    v = parsed;
  }
  return v;
};

const getSettings = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('platform_settings').select('*');
    if (error) return safeError(res, error);
    const settings = {};
    (data || []).forEach(r => { settings[r.key] = deepUnwrap(r.value); });
    res.json(settings);
  } catch (error) {
    safeError(res, error);
  }
};

const updateSettings = async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await supabaseAdmin
        .from('platform_settings')
        .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    // Pricing reads platform_fee / GST from here — bust the cache so edits apply now
    try { require('../services/platformConfig').clearCache(); } catch (_) {}
    // Maintenance mode reads from the same table — bust its cache too.
    try { require('../middleware/maintenanceMiddleware').clearCache(); } catch (_) {}
    res.json({ message: 'Settings updated' });
  } catch (error) {
    safeError(res, error);
  }
};

// ══════════════════════════════════════
// PROVIDER PLAN ANALYTICS
// Powers the Providers tab charts:
//   1. distribution    — provider headcount per plan (pie)
//   2. planEarnings    — actual collected subscription revenue, net of gateway
//                        cost, per paid plan (GST is a pass-through, excluded)
//   3. bookingEarnings — platform net take (commission + platform fee) on paid
//                        bookings, grouped by the host's current plan
// ══════════════════════════════════════
const planService = require('../services/planService');

const getProviderPlanAnalytics = async (req, res) => {
  try {
    // ── Hosts: one fetch drives both headcount distribution and host→plan map ──
    const { data: hostRows, error: hostErr } = await supabaseAdmin
      .from('profiles').select('id, plan').eq('role', 'host');
    if (hostErr) return safeError(res, hostErr);

    const distribution = { starter: 0, creator: 0, professional: 0 };
    const hostPlan = {};
    (hostRows || []).forEach((h) => {
      const slug = planService.normalizeSlug(h.plan);
      hostPlan[h.id] = slug;
      distribution[slug] = (distribution[slug] || 0) + 1;
    });

    // ── Earning from plans: collected subscription payments, net of gateway ──
    // net = plan_price − razorpay_fee − razorpay_tax (GST excluded: pass-through).
    const planEarnings = { creator: 0, professional: 0 };
    const { data: subs } = await supabaseAdmin
      .from('subscription_payments')
      .select('plan_type, plan_price, razorpay_fee, razorpay_tax, status')
      .eq('status', 'paid');
    (subs || []).forEach((s) => {
      const slug = planService.normalizeSlug(s.plan_type);
      if (planEarnings[slug] == null) return; // ignore starter / unknown
      const net = (Number(s.plan_price) || 0) - (Number(s.razorpay_fee) || 0) - (Number(s.razorpay_tax) || 0);
      planEarnings[slug] += Math.max(0, net);
    });

    // ── Earning from their bookings: platform net take, grouped by host plan ──
    let bookingsRes = await supabaseAdmin
      .from('bookings')
      .select('host_id, payment_status, commission_applied, platform_fee_amount')
      .eq('payment_status', 'paid');
    if (bookingsRes.error && /Could not find the|column.*does not exist/i.test(bookingsRes.error.message)) {
      bookingsRes = await supabaseAdmin
        .from('bookings')
        .select('host_id, payment_status, platform_fee_amount')
        .eq('payment_status', 'paid');
    }
    const bookingEarnings = { starter: 0, creator: 0, professional: 0 };
    (bookingsRes.data || []).forEach((b) => {
      const slug = hostPlan[b.host_id] || 'starter';
      if (bookingEarnings[slug] == null) bookingEarnings[slug] = 0;
      bookingEarnings[slug] += (Number(b.commission_applied) || 0) + (Number(b.platform_fee_amount) || 0);
    });

    res.json({ distribution, planEarnings, bookingEarnings });
  } catch (error) {
    safeError(res, error);
  }
};

// NOTE: the former POST /api/admin/cleanup-users handler (mass-deleted every
// Supabase Auth user except a hardcoded fallback email) was removed in M0 — a
// destructive dev-reset tool must never be exposed on the production admin API.
// If a bulk reset is ever needed, do it as an offline, access-controlled script.

module.exports = {
  getStats,
  getProviderPlanAnalytics,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  adminSetUserCategories,
  getAllBookings,
  updateBooking,
  deleteBooking,
  getAllServices,
  deleteService,
  updateServiceSeo,
  updateProviderSeo,
  getSettings,
  updateSettings,
};

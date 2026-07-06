/**
 * serviceController.js
 * Vendor Service Module v2 — full CRUD with slug, rich fields, inclusions, FAQs etc.
 * Does NOT touch existing bookingController / authController / paymentController.
 */
const { supabaseAdmin } = require('../config/supabase');
const { safeError } = require('../utils/httpError');
const { setPublicCache } = require('../utils/httpCache');
const { getConfig: getPlatformConfig } = require('../services/platformConfig');
const { bustSitemapCache } = require('../utils/sitemapCache');
const { bustPublicReadCaches } = require('../services/publicCacheBust');
const responseCache = require('../services/responseCache');
const { resolveAndValidateCategory } = require('../lib/serviceCategory');

// Server-side read-through cache TTL for the assembled public service page.
const SERVICE_DETAIL_CACHE_MS = Number(process.env.SERVICE_DETAIL_CACHE_MS) || 120_000;
const { canActivateMore, canAddFreeService } = require('../middleware/planMiddleware');
const { getPublicAppearanceData } = require('./appearanceController');

// Clamp service money/time fields to safe bounds (audit P1-11). parseFloat/parseInt
// alone let a negative price through (parseFloat('-500') === -500), which breaks
// commission math and can yield a negative vendor payout. These match the
// validate.js bounds and are the controller-level backstop.
const clampPrice = (v) => Math.min(500000, Math.max(0, Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0));
const clampDuration = (v) => Math.min(480, Math.max(5, parseInt(v, 10) || 30));
const clampGrace = (v) => Math.min(1440, Math.max(0, parseInt(v, 10) || 0));

// ─── Slug helpers ────────────────────────────────────────────────────────────

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/--+/g, '-')
    .slice(0, 80);

// Generate a random letter-digit-letter suffix, e.g. "a3b"
const randomSuffix = () => {
  const l = 'abcdefghijklmnopqrstuvwxyz';
  const d = '0123456789';
  return l[Math.floor(Math.random() * 26)] + d[Math.floor(Math.random() * 10)] + l[Math.floor(Math.random() * 26)];
};

// Per-host unique slug: same title on different hosts can share slug;
// same host can't have duplicates — fallback adds letter-digit-letter suffix
const uniqueSlug = async (baseSlug, hostId, excludeId = null) => {
  let slug = baseSlug;
  let attempts = 0;
  while (true) {
    let q = supabaseAdmin.from('services').select('id').eq('slug', slug).eq('host_id', hostId);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    slug = `${baseSlug}-${randomSuffix()}`;
    if (++attempts > 10) slug = `${baseSlug}-${Date.now().toString(36)}`; // ultimate fallback
  }
};

// ─── Field whitelist for v2 payload ─────────────────────────────────────────

const buildPayload = (body) => {
  const {
    title,
    short_description,
    long_description,
    service_type,      // 'online' | 'offline'
    price,
    duration,
    grace_period,      // minutes
    thumbnail_url,
    included_items,
    excluded_items,
    faqs,
    important_note,
    // legacy compat
    description,
    meeting_mode,
    type,
    grace_period_minutes,
  } = body;

  const p = {};
  if (title !== undefined)              p.title = title;
  if (short_description !== undefined)  p.short_description = short_description || '';
  if (description !== undefined)        p.description = description || '';          // legacy field
  if (long_description !== undefined)   p.long_description = long_description || '';
  // service_type maps to meeting_mode for backward compat
  if (service_type !== undefined)       p.meeting_mode = service_type;
  if (meeting_mode !== undefined)       p.meeting_mode = meeting_mode;
  if (type !== undefined)               p.type = type;
  if (price !== undefined)              p.price = clampPrice(price);
  if (duration !== undefined)           p.duration = clampDuration(duration);
  if (grace_period !== undefined)       p.grace_period_minutes = clampGrace(grace_period);
  if (grace_period_minutes !== undefined) p.grace_period_minutes = clampGrace(grace_period_minutes);
  if (thumbnail_url !== undefined)      p.thumbnail_url = thumbnail_url || '';
  if (included_items !== undefined)     p.included_items = Array.isArray(included_items) ? included_items : [];
  if (excluded_items !== undefined)     p.excluded_items = Array.isArray(excluded_items) ? excluded_items : [];
  if (faqs !== undefined)               p.faqs = Array.isArray(faqs) ? faqs : [];
  if (important_note !== undefined)     p.important_note = important_note || '';
  return p;
};

// ─── Safe DB helpers (handle stale schema cache) ─────────────────────────────

const V2_SELECT_COLS =
  'id,host_id,title,slug,short_description,long_description,description,' +
  'meeting_mode,type,price,duration,currency,grace_period_minutes,thumbnail_url,' +
  'included_items,excluded_items,faqs,important_note,rating,total_reviews,total_bookings,' +
  'category,primary_category,is_active,created_at,updated_at';

const LEGACY_SELECT_COLS =
  'id,host_id,title,slug,description,type,meeting_mode,price,duration,currency,' +
  'grace_period_minutes,thumbnail_url,is_active,created_at,updated_at';

// Admin-managed SEO columns (v3.19). Surfaced on PUBLIC reads so the page can
// render admin overrides + robots/canonical; vendors can't set them (not in
// buildPayload). is_indexable also drives the noindex meta on the service page.
const SEO_COLS = 'seo_title,seo_description,og_title,og_description,seo_image,is_indexable';

// Fetch a public service trying richest columns first, degrading gracefully if
// the SEO migration (or v2 columns) aren't applied yet: V2+SEO -> V2 -> LEGACY.
const schemaMissing = (err) =>
  err && /Could not find the|column.*does not exist/i.test(err.message || '');

const fetchPublicServiceSeo = async ({ hostId, slug }) => {
  const make = (cols) =>
    supabaseAdmin.from('services').select(cols)
      .eq('host_id', hostId).eq('slug', slug).eq('is_active', true).single();
  let r = await make(`${V2_SELECT_COLS},${SEO_COLS}`);
  if (schemaMissing(r.error)) r = await make(V2_SELECT_COLS);
  if (schemaMissing(r.error)) r = await make(LEGACY_SELECT_COLS);
  return r;
};

// Vendor profile for the public service page. Adds SEO override cols with a
// fallback so a pre-migration DB still resolves the vendor (404 otherwise).
const VENDOR_PUBLIC_COLS =
  'id,name,username,profession,tagline,profile_image,cover_image,bio,is_verified,' +
  'google_calendar_connected,badges,social_links,theme_color,plan';
const fetchPublicVendor = async (username) => {
  const make = (cols) =>
    supabaseAdmin.from('profiles').select(cols).eq('username', username).eq('role', 'host').single();
  // background_key + SEO cols are migration-sensitive — keep them OUT of the
  // fallback set so a pre-migration DB still resolves the vendor (404 otherwise).
  let r = await make(`${VENDOR_PUBLIC_COLS},background_key,seo_image,is_indexable`);
  if (schemaMissing(r.error)) r = await make(VENDOR_PUBLIC_COLS);
  return r;
};

const selectSafe = async (query) => {
  let r = await query.select(V2_SELECT_COLS);
  if (r.error && /Could not find the/i.test(r.error.message)) {
    r = await query.select(LEGACY_SELECT_COLS);
  }
  return r;
};

const insertSafe = async (payload) => {
  // Try full v2 insert; fall back to legacy columns if schema cache is stale
  let r = await supabaseAdmin.from('services').insert(payload).select(V2_SELECT_COLS).single();
  if (r.error && /Could not find the/i.test(r.error.message)) {
    const safe = {
      host_id:             payload.host_id,
      title:               payload.title,
      description:         payload.short_description || payload.description || '',
      type:                payload.type || 'one_on_one',
      meeting_mode:        payload.meeting_mode || 'online',
      duration:            payload.duration,
      price:               payload.price,
      currency:            payload.currency || 'INR',
      grace_period_minutes:payload.grace_period_minutes || 0,
      thumbnail_url:       payload.thumbnail_url || '',
      slug:                payload.slug,
      is_active:           payload.is_active !== false,
    };
    r = await supabaseAdmin.from('services').insert(safe).select(LEGACY_SELECT_COLS).single();
  }
  return r;
};

const updateSafe = async (id, hostId, updates) => {
  let r = await supabaseAdmin
    .from('services')
    .update(updates)
    .eq('id', id)
    .eq('host_id', hostId)
    .select(V2_SELECT_COLS)
    .single();
  if (r.error && /Could not find the/i.test(r.error.message)) {
    const safe = {};
    // `category` and `primary_category` are deliberately excluded from the legacy
    // fallback so a stale / pre-migration schema (without the columns) still
    // writes the core fields.
    const legacyCols = ['title','description','type','meeting_mode','duration','price','currency','grace_period_minutes','thumbnail_url','slug','is_active','updated_at'];
    legacyCols.forEach(k => { if (updates[k] !== undefined) safe[k] = updates[k]; });
    if (updates.short_description) safe.description = updates.short_description;
    if (updates.meeting_mode)      safe.meeting_mode = updates.meeting_mode;
    r = await supabaseAdmin
      .from('services')
      .update(safe)
      .eq('id', id)
      .eq('host_id', hostId)
      .select(LEGACY_SELECT_COLS)
      .single();
  }
  return r;
};

// ─── POST /api/services  (vendor creates service) ────────────────────────────

const createService = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    // Service must sit inside one of the host's categories.
    const chk = await resolveAndValidateCategory(supabaseAdmin, req.user.id, req.body.category, { required: true });
    if (!chk.ok) return res.status(chk.status).json({ message: chk.message });

    const baseSlug = slugify(title);
    const slug = await uniqueSlug(baseSlug, req.user.id);

    const p = buildPayload(req.body);
    p.category = chk.value;
    p.primary_category = chk.primary;
    p.host_id  = req.user.id;
    p.slug     = slug;
    p.currency = p.currency || 'INR';
    p.type     = p.type || 'one_on_one';
    p.is_active = true;

    // Free-service sub-cap: a new active price-0 service must fit the plan's
    // free_services limit (Starter 2; paid tiers unlimited).
    if (Number(p.price ?? 0) === 0) {
      const gate = await canAddFreeService(req.user.id);
      if (!gate.ok) return res.status(gate.status).json({ message: gate.message, upgrade_required: true });
    }

    const { data, error } = await insertSafe(p);
    if (error) return safeError(res, error);
    bustSitemapCache(); // new service may now be indexable
    bustPublicReadCaches();
    res.status(201).json(data);
  } catch (err) {
    safeError(res, err);
  }
};

// ─── GET /api/services  (vendor's own services) ──────────────────────────────

const getMyServices = async (req, res) => {
  try {
    const q = supabaseAdmin.from('services').select(V2_SELECT_COLS).eq('host_id', req.user.id).order('created_at', { ascending: false });
    let { data, error } = await q;
    if (error && /Could not find the/i.test(error.message)) {
      const r = await supabaseAdmin.from('services').select(LEGACY_SELECT_COLS).eq('host_id', req.user.id).order('created_at', { ascending: false });
      data  = r.data;
      error = r.error;
    }
    if (error) return safeError(res, error);
    res.json(data || []);
  } catch (err) {
    safeError(res, err);
  }
};

// ─── GET /api/services/:id  (vendor fetches one service) ────────────────────

const getServiceById = async (req, res) => {
  try {
    let r = await supabaseAdmin.from('services').select(V2_SELECT_COLS).eq('id', req.params.id).eq('host_id', req.user.id).single();
    if (r.error && /Could not find the/i.test(r.error.message)) {
      r = await supabaseAdmin.from('services').select(LEGACY_SELECT_COLS).eq('id', req.params.id).eq('host_id', req.user.id).single();
    }
    if (r.error || !r.data) return res.status(404).json({ message: 'Service not found' });
    res.json(r.data);
  } catch (err) {
    safeError(res, err);
  }
};

// ─── PUT /api/services/:id ───────────────────────────────────────────────────

const updateService = async (req, res) => {
  try {
    const updates = buildPayload(req.body);
    if (req.body.category !== undefined) {
      const chk = await resolveAndValidateCategory(supabaseAdmin, req.user.id, req.body.category, { required: false });
      if (!chk.ok) return res.status(chk.status).json({ message: chk.message });
      updates.category = chk.value;
      updates.primary_category = chk.primary;
    }
    updates.updated_at = new Date().toISOString();

    // Re-slug if title changed
    if (req.body.title) {
      const base = slugify(req.body.title);
      updates.slug = await uniqueSlug(base, req.user.id, req.params.id);
    }

    // Free-service sub-cap: only a LIVE service flipping paid→₹0 enters the free
    // set and must fit the cap. Editing an already-free service (or an inactive
    // one) doesn't add a new free listing, so it isn't gated — keeps benign edits
    // and grandfathered rows working.
    if (updates.price === 0) {
      const { data: cur } = await supabaseAdmin
        .from('services').select('is_active, price').eq('id', req.params.id).eq('host_id', req.user.id).single();
      if (cur?.is_active && Number(cur.price ?? 0) !== 0) {
        const gate = await canAddFreeService(req.user.id, { excludeId: req.params.id });
        if (!gate.ok) return res.status(gate.status).json({ message: gate.message, upgrade_required: true });
      }
    }

    const { data, error } = await updateSafe(req.params.id, req.user.id, updates);
    if (error) return safeError(res, error);
    bustSitemapCache(); // title/slug change moves the canonical URL
    bustPublicReadCaches();
    res.json(data);
  } catch (err) {
    safeError(res, err);
  }
};

// ─── DELETE /api/services/:id ────────────────────────────────────────────────

const deleteService = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', req.params.id)
      .eq('host_id', req.user.id);
    if (error) return safeError(res, error);
    bustSitemapCache(); // removed service drops from the sitemap
    bustPublicReadCaches();
    res.json({ message: 'Service deleted' });
  } catch (err) {
    safeError(res, err);
  }
};

// ─── POST /api/services/:id/duplicate ───────────────────────────────────────

const duplicateService = async (req, res) => {
  try {
    let r = await supabaseAdmin.from('services').select(V2_SELECT_COLS).eq('id', req.params.id).eq('host_id', req.user.id).single();
    if (r.error && /Could not find the/i.test(r.error.message)) {
      r = await supabaseAdmin.from('services').select(LEGACY_SELECT_COLS).eq('id', req.params.id).eq('host_id', req.user.id).single();
    }
    if (r.error || !r.data) return res.status(404).json({ message: 'Service not found' });

    const orig = r.data;
    const { id, created_at, updated_at, slug: origSlug, total_bookings, total_reviews, rating, ...rest } = orig;

    const newTitle = `${rest.title} (Copy)`;
    const baseSlug = slugify(newTitle);
    const newSlug  = await uniqueSlug(baseSlug, req.user.id);

    const payload = { ...rest, title: newTitle, slug: newSlug, is_active: false, host_id: req.user.id };
    const { data, error } = await insertSafe(payload);
    if (error) return safeError(res, error);
    res.status(201).json(data);
  } catch (err) {
    safeError(res, err);
  }
};

// ─── PUT /api/services/:id/toggle ────────────────────────────────────────────

const toggleService = async (req, res) => {
  try {
    const { data: svc } = await supabaseAdmin.from('services').select('is_active, price').eq('id', req.params.id).eq('host_id', req.user.id).single();
    if (!svc) return res.status(404).json({ message: 'Service not found' });

    // P1-1: activating (inactive→active) must respect the plan's active-service cap…
    if (!svc.is_active) {
      const gate = await canActivateMore(req.user.id, 'services');
      if (!gate.ok) return res.status(gate.status).json({ message: gate.message, upgrade_required: true });
      // …and, if it's a free service, the free-service sub-cap too.
      if (Number(svc.price ?? 0) === 0) {
        const freeGate = await canAddFreeService(req.user.id, { excludeId: req.params.id });
        if (!freeGate.ok) return res.status(freeGate.status).json({ message: freeGate.message, upgrade_required: true });
      }
    }

    const { error } = await supabaseAdmin
      .from('services')
      .update({ is_active: !svc.is_active, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('host_id', req.user.id);
    if (error) return safeError(res, error);
    bustSitemapCache(); // activating/deactivating adds/removes from the sitemap
    bustPublicReadCaches();
    res.json({ is_active: !svc.is_active });
  } catch (err) {
    safeError(res, err);
  }
};

// ─── GET /api/services/public/:slug  (public, no auth) ───────────────────────

// Assemble the public service page (6+ queries). Returns { notFound: true } |
// { payload }, so responseCache.getOrSet can wrap the whole thing.
const buildPublicServiceBySlug = async (slug) => {
  let r = await supabaseAdmin
    .from('services')
    .select(V2_SELECT_COLS)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (r.error && /Could not find the/i.test(r.error.message)) {
    r = await supabaseAdmin.from('services').select(LEGACY_SELECT_COLS).eq('slug', slug).eq('is_active', true).single();
  }
  if (r.error || !r.data) return { notFound: true };

  const svc = r.data;

  // Fetch vendor profile
  const { data: vendor } = await supabaseAdmin
    .from('profiles')
    .select('id,name,username,profession,tagline,profile_image,cover_image,bio,is_verified,google_calendar_connected,badges')
    .eq('id', svc.host_id)
    .single();

  // Fetch vendor's total active services count
  const { count: totalServices } = await supabaseAdmin
    .from('services')
    .select('id', { count: 'exact', head: true })
    .eq('host_id', svc.host_id)
    .eq('is_active', true);

  // Fetch availability
  const { data: availability } = await supabaseAdmin
    .from('availability')
    .select('*')
    .eq('host_id', svc.host_id)
    .single();

  // Fetch reviews for this service (via bookings)
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('id,rating,comment,created_at,profiles!reviews_reviewer_id_fkey(name,profile_image)')
    .eq('service_id', svc.id)
    .eq('direction', 'guest_to_host')
    .neq('status', 'hidden')   // admin-hidden reviews are excluded from public reads
    .order('created_at', { ascending: false })
    .limit(20);

  // Aggregate review stats
  const reviewList = reviews || [];
  const avgRating = reviewList.length
    ? parseFloat((reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length).toFixed(2))
    : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviewList.filter((r) => r.rating === star).length,
  }));

  return {
    payload: {
      service: svc,
      vendor: vendor || {},
      totalServices: totalServices || 0,
      availability: availability || null,
      reviews: reviewList,
      avgRating,
      ratingBreakdown,
    },
  };
};

const getPublicServiceBySlug = async (req, res) => {
  try {
    const outcome = await responseCache.getOrSet(
      `service:slug:${req.params.slug}`,
      SERVICE_DETAIL_CACHE_MS,
      () => buildPublicServiceBySlug(req.params.slug),
    );
    if (outcome.notFound) return res.status(404).json({ message: 'Service not found' });

    // Public, anonymous service page — cacheable with a short TTL.
    setPublicCache(res, 120);
    res.json(outcome.payload);
  } catch (err) {
    safeError(res, err);
  }
};

// ─── GET /api/services/public/:profileSlug/:serviceSlug  (public, no auth) ───
// Validates service belongs to vendor identified by profileSlug (username).
// Returns the same payload shape as getPublicServiceBySlug.

// Assemble the vendor-scoped public service page. Returns
// { hostNotFound: true } | { notFound: true } | { payload }.
const buildPublicServiceByProfileAndSlug = async (profileSlug, serviceSlug) => {
  // 1. Resolve the vendor by username (profileSlug)
  const { data: vendor, error: vendorErr } = await fetchPublicVendor(profileSlug);

  if (vendorErr || !vendor) {
    return { hostNotFound: true };
  }

  // 2. Resolve the service by slug, scoped to this vendor (with SEO overrides)
  const r = await fetchPublicServiceSeo({ hostId: vendor.id, slug: serviceSlug });

  if (r.error || !r.data) {
    return { notFound: true };
  }

  const svc = r.data;

  // 3. Fetch supporting data
  const [
    { count: totalServices },
    { data: availability },
    { data: reviews },
  ] = await Promise.all([
    supabaseAdmin.from('services').select('id', { count: 'exact', head: true }).eq('host_id', vendor.id).eq('is_active', true),
    supabaseAdmin.from('availability').select('*').eq('host_id', vendor.id).single(),
    supabaseAdmin.from('reviews').select('id,rating,comment,created_at,profiles!reviews_reviewer_id_fkey(name,profile_image)').eq('service_id', svc.id).eq('direction', 'guest_to_host').neq('status', 'hidden').order('created_at', { ascending: false }).limit(20),
  ]);

  const reviewList = reviews || [];
  const avgRating = reviewList.length
    ? parseFloat((reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length).toFixed(2))
    : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviewList.filter((r) => r.rating === star).length,
  }));

  // Resolve service-category slug → human label for the public service page.
  const service = svc;
  if (service && service.category) {
    let q = supabaseAdmin.from('service_categories').select('name').eq('slug', service.category);
    // Pair lookup once v3.60 stamps the profession; slug-only pre-migration.
    if (service.primary_category) q = q.eq('primary_category', service.primary_category);
    const { data: cat } = await q.limit(1).maybeSingle();
    service.category_label = cat?.name || null;
  }

  // Customer-facing booking charge = flat platform fee + GST (admin-editable).
  // Mirrors the breakdown shown on the booking/payment screen so the price the
  // guest sees here matches what they pay. Falls back to 0 on error.
  let bookingFee = 0;
  let bookingFeeBreakdown = { platformFee: 0, tax: 0 };
  try {
    const { platformFee, gstRate } = await getPlatformConfig();
    const tax = Math.round(platformFee * gstRate * 100) / 100;
    bookingFee = Math.round((platformFee + tax) * 100) / 100;
    bookingFeeBreakdown = { platformFee: Math.round(platformFee * 100) / 100, tax };
  } catch (_) { bookingFee = 0; bookingFeeBreakdown = { platformFee: 0, tax: 0 }; }

  // Embed the host's appearance (enabled backgrounds + default) so the service
  // page can render the right background without a second request. Decorative —
  // non-fatal on error so the page still loads.
  let appearance = { backgrounds: [], default_background: null };
  try { appearance = await getPublicAppearanceData(); } catch (_) { /* non-fatal: decorative */ }

  return {
    payload: {
      service: service,
      vendor: vendor || {},
      appearance,
      totalServices: totalServices || 0,
      availability: availability || null,
      reviews: reviewList,
      avgRating,
      ratingBreakdown,
      bookingFee,
      bookingFeeBreakdown,
    },
  };
};

const getPublicServiceByProfileAndSlug = async (req, res) => {
  try {
    const { profileSlug, serviceSlug } = req.params;
    const outcome = await responseCache.getOrSet(
      `service:pair:${profileSlug}/${serviceSlug}`,
      SERVICE_DETAIL_CACHE_MS,
      () => buildPublicServiceByProfileAndSlug(profileSlug, serviceSlug),
    );
    if (outcome.hostNotFound) return res.status(404).json({ message: 'Host not found' });
    if (outcome.notFound) return res.status(404).json({ message: 'Service not found' });

    // Public, anonymous service page — cacheable with a short TTL.
    setPublicCache(res, 120);
    res.json(outcome.payload);
  } catch (err) {
    safeError(res, err);
  }
};

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  createService,
  getMyServices,
  getServiceById,
  updateService,
  deleteService,
  duplicateService,
  toggleService,
  getPublicServiceBySlug,
  getPublicServiceByProfileAndSlug,
  buildPublicServiceByProfileAndSlug, // used by prerenderController for bot-traffic meta shells
};

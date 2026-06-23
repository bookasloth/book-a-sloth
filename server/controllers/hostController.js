const { supabaseAdmin } = require("../config/supabase");
const { safeError } = require('../utils/httpError');
const { sanitizeLikeTerm } = require("../utils/searchSanitize");
const { getConfig: getPlatformConfig } = require("../services/platformConfig");
const usernameService = require("../services/usernameService");
const { bustSitemapCache } = require("../utils/sitemapCache");
const planService = require('../services/planService');
const { validateCategorySelection } = require('../lib/categoryRules');
const { resolveAndValidateCategory } = require('../lib/serviceCategory');

// Public host columns. SECURITY: explicit whitelist — never select('*') on a
// public route. SEO override cols (v3.19) are appended with a fallback so a
// pre-migration DB still resolves the profile.
const HOST_PUBLIC_COLS =
  "id, name, username, role, bio, tagline, profession, location, profile_image, " +
  "cover_image, social_links, badges, theme_color, plan, is_verified, google_calendar_connected, primary_category";
const HOST_SEO_COLS =
  "seo_title, seo_description, og_title, og_description, seo_image, is_indexable";

// ??? Profile slug helpers ????????????????????????????????????????????????????
const slugifyUsername = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/--+/g, '-')
    .slice(0, 60);

// Find a unique profile slug (username) -- appends numeric suffix if taken
const uniqueProfileSlug = async (base, excludeId = null) => {
  let slug = base;
  let i = 2;
  while (true) {
    let q = supabaseAdmin.from('profiles').select('id').eq('username', slug);
    if (excludeId) q = q.neq('id', excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i++}`;
  }
};

const insertServiceSafe = async (payload) => {
  let result = await supabaseAdmin
    .from("services")
    .insert(payload)
    .select()
    .single();

  // Retry with fallback if schema cache doesn't recognize newer columns
  if (
    result.error &&
    /Could not find the '(grace_period_minutes|thumbnail_url|category)' column|column.*does not exist/i.test(
      result.error.message,
    )
  ) {
    const payloadCopy = { ...payload };
    delete payloadCopy.grace_period_minutes;
    delete payloadCopy.thumbnail_url;
    delete payloadCopy.category;
    result = await supabaseAdmin
      .from("services")
      .insert(payloadCopy)
      .select()
      .single();
  }
  return result;
};

const updateServiceSafe = async (id, updates, userId) => {
  let result = await supabaseAdmin
    .from("services")
    .update(updates)
    .eq("id", id)
    .eq("host_id", userId)
    .select()
    .single();

  // Retry with fallback if schema cache doesn't recognize newer columns
  if (
    result.error &&
    /Could not find the '(grace_period_minutes|thumbnail_url|category)' column|column.*does not exist/i.test(
      result.error.message,
    )
  ) {
    const updatesCopy = { ...updates };
    delete updatesCopy.grace_period_minutes;
    delete updatesCopy.thumbnail_url;
    delete updatesCopy.category;
    result = await supabaseAdmin
      .from("services")
      .update(updatesCopy)
      .eq("id", id)
      .eq("host_id", userId)
      .select()
      .single();
  }
  return result;
};

// GET /api/host/:username -- public profile
const getHostProfile = async (req, res) => {
  try {
    // Try whitelist + SEO override cols; fall back to the base whitelist if the
    // v3.19 SEO migration isn't applied yet (so the profile still resolves).
    let { data: host, error } = await supabaseAdmin
      .from("profiles")
      .select(`${HOST_PUBLIC_COLS}, ${HOST_SEO_COLS}`)
      .eq("username", req.params.username)
      .eq("role", "host")
      .single();

    if (error && /Could not find the|column.*does not exist/i.test(error.message)) {
      ({ data: host, error } = await supabaseAdmin
        .from("profiles")
        .select(HOST_PUBLIC_COLS)
        .eq("username", req.params.username)
        .eq("role", "host")
        .single());
    }

    if (error || !host) {
      // Not a current username — it may be an OLD alias. Resolve via history and
      // tell the client to redirect to the canonical (current) username. The
      // SEO-grade HTTP 301 is issued by the Vercel edge function; this 200
      // envelope is defense-in-depth so the SPA self-corrects the URL too.
      const requested = String(req.params.username || "").toLowerCase();
      const resolved = await usernameService.resolve(requested);
      if (resolved && resolved.currentUsername && resolved.currentUsername !== requested) {
        return res.json({ redirect: true, username: resolved.currentUsername });
      }
      return res.status(404).json({ message: "Host not found" });
    }

    // Defense-in-depth: the whitelist above already excludes these at the query
    // layer; this strip is a second guard in case the select ever changes.
    delete host.google_access_token;
    delete host.google_refresh_token;
    delete host.otp_code;
    delete host.otp_expires_at;

    // Task 10: Show unverified status but don't block -- client shows a banner
    // (flip host.is_verified to true in Admin -> Users to go fully live)

    // Fetch services + availability in parallel
    const [servicesResult, { data: availability }] = await Promise.all([
      supabaseAdmin.from("services").select("*").eq("host_id", host.id).eq("is_active", true).limit(100),
      supabaseAdmin.from("availability").select("*").eq("host_id", host.id).single(),
    ]);

    let { data: services } = servicesResult;

    // Fallback if schema cache is stale
    if (
      servicesResult.error &&
      /Could not find the|column.*does not exist/i.test(servicesResult.error.message)
    ) {
      const fallback = await supabaseAdmin
        .from("services")
        .select("id, host_id, title, slug, description, short_description, type, duration, price, currency, meeting_mode, is_active, created_at, updated_at")
        .eq("host_id", host.id)
        .eq("is_active", true);
      services = fallback.data;
    }

    // Resolve the primary category's human label for display (best-effort).
    if (host?.primary_category) {
      const { data: cat } = await supabaseAdmin
        .from('categories').select('label').eq('slug', host.primary_category).maybeSingle();
      host.primary_category_label = cat?.label || null;
    }

    res.json({ host, services: services || [], availability });
  } catch (error) {
    safeError(res, error);
  }
};

// PUT /api/host/profile -- update own profile
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      tagline,
      social_links,
      profile_image,
      cover_image,
      profession,
      location,
      theme_color,
      reschedule_fee,
    } = req.body;

    // Username is NOT editable here. Changes go through the gated, rate-limited
    // PUT /api/host/username (WhatsApp-verified, max 2/year, 6-month gap). Any
    // `username` field in this body is ignored. Safety net: a legacy account with
    // no username gets an auto-generated one — an INITIAL assignment, not a change.
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles').select('username').eq('id', req.user.id).single();
    let initialUsername;
    if (!existingProfile?.username) {
      initialUsername = await usernameService.createInitialUsername();
    }

    const updates = { updated_at: new Date().toISOString() }; // BUG-05 fixed: removed forced role:"host"
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (tagline !== undefined) updates.tagline = tagline;
    if (initialUsername) updates.username = initialUsername;
    if (profile_image !== undefined) updates.profile_image = profile_image;
    if (cover_image !== undefined) updates.cover_image = cover_image;
    if (profession !== undefined) updates.profession = profession;
    if (location !== undefined) updates.location = location;
    if (social_links && typeof social_links === 'object') {
      // SECURITY (audit M5): only persist http(s) links (and well-formed
      // emails). Strip javascript:/data:/etc so a stored value can never become
      // an XSS href on the public profile. Mirrors the client-side sanitiser.
      const clean = {};
      for (const [k, v] of Object.entries(social_links)) {
        const val = String(v ?? '').trim();
        if (!val) { clean[k] = ''; continue; }
        if (k === 'email') {
          clean[k] = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? val : '';
        } else if (/^https?:\/\//i.test(val)) {
          clean[k] = val;
        } else if (/^[a-z][a-z0-9+.-]*:/i.test(val)) {
          clean[k] = ''; // reject any non-http(s) scheme (javascript:, data:, …)
        } else {
          clean[k] = `https://${val}`; // bare domain → assume https
        }
      }
      updates.social_links = clean;
    }
    // Validate and store theme color. Plan-gated server-side (mirror of
    // client/src/utils/themeUtils.js — keep both palettes in sync):
    //   free/starter → 3 presets, creator → 16 presets, professional → any hex.
    // Invalid input is now a 400, not a silent drop (was the root cause of
    // "saved but colour never changed" reports).
    if (theme_color !== undefined && theme_color !== null && theme_color !== "") {
      if (!/^#[0-9a-fA-F]{6}$/.test(theme_color)) {
        return res.status(400).json({ message: "Invalid theme colour — expected a hex value like #FE5100." });
      }
      const FREE_PALETTE = ["#F8F7F2", "#6B7280", "#FE5100"];
      const CREATOR_PALETTE = [
        "#FE5100", "#2563EB", "#4F46E5", "#7C3AED", "#EC4899", "#DC2626",
        "#10B981", "#15803D", "#0F766E", "#0891B2", "#0284C7", "#F59E0B",
        "#EAB308", "#84CC16", "#475569", "#1F2937",
      ];
      const { data: planRow } = await supabaseAdmin
        .from("profiles").select("plan").eq("id", req.user.id).single();
      const plan = planRow?.plan || "explorer";
      const hex = theme_color.toUpperCase();
      const allowed =
        plan === "professional" ||
        (plan === "creator" && CREATOR_PALETTE.includes(hex)) ||
        (plan !== "creator" && plan !== "professional" && FREE_PALETTE.includes(hex));
      if (!allowed) {
        return res.status(403).json({ message: "This colour is not available on your plan. Upgrade to unlock more colours." });
      }
      updates.theme_color = hex;
    }

    if (reschedule_fee !== undefined) {
      const rf = Number(reschedule_fee);
      if (rf !== 0 && rf !== 10) return res.status(400).json({ message: 'reschedule_fee must be 0 or 10' });
      updates.reschedule_fee = rf;
    }

    let result = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();

    // Graceful fallback: if theme_color column doesn't exist yet, retry without it
    if (result.error && /Could not find the '(theme_color)' column/i.test(result.error.message)) {
      const { theme_color: _tc, ...safeUpdates } = updates;
      result = await supabaseAdmin
        .from("profiles")
        .update(safeUpdates)
        .eq("id", req.user.id)
        .select()
        .single();
    }

    if (result.error) return safeError(res, result.error);

    // Record an auto-assigned initial username in history (no-op if already present).
    if (initialUsername) {
      await usernameService.recordInitialUsername(req.user.id, initialUsername);
    }

    res.json(result.data);
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/host/categories — current host's primary + categories
const getMyCategories = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('primary_category, categories')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json({
      primary_category: data?.primary_category || null,
      categories: Array.isArray(data?.categories) ? data.categories : [],
    });
  } catch (error) {
    safeError(res, error);
  }
};

// PUT /api/host/categories — plan-capped update; body { primary_category, categories }
const updateCategories = async (req, res) => {
  try {
    const plan = req.vendorPlan || 'starter';
    const max = await planService.getLimit(plan, 'categories'); // 0=locked, N, -1
    if (!max || max <= 0) {
      return res.status(403).json({
        message: 'Your plan does not allow changing your category. Contact admin to make a change.',
        upgrade_required: true,
        current_plan: plan,
      });
    }

    const { data: activeRows, error: actErr } = await supabaseAdmin
      .from('categories').select('slug').eq('status', 'active');
    if (actErr) throw actErr;
    const activeSlugs = (activeRows || []).map((r) => r.slug);

    const result = validateCategorySelection({
      primary_category: req.body.primary_category,
      categories: req.body.categories,
      activeSlugs,
      max,
    });
    if (!result.ok) return res.status(result.status).json({ message: result.message });

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        primary_category: result.primary_category,
        categories: result.categories,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select('primary_category, categories')
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// POST /api/host/services
const createService = async (req, res) => {
  try {
    // Service must sit inside one of the host's categories.
    const chk = await resolveAndValidateCategory(supabaseAdmin, req.user.id, req.body.category, { required: true });
    if (!chk.ok) return res.status(chk.status).json({ message: chk.message });

    // Whitelist fields explicitly -- avoids Supabase schema-cache errors (e.g. thumbnail_url)
    const {
      title,
      description,
      type,
      meeting_mode,
      duration,
      price,
      currency,
      thumbnail_url,
      grace_period_minutes,
    } = req.body;
    const payload = {
      host_id: req.user.id,
      title,
      description: description || "",
      type: type || "one_on_one",
      meeting_mode: meeting_mode || "online",
      duration: parseInt(duration) || 30,
      price: parseFloat(price) || 0,
      currency: currency || "INR",
      grace_period_minutes: parseInt(grace_period_minutes) || 10,
      category: chk.value,
    };
    if (thumbnail_url !== undefined) payload.thumbnail_url = thumbnail_url;

    const { data, error } = await insertServiceSafe(payload);

    if (error) return safeError(res, error);
    bustSitemapCache();
    res.status(201).json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// PUT /api/host/services/:id
const updateService = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      meeting_mode,
      duration,
      price,
      currency,
      is_active,
      thumbnail_url,
      grace_period_minutes,
    } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (meeting_mode !== undefined) updates.meeting_mode = meeting_mode;
    if (duration !== undefined) updates.duration = duration;
    if (price !== undefined) updates.price = price;
    if (currency !== undefined) updates.currency = currency;
    if (is_active !== undefined) updates.is_active = is_active;
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
    if (grace_period_minutes !== undefined)
      updates.grace_period_minutes = parseInt(grace_period_minutes) || 10;

    if (req.body.category !== undefined) {
      const chk = await resolveAndValidateCategory(supabaseAdmin, req.user.id, req.body.category, { required: false });
      if (!chk.ok) return res.status(chk.status).json({ message: chk.message });
      updates.category = chk.value;
    }

    const { data, error } = await updateServiceSafe(
      req.params.id,
      updates,
      req.user.id,
    );

    if (error) return safeError(res, error);
    bustSitemapCache();
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// DELETE /api/host/services/:id
const deleteService = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from("services")
      .delete()
      .eq("id", req.params.id)
      .eq("host_id", req.user.id);

    if (error) return safeError(res, error);
    bustSitemapCache();
    res.json({ message: "Service deleted" });
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/host/services
const getMyServices = async (req, res) => {
  try {
    let result = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("host_id", req.user.id)
      .order("created_at", { ascending: false });

    // Fallback if schema cache is stale
    if (result.error && /Could not find the|column.*does not exist/i.test(result.error.message)) {
      result = await supabaseAdmin
        .from("services")
        .select("id, host_id, title, description, type, duration, price, currency, meeting_mode, is_active, created_at, updated_at")
        .eq("host_id", req.user.id)
        .order("created_at", { ascending: false });
    }
    const { data, error } = result;

    if (error) return safeError(res, error);
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// PUT /api/host/availability
const setAvailability = async (req, res) => {
  try {
    const { weekly_schedule, blocked_dates, timezone, buffer_minutes } =
      req.body;

    // Upsert -- insert if not exists, update if exists
    const { data, error } = await supabaseAdmin
      .from("availability")
      .upsert(
        {
          host_id: req.user.id,
          weekly_schedule,
          blocked_dates,
          timezone,
          buffer_minutes: buffer_minutes ?? 0, // Task 13
          updated_at: new Date().toISOString(),
        },
        { onConflict: "host_id" },
      )
      .select()
      .single();

    if (error) return safeError(res, error);
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/host/:username/:slug -- single service by slug
const getServiceBySlug = async (req, res) => {
  try {
    const { data: host } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, name, username, tagline, profession, profile_image, cover_image, bio, location, social_links, badges, google_calendar_connected",
      )
      .eq("username", req.params.username)
      .eq("role", "host")
      .single();

    if (!host) return res.status(404).json({ message: "Host not found" });

    const { data: service } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("host_id", host.id)
      .eq("slug", req.params.slug)
      .eq("is_active", true)
      .single();

    if (!service) return res.status(404).json({ message: "Service not found" });

    const { data: availability } = await supabaseAdmin
      .from("availability")
      .select("*")
      .eq("host_id", host.id)
      .single();

    // Customer-facing booking charge = flat platform fee + GST (admin-editable).
    // Single source of truth so the booking summary matches what Razorpay charges.
    let bookingFee = 0, platformFee = 0, gstRate = 0;
    try {
      ({ platformFee, gstRate } = await getPlatformConfig());
      bookingFee = Math.round(platformFee * (1 + gstRate) * 100) / 100;
    } catch (_) { bookingFee = 0; }

    res.json({ host, service, availability, bookingFee, platformFee, gstRate });
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/host/search?q= -- Task 11: search vendors and services
const duplicateSearchVendors = async (req, res) => {
  try {
    const { q = "" } = req.query;
    if (!q.trim()) return res.json({ vendors: [], services: [] });

    const safe = sanitizeLikeTerm(q);
    if (!safe) return res.json({ vendors: [], services: [] });
    const term = `%${safe}%`;

    // Search vendor profiles
    const { data: vendors } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, name, username, profession, tagline, bio, profile_image, is_verified",
      )
      .eq("role", "host")
      .or(
        `name.ilike.${term},profession.ilike.${term},tagline.ilike.${term},bio.ilike.${term}`,
      )
      .limit(10);

    // Search services
    const { data: services } = await supabaseAdmin
      .from("services")
      .select(
        "id, title, description, price, duration, slug, thumbnail_url, profiles!services_host_id_fkey(name, username, profile_image)",
      )
      .eq("is_active", true)
      .or(`title.ilike.${term},description.ilike.${term}`)
      .limit(10);

    res.json({ vendors: vendors || [], services: services || [] });
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/host/availability -- Task: return existing availability for dashboard
const getAvailability = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("availability")
      .select("*")
      .eq("host_id", req.user.id)
      .single();
    if (error && error.code !== "PGRST116")
      return safeError(res, error);
    res.json(data || null);
  } catch (error) {
    safeError(res, error);
  }
};

// Duplicate legacy block below is kept inert by using distinct names.

// GET /api/host/search?q= -- Task 11
const searchVendors = async (req, res) => {
  try {
    const { q = "" } = req.query;
    if (!q.trim()) return res.json({ vendors: [], services: [] });
    const safe = sanitizeLikeTerm(q);
    if (!safe) return res.json({ vendors: [], services: [] });
    const term = `%${safe}%`;

    const { data: vendors } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, name, username, profession, tagline, bio, profile_image, is_verified",
      )
      .eq("role", "host")
      .or(
        `name.ilike.${term},profession.ilike.${term},tagline.ilike.${term},bio.ilike.${term}`,
      )
      .limit(10);

    const { data: services } = await supabaseAdmin
      .from("services")
      .select(
        "id, title, description, price, duration, slug, thumbnail_url, profiles!services_host_id_fkey(name, username, profile_image)",
      )
      .eq("is_active", true)
      .or(`title.ilike.${term},description.ilike.${term}`)
      .limit(10);

    res.json({ vendors: vendors || [], services: services || [] });
  } catch (error) {
    safeError(res, error);
  }
};

module.exports = {
  getHostProfile,
  updateProfile,
  getMyCategories,
  updateCategories,
  createService,
  updateService,
  deleteService,
  getMyServices,
  setAvailability,
  getAvailability,
  getServiceBySlug,
  searchVendors,
};

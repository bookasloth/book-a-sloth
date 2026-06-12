const { supabaseAdmin } = require("../config/supabase");

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
    /Could not find the '(grace_period_minutes|thumbnail_url)' column|column.*does not exist/i.test(
      result.error.message,
    )
  ) {
    const payloadCopy = { ...payload };
    delete payloadCopy.grace_period_minutes;
    delete payloadCopy.thumbnail_url;
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
    /Could not find the '(grace_period_minutes|thumbnail_url)' column|column.*does not exist/i.test(
      result.error.message,
    )
  ) {
    const updatesCopy = { ...updates };
    delete updatesCopy.grace_period_minutes;
    delete updatesCopy.thumbnail_url;
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
    const { data: host, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("username", req.params.username)
      .eq("role", "host")
      .single();

    if (error || !host)
      return res.status(404).json({ message: "Host not found" });

    // Task 10: Show unverified status but don't block -- client shows a banner
    // (flip host.is_verified to true in Admin -> Users to go fully live)

    // Strip sensitive fields
    delete host.google_access_token;
    delete host.google_refresh_token;
    delete host.otp_code;
    delete host.otp_expires_at;

    // Fetch services + availability in parallel
    const [servicesResult, { data: availability }] = await Promise.all([
      supabaseAdmin.from("services").select("*").eq("host_id", host.id).eq("is_active", true),
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

    res.json({ host, services: services || [], availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/host/profile -- update own profile
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      tagline,
      username,
      social_links,
      profile_image,
      cover_image,
      profession,
      location,
      theme_color,
    } = req.body;

    // Slugify and validate username
    let resolvedUsername = username ? slugifyUsername(username) : undefined;

    // If name provided but no username, check if this vendor has one; auto-generate if not
    if (!resolvedUsername && name) {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('username')
        .eq('id', req.user.id)
        .single();
      if (!existing?.username) {
        resolvedUsername = await uniqueProfileSlug(slugifyUsername(name), req.user.id);
      }
    }

    // Check slug uniqueness (if user explicitly provided a username)
    if (resolvedUsername) {
      const taken = await uniqueProfileSlug(resolvedUsername, req.user.id);
      if (taken !== resolvedUsername) {
        return res.status(400).json({ message: `Username "${resolvedUsername}" is already taken. Try "${taken}".` });
      }
    }

    const updates = { updated_at: new Date().toISOString() }; // BUG-05 fixed: removed forced role:"host"
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (tagline !== undefined) updates.tagline = tagline;
    if (resolvedUsername) updates.username = resolvedUsername;
    if (profile_image !== undefined) updates.profile_image = profile_image;
    if (cover_image !== undefined) updates.cover_image = cover_image;
    if (profession !== undefined) updates.profession = profession;
    if (location !== undefined) updates.location = location;
    if (social_links) updates.social_links = social_links;
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

    if (result.error) return res.status(500).json({ message: result.error.message });
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/host/services
const createService = async (req, res) => {
  try {
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
    };
    if (thumbnail_url !== undefined) payload.thumbnail_url = thumbnail_url;

    const { data, error } = await insertServiceSafe(payload);

    if (error) return res.status(500).json({ message: error.message });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    const { data, error } = await updateServiceSafe(
      req.params.id,
      updates,
      req.user.id,
    );

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    if (error) return res.status(500).json({ message: error.message });
    res.json({ message: "Service deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/host/:username/:slug -- single service by slug
const getServiceBySlug = async (req, res) => {
  try {
    const { data: host } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, name, email, username, tagline, profession, profile_image, cover_image, bio, location, social_links, badges, google_calendar_connected",
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

    res.json({ host, service, availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/host/search?q= -- Task 11: search vendors and services
const duplicateSearchVendors = async (req, res) => {
  try {
    const { q = "" } = req.query;
    if (!q.trim()) return res.json({ vendors: [], services: [] });

    const term = `%${q.trim()}%`;

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
    res.status(500).json({ message: error.message });
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
      return res.status(500).json({ message: error.message });
    res.json(data || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Duplicate legacy block below is kept inert by using distinct names.

// GET /api/host/search?q= -- Task 11
const searchVendors = async (req, res) => {
  try {
    const { q = "" } = req.query;
    if (!q.trim()) return res.json({ vendors: [], services: [] });
    const term = `%${q.trim()}%`;

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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHostProfile,
  updateProfile,
  createService,
  updateService,
  deleteService,
  getMyServices,
  setAvailability,
  getAvailability,
  getServiceBySlug,
  searchVendors,
};

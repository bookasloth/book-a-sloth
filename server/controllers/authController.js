const { supabaseAdmin, signInWithPassword, mintSessionForEmail } = require("../config/supabase");
const { safeError } = require('../utils/httpError');
const {
  getAuthUrl,
  getTokensFromCode,
  getCalendarTimezone,
  oauth2Client,
} = require("../config/google");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { encrypt: encryptToken } = require("../utils/cryptoTokens");

// HMAC secret for the OAuth `state` parameter (CSRF protection on the Google
// round-trip). Dedicated env var preferred; service-role key is a safe,
// always-present fallback (server-side only, never sent to the browser).
const OAUTH_STATE_SECRET =
  process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
const sendEmail = require("../utils/sendEmail");
const otpStore = require("../utils/otpStore");
const { sendOtpNotification } = require("../utils/notify");
const NotificationEngine = require("../services/notificationEngine");

// ─── Per-account login lockout constants ───────────────────────────────────
const LOGIN_MAX_FAILED = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

// ─── Profile slug helpers (inline to avoid circular deps) ──────────────────
const slugifyUsername = (text) =>
  text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/--+/g, '-').slice(0, 60);

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

// Serialise a DB profile row into the shape stored in localStorage / returned by all auth endpoints.
// Always include plan so the frontend can gate plan-based features.
const serializeProfile = (profile, session) => ({
  _id:                      profile.id,
  id:                       profile.id,
  name:                     profile.name,
  email:                    profile.email,
  phone:                    profile.phone || null,
  password_set:             !!profile.password_set,
  role:                     profile.role,
  plan:                     profile.plan || 'explorer',
  plan_expires_at:          profile.plan_expires_at || null,
  billing_cadence:          profile.billing_cadence || null,
  subscription_status:      profile.subscription_status || null,
  current_period_end:       profile.current_period_end || null,
  // True only when a real Razorpay mandate exists. Legacy one-time annual
  // vendors are 'active' from the v3.8 backfill but carry NO mandate — the UI
  // uses this to avoid showing them a bogus "auto-renew on / cancel" control.
  has_payment_mandate:      !!profile.razorpay_subscription_id,
  username:                 profile.username || null,
  bio:                      profile.bio || '',
  tagline:                  profile.tagline || '',
  profession:               profile.profession || '',
  location:                 profile.location || '',
  profile_image:            profile.profile_image || '',
  cover_image:              profile.cover_image || '',
  social_links:             profile.social_links || {},
  theme_color:              profile.theme_color || null,
  google_calendar_connected:!!profile.google_calendar_connected,
  is_verified:              !!profile.is_verified,
  whatsapp_verified:        !!profile.whatsapp_verified,
  whatsapp_number:          profile.whatsapp_number || null,
  badges:                   profile.badges || [],
  ...(session ? { token: session.access_token, refresh_token: session.refresh_token } : {}),
});

const upsertProfile = async ({ id, name, email, role, username }) => {
  // Auto-generate profile slug from name if not supplied
  const slug = username || await uniqueProfileSlug(slugifyUsername(name), id);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id,
        name,
        email: email.toLowerCase().trim(),
        role,
        username: slug,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

// Ensure a guest profile (and its underlying auth user) exists for an email.
// Idempotent and resilient: handles the "auth user already exists but the
// profiles row is missing" case that previously made verify-otp return 404.
// Returns the profile row, or null if it genuinely can't be created (callers
// treat null as a guest with no linked account — the booking still works).
const ensureGuestProfile = async (email, name = "Guest") => {
  const normalizedEmail = (email || "").toLowerCase().trim();
  if (!normalizedEmail) return null;
  const guestName = name || "Guest";

  // 1. Profile already exists → done.
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, role, username")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (existing) return existing;

  // 2. Resolve (or create) the underlying auth user id.
  let userId = null;
  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email: normalizedEmail,
    password: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    email_confirm: true,
    user_metadata: { name: guestName },
  });
  if (!createErr && created?.user?.id) {
    userId = created.user.id;
  } else {
    // Auth user already exists (e.g. orphaned by an earlier attempt). Resolve
    // its id via generateLink, which returns the user object without sending mail.
    try {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
      });
      userId = linkData?.user?.id || null;
    } catch (_) {
      userId = null;
    }
  }
  if (!userId) return null;

  // 3. Create the profile row (or fetch it if it raced into existence).
  try {
    return await upsertProfile({ id: userId, name: guestName, email: normalizedEmail, role: "guest" });
  } catch (_) {
    const { data: again } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, role, username")
      .eq("id", userId)
      .maybeSingle();
    return again || null;
  }
};

// ============================================
// VENDOR REGISTRATION (with Google Calendar)
// ============================================

// POST /api/auth/register/vendor
const registerVendor = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    // Guard: prevent a guest account from being upgraded to vendor via re-registration
    const { data: existing } = await supabaseAdmin
      .from('profiles').select('id, role').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (existing) {
      if (existing.role === 'guest')
        return res.status(409).json({ message: 'This email is registered as a user account. Vendors and users must use separate email addresses.' });
      return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

    if (authError) return res.status(400).json({ message: authError.message });

    const profile = await upsertProfile({
      id: authData.user.id,
      name,
      email: authData.user.email || email,
      role: "host",
    });

    // Sign in to get session (disposable client — never poisons supabaseAdmin)
    const { data: signInData, error: signInError } =
      await signInWithPassword(email, password);
    if (signInError)
      return res.status(500).json({ message: signInError.message });

    res.status(201).json(serializeProfile(profile, signInData.session));
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/auth/google — legacy flow: a LOGGED-IN vendor connects their
// calendar from the dashboard/onboarding. Returns the consent URL.
// State is signed so the callback can verify origin (CSRF) and knows which
// vendor to attach the tokens to (no more email-collision risk).
const googleAuth = (req, res) => {
  const state = jwt.sign(
    { flow: "calendar_connect", uid: req.user.id },
    OAUTH_STATE_SECRET,
    { expiresIn: "15m" },
  );
  const url = getAuthUrl(state);
  res.json({ url });
};

// GET /api/auth/google/vendor?intent=signup|login — PUBLIC vendor auth entry.
// One consent screen requests identity + full calendar scopes; the callback
// creates or logs in the vendor. No password ever exists for these accounts.
const googleVendorAuth = (req, res) => {
  const intent = req.query.intent === "signup" ? "signup" : "login";
  const state = jwt.sign(
    { flow: "vendor_auth", intent },
    OAUTH_STATE_SECRET,
    { expiresIn: "15m" },
  );
  res.json({ url: getAuthUrl(state) });
};

// Seed onboarding state for a brand-new Google vendor so ProtectedRoute walks
// them through the remaining steps (type → category → booking-type → [calendar
// auto-skips] → profile → first-service → plans). onboarding_slug = username
// (already unique). Schema-guarded: if the onboarding columns don't exist
// (pre-onboarding DB) the vendor simply lands on the dashboard — no crash.
const markGoogleVendorOnboarding = async (profileId, username) => {
  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        onboarding_slug: username,
        onboarding_step_completed: 3, // next page = /vendor-register/:slug/type
        onboarding_completed: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);
    if (error && !/Could not find the|column.*does not exist/i.test(error.message)) {
      console.error("markGoogleVendorOnboarding error (non-fatal):", error.message);
    }
  } catch (e) {
    console.error("markGoogleVendorOnboarding threw (non-fatal):", e.message);
  }
};

// Shared: exchange code, fetch Google identity. Returns { tokens, googleUser }.
const exchangeGoogleCode = async (code) => {
  const tokens = await getTokensFromCode(code);
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
  auth.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth });
  const { data: googleUser } = await oauth2.userinfo.get();
  return { tokens, googleUser };
};

// Persist Google tokens (+ google_id when the column exists) on a profile and
// best-effort seed the vendor's timezone from their Google Calendar settings.
const attachGoogleToProfile = async (profileId, tokens, googleUser) => {
  // Tokens are encrypted at rest (AES-256-GCM). Reads decrypt at point of use
  // in availabilityService + bookingController.
  const base = {
    google_access_token: encryptToken(tokens.access_token),
    google_refresh_token: encryptToken(tokens.refresh_token),
    google_calendar_connected: true,
    updated_at: new Date().toISOString(),
  };
  let { error } = await supabaseAdmin
    .from("profiles")
    .update({ ...base, google_id: googleUser.id || null })
    .eq("id", profileId);
  // Pre-v2.5 DB without google_id — retry without it (schema fallback pattern)
  if (error && /Could not find the|column.*does not exist/i.test(error.message)) {
    ({ error } = await supabaseAdmin.from("profiles").update(base).eq("id", profileId));
  }
  if (error) throw error;

  // Timezone: only seed if the vendor has no availability row yet (never
  // overwrite a timezone the vendor chose in the dashboard).
  try {
    const { data: avail } = await supabaseAdmin
      .from("availability").select("host_id").eq("host_id", profileId).maybeSingle();
    if (!avail) {
      const tz = await getCalendarTimezone(tokens.access_token, tokens.refresh_token);
      if (tz) {
        await supabaseAdmin.from("availability").upsert(
          { host_id: profileId, timezone: tz, updated_at: new Date().toISOString() },
          { onConflict: "host_id" },
        );
      }
    }
  } catch (tzErr) {
    console.error("google timezone seed (non-fatal):", tzErr.message);
  }
};

// GET /api/auth/google/callback — single callback for BOTH flows, branched on
// the signed state param. Invalid/missing state on a vendor-auth attempt is
// rejected (CSRF); legacy state attaches tokens to the vendor in the state.
const googleCallback = async (req, res) => {
  const clientUrl = process.env.CLIENT_URL || "";
  // Tracked outside the try so the catch can route failures to the right place:
  // a vendor-auth user is NOT logged in, so bouncing them to /dashboard is a
  // dead-end — they must land back on /login-as-vendor.
  let isVendorAuthFlow = false;
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).json({ message: "No code provided" });

    let statePayload = null;
    if (state) {
      try {
        statePayload = jwt.verify(state, OAUTH_STATE_SECRET);
      } catch (_) {
        return res.redirect(`${clientUrl}/login-as-vendor?error=invalid_state`);
      }
    }
    isVendorAuthFlow = statePayload?.flow === "vendor_auth";

    const { tokens, googleUser } = await exchangeGoogleCode(code);
    const googleEmail = (googleUser.email || "").toLowerCase().trim();
    if (!googleEmail) {
      return res.redirect(`${clientUrl}/login-as-vendor?error=no_email`);
    }

    // ── Flow A: vendor signup/login via Google ──────────────────────────────
    if (statePayload?.flow === "vendor_auth") {
      const { data: existing } = await supabaseAdmin
        .from("profiles").select("id, role, email").eq("email", googleEmail).maybeSingle();

      if (existing && existing.role !== "host") {
        // Email belongs to a customer account — vendors and customers are
        // separate actors with separate identities.
        return res.redirect(`${clientUrl}/login-as-vendor?error=customer_email`);
      }

      let profileId = existing?.id || null;
      if (!profileId) {
        // Auto-create the vendor: auth user (no usable password) + host profile
        const { data: created, error: createErr } =
          await supabaseAdmin.auth.admin.createUser({
            email: googleEmail,
            password: `goog_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            email_confirm: true,
            user_metadata: { name: googleUser.name || googleEmail.split("@")[0] },
          });
        if (createErr || !created?.user?.id) {
          console.error("google vendor create error:", createErr?.message);
          return res.redirect(`${clientUrl}/login-as-vendor?error=create_failed`);
        }
        const profile = await upsertProfile({
          id: created.user.id,
          name: googleUser.name || googleEmail.split("@")[0],
          email: googleEmail,
          role: "host",
        });
        profileId = profile.id;

        // Drop the new Google vendor into a SLIM onboarding: identity + password
        // (steps 1–2) are satisfied by Google, and the calendar step (6)
        // auto-skips because google_calendar_connected is set below. They
        // resume at step 3 (vendor type). onboarding_step_completed = 3 makes
        // ProtectedRoute route them to /vendor-register/:slug/type next.
        await markGoogleVendorOnboarding(profileId, profile.username);
      }

      await attachGoogleToProfile(profileId, tokens, googleUser);

      // Mint a Supabase session without a password (magiclink redeem on a
      // disposable client). Tokens travel in the URL FRAGMENT — never logged.
      const session = await mintSessionForEmail(googleEmail);
      const isNew = !existing;
      return res.redirect(
        `${clientUrl}/auth/google/done#access_token=${encodeURIComponent(session.access_token)}` +
        `&refresh_token=${encodeURIComponent(session.refresh_token)}&new=${isNew ? "1" : "0"}`,
      );
    }

    // ── Flow B: legacy calendar connect for a logged-in vendor ──────────────
    // Signed state carries the vendor id — exact attach, no email matching.
    // No state at all = pre-deploy URL or forged request → fall back to the
    // old email match ONLY when a host profile exists for that email.
    let targetId = statePayload?.flow === "calendar_connect" ? statePayload.uid : null;
    if (!targetId) {
      const { data: byEmail } = await supabaseAdmin
        .from("profiles").select("id, role").eq("email", googleEmail).maybeSingle();
      if (!byEmail || byEmail.role !== "host") {
        return res.redirect(`${clientUrl}/dashboard?google=error&reason=profile_not_found`);
      }
      targetId = byEmail.id;
    }

    await attachGoogleToProfile(targetId, tokens, googleUser);
    res.redirect(`${clientUrl}/dashboard?google=connected`);
  } catch (error) {
    console.error("google callback error:", error.message);
    // Vendor-auth failures (e.g. session mint failed) → back to vendor login,
    // NOT the dashboard (which would bounce an unauthenticated user to /login).
    if (isVendorAuthFlow) {
      return res.redirect(`${clientUrl}/login-as-vendor?error=auth_failed`);
    }
    res.redirect(
      `${clientUrl}/dashboard?google=error&reason=${encodeURIComponent(error.message)}`,
    );
  }
};

// ============================================
// USER REGISTRATION (simple email/password)
// ============================================

// POST /api/auth/register/user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });

    // Guard: prevent a vendor from re-registering as a guest with the same email
    const { data: existing } = await supabaseAdmin
      .from('profiles').select('id, role').eq('email', email.toLowerCase().trim()).maybeSingle();
    if (existing) {
      if (existing.role === 'host')
        return res.status(409).json({ message: 'This email belongs to a vendor account. Users and vendors must use separate email addresses.' });
      return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

    if (authError) return res.status(400).json({ message: authError.message });

    const profile = await upsertProfile({
      id: authData.user.id,
      name,
      email: authData.user.email || email,
      role: "guest",
    });

    const { data: signInData, error: signInError } =
      await signInWithPassword(email, password);
    if (signInError)
      return res.status(500).json({ message: signInError.message });

    res.status(201).json(serializeProfile(profile, signInData.session));
  } catch (error) {
    safeError(res, error);
  }
};

// ============================================
// OTP FLOW (for guest booking without signup)
// ============================================

// Customer identity = mobile number. The OTP record is keyed by the
// normalised phone when one is provided (email stays the fallback for older
// clients still in the wild). Delivery goes to WhatsApp AND email — whichever
// channels the Notification Engine has enabled — so OTP always arrives.
const normalizePhone = (p) => {
  const cleaned = String(p || "").replace(/[\s\-().]/g, "");
  return /^\+?\d{8,15}$/.test(cleaned) ? cleaned : null;
};
const otpIdentifier = ({ email, phone }) => normalizePhone(phone) || (email || "").toLowerCase().trim();

// POST /api/auth/send-otp — sends OTP to guest's phone (WhatsApp) + email
const sendOtp = async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    if (!email && !normalizePhone(phone))
      return res.status(400).json({ message: "A valid mobile number or email is required" });

    const identifier = otpIdentifier({ email, phone });
    const otp = otpStore.generate();
    // Securely stored: bcrypt hash, 3 attempts, 3 sends/hour, 15-min lockout
    const stored = await otpStore.set(identifier, otp);
    if (stored && stored.ok === false) return res.status(429).json({ message: stored.reason });

    // Ensure a guest profile exists BEFORE responding so verifyOtp can link the
    // booking. Best-effort and resilient (handles orphaned auth users); a failure
    // here must never block OTP delivery.
    try {
      if (email) await ensureGuestProfile(email, name);
    } catch (profileErr) {
      console.error("send-otp: ensureGuestProfile error (non-fatal):", profileErr.message);
    }

    // Email rendered from the BOOKING_OTP DB template by the Communication Engine.
    await sendOtpNotification({ email, phone, name, otp });

    res.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("send-otp error:", error);
    safeError(res, error);
  }
};

// POST /api/auth/verify-otp — verifies OTP from Supabase
const verifyOtp = async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    if ((!email && !normalizePhone(phone)) || !otp)
      return res.status(400).json({ message: "Mobile number (or email) and OTP required" });

    // Validate against the same identifier the code was issued under
    // (phone-first; email for older clients).
    const result = await otpStore.verify(otpIdentifier({ email, phone }), otp);
    if (!result.valid) {
      return res.status(400).json({ message: result.reason });
    }

    // The email is now verified. Ensure a guest profile exists so the booking can
    // be linked to a guest account — but NEVER fail verification if it can't be
    // created. A verified email is enough; the booking proceeds with a null
    // guest_id in the worst case.
    let profile = null;
    try {
      if (email) profile = await ensureGuestProfile(email);
    } catch (e) {
      console.error("verify-otp: ensureGuestProfile error (non-fatal):", e.message);
    }

    res.json({
      message: "OTP verified",
      verified: true,
      user: profile
        ? {
            _id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            username: profile.username,
          }
        : { _id: null, email: (email || "").toLowerCase().trim(), role: "guest" },
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    safeError(res, error);
  }
};

// ============================================
// PHONE-PRIMARY USER LOGIN
// ============================================

// Synthetic Supabase auth email for a phone-only account. Internal artifact —
// the user never sees or types it. Deterministic from the e164 digits so it is
// idempotent across create-or-resolve.
const syntheticPhoneEmail = (phone) =>
  `p${String(phone).replace(/\D/g, "")}@users.bookasloth.app`;

// Find the guest profile for a phone, creating one if none exists. Order matters
// to avoid duplicate accounts:
//   1. profiles.phone match
//   2. a past booking's guest_phone → its guest profile (link phone onto it)
//   3. create a fresh guest (synthetic email + temp password)
// The profiles_phone_unique_idx (v3.1) is the DB-level backstop against races.
const findOrCreateProfileByPhone = async (normalizedPhone) => {
  // 1. Direct match on the unique phone column.
  const { data: byPhone } = await supabaseAdmin
    .from("profiles").select("*").eq("phone", normalizedPhone).maybeSingle();
  if (byPhone) return byPhone;

  // 2. Returning guest who booked before phone-login existed: link via booking.
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("guest_id")
    .eq("guest_phone", normalizedPhone)
    .not("guest_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (booking?.guest_id) {
    const { data: linked } = await supabaseAdmin
      .from("profiles").select("*").eq("id", booking.guest_id).maybeSingle();
    if (linked) {
      await supabaseAdmin
        .from("profiles")
        .update({ phone: normalizedPhone, updated_at: new Date().toISOString() })
        .eq("id", linked.id);
      return { ...linked, phone: normalizedPhone };
    }
  }

  // 3. Brand-new phone account. Username is derived from the (unique) phone, so
  // no slug-uniqueness round-trip is needed.
  const email = syntheticPhoneEmail(normalizedPhone);
  const digits = String(normalizedPhone).replace(/\D/g, "");
  const { data: created } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    email_confirm: true,
    user_metadata: { name: "Guest" },
  });
  const userId = created?.user?.id;
  if (!userId) throw new Error("Could not create account");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        name: "Guest",
        email,
        role: "guest",
        username: `user-${digits}`,
        phone: normalizedPhone,
        password_set: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();
  return profile;
};

// POST /api/auth/login-phone — end-user login with phone + password
const loginWithPhone = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ message: "Phone and password are required" });
    const normalized = normalizePhone(phone);
    if (!normalized)
      return res.status(400).json({ message: "A valid mobile number is required" });

    const { data: profile } = await supabaseAdmin
      .from("profiles").select("*").eq("phone", normalized).maybeSingle();

    // Enumeration-resistant: do NOT reveal whether the number exists or its role.
    // No account and a non-guest account both return the same 401 as a wrong password.
    if (!profile || profile.role !== "guest") {
      // Equalize response time with the real wrong-password path (which makes a
      // signInWithPassword round-trip) so an attacker can't time-distinguish a
      // registered guest from an unknown/non-guest number.
      await signInWithPassword("nonexistent@bookasloth.invalid", String(password)).catch(() => {});
      return res.status(401).json({ message: "Invalid phone or password" });
    }
    if (!profile.password_set) {
      return res.status(409).json({ needsPassword: true, message: "Set a password to continue." });
    }

    // ── Per-account lockout check ─────────────────────────────────────────────
    if (profile.login_locked_until && new Date(profile.login_locked_until).getTime() > Date.now()) {
      const mins = Math.ceil((new Date(profile.login_locked_until).getTime() - Date.now()) / 60000);
      return res.status(429).json({ message: `Too many attempts. Try again in ${mins} minute(s).` });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { data, error } = await signInWithPassword(profile.email, password);
    if (error) {
      const failed = (profile.failed_login_count || 0) + 1;
      const patch = { failed_login_count: failed };
      if (failed >= LOGIN_MAX_FAILED) {
        patch.login_locked_until = new Date(Date.now() + LOGIN_LOCK_MS).toISOString();
      }
      await supabaseAdmin.from('profiles').update(patch).eq('id', profile.id);
      return res.status(401).json({ message: "Invalid phone or password" });
    }

    // Reset counters on success
    await supabaseAdmin
      .from('profiles')
      .update({ failed_login_count: 0, login_locked_until: null })
      .eq('id', profile.id);

    res.json(serializeProfile(profile, data.session));
  } catch (error) {
    safeError(res, error);
  }
};

// POST /api/auth/verify-otp-login — verify phone OTP and issue a session.
// Unlike verify-otp (booking), this finds-or-creates by phone and mints a real
// session so the user is logged in.
const verifyOtpLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const normalized = normalizePhone(phone);
    if (!normalized || !otp)
      return res.status(400).json({ message: "Mobile number and OTP are required" });

    const result = await otpStore.verify(normalized, otp);
    if (!result.valid)
      return res.status(400).json({ message: result.reason });

    const profile = await findOrCreateProfileByPhone(normalized);
    if (!profile)
      return res.status(500).json({ message: "Could not access your account" });
    if (profile.role !== "guest")
      return res.status(409).json({ message: "This number is registered as a vendor. Please use vendor login." });

    const session = await mintSessionForEmail(profile.email);
    res.json(serializeProfile(profile, session));
  } catch (error) {
    safeError(res, error);
  }
};

// POST /api/auth/set-password — logged-in user sets a real password so they can
// log in with phone + password next time (flips password_set).
const setPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters" });

    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user.id, { password });
    if (error) return res.status(400).json({ message: error.message });

    await supabaseAdmin
      .from("profiles")
      .update({ password_set: true, updated_at: new Date().toISOString() })
      .eq("id", req.user.id);

    res.json({ ok: true });
  } catch (error) {
    safeError(res, error);
  }
};

// ============================================
// SHARED: LOGIN & GET ME
// ============================================

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Per-account lockout check (distributed brute-force defence) ──────────
    const emailKey = String(email || '').toLowerCase().trim();
    const { data: pre } = await supabaseAdmin
      .from('profiles')
      .select('id, email, failed_login_count, login_locked_until')
      .eq('email', emailKey)
      .maybeSingle();

    if (pre?.login_locked_until && new Date(pre.login_locked_until).getTime() > Date.now()) {
      const mins = Math.ceil((new Date(pre.login_locked_until).getTime() - Date.now()) / 60000);
      return res.status(429).json({ message: `Too many attempts. Try again in ${mins} minute(s).` });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { data, error } = await signInWithPassword(email, password);
    if (error) {
      if (pre) {
        const failed = (pre.failed_login_count || 0) + 1;
        const patch = { failed_login_count: failed };
        if (failed >= LOGIN_MAX_FAILED) {
          patch.login_locked_until = new Date(Date.now() + LOGIN_LOCK_MS).toISOString();
        }
        await supabaseAdmin.from('profiles').update(patch).eq('id', pre.id);
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Reset counters on success
    await supabaseAdmin
      .from('profiles')
      .update({ failed_login_count: 0, login_locked_until: null })
      .eq('id', data.user.id);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    res.json(serializeProfile(profile, data.session));
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const PERF = process.env.PERF_LOG !== "false";
  try {
    const t0 = process.hrtime.bigint();
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();
    if (PERF) {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      console.log(`[perf:me] profiles.select(id=${req.user.id}) → ${ms.toFixed(1)}ms`);
    }

    if (error || !profile) return res.status(404).json({ message: "Profile not found" });
    // Return the same serialized shape as login/register so the client can merge it cleanly
    res.json(serializeProfile(profile, null));
  } catch (error) {
    safeError(res, error);
  }
};

// PUT /api/auth/me
// Self-service profile edit for any logged-in user (guest or host). Only a
// small allow-list of personal fields is writable here — never role, plan,
// username, etc. Email is intentionally NOT editable (it's the auth identity).
const updateMe = async (req, res) => {
  try {
    const { name, phone, profile_image } = req.body;
    const patch = { updated_at: new Date().toISOString() };
    if (name !== undefined)          patch.name = String(name).trim();
    if (phone !== undefined)         patch.phone = phone ? String(phone).trim() : null;
    if (profile_image !== undefined) patch.profile_image = profile_image || null;

    if (patch.name === "") return res.status(400).json({ message: "Name cannot be empty" });

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("id", req.user.id)
      .select("*")
      .single();
    if (error || !profile) return safeError(res, error || new Error("Update failed"));
    res.json(serializeProfile(profile, null));
  } catch (error) {
    safeError(res, error);
  }
};

// ============================================
// PASSWORD RESET (OTP-based, all user types)
// ==========================================

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const normalizedEmail = email.toLowerCase().trim();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email")
      .eq("email", normalizedEmail)
      .single();

    // Always return success to prevent email enumeration
    if (!profile) {
      return res.json({ message: "If that email exists, an OTP has been sent." });
    }

    // Respect an active reset lockout: re-requesting a code must NOT clear it,
    // otherwise the per-code attempt lockout in resetPassword is trivially
    // bypassable (guess N times → request new code → repeat). While locked we
    // issue nothing and leave attempts/locked_until intact.
    const { data: existingOtp } = await supabaseAdmin
      .from("otp_codes")
      .select("locked_until")
      .eq("email", normalizedEmail)
      .maybeSingle();
    if (existingOtp?.locked_until && new Date(existingOtp.locked_until) > new Date()) {
      return res.json({ message: "If that email exists, an OTP has been sent." });
    }

    // CSPRNG 6-digit code; stored only as a bcrypt hash (never plaintext).
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    const { error: otpError } = await supabaseAdmin
      .from("otp_codes")
      .upsert(
        {
          email: normalizedEmail,
          otp: "",                 // legacy plaintext column kept empty
          otp_hash: otpHash,
          attempts: 0,
          locked_until: null,
          type: "password_reset",
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (otpError) {
      // Pre-v1.9 DB without otp_hash/attempts/locked_until — degrade to the
      // legacy plaintext column so reset still works (resetPassword reads both).
      if (/Could not find the|column.*does not exist/i.test(otpError.message || "")) {
        const { error: legacyErr } = await supabaseAdmin
          .from("otp_codes")
          .upsert(
            {
              email: normalizedEmail,
              otp,
              type: "password_reset",
              expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );
        if (legacyErr) {
          console.error("forgot-password: OTP store error:", legacyErr.message);
          return res.status(500).json({ message: "Failed to send reset code. Please try again." });
        }
      } else {
        console.error("forgot-password: OTP store error:", otpError.message);
        return res.status(500).json({ message: "Failed to send reset code. Please try again." });
      }
    }

    // Email rendered from the PASSWORD_RESET DB template; immediate (waiting user).
    await NotificationEngine.send({
      event: 'PASSWORD_RESET',
      data: {
        email: normalizedEmail,
        emailData: { otp: String(otp) },
        emailUser: { email: normalizedEmail, name: profile.name },
        immediateEmail: true,
      },
    });

    res.json({ message: "If that email exists, an OTP has been sent." });
  } catch (error) {
    console.error("forgot-password error:", error);
    res.status(500).json({ message: "Failed to send reset code. Please try again." });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    // Match the registration password policy (8+ chars, upper + number).
    if (
      newPassword.length < 8 ||
      newPassword.length > 128 ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    )
      return res.status(400).json({
        message: "Password must be 8–128 characters and include an uppercase letter and a number",
      });

    const normalizedEmail = email.toLowerCase().trim();

    const { data: record } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (!record)
      return res.status(400).json({ message: "No reset code found. Request a new one." });
    if (record.type && record.type !== "password_reset")
      return res.status(400).json({ message: "Invalid reset code." });

    // Lockout after too many wrong attempts (brute-force protection).
    const MAX_RESET_ATTEMPTS = 5;
    const LOCKOUT_MS = 15 * 60 * 1000;
    if (record.locked_until && new Date(record.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(record.locked_until) - new Date()) / 60000);
      return res.status(429).json({ message: `Too many attempts. Try again in ${mins} minute(s).` });
    }
    if (new Date(record.expires_at) < new Date()) {
      await supabaseAdmin.from("otp_codes").delete().eq("email", normalizedEmail);
      return res.status(400).json({ message: "Reset code expired. Request a new one." });
    }

    // Compare against the bcrypt hash (v1.9) or the legacy plaintext column.
    const supplied = String(otp).trim();
    const matches = record.otp_hash
      ? await bcrypt.compare(supplied, record.otp_hash)
      : String(record.otp) === supplied;

    if (!matches) {
      const attempts = (record.attempts || 0) + 1;
      if (attempts >= MAX_RESET_ATTEMPTS) {
        await supabaseAdmin
          .from("otp_codes")
          .update({ attempts, locked_until: new Date(Date.now() + LOCKOUT_MS).toISOString() })
          .eq("email", normalizedEmail);
        return res.status(429).json({ message: "Too many incorrect attempts. Try again in 15 minutes." });
      }
      // Best-effort attempt increment (no-op on pre-v1.9 schemas without the column).
      await supabaseAdmin.from("otp_codes").update({ attempts }).eq("email", normalizedEmail);
      return res.status(400).json({ message: "Invalid reset code." });
    }

    await supabaseAdmin.from("otp_codes").delete().eq("email", normalizedEmail);

    // BUG-06 fixed: use profile.id (= Supabase auth user id) instead of listUsers() which only returns first 1000
    const { data: profileForReset } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .single();
    if (!profileForReset) return res.status(404).json({ message: "User not found." });

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(profileForReset.id, {
      password: newPassword,
    });
    if (updateError) return res.status(400).json({ message: updateError.message });

    // Security confirmation email (queued, non-blocking)
    NotificationEngine.send({
      event: 'SECURITY_PASSWORD_CHANGED',
      data: { email: normalizedEmail, emailUser: { email: normalizedEmail } },
    }).catch((e) => console.error('password-changed email error:', e.message));

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    console.error("reset-password error:", error);
    safeError(res, error);
  }
};

module.exports = {
  registerVendor,
  registerUser,
  googleAuth,
  googleVendorAuth,
  googleCallback,
  sendOtp,
  verifyOtp,
  login,
  loginWithPhone,
  verifyOtpLogin,
  setPassword,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
};

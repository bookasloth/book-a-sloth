const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { supabaseAdmin, signInWithPassword } = require("../config/supabase");
const { sendWhatsAppOtp } = require("../utils/notify");
const communicationEngine = require("../services/email/communicationEngine");
const otpStore = require("../utils/otpStore");
const { isReserved } = require("../utils/reservedUsernames");
const usernameService = require("../services/usernameService");
const planService = require("../services/planService");

// ─── Slug validation & generation ───────────────────────────────────────
const isValidSlug = (slug) => {
  // URL-safe: lowercase, no spaces, alphanumeric + hyphens
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 60;
};

const checkSlugAvailable = async (slug) => {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("onboarding_slug", slug)
    .maybeSingle();
  return !data;
};

const generateUniqueSlug = async (baseName) => {
  let slug = baseName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/--+/g, "-")
    .slice(0, 50);

  let i = 2;
  let attempts = 0;
  while (true) {
    const available = await checkSlugAvailable(slug);
    if (available) return slug;
    // Bound the loop (audit P3): after 50 tries, append a random suffix and stop
    // rather than spinning forever on a pathological collision set.
    if (++attempts > 50) return `${slug.slice(0, 40)}-${crypto.randomBytes(3).toString("hex")}`;
    slug = `${slug.slice(0, 45)}-${i++}`;
  }
};

// ─── Authed Slug Availability (history-backed, self-aware) ─────────────────
// Used by POST /api/onboarding/slug-available (requires auth).
// Returns { available: true } when:
//   a) the slug is free globally, OR
//   b) the caller owns it (idempotent — lets them re-confirm the seeded name).
// Returns { available: false, reason } for invalid/reserved/taken-by-someone-else.
//
// WHY this replaces checkSlugAvailable for the live-feedback route:
//   checkSlugAvailable queries `profiles WHERE onboarding_slug = slug`.
//   On Google signup markGoogleVendorOnboarding seeds onboarding_slug = auto-name.
//   So the host's OWN pre-filled slug immediately returns available:false — bugged.
//   Additionally checkSlugAvailable ignores username_history, disagreeing with
//   claimSlug's authority on taken names (divergence between feedback and enforce).
const slugAvailableForUser = async (vendorId, slug) => {
  const clean = (slug || '').toLowerCase().trim();
  if (!isValidSlug(clean)) return { available: false, reason: 'invalid' };
  if (isReserved(clean))   return { available: false, reason: 'reserved' };
  // History-backed: rejects names that are current OR retired in username_history.
  // Allow the caller's own name through (self-aware / idempotent).
  const owner = await usernameService.usernameOwner(clean);
  if (owner && owner !== vendorId) return { available: false, reason: 'taken' };
  return { available: true };
};

// ─── Authed Slug Claim (Google flow, step 2) ─────────────────────────────
// Called after Google auth confirms identity (step 1). Claims a slug for the
// authenticated vendor, advances to step 2, and makes /<slug> the host's live
// public profile URL.
//
// Why we don't call usernameService.changeUsername here:
//   The change_username RPC enforces WhatsApp-verified gate, 2/365-day cap, and
//   6-month gap. None apply to onboarding — this is the host's FIRST real name
//   choice (the auto name from upsertProfile was a placeholder). We call
//   usernameService.setOnboardingUsername instead, which atomically swaps the
//   history row (source='onboarding') without triggering the gating rules.
const claimSlug = async (vendorId, slug) => {
  const clean = (slug || "").toLowerCase().trim();
  if (!isValidSlug(clean)) {
    throw new Error("Slug must be lowercase, 3-60 chars, alphanumeric with hyphens only");
  }
  // Reuse the same reserved-word set that guards changeUsername
  if (isReserved(clean)) {
    throw new Error("That name is reserved");
  }

  // History-backed availability check: rejects names that are current OR retired
  // in username_history, enforcing the global non-reuse invariant.
  // Allow the caller's own slug through (idempotent re-claim).
  //
  // SECURITY NOTE: we check username_history ownership, NOT profiles.username.
  // profiles.username is a denormalized cache that can temporarily diverge from
  // username_history (e.g. after a partial write). Querying history directly is
  // the authoritative check and prevents a divergence window from being exploited
  // to bypass the "taken by someone else" guard.
  const taken = await usernameService.usernameExists(clean);
  if (taken) {
    const ownerId = await usernameService.usernameOwner(clean);
    if (ownerId !== vendorId) {
      throw new Error("Slug already taken");
    }
    // ownerId === vendorId: this is the caller's own name — idempotent re-claim.
  }

  // Atomic swap in username_history (retire auto row, insert onboarding row,
  // update profiles.username). Does NOT run the change_username RPC's gating.
  const result = await usernameService.setOnboardingUsername(vendorId, clean);
  if (!result.ok) {
    if (result.reason === "taken") throw new Error("Slug already taken");
    throw new Error(result.detail || "Failed to claim slug");
  }

  // Record onboarding_slug and advance step (username already updated by service).
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({
      onboarding_slug: clean,
      onboarding_step_completed: 2,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorId)
    .select()
    .single();
  if (error) throw error;
  return { slug: clean, profile: data };
};

// ─── Send-cap constants (mirror otpStore.js) ────────────────────────────
const MAX_SENDS      = 3;
const SEND_WINDOW_MS = 60 * 60 * 1000;   // 1 hour
const LOCKOUT_MS     = 15 * 60 * 1000;   // 15 minutes

// ─── OTP Sending (Email + WhatsApp) ─────────────────────────────────────
const sendOtpBothChannels = async (slug, email, phone, name = "Host") => {
  const now = Date.now();

  // Read existing session for per-account send-rate-limiting.
  // This prevents an attacker (rotating IPs to bypass the IP limiter) from
  // flooding a victim's email/WhatsApp with OTPs.
  const { data: existing } = await supabaseAdmin
    .from("otp_sessions")
    .select("*")
    .eq("onboarding_slug", slug)
    .maybeSingle();

  if (existing) {
    // Already locked out from a previous cap breach?
    if (existing.send_locked_until && new Date(existing.send_locked_until).getTime() > now) {
      const mins = Math.ceil((new Date(existing.send_locked_until).getTime() - now) / 60000);
      throw new Error(`Too many OTP requests. Try again in ${mins} minute(s).`);
    }

    // Within the rolling send window?
    const windowStart = existing.first_send_at ? new Date(existing.first_send_at).getTime() : 0;
    const inWindow = now - windowStart < SEND_WINDOW_MS;

    if (inWindow && (existing.send_count || 0) >= MAX_SENDS) {
      // Hit the cap — set a 15-min lockout and reject.
      await supabaseAdmin
        .from("otp_sessions")
        .update({ send_locked_until: new Date(now + LOCKOUT_MS).toISOString() })
        .eq("onboarding_slug", slug);
      throw new Error("Too many OTP requests. Try again in 15 minutes.");
    }

    var sendCount   = inWindow ? (existing.send_count || 0) + 1 : 1;
    var firstSendAt = inWindow && existing.first_send_at ? existing.first_send_at : new Date(now).toISOString();
  } else {
    var sendCount   = 1;
    var firstSendAt = new Date(now).toISOString();
  }

  // Generate OTP (6-digit, CSPRNG)
  const otp = crypto.randomInt(100000, 1000000).toString();

  // Hash before storing — never persist plaintext OTPs (parity with
  // authController.forgotPassword). Both channels share the same OTP value,
  // so one hash covers email_otp and phone_otp.
  const otpHash = await bcrypt.hash(otp, 10);

  // Store in otp_sessions table
  const { error: storeError } = await supabaseAdmin
    .from("otp_sessions")
    .upsert(
      {
        onboarding_slug: slug,
        email: email.toLowerCase().trim(),
        phone: phone || "",
        email_otp: otpHash,
        phone_otp: otpHash,
        email_otp_expires_at: new Date(now + 10 * 60 * 1000).toISOString(),
        phone_otp_expires_at: new Date(now + 10 * 60 * 1000).toISOString(),
        email_verified: false,
        phone_verified: false,
        send_count: sendCount,
        first_send_at: firstSendAt,
        send_locked_until: null,
      },
      { onConflict: "onboarding_slug" }
    );

  if (storeError) throw storeError;

  // Send email OTP via the Communication Engine (BOOKING_OTP template, immediate)
  await communicationEngine.send({
    event: "BOOKING_OTP",
    to: email,
    immediate: true,
    data: { otp },
    user: { email, name },
  });

  // Send WhatsApp OTP (if phone provided)
  if (phone) {
    try {
      await sendWhatsAppOtp({ phone, otp, name });
    } catch (whatsappErr) {
      console.error("WhatsApp OTP send failed (non-fatal):", whatsappErr.message);
      // Don't fail the entire request if WhatsApp fails
    }
  }

  return { success: true, message: "OTPs sent to email and WhatsApp" };
};

// ─── OTP Verification (Email and/or WhatsApp) ───────────────────────────
const verifyOtp = async (slug, channel, otp) => {
  const { data: session, error } = await supabaseAdmin
    .from("otp_sessions")
    .select("*")
    .eq("onboarding_slug", slug)
    .maybeSingle();

  if (error || !session) {
    throw new Error("OTP session not found");
  }

  // Check expiry
  if (channel === "email") {
    if (new Date() > new Date(session.email_otp_expires_at)) {
      throw new Error("Email OTP expired");
    }
    if (session.email_locked_until && new Date() < new Date(session.email_locked_until)) {
      throw new Error("Email OTP locked due to too many attempts");
    }
    if (!(await bcrypt.compare(otp, session.email_otp || ""))) {
      const newAttempts = (session.email_attempts || 0) + 1;
      if (newAttempts >= 3) {
        await supabaseAdmin
          .from("otp_sessions")
          .update({
            email_attempts: newAttempts,
            email_locked_until: new Date(Date.now() + LOCKOUT_MS).toISOString(),
          })
          .eq("onboarding_slug", slug);
        throw new Error("Too many attempts. Try again in 15 minutes.");
      }
      await supabaseAdmin
        .from("otp_sessions")
        .update({ email_attempts: newAttempts })
        .eq("onboarding_slug", slug);
      throw new Error("Invalid OTP");
    }
    // Mark email as verified
    await supabaseAdmin
      .from("otp_sessions")
      .update({ email_verified: true, email_attempts: 0 })
      .eq("onboarding_slug", slug);
  } else if (channel === "phone") {
    if (new Date() > new Date(session.phone_otp_expires_at)) {
      throw new Error("Phone OTP expired");
    }
    if (session.phone_locked_until && new Date() < new Date(session.phone_locked_until)) {
      throw new Error("Phone OTP locked due to too many attempts");
    }
    if (!(await bcrypt.compare(otp, session.phone_otp || ""))) {
      const newAttempts = (session.phone_attempts || 0) + 1;
      if (newAttempts >= 3) {
        await supabaseAdmin
          .from("otp_sessions")
          .update({
            phone_attempts: newAttempts,
            phone_locked_until: new Date(Date.now() + LOCKOUT_MS).toISOString(),
          })
          .eq("onboarding_slug", slug);
        throw new Error("Too many attempts. Try again in 15 minutes.");
      }
      await supabaseAdmin
        .from("otp_sessions")
        .update({ phone_attempts: newAttempts })
        .eq("onboarding_slug", slug);
      throw new Error("Invalid OTP");
    }
    // Mark phone as verified
    await supabaseAdmin
      .from("otp_sessions")
      .update({ phone_verified: true, phone_attempts: 0 })
      .eq("onboarding_slug", slug);
  }

  return { verified: true };
};

// ─── Create Vendor Account (ONLY after password step) ────────────────────
const createVendorAccount = async (slug, email, password, name) => {
  // Check if profile already exists
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("onboarding_slug", slug)
    .maybeSingle();

  if (existing) {
    throw new Error("Account already exists for this slug");
  }

  // Verify the OTP session BEFORE creating any auth user. SECURITY: the email
  // being registered MUST be the exact address that was OTP-verified. A verified
  // phone alone does NOT authorize binding an arbitrary email — otherwise an
  // attacker could verify their own phone and register a victim's email.
  const { data: session } = await supabaseAdmin
    .from("otp_sessions")
    .select("*")
    .eq("onboarding_slug", slug)
    .maybeSingle();

  const submittedEmail = email.toLowerCase().trim();
  const verifiedEmail = (session?.email || "").toLowerCase().trim();
  if (!session || !session.email_verified || verifiedEmail !== submittedEmail) {
    throw new Error("Email must be verified before creating the account");
  }

  // Create Supabase auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: submittedEmail,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (authError) throw authError;

  // Create profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .insert({
      id: authData.user.id,
      name,
      email: email.toLowerCase().trim(),
      role: "host",
      onboarding_slug: slug,
      onboarding_step_completed: 2, // Password step
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw profileError;
  }

  // Sign in to get session (disposable client — never poisons supabaseAdmin's
  // service-role auth, which would break all later RLS-protected writes).
  const { data: signInData, error: signInError } = await signInWithPassword(
    email.toLowerCase().trim(),
    password
  );

  if (signInError) throw signInError;

  return {
    id: profile.id,
    token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
    slug,
  };
};

// ─── Update Onboarding Step ──────────────────────────────────────────────
const updateOnboardingStep = async (vendorId, slug, stepNumber, data) => {
  // P2-7: enforce monotonic progression server-side. The client guard sequences
  // steps, but a scripted call could jump (e.g. step 2 → 6) and land in the
  // dashboard with no category/about. Allow re-saving the current step or
  // advancing by exactly one; reject a forward jump.
  const { data: cur } = await supabaseAdmin
    .from("profiles").select("onboarding_step_completed").eq("id", vendorId).maybeSingle();
  const current = cur?.onboarding_step_completed || 0;
  if (stepNumber > current + 1) {
    throw new Error("Please complete the previous step first.");
  }

  const updates = {
    onboarding_step_completed: stepNumber,
    updated_at: new Date().toISOString(),
  };

  // Map step-specific data to columns (7-step Google-first flow)
  if (stepNumber === 3) {
    // About step: vendor_type + booking_type
    updates.vendor_type  = data.vendor_type  || null;
    updates.booking_type = data.booking_type || null;
  } else if (stepNumber === 4) {
    // Category step: single primary category (plan-gated expansion handled client-side)
    const cats = Array.isArray(data.categories) ? data.categories.filter(Boolean) : [];
    const primary = data.primary_category || cats[0] || null;
    updates.primary_category = primary;
    updates.categories = primary ? [primary] : [];
  } else if (stepNumber === 5) {
    // WhatsApp step. Verified data is written by /api/whatsapp/verify-otp.
    // Only the skip path writes the "unverified" state here.
    if (data.whatsapp_skipped) {
      updates.whatsapp_verified = false;
      updates.whatsapp_number = null;
    }
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("id", vendorId)
    .select()
    .single();

  if (error) throw error;
  return profile;
};

// ─── Completion helpers (state-machine contract) ────────────────────────
//
// The /live screen sits between plan activation and dashboard. The contract:
//   activatePlan (via /payment/subscription/*) → plan set, step stays < 6
//   activateFreePlan / advanceToLive           → step = 6, onboarding_completed STAYS false
//   markComplete (/live "Go to Dashboard")     → ONLY writer of onboarding_completed=true
//
// Why split: if activatePlan set onboarding_completed=true, the client guard
// (done>=6 → show /live) would bounce the host past the celebration screen
// directly to /dashboard. The /live screen must be reachable after plan choice.

// Returns the host's currently-active plan slug, or null if none/expired.
// The canonical free tier counts as active (no expiry). Paid requires
// plan_expires_at in the future.
const getActivePlan = async (vendorId) => {
  const { data: p } = await supabaseAdmin
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", vendorId)
    .maybeSingle();
  if (!p || !p.plan) return null;
  // Free tier is always active. isFreeSlug covers every free variant — canonical
  // 'starter', legacy 'explorer'/'free', and grandfathered 'starter_legacy'.
  if (planService.isFreeSlug(p.plan)) return p.plan;
  if (p.plan_expires_at && new Date(p.plan_expires_at) > new Date()) return p.plan;
  return null;
};

// Advance to the terminal step WITHOUT completing — lets /live render.
// Throws if no plan has been activated yet (prevents bypassing plan step).
const advanceToLive = async (vendorId) => {
  const plan = await getActivePlan(vendorId);
  if (!plan) throw new Error("Choose a plan first");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ onboarding_step_completed: 6, updated_at: new Date().toISOString() })
    .eq("id", vendorId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Free plan: activate explorer, then advance to /live (NOT complete).
// onboarding_completed is NOT set here — only markComplete sets it.
const activateFreePlan = async (vendorId) => {
  await supabaseAdmin
    .from("profiles")
    .update({ plan: "explorer", plan_activated_at: new Date().toISOString() })
    .eq("id", vendorId);
  return advanceToLive(vendorId);
};

// /live button — the ONLY writer of onboarding_completed.
// Gated on the host having an active plan (free or paid).
const markComplete = async (vendorId) => {
  const plan = await getActivePlan(vendorId);
  if (!plan) throw new Error("Choose and activate a plan before finishing");
  // P2-7: don't complete onboarding without the required profile data. A missing
  // primary_category lands the host in a broken state (createService later fails
  // category validation). markComplete is the sole writer of onboarding_completed.
  const { data: prof } = await supabaseAdmin
    .from("profiles").select("primary_category").eq("id", vendorId).maybeSingle();
  if (!prof?.primary_category) throw new Error("Add your category before finishing onboarding.");
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({
      onboarding_completed: true,
      onboarding_step_completed: 6,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ─── Get Onboarding Status ──────────────────────────────────────────────
const getOnboardingStatus = async (vendorId) => {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("onboarding_slug, onboarding_step_completed, onboarding_completed")
    .eq("id", vendorId)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  return {
    slug: profile.onboarding_slug,
    stepCompleted: profile.onboarding_step_completed || 0,
    isComplete: profile.onboarding_completed || false,
  };
};

module.exports = {
  isValidSlug,
  checkSlugAvailable,
  slugAvailableForUser,
  generateUniqueSlug,
  claimSlug,
  sendOtpBothChannels,
  verifyOtp,
  createVendorAccount,
  updateOnboardingStep,
  getActivePlan,
  advanceToLive,
  activateFreePlan,
  markComplete,
  getOnboardingStatus,
};

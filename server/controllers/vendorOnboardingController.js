const crypto = require("crypto");
const { supabaseAdmin, signInWithPassword } = require("../config/supabase");
const { sendWhatsAppOtp } = require("../utils/notify");
const communicationEngine = require("../services/email/communicationEngine");
const otpStore = require("../utils/otpStore");
const razorpayConfig = require("../services/razorpayConfig");

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
  while (true) {
    const available = await checkSlugAvailable(slug);
    if (available) return slug;
    slug = `${slug.slice(0, 45)}-${i++}`;
  }
};

// ─── OTP Sending (Email + WhatsApp) ─────────────────────────────────────
const sendOtpBothChannels = async (slug, email, phone, name = "Vendor") => {
  // Generate OTP (6-digit, CSPRNG)
  const otp = crypto.randomInt(100000, 1000000).toString();

  // Store in otp_sessions table
  const { error: storeError } = await supabaseAdmin
    .from("otp_sessions")
    .upsert(
      {
        onboarding_slug: slug,
        email: email.toLowerCase().trim(),
        phone: phone || "",
        email_otp: otp,
        phone_otp: otp,
        email_otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        phone_otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        email_verified: false,
        phone_verified: false,
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
    if (session.email_otp !== otp) {
      const newAttempts = (session.email_attempts || 0) + 1;
      if (newAttempts >= 3) {
        await supabaseAdmin
          .from("otp_sessions")
          .update({
            email_attempts: newAttempts,
            email_locked_until: new Date(Date.now() + 60 * 1000).toISOString(),
          })
          .eq("onboarding_slug", slug);
        throw new Error("Too many attempts. Try again in 60 seconds.");
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
    if (session.phone_otp !== otp) {
      const newAttempts = (session.phone_attempts || 0) + 1;
      if (newAttempts >= 3) {
        await supabaseAdmin
          .from("otp_sessions")
          .update({
            phone_attempts: newAttempts,
            phone_locked_until: new Date(Date.now() + 60 * 1000).toISOString(),
          })
          .eq("onboarding_slug", slug);
        throw new Error("Too many attempts. Try again in 60 seconds.");
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
  const updates = {
    onboarding_step_completed: stepNumber,
    updated_at: new Date().toISOString(),
  };

  // Map step-specific data to columns
  if (stepNumber === 3) {
    updates.vendor_type = data.type; // 'individual' or 'organisation'
  } else if (stepNumber === 4) {
    updates.categories = data.categories || [];
  } else if (stepNumber === 5) {
    updates.booking_type = data.booking_type; // 'online_only', 'offline_only', 'both'
  } else if (stepNumber === 6) {
    updates.calendar_connected = data.calendar_connected || false;
    updates.calendar_skipped = data.calendar_skipped || false;
  } else if (stepNumber === 7) {
    updates.profile_image = data.profile_image || null;
    updates.bio = data.bio || "";
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

// ─── Razorpay Order Creation ────────────────────────────────────────────
const createRazorpayOrder = async (vendorId, plan, amount) => {
  // Create order in Razorpay
  const razorpay = await razorpayConfig.getClient();
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Convert to paise
    currency: "INR",
    receipt: `plan_${plan}_${vendorId.slice(0, 8)}_${Date.now()}`,
  });

  // Store in database for webhook verification
  const { data: orderRecord, error } = await supabaseAdmin
    .from("razorpay_orders")
    .insert({
      vendor_id: vendorId,
      order_id: order.id,
      plan,
      amount,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  return {
    orderId: order.id,
    amount,
    currency: "INR",
    key: await razorpayConfig.getKeyId(),
  };
};

// ─── Razorpay Webhook Verification ──────────────────────────────────────
const verifyRazorpayPayment = async (paymentId, orderId, vendorId) => {
  try {
    // SECURITY: look up the order WE created and assert it belongs to this
    // vendor. Without the vendor_id scope, a vendor could submit another
    // vendor's captured order id (IDOR / cross-account replay).
    const { data: order, error: lookupError } = await supabaseAdmin
      .from("razorpay_orders")
      .select("*")
      .eq("order_id", orderId)
      .eq("vendor_id", vendorId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!order) throw new Error("Order not found for this account");

    // Replay guard: each order can be redeemed exactly once.
    if (order.payment_verified) throw new Error("Order already processed");

    // Confirm with Razorpay (the source of truth — never the client body).
    const razorpay = await razorpayConfig.getClient();
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status !== "captured") {
      throw new Error("Payment not captured");
    }
    if (payment.order_id !== orderId) {
      throw new Error("Order ID mismatch");
    }

    // Amount binding: the captured amount (paise) MUST equal the amount we
    // stored for this order. Stops "pay for cheap plan, activate expensive
    // plan" — the plan is derived from this order below, not from the client.
    const expectedPaise = Math.round(Number(order.amount) * 100);
    if (Number(payment.amount) !== expectedPaise) {
      throw new Error("Payment amount mismatch");
    }

    // Mark completed — scoped to this vendor + the still-unverified row so a
    // concurrent double-submit can only win once.
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("razorpay_orders")
      .update({
        payment_id: paymentId,
        payment_status: "captured",
        payment_verified: true,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("vendor_id", vendorId)
      .eq("payment_verified", false)
      .select()
      .single();

    if (updateError) throw updateError;

    return updated;
  } catch (error) {
    console.error("Payment verification failed:", error);
    throw error;
  }
};

// ─── Activate Plan ──────────────────────────────────────────────────────
const activatePlan = async (vendorId, plan) => {
  const planDetails = {
    explorer: { price: 0, expires: null },
    creator: { price: 99900, expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    professional: { price: 365000, expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
  };

  if (!planDetails[plan]) {
    throw new Error("Invalid plan");
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .update({
      plan,
      plan_expires_at: planDetails[plan].expires,
      onboarding_step_completed: 10, // Onboarding complete
      onboarding_completed: true,
      plan_activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorId)
    .select()
    .single();

  if (error) throw error;
  return profile;
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

// ─── Resume Last Incomplete Step ────────────────────────────────────────
const getResumeStep = (stepCompleted) => {
  const steps = [
    "/vendor-register",
    "/vendor-register/:slug/verify",
    "/vendor-onboarding/:slug/password",
    "/vendor-onboarding/:slug/type",
    "/vendor-onboarding/:slug/category",
    "/vendor-onboarding/:slug/booking-type",
    "/vendor-onboarding/:slug/calendar",
    "/vendor-onboarding/:slug/profile",
    "/vendor-onboarding/:slug/first-service",
    "/vendor-onboarding/:slug/plans",
    "/explore-with-bolt",
  ];

  // stepCompleted is 0-10, next step is stepCompleted + 1
  return steps[stepCompleted] || steps[0];
};

module.exports = {
  isValidSlug,
  checkSlugAvailable,
  generateUniqueSlug,
  sendOtpBothChannels,
  verifyOtp,
  createVendorAccount,
  updateOnboardingStep,
  createRazorpayOrder,
  verifyRazorpayPayment,
  activatePlan,
  getOnboardingStatus,
  getResumeStep,
};

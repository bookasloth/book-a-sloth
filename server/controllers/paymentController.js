// Razorpay payment controller — bookings + product purchases + plan subscriptions
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { securityLog, auditLog } = require("../utils/logger");
const sendEmail = require("../utils/sendEmail");
const NotificationEngine = require("../services/notificationEngine");
const { computeBreakdown, calculateVendorPayout, calculatePlatformFee, computeSubscriptionBreakdown } = require("../lib/pricingEngine");
const planService = require("../services/planService");
const platformConfig = require("../services/platformConfig");
const { createCalendarEvent } = require("../config/google");
const { decrypt: decryptToken } = require("../utils/cryptoTokens");

// Annual plan price in paise, read from subscription_plans (DB-driven, spec v1.1)
const getPlanPricePaise = async (slug) => {
  const plan = await planService.getPlan(slug);
  if (!plan || plan.slug !== planService.normalizeSlug(slug)) return null;
  const price = Number(plan.annual_price);
  return price > 0 ? Math.round(price * 100) : null;
};

// Email helpers (same as bookingController)
const emailHtml = (body) => `
  <div style="max-width:520px;margin:0 auto;padding:26px;border-radius:24px;background:#ffffff;font-family:'Plus Jakarta Sans','Poppins',sans-serif;color:#111827;box-shadow:0 24px 60px rgba(15,23,42,0.08);">
    ${body}
    <div style="margin-top:24px;padding:18px;border-radius:18px;background:#f8fafc;color:#6b7280;font-size:14px;">Book A Sloth — calm booking for busy hosts.</div>
  </div>`;
const row = (label, value) =>
  `<p style="margin:0 0 12px;font-size:15px;color:#374151;"><strong>${label}:</strong> ${value}</p>`;

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const verifySignature = (orderId, paymentId, signature) => {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

// ── POST /api/payment/create-order ───────────────────────────
// SECURITY FIX: validate guest identity against the booking before creating order
const createOrder = async (req, res) => {
  try {
    const { booking_id, guest_email } = req.body;
    if (!booking_id) return res.status(400).json({ message: "booking_id is required" });

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("*, services(price, title, duration, grace_period_minutes)")
      .eq("id", booking_id).single();

    if (error || !booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.payment_status === "paid") return res.status(400).json({ message: "Already paid" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Booking was cancelled" });

    // Re-validate the slot BEFORE taking money (excluding this booking itself —
    // its pending row is what holds the slot). Catches conflicts that appeared
    // between booking creation and checkout (e.g. a new Google Calendar event).
    try {
      const availabilityService = require("../services/availabilityService");
      const { data: payHost } = await supabaseAdmin
        .from("profiles")
        .select("id, google_calendar_connected, google_access_token, google_refresh_token")
        .eq("id", booking.host_id).single();
      const { data: payAvail } = await supabaseAdmin
        .from("availability").select("*").eq("host_id", booking.host_id).maybeSingle();
      const slotCheck = await availabilityService.validateSlot({
        host: payHost,
        service: booking.services,
        availability: payAvail,
        scheduledAtUTC: booking.scheduled_at,
        excludeBookingId: booking.id,
      });
      if (!slotCheck.ok) {
        securityLog("PAYMENT_SLOT_CONFLICT", { booking_id, reason: slotCheck.reason });
        return res.status(409).json({
          message: "This slot is no longer available. Your booking was not charged — please pick another time.",
        });
      }
    } catch (revalidateErr) {
      // Fail-open: a validation infrastructure error must not block checkout
      console.error("createOrder slot re-validation error (non-fatal):", revalidateErr.message);
    }

    // SECURITY: Verify the requester matches the booking guest
    // Either email matches, or the authenticated user is the guest
    const isAuthenticatedGuest = req.user?.id && req.user.id === booking.guest_id;
    const isEmailGuest = guest_email && booking.guest_email &&
      guest_email.toLowerCase().trim() === booking.guest_email.toLowerCase().trim();

    if (!isAuthenticatedGuest && !isEmailGuest) {
      securityLog('PAYMENT_UNAUTHORIZED', { booking_id, ip: req.ip, userId: req.user?.id });
      return res.status(403).json({ message: "Not authorized to pay for this booking." });
    }

    const servicePrice = booking.services?.price || 0;
    if (servicePrice === 0) return res.status(400).json({ message: "Cannot create order for a free service" });

    // Customer pays service + platform fee + GST. Use the immutable snapshot
    // captured at booking creation; recompute only for legacy rows without it.
    let customerTotal = Number(booking.customer_total) || 0;
    let platformFee   = Number(booking.platform_fee_amount) || 0;
    let gst           = Number(booking.platform_fee_gst) || 0;
    if (customerTotal <= 0) {
      const { platformFee: feeSetting, gstRate } = await platformConfig.getConfig();
      const b = computeBreakdown({ servicePrice, commissionPercentage: 0, platformFee: feeSetting, gstRate });
      customerTotal = b.customerTotal; platformFee = b.platformFee; gst = b.gst;
    }

    const totalPaise = Math.round(customerTotal * 100);
    const order = await razorpay.orders.create({
      amount: totalPaise, currency: "INR",
      receipt: `bkg_${booking_id.slice(0, 20)}`,
      notes: { booking_id, service: booking.services?.title, platform_fee: platformFee, gst },
    });

    // Only update razorpay_order_id — the fee/GST snapshot is immutable
    await supabaseAdmin.from("bookings")
      .update({ razorpay_order_id: order.id, updated_at: new Date().toISOString() })
      .eq("id", booking_id);

    auditLog('PAYMENT_ORDER_CREATED', booking.guest_id, { booking_id, amount: totalPaise });

    res.json({ razorpay_order_id: order.id, amount: order.amount, currency: order.currency,
      service_price: servicePrice, platform_fee: platformFee, gst, total: customerTotal });
  } catch (error) {
    securityLog('PAYMENT_ORDER_ERROR', { error: error.message });
    res.status(500).json({ message: "Payment initiation failed. Please try again." });
  }
};

// ── POST /api/payment/verify ─────────────────────────────────
const verifyPayment = async (req, res) => {
  try {
    const { booking_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Verify the order_id matches what we stored (replay attack prevention)
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("razorpay_order_id, payment_status, commission_applied, commission_gst, platform_fee_amount, platform_fee_gst, customer_total, meeting_link, scheduled_at, guest_name, guest_email, notes, host_id, service_id, services(price, title, duration, meeting_mode)")
      .eq("id", booking_id).single();

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.payment_status === "paid") return res.status(400).json({ message: "Already paid" });
    if (booking.razorpay_order_id !== razorpay_order_id) {
      securityLog('PAYMENT_ORDER_MISMATCH', { booking_id, provided: razorpay_order_id, stored: booking.razorpay_order_id, ip: req.ip });
      return res.status(400).json({ message: "Payment verification failed." });
    }

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      securityLog('PAYMENT_SIGNATURE_INVALID', { booking_id, ip: req.ip });
      return res.status(400).json({ message: "Payment verification failed — invalid signature." });
    }

    // Record the ACTUAL Razorpay fee + tax (vendor-borne) and finalise the payout.
    // Razorpay's `fee` (paise) INCLUDES `tax`; we store them split (PRD §19).
    let razorpayFeeTotal = 0, razorpayTax = 0;
    try {
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      if (payment && payment.fee != null) razorpayFeeTotal = Number(payment.fee) / 100;
      if (payment && payment.tax != null) razorpayTax = Number(payment.tax) / 100;
    } catch (feeErr) {
      // No self-heal re-fetches this fee: payout finalises with 0 and needs a
      // manual admin ADJUSTMENT entry once the real fee is known.
      console.error("Razorpay fee fetch failed — fee recorded as 0, manual correction needed:", feeErr.message);
    }
    // Tax is a component of fee; clamp so excl-tax + tax always reconstitutes the total.
    razorpayTax = Math.min(razorpayTax, razorpayFeeTotal);
    const razorpayFeeExclTax = Math.max(0, Math.round((razorpayFeeTotal - razorpayTax) * 100) / 100);
    const servicePrice  = booking.services?.price || 0;
    const commission    = Number(booking.commission_applied) || 0;
    const commissionGst = Number(booking.commission_gst) || 0;
    const finalPayout   = calculateVendorPayout(servicePrice, commission, commissionGst, razorpayFeeTotal);

    const paidAt = new Date().toISOString();
    const fullUpdate = {
      payment_status: "paid", status: "confirmed", razorpay_payment_id,
      razorpay_fee_actual: razorpayFeeExclTax, razorpay_tax_actual: razorpayTax,
      vendor_amount: finalPayout, paid_at: paidAt,
      updated_at: paidAt,
    };
    // .neq guard: two concurrent verifies can both pass the read check above;
    // only the first matches this conditional update (zero rows = already paid).
    let { data: updated, error } = await supabaseAdmin
      .from("bookings").update(fullUpdate)
      .eq("id", booking_id).neq("payment_status", "paid").select().single();

    // Legacy DB without the v2.2/v2.8 columns: retry without the new fields
    if (error && /Could not find the|column.*does not exist/i.test(error.message)) {
      const { razorpay_fee_actual: _drop, razorpay_tax_actual: _drop2, paid_at: _drop3, ...coreUpdate } = fullUpdate;
      ({ data: updated, error } = await supabaseAdmin
        .from("bookings").update(coreUpdate)
        .eq("id", booking_id).neq("payment_status", "paid").select().single());
    }

    if (error && error.code === "PGRST116") {
      return res.status(400).json({ message: "Already paid" });
    }
    if (error) return res.status(500).json({ message: error.message });

    // ── Ledger: post ORDER_PAYMENT (non-fatal — payment already recorded;
    // the reconciler cron retries missed posts). Pre-v2.2 rows have no
    // customer_total snapshot → entry can't balance → skip (reconciler skips too).
    try {
      const ledgerCustomerTotal = Number(booking.customer_total) || 0;
      if (ledgerCustomerTotal > 0) {
      const { orderPaymentEntry } = require("../services/ledger/journalTemplates");
      const { postSafe } = require("../services/ledger/postingService");
      await postSafe({
        sourceType: "ORDER_PAYMENT",
        sourceId: booking_id,
        journalDate: paidAt.slice(0, 10),
        template: orderPaymentEntry({
          booking_id,
          host_id: booking.host_id,
          service_price: servicePrice,
          platform_fee_amount: Number(booking.platform_fee_amount) || 0,
          platform_fee_gst: Number(booking.platform_fee_gst) || 0,
          commission_applied: commission,
          commission_gst: commissionGst,
          razorpay_fee_actual: razorpayFeeExclTax,
          razorpay_tax_actual: razorpayTax,
          vendor_amount: finalPayout,
          customer_total: ledgerCustomerTotal,
        }),
      });
      }
    } catch (ledgerErr) {
      console.error("Order ledger posting error (non-fatal):", ledgerErr.message);
    }

    // Payment captured → now create the Google Calendar event (deferred from
    // booking time for paid services). A calendar failure must NOT fail an
    // already-charged payment — log and continue with an empty meeting link.
    let meetingLink = booking.meeting_link || "";
    try {
      const svc = booking.services || {};
      const isOnline = svc.meeting_mode !== "offline";
      if (isOnline && !meetingLink) {
        const { data: host } = await supabaseAdmin
          .from("profiles")
          .select("id, email, google_calendar_connected, google_access_token, google_refresh_token")
          .eq("id", booking.host_id).single();
        const { data: avail } = await supabaseAdmin
          .from("availability").select("timezone").eq("host_id", booking.host_id).maybeSingle();
        if (host?.google_calendar_connected && host?.google_refresh_token) {
          const startTime = new Date(booking.scheduled_at);
          const endTime = new Date(startTime.getTime() + (svc.duration || 30) * 60000);
          const event = await createCalendarEvent(
            decryptToken(host.google_access_token),
            decryptToken(host.google_refresh_token),
            {
              title: `${svc.title || "Service"} — ${booking.guest_name || "Guest"}`,
              description: `Booked via Book A Sloth\n${booking.notes || ""}`,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              timezone: avail?.timezone || "Asia/Kolkata",
              attendees: [
                { email: host.email },
                ...(booking.guest_email ? [{ email: booking.guest_email }] : []),
              ],
            },
          );
          meetingLink = event.meetLink || "";
          if (meetingLink) {
            const { data: relinked } = await supabaseAdmin
              .from("bookings").update({ meeting_link: meetingLink }).eq("id", booking_id).select().single();
            if (relinked) updated = relinked;
          }
        }
      }
    } catch (calErr) {
      console.error("Post-payment calendar event error (non-fatal):", calErr.message);
    }

    auditLog('PAYMENT_VERIFIED', null, { booking_id, razorpay_payment_id });

    // BUG-12 fixed: send confirmation emails now that payment is verified
    try {
      const { data: fullBooking } = await supabaseAdmin
        .from("bookings")
        .select("*, services(*), profiles!bookings_host_id_fkey(*)")
        .eq("id", booking_id)
        .single();
      if (fullBooking) {
        const svc  = fullBooking.services;
        const host = fullBooking["profiles!bookings_host_id_fkey"] || {};
        const { data: avail } = await supabaseAdmin
          .from("availability").select("timezone").eq("host_id", fullBooking.host_id).single();
        const tz   = avail?.timezone || "Asia/Kolkata";
        const when = new Date(fullBooking.scheduled_at).toLocaleString("en-IN", { timeZone: tz });

        const d = new Date(fullBooking.scheduled_at);
        const emailData = {
          service_name: svc?.title || "Service",
          vendor_name: host.name || "Host",
          vendor_phone: host.phone || "",
          user_name: fullBooking.guest_name || "Customer",
          booking_id: fullBooking.id,
          location: fullBooking.meeting_link ? "Online (link in your dashboard)" : "",
          booking_date: d.toLocaleDateString("en-IN", { timeZone: tz, weekday: "short", day: "numeric", month: "short", year: "numeric" }),
          booking_time: d.toLocaleTimeString("en-IN", { timeZone: tz, hour: "2-digit", minute: "2-digit" }),
        };
        const ctx = {
          customer: [fullBooking.guest_name || "Customer", svc?.title || "Service", host.name || "Host", when],
          vendor:   [host.name || "Host", fullBooking.guest_name || "Customer", svc?.title || "Service", when],
        };
        await NotificationEngine.send({
          event: "BOOKING_CONFIRMED_CUSTOMER",
          data: {
            email: fullBooking.guest_email, phone: fullBooking.guest_phone, name: fullBooking.guest_name,
            templateParams: ctx.customer,
            emailData, emailUser: { name: fullBooking.guest_name, email: fullBooking.guest_email },
            recipientUserId: fullBooking.guest_id, bookingId: fullBooking.id,
          },
        });
        await NotificationEngine.send({
          event: "BOOKING_CONFIRMED_VENDOR",
          data: {
            email: host.email, phone: host.phone, name: host.name,
            templateParams: ctx.vendor,
            emailData, emailUser: { name: host.name, email: host.email, username: host.username },
            recipientUserId: fullBooking.host_id, bookingId: fullBooking.id,
          },
        });
      }
    } catch (emailErr) {
      console.error("Post-payment email error:", emailErr.message);
    }

    res.json({ message: "Payment verified", booking: updated });
  } catch (error) {
    res.status(500).json({ message: "Payment verification failed." });
  }
};

// ── POST /api/payment/subscribe ──────────────────────────────
const subscribePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const planRecord = await planService.getPlan(plan);
    if (!planRecord || planRecord.slug !== planService.normalizeSlug(plan) || !(Number(planRecord.annual_price) > 0)) {
      return res.status(400).json({ message: "Invalid or free plan — nothing to purchase." });
    }
    // GST is charged ON TOP of the plan price (PRD §5.2) — never embedded.
    const { gstRate } = await platformConfig.getConfig();
    const breakdown = computeSubscriptionBreakdown({ planPrice: Number(planRecord.annual_price), gstRate });
    const amountPaise = Math.round(breakdown.totalCharged * 100);
    const order = await razorpay.orders.create({
      amount: amountPaise, currency: "INR",
      receipt: `plan_${plan}_${req.user.id.slice(0, 10)}`,
      notes: { vendor_id: req.user.id, plan, plan_price: breakdown.planPrice, gst: breakdown.gstAmount },
    });
    auditLog('SUBSCRIPTION_ORDER_CREATED', req.user.id, { plan, amount: amountPaise });
    res.json({
      razorpay_order_id: order.id, amount: order.amount, currency: order.currency, plan,
      plan_price: breakdown.planPrice, gst_amount: breakdown.gstAmount, total: breakdown.totalCharged,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/payment/verify-subscription ───────────────────
const verifySubscription = async (req, res) => {
  try {
    const { plan, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      securityLog('SUBSCRIPTION_SIGNATURE_INVALID', { userId: req.user.id, ip: req.ip });
      return res.status(400).json({ message: "Payment verification failed." });
    }

    // Annual billing per spec v1.1 (was incorrectly 30 days)
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ plan, plan_expires_at: expiresAt.toISOString(), plan_updated_at: new Date().toISOString(), plan_activated_at: new Date().toISOString() })
      .eq("id", req.user.id).select("id, name, email, plan, plan_expires_at").single();

    if (error) return res.status(500).json({ message: error.message });

    await supabaseAdmin.from("plan_purchases").insert({
      vendor_id: req.user.id, plan, amount_paid: await getPlanPricePaise(plan),
      razorpay_order_id, razorpay_payment_id,
      activated_at: new Date().toISOString(), expires_at: expiresAt.toISOString(),
    });

    // ── v2.8: subscription payment record + SUBSCRIPTION_PAYMENT ledger entry ──
    try {
      const planRecord2 = await planService.getPlan(plan);
      const { gstRate } = await platformConfig.getConfig();
      const breakdown = computeSubscriptionBreakdown({ planPrice: Number(planRecord2?.annual_price) || 0, gstRate });

      // Actual gateway fee+tax — PLATFORM-borne for subscriptions (PRD §5.3)
      let subFeeTotal = 0, subTax = 0;
      try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        if (payment && payment.fee != null) subFeeTotal = Number(payment.fee) / 100;
        if (payment && payment.tax != null) subTax = Number(payment.tax) / 100;
      } catch (feeErr) {
        console.error("Subscription fee fetch failed (recorded 0):", feeErr.message);
      }
      subTax = Math.min(subTax, subFeeTotal);
      const subFeeExclTax = Math.max(0, Math.round((subFeeTotal - subTax) * 100) / 100);

      const nowIso = new Date().toISOString();
      const { data: subPayment, error: subErr } = await supabaseAdmin
        .from("subscription_payments").insert({
          vendor_id: req.user.id, plan_type: plan,
          plan_price: breakdown.planPrice, gst_amount: breakdown.gstAmount, total_charged: breakdown.totalCharged,
          razorpay_fee: subFeeExclTax, razorpay_tax: subTax,
          razorpay_payment_id, razorpay_order_id,
          paid_at: nowIso, revenue_recognized_at: nowIso,
          billing_period_start: nowIso.slice(0, 10),
          billing_period_end: expiresAt.toISOString().slice(0, 10),
          status: "paid",
        }).select().single();

      if (subErr) {
        console.error("subscription_payments insert failed (reconciler cannot heal this — investigate):", subErr.message);
      } else {
        const { subscriptionPaymentEntry } = require("../services/ledger/journalTemplates");
        const { postSafe } = require("../services/ledger/postingService");
        await postSafe({
          sourceType: "SUBSCRIPTION_PAYMENT",
          sourceId: subPayment.id,
          journalDate: nowIso.slice(0, 10),
          template: subscriptionPaymentEntry(subPayment),
        });
      }
    } catch (subLedgerErr) {
      console.error("Subscription ledger error (non-fatal):", subLedgerErr.message);
    }

    auditLog('SUBSCRIPTION_ACTIVATED', req.user.id, { plan, expires_at: expiresAt });

    // Premium activated email (queued, non-blocking)
    try {
      const planRecord = await planService.getPlan(plan);
      NotificationEngine.send({
        event: 'SUBSCRIPTION_PURCHASED',
        data: {
          email: profile.email,
          emailUser: { name: profile.name, email: profile.email },
          emailData: {
            plan_name: planRecord?.name || plan,
            expiry_date: new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
          },
          recipientUserId: req.user.id,
        },
      }).catch((e) => console.error('subscription email error:', e.message));
    } catch (_) { /* non-fatal */ }

    res.json({ message: `Successfully upgraded to ${plan}!`, profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/payment/create-product-order ───────────────────
const createProductOrder = async (req, res) => {
  try {
    const { product_id } = req.body;
    const { data: product } = await supabaseAdmin
      .from("products").select("id, title, price, host_id, is_active").eq("id", product_id).single();

    if (!product || !product.is_active) return res.status(404).json({ message: "Product not found" });
    if (product.price === 0) return res.status(400).json({ message: "This product is free" });

    const productFee = calculatePlatformFee(product.price);
    const totalPaise = Math.round((product.price + productFee) * 100);
    const order = await razorpay.orders.create({
      amount: totalPaise, currency: "INR",
      receipt: `prd_${product_id.slice(0, 20)}`,
      notes: { product_id, title: product.title, platform_fee: productFee },
    });
    res.json({ razorpay_order_id: order.id, amount: order.amount, currency: order.currency,
      product_price: product.price, platform_fee: productFee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/payment/verify-product ────────────────────────
const verifyProductPayment = async (req, res) => {
  try {
    const { product_id, buyer_name, buyer_email, buyer_phone, buyer_id,
      razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      securityLog('PRODUCT_PAYMENT_SIGNATURE_INVALID', { product_id, ip: req.ip });
      return res.status(400).json({ message: "Payment verification failed." });
    }

    const { data: product } = await supabaseAdmin
      .from("products").select("id, price, host_id").eq("id", product_id).single();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const productFee = calculatePlatformFee(product.price);
    const downloadToken = crypto.randomUUID();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { data: purchase, error } = await supabaseAdmin
      .from("product_purchases").insert({
        product_id, host_id: product.host_id,
        buyer_id: buyer_id || null, buyer_name, buyer_email, buyer_phone,
        amount_paid: product.price, platform_fee: productFee,
        payment_status: "paid", razorpay_order_id, razorpay_payment_id,
        download_token: downloadToken,
        download_token_expires_at: tokenExpires.toISOString(),
      }).select().single();

    if (error) return res.status(500).json({ message: error.message });
    // BUG-15 fixed: atomic increment to avoid race condition under concurrent purchases
    await supabaseAdmin.rpc("increment_product_purchase_count", { row_id: product_id });

    auditLog('PRODUCT_PURCHASED', buyer_id, { product_id, amount: product.price });
    res.json({ message: "Payment verified", download_token: downloadToken, purchase });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/payment/webhook ────────────────────────────────
// Razorpay server-side webhook for payment.captured / payment.failed events
// MUST use raw body — register before express.json()
const handleWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ message: "Webhook secret not configured" });
  }

  const signature = req.headers['x-razorpay-signature'];
  if (!signature) {
    securityLog('WEBHOOK_NO_SIGNATURE', { ip: req.ip });
    return res.status(400).json({ message: "Missing signature" });
  }

  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(req.body) // raw body buffer
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signature))) {
    securityLog('WEBHOOK_SIGNATURE_INVALID', { ip: req.ip });
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  let event;
  try { event = JSON.parse(req.body.toString()); }
  catch { return res.status(400).json({ message: "Invalid JSON" }); }

  const payment = event.payload?.payment?.entity;
  if (!payment) return res.json({ received: true });

  try {
    if (event.event === 'payment.captured') {
      const notes = payment.notes || {};
      if (notes.booking_id) {
        await supabaseAdmin.from("bookings")
          .update({ payment_status: "paid", status: "confirmed",
            razorpay_payment_id: payment.id, updated_at: new Date().toISOString() })
          .eq("id", notes.booking_id).eq("payment_status", "unpaid"); // idempotent
        auditLog('WEBHOOK_BOOKING_PAID', null, { booking_id: notes.booking_id, payment_id: payment.id });
      }
    } else if (event.event === 'payment.failed') {
      const notes = payment.notes || {};
      if (notes.booking_id) {
        await supabaseAdmin.from("bookings")
          .update({ payment_status: "failed", updated_at: new Date().toISOString() })
          .eq("id", notes.booking_id).eq("payment_status", "unpaid");
        securityLog('WEBHOOK_PAYMENT_FAILED', { booking_id: notes.booking_id, error: payment.error_description });
      }
    }
  } catch (err) {
    securityLog('WEBHOOK_PROCESSING_ERROR', { event: event.event, error: err.message });
  }

  res.json({ received: true });
};

module.exports = { createOrder, verifyPayment, subscribePlan, verifySubscription, createProductOrder, verifyProductPayment, handleWebhook };

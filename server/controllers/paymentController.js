// Razorpay payment controller — bookings + product purchases + plan subscriptions
const { safeError } = require('../utils/httpError');
const { hostOf } = require("../utils/hostOf");
const crypto = require("crypto");
const { supabaseAdmin } = require("../config/supabase");
const { securityLog, auditLog } = require("../utils/logger");
const sendEmail = require("../utils/sendEmail");
const { adminAlert } = require("../utils/adminAlert");
const NotificationEngine = require("../services/notificationEngine");
const { computeBreakdown, calculateVendorPayout, calculatePlatformFee, computeSubscriptionBreakdown } = require("../lib/pricingEngine");
const planService = require("../services/planService");
const platformConfig = require("../services/platformConfig");
const razorpaySubscriptions = require("../services/razorpaySubscriptions");
const subscriptionService = require("../services/subscriptionService");
const razorpayConfig = require("../services/razorpayConfig");
const { cadencePrice, cadenceGross, cadencePeriodDays, computeSwitch, normCadence } = require("../lib/subscriptionPricing");
const { createCalendarEvent } = require("../config/google");
const { decrypt: decryptToken } = require("../utils/cryptoTokens");
const { verifySignature } = require("../utils/razorpaySignature");
const { capture: phCapture, resolveGuestId } = require("../utils/posthog");
const { trackServer } = require("../utils/trackServer");
const { runInBackground } = require("../utils/background");

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
    const razorpay = await razorpayConfig.getClient();
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
      key: await razorpayConfig.getKeyId(),
      service_price: servicePrice, platform_fee: platformFee, gst, total: customerTotal });
  } catch (error) {
    securityLog('PAYMENT_ORDER_ERROR', { error: error.message });
    res.status(500).json({ message: "Payment initiation failed. Please try again." });
  }
};

const { isLoadTestMode } = require("../config/loadTestMode");
// Razorpay signature gate. Bypassed ONLY under LOAD_TEST_MODE (off by default,
// never trusted in production) so JMeter — which can't run a real client-side
// checkout to produce a real signature — can exercise the verify path.
const signatureValid = (orderId, paymentId, sig, secret) =>
  isLoadTestMode() || verifySignature(orderId, paymentId, sig, secret);

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

    const keySecret = await razorpayConfig.getKeySecret();
    if (!signatureValid(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret)) {
      securityLog('PAYMENT_SIGNATURE_INVALID', { booking_id, ip: req.ip });
      return res.status(400).json({ message: "Payment verification failed — invalid signature." });
    }

    // Record the ACTUAL Razorpay fee + tax (vendor-borne) and finalise the payout.
    // Razorpay's `fee` (paise) INCLUDES `tax`; we store them split (PRD §19).
    let razorpayFeeTotal = 0, razorpayTax = 0;
    try {
      const razorpay = await razorpayConfig.getClient();
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
    if (error) return safeError(res, error);

    // ── Ledger: post ORDER_PAYMENT (non-fatal — payment already recorded;
    // the reconciler cron retries missed posts). Pre-v2.2 rows have no
    // customer_total snapshot → entry can't balance → skip (reconciler skips too).
    // Deferred to background: the reconciler is the durability backstop, so this
    // never needs to block the payment response.
    runInBackground("verifyPayment:ledger", async () => {
      const ledgerCustomerTotal = Number(booking.customer_total) || 0;
      if (ledgerCustomerTotal <= 0) return;
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
    });

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
            // Persist meeting link and google_event_id; fall back if v3.3 column is missing
            let relinkResult = await supabaseAdmin
              .from("bookings")
              .update({ meeting_link: meetingLink, google_event_id: event.eventId || null })
              .eq("id", booking_id).select().single();
            if (
              relinkResult.error &&
              /Could not find the|column.*does not exist/i.test(relinkResult.error.message)
            ) {
              relinkResult = await supabaseAdmin
                .from("bookings")
                .update({ meeting_link: meetingLink })
                .eq("id", booking_id).select().single();
            }
            if (relinkResult.data) updated = relinkResult.data;
          }
        }
      }
    } catch (calErr) {
      console.error("Post-payment calendar event error (non-fatal):", calErr.message);
    }

    auditLog('PAYMENT_VERIFIED', null, { booking_id, razorpay_payment_id });

    // Payment is now durably recorded. Respond immediately; analytics fan-out
    // (server GA4/Meta CAPI) and confirmation emails (WhatsApp + SMTP) are
    // best-effort and ran synchronously before — they were the bulk of the ~6s.
    res.json({ message: "Payment verified", booking: updated });

    runInBackground("verifyPayment:analytics", () =>
      trackServer(resolveGuestId({ guestId: req.user?.id, guestEmail: booking.guest_email }), "booking_paid", {
        booking_id,
        service_title: booking.services?.title,
        host_id: booking.host_id,
        amount: Number(booking.customer_total) || 0,
        currency: "INR",
        razorpay_payment_id,
      }, {
        value: Number(booking.customer_total) || 0,
        currency: "INR",
        email: booking.guest_email,
        eventId: razorpay_payment_id,           // de-dupe vs browser pixel
        gaClientId: req.body?.ga_client_id,     // browser _ga id if client forwarded it
      }));

    // BUG-12 fixed: send confirmation emails now that payment is verified
    runInBackground("verifyPayment:confirmation-emails", async () => {
      const { data: fullBooking } = await supabaseAdmin
        .from("bookings")
        .select("*, services(*), profiles!bookings_host_id_fkey(*)")
        .eq("id", booking_id)
        .single();
      if (!fullBooking) return;
      const svc  = fullBooking.services;
      const host = hostOf(fullBooking);
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
    });
  } catch (error) {
    // Success response is sent at L302 before the best-effort background fan-out.
    // A throw after that point must not attempt a second send (ERR_HTTP_HEADERS_SENT).
    if (!res.headersSent) res.status(500).json({ message: "Payment verification failed." });
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
    const razorpay = await razorpayConfig.getClient();
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
    safeError(res, error);
  }
};

// ── POST /api/payment/verify-subscription ───────────────────
const verifySubscription = async (req, res) => {
  try {
    const { plan, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    const keySecret = await razorpayConfig.getKeySecret();
    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret)) {
      securityLog('SUBSCRIPTION_SIGNATURE_INVALID', { userId: req.user.id, ip: req.ip });
      return res.status(400).json({ message: "Payment verification failed." });
    }

    // SECURITY: the signature only proves the order/payment pair is genuine — not
    // WHICH plan it was for. Fetch the order and confirm it was created for THIS
    // vendor and the claimed plan, else a vendor could pay for a cheap plan and
    // activate an expensive one.
    let rzpOrder;
    try {
      const razorpay = await razorpayConfig.getClient();
      rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    } catch (_) {
      return res.status(400).json({ message: "Order not found." });
    }
    if (String(rzpOrder?.notes?.vendor_id) !== String(req.user.id) ||
        String(rzpOrder?.notes?.plan) !== String(plan)) {
      securityLog('SUBSCRIPTION_ORDER_MISMATCH', { userId: req.user.id, order_id: razorpay_order_id, claimedPlan: plan, ip: req.ip });
      return res.status(400).json({ message: "Payment does not match this plan." });
    }

    // Idempotency: if this payment was already processed, return success without
    // re-activating / re-inserting / re-posting (prevents double subscription revenue).
    const { data: priorPayment } = await supabaseAdmin
      .from("subscription_payments")
      .select("id")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();
    if (priorPayment) {
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles").select("id, name, email, plan, plan_expires_at").eq("id", req.user.id).single();
      return res.json({ message: `Subscription already active`, profile: existingProfile });
    }

    // Annual billing per spec v1.1 (was incorrectly 30 days)
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update({ plan, plan_expires_at: expiresAt.toISOString(), plan_updated_at: new Date().toISOString(), plan_activated_at: new Date().toISOString() })
      .eq("id", req.user.id).select("id, name, email, plan, plan_expires_at").single();

    if (error) return safeError(res, error);

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
        const razorpay = await razorpayConfig.getClient();
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
        if (subErr.code === "23505" || /duplicate key|unique constraint/i.test(subErr.message || "")) {
          console.log("subscription_payments duplicate (replay) — skipping ledger post:", razorpay_payment_id);
        } else {
          console.error("subscription_payments insert failed (reconciler cannot heal this — investigate):", subErr.message);
        }
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

    trackServer(req.user.id, "subscription_purchased", {
      plan,
      cadence: "annual",
      expires_at: expiresAt.toISOString(),
    }, {
      value: Number(breakdown?.totalCharged) || 0,
      currency: "INR",
      email: profile.email,
      eventId: razorpay_payment_id,
      gaClientId: req.body?.ga_client_id,
    });

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
    safeError(res, error);
  }
};

// ══ Auto-renewing subscriptions (Razorpay Subscriptions API) ══════════════════

// ── POST /api/payment/subscription/create  { plan, cadence } ──────────────────
// Creates a Razorpay subscription (mandate). Access is NOT granted here — the
// subscription.activated/charged webhook (or the sync endpoint) activates it.
const createVendorSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    const cadence = normCadence(req.body.cadence);
    if (!['monthly', 'annual'].includes(cadence)) {
      return res.status(400).json({ message: "cadence must be 'monthly' or 'annual'" });
    }
    const planRecord = await planService.getPlan(plan);
    if (!planRecord || planRecord.slug !== planService.normalizeSlug(plan)) {
      return res.status(404).json({ message: "Plan not found" });
    }
    if (!(cadencePrice(planRecord, cadence) > 0)) {
      return res.status(400).json({ message: `This plan has no ${cadence} price.` });
    }

    // ── Proration / switch context (Phase C) ──────────────────────────────
    // A SWITCH is when a vendor on a settled paid plan (status='active', period
    // still in future) changes tier/cadence. Unused value becomes FREE DAYS on
    // the new plan via a deferred subscription start_at — single mandate, no
    // second payment. Excess credit beyond one new period is forfeited (#4).
    // Legacy one-time annual vendors (no razorpay_subscription_id) are migrated
    // by the SAME path: their remaining paid days seed the credit.
    const { data: prof } = await supabaseAdmin.from("profiles")
      .select("plan, subscription_status, current_period_end, plan_expires_at, plan_activated_at, razorpay_subscription_id, billing_cadence")
      .eq("id", req.user.id).single();

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const periodEndMs = prof?.current_period_end ? new Date(prof.current_period_end).getTime()
      : prof?.plan_expires_at ? new Date(prof.plan_expires_at).getTime() : 0;
    const onPaidPlan = prof && planService.normalizeSlug(prof.plan) !== "starter";
    const isSwitch = !!(onPaidPlan && prof.subscription_status === "active" && periodEndMs > nowMs);

    let switchInfo = null, startAt;
    if (isSwitch) {
      const { gstRate } = await platformConfig.getConfig();
      const newGross = cadenceGross(planRecord, cadence, gstRate);

      // Determine amount paid + period for the current plan (subscription first,
      // then legacy plan_purchases for one-time annual vendors).
      let amountPaid = 0, periodStart = prof.plan_activated_at, periodEnd = prof.current_period_end || prof.plan_expires_at;
      const { data: lastPay } = await supabaseAdmin.from("subscription_payments")
        .select("total_charged, billing_period_start, billing_period_end")
        .eq("vendor_id", req.user.id).order("paid_at", { ascending: false }).limit(1).maybeSingle();
      if (lastPay) {
        amountPaid = Number(lastPay.total_charged) || 0;
        periodStart = lastPay.billing_period_start; periodEnd = lastPay.billing_period_end;
      } else {
        const { data: lastPurchase } = await supabaseAdmin.from("plan_purchases")
          .select("amount_paid, activated_at, expires_at")
          .eq("vendor_id", req.user.id).order("activated_at", { ascending: false }).limit(1).maybeSingle();
        if (lastPurchase) {
          amountPaid = (Number(lastPurchase.amount_paid) || 0) / 100; // stored in paise
          periodStart = lastPurchase.activated_at; periodEnd = lastPurchase.expires_at;
        }
      }

      if (amountPaid > 0 && periodStart && periodEnd) {
        switchInfo = computeSwitch({ amountPaid, periodStart, periodEnd, now: nowIso, newPeriodGross: newGross, newCadence: cadence });
        if (switchInfo.creditDays > 0) startAt = switchInfo.startAtUnix;
      } else {
        console.warn(`Switch detected for vendor ${req.user.id} but no prior payment found — proceeding without proration credit.`);
      }
    }

    // Cancel any prior Razorpay subscription BEFORE creating the replacement, so
    // a switch (or an abandoned pending setup) never leaves two live mandates →
    // double-charge. A real failure here is fatal; "already gone" is tolerated.
    if (prof?.razorpay_subscription_id) {
      try {
        await razorpaySubscriptions.cancelSubscription(prof.razorpay_subscription_id, false);
      } catch (e) {
        const msg = e?.error?.description || e?.message || "";
        const alreadyGone = /not found|already cancelled|already canceled|cancelled|completed|does not exist/i.test(msg);
        if (!alreadyGone) {
          console.error("cancel old subscription failed (fatal — aborting to avoid double mandate):", msg);
          return res.status(502).json({ message: "Could not switch plans right now. Please try again." });
        }
      }
    }

    const planId = await razorpaySubscriptions.ensureRazorpayPlan(planRecord, cadence);
    const subscription = await razorpaySubscriptions.createSubscription({
      planId, cadence,
      notes: { vendor_id: req.user.id, plan: planRecord.slug, cadence },
      startAt,
    });

    if (isSwitch) {
      // Grant the new tier + free days immediately (vendor already paid for the
      // old period) but keep status 'pending' until the mandate is authorized.
      const grantedEnd = new Date(nowMs + ((switchInfo?.creditDays || 0) + cadencePeriodDays(cadence)) * 86400000).toISOString();
      const { error: upErr } = await supabaseAdmin.from("profiles").update({
        plan: planRecord.slug, billing_cadence: cadence, subscription_status: "pending",
        razorpay_subscription_id: subscription.id, current_period_end: grantedEnd, plan_expires_at: grantedEnd,
        plan_updated_at: nowIso, updated_at: nowIso,
      }).eq("id", req.user.id);
      // Razorpay subscription already created — a silent profile-update failure
      // would charge the vendor without granting access. Fail loud for reconciliation.
      if (upErr) {
        console.error(`subscription switch: profile update failed for vendor ${req.user.id} (sub ${subscription.id}):`, upErr.message);
        return res.status(502).json({ message: "Subscription created but activation failed. Please contact support." });
      }
    } else {
      // Fresh upgrade from free/expired — no access until the mandate activates.
      const { error: upErr } = await supabaseAdmin.from("profiles")
        .update({ razorpay_subscription_id: subscription.id, subscription_status: "pending", updated_at: nowIso })
        .eq("id", req.user.id);
      if (upErr) {
        console.error(`subscription create: profile update failed for vendor ${req.user.id} (sub ${subscription.id}):`, upErr.message);
        return res.status(502).json({ message: "Subscription created but activation failed. Please contact support." });
      }
    }

    auditLog('SUBSCRIPTION_CREATED', req.user.id, { plan: planRecord.slug, cadence, subscription_id: subscription.id, switch: isSwitch });
    res.json({
      subscription_id: subscription.id, key: await razorpayConfig.getKeyId(), plan: planRecord.slug, cadence,
      ...(switchInfo ? { credit_applied: switchInfo.creditApplied, forfeited: switchInfo.forfeited, free_days: switchInfo.creditDays } : {}),
    });
  } catch (error) {
    safeError(res, error);
  }
};

// ── POST /api/payment/subscription/sync ───────────────────────────────────────
// On-return fallback for webhook latency: pull live status from Razorpay and
// activate immediately so the vendor isn't stuck waiting on a webhook.
const syncVendorSubscription = async (req, res) => {
  try {
    const { data: prof } = await supabaseAdmin.from("profiles")
      .select("razorpay_subscription_id").eq("id", req.user.id).single();
    if (!prof?.razorpay_subscription_id) {
      return res.json({ status: "none" });
    }
    const rzpSub = await razorpaySubscriptions.fetchSubscription(prof.razorpay_subscription_id);
    if (subscriptionService.ACTIVE_STATES.includes(rzpSub.status)) {
      await subscriptionService.activateFromSubscription({ rzpSub });
    } else if (rzpSub.status === "halted") {
      await subscriptionService.markHalted(rzpSub);
    } else if (["cancelled", "expired", "completed"].includes(rzpSub.status)) {
      await subscriptionService.markCancelled(rzpSub);
    }
    const { data: updated } = await supabaseAdmin.from("profiles")
      .select("id, plan, plan_expires_at, billing_cadence, subscription_status, current_period_end")
      .eq("id", req.user.id).single();
    res.json({ status: rzpSub.status, profile: updated });
  } catch (error) {
    safeError(res, error);
  }
};

// ── POST /api/payment/subscription/cancel ─────────────────────────────────────
// Cancel at cycle end — vendor keeps access until current_period_end.
const cancelVendorSubscription = async (req, res) => {
  try {
    const { data: prof } = await supabaseAdmin.from("profiles")
      .select("razorpay_subscription_id, subscription_status").eq("id", req.user.id).single();
    if (!prof?.razorpay_subscription_id) {
      return res.status(400).json({ message: "No active subscription to cancel." });
    }
    await razorpaySubscriptions.cancelSubscription(prof.razorpay_subscription_id, true);
    await supabaseAdmin.from("profiles")
      .update({ subscription_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", req.user.id);
    auditLog('SUBSCRIPTION_CANCELLED', req.user.id, { subscription_id: prof.razorpay_subscription_id });
    res.json({ message: "Subscription cancelled. You keep access until the end of the current period." });
  } catch (error) {
    safeError(res, error);
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
    const razorpay = await razorpayConfig.getClient();
    const order = await razorpay.orders.create({
      amount: totalPaise, currency: "INR",
      receipt: `prd_${product_id.slice(0, 20)}`,
      notes: { product_id, title: product.title, platform_fee: productFee },
    });
    res.json({ razorpay_order_id: order.id, amount: order.amount, currency: order.currency,
      key: await razorpayConfig.getKeyId(),
      product_price: product.price, platform_fee: productFee });
  } catch (error) {
    safeError(res, error);
  }
};

// ── POST /api/payment/reschedule-fee/create-order ────────────
const createRescheduleFeeOrder = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("id, guest_id, reschedule_count, profiles!bookings_host_id_fkey(reschedule_fee)")
      .eq("id", booking_id).single();
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (req.user?.id !== booking.guest_id) return res.status(403).json({ message: "Not authorized" });
    const featureFlags = require('../services/featureFlags');
    if (!(await featureFlags.isFeatureEnabled('reschedule_fee'))) {
      return res.status(400).json({ message: 'Reschedule fee is not enabled', fee: 0 });
    }
    const fee = Number(booking["profiles!bookings_host_id_fkey"]?.reschedule_fee) || 0;
    if (fee <= 0 || (Number(booking.reschedule_count) || 0) < 1) {
      return res.status(400).json({ message: "No reschedule fee due", fee: 0 });
    }
    const razorpay = await razorpayConfig.getClient();
    const order = await razorpay.orders.create({
      amount: Math.round(fee * 100), currency: "INR",
      receipt: `rsf_${booking_id.slice(0, 20)}`,
      notes: { booking_id, kind: "reschedule_fee" },
    });
    res.json({ razorpay_order_id: order.id, amount: order.amount, currency: order.currency, fee,
      key: await razorpayConfig.getKeyId() });
  } catch (e) {
    res.status(500).json({ message: "Could not start reschedule fee payment" });
  }
};

// ── POST /api/payment/verify-product ────────────────────────
const verifyProductPayment = async (req, res) => {
  try {
    const { product_id, buyer_name, buyer_phone,
      razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    // buyer_id is never trusted from the body — derive from the session if any.
    const buyerId = req.user?.id || null;
    const buyerEmail = String(req.body.buyer_email || '').toLowerCase().trim();

    const keySecret = await razorpayConfig.getKeySecret();
    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret)) {
      securityLog('PRODUCT_PAYMENT_SIGNATURE_INVALID', { product_id, ip: req.ip });
      return res.status(400).json({ message: "Payment verification failed." });
    }

    const { data: product } = await supabaseAdmin
      .from("products").select("id, price, host_id").eq("id", product_id).single();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const productFee = calculatePlatformFee(product.price);

    // SECURITY: the signature only proves the order/payment pair is genuine —
    // not WHAT it was for. Fetch the Razorpay order and assert it was created
    // for THIS product and the correct amount; otherwise a buyer could pay for
    // a cheap product and verify against an expensive product_id.
    let rzpOrder;
    try {
      const razorpay = await razorpayConfig.getClient();
      rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
    } catch (_) {
      return res.status(400).json({ message: "Order not found." });
    }
    const expectedPaise = Math.round((product.price + productFee) * 100);
    if (String(rzpOrder?.notes?.product_id) !== String(product_id) || Number(rzpOrder?.amount) !== expectedPaise) {
      securityLog('PRODUCT_PAYMENT_MISMATCH', { product_id, order_id: razorpay_order_id, ip: req.ip });
      return res.status(400).json({ message: "Payment does not match this product." });
    }

    // Idempotent: never issue two purchases for the same order (replay guard).
    const { data: existingPurchase } = await supabaseAdmin
      .from("product_purchases").select("download_token")
      .eq("razorpay_order_id", razorpay_order_id).limit(1).maybeSingle();
    if (existingPurchase) {
      return res.json({ message: "Payment verified", download_token: existingPurchase.download_token });
    }

    const downloadToken = crypto.randomUUID();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const { data: purchase, error } = await supabaseAdmin
      .from("product_purchases").insert({
        product_id, host_id: product.host_id,
        buyer_id: buyerId, buyer_name, buyer_email: buyerEmail, buyer_phone,
        amount_paid: product.price, platform_fee: productFee,
        payment_status: "paid", razorpay_order_id, razorpay_payment_id,
        download_token: downloadToken,
        download_token_expires_at: tokenExpires.toISOString(),
      }).select().single();

    if (error) return safeError(res, error);
    // BUG-15 fixed: atomic increment to avoid race condition under concurrent purchases
    await supabaseAdmin.rpc("increment_product_purchase_count", { row_id: product_id });

    auditLog('PRODUCT_PURCHASED', buyerId, { product_id, amount: product.price });

    trackServer(resolveGuestId({ guestId: buyerId, guestEmail: buyerEmail }), "product_purchased", {
      product_id,
      host_id: product.host_id,
      amount: Number(product.price) || 0,
      currency: "INR",
      razorpay_payment_id,
    }, {
      value: Number(product.price) || 0,
      currency: "INR",
      email: buyerEmail,
      phone: buyer_phone,
      eventId: razorpay_payment_id,
      gaClientId: req.body?.ga_client_id,
    });

    res.json({ message: "Payment verified", download_token: downloadToken, purchase });
  } catch (error) {
    safeError(res, error);
  }
};

// ── POST /api/payment/webhook ────────────────────────────────
// Razorpay server-side webhook for payment.captured / payment.failed events
// MUST use raw body — register before express.json()
const handleWebhook = async (req, res) => {
  const webhookSecret = await razorpayConfig.getWebhookSecret();
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

  const expectedBuf = Buffer.from(expectedSig);
  const sigBuf = Buffer.from(String(signature));
  // Length-guard: timingSafeEqual throws on unequal-length buffers.
  if (expectedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
    securityLog('WEBHOOK_SIGNATURE_INVALID', { ip: req.ip });
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  let event;
  try { event = JSON.parse(req.body.toString()); }
  catch { return res.status(400).json({ message: "Invalid JSON" }); }

  // ── Subscription lifecycle (handled BEFORE the payment-only guard, since
  // subscription.activated/halted/cancelled carry no payment entity) ──
  if (typeof event.event === 'string' && event.event.startsWith('subscription.')) {
    const rzpSub = event.payload?.subscription?.entity;
    const rzpPayment = event.payload?.payment?.entity || null;
    try {
      if (rzpSub) {
        if (event.event === 'subscription.charged' || event.event === 'subscription.activated') {
          await subscriptionService.activateFromSubscription({ rzpSub, rzpPayment });
          auditLog('WEBHOOK_SUBSCRIPTION_ACTIVE', null, { subscription_id: rzpSub.id, event: event.event });
        } else if (event.event === 'subscription.halted') {
          await subscriptionService.markHalted(rzpSub);
          securityLog('WEBHOOK_SUBSCRIPTION_HALTED', { subscription_id: rzpSub.id });
        } else if (event.event === 'subscription.cancelled') {
          await subscriptionService.markCancelled(rzpSub);
          auditLog('WEBHOOK_SUBSCRIPTION_CANCELLED', null, { subscription_id: rzpSub.id });
        }
      }
    } catch (err) {
      securityLog('WEBHOOK_PROCESSING_ERROR', { event: event.event, error: err.message });
      // Fire-and-forget: 500 makes Razorpay retry, but if retries exhaust the
      // subscription would silently stay pending. Alert the founder. Throttled
      // per event type so a retry burst doesn't spam.
      adminAlert({
        key: `webhook_error:${event.event}`,
        subject: `Razorpay webhook failed: ${event.event}`,
        lines: [
          `Event: ${event.event}`,
          rzpSub?.id ? `Subscription: ${rzpSub.id}` : null,
          `Error: ${err.message}`,
          `Razorpay will retry. If this persists the subscription may stay pending — reconcile against the Razorpay dashboard.`,
        ].filter(Boolean),
      });
      return res.status(500).json({ error: 'processing_failed' });
    }
    return res.json({ received: true });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment) return res.json({ received: true });

  try {
    if (event.event === 'payment.captured') {
      const notes = payment.notes || {};
      if (notes.booking_id) {
        // idempotent: only the unpaid→paid transition matches; .select() lets us
        // tell whether THIS call did the transition (vs verifyPayment already did)
        // so the analytics event fires exactly once even though both paths run.
        const { data: paidRows } = await supabaseAdmin.from("bookings")
          .update({ payment_status: "paid", status: "confirmed",
            razorpay_payment_id: payment.id, updated_at: new Date().toISOString() })
          .eq("id", notes.booking_id).eq("payment_status", "unpaid")
          .select("id, host_id, guest_id, guest_email, customer_total, services(title)");
        auditLog('WEBHOOK_BOOKING_PAID', null, { booking_id: notes.booking_id, payment_id: payment.id });
        const paid = paidRows && paidRows[0];
        if (paid) {
          trackServer(resolveGuestId({ guestId: paid.guest_id, guestEmail: paid.guest_email }), "booking_paid", {
            booking_id: paid.id,
            service_title: paid.services?.title,
            host_id: paid.host_id,
            amount: Number(paid.customer_total) || 0,
            currency: "INR",
            razorpay_payment_id: payment.id,
            source: "webhook",
          }, {
            value: Number(paid.customer_total) || 0,
            currency: "INR",
            email: paid.guest_email,
            eventId: payment.id,              // same id browser pixel used → de-dupe
          });
        }
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
    // Fire-and-forget: 500 makes Razorpay retry, but if retries exhaust the
    // booking would silently stay unpaid. Alert the founder. Throttled per
    // event type so a retry burst doesn't spam.
    adminAlert({
      key: `webhook_error:${event.event}`,
      subject: `Razorpay webhook failed: ${event.event}`,
      lines: [
        `Event: ${event.event}`,
        payment?.notes?.booking_id ? `Booking: ${payment.notes.booking_id}` : null,
        payment?.id ? `Payment: ${payment.id}` : null,
        `Error: ${err.message}`,
        `Razorpay will retry. If this persists the booking may stay unpaid — reconcile against the Razorpay dashboard.`,
      ].filter(Boolean),
    });
    return res.status(500).json({ error: 'processing_failed' });
  }

  res.json({ received: true });
};

module.exports = {
  createOrder, verifyPayment, signatureValid, subscribePlan, verifySubscription,
  createVendorSubscription, syncVendorSubscription, cancelVendorSubscription,
  createProductOrder, verifyProductPayment, createRescheduleFeeOrder, handleWebhook,
};

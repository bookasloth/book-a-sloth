const { supabaseAdmin } = require("../config/supabase");
const { safeError } = require('../utils/httpError');
const { createCalendarEvent, updateCalendarEvent } = require("../config/google");
const featureFlags = require("../services/featureFlags");
const sendEmail = require("../utils/sendEmail");
const NotificationEngine = require("../services/notificationEngine");
const { checkBookingReceiveLimit } = require("../middleware/planMiddleware");
const crypto = require("crypto");
const { computeBreakdown } = require("../lib/pricingEngine");
const planService = require("../services/planService");
const platformConfig = require("../services/platformConfig");
const availabilityService = require("../services/availabilityService");
const { decrypt: decryptToken } = require("../utils/cryptoTokens");
const { capture: phCapture, resolveGuestId } = require("../utils/posthog");
const { runInBackground } = require("../utils/background");
const { hostOf } = require("../utils/hostOf");
const profileSecrets = require("../utils/profileSecrets");
const guestGrant = require("../utils/bookingGrant");

const emailHtml = (body) => `
  <div style="max-width:520px;margin:0 auto;padding:26px;border-radius:24px;background:#ffffff;font-family:'Plus Jakarta Sans','Poppins',sans-serif;color:#111827;box-shadow:0 24px 60px rgba(15,23,42,0.08);">
    ${body}
    <div style="margin-top:24px;padding:18px;border-radius:18px;background:#f8fafc;color:#6b7280;font-size:14px;">Book A Sloth — calm booking for busy hosts.</div>
  </div>`;

const row = (label, value) =>
  `<p style="margin:0 0 12px;font-size:15px;color:#374151;"><strong>${label}:</strong> ${value}</p>`;

const escHtml = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const button = (href, label) =>
  `<a href="${href}" style="display:inline-block;margin-top:12px;padding:12px 18px;border-radius:12px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">${label}</a>`;

// WhatsApp template params for the approved AiSensy booking templates:
//   customer: [customerName, serviceTitle, vendorName, dateTime]
//   vendor:   [vendorName, customerName, serviceTitle, dateTime]
// `actionLink` is OPTIONAL and APPEND-ONLY: pass it only for the reminder
// templates (which carry a 5th body variable = join/directions link). The
// confirmed/cancelled/rescheduled AiSensy templates only have 4 vars, so
// callers that omit actionLink keep the 4-param shape and never break.
const customerParams = ({ guestName, serviceTitle, hostName, when, actionLink }) => {
  const p = [guestName || "Customer", serviceTitle || "Service", hostName || "Host", when];
  if (actionLink) p.push(actionLink);
  return p;
};
const vendorParams = ({ guestName, serviceTitle, hostName, when, actionLink }) => {
  const p = [hostName || "Host", guestName || "Customer", serviceTitle || "Service", when];
  if (actionLink) p.push(actionLink);
  return p;
};

// ── Email placeholder data for the Communication Engine templates ──
// Split a scheduled time into {{booking_date}} / {{booking_time}}.
const splitWhen = (scheduledAt, tz = "Asia/Kolkata") => {
  const d = new Date(scheduledAt);
  return {
    booking_date: d.toLocaleDateString("en-IN", { timeZone: tz, weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    booking_time: d.toLocaleTimeString("en-IN", { timeZone: tz, hour: "2-digit", minute: "2-digit" }),
    booking_day: d.toLocaleDateString("en-IN", { timeZone: tz, day: "2-digit" }),
    booking_month: d.toLocaleDateString("en-IN", { timeZone: tz, month: "short" }).toUpperCase(),
    booking_year: d.toLocaleDateString("en-IN", { timeZone: tz, year: "numeric" }),
  };
};
// Placeholder map shared by customer + vendor booking emails.
const bookingEmailData = ({ serviceTitle, hostName, hostPhone, guestName, scheduledAt, tz, bookingId, online, actionLink }) => {
  const dashboard = `${process.env.CLIENT_URL || "https://bookasloth.in"}/dashboard`;
  const link = actionLink || dashboard;
  return {
    service_name: serviceTitle || "Service",
    vendor_name: hostName || "Host",
    vendor_phone: hostPhone || "",
    user_name: guestName || "Customer",
    booking_id: bookingId || "",
    location: online ? "Online" : "",
    // Reminder CTA: Meet link when online, dashboard otherwise (offline maps
    // link lands in Phase 2). action_label drives the button text once the
    // engine resolves cta_label.
    action_link: link,
    action_label: online && actionLink ? "Join meeting" : "View booking",
    ...splitWhen(scheduledAt, tz),
  };
};

const BOOKING_SERVICE_SELECT =
  "scheduled_at, services(duration, grace_period_minutes)";
const BOOKING_SERVICE_SELECT_FALLBACK = "scheduled_at, services(duration)";

const selectBookingServiceRows = async (buildQuery) => {
  let result = await buildQuery(BOOKING_SERVICE_SELECT);
  // Retry with fallback if schema cache doesn't recognize newer columns
  if (result.error && /Could not find the|column.*does not exist/i.test(result.error.message)) {
    result = await buildQuery(BOOKING_SERVICE_SELECT_FALLBACK);
  }
  return result;
};

const selectServiceWithFallback = async (query) => {
  let result = await query.select("*");
  // Fallback to core fields if schema cache is stale
  if (result.error && /Could not find the|column.*does not exist/i.test(result.error.message)) {
    result = await query.select("id, service_id, host_id, guest_id, guest_name, guest_email, guest_phone, scheduled_at, status, payment_status, meeting_link, notes, created_at, updated_at");
  }
  return result;
};

// GET /api/bookings/service/:id  (public, unauthenticated)
const getServiceById = async (req, res) => {
  try {
    // Security audit M-7: this endpoint is unauthenticated, so only ACTIVE
    // services may be returned — otherwise anyone with a service UUID could read
    // a draft/deactivated listing. (The authenticated host dashboards use other
    // endpoints to preview their own inactive services.)
    let serviceResult = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("id", req.params.id)
      .eq("is_active", true)
      .single();
    // Fallback if schema cache is stale
    if (serviceResult.error && /Could not find the|column.*does not exist/i.test(serviceResult.error.message)) {
      serviceResult = await supabaseAdmin
        .from("services")
        .select("id, host_id, title, description, type, duration, price, currency, meeting_mode, is_active, created_at, updated_at")
        .eq("id", req.params.id)
        .eq("is_active", true)
        .single();
    }
    const { data: service, error } = serviceResult;
    if (error || !service)
      return res.status(404).json({ message: "Service not found" });
    const { data: host } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, username, tagline, profile_image")
      .eq("id", service.host_id)
      .single();
    res.json({ service, host });
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/bookings/slots?host_id=&date=  — Task 3
const getBookedSlots = async (req, res) => {
  try {
    const { host_id, date } = req.query;
    if (!host_id || !date)
      return res.status(400).json({ message: "host_id and date are required" });
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const { data, error } = await selectBookingServiceRows((select) =>
      supabaseAdmin
        .from("bookings")
        .select(select)
        .eq("host_id", host_id)
        .neq("status", "cancelled")
        .gte("scheduled_at", start.toISOString())
        .lte("scheduled_at", end.toISOString()),
    );
    if (error) return safeError(res, error);
    res.json(data || []);
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/bookings/available-slots?host_id=&service_id=&date=YYYY-MM-DD
// Server-computed availability: working hours − blocked dates − platform
// bookings − Google busy − buffers. The client renders this list verbatim.
const getAvailableSlots = async (req, res) => {
  try {
    const { host_id, service_id, date } = req.query;
    if (!host_id || !service_id || !date)
      return res.status(400).json({ message: "host_id, service_id and date are required" });

    const [{ data: service }, { data: host }, { data: availability }] = await Promise.all([
      supabaseAdmin.from("services").select("id, duration, grace_period_minutes").eq("id", service_id).single(),
      supabaseAdmin.from("profiles").select("id, google_calendar_connected").eq("id", host_id).single(),
      supabaseAdmin.from("availability").select("*").eq("host_id", host_id).maybeSingle(),
    ]);
    if (!service) return res.status(404).json({ message: "Service not found" });
    if (!host) return res.status(404).json({ message: "Host not found" });
    await profileSecrets.attachGoogleTokens(host);

    const result = await availabilityService.computeSlots({
      host, service, availability, dateStr: date,
    });
    res.json(result);
  } catch (error) {
    safeError(res, error);
  }
};

// POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const {
      service_id,
      guest_name,
      guest_email,
      guest_phone,
      scheduled_at,
      notes,
      booking_grant,
    } = req.body;

    // ── Input validation (security audit M-5) — defence-in-depth; reject junk
    // before any DB work and before user-controlled values reach notifications. ──
    if (typeof service_id !== "string" || !service_id)
      return res.status(400).json({ message: "A valid service is required." });
    if (
      guest_email != null &&
      !(typeof guest_email === "string" &&
        guest_email.length <= 254 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guest_email))
    )
      return res.status(400).json({ message: "Enter a valid email address." });
    if (scheduled_at == null || Number.isNaN(new Date(scheduled_at).getTime()))
      return res.status(400).json({ message: "Choose a valid time slot." });

    // ── OTP gate (security audit H-1) ──
    // An anonymous booking must present a short-lived grant issued by
    // /auth/verify-otp, bound to the contact that received the code. Logged-in
    // users (req.user, set by `protect`) are already authenticated. Without this
    // the API trusts a bare guest_email/phone → anyone can create bookings for
    // any address (notification/phishing relay + slot squatting).
    if (!req.user) {
      if (!guest_email && !guestGrant.normalizePhone(guest_phone))
        return res.status(400).json({ message: "A valid email or mobile number is required." });
      if (!guestGrant.verify(booking_grant, { email: guest_email, phone: guest_phone }))
        return res
          .status(401)
          .json({ message: "Please verify your email or mobile with the code we sent, then book." });
    }
    // SECURITY: host_id is NEVER taken from the request body. The client could
    // pass any host_id (mismatched from the service) to attach a booking to the
    // wrong vendor, bypass that vendor's availability, or harvest another host's
    // booking cap. host_id is derived below from the service the booking is for.
    // guest_id is likewise never taken from the body (IDOR) — see resolvedGuestId.

    // Fetch the service first: it is the authority for host_id and must be a
    // live, bookable service. A missing OR inactive service is "not available".
    const { data: service } = await supabaseAdmin
      .from("services").select("*").eq("id", service_id).single();
    if (!service || service.is_active === false)
      return res.status(404).json({ message: "Service not available" });

    // Derive host_id from the service — the only trustworthy source.
    const host_id = service.host_id;

    // Host + availability are now keyed off the derived host_id. These two reads
    // are independent → fetch them in one round-trip.
    const [
      { data: host },
      { data: avail },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", host_id).single(),
      supabaseAdmin.from("availability").select("*").eq("host_id", host_id).maybeSingle(),
    ]);
    if (!host) return res.status(404).json({ message: "Host not found" });
    await profileSecrets.attachGoogleTokens(host);

    // Resolve guest_id server-side (never from the body, never from an email
    // lookup). Only a logged-in user links to their own id; an anonymous booking
    // gets guest_id = null and is identified solely by guest_email/name/phone.
    // (Matching an arbitrary email to an existing profile would let an attacker
    // file bookings under any victim's account.)
    const resolvedGuestId = req.user?.id || null;

    const hostTimezone = avail?.timezone || "Asia/Kolkata";

    // Full availability validation: past, blocked dates, working-hours window,
    // platform double-booking (grace-aware) AND Google Calendar busy periods.
    const newStart = new Date(scheduled_at);
    const newEnd = new Date(newStart.getTime() + (service.duration || 30) * 60000);
    const slotCheck = await availabilityService.validateSlot({
      host, service, availability: avail, scheduledAtUTC: scheduled_at,
    });
    if (!slotCheck.ok) {
      const status = /past/i.test(slotCheck.reason) ? 400 : 409;
      return res.status(status).json({ message: slotCheck.reason });
    }

    // Plan limit: check if host has hit monthly booking cap (Explorer = 20/month)
    const limitCheck = await checkBookingReceiveLimit(host_id);
    if (!limitCheck.allowed)
      return res.status(403).json({ message: limitCheck.message });

    // ── Pricing snapshot (final money model — pricingEngine, no inline formulas) ──
    const bookingValue = service.price; // service amount; add-ons not yet supported

    // Commission % is read from the vendor's subscription plan record (DB-driven,
    // admin-editable). Expired paid plans fall back to the free tier.
    const effectivePlanSlug = planService.resolveVendorPlan(host);
    const planRecord        = await planService.getPlan(effectivePlanSlug);
    const commissionPct     = Number(planRecord.commission_percentage) || 0;

    // Platform fee + GST rate are admin-editable settings.
    const { platformFee: feeSetting, gstRate } = await platformConfig.getConfig();

    // Razorpay fee is vendor-borne and only known at capture → finalised in
    // paymentController.verifyPayment. Here razorpayFee = 0 (payout provisional).
    const pricing = computeBreakdown({
      servicePrice:         bookingValue,
      commissionPercentage: commissionPct,
      platformFee:          feeSetting,
      gstRate,
      razorpayFee:          0,
    });
    const platformFee  = pricing.platformFee;
    const commission   = pricing.commission;
    const vendorPayout = pricing.vendorPayout;

    // Google Calendar — created at booking time ONLY for FREE services.
    // PAID services defer event creation to paymentController.verifyPayment so a
    // pending/unpaid booking does not place a placeholder event that would then
    // collide with itself during pre-payment slot re-validation (the "slot no
    // longer available" bug) and to avoid orphan events from abandoned checkouts.
    let meetingLink = "";
    let googleEventId = null;
    const isOnline = service.meeting_mode !== "offline";
    if (
      isOnline &&
      service.price === 0 &&
      host.google_calendar_connected &&
      host.google_refresh_token &&
      (await featureFlags.isFeatureEnabled("google_calendar"))
    ) {
      try {
        const startTime = new Date(scheduled_at);
        const endTime = new Date(
          startTime.getTime() + service.duration * 60000,
        );
        const event = await createCalendarEvent(
          decryptToken(host.google_access_token),
          decryptToken(host.google_refresh_token),
          {
            title: `${service.title} — ${guest_name || "Guest"}`,
            description: `Booked via Book A Sloth\n${notes || ""}`,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            timezone: hostTimezone,
            attendees: [
              { email: host.email },
              ...(guest_email ? [{ email: guest_email }] : []),
            ],
          },
        );
        meetingLink = event.meetLink || "";
        googleEventId = event.eventId || null;
      } catch (calError) {
        console.error("Google Calendar error:", calError.message);
      }
    }

    // Base booking payload — fields present in all schema versions
    const bookingPayload = {
      service_id,
      host_id,
      guest_id: resolvedGuestId,
      guest_name,
      guest_email,
      guest_phone,
      scheduled_at,
      end_at: newEnd.toISOString(),  // backs the v2.5 no-overlap exclusion constraint
      notes,
      meeting_link: meetingLink,
      google_event_id: googleEventId,
      vendor_amount:       vendorPayout,
      platform_fee_amount: platformFee,
      platform_fee_gst:    pricing.gst,           // GST on platform fee (v2.2)
      customer_total:      pricing.customerTotal,  // service + fee + GST (v2.2)
      gst_rate:            gstRate,                // snapshot of rate used (v2.2)
      razorpay_fee_actual: 0,                      // set at payment capture (v2.2)
      razorpay_tax_actual: 0,                      // set at payment capture (v2.8)
      commission_applied:  commission,    // requires v1.7 migration
      commission_gst:        pricing.commissionGst,   // v2.8: 18% GST on commission, vendor-borne
      commission_percentage: commissionPct,           // v2.8 snapshot
      vendor_plan_type:      effectivePlanSlug,       // v2.8 snapshot
      reminder_24h_sent: false,
      reminder_1h_sent: false,
      status: service.price === 0 ? "confirmed" : "pending",
      payment_status: service.price === 0 ? "paid" : "unpaid",
    };

    let bookingResult = await supabaseAdmin
      .from("bookings")
      .insert(bookingPayload)
      .select()
      .single();

    // Fallback: retry without commission_applied if v1.7 migration hasn't run yet
    if (
      bookingResult.error &&
      /Could not find the|column.*does not exist/i.test(bookingResult.error.message)
    ) {
      // Drop v1.7 + v2.2 + v2.5 + v2.8 columns if the migrations haven't been applied yet
      const {
        commission_applied: _c, platform_fee_gst: _g, customer_total: _t,
        gst_rate: _r, razorpay_fee_actual: _f, razorpay_tax_actual: _rt, end_at: _e,
        commission_gst: _cg, commission_percentage: _cp, vendor_plan_type: _vp,
        google_event_id: _gei,
        ...payloadCore
      } = bookingPayload;
      bookingResult = await supabaseAdmin
        .from("bookings")
        .insert(payloadCore)
        .select()
        .single();
    }

    // Concurrency backstop: the v2.5 exclusion constraint rejects a racing
    // insert that passed the application-level check microseconds earlier.
    if (
      bookingResult.error &&
      (bookingResult.error.code === "23P01" ||
        /bookings_no_overlap|exclusion constraint/i.test(bookingResult.error.message))
    ) {
      return res.status(409).json({
        message: "This time slot is no longer available. Please choose another.",
      });
    }

    const { data: booking, error } = bookingResult;
    if (error) return safeError(res, error);

    // Respond now; confirmation emails (WhatsApp + SMTP) and analytics are
    // best-effort side-effects that should not add seconds to the user's wait.
    res.status(201).json(booking);

    const when = new Date(scheduled_at).toLocaleString("en-IN", {
      timeZone: hostTimezone,
    });

    // BUG-12 fixed: only send confirmation emails for FREE services.
    // Paid services: emails are sent in paymentController.verifyPayment after payment succeeds.
    if (service.price === 0) {
      runInBackground("createBooking:confirmation-emails", async () => {
        if (!(await featureFlags.isFeatureEnabled("confirmation_emails"))) return;
        const ctx = { guestName: guest_name, serviceTitle: service.title, hostName: host.name, when };
        const emailData = bookingEmailData({
          serviceTitle: service.title, hostName: host.name, hostPhone: host.phone,
          guestName: guest_name, scheduledAt: scheduled_at, tz: hostTimezone,
          bookingId: booking.id, online: !!meetingLink,
        });
        await NotificationEngine.send({
          event: "BOOKING_CONFIRMED_CUSTOMER",
          data: {
            email: guest_email, phone: guest_phone, name: guest_name,
            templateParams: customerParams(ctx),
            emailData, emailUser: { name: guest_name, email: guest_email },
            recipientUserId: resolvedGuestId, bookingId: booking.id,
          },
        });
        await NotificationEngine.send({
          event: "BOOKING_CONFIRMED_VENDOR",
          data: {
            email: host.email, phone: host.phone, name: host.name,
            templateParams: vendorParams(ctx),
            emailData, emailUser: { name: host.name, email: host.email, username: host.username },
            recipientUserId: host_id, bookingId: booking.id,
          },
        });
      });
    }

    phCapture(resolveGuestId({ guestId: resolvedGuestId, guestEmail: guest_email }), "booking_created", {
      booking_id: booking.id,
      service_id,
      service_title: service.title,
      host_id,
      price: service.price,
      is_paid: service.price > 0,
      payment_status: booking.payment_status,
    });
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/bookings/host
const getHostBookings = async (req, res) => {
  try {
    // Vendors only see PAID bookings. An unpaid/pending booking is not yet the
    // vendor's booking — it is a lead and only Admin can see it. payment_status
    // 'paid' covers paid/confirmed and paid-then-cancelled (refund visibility);
    // 'unpaid' and 'failed' stay hidden. Admin endpoints see everything.
    let result = await supabaseAdmin
      .from("bookings")
      .select("*, services(*), profiles!bookings_guest_id_fkey(*)")
      .eq("host_id", req.user.id)
      .eq("payment_status", "paid")
      .order("scheduled_at", { ascending: true });
    // Fallback if schema cache is stale
    if (result.error && /Could not find the|column.*does not exist/i.test(result.error.message)) {
      result = await supabaseAdmin
        .from("bookings")
        .select("id, service_id, host_id, guest_id, guest_name, guest_email, scheduled_at, status, payment_status, meeting_link, notes, created_at, updated_at, services(id, title, duration, price), profiles!bookings_guest_id_fkey(id, name, email)")
        .eq("host_id", req.user.id)
        .eq("payment_status", "paid")
        .order("scheduled_at", { ascending: true });
    }
    const { data, error } = result;
    if (error) return safeError(res, error);
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/bookings/guest
const getGuestBookings = async (req, res) => {
  try {
    let result = await supabaseAdmin
      .from("bookings")
      .select("*, services(*), profiles!bookings_host_id_fkey(*)")
      .eq("guest_id", req.user.id)
      .order("scheduled_at", { ascending: true });
    // Fallback if schema cache is stale
    if (result.error && /Could not find the|column.*does not exist/i.test(result.error.message)) {
      result = await supabaseAdmin
        .from("bookings")
        .select("id, service_id, host_id, guest_id, guest_name, guest_email, scheduled_at, status, payment_status, meeting_link, notes, created_at, updated_at, services(id, title, duration, price), profiles!bookings_host_id_fkey(id, name, email)")
        .eq("guest_id", req.user.id)
        .order("scheduled_at", { ascending: true });
    }
    const { data, error } = result;
    if (error) return safeError(res, error);
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// PUT /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    // BUG-01 fixed: verify caller owns this booking before allowing cancel
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("*, services(title), profiles!bookings_host_id_fkey(name, email, phone, username, location)")
      .eq("id", req.params.id)
      .single();
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (req.user.id !== booking.host_id && req.user.id !== booking.guest_id) {
      return res.status(403).json({ message: "Not authorized to cancel this booking" });
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled", settlement_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return safeError(res, error);

    // Notify both sides (engine decides channels per admin config)
    try {
      const host = hostOf(booking);
      const when = new Date(booking.scheduled_at).toLocaleString("en-IN");
      const ctx = { guestName: booking.guest_name, serviceTitle: booking.services?.title, hostName: host.name, when };
      const emailData = bookingEmailData({
        serviceTitle: booking.services?.title, hostName: host.name, hostPhone: host.phone,
        guestName: booking.guest_name, scheduledAt: booking.scheduled_at, bookingId: booking.id,
      });
      await NotificationEngine.send({
        event: "BOOKING_CANCELLED_CUSTOMER",
        data: {
          email: booking.guest_email, phone: booking.guest_phone, name: booking.guest_name,
          templateParams: customerParams(ctx),
          emailData, emailUser: { name: booking.guest_name, email: booking.guest_email },
          recipientUserId: booking.guest_id, bookingId: booking.id,
        },
      });
      await NotificationEngine.send({
        event: "BOOKING_CANCELLED_VENDOR",
        data: {
          email: host.email, phone: host.phone, name: host.name,
          templateParams: vendorParams(ctx),
          emailData, emailUser: { name: host.name, email: host.email, username: host.username },
          recipientUserId: booking.host_id, bookingId: booking.id,
        },
      });
    } catch (notifyError) {
      console.error("Cancel notification error:", notifyError.message);
    }

    phCapture(req.user.id, "booking_cancelled", {
      booking_id: booking.id,
      service_title: booking.services?.title,
      host_id: booking.host_id,
      cancelled_by: req.user.id === booking.host_id ? "host" : "guest",
    });

    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// Shared completion logic — used by the host action (completeBooking) AND the
// auto-complete cron (autoCompleteBookings) so the two can never drift. Stamps
// the revenue-recognition + settlement-eligibility fields and (optionally) fires
// the completion notifications + badge re-evaluation. `booking` must be a row
// selected with `services(title)` and the
// `profiles!bookings_host_id_fkey(name, email, phone, username, location)` join.
const markBookingCompleted = async (booking, { notify = true } = {}) => {
  const nowIso = new Date().toISOString();
  const completionUpdate = {
    status: "completed",
    completed_at: nowIso,
    revenue_recognized_at: nowIso,            // PRD Rule 2: commission recognised at completion
    revenue_recognition_status: "recognized",
    // Only a paid booking can actually be settled; P2 re-checks, but don't
    // write a knowingly-false eligibility value for unpaid/failed/refunded.
    settlement_status: booking.payment_status === "paid" ? "eligible_for_settlement" : "not_eligible",
    updated_at: nowIso,
  };
  let { data, error } = await supabaseAdmin
    .from("bookings")
    .update(completionUpdate)
    .eq("id", booking.id)
    .select()
    .single();

  // Legacy DB without v2.8 columns: retry with the original minimal update
  if (error && /Could not find the|column.*does not exist/i.test(error.message)) {
    ({ data, error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "completed", updated_at: nowIso })
      .eq("id", booking.id)
      .select()
      .single());
  }
  if (error) return { data: null, error };

  if (notify) {
    try {
      const host = hostOf(booking);
      const when = new Date(booking.scheduled_at).toLocaleString("en-IN");
      const ctx = { guestName: booking.guest_name, serviceTitle: booking.services?.title, hostName: host.name, when };
      const emailData = bookingEmailData({
        serviceTitle: booking.services?.title, hostName: host.name, hostPhone: host.phone,
        guestName: booking.guest_name, scheduledAt: booking.scheduled_at, bookingId: booking.id,
      });
      // The review CTA ({{review_url}}) opens the dedicated review page for THIS
      // booking. Keep profile_url too (still referenced elsewhere / as fallback).
      const websiteBase = process.env.CLIENT_URL || "https://bookasloth.in";
      const completedCustomerData = {
        ...emailData,
        review_url: `${websiteBase}/review/${booking.id}`,
        ...(host.username ? { profile_url: `${websiteBase}/${host.username}` } : {}),
      };
      await NotificationEngine.send({
        event: "BOOKING_COMPLETED_CUSTOMER",
        data: {
          email: booking.guest_email, phone: booking.guest_phone, name: booking.guest_name,
          templateParams: customerParams(ctx),
          emailData: completedCustomerData, emailUser: { name: booking.guest_name, email: booking.guest_email },
          recipientUserId: booking.guest_id, bookingId: booking.id,
        },
      });
      await NotificationEngine.send({
        event: "BOOKING_COMPLETED_VENDOR",
        data: {
          email: host.email, phone: host.phone, name: host.name,
          templateParams: vendorParams(ctx),
          emailData, emailUser: { name: host.name, email: host.email, username: host.username },
          recipientUserId: booking.host_id, bookingId: booking.id,
        },
      });
    } catch (notifyError) {
      console.error("Complete notification error:", notifyError.message);
    }
  }

  // Event-driven badge evaluation for this vendor (fire-and-forget)
  require("../services/badgeEngine")
    .evaluate({ vendorIds: [booking.host_id] })
    .catch((e) => console.error("Badge evaluation error:", e.message));

  return { data, error: null };
};

// PUT /api/bookings/:id/complete
const completeBooking = async (req, res) => {
  try {
    // BUG-01 fixed: only the host can mark a booking complete
    let { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("*, services(title, duration, grace_period_minutes), profiles!bookings_host_id_fkey(name, email, phone, username, location)")
      .eq("id", req.params.id)
      .single();
    // Fallback for a schema-cache state without grace_period_minutes.
    if (!booking) {
      ({ data: booking } = await supabaseAdmin
        .from("bookings")
        .select("*, services(title, duration), profiles!bookings_host_id_fkey(name, email, phone, username, location)")
        .eq("id", req.params.id)
        .single());
    }
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (req.user.id !== booking.host_id) {
      return res.status(403).json({ message: "Only the host can mark a booking as completed" });
    }
    // Idempotent: re-completing must not re-stamp completed_at/revenue_recognized_at
    // (would silently shift revenue across a reporting period) or re-fire notifications.
    if (booking.status === "completed") return res.json(booking);

    // Security audit M-1: a host may only complete a booking AFTER its session has
    // ended (duration + grace). Otherwise a host could flip a far-future PAID
    // booking to 'completed' — recognising revenue and making it eligible for
    // settlement before the service is rendered, bypassing the post-session hold.
    const sessionMin = (booking.services?.duration || 30) + (booking.services?.grace_period_minutes || 0);
    const sessionEnd = new Date(booking.scheduled_at).getTime() + sessionMin * 60000;
    if (Number.isFinite(sessionEnd) && Date.now() < sessionEnd) {
      return res.status(409).json({ message: "You can mark this booking complete only after the session has ended." });
    }

    const { data, error } = await markBookingCompleted(booking, { notify: true });
    if (error) return safeError(res, error);
    res.json(data);
  } catch (error) {
    safeError(res, error);
  }
};

// PUT /api/bookings/:id/reschedule
const rescheduleBooking = async (req, res) => {
  try {
    if (!(await featureFlags.isFeatureEnabled('reschedule'))) {
      return res.status(403).json({ message: 'Reschedule is currently disabled' });
    }

    const { scheduled_at } = req.body;
    if (!scheduled_at)
      return res.status(400).json({ message: "scheduled_at is required" });

    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("*, services(*), profiles!bookings_host_id_fkey(*)")
      .eq("id", req.params.id)
      .single();
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "cancelled")
      return res
        .status(400)
        .json({ message: "Cannot reschedule a cancelled booking" });
    if (
      req.user &&
      req.user.id !== booking.guest_id &&
      req.user.id !== booking.host_id
    )
      return res
        .status(403)
        .json({ message: "Not authorized to reschedule this booking" });

    const { data: avail } = await supabaseAdmin
      .from("availability")
      .select("buffer_minutes, timezone")
      .eq("host_id", booking.host_id)
      .single();
    const hostTimezone = avail?.timezone || "Asia/Kolkata";
    const newStart = new Date(scheduled_at);

    // Reject rescheduling to the past
    if (newStart <= new Date()) {
      return res
        .status(400)
        .json({ message: "Cannot reschedule to a time in the past." });
    }

    const graceMin = booking.services?.grace_period_minutes ?? 10;
    const newEnd = new Date(
      newStart.getTime() + (booking.services?.duration || 30) * 60000,
    );
    const windowStart = new Date(newStart.getTime() - 24 * 3600 * 1000);

    const { data: conflicts, error: conflictsError } =
      await selectBookingServiceRows((select) =>
        supabaseAdmin
          .from("bookings")
          .select(select)
          .eq("host_id", booking.host_id)
          .neq("status", "cancelled")
          .neq("id", req.params.id)
          .gte("scheduled_at", windowStart.toISOString())
          .lte(
            "scheduled_at",
            new Date(newEnd.getTime() + graceMin * 60000).toISOString(),
          ),
      );
    if (conflictsError)
      return res.status(500).json({ message: conflictsError.message });
    for (const c of conflicts || []) {
      const cStart = new Date(c.scheduled_at);
      const cGrace = c.services?.grace_period_minutes ?? 10;
      const cEnd = new Date(
        cStart.getTime() + (c.services?.duration || 30) * 60000,
      );
      if (
        newStart < cEnd.getTime() + cGrace * 60000 &&
        newEnd > cStart.getTime() - cGrace * 60000
      )
        return res
          .status(409)
          .json({ message: "That time slot is already taken." });
    }

    const isHostReschedule = req.user?.id === booking.host_id;
    const isGuestReschedule = !isHostReschedule;

    // Reschedule fee — platform-kept, "first reschedule free". A guest's first
    // move (reschedule_count 0) is always free; from the second onward, if the
    // reschedule_fee flag is ON and the vendor set a fee > 0, a valid Razorpay
    // fee payment is required BEFORE any DB mutation (402 otherwise).
    const { verifySignature } = require("../utils/razorpaySignature");
    const rzpConfig = require("../services/razorpayConfig");
    let feeChargedAmount = 0;
    let feeOrderId = null, feePaymentId = null;
    if (isGuestReschedule) {
      const hostRow = hostOf(booking);
      const vendorFee = Number(hostRow.reschedule_fee) || 0;
      const priorCount = Number(booking.reschedule_count) || 0;
      const feeFlagOn = await featureFlags.isFeatureEnabled('reschedule_fee');
      const feeApplies = priorCount >= 1 && feeFlagOn && vendorFee > 0;
      if (feeApplies) {
        const { fee_payment_id, fee_order_id, fee_signature } = req.body;
        const feeKeySecret = await rzpConfig.getKeySecret();
        if (!fee_payment_id || !fee_order_id || !fee_signature ||
            !verifySignature(fee_order_id, fee_payment_id, fee_signature, feeKeySecret)) {
          return res.status(402).json({ message: 'Reschedule fee payment required', fee: vendorFee });
        }
        // SECURITY: the HMAC signature only proves the order/payment pair is genuine —
        // it does NOT bind to which booking the fee was for, nor the amount. Without
        // this check a guest could pay a ₹10 fee on Booking A and reuse those tokens
        // to reschedule Booking B (fee ₹500), underpaying ₹490.
        // Fix: fetch the Razorpay order and assert it was created for THIS booking
        // at the correct amount before accepting the payment.
        let feeOrder;
        try {
          feeOrder = await (await rzpConfig.getClient()).orders.fetch(fee_order_id);
        } catch (_) {
          return res.status(402).json({ message: 'Reschedule fee order not found', fee: vendorFee });
        }
        if (String(feeOrder?.notes?.booking_id) !== String(booking.id) ||
            Number(feeOrder?.amount) !== Math.round(vendorFee * 100)) {
          return res.status(402).json({ message: 'Reschedule fee does not match this booking', fee: vendorFee });
        }
        feeChargedAmount = vendorFee;
        feeOrderId = fee_order_id;
        feePaymentId = fee_payment_id;
      }
    }

    // Idempotency: a given reschedule-fee payment backs exactly ONE reschedule.
    // Check BEFORE mutating the booking so a replay of the same fee tokens can't
    // re-reschedule for free. (DB unique index v3.17 is the hard backstop.)
    if (feePaymentId) {
      const { data: priorFee } = await supabaseAdmin
        .from('reschedule_payments')
        .select('id')
        .eq('razorpay_payment_id', feePaymentId)
        .limit(1)
        .maybeSingle();
      if (priorFee) {
        return res.status(409).json({ message: 'This reschedule fee payment has already been used.' });
      }
    }

    const ackToken = isHostReschedule
      ? crypto.randomBytes(24).toString("hex")
      : null;
    const rescheduleUpdate = {
      scheduled_at,
      end_at: newEnd.toISOString(), // keep the no-overlap constraint range in sync
      reminder_24h_sent: false,
      reminder_1h_sent: false,
      reschedule_status: isHostReschedule ? "awaiting_guest_ack" : "none",
      reschedule_ack_token: ackToken,
      reschedule_acknowledged_at: null,
      reschedule_count: (Number(booking.reschedule_count) || 0) + (isGuestReschedule ? 1 : 0),
      updated_at: new Date().toISOString(),
    };
    let rescheduleResult = await supabaseAdmin
      .from("bookings")
      .update(rescheduleUpdate)
      .eq("id", req.params.id)
      .select()
      .single();
    // Pre-v2.5 DB without end_at / pre-v3.3 DB without reschedule_count
    if (
      rescheduleResult.error &&
      /Could not find the|column.*does not exist/i.test(rescheduleResult.error.message)
    ) {
      const { end_at: _e, reschedule_count: _rc, ...coreUpdate } = rescheduleUpdate;
      rescheduleResult = await supabaseAdmin
        .from("bookings").update(coreUpdate).eq("id", req.params.id).select().single();
    }
    if (
      rescheduleResult.error &&
      (rescheduleResult.error.code === "23P01" ||
        /bookings_no_overlap|exclusion constraint/i.test(rescheduleResult.error.message))
    ) {
      return res.status(409).json({ message: "That time slot is already taken." });
    }
    const { data: updated, error } = rescheduleResult;
    if (error) return safeError(res, error);

    try {
      const hostRow = hostOf(booking);
      await profileSecrets.attachGoogleTokens(hostRow);
      if (booking.google_event_id && hostRow.google_calendar_connected && hostRow.google_refresh_token) {
        await updateCalendarEvent(
          decryptToken(hostRow.google_access_token),
          decryptToken(hostRow.google_refresh_token),
          booking.google_event_id,
          { startTime: newStart.toISOString(), endTime: newEnd.toISOString(), timezone: hostTimezone },
        );
      }
    } catch (calErr) {
      console.error("Reschedule calendar patch error (non-fatal):", calErr.message);
    }

    if (feeChargedAmount > 0) {
      try {
        const { data: rfRow, error: rfErr } = await supabaseAdmin
          .from('reschedule_payments')
          .insert({ booking_id: booking.id, guest_id: booking.guest_id, host_id: booking.host_id,
                    amount: feeChargedAmount, razorpay_order_id: feeOrderId, razorpay_payment_id: feePaymentId })
          .select('id').single();
        if (rfErr) {
          // 23505 = unique_violation: a concurrent replay raced past the pre-check and
          // hit the DB unique index (v3.17). The booking was already updated — that's
          // acceptable. Surface a 409 instead of a 500.
          if (rfErr.code === '23505') {
            console.warn('Reschedule fee replay blocked by DB unique index (concurrent race):', feePaymentId);
            return res.status(409).json({ message: 'This reschedule fee payment has already been used.' });
          }
          throw rfErr;
        }
        const { rescheduleFeeEntry } = require('../services/ledger/journalTemplates');
        const { post } = require('../services/ledger/postingService');
        await post({
          sourceType: 'RESCHEDULE_FEE',
          sourceId: rfRow.id,
          journalDate: new Date().toISOString().slice(0, 10),
          template: rescheduleFeeEntry({ booking_id: booking.id, host_id: booking.host_id, fee: feeChargedAmount, gstRate: 0.18 }),
        });
      } catch (ledgerErr) {
        console.error('Reschedule fee ledger error (non-fatal):', ledgerErr.message);
      }
    }

    const s = booking.services;
    const host = hostOf(booking);
    const oldWhen = new Date(booking.scheduled_at).toLocaleString("en-IN", {
      timeZone: hostTimezone,
    });
    const newWhen = new Date(scheduled_at).toLocaleString("en-IN", {
      timeZone: hostTimezone,
    });
    const apiBaseUrl =
      process.env.API_URL || `${req.protocol}://${req.get("host")}`;
    const ackUrl = `${apiBaseUrl}/api/bookings/${booking.id}/confirm-reschedule?token=${ackToken}`;

    try {
      const rescheduleData = bookingEmailData({
        serviceTitle: s?.title, hostName: host.name, hostPhone: host.phone,
        guestName: booking.guest_name, scheduledAt: scheduled_at, tz: hostTimezone, bookingId: booking.id,
      });
      if (booking.guest_email) {
        await NotificationEngine.send({
          event: "BOOKING_RESCHEDULED_CUSTOMER",
          data: {
            email: booking.guest_email, name: booking.guest_name,
            emailData: { ...rescheduleData, ack_url: isHostReschedule ? ackUrl : "" },
            emailUser: { name: booking.guest_name, email: booking.guest_email },
            recipientUserId: booking.guest_id, bookingId: booking.id,
          },
        });
      }
      if (host.email) {
        await NotificationEngine.send({
          event: "BOOKING_RESCHEDULED_VENDOR",
          data: {
            email: host.email, name: host.name,
            emailData: rescheduleData,
            emailUser: { name: host.name, email: host.email, username: host.username },
            recipientUserId: booking.host_id, bookingId: booking.id,
          },
        });
      }
    } catch (emailError) {
      console.error("Reschedule email error:", emailError.message);
    }

    res.json(updated);
  } catch (error) {
    safeError(res, error);
  }
};

// Task 6: reminder processor — called every 5 min from server.js
// GET /api/bookings/:id/confirm-reschedule?token=
const confirmReschedule = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("Missing confirmation token.");

    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("*, services(*), profiles!bookings_host_id_fkey(*)")
      .eq("id", req.params.id)
      .eq("reschedule_ack_token", token)
      .single();

    if (error || !booking)
      return res
        .status(404)
        .send("This confirmation link is invalid or expired.");

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({
        reschedule_status: "acknowledged",
        reschedule_ack_token: null,
        reschedule_acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error('reschedule ack update:', updateError.message);
      return res.status(500).send("Something went wrong confirming your reschedule. Please contact support.");
    }

    const s = booking.services;
    const host = hostOf(booking);
    const when = new Date(booking.scheduled_at).toLocaleString("en-IN");

    try {
      if (host.email) {
        await NotificationEngine.send({
          event: "BOOKING_RESCHEDULED_VENDOR",
          data: {
            email: host.email, name: host.name,
            emailData: bookingEmailData({
              serviceTitle: s?.title, hostName: host.name, hostPhone: host.phone,
              guestName: booking.guest_name, scheduledAt: booking.scheduled_at, bookingId: booking.id,
            }),
            emailUser: { name: host.name, email: host.email, username: host.username },
            recipientUserId: booking.host_id, bookingId: booking.id,
          },
        });
      }
    } catch (emailError) {
      console.error(
        "Reschedule acknowledgement email error:",
        emailError.message,
      );
    }

    res.send(
      emailHtml(`
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.12em;">Confirmed</p>
      <h1 style="margin:0 0 20px;font-size:26px;font-weight:800;">Thanks, the new time is acknowledged</h1>
      ${row("Service", escHtml(s?.title || "Service"))}
      ${row("When", escHtml(when))}
    `),
    );
  } catch (error) {
    console.error('acknowledgeReschedule:', error.message);
    res.status(500).send("Something went wrong. Please contact support.");
  }
};

const processReminders = async () => {
  if (!(await featureFlags.isFeatureEnabled("booking_reminders"))) return;
  const now = new Date();
  for (const windowHours of [24, 1]) {
    const rangeStart = new Date(
      now.getTime() + (windowHours * 60 - 10) * 60000,
    );
    const rangeEnd = new Date(now.getTime() + (windowHours * 60 + 10) * 60000);
    const sentFlag =
      windowHours === 24 ? "reminder_24h_sent" : "reminder_1h_sent";
    const label = windowHours === 24 ? "24 hours" : "1 hour";

    const { data: bookings } = await supabaseAdmin
      .from("bookings")
      .select("*, services(*), profiles!bookings_host_id_fkey(*)")
      .eq("status", "confirmed")
      .eq(sentFlag, false)
      .gte("scheduled_at", rangeStart.toISOString())
      .lte("scheduled_at", rangeEnd.toISOString());

    for (const b of bookings || []) {
      const s = b.services;
      const host = hostOf(b);
      const when = new Date(b.scheduled_at).toLocaleString("en-IN");
      try {
        // Mode of truth = service.meeting_mode (NOT meeting_link presence — the
        // Meet link may not be minted yet). Online → join link; offline → dashboard
        // for now (Phase 2 swaps in a Google Maps directions link).
        const isOnline = (s?.meeting_mode || (b.meeting_link ? "online" : "offline")) === "online";
        const dashboard = `${process.env.CLIENT_URL || "https://bookasloth.in"}/dashboard`;
        const actionLink = isOnline && b.meeting_link ? b.meeting_link : dashboard;
        const ctx = { guestName: b.guest_name, serviceTitle: s?.title, hostName: host.name, when, actionLink };
        const emailData = bookingEmailData({
          serviceTitle: s?.title, hostName: host.name, hostPhone: host.phone,
          guestName: b.guest_name, scheduledAt: b.scheduled_at, bookingId: b.id,
          online: isOnline, actionLink: isOnline && b.meeting_link ? b.meeting_link : "",
        });
        await NotificationEngine.send({
          event: "BOOKING_REMINDER_CUSTOMER",
          data: {
            email: b.guest_email, phone: b.guest_phone, name: b.guest_name,
            templateParams: customerParams(ctx),
            emailData, emailUser: { name: b.guest_name, email: b.guest_email },
            recipientUserId: b.guest_id, bookingId: b.id,
          },
        });
        await NotificationEngine.send({
          event: "BOOKING_REMINDER_VENDOR",
          data: {
            email: host.email, phone: host.phone, name: host.name,
            templateParams: vendorParams(ctx),
            emailData, emailUser: { name: host.name, email: host.email, username: host.username },
            recipientUserId: b.host_id, bookingId: b.id,
          },
        });
        await supabaseAdmin
          .from("bookings")
          .update({ [sentFlag]: true, updated_at: new Date().toISOString() })
          .eq("id", b.id);
      } catch (emailErr) {
        console.error(`Reminder error for booking ${b.id}:`, emailErr.message);
      }
    }
  }
};

// ── Auto-completion cron ───────────────────────────────────────────
// Nobody can be relied on to click "Mark Completed" (especially for no-shows),
// which would leave a past session 'confirmed' forever — the lifecycle never
// closes and the intended revenue-recognition / settlement-eligibility path
// never fires (so the vendor's earnings never become settle-able). This sweep
// finds confirmed bookings whose session window has fully elapsed
// (duration + grace + hold) and completes them through the shared
// markBookingCompleted, identical to a host clicking "Mark Completed".
//
//   HOLD   (default 120 min) — post-session dispute/refund buffer before
//          revenue is recognised. Override with AUTO_COMPLETE_HOLD_MIN.
//   CUTOFF — bounds the first-run backfill: a session that ended before it is
//          ignored. Defaults to 3 days before boot (so a restart still catches
//          recent sessions but never mass-completes ancient history). Set
//          AUTO_COMPLETE_CUTOFF=<ISO> to the deploy timestamp for zero backfill.
const AUTO_COMPLETE_HOLD_MS = (Number(process.env.AUTO_COMPLETE_HOLD_MIN) || 120) * 60 * 1000;
const AUTO_COMPLETE_CUTOFF = process.env.AUTO_COMPLETE_CUTOFF
  ? new Date(process.env.AUTO_COMPLETE_CUTOFF)
  : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
const AUTO_COMPLETE_BATCH = 200;

const autoCompleteBookings = async () => {
  const now = Date.now();
  const hostJoin = "profiles!bookings_host_id_fkey(name, email, phone, username, location)";
  // Coarse DB prefilter (confirmed + already past start); the precise
  // duration + grace + hold check is applied per-row in JS below because the
  // session end depends on each service's duration/grace.
  const baseQuery = (svcCols) =>
    supabaseAdmin
      .from("bookings")
      .select(`*, services(title, ${svcCols}), ${hostJoin}`)
      .eq("status", "confirmed")
      .lte("scheduled_at", new Date(now).toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(AUTO_COMPLETE_BATCH);

  let result = await baseQuery("duration, grace_period_minutes");
  // Fallback if the schema cache doesn't know grace_period_minutes yet.
  if (result.error && /Could not find the|column.*does not exist/i.test(result.error.message)) {
    result = await baseQuery("duration");
  }
  const { data: rows, error } = result;
  if (error) {
    console.error("Auto-complete query error:", error.message);
    return { completed: 0 };
  }

  let completed = 0;
  for (const b of rows || []) {
    const sessionMin = (b.services?.duration || 30) + (b.services?.grace_period_minutes || 0);
    const sessionEnd = new Date(b.scheduled_at).getTime() + sessionMin * 60 * 1000;
    if (sessionEnd < AUTO_COMPLETE_CUTOFF.getTime()) continue; // pre-cutoff backlog — skip
    if (now < sessionEnd + AUTO_COMPLETE_HOLD_MS) continue;    // still inside the hold window
    const { error: e } = await markBookingCompleted(b, { notify: true });
    if (e) {
      console.error(`Auto-complete failed for booking ${b.id}:`, e.message);
      continue;
    }
    completed += 1;
  }
  if (completed) console.log(`Auto-complete: completed ${completed} booking(s)`);
  return { completed };
};

// ── Stale unpaid-hold reaper (security audit H-2) ──────────────────────────
// A paid-service booking is created status:'pending'/payment_status:'unpaid'
// and immediately reserves the slot (it counts as busy in availability and is
// covered by the bookings_no_overlap exclusion constraint). Nothing required
// payment to hold the slot and abandoned holds never expired — so abandoned
// checkouts (or an attacker spraying the API) could squat a host's whole
// calendar and deny real customers. This sweep cancels unpaid pending holds
// older than the hold window, releasing the slot for both the availability
// picker and the DB constraint (both ignore status='cancelled').
//
// The window must comfortably exceed a real checkout (incl. redirect-based UPI)
// so a genuine in-flight payment is never reaped mid-flow; the booking-payment
// reconciler also heals actually-paid bookings within minutes, well before this
// fires. Default 30 min, override with PENDING_BOOKING_HOLD_MIN.
const PENDING_HOLD_MS = (Number(process.env.PENDING_BOOKING_HOLD_MIN) || 30) * 60 * 1000;
const PENDING_REAP_BATCH = 200;

const expireStalePendingBookings = async () => {
  const cutoff = new Date(Date.now() - PENDING_HOLD_MS).toISOString();
  const nowIso = new Date().toISOString();
  const reap = (extra) =>
    supabaseAdmin
      .from("bookings")
      .update({ status: "cancelled", updated_at: nowIso, ...extra })
      .eq("status", "pending")
      .eq("payment_status", "unpaid")
      .lt("created_at", cutoff)
      .select("id")
      .limit(PENDING_REAP_BATCH);

  let { data, error } = await reap({ cancelled_at: nowIso });
  // Legacy DB without a cancelled_at column: retry with the minimal update.
  if (error && /Could not find the|column.*does not exist/i.test(error.message)) {
    ({ data, error } = await reap({}));
  }
  if (error) {
    console.error("Pending-hold reaper error:", error.message);
    return { expired: 0 };
  }
  const expired = (data || []).length;
  if (expired) console.log(`Pending-hold reaper: expired ${expired} stale unpaid booking(s)`);
  return { expired };
};

module.exports = {
  getServiceById,
  getBookedSlots,
  getAvailableSlots,
  createBooking,
  getHostBookings,
  getGuestBookings,
  cancelBooking,
  completeBooking,
  markBookingCompleted,
  autoCompleteBookings,
  expireStalePendingBookings,
  rescheduleBooking,
  confirmReschedule,
  processReminders,
};

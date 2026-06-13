const { supabaseAdmin } = require("../config/supabase");
const { createCalendarEvent } = require("../config/google");
const sendEmail = require("../utils/sendEmail");
const NotificationEngine = require("../services/notificationEngine");
const { checkBookingReceiveLimit } = require("../middleware/planMiddleware");
const crypto = require("crypto");
const { computeBreakdown } = require("../lib/pricingEngine");
const planService = require("../services/planService");
const platformConfig = require("../services/platformConfig");
const availabilityService = require("../services/availabilityService");
const { decrypt: decryptToken } = require("../utils/cryptoTokens");

const emailHtml = (body) => `
  <div style="max-width:520px;margin:0 auto;padding:26px;border-radius:24px;background:#ffffff;font-family:'Plus Jakarta Sans','Poppins',sans-serif;color:#111827;box-shadow:0 24px 60px rgba(15,23,42,0.08);">
    ${body}
    <div style="margin-top:24px;padding:18px;border-radius:18px;background:#f8fafc;color:#6b7280;font-size:14px;">Book A Sloth — calm booking for busy hosts.</div>
  </div>`;

const row = (label, value) =>
  `<p style="margin:0 0 12px;font-size:15px;color:#374151;"><strong>${label}:</strong> ${value}</p>`;

const button = (href, label) =>
  `<a href="${href}" style="display:inline-block;margin-top:12px;padding:12px 18px;border-radius:12px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">${label}</a>`;

// WhatsApp template params for the approved AiSensy booking templates:
//   customer: [customerName, serviceTitle, vendorName, dateTime]
//   vendor:   [vendorName, customerName, serviceTitle, dateTime]
const customerParams = ({ guestName, serviceTitle, hostName, when }) =>
  [guestName || "Customer", serviceTitle || "Service", hostName || "Host", when];
const vendorParams = ({ guestName, serviceTitle, hostName, when }) =>
  [hostName || "Host", guestName || "Customer", serviceTitle || "Service", when];

// ── Email placeholder data for the Communication Engine templates ──
// Split a scheduled time into {{booking_date}} / {{booking_time}}.
const splitWhen = (scheduledAt, tz = "Asia/Kolkata") => {
  const d = new Date(scheduledAt);
  return {
    booking_date: d.toLocaleDateString("en-IN", { timeZone: tz, weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    booking_time: d.toLocaleTimeString("en-IN", { timeZone: tz, hour: "2-digit", minute: "2-digit" }),
  };
};
// Placeholder map shared by customer + vendor booking emails.
const bookingEmailData = ({ serviceTitle, hostName, hostPhone, guestName, scheduledAt, tz, bookingId, online }) => ({
  service_name: serviceTitle || "Service",
  vendor_name: hostName || "Host",
  vendor_phone: hostPhone || "",
  user_name: guestName || "Customer",
  booking_id: bookingId || "",
  location: online ? "Online (link in your dashboard)" : "",
  ...splitWhen(scheduledAt, tz),
});

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

// GET /api/bookings/service/:id
const getServiceById = async (req, res) => {
  try {
    let serviceResult = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("id", req.params.id)
      .single();
    // Fallback if schema cache is stale
    if (serviceResult.error && /Could not find the|column.*does not exist/i.test(serviceResult.error.message)) {
      serviceResult = await supabaseAdmin
        .from("services")
        .select("id, host_id, title, description, type, duration, price, currency, meeting_mode, is_active, created_at, updated_at")
        .eq("id", req.params.id)
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
    res.status(500).json({ message: error.message });
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
    if (error) return res.status(500).json({ message: error.message });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      supabaseAdmin.from("profiles").select("id, google_calendar_connected, google_access_token, google_refresh_token").eq("id", host_id).single(),
      supabaseAdmin.from("availability").select("*").eq("host_id", host_id).maybeSingle(),
    ]);
    if (!service) return res.status(404).json({ message: "Service not found" });
    if (!host) return res.status(404).json({ message: "Host not found" });

    const result = await availabilityService.computeSlots({
      host, service, availability, dateStr: date,
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/bookings
const createBooking = async (req, res) => {
  try {
    const {
      service_id,
      host_id,
      guest_id,
      guest_name,
      guest_email,
      guest_phone,
      scheduled_at,
      notes,
    } = req.body;

    const { data: service } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("id", service_id)
      .single();
    if (!service) return res.status(404).json({ message: "Service not found" });

    const { data: host } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", host_id)
      .single();
    if (!host) return res.status(404).json({ message: "Host not found" });

    const { data: avail } = await supabaseAdmin
      .from("availability")
      .select("*")
      .eq("host_id", host_id)
      .maybeSingle();
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
    const isOnline = service.meeting_mode !== "offline";
    if (
      isOnline &&
      service.price === 0 &&
      host.google_calendar_connected &&
      host.google_refresh_token
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
      } catch (calError) {
        console.error("Google Calendar error:", calError.message);
      }
    }

    // Base booking payload — fields present in all schema versions
    const bookingPayload = {
      service_id,
      host_id,
      guest_id: guest_id || null,
      guest_name,
      guest_email,
      guest_phone,
      scheduled_at,
      end_at: newEnd.toISOString(),  // backs the v2.5 no-overlap exclusion constraint
      notes,
      meeting_link: meetingLink,
      vendor_amount:       vendorPayout,
      platform_fee_amount: platformFee,
      platform_fee_gst:    pricing.gst,           // GST on platform fee (v2.2)
      customer_total:      pricing.customerTotal,  // service + fee + GST (v2.2)
      gst_rate:            gstRate,                // snapshot of rate used (v2.2)
      razorpay_fee_actual: 0,                      // set at payment capture (v2.2)
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
      // Drop v1.7 + v2.2 + v2.5 columns if the migrations haven't been applied yet
      const {
        commission_applied: _c, platform_fee_gst: _g, customer_total: _t,
        gst_rate: _r, razorpay_fee_actual: _f, end_at: _e,
        commission_gst: _cg, commission_percentage: _cp, vendor_plan_type: _vp,
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
    if (error) return res.status(500).json({ message: error.message });

    const when = new Date(scheduled_at).toLocaleString("en-IN", {
      timeZone: hostTimezone,
    });

    // BUG-12 fixed: only send confirmation emails immediately for FREE services.
    // Paid services: emails are sent in paymentController.verifyPayment after payment succeeds.
    if (service.price === 0) {
      try {
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
            recipientUserId: guest_id || null, bookingId: booking.id,
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
      } catch (notifyError) {
        console.error("Notification error:", notifyError.message);
      }
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/bookings/host
const getHostBookings = async (req, res) => {
  try {
    let result = await supabaseAdmin
      .from("bookings")
      .select("*, services(*), profiles!bookings_guest_id_fkey(*)")
      .eq("host_id", req.user.id)
      .order("scheduled_at", { ascending: true });
    // Fallback if schema cache is stale
    if (result.error && /Could not find the|column.*does not exist/i.test(result.error.message)) {
      result = await supabaseAdmin
        .from("bookings")
        .select("id, service_id, host_id, guest_id, guest_name, guest_email, scheduled_at, status, payment_status, meeting_link, notes, created_at, updated_at, services(id, title, duration, price), profiles!bookings_guest_id_fkey(id, name, email)")
        .eq("host_id", req.user.id)
        .order("scheduled_at", { ascending: true });
    }
    const { data, error } = result;
    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ message: error.message });

    // Notify both sides (engine decides channels per admin config)
    try {
      const host = booking["profiles!bookings_host_id_fkey"] || {};
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

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/bookings/:id/complete
const completeBooking = async (req, res) => {
  try {
    // BUG-01 fixed: only the host can mark a booking complete
    const { data: booking } = await supabaseAdmin
      .from("bookings")
      .select("*, services(title), profiles!bookings_host_id_fkey(name, email, phone, username, location)")
      .eq("id", req.params.id)
      .single();
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (req.user.id !== booking.host_id) {
      return res.status(403).json({ message: "Only the host can mark a booking as completed" });
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ message: error.message });

    try {
      const host = booking["profiles!bookings_host_id_fkey"] || {};
      const when = new Date(booking.scheduled_at).toLocaleString("en-IN");
      const ctx = { guestName: booking.guest_name, serviceTitle: booking.services?.title, hostName: host.name, when };
      const emailData = bookingEmailData({
        serviceTitle: booking.services?.title, hostName: host.name, hostPhone: host.phone,
        guestName: booking.guest_name, scheduledAt: booking.scheduled_at, bookingId: booking.id,
      });
      // Point the review CTA ({{profile_url}}) at the host's public profile.
      const websiteBase = process.env.CLIENT_URL || "https://bookasloth.in";
      const completedCustomerData = host.username
        ? { ...emailData, profile_url: `${websiteBase}/${host.username}` }
        : emailData;
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

    // Event-driven badge evaluation for this vendor (fire-and-forget)
    require("../services/badgeEngine")
      .evaluate({ vendorIds: [booking.host_id] })
      .catch((e) => console.error("Badge evaluation error:", e.message));

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/bookings/:id/reschedule
const rescheduleBooking = async (req, res) => {
  try {
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
      updated_at: new Date().toISOString(),
    };
    let rescheduleResult = await supabaseAdmin
      .from("bookings")
      .update(rescheduleUpdate)
      .eq("id", req.params.id)
      .select()
      .single();
    // Pre-v2.5 DB without end_at
    if (
      rescheduleResult.error &&
      /Could not find the|column.*does not exist/i.test(rescheduleResult.error.message)
    ) {
      const { end_at: _e, ...coreUpdate } = rescheduleUpdate;
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
    if (error) return res.status(500).json({ message: error.message });

    const s = booking.services;
    const host = booking["profiles!bookings_host_id_fkey"] || {};
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
    res.status(500).json({ message: error.message });
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

    if (updateError) return res.status(500).send(updateError.message);

    const s = booking.services;
    const host = booking["profiles!bookings_host_id_fkey"] || {};
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
      ${row("Service", s?.title || "Service")}
      ${row("When", when)}
    `),
    );
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const processReminders = async () => {
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
      const host = b["profiles!bookings_host_id_fkey"] || {};
      const when = new Date(b.scheduled_at).toLocaleString("en-IN");
      try {
        const ctx = { guestName: b.guest_name, serviceTitle: s?.title, hostName: host.name, when };
        const emailData = bookingEmailData({
          serviceTitle: s?.title, hostName: host.name, hostPhone: host.phone,
          guestName: b.guest_name, scheduledAt: b.scheduled_at, bookingId: b.id, online: !!b.meeting_link,
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

module.exports = {
  getServiceById,
  getBookedSlots,
  getAvailableSlots,
  createBooking,
  getHostBookings,
  getGuestBookings,
  cancelBooking,
  completeBooking,
  rescheduleBooking,
  confirmReschedule,
  processReminders,
};

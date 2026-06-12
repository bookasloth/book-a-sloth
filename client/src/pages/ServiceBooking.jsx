import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getServiceBySlug,
  sendOtp,
  verifyOtp,
  createBooking,
  getBookedSlots,
  getAvailableSlots,
  createPaymentOrder,
  verifyPayment,
  getHostReviews,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  DEFAULT_THEME_COLOR,
  getContrastColor,
  getPlanBorderColor,
  SOCIAL_BRAND_COLORS,
  isValidHex,
  applyProfileTheme,
} from "../utils/themeUtils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// Build a Google Calendar "add event" URL from a UTC start ISO + duration (min).
const googleCalUrl = ({ title, details, location, startISO, durationMin }) => {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMin * 60000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "Booking",
    dates: `${fmt(start)}/${fmt(end)}`,
    details: details || "",
    location: location || "",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

// Generate a downloadable .ics blob URL for a single event.
const buildICS = ({ title, details, location, startISO, durationMin, uid }) => {
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMin * 60000);
  const esc = (s) => String(s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Book A Sloth//Booking//EN",
    "BEGIN:VEVENT", `UID:${uid || fmt(start)}@bookasloth`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(details)}`, `LOCATION:${esc(location)}`, "END:VEVENT", "END:VCALENDAR",
  ];
  return URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
};

// BUG-13 fix: convert a wall-clock time in the host's timezone to UTC
// Uses only the built-in Intl API — no external library needed.
const wallClockToUTC = (year, month, day, hour, minute, tz) => {
  // Step 1: treat the target time as if it were UTC to get a reference Date
  const fakeUTC = new Date(Date.UTC(year, month, day, hour, minute, 0));
  // Step 2: find what wall-clock time that UTC instant shows in `tz`
  const tzStr = fakeUTC.toLocaleString("sv", { timeZone: tz }); // "YYYY-MM-DD HH:MM:SS"
  const inTz = new Date(tzStr.replace(" ", "T") + "Z");
  // Step 3: the offset = fakeUTC − inTz
  const offsetMs = fakeUTC.getTime() - inTz.getTime();
  // Step 4: apply offset to get the true UTC instant
  return new Date(fakeUTC.getTime() + offsetMs).toISOString();
};

const ServiceBooking = () => {
  const { profileSlug, serviceSlug } = useParams();
  const { user } = useAuth();

  const [host, setHost] = useState(null);
  const [service, setService] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState("time"); // 'time'|'details'|'otp'(guest only)|'payment'|'confirmed'

  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [timeFormat, setTimeFormat] = useState("12h");
  const [bookedSlots, setBookedSlots] = useState([]);
  // Server-computed availability (working hours − bookings − Google busy −
  // blocked dates). null → fall back to the legacy client-side computation.
  const [serverSlots, setServerSlots] = useState(null);
  // True when the host's Google Calendar could not be checked for this date
  // (Google outage, no cache) — shown as a soft warning, booking still allowed.
  const [calendarUnverified, setCalendarUnverified] = useState(false);

  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(
    user?.name?.split(" ").slice(1).join(" ") || "",
  );
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false); // Section 1: collapsed by default

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data } = await getServiceBySlug(profileSlug, serviceSlug);
        setHost(data.host);
        setService(data.service);
        setAvailability(data.availability);
        // Section 1: host-level rating for the profile card (hidden when 0)
        try {
          const username = data.host?.username || profileSlug;
          const { data: rv } = await getHostReviews(username);
          setHost((h) => h ? { ...h, review_avg: rv?.avg ?? 0, review_count: rv?.count ?? 0 } : h);
        } catch { /* no reviews → row stays hidden */ }
        // SEO — update page title
        if (data.service?.title) {
          document.title = `Book ${data.service.title}${data.host?.name ? ` with ${data.host.name}` : ''} | Book A Sloth`;
        }
      } catch {
        toast.error("Service not found");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [profileSlug, serviceSlug]);

  // Fetch availability when the date changes. Prefer the server-computed
  // slot list (knows about Google Calendar busy times + blocked dates);
  // fall back to booked-slots + local computation if the endpoint is missing
  // (deploy skew) or errors.
  useEffect(() => {
    if (!selectedDate || !host) return;
    const d = selectedDate;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setServerSlots(null);
    setCalendarUnverified(false);
    if (service?.id) {
      getAvailableSlots(host.id, service.id, dateStr)
        .then(({ data }) => {
          setServerSlots(Array.isArray(data?.slots) ? data.slots : null);
          setCalendarUnverified(!!data?.calendarUnverified);
        })
        .catch(() => setServerSlots(null));
    }
    getBookedSlots(host.id, dateStr)
      .then(({ data }) => setBookedSlots(data || []))
      .catch(() => setBookedSlots([]));
  }, [selectedDate, host, service]);

  // Per-host theme → CSS vars (--profile-accent etc.) for the whole flow
  useEffect(() => {
    if (host) {
      const color = isValidHex(host.theme_color) ? host.theme_color : DEFAULT_THEME_COLOR;
      applyProfileTheme(document.documentElement, color);
    }
  }, [host]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

  const isDateSelectable = (day) => {
    const d = new Date(calYear, calMonth, day);
    if (d < today) return false;
    // Manual blocked dates ("YYYY-MM-DD" strings on the availability row)
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (Array.isArray(availability?.blocked_dates) &&
        availability.blocked_dates.some((b) => String(b).slice(0, 10) === dStr)) return false;
    if (!availability?.weekly_schedule) return true;
    const name = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][d.getDay()];
    const s = availability.weekly_schedule[name];
    return s && s.length > 0;
  };
  const isSameDate = (day) =>
    selectedDate &&
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === calMonth &&
    selectedDate.getFullYear() === calYear;
  const isToday = (day) =>
    new Date(calYear, calMonth, day).toDateString() === today.toDateString();

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
  };
  const selectDate = (day) => {
    if (!isDateSelectable(day)) return;
    setSelectedDate(new Date(calYear, calMonth, day));
    setSelectedTime("");
  };

  // Task 4: host timezone label
  const hostTz = availability?.timezone || "Asia/Kolkata";
  const tzAbbr = (() => {
    try {
      return (
        new Intl.DateTimeFormat("en", {
          timeZone: hostTz,
          timeZoneName: "short",
        })
          .formatToParts(new Date())
          .find((p) => p.type === "timeZoneName")?.value || hostTz
      );
    } catch {
      return hostTz;
    }
  })();

  // Generate time slots: exclude past times (today), booked slots, and grace-period windows
  const getTimeSlots = () => {
    if (!selectedDate || !availability?.weekly_schedule) return [];
    const name = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][selectedDate.getDay()];
    const daySlots = availability.weekly_schedule[name] || [];
    const bufferMin = availability.buffer_minutes || 0;
    const svcDuration = service?.duration || 30;
    const svcGrace = service?.grace_period_minutes ?? 10;
    const stepMin = svcDuration + bufferMin;
    const slots = [];

    // For today, track current time so we don't show past slots
    const now = new Date();
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();
    // Add a small buffer (1 min) so a slot exactly at "now" is already excluded
    const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() + 1 : 0;

    for (const { start, end } of daySlots) {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      let cur = sh * 60 + sm;
      const endMin = eh * 60 + em;

      while (cur + svcDuration <= endMin) {
        const h = Math.floor(cur / 60),
          m = cur % 60;

        // Skip slots in the past for today
        if (isToday && cur < nowMin) {
          cur += stepMin;
          continue;
        }

        const tStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        const sStart = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          h,
          m,
        );
        const sEnd = new Date(sStart.getTime() + svcDuration * 60000);

        // Block if slot overlaps with any existing booking's grace window
        const isBlocked = bookedSlots.some((b) => {
          const bS = new Date(b.scheduled_at);
          const bGrace = b.services?.grace_period_minutes ?? 10;
          const bE = new Date(
            bS.getTime() + (b.services?.duration || 30) * 60000,
          );
          // Slot is blocked if it falls within [bS - bGrace, bE + bGrace]
          return (
            sStart < new Date(bE.getTime() + bGrace * 60000) &&
            sEnd > new Date(bS.getTime() - bGrace * 60000)
          );
        });

        // Also block if any existing booking falls within this slot's grace window
        const graceClearsExisting = bookedSlots.some((b) => {
          const bS = new Date(b.scheduled_at);
          const bE = new Date(
            bS.getTime() + (b.services?.duration || 30) * 60000,
          );
          return (
            bS < new Date(sEnd.getTime() + svcGrace * 60000) &&
            bE > new Date(sStart.getTime() - svcGrace * 60000)
          );
        });

        if (!isBlocked && !graceClearsExisting) slots.push(tStr);
        cur += stepMin;
      }
    }
    return slots;
  };

  const formatTime = (t) => {
    if (timeFormat === "24h") return t;
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM",
      hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const getEndTime = (t) => {
    const [h, m] = t.split(":").map(Number);
    const tot = h * 60 + m + (service?.duration || 30);
    return `${Math.floor(tot / 60)
      .toString()
      .padStart(2, "0")}:${(tot % 60).toString().padStart(2, "0")}`;
  };

  // BUG-16 fix: logged-in users skip OTP — book directly with their session
  const bookDirectly = async () => {
    setVerifying(true);
    try {
      const scheduledAt = wallClockToUTC( // BUG-13 fix: timezone-aware conversion
        selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
        ...selectedTime.split(":").map(Number), hostTz
      );
      const { data: bookingResult } = await createBooking({
        service_id: service.id,
        host_id: host.id,
        guest_id: user._id || user.id || null,
        guest_name: `${firstName} ${lastName}`.trim(),
        guest_email: email,
        guest_phone: phone,
        scheduled_at: scheduledAt,
        notes,
      });
      setConfirmation(bookingResult);
      if (service.price > 0) {
        setStep("payment");
      } else {
        setStep("confirmed");
        toast.success("Booking confirmed!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setVerifying(false);
    }
  };

  const isPhoneValid = /^\+?[\d\s\-()]{8,17}$/.test(phone.trim());

  const handleSendOtp = async () => {
    if (!firstName || !email || !isPhoneValid) {
      toast.error("Name, email and a valid mobile number are required");
      return;
    }
    // BUG-16: logged-in users skip OTP entirely
    if (user) {
      await bookDirectly();
      return;
    }
    setOtpSending(true);
    try {
      await sendOtp({ email, phone, name: `${firstName} ${lastName}`.trim() });
      toast.success("Verification code sent to your WhatsApp & email!");
      setStep("otp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send code");
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyAndBook = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const { data: otpResult } = await verifyOtp({ email, phone, otp });
      if (!otpResult.verified) {
        toast.error("Verification failed");
        return;
      }

      // BUG-13 fix: convert the host-timezone wall-clock time to UTC
      const scheduledAt = wallClockToUTC(
        selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
        ...selectedTime.split(":").map(Number), hostTz
      );

      const { data: bookingResult } = await createBooking({
        service_id: service.id,
        host_id: host.id,
        guest_id: otpResult.user?._id || null,
        guest_name: `${firstName} ${lastName}`.trim(),
        guest_email: email,
        guest_phone: phone,
        scheduled_at: scheduledAt,
        notes,
      });

      setConfirmation(bookingResult);
      // Task 7: paid services go to payment step
      if (service.price > 0) {
        setStep("payment");
      } else {
        setStep("confirmed");
        toast.success("Booking confirmed!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setVerifying(false);
    }
  };

  // Task 7: Razorpay handler
  const handlePayment = async () => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error("Payment gateway failed to load");
      return;
    }
    setPaymentLoading(true);
    try {
      // BUG-02 fix: send guest_email so server can authorize the payment
      const { data: order } = await createPaymentOrder({
        booking_id: confirmation.id,
        guest_email: email,
      });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Book A Sloth",
        description: service.title,
        order_id: order.razorpay_order_id,
        handler: async (response) => {
          try {
            const { data: verifyData } = await verifyPayment({
              booking_id: confirmation.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            // Post-payment the server creates the calendar event; pick up the link.
            if (verifyData?.booking) {
              setConfirmation((prev) => ({ ...prev, ...verifyData.booking }));
            }
            setStep("confirmed");
            toast.success("Payment successful! Booking confirmed.");
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        prefill: {
          name: `${firstName} ${lastName}`.trim(),
          email,
          contact: phone,
        },
        theme: { color: tc },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Derive theme color from host profile
  const tc = host && isValidHex(host.theme_color) ? host.theme_color : DEFAULT_THEME_COLOR;
  const textOnTheme = getContrastColor(tc);
  const borderColor = getPlanBorderColor(host?.plan || 'explorer');

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  if (!service)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Service not found</p>
      </div>
    );

  const isPaid = service.price > 0;
  // BUG-16 fix: logged-in users skip the OTP verification step
  const STEPS = [
    "time",
    "details",
    ...(user ? [] : ["otp"]),
    ...(isPaid ? ["payment"] : []),
    "confirmed",
  ];
  const LABELS = {
    time: "Time",
    details: "Details",
    otp: "Verify",
    payment: "Pay",
    confirmed: "Done",
  };
  const daysInMonth = getDaysInMonth(calMonth, calYear);
  const firstDay = getFirstDayOfMonth(calMonth, calYear);
  // Server list is authoritative (includes Google busy + blocked dates);
  // local computation is the deploy-skew fallback only.
  const timeSlots = serverSlots ?? getTimeSlots();
  const calDays = [];
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calDays.push(i);

  return (
    <div className="min-h-screen" style={{ background: '#f7f5ef', paddingBottom: '48px' }}>
      {host?.is_verified === false && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-700">
          ⚠️ This creator is pending admin verification. Bookings may be subject to confirmation.
        </div>
      )}
      <div className="app-container py-6 sm:py-8 flex flex-col lg:flex-row gap-6 lg:items-start">

        {/* ── LEFT: Collapsible Profile Card ── */}
        <div className="lg:w-[300px] flex-shrink-0">
          <div className="bg-white border rounded overflow-hidden lg:sticky lg:top-24">
            {/* Header toggle */}
            <button
              onClick={() => setProfileOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: tc }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Information
              </span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div className="border-t">
                {/* Section 1: Vendor Profile */}
                <div className="h-20 relative overflow-hidden"
                  style={{ background: host.cover_image ? undefined : `linear-gradient(135deg, ${tc}26, ${tc}55)` }}>
                  {host.cover_image && <img src={host.cover_image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex justify-center -mt-7">
                  <div className="w-14 h-14 rounded border-2 overflow-hidden bg-white" style={{ borderColor }}>
                    {host.profile_image
                      ? <img src={host.profile_image} alt={host.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl font-bold" style={{ color: tc }}>
                          {host.name?.charAt(0)?.toUpperCase()}
                        </div>}
                  </div>
                </div>
                <div className="px-4 pt-2 pb-4 text-center">
                  <h2 className="text-base font-bold text-gray-900">{host.name}</h2>
                </div>

                {/* Divider + Section 2: Service Information */}
                <div className="px-4 py-4 border-t text-left">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Service</p>
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{service.title}</p>
                  {service.description && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {service.description.slice(0, 140)}{service.description.length > 140 ? "…" : ""}
                    </p>
                  )}
                  {host.review_count > 0 && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" style={{ fill: tc }}>
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                      <span className="font-semibold text-gray-700">{host.review_avg}</span>
                      <span className="text-gray-400">({host.review_count})</span>
                    </p>
                  )}
                </div>

                {/* Divider + Section 3: Pricing & Duration */}
                <div className="px-4 py-4 border-t text-left">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1">Pricing &amp; Duration</p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold" style={{ color: tc }}>
                      {service.price === 0 ? "Free" : `₹${service.price}`}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                      </svg>
                      {service.duration} min
                    </span>
                  </div>
                </div>

                {/* View full profile — kept exactly as before */}
                <div className="px-4 pb-4">
                  <Link to={`/${profileSlug}`}
                    className="block text-xs font-medium hover:opacity-75 transition-opacity"
                    style={{ color: tc }}>
                    View full profile →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Booking Engine ── */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: '560px' }}>
          {/* Progress bar */}
          <div className="scroll-safe mb-6 flex items-center gap-2 pb-1 overflow-x-auto">
            {STEPS.map((s, i) => {
              const idx = STEPS.indexOf(step);
              const active = i <= idx;
              return (
                <div key={s} className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors"
                    style={{ background: active ? tc : '#e5e7eb' }} />
                  <span className={`text-xs whitespace-nowrap transition-colors ${active ? 'font-medium' : 'text-gray-400'}`}
                    style={active ? { color: tc } : {}}>
                    {LABELS[s]}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 transition-colors"
                      style={{ background: i < idx ? tc : '#e5e7eb' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* STEP: time */}
          {step === "time" && (
            <div className="bg-white border rounded p-5 sm:p-7">
              <Link
                to={`/${profileSlug}`}
                className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Services
              </Link>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Select Date & Time</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {tzAbbr}
                </span>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Calendar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={prevMonth}
                      className="min-h-10 p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <h3 className="font-semibold">
                      {MONTHS[calMonth]} {calYear}
                    </h3>
                    <button
                      onClick={nextMonth}
                      className="min-h-10 p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                    {DAYS_SHORT.map((d) => (
                      <div key={d} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {calDays.map((day, i) => {
                      if (!day) return <div key={`e${i}`} />;
                      const sel = isSameDate(day),
                        td = isToday(day),
                        ok = isDateSelectable(day);
                      return (
                        <button
                          key={day}
                          onClick={() => selectDate(day)}
                          disabled={!ok}
                          className={`aspect-square min-h-10 rounded text-sm transition-colors ${ok && !sel ? "hover:bg-gray-100 cursor-pointer" : ""} ${!ok ? "text-gray-300 cursor-default" : ""}`}
                          style={sel
                            ? { background: tc, color: textOnTheme, fontWeight: 700 }
                            : td && !sel
                              ? { color: tc, fontWeight: 700, boxShadow: `0 0 0 1.5px ${tc}55` }
                              : {}}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Times */}
                <div className="flex-1">
                  {selectedDate ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">
                          {DAYS_SHORT[selectedDate.getDay()]},{" "}
                          {MONTHS[selectedDate.getMonth()]}{" "}
                          {selectedDate.getDate()}
                        </h3>
                        <div className="flex border rounded-full overflow-hidden text-xs">
                          <button
                            onClick={() => setTimeFormat("12h")}
                            className="min-h-9 px-3 py-1"
                            style={timeFormat === "12h" ? { background: tc, color: textOnTheme } : { color: "#6b7280" }}
                          >
                            12h
                          </button>
                          <button
                            onClick={() => setTimeFormat("24h")}
                            className="min-h-9 px-3 py-1"
                            style={timeFormat === "24h" ? { background: tc, color: textOnTheme } : { color: "#6b7280" }}
                          >
                            24h
                          </button>
                        </div>
                      </div>
                      {calendarUnverified && timeSlots.length > 0 && (
                        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                          We couldn't reach {host.name?.split(" ")[0] || "the host"}'s calendar just now — these times may be subject to confirmation.
                        </div>
                      )}
                      {timeSlots.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4">
                          No available slots for this date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                          {timeSlots.map((t) => (
                            <button
                              key={t}
                              onClick={() => setSelectedTime(t)}
                              className="py-2.5 rounded border text-sm transition-all"
                              style={selectedTime === t
                                ? { background: tc, color: textOnTheme, borderColor: tc, fontWeight: 600 }
                                : {}}
                            >
                              {formatTime(t)}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400">
                      Select a date to see available times
                    </div>
                  )}
                </div>
              </div>
              {selectedTime && (
                <button
                  onClick={() => setStep("details")}
                  className="mt-6 w-full py-3 rounded font-bold text-sm transition-opacity hover:opacity-85"
                  style={{ background: tc, color: textOnTheme }}
                >
                  Continue →
                </button>
              )}
            </div>
          )}

          {/* STEP: details */}
          {step === "details" && (
            <div className="bg-white border rounded p-5 sm:p-7">
              <button
                onClick={() => setStep("time")}
                className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>{" "}
                Back
              </button>
              <h2 className="text-xl font-bold mb-5">Enter Details</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: Booking Summary */}
                <div className="order-2 lg:order-1">
                  <h3 className="font-semibold mb-3 text-sm text-gray-700">Booking Summary</h3>
                  <div className="border rounded p-4 text-sm space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service</span>
                      <span className="font-medium text-right">{service.title}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-500">Date</span>
                      <span>{selectedDate?.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-500">Time</span>
                      <span>
                        {formatTime(selectedTime)} – {formatTime(getEndTime(selectedTime))}{" "}
                        <span className="text-gray-400 text-xs">({tzAbbr})</span>
                      </span>
                    </div>
                    {isPaid && (
                      <div className="flex justify-between border-t pt-3">
                        <span className="text-gray-500 flex items-center gap-1">
                          Platform Fee (₹10 + GST)
                          <span className="relative group inline-flex">
                            <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                            </svg>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded bg-gray-900 text-white text-xs p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                              This helps us to keep your booking authenticated and send you timely reminders.
                            </span>
                          </span>
                        </span>
                        <span>₹{Math.round((10 + 10 * 0.18) * 100) / 100}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-3 font-semibold text-base">
                      <span>Total Amount</span>
                      <span style={{ color: tc }}>
                        {service.price === 0 ? "Free" : `₹${Math.round((service.price + 10 + 10 * 0.18) * 100) / 100}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Customer Information */}
                <div className="order-1 lg:order-2 space-y-4">
                  <h3 className="font-semibold mb-3 text-sm text-gray-700">Customer Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input type="text" required className="fb-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input type="text" className="fb-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email Address</label>
                    <input type="email" required className="fb-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mobile Number</label>
                    <input type="tel" required placeholder="+91 98765 43210" className="fb-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    <p className="text-xs text-gray-400 mt-1">Your verification code arrives on WhatsApp (and email as backup).</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea rows={3} placeholder="Any specific requirements..." className="fb-input resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Full-width Continue */}
              <button
                onClick={handleSendOtp}
                disabled={otpSending || !firstName || !email || (!user && !isPhoneValid)}
                className="mt-6 w-full py-3 rounded font-bold text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: tc, color: textOnTheme }}
              >
                {otpSending || verifying
                  ? "Please wait..."
                  : user
                  ? isPaid
                    ? "Continue to Payment"
                    : "Confirm Booking"
                  : "Send Verification Code"}
              </button>
            </div>
          )}

          {/* STEP: otp */}
          {step === "otp" && (
            <div className="bg-white border rounded p-5 sm:p-7">
              <button
                onClick={() => setStep("details")}
                className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-6"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>{" "}
                Back
              </button>
              <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: `${tc}18` }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: tc }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Check your messages</h2>
              <p className="text-sm text-gray-500 mb-6">
                We sent a 6-digit code to <strong>{phone}</strong> on WhatsApp
                {email ? <> (and <strong>{email}</strong> as backup)</> : null}
              </p>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                className="fb-input text-center text-2xl font-bold tracking-widest py-4"
                style={{ letterSpacing: '0.4em', maxWidth: '280px', margin: '0 auto' }}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
              <button
                onClick={handleVerifyAndBook}
                disabled={verifying || otp.length !== 6}
                className="mt-6 w-full py-3 rounded font-bold text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: tc, color: textOnTheme }}
              >
                {verifying
                  ? "Verifying..."
                  : isPaid
                    ? "Verify & Continue to Payment"
                    : "Verify & Confirm Booking"}
              </button>
              <button
                onClick={handleSendOtp}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600"
              >
                Didn't receive it? Resend code
              </button>
              </div>{/* end max-w-md center wrapper */}
            </div>
          )}

          {/* STEP: payment */}
          {step === "payment" && confirmation && (() => {
            // Total the customer pays = service + platform fee + GST.
            // Prefer the server snapshot; fall back to a local estimate for legacy rows.
            const _fee = Number(confirmation?.platform_fee_amount ?? 10);
            const _gst = confirmation?.platform_fee_gst != null
              ? Number(confirmation.platform_fee_gst)
              : Math.round(_fee * 0.18 * 100) / 100;
            const checkoutTotal = confirmation?.customer_total != null
              ? Number(confirmation.customer_total)
              : Math.round((service.price + _fee + _gst) * 100) / 100;
            return (
            <div className="bg-white border rounded p-5 sm:p-7">
              <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: `${tc}18` }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: tc }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Complete Payment</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your slot is held. Pay now to confirm.
              </p>
              <div className="bg-gray-50 rounded p-4 text-sm text-left space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium">{service.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span>
                    {selectedDate?.toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span>{formatTime(selectedTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service price</span>
                  <span>₹{service.price}</span>
                </div>
                {confirmation?.platform_fee_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform fee</span>
                    <span>₹{confirmation.platform_fee_amount}</span>
                  </div>
                )}
                {confirmation?.platform_fee_gst > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST (18% on platform fee)</span>
                    <span>₹{confirmation.platform_fee_gst}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-semibold text-base">
                  <span>Total you pay</span>
                  {/* Must equal the amount Razorpay charges (service + fee + GST) */}
                  <span style={{ color: tc }}>₹{checkoutTotal}</span>
                </div>
              </div>
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full py-3 rounded font-bold text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: tc, color: textOnTheme }}
              >
                {paymentLoading
                  ? "Opening payment..."
                  : `Pay ₹${checkoutTotal} with Razorpay`}
              </button>
              <p className="text-xs text-gray-400 mt-3">
                Secured by Razorpay · UPI, Card, Wallet accepted
              </p>
              </div>{/* end max-w-md center wrapper */}
            </div>
            );
          })()}

          {/* STEP: confirmed */}
          {step === "confirmed" && confirmation && (
            <div className="bg-white border rounded p-5 sm:p-7">
              <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: `${tc}18` }}>
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ color: tc }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: tc }}>
                Booking Confirmed!
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {selectedDate?.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {formatTime(selectedTime)} ({tzAbbr})
              </p>
              <div className="bg-gray-50 rounded p-4 text-sm text-left space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium">{service.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Host</span>
                  <span>{host.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span>{service.duration} min</span>
                </div>
                {confirmation.meeting_link && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-gray-500">Meeting</span>
                    <a
                      href={confirmation.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Join Google Meet
                    </a>
                  </div>
                )}
              </div>
              {confirmation.meeting_link && (
                <a
                  href={confirmation.meeting_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 fb-btn fb-btn--primary mb-4"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join Google Meet
                </a>
              )}
              <p className="text-xs text-gray-400">
                Confirmation email sent to {email}
              </p>
              <Link
                to={`/${profileSlug}`}
                className="block mt-4 text-sm text-green-600 hover:underline"
              >
                Back to {host.name}'s profile
              </Link>
              </div>{/* end max-w-md center wrapper */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceBooking;

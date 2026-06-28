import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  X,
  ArrowRight,
  ChevronRight,
  IndianRupee,
  MessageCircle,
  FileText,
  CalendarCheck,
  Globe,
  Clock,
  Link2,
  Shield,
} from "lucide-react";
import useUtm from "../../hooks/useUtm";
import useDocumentMeta from "../../hooks/useDocumentMeta";
import { analytics, EVENTS } from "../../services/analytics";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

/*
  /lp/calendly-alternative
  Visual: Calendly.com — navy #1A1A2E, blue #006BFF, light #F5F8FF
  Copy: "everything Calendly does + payments in ₹ for India"
*/

const SLUG = "calendly-alternative";
const CAL_BLUE = "#006BFF";
const CAL_NAVY = "#1A1A2E";
const CAL_BODY = "#4B4B63";
const CAL_LIGHT = "#F5F8FF";

/* ─────────────────────────────────────────────
   Custom blue CTA (Calendly blue, not BAS orange)
   ───────────────────────────────────────────── */
function CalCta({ slot, label = "Get started", variant = "primary", className = "" }) {
  const { startVendorGoogleAuth } = useAuth();
  const utm = useUtm();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    analytics.track(EVENTS.LP_CTA_CLICKED, { slug: SLUG, slot, ...utm });
    setBusy(true);
    try {
      await startVendorGoogleAuth("signup");
    } catch (err) {
      setBusy(false);
      toast.error(err?.response?.data?.message || "Could not sign in. Try again.");
    }
  };

  if (variant === "google") {
    return (
      <button
        onClick={handleClick}
        disabled={busy}
        className={`flex w-full items-center justify-center gap-3 rounded-lg border-2 bg-white py-3 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-60 ${className}`}
        style={{ borderColor: CAL_BLUE, color: CAL_NAVY }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        {busy ? "Opening…" : label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 ${className}`}
      style={{ background: CAL_BLUE }}
    >
      {busy ? "Opening…" : label}
      {!busy && <ArrowRight size={14} />}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Step UI mockups — defined BEFORE STEPS array
   ───────────────────────────────────────────── */
function ConnectCalendarUI() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)]">
      <div className="mb-4 text-sm font-semibold" style={{ color: CAL_NAVY }}>Connect your calendars</div>
      {[
        { name: "Google Calendar", color: "#4285F4", connected: true },
        { name: "Outlook", color: "#0078D4", connected: false },
        { name: "Apple Calendar", color: "#555", connected: false },
      ].map((cal) => (
        <div key={cal.name} className="mb-2 flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full" style={{ background: cal.color }} />
            <span className="text-sm font-medium" style={{ color: CAL_NAVY }}>{cal.name}</span>
          </div>
          {cal.connected
            ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Connected</span>
            : <button className="text-[11px] font-semibold" style={{ color: CAL_BLUE }}>Connect</button>
          }
        </div>
      ))}
      <div className="mt-3 rounded-lg p-3 text-xs text-gray-500" style={{ background: CAL_LIGHT }}>
        ✓ Busy times auto-blocked · No double-bookings
      </div>
    </div>
  );
}

function AvailabilityUI() {
  const slots = ["9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)]">
      <div className="mb-1 text-sm font-semibold" style={{ color: CAL_NAVY }}>Availability</div>
      <div className="mb-4 text-xs text-gray-400">Set when you&apos;re typically available</div>
      <div className="mb-3 flex gap-1">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <div
            key={i}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
            style={{ background: i < 5 ? CAL_BLUE : "#F3F4F6", color: i < 5 ? "white" : "#9CA3AF" }}
          >{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {slots.map((s) => (
          <div key={s} className="flex items-center gap-2 rounded-md border border-gray-100 px-2.5 py-1.5 text-xs">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: CAL_BLUE }} />
            <span style={{ color: CAL_NAVY }}>{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-right text-[11px] font-medium text-gray-400">Timezone · IST — India</div>
    </div>
  );
}

function PaymentUI() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)]">
      <div className="mb-4 text-sm font-semibold" style={{ color: CAL_NAVY }}>Pricing &amp; payments</div>
      <div className="mb-3 rounded-lg p-3" style={{ background: CAL_LIGHT }}>
        <div className="text-xs text-gray-500">Service price</div>
        <div className="mt-1 flex items-center gap-1">
          <span className="text-xl font-bold" style={{ color: CAL_NAVY }}>₹1,500</span>
          <span className="text-xs text-gray-400">per session</span>
        </div>
      </div>
      <div className="mb-2 text-xs font-semibold text-gray-500">Payment methods accepted</div>
      {[
        { label: "UPI (PhonePe, GPay, Paytm)", color: "#25D366" },
        { label: "Credit / Debit card", color: CAL_BLUE },
        { label: "Net banking &amp; wallets", color: "#5E3AD4" },
      ].map((p) => (
        <div key={p.label} className="mb-1.5 flex items-center gap-2 text-xs">
          <Check size={12} style={{ color: p.color }} />
          <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: p.label }} />
        </div>
      ))}
      <div className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700">
        📄 GST invoice auto-generated on every booking
      </div>
    </div>
  );
}

function ShareLinkUI() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)]">
      <div className="mb-4 text-sm font-semibold" style={{ color: CAL_NAVY }}>Your booking link</div>
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{ borderColor: `${CAL_BLUE}30`, background: CAL_LIGHT }}>
        <Globe size={14} style={{ color: CAL_BLUE, flexShrink: 0 }} />
        <span className="flex-1 text-xs font-medium" style={{ color: CAL_BLUE }}>bookasloth.com/priya</span>
        <button className="rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: CAL_BLUE }}>Copy</button>
      </div>
      <div className="mt-3 text-xs font-medium text-gray-500">Share via</div>
      <div className="mt-2 flex gap-2">
        {["📧 Email","💬 WhatsApp","🔗 LinkedIn"].map((s) => (
          <span key={s} className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-600">{s}</span>
        ))}
      </div>
      <div className="mt-4 rounded-lg p-3 text-center text-xs text-white" style={{ background: CAL_NAVY }}>
        Client picks slot → Pays ₹ → You get notified ✓
      </div>
    </div>
  );
}

function HeroProductCard() {
  return (
    <div className="relative py-10 px-6">
      {/* Calendly-style purple/blue blob */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(135deg, #5E3AD4 0%, #006BFF 55%, #0AE8F0 100%)",
          borderRadius: "40% 60% 55% 45% / 55% 40% 60% 45%",
          transform: "scale(1.08)",
        }}
      />
      <div className="rounded-2xl border border-white/30 bg-white p-5 shadow-[0_24px_80px_-8px_rgba(0,0,0,0.3)]">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#5E3AD4" }}>Workflow</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5E3AD4] text-[10px] font-bold text-white">✓</span>
        </div>
        <div className="mb-3 text-sm font-semibold" style={{ color: CAL_NAVY }}>Reduce no-shows and stay on track</div>
        <div className="space-y-2">
          {[
            { t: "Send WhatsApp reminder", sub: "24 hours before event starts", arrow: "→ Send to invitees" },
            { t: "Send GST invoice", sub: "Immediately after payment", arrow: "→ Send to client" },
            { t: "Send follow-up email", sub: "2 hours after event ends", arrow: "→ Send to invitees" },
          ].map((w) => (
            <div key={w.t} className="rounded-lg border border-gray-100 p-2.5" style={{ background: CAL_LIGHT }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold" style={{ color: CAL_NAVY }}>{w.t}</span>
                <span className="text-[10px]" style={{ color: CAL_BLUE }}>{w.arrow}</span>
              </div>
              <div className="mt-0.5 text-[10px] text-gray-400">{w.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Data
   ───────────────────────────────────────────── */
const STEPS = [
  { icon: CalendarCheck, title: "Connect your calendar", sub: "Google Calendar syncs in one click. Busy times auto-block across every page — zero double-bookings, ever.", Ui: ConnectCalendarUI },
  { icon: Clock, title: "Add your availability", sub: "Set when you're free, define buffer times, cap daily bookings. You're always in control.", Ui: AvailabilityUI },
  { icon: IndianRupee, title: "Set your price & payment", sub: "Add a price — clients pay via UPI, cards or wallets the moment they book. A GST invoice is auto-generated.", Ui: PaymentUI },
  { icon: Link2, title: "Share your booking link", sub: "One link. Clients pick a slot, pay up-front, get a Google Meet link. You just show up.", Ui: ShareLinkUI },
];

const INTEGRATIONS = [
  { name: "Google Meet", abbr: "G", color: "#4285F4" },
  { name: "Calendar", abbr: "Cal", color: "#34A853" },
  { name: "Razorpay", abbr: "R", color: "#2D81F7" },
  { name: "WhatsApp", abbr: "WA", color: "#25D366" },
  { name: "Gmail", abbr: "M", color: "#EA4335" },
  { name: "Zoom", abbr: "Z", color: "#2D8CFF" },
  { name: "PhonePe", abbr: "₹", color: "#5F259F" },
  { name: "Paytm", abbr: "P", color: "#00BAF2" },
  { name: "Outlook", abbr: "O", color: "#0078D4" },
  { name: "Slack", abbr: "S", color: "#4A154B" },
  { name: "Stripe", abbr: "St", color: "#635BFF" },
  { name: "Zapier", abbr: "Zap", color: "#FF4A00" },
];

const COMPARE = [
  { f: "Take payment at booking (UPI / cards)", basT: "Built in", bas: true, cT: "No", c: false },
  { f: "GST invoices — automatic", basT: "Yes", bas: true, cT: "No", c: false },
  { f: "WhatsApp reminders", basT: "Yes", bas: true, cT: "No", c: false },
  { f: "INR billing (₹)", basT: "Yes", bas: true, cT: "USD only", c: false },
  { f: "Price", basT: "₹499 / month", bas: true, cT: "~₹1,200 / month (USD)", c: false },
  { f: "Google Calendar sync", basT: "Yes", bas: true, cT: "Yes", c: true },
  { f: "Google Meet links", basT: "Yes", bas: true, cT: "Yes", c: true },
  { f: "Custom booking page", basT: "Yes", bas: true, cT: "Yes", c: true },
  { f: "Email reminders", basT: "Yes", bas: true, cT: "Yes", c: true },
  { f: "Free plan", basT: "Yes", bas: true, cT: "Yes", c: true },
];

const PLANS = [
  {
    name: "Starter", price: "Free", priceNote: "For individuals starting out",
    features: ["1 service type", "Unlimited bookings", "Google Calendar sync", "Google Meet links", "Email reminders", "Booking page"],
    cta: "Get started", highlight: false,
  },
  {
    name: "Host+", badge: "Recommended", price: "₹499", cadence: "/ month", priceNote: "For professionals and creators",
    features: ["Unlimited services", "UPI + card payments", "GST invoices — auto", "WhatsApp reminders", "Analytics dashboard", "Priority support"],
    cta: "Start free trial", highlight: true,
  },
  {
    name: "Studio", price: "₹999", cadence: "/ month", priceNote: "For teams and power users",
    features: ["Everything in Host+", "Team scheduling", "Digital products", "Custom domain", "Advanced analytics", "Dedicated support"],
    cta: "Start free trial", highlight: false,
  },
];

const METRICS = [
  { stat: "4×", label: "more bookings after enabling UPI payments", bg: "#FFFFFF", fg: CAL_NAVY, sub: "#4B4B63", name: "Priya S.", role: "Career Coach, Bengaluru" },
  { stat: "3 fewer", label: "no-shows per week with WhatsApp reminders", bg: "#5E3AD4", fg: "#FFFFFF", sub: "rgba(255,255,255,0.7)", name: "Rahul M.", role: "Fitness Trainer, Mumbai" },
  { stat: "₹0", label: "spent chasing clients for GST invoices", bg: CAL_LIGHT, fg: CAL_NAVY, sub: CAL_BODY, name: "Ananya K.", role: "Astrologer, Chennai" },
  { stat: "10 min", label: "from sign-up to first paid booking", bg: "#0AE8F0", fg: CAL_NAVY, sub: "#2D5A6B", name: "Vikram T.", role: "Consultant, Delhi" },
];

/* ════════════════════════════════════════
   PAGE
   ════════════════════════════════════════ */
const CalendlyAlternative = () => {
  const utm = useUtm();
  const [activeStep, setActiveStep] = useState(0);
  const [billingAnnual, setBillingAnnual] = useState(true);

  useDocumentMeta({
    title: "Book A Sloth — Calendly alternative built for India",
    description: "Calendly schedules. Book A Sloth schedules AND collects ₹ via UPI, sends GST invoices, WhatsApp reminders — built for India at ₹499/month.",
  });

  useEffect(() => {
    analytics.page({ lp: SLUG });
    analytics.track(EVENTS.LP_VIEWED, { slug: SLUG, ...utm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ActiveUi = STEPS[activeStep].Ui;

  return (
    <div
      className="min-h-dvh overflow-x-hidden bg-white"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: CAL_NAVY }}
    >

      {/* ══════ HEADER ══════ */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold tracking-tight" style={{ color: CAL_NAVY }}>
              Book A Sloth
            </span>
            <span className="hidden rounded bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-semibold sm:inline" style={{ color: CAL_BLUE }}>
              🇮🇳 Built for India
            </span>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" style={{ color: "#6B7280" }}>
            {[["#how-it-works","Product"],["#integrations","Integrations"],["#pricing","Pricing"]].map(([href, label]) => (
              <a
                key={label}
                href={href}
                className="transition-colors hover:no-underline"
                style={{ color: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = CAL_NAVY; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#6B7280"; }}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login-as-vendor"
              className="hidden text-sm font-semibold hover:no-underline sm:block"
              style={{ color: "#6B7280" }}
            >
              Log in
            </Link>
            <CalCta slot="header" label="Get started" className="!py-2 !px-4 !text-[13px]" />
          </div>
        </div>
      </header>

      {/* ══════ HERO ══════ */}
      <section className="overflow-hidden bg-white px-5 pb-20 pt-16 sm:px-8 sm:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Left */}
          <div>
            <h1
              className="text-[2.8rem] font-extrabold leading-[1.08] tracking-tight sm:text-[3.6rem]"
              style={{ color: CAL_NAVY }}
            >
              Easy scheduling<br />
              <span style={{ color: CAL_BLUE }}>ahead.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed" style={{ color: CAL_BODY }}>
              Join 2,000+ Indian professionals who easily book meetings,
              collect ₹ payments, and auto-send GST invoices — with the #1
              scheduling tool built for India.
            </p>

            {/* Calendly-style auth buttons */}
            <div id="start" className="mt-8 max-w-xs scroll-mt-24 space-y-3">
              <CalCta slot="hero-google" label="Sign up with Google" variant="google" />
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <CalCta slot="hero-email" label="Sign up free with email" className="w-full !justify-center !rounded-lg" />
              <p className="text-xs text-gray-400">No credit card required</p>
            </div>

            {/* Feature pills */}
            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-6">
              {[
                { e: "🔒", t: "Secured by Razorpay" },
                { e: "📄", t: "GST invoices" },
                { e: "💬", t: "WhatsApp reminders" },
                { e: "🇮🇳", t: "UPI + cards" },
              ].map((b) => (
                <li key={b.t} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: CAL_BODY }}>
                  {b.e} {b.t}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — blob + workflow card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[360px]">
              <HeroProductCard />
            </div>
          </div>
        </div>
      </section>

      {/* ══════ TRUSTED BY ══════ */}
      <section className="border-y border-gray-100 bg-white px-5 py-7 sm:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
          Trusted by professionals across India
        </p>
        <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {["Career Coaches","Astrologers","Fitness Trainers","Consultants","Teachers","Therapists","Designers","Photographers"].map((c) => (
            <span key={c} className="text-sm font-semibold text-gray-300">{c}</span>
          ))}
        </div>
      </section>

      {/* ══════ HOW IT WORKS — Calendly step-nav style ══════ */}
      <section id="how-it-works" className="scroll-mt-16 px-5 py-20 sm:px-8" style={{ background: CAL_LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: CAL_BLUE }}>
            How it works
          </p>
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: CAL_NAVY }}>
            Book A Sloth makes scheduling simple
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-lg" style={{ color: CAL_BODY }}>
            Everything Calendly does — plus UPI payments, GST invoices and WhatsApp
            reminders, built for India.
          </p>
          <div className="mt-5 flex justify-center">
            <CalCta slot="how-it-works" label="Sign up for free" />
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-[320px_1fr] lg:items-start">
            {/* Step list */}
            <div>
              {STEPS.map((step, i) => (
                <button
                  key={step.title}
                  onClick={() => setActiveStep(i)}
                  className="group flex w-full items-start gap-4 text-left"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all"
                      style={{
                        borderColor: activeStep === i ? CAL_BLUE : "#D1D5DB",
                        background: activeStep === i ? CAL_BLUE : "white",
                        color: activeStep === i ? "white" : "#9CA3AF",
                      }}
                    >
                      {i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="mt-1 w-0.5"
                        style={{ height: "3rem", background: activeStep > i ? CAL_BLUE : "#E5E7EB" }}
                      />
                    )}
                  </div>
                  <div className={`pb-10 pt-1 ${i === STEPS.length - 1 ? "pb-0" : ""}`}>
                    <div
                      className="text-base font-bold transition-colors"
                      style={{ color: activeStep === i ? CAL_NAVY : "#9CA3AF" }}
                    >
                      {step.title}
                    </div>
                    {activeStep === i && (
                      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: CAL_BODY }}>
                        {step.sub}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Active step UI */}
            <div className="lg:sticky lg:top-24">
              <ActiveUi />
            </div>
          </div>
        </div>
      </section>

      {/* ══════ INDIA DIFFERENTIATORS ══════ */}
      <section className="px-5 py-16 sm:px-8" style={{ background: CAL_NAVY }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { icon: IndianRupee, color: "#0AE8F0", h: "Calendly schedules.\nWe get you paid.", b: "Clients pay via UPI, cards or wallets the moment they book. Settled directly to your bank. No chasing, no separate payment links." },
              { icon: FileText, color: "#5E3AD4", h: "GST invoices.\nAutomatic. Always.", b: "Every booking triggers a compliant GST invoice, sent to your client instantly. Your CA will finally stop calling." },
              { icon: MessageCircle, color: "#25D366", h: "WhatsApp reminders.\nWhere India reads.", b: "Automated nudges on WhatsApp 24h before every session. Fewer no-shows, zero manual follow-up. Indian by design." },
            ].map((item) => (
              <div key={item.h} className="rounded-2xl border border-white/10 p-7">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${item.color}20` }}>
                  <item.icon size={20} style={{ color: item.color }} />
                </div>
                <h3 className="whitespace-pre-line text-lg font-bold leading-snug text-white">{item.h}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>{item.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ INTEGRATIONS ══════ */}
      <section id="integrations" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
            <div className="lg:max-w-[280px]">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: CAL_BLUE }}>
                Integrations
              </p>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: CAL_NAVY }}>
                Connect to the tools you already use
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: CAL_BODY }}>
                Google Calendar, Razorpay, WhatsApp, UPI — and every tool Calendly supports. 100+ integrations.
              </p>
              <a
                href="#start"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold hover:no-underline transition-opacity hover:opacity-80"
                style={{ color: CAL_BLUE }}
              >
                View all integrations <ChevronRight size={15} />
              </a>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                {INTEGRATIONS.map((int) => (
                  <div
                    key={int.name}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ background: int.color }}
                    >
                      {int.abbr}
                    </div>
                    <span className="text-center text-[10px] font-medium leading-tight text-gray-500">
                      {int.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { title: "Google suite", body: "Calendar, Meet, Gmail — all connected in one click", color: "#4285F4" },
                  { title: "UPI + payment suite", body: "Razorpay, PhonePe, Paytm — pay at booking in ₹", color: "#25D366" },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="flex items-start justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <div className="text-sm font-bold" style={{ color: CAL_NAVY }}>{card.title}</div>
                      <div className="mt-0.5 text-xs" style={{ color: CAL_BODY }}>{card.body}</div>
                    </div>
                    <ArrowRight size={15} className="mt-0.5 shrink-0 text-gray-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ COMPARISON ══════ */}
      <section className="px-5 py-16 sm:px-8" style={{ background: CAL_LIGHT }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: CAL_NAVY }}>
            Book A Sloth vs Calendly
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm" style={{ color: CAL_BODY }}>
            All the scheduling power — plus the Indian toolkit Calendly doesn&apos;t have.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Feature</th>
                  <th className="px-5 py-4 text-sm font-bold" style={{ background: "#EEF4FF", color: CAL_BLUE }}>
                    Book A Sloth 🇮🇳
                  </th>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-400">Calendly</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={row.f} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 ? "#FAFBFF" : "white" }}>
                    <th scope="row" className="px-5 py-3 text-sm font-medium" style={{ color: CAL_NAVY }}>{row.f}</th>
                    <td className="px-5 py-3" style={{ background: i % 2 ? "#E8F0FF" : "#EEF4FF" }}>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: CAL_BLUE }}>
                        <Check size={14} /> {row.basT}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-sm ${row.c ? "text-gray-600" : "text-gray-400"}`}>
                        {row.c ? <Check size={14} className="text-gray-400" /> : <X size={14} className="text-gray-300" />}
                        {row.cT}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            Calendly Pro approx US$12–16/mo, billed in USD, as of Jun 2026.
          </p>
        </div>
      </section>

      {/* ══════ PRICING ══════ */}
      <section id="pricing" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: CAL_NAVY }}>
            Pick the perfect plan for your work
          </h2>
          <p className="mt-2 text-center" style={{ color: CAL_BODY }}>All plans billed in ₹. No USD. No surprises.</p>

          {/* Toggle */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingAnnual(false)}
              className="text-sm font-semibold transition-colors"
              style={{ color: !billingAnnual ? CAL_BLUE : "#9CA3AF" }}
            >
              Billed monthly
            </button>
            <button
              onClick={() => setBillingAnnual((v) => !v)}
              className="relative h-5 w-9 rounded-full transition-colors"
              style={{ background: billingAnnual ? CAL_BLUE : "#D1D5DB" }}
              aria-label="Toggle billing period"
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                style={{ left: billingAnnual ? "calc(100% - 18px)" : "2px" }}
              />
            </button>
            <button
              onClick={() => setBillingAnnual(true)}
              className="text-sm font-semibold transition-colors"
              style={{ color: billingAnnual ? CAL_BLUE : "#9CA3AF" }}
            >
              Billed yearly{" "}
              <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
                Save 20%
              </span>
            </button>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-2xl border p-7 transition"
                style={{
                  borderColor: plan.highlight ? CAL_BLUE : "#E5E7EB",
                  background: plan.highlight ? CAL_BLUE : "white",
                  boxShadow: plan.highlight
                    ? "0 16px 48px -8px rgba(0,107,255,0.35)"
                    : "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-[11px] font-bold text-white"
                    style={{ background: CAL_NAVY }}
                  >
                    {plan.badge}
                  </div>
                )}
                <div className="text-sm font-bold" style={{ color: plan.highlight ? "rgba(255,255,255,0.75)" : "#6B7280" }}>
                  {plan.name}
                </div>
                <div className="mt-1 flex items-end gap-1">
                  <span className="text-4xl font-extrabold" style={{ color: plan.highlight ? "white" : CAL_NAVY }}>
                    {plan.price}
                  </span>
                  {plan.cadence && (
                    <span className="mb-1 text-sm" style={{ color: plan.highlight ? "rgba(255,255,255,0.65)" : "#9CA3AF" }}>
                      {plan.cadence}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs" style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "#9CA3AF" }}>
                  {plan.priceNote}
                </p>
                <CalCta
                  slot={`pricing-${plan.name}`}
                  label={plan.cta}
                  className={`mt-5 w-full !justify-center !rounded-xl !py-2.5 ${
                    plan.highlight ? "!bg-white !text-[#006BFF]" : ""
                  }`}
                />
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check
                        size={14}
                        style={{ color: plan.highlight ? "rgba(255,255,255,0.8)" : CAL_BLUE, flexShrink: 0 }}
                      />
                      <span style={{ color: plan.highlight ? "rgba(255,255,255,0.9)" : CAL_BODY }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-sm text-gray-400">
            All paid plans include a 14-day free trial · No card required
          </p>
        </div>
      </section>

      {/* ══════ METRIC CARDS — Calendly case-study style ══════ */}
      <section className="px-5 py-20 sm:px-8" style={{ background: CAL_LIGHT }}>
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: CAL_NAVY }}>
            Discover how Indian professionals grow with Book A Sloth
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m) => (
              <div
                key={m.stat}
                className="group relative overflow-hidden rounded-2xl p-6 transition hover:-translate-y-1"
                style={{ background: m.bg, border: m.bg === "#FFFFFF" ? "1px solid #E5E7EB" : "none" }}
              >
                <div className="text-4xl font-extrabold tracking-tight" style={{ color: m.fg }}>{m.stat}</div>
                <p className="mt-2 text-sm leading-snug" style={{ color: m.sub }}>{m.label}</p>
                <div className="mt-4 flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: m.bg === "#FFFFFF" ? CAL_BLUE : "rgba(255,255,255,0.3)" }}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: m.fg }}>{m.name}</div>
                    <div className="text-[10px]" style={{ color: m.sub }}>{m.role}</div>
                  </div>
                </div>
                <div
                  className="absolute bottom-4 right-4 flex items-center gap-0.5 text-xs font-bold opacity-0 transition-all group-hover:opacity-100"
                  style={{ color: m.fg }}
                >
                  Read <ArrowRight size={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ SECURITY BADGES ══════ */}
      <section className="border-y border-gray-100 bg-white px-5 py-8 sm:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Security &amp; trust</p>
        <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-6">
          {[
            [Shield,"Razorpay Secured"],
            [FileText,"GST Compliant"],
            [Shield,"Data Encrypted"],
            [Shield,"PCI DSS"],
          ].map(([Icon, label]) => (
            <div key={label} className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <Icon size={15} className="text-gray-300" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl" style={{ color: CAL_NAVY }}>
            Power up your scheduling.
            <br />
            <span style={{ color: CAL_BLUE }}>Keep every rupee.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg" style={{ color: CAL_BODY }}>
            Free to start. UPI payments from day one. No card required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-full max-w-xs">
              <CalCta slot="final-google" label="Sign up with Google" variant="google" />
            </div>
            <div className="flex items-center gap-2 w-full max-w-xs">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <CalCta slot="final-email" label="Sign up free with email" className="w-full max-w-xs !justify-center !rounded-lg" />
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login-as-vendor" className="font-semibold hover:no-underline" style={{ color: CAL_BLUE }}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-gray-100 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-gray-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Book A Sloth — The Calendly alternative built for India</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = CAL_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              Privacy
            </Link>
            <Link to="/help" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = CAL_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              Help
            </Link>
            <a href="mailto:bolt@bookasloth.in" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = CAL_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              bolt@bookasloth.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CalendlyAlternative;

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
  Shield,
  Sparkles,
} from "lucide-react";
import useUtm from "../../hooks/useUtm";
import useDocumentMeta from "../../hooks/useDocumentMeta";
import { analytics, EVENTS } from "../../services/analytics";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import HowItWorks from "../../components/home/HowItWorks";
import { ALL_PLANS } from "../../data/plans";
import { TESTIMONIALS } from "../../data/testimonials";

/*
  /lp/calendly-alternative
  Hybrid look: Calendly's layout/structure (familiarity for paid traffic) +
  Book A Sloth branding — brand orange CTAs, Plus Jakarta Sans / Poppins,
  Friendly-Brutalism cards. Calendly blue is kept only as a trust accent.
  Copy: "everything Calendly does + payments in ₹ for India".
*/

const SLUG = "calendly-alternative";

/* Hybrid palette — BAS brand + a Calendly-blue trust accent */
const CAL_BLUE = "#006BFF"; // Calendly-blue accent (familiarity)
const CAL_NAVY = "#1A1A2E"; // dark surface + heading ink
const CAL_BODY = "#4B4B63"; // muted body
const CAL_LIGHT = "#F5F8FF"; // soft blue-tinted section bg
const BAS_ORANGE = "#FE5100"; // brand accent / large text
const BAS_CTA = "#c23d00"; // brand orange for white-text buttons (WCAG AA)
const BAS_PEACH = "#FFE9DD"; // primary-light tint

/* Per-card accent colours for the social-proof grid */
const ACCENTS = [CAL_BLUE, BAS_ORANGE, "#5E3AD4", "#059669", "#db2777", "#0891b2", "#2563eb", "#f59e0b"];

const fmtINR = (n) => `₹${n.toLocaleString("en-IN")}`;

/* ─────────────────────────────────────────────
   CTA — one-click Google signup (reuses AuthContext startVendorGoogleAuth).
   No email form anywhere: every CTA hands off straight to Google.
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
        className={`flex w-full items-center justify-center gap-3 rounded-[6px] border-2 border-black/10 bg-white py-3 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition hover:-translate-y-0.5 hover:border-black/20 disabled:opacity-60 ${className}`}
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
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-60 ${className}`}
      style={{ background: BAS_CTA }}
    >
      {busy ? "Opening…" : label}
      {!busy && <ArrowRight size={14} />}
    </button>
  );
}

/* ─────────────────────────────────────────────
   AccentCard — brand-coloured abstract shapes tucked in the corners that
   bloom on hover (smooth, transform/opacity only — lightweight). Wraps any
   card content. overflow-hidden clips the shapes to the card.
   ───────────────────────────────────────────── */
function AccentCard({ accent = CAL_BLUE, className = "", children, ...rest }) {
  return (
    <div className={`group relative overflow-hidden ${className}`} {...rest}>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.08] transition-all duration-500 ease-out group-hover:scale-[1.45] group-hover:opacity-[0.22]"
        style={{ background: accent }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-[42%] opacity-[0.06] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:opacity-[0.16]"
        style={{ background: accent }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(130% 130% at 100% 0%, ${accent}1f, transparent 55%)` }}
      />
      <div className="relative z-[1] h-full">{children}</div>
    </div>
  );
}

/* Avatar with graceful initials fallback (CDN photo may be unset). */
function Avatar({ src, name, accent = CAL_BLUE }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: `${accent}1a`, color: accent }}
      >
        {name?.charAt(0) || "★"}
      </div>
    );
  }
  return (
    <img
      src={src}
      onError={() => setErr(true)}
      alt={name}
      loading="lazy"
      className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
    />
  );
}

/* Hero product mock — Calendly-style "workflow" card on a brand blob */
function HeroProductCard() {
  return (
    <div className="relative py-10 px-6">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(135deg, #FE5100 0%, #FF8A4C 45%, #006BFF 100%)",
          borderRadius: "40% 60% 55% 45% / 55% 40% 60% 45%",
          transform: "scale(1.08)",
        }}
      />
      <div className="rounded-[6px] border border-white/30 bg-white p-5 shadow-[0_24px_80px_-8px_rgba(0,0,0,0.3)]">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: BAS_ORANGE }}>Workflow</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: BAS_ORANGE }}>✓</span>
        </div>
        <div className="mb-3 font-heading text-sm font-bold" style={{ color: CAL_NAVY }}>Reduce no-shows and stay on track</div>
        <div className="space-y-2">
          {[
            { t: "Send WhatsApp reminder", sub: "24 hours before event starts", arrow: "→ Send to invitees" },
            { t: "Send GST invoice", sub: "Immediately after payment", arrow: "→ Send to client" },
            { t: "Send follow-up email", sub: "2 hours after event ends", arrow: "→ Send to invitees" },
          ].map((w) => (
            <div key={w.t} className="rounded-[6px] border border-gray-100 p-2.5" style={{ background: CAL_LIGHT }}>
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
  { f: "Take payment at booking (UPI / cards)", basT: "Built in", cT: "No", c: false },
  { f: "GST invoices — automatic", basT: "Yes", cT: "No", c: false },
  { f: "WhatsApp reminders", basT: "Yes", cT: "No", c: false },
  { f: "INR billing (₹)", basT: "Yes", cT: "USD only", c: false },
  { f: "0% commission on paid plans", basT: "Yes", cT: "N/A", c: false },
  { f: "Starting price", basT: "₹199 / month", cT: "~₹1,200 / month (USD)", c: false },
  { f: "Google Calendar sync", basT: "Yes", cT: "Yes", c: true },
  { f: "Google Meet links", basT: "Yes", cT: "Yes", c: true },
  { f: "Custom booking page", basT: "Yes", cT: "Yes", c: true },
  { f: "Email reminders", basT: "Yes", cT: "Yes", c: true },
  { f: "Free plan", basT: "Yes", cT: "Yes", c: true },
];

/* ════════════════════════════════════════
   PAGE
   ════════════════════════════════════════ */
const CalendlyAlternative = () => {
  const utm = useUtm();
  const [billingAnnual, setBillingAnnual] = useState(true);

  useDocumentMeta({
    title: "Book A Sloth — Calendly alternative built for India",
    description:
      "Calendly schedules. Book A Sloth schedules AND collects ₹ via UPI, sends GST invoices, WhatsApp reminders — built for India from ₹199/month.",
  });

  useEffect(() => {
    analytics.page({ lp: SLUG });
    analytics.track(EVENTS.LP_VIEWED, { slug: SLUG, ...utm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-dvh overflow-x-hidden bg-white"
      style={{ fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif", color: CAL_NAVY }}
    >
      {/* ══════ HEADER ══════ */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="font-heading text-base font-extrabold tracking-tight" style={{ color: CAL_NAVY }}>
              Book A Sloth
            </span>
            <span
              className="hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline"
              style={{ background: BAS_PEACH, color: BAS_CTA }}
            >
              🇮🇳 Built for India
            </span>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" style={{ color: "#6B7280" }}>
            {[["#how-it-works", "Product"], ["#integrations", "Integrations"], ["#pricing", "Pricing"]].map(([href, label]) => (
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
              className="font-heading text-[2.8rem] font-extrabold leading-[1.08] tracking-tight sm:text-[3.6rem]"
              style={{ color: CAL_NAVY }}
            >
              Easy scheduling<br />
              <span style={{ color: BAS_ORANGE }}>ahead.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed" style={{ color: CAL_BODY }}>
              Join 2,000+ Indian professionals who easily book meetings, collect ₹ payments,
              and auto-send GST invoices — with the #1 scheduling tool built for India.
            </p>

            {/* Google-only signup */}
            <div id="start" className="mt-8 max-w-xs scroll-mt-24">
              <CalCta slot="hero-google" label="Sign up with Google" variant="google" />
              <p className="mt-2.5 text-xs text-gray-400">Free plan · No credit card required</p>
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

          {/* Right — brand blob + workflow card */}
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
          {["Career Coaches", "Astrologers", "Fitness Trainers", "Consultants", "Teachers", "Therapists", "Designers", "Photographers"].map((c) => (
            <span key={c} className="text-sm font-semibold text-gray-300">{c}</span>
          ))}
        </div>
      </section>

      {/* ══════ HOW IT WORKS — reuses the homepage cards on a dark band ══════ */}
      <section id="how-it-works" className="scroll-mt-16 bg-neutral-900 px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: BAS_ORANGE }}>
            How it works
          </p>
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Book A Sloth makes scheduling simple
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-lg text-neutral-300">
            Everything Calendly does — plus UPI payments, GST invoices and WhatsApp reminders, built for India.
          </p>
          <div className="mt-6 flex justify-center">
            <CalCta slot="how-it-works" label="Sign up for free" />
          </div>

          <HowItWorks />
        </div>
      </section>

      {/* ══════ INDIA DIFFERENTIATORS ══════ */}
      <section className="px-5 py-16 sm:px-8" style={{ background: CAL_NAVY }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { icon: IndianRupee, color: "#0AE8F0", h: "Calendly schedules.\nWe get you paid.", b: "Clients pay via UPI, cards or wallets the moment they book. Settled directly to your bank. No chasing, no separate payment links." },
              { icon: FileText, color: "#FE5100", h: "GST invoices.\nAutomatic. Always.", b: "Every booking triggers a compliant GST invoice, sent to your client instantly. Your CA will finally stop calling." },
              { icon: MessageCircle, color: "#25D366", h: "WhatsApp reminders.\nWhere India reads.", b: "Automated nudges on WhatsApp 24h before every session. Fewer no-shows, zero manual follow-up. Indian by design." },
            ].map((item) => (
              <AccentCard key={item.h} accent={item.color} className="rounded-[6px] border border-white/10 p-7">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[6px]" style={{ background: `${item.color}20` }}>
                  <item.icon size={20} style={{ color: item.color }} />
                </div>
                <h3 className="whitespace-pre-line font-heading text-lg font-bold leading-snug text-white">{item.h}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>{item.b}</p>
              </AccentCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ INTEGRATIONS ══════ */}
      <section id="integrations" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
            <div className="lg:max-w-[280px]">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: BAS_ORANGE }}>
                Integrations
              </p>
              <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: CAL_NAVY }}>
                Connect to the tools you already use
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: CAL_BODY }}>
                Google Calendar, Razorpay, WhatsApp, UPI — and every tool Calendly supports. 100+ integrations.
              </p>
              <a
                href="#start"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:no-underline hover:opacity-80"
                style={{ color: BAS_CTA }}
              >
                View all integrations <ChevronRight size={15} />
              </a>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
                {INTEGRATIONS.map((int) => (
                  <div
                    key={int.name}
                    className="flex flex-col items-center gap-1.5 rounded-[6px] border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-[6px] text-xs font-bold text-white"
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
                  { title: "Google suite", body: "Calendar, Meet, Gmail — all connected in one click", color: CAL_BLUE },
                  { title: "UPI + payment suite", body: "Razorpay, PhonePe, Paytm — pay at booking in ₹", color: BAS_ORANGE },
                ].map((card) => (
                  <AccentCard
                    key={card.title}
                    accent={card.color}
                    className="rounded-[6px] border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-heading text-sm font-bold" style={{ color: CAL_NAVY }}>{card.title}</div>
                        <div className="mt-0.5 text-xs" style={{ color: CAL_BODY }}>{card.body}</div>
                      </div>
                      <ArrowRight size={15} className="mt-0.5 shrink-0 text-gray-300" />
                    </div>
                  </AccentCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ COMPARISON ══════ */}
      <section className="px-5 py-16 sm:px-8" style={{ background: CAL_LIGHT }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: CAL_NAVY }}>
            Book A Sloth vs Calendly
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm" style={{ color: CAL_BODY }}>
            All the scheduling power — plus the Indian toolkit Calendly doesn&apos;t have.
          </p>
          <div className="mt-8 overflow-hidden rounded-[6px] border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Feature</th>
                  <th className="px-5 py-4 font-heading text-sm font-bold" style={{ background: BAS_PEACH, color: BAS_CTA }}>
                    Book A Sloth 🇮🇳
                  </th>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-400">Calendly</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={row.f} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 ? "#FFFBF8" : "white" }}>
                    <th scope="row" className="px-5 py-3 text-sm font-medium" style={{ color: CAL_NAVY }}>{row.f}</th>
                    <td className="px-5 py-3" style={{ background: i % 2 ? "#FFE3D2" : BAS_PEACH }}>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BAS_CTA }}>
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

      {/* ══════ STRONG CTA — after comparison ══════ */}
      <section className="px-5 py-16 sm:px-8" style={{ background: CAL_NAVY }}>
        <div className="mx-auto max-w-4xl">
          <AccentCard
            accent={BAS_ORANGE}
            className="rounded-[6px] border border-white/10 px-6 py-12 text-center sm:px-12"
          >
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: `${BAS_ORANGE}26`, color: "#FFB088" }}>
              <Sparkles size={13} /> Made in India, for India
            </span>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Say No to Calendly.<br />
              <span style={{ color: BAS_ORANGE }}>Say Yes to Book A Sloth.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-neutral-300">
              Build your professional booking page, automate your schedule, and grow your
              business with a platform designed for Indian professionals.
            </p>
            <div className="mx-auto mt-8 max-w-xs">
              <CalCta slot="comparison-cta" label="Sign up with Google" variant="google" />
              <p className="mt-2.5 text-xs text-neutral-400">Free to start · UPI payments from day one</p>
            </div>
          </AccentCard>
        </div>
      </section>

      {/* ══════ PRICING — synced with homepage (src/data/plans.js) ══════ */}
      <section id="pricing" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: CAL_NAVY }}>
            Pick the Perfect Plan for Your Work
          </h2>
          <p className="mt-2 text-center" style={{ color: CAL_BODY }}>
            All plans billed in ₹. 0% commission on paid plans. No USD, no surprises.
          </p>

          {/* Billing toggle */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setBillingAnnual(false)}
              className="text-sm font-semibold transition-colors"
              style={{ color: !billingAnnual ? BAS_CTA : "#9CA3AF" }}
            >
              Billed monthly
            </button>
            <button
              onClick={() => setBillingAnnual((v) => !v)}
              className="relative h-5 w-9 rounded-full transition-colors"
              style={{ background: billingAnnual ? BAS_ORANGE : "#D1D5DB" }}
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
              style={{ color: billingAnnual ? BAS_CTA : "#9CA3AF" }}
            >
              Billed yearly{" "}
              <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">
                Save up to 58%
              </span>
            </button>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {ALL_PLANS.map((plan, i) => {
              const isFree = plan.monthly === 0;
              const perMo = isFree ? 0 : Math.round(plan.yearly / 12);
              const savePct = isFree ? 0 : Math.round((1 - plan.yearly / 12 / plan.monthly) * 100);
              const big = isFree ? "Free" : (billingAnnual ? fmtINR(plan.yearly) : fmtINR(plan.monthly));
              const cadence = isFree ? "" : (billingAnnual ? "/ year" : "/ month");
              const sub = isFree
                ? "Free forever"
                : (billingAnnual ? `just ₹${perMo}/mo, billed yearly` : "billed monthly");
              const highlight = !!plan.recommended;
              const accent = highlight ? BAS_ORANGE : ACCENTS[i % ACCENTS.length];

              return (
                <AccentCard
                  key={plan.name}
                  accent={accent}
                  className={`flex h-full flex-col rounded-[6px] border bg-white p-7 transition hover:-translate-y-1 ${
                    highlight ? "shadow-[0_24px_60px_-30px_rgba(254,81,0,0.45)]" : "shadow-[0_8px_30px_rgba(26,26,26,0.05)]"
                  }`}
                  style={{ borderColor: highlight ? BAS_ORANGE : "#E5E7EB" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg font-bold" style={{ color: CAL_NAVY }}>{plan.name}</span>
                    {highlight && (
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white" style={{ background: BAS_CTA }}>
                        Recommended
                      </span>
                    )}
                    {plan.badge && !highlight && (
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ background: BAS_PEACH, color: BAS_CTA }}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "#9CA3AF" }}>{plan.tagline}</p>

                  <div className="mt-5 flex items-end gap-1">
                    <span className="text-4xl font-extrabold" style={{ color: CAL_NAVY }}>{big}</span>
                    {cadence && <span className="mb-1 text-sm" style={{ color: "#9CA3AF" }}>{cadence}</span>}
                  </div>
                  <p className="mt-0.5 text-xs" style={{ color: "#9CA3AF" }}>
                    {sub}
                    {!isFree && billingAnnual && savePct > 0 && (
                      <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Save {savePct}%
                      </span>
                    )}
                  </p>

                  <CalCta
                    slot={`pricing-${plan.name}`}
                    label={isFree ? "Get started free" : "Start free trial"}
                    variant="google"
                    className="mt-5"
                  />

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={14} className="mt-0.5 shrink-0" style={{ color: accent }} />
                        <span style={{ color: CAL_BODY }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </AccentCard>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm text-gray-400">
            0% commission on paid plans · Prices in INR, excl. GST · Cancel anytime
          </p>
        </div>
      </section>

      {/* ══════ SOCIAL PROOF — real hosts, Calendly case-study card style ══════ */}
      <section className="px-5 py-20 sm:px-8" style={{ background: CAL_LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: CAL_NAVY }}>
            Discover How Indian Professionals Grow with Book A Sloth
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-sm" style={{ color: CAL_BODY }}>
            Coaches, doctors, architects, freelancers — real professionals who replaced the
            back-and-forth with one Book A Sloth link.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <AccentCard
                  key={t.name}
                  accent={accent}
                  className="flex h-full flex-col rounded-[6px] border border-black/5 bg-white p-6 shadow-[0_8px_30px_rgba(26,26,26,0.05)] transition hover:-translate-y-1"
                >
                  <span className="font-heading text-3xl font-extrabold leading-none" style={{ color: accent }} aria-hidden>“</span>
                  <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: CAL_NAVY }}>{t.quote}</p>
                  <div className="mt-5 flex items-center gap-2.5">
                    <Avatar src={t.avatar} name={t.name} accent={accent} />
                    <div>
                      <div className="text-xs font-bold" style={{ color: CAL_NAVY }}>{t.name}</div>
                      <div className="text-[11px]" style={{ color: CAL_BODY }}>{t.role}</div>
                    </div>
                  </div>
                </AccentCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ SECURITY BADGES ══════ */}
      <section className="border-y border-gray-100 bg-white px-5 py-8 sm:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Security &amp; trust</p>
        <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-6">
          {[
            [Shield, "Razorpay Secured"],
            [FileText, "GST Compliant"],
            [Shield, "Data Encrypted"],
            [Shield, "PCI DSS"],
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
          <h2 className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl" style={{ color: CAL_NAVY }}>
            Power up your scheduling.
            <br />
            <span style={{ color: BAS_ORANGE }}>Keep every rupee.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg" style={{ color: CAL_BODY }}>
            Free to start. UPI payments from day one. No card required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-full max-w-xs">
              <CalCta slot="final-google" label="Sign up with Google" variant="google" />
            </div>
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <Link to="/login-as-vendor" className="font-semibold hover:no-underline" style={{ color: BAS_CTA }}>
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

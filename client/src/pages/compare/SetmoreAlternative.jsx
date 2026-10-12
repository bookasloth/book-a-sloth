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
} from "lucide-react";
import useUtm from "../../hooks/useUtm";
import useDocumentMeta from "../../hooks/useDocumentMeta";
import { analytics, EVENTS } from "../../services/analytics";
import Seo from "../../components/common/Seo";
import { ogCard } from "../../config/ogImages";
import { SITE_URL, comparisonGraphJsonLd } from "../../utils/seo";
import HowItWorks from "../../components/home/HowItWorks";
import LogoMarquee from "../../components/about/LogoMarquee";
import { ALL_PLANS } from "../../data/plans";
import useFeeOnly from "../../hooks/useFeeOnly";
import { TESTIMONIALS } from "../../data/testimonials";
import { LpCta, AccentCard as KitAccentCard, Avatar as KitAvatar, fmtINR, BAS_ORANGE, BAS_CTA, BAS_PEACH } from "./_altKit";
import { useHideChrome } from "../../context/ChromeContext";

/*
  /compare/setmore-alternative
  Hybrid look: Setmore's clean card-based layout with sage-green accents
  (familiarity for paid traffic) + Book A Sloth branding — brand orange CTAs,
  Plus Jakarta Sans / Poppins. Green trust accents mirror Setmore's palette.
  Copy: "everything Setmore does + UPI payments, GST invoices, WhatsApp reminders".
*/

const SLUG = "setmore-alternative";

/* Hybrid palette — BAS brand + Setmore-green trust accent */
const SET_GREEN = "#48B774";     // Setmore brand green (familiarity)
const SET_DARK = "#2D6A4F";      // dark green for headings
const SET_NAVY = "#1A202C";      // body text ink
const SET_BODY = "#4A5568";      // muted body
const SET_LIGHT = "#F0FFF4";     // soft green-tinted section bg

/* Per-card accent colours for the social-proof grid */
const ACCENTS = [SET_GREEN, BAS_ORANGE, "#5E3AD4", "#059669", "#db2777", "#0891b2", "#2563eb", "#f59e0b"];


/* ─────────────────────────────────────────────
   CTA — one-click Google signup
   ───────────────────────────────────────────── */
const SetCta = (p) => <LpCta slug={SLUG} {...p} />;

/* ─────────────────────────────────────────────
   AccentCard — brand-coloured abstract shapes
   ───────────────────────────────────────────── */
const AccentCard = (p) => <KitAccentCard accent={SET_GREEN} {...p} />;

/* Avatar with graceful initials fallback */
const Avatar = (p) => <KitAvatar accent={SET_GREEN} {...p} />;

/* Hero product visual */
const HERO_IMG = "https://company-assets.bookasloth.in/images/compare/setmore-alternative-hero.png";

function HeroBookingMock() {
  return (
    <div className="rounded-xl border border-white/30 bg-white p-5 shadow-[0_24px_80px_-8px_rgba(0,0,0,0.3)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: SET_GREEN }}>Booking page</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: SET_GREEN }}>✓</span>
      </div>
      <div className="mb-3 font-heading text-sm font-bold" style={{ color: SET_NAVY }}>Collect payments at booking</div>
      <div className="space-y-2">
        {[
          { t: "Client books a slot", sub: "Pick date, time & service", arrow: "→ Booking confirmed" },
          { t: "Pay via UPI / Cards", sub: "Razorpay checkout at booking", arrow: "→ ₹ settled instantly" },
          { t: "WhatsApp reminder sent", sub: "24 hours before appointment", arrow: "→ Zero no-shows" },
        ].map((w) => (
          <div key={w.t} className="rounded-lg border border-gray-100 p-2.5" style={{ background: SET_LIGHT }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: SET_NAVY }}>{w.t}</span>
              <span className="text-[10px]" style={{ color: SET_GREEN }}>{w.arrow}</span>
            </div>
            <div className="mt-0.5 text-[10px] text-gray-400">{w.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroProductCard() {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="relative py-10 px-6">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, ${SET_GREEN} 0%, #6FCF97 45%, ${BAS_ORANGE} 100%)`,
          borderRadius: "40% 60% 55% 45% / 55% 40% 60% 45%",
          transform: "scale(1.08)",
        }}
      />
      {imgOk ? (
        <img
          src={HERO_IMG}
          alt="Book A Sloth — collect payments and manage bookings"
          onError={() => setImgOk(false)}
          className="w-full rounded-xl border border-white/30 bg-white shadow-[0_24px_80px_-8px_rgba(0,0,0,0.3)]"
        />
      ) : (
        <HeroBookingMock />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Data
   ───────────────────────────────────────────── */
const INTEGRATIONS = [
  { name: "Google Meet", domain: "meet.google.com" },
  { name: "Google Calendar", domain: "calendar.google.com" },
  { name: "Razorpay", domain: "razorpay.com" },
  { name: "WhatsApp", domain: "whatsapp.com" },
  { name: "Gmail", domain: "gmail.com" },
  { name: "Zoom", domain: "zoom.us" },
  { name: "PhonePe", domain: "phonepe.com" },
  { name: "Paytm", domain: "paytm.com" },
  { name: "Outlook", domain: "outlook.com" },
  { name: "Slack", domain: "slack.com" },
  { name: "Stripe", domain: "stripe.com" },
  { name: "Zapier", domain: "zapier.com" },
];

const COMPARE = [
  { f: "UPI payments at booking", basT: "Built in", sT: "No", s: false },
  { f: "Indian payment gateway (Razorpay)", basT: "Yes", sT: "No", s: false },
  { f: "WhatsApp reminders", basT: "Yes", sT: "No", s: false },
  { f: "GST invoices — automatic", basT: "Yes", sT: "No", s: false },
  { f: "INR billing (₹)", basT: "Yes", sT: "USD only", s: false },
  { f: "0% commission on Sloth Active", basT: "Yes", sT: "N/A", s: false },
  { f: "Starting price", basT: "₹0 free · ₹399/mo paid", sT: "$5 / user / mo (Pro, yearly)", s: false },
  { f: "Free plan appointments", basT: "Unlimited", sT: "Unlimited (up to 4 users)", s: true },
  { f: "Google Calendar sync", basT: "Yes", sT: "Yes", s: true },
  { f: "Video meetings", basT: "Yes", sT: "Yes (Teleport)", s: true },
  { f: "Custom booking page", basT: "Yes", sT: "Yes", s: true },
  { f: "Email reminders", basT: "Yes", sT: "Yes", s: true },
];

const FAQ = [
  {
    q: "Can I migrate my Setmore bookings to Book A Sloth?",
    a: "Yes. Export your client list and upcoming bookings from Setmore, then import them into Book A Sloth. Our support team helps you migrate for free — just email bolt@bookasloth.in.",
  },
  {
    q: "Does Book A Sloth support UPI payments like PhonePe and Google Pay?",
    a: "Absolutely. Book A Sloth uses Razorpay, so your clients can pay via UPI, debit/credit cards, net banking, and wallets at the time of booking. Setmore only supports Stripe, Square, and PayPal — none of which offer UPI.",
  },
  {
    q: "Is the free plan really unlimited appointments?",
    a: "Yes. Book A Sloth's free Sloth plan has no appointment cap, and it already takes UPI payments and sends GST invoices. Setmore's free plan is also unlimited for up to 4 users, but it can't take UPI.",
  },
  {
    q: "Can I send WhatsApp reminders to my clients?",
    a: "Yes — automated WhatsApp reminders are built in on paid plans. Setmore only offers email and SMS reminders, with no WhatsApp support. In India, WhatsApp has 95%+ open rates vs 20% for email.",
  },
  {
    q: "Does Book A Sloth generate GST invoices?",
    a: "Yes. Every paid booking automatically generates a GST-compliant invoice sent to your client. No third-party invoicing tool needed. Setmore has no GST invoice support.",
  },
  {
    q: "How does pricing compare to Setmore Pro?",
    a: "Setmore Pro costs $5/user/month (USD only), which adds up fast for teams. Book A Sloth is free to start, then ₹399/month flat — no per-user pricing, billed in INR. You save on both the plan cost and forex fees.",
  },
];

/* ════════════════════════════════════════
   PAGE
   ════════════════════════════════════════ */
const SetmoreAlternative = () => {
  // Legacy design — draws its own header/footer until rebuilt. Rebuilt pages drop this.
  useHideChrome();
  const feeOnly = useFeeOnly();
  const plans = feeOnly ? ALL_PLANS.filter((p) => p.monthly !== 0) : ALL_PLANS;
  const utm = useUtm();
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useDocumentMeta({
    title: "Book A Sloth — Setmore alternative built for India",
    description:
      "Setmore books appointments. Book A Sloth books AND collects ₹ via UPI, sends GST invoices, WhatsApp reminders — built for India, free to start.",
  });

  useEffect(() => {
    analytics.page({ lp: SLUG });
    analytics.track(EVENTS.LP_VIEWED, { slug: SLUG, ...utm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-dvh overflow-x-hidden bg-white"
      style={{ fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif", color: SET_NAVY }}
    >
      <Seo
        title="The Best Setmore Alternative for Indian Professionals — Book A Sloth"
        description="Looking for a Setmore alternative? Book A Sloth adds UPI payments, WhatsApp reminders, GST invoices, and a booking page built for Indian professionals."
        image={ogCard('lp-setmore-alternative')}
        canonical={`${SITE_URL}/compare/setmore-alternative`}
        jsonLd={comparisonGraphJsonLd({
          canonical: `${SITE_URL}/compare/setmore-alternative`,
          name: "The Best Setmore Alternative for Indian Professionals — Book A Sloth",
          description: "Book A Sloth adds UPI payments, WhatsApp reminders, GST invoices, and a booking page built for Indian professionals — a Setmore alternative.",
          breadcrumbName: "Setmore Alternative",
          faqs: FAQ,
        })}
      />

      {/* ══════ HEADER ══════ */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur" style={{ borderColor: `${SET_GREEN}20` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="font-heading text-base font-extrabold tracking-tight" style={{ color: SET_NAVY }}>
              Book A Sloth
            </span>
            <span
              className="hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline"
              style={{ background: SET_LIGHT, color: SET_DARK }}
            >
              🇮🇳 Built for India
            </span>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" style={{ color: "#6B7280" }}>
            {[["#how-it-works", "Product"], ["#integrations", "Integrations"], ["#pricing", "Pricing"], ["#faq", "FAQ"]].map(([href, label]) => (
              <a
                key={label}
                href={href}
                className="transition-colors hover:no-underline"
                style={{ color: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = SET_DARK; }}
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
            <SetCta slot="header" label="Get started" className="!py-2 !px-4 !text-[13px]" />
          </div>
        </div>
      </header>

      {/* ══════ HERO ══════ */}
      <section className="overflow-hidden bg-white px-5 pb-20 pt-16 sm:px-8 sm:pt-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1
              className="font-heading text-[2.6rem] font-extrabold leading-[1.08] tracking-tight sm:text-[3.4rem]"
              style={{ color: SET_NAVY }}
            >
              Everything Setmore does —<br />
              <span style={{ color: BAS_ORANGE }}>plus UPI, GST &amp; WhatsApp</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed" style={{ color: SET_BODY }}>
              Book appointments, collect payments the moment clients book via UPI, and send
              WhatsApp reminders automatically. Online booking built for how India works.
            </p>

            <div id="start" className="mt-8 max-w-xs scroll-mt-24">
              <SetCta slot="hero-google" label="Sign up with Google" variant="google" />
              <p className="mt-2.5 text-xs text-gray-400">Free plan · No credit card required</p>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-6">
              {[
                { e: "🔒", t: "Secured by Razorpay" },
                { e: "📄", t: "GST invoices" },
                { e: "💬", t: "WhatsApp reminders" },
                { e: "🇮🇳", t: "UPI + cards" },
              ].map((b) => (
                <li key={b.t} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: SET_BODY }}>
                  {b.e} {b.t}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[360px]">
              <HeroProductCard />
            </div>
          </div>
        </div>
      </section>

      {/* ══════ LOGO MARQUEE ══════ */}
      <div className="border-y border-gray-100 bg-white">
        <LogoMarquee />
      </div>

      {/* ══════ HOW IT WORKS ══════ */}
      <section id="how-it-works" className="scroll-mt-16 bg-neutral-900 px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: SET_GREEN }}>
            How it works
          </p>
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Smarter booking for Indian professionals
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-lg text-neutral-300">
            Everything Setmore does — plus UPI payments, GST invoices, and WhatsApp reminders. No per-user pricing.
          </p>
          <div className="mt-6 flex justify-center">
            <SetCta slot="how-it-works" label="Sign up for free" />
          </div>

          <HowItWorks />
        </div>
      </section>

      {/* ══════ INTEGRATIONS ══════ */}
      <section id="integrations" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
            <div className="lg:max-w-[280px]">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: SET_GREEN }}>
                Integrations
              </p>
              <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: SET_NAVY }}>
                Connect to the tools you already use
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: SET_BODY }}>
                Google Calendar, Razorpay, WhatsApp, UPI — every tool Indian professionals need, plus everything Setmore connects to.
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
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white">
                      <img
                        src={`https://www.google.com/s2/favicons?sz=64&domain=${int.domain}`}
                        alt={int.name}
                        loading="lazy"
                        className="h-6 w-6 object-contain"
                      />
                    </div>
                    <span className="text-center text-[10px] font-medium leading-tight text-gray-500">
                      {int.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { title: "Google suite", body: "Calendar, Meet, Gmail — all connected in one click", color: SET_GREEN },
                  { title: "UPI + payment suite", body: "Razorpay, PhonePe, Paytm — pay at booking in ₹", color: BAS_ORANGE },
                ].map((card) => (
                  <AccentCard
                    key={card.title}
                    accent={card.color}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-heading text-sm font-bold" style={{ color: SET_NAVY }}>{card.title}</div>
                        <div className="mt-0.5 text-xs" style={{ color: SET_BODY }}>{card.body}</div>
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
      <section className="px-5 py-16 sm:px-8" style={{ background: SET_LIGHT }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: SET_NAVY }}>
            Book A Sloth vs Setmore
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm" style={{ color: SET_BODY }}>
            All the booking power — plus the Indian toolkit Setmore doesn&apos;t have.
          </p>
          <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Feature</th>
                  <th className="px-5 py-4 font-heading text-sm font-bold" style={{ background: BAS_PEACH, color: BAS_CTA }}>
                    Book A Sloth 🇮🇳
                  </th>
                  <th className="px-5 py-4 text-sm font-semibold text-gray-400">Setmore</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={row.f} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 ? "#FFFBF8" : "white" }}>
                    <th scope="row" className="px-5 py-3 text-sm font-medium" style={{ color: SET_NAVY }}>{row.f}</th>
                    <td className="px-5 py-3" style={{ background: i % 2 ? "#FFE3D2" : BAS_PEACH }}>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BAS_CTA }}>
                        <Check size={14} /> {row.basT}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-sm ${row.s ? "text-gray-600" : "text-gray-400"}`}>
                        {row.s ? <Check size={14} className="text-gray-400" /> : <X size={14} className="text-gray-300" />}
                        {row.sT}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #EAD7CC" }}>
                  <td className="hidden px-5 py-5 align-top text-xs font-semibold uppercase tracking-wide text-gray-400 sm:table-cell">
                    The verdict
                  </td>
                  <td className="px-4 py-5 align-top sm:px-5" style={{ background: BAS_PEACH }}>
                    <div className="font-heading text-sm font-extrabold leading-snug sm:text-base" style={{ color: SET_NAVY }}>
                      Say Yes to<br />Book A Sloth.
                    </div>
                    <p className="mt-1 hidden text-xs sm:block" style={{ color: SET_BODY }}>
                      Built for India. Paid in ₹ from day one.
                    </p>
                    <div className="mt-3 sm:max-w-[220px]">
                      <SetCta slot="compare-yes" label="Sign up with Google" variant="google" />
                    </div>
                  </td>
                  <td className="px-4 py-5 align-top sm:px-5">
                    <div className="font-heading text-sm font-bold leading-snug text-gray-400 line-through sm:text-base">
                      Say No to Setmore.
                    </div>
                    <p className="mt-1 hidden text-xs text-gray-400 sm:block">
                      USD billing. No UPI. No GST. No WhatsApp.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-300">
                      <X size={13} /> No thanks
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            Setmore Pro approx US$5/user/mo, billed in USD, as of Jul 2026.
          </p>
        </div>
      </section>

      {/* ══════ PRICING ══════ */}
      <section id="pricing" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: SET_NAVY }}>
            Simple Pricing, No Per-User Fees
          </h2>
          <p className="mt-2 text-center" style={{ color: SET_BODY }}>
            All plans billed in ₹, GST included. 0% commission on Sloth Active. No USD, no per-seat surprises.
          </p>

          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setBillingAnnual(false)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${!billingAnnual ? "text-white" : "text-neutral-500 hover:text-ink"}`}
                style={!billingAnnual ? { background: BAS_CTA } : undefined}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingAnnual(true)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${billingAnnual ? "text-white" : "text-neutral-500 hover:text-ink"}`}
                style={billingAnnual ? { background: BAS_CTA } : undefined}
              >
                Yearly
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${billingAnnual ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                  Save 58%
                </span>
              </button>
            </div>
          </div>

          <div className={`mt-10 grid gap-5 ${feeOnly ? "sm:grid-cols-2 sm:max-w-3xl sm:mx-auto" : "md:grid-cols-3"}`}>
            {plans.map((plan, i) => {
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
                  className={`flex h-full flex-col rounded-xl border bg-white p-7 transition hover:-translate-y-1 ${
                    highlight ? "shadow-[0_24px_60px_-30px_rgba(254,81,0,0.45)]" : "shadow-[0_8px_30px_rgba(26,26,26,0.05)]"
                  }`}
                  style={{ borderColor: highlight ? BAS_ORANGE : "#E5E7EB" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg font-bold" style={{ color: SET_NAVY }}>{plan.name}</span>
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
                    <span className="text-4xl font-extrabold" style={{ color: SET_NAVY }}>{big}</span>
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

                  <SetCta
                    slot={`pricing-${plan.name}`}
                    label={isFree ? "Start for Free" : "Get Started Now"}
                    className="mt-5 w-full !justify-center"
                  />

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={14} className="mt-0.5 shrink-0" style={{ color: accent }} />
                        <span style={{ color: SET_BODY }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </AccentCard>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm text-gray-400">
            0% commission on Sloth Active · All prices include GST · Cancel anytime
          </p>
        </div>
      </section>

      {/* ══════ TESTIMONIALS ══════ */}
      <section className="px-5 py-20 sm:px-8" style={{ background: SET_LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: SET_NAVY }}>
            Trusted by Indian Professionals
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-sm" style={{ color: SET_BODY }}>
            Doctors, lawyers, coaches, salon owners — real professionals who switched from
            Setmore to a platform built for India.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <AccentCard
                  key={t.name}
                  accent={accent}
                  className="flex h-full flex-col rounded-xl border border-black/5 bg-white p-6 shadow-[0_8px_30px_rgba(26,26,26,0.05)] transition hover:-translate-y-1"
                >
                  <span className="font-heading text-3xl font-extrabold leading-none" style={{ color: accent }} aria-hidden>"</span>
                  <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: SET_NAVY }}>{t.quote}</p>
                  <div className="mt-5 flex items-center gap-2.5">
                    <Avatar src={t.avatar} name={t.name} accent={accent} />
                    <div>
                      <div className="text-xs font-bold" style={{ color: SET_NAVY }}>{t.name}</div>
                      <div className="text-[11px]" style={{ color: SET_BODY }}>{t.role}</div>
                    </div>
                  </div>
                </AccentCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ INDIA DIFFERENTIATORS ══════ */}
      <section className="px-5 py-16 sm:px-8 lg:py-20" style={{ background: SET_NAVY }}>
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: SET_GREEN }}>
            The India difference
          </p>
          <h2 className="mb-10 text-center font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            What Setmore can&apos;t do for Indian professionals.
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { icon: IndianRupee, color: "#0AE8F0", h: "Setmore books.\nWe get you paid.", b: "Clients pay via UPI, cards, or wallets the moment they book. Settled directly to your bank via Razorpay. No Stripe, no forex, no chasing." },
              { icon: FileText, color: "#FE5100", h: "GST invoices.\nAutomatic. Always.", b: "Every booking triggers a compliant GST invoice, sent to your client instantly. Setmore has zero GST support — your CA will thank you." },
              { icon: MessageCircle, color: "#25D366", h: "WhatsApp reminders.\nWhere India reads.", b: "Automated nudges on WhatsApp 24h before every session. 95% open rate vs 20% for email. Setmore only offers email and SMS reminders." },
            ].map((item) => (
              <AccentCard key={item.h} accent={item.color} className="rounded-xl border border-white/10 p-7">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${item.color}20` }}>
                  <item.icon size={20} style={{ color: item.color }} />
                </div>
                <h3 className="whitespace-pre-line font-heading text-lg font-bold leading-snug text-white">{item.h}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>{item.b}</p>
              </AccentCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FAQ ══════ */}
      <section id="faq" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: SET_NAVY }}>
            Switching from Setmore? We&apos;ve got answers.
          </h2>
          <p className="mx-auto mt-2 mb-10 max-w-md text-center text-sm" style={{ color: SET_BODY }}>
            Common questions from professionals migrating to Book A Sloth.
          </p>
          <div className="space-y-3">
            {FAQ.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border transition-colors"
                  style={{ borderColor: isOpen ? SET_GREEN : "#E5E7EB", background: isOpen ? SET_LIGHT : "white" }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="pr-4 text-sm font-semibold" style={{ color: SET_NAVY }}>{item.q}</span>
                    <ChevronRight
                      size={16}
                      className="shrink-0 transition-transform duration-200"
                      style={{ color: SET_GREEN, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4">
                      <p className="text-sm leading-relaxed" style={{ color: SET_BODY }}>{item.a}</p>
                    </div>
                  )}
                </div>
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
      <section className="px-5 py-20 sm:px-8" style={{ background: SET_NAVY }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Switch from Setmore.
            <br />
            <span style={{ color: BAS_ORANGE }}>Keep every rupee.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-neutral-300">
            Free to start. UPI payments from day one. No per-user pricing. No card required.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-full max-w-xs">
              <SetCta slot="final-google" label="Sign up with Google" variant="google" />
            </div>
            <p className="text-sm text-neutral-400">
              Already have an account?{" "}
              <Link to="/login-as-vendor" className="font-semibold hover:no-underline" style={{ color: BAS_ORANGE }}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-gray-100 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-gray-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Book A Sloth — The Setmore alternative built for India</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = SET_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              Privacy
            </Link>
            <Link to="/help" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = SET_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              Help
            </Link>
            <a href="mailto:bolt@bookasloth.in" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = SET_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              bolt@bookasloth.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SetmoreAlternative;

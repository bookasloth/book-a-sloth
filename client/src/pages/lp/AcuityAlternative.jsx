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
  Calendar,
  CreditCard,
  Zap,
  Users,
  Clock,
  Star,
} from "lucide-react";
import useUtm from "../../hooks/useUtm";
import useDocumentMeta from "../../hooks/useDocumentMeta";
import { analytics, EVENTS } from "../../services/analytics";
import Seo from "../../components/common/Seo";
import { ogCard } from "../../config/ogImages";
import { SITE_URL } from "../../utils/seo";
import HowItWorks from "../../components/home/HowItWorks";
import LogoMarquee from "../../components/about/LogoMarquee";
import { ALL_PLANS } from "../../data/plans";
import useFeeOnly from "../../hooks/useFeeOnly";
import { TESTIMONIALS } from "../../data/testimonials";
import { LpCta, AccentCard as KitAccentCard, Avatar as KitAvatar, fmtINR, BAS_ORANGE, BAS_CTA, BAS_PEACH } from "./_altKit";

/*
  /lp/acuity-alternative
  Mimics Acuity Scheduling's minimal flat design language — their blue palette,
  grid layouts, industry tabs — but with Book A Sloth content showing why BAS
  is better for Indian professionals. Acuity blue as trust accent, BAS orange CTAs.
  Copy: "Acuity books appointments. Book A Sloth books AND collects ₹ via UPI."
*/

const SLUG = "acuity-alternative";

/* Palette — Acuity blue accent + BAS brand */
const ACU_BLUE = "#006AFF";    // Acuity primary blue
const ACU_TEAL = "#0EA5E9";    // Acuity secondary teal accent
const ACU_DARK = "#1E1E2F";    // Acuity heading ink
const ACU_BODY = "#4A4A5A";    // Acuity muted body
const ACU_LIGHT = "#F0F4FF";   // Acuity blue-tinted section bg

const ACCENTS = [ACU_BLUE, BAS_ORANGE, "#5E3AD4", "#059669", "#db2777", "#0891b2", "#2563eb", "#f59e0b"];


/* ─────────────────────────────────────────────
   CTA — Google-only signup. Every CTA → /be-a-sloth
   ───────────────────────────────────────────── */
const AcuCta = (p) => <LpCta slug={SLUG} label="Get started for free" {...p} />;

/* ─────────────────────────────────────────────
   AccentCard — brand-coloured abstract shapes
   ───────────────────────────────────────────── */
const AccentCard = (p) => <KitAccentCard accent={ACU_BLUE} {...p} />;

/* Avatar with initials fallback */
const Avatar = (p) => <KitAvatar accent={ACU_BLUE} {...p} />;

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

const FEATURES = [
  {
    icon: Clock,
    color: ACU_BLUE,
    title: "Reduce no-shows by 80%",
    desc: "Automated WhatsApp + email reminders 24h before every session. Acuity sends emails — we reach clients where India actually reads.",
  },
  {
    icon: Zap,
    color: ACU_TEAL,
    title: "Automate the busywork",
    desc: "Intake forms, follow-up emails, GST invoices — triggered automatically. No manual steps after a client books.",
  },
  {
    icon: CreditCard,
    color: BAS_ORANGE,
    title: "Get paid at booking",
    desc: "UPI, cards, wallets — clients pay the moment they book. No chasing payments post-session. Settled directly to your bank.",
  },
  {
    icon: Calendar,
    color: "#059669",
    title: "Smart calendar sync",
    desc: "Two-way Google Calendar sync with auto Meet links. Clients see only your free slots — no double-bookings, ever.",
  },
  {
    icon: FileText,
    color: "#db2777",
    title: "GST invoices — automatic",
    desc: "Every paid booking generates a compliant GST invoice sent to your client. Your CA stops calling. Acuity has no clue what GST is.",
  },
  {
    icon: Users,
    color: "#5E3AD4",
    title: "Built for every profession",
    desc: "Doctors, lawyers, consultants, salons, tutors, fitness coaches — profession-specific booking pages that convert.",
  },
];

const COMPARE = [
  { f: "Take payment at booking (UPI / cards)", basT: "Built in", aT: "USD only", a: false },
  { f: "GST invoices — automatic", basT: "Yes", aT: "No", a: false },
  { f: "WhatsApp reminders", basT: "Yes", aT: "No", a: false },
  { f: "INR billing (₹)", basT: "Yes", aT: "USD only", a: false },
  { f: "UPI / Razorpay integration", basT: "Native", aT: "No", a: false },
  { f: "0% commission on Sloth Active", basT: "Yes", aT: "N/A", a: false },
  { f: "Starting price", basT: "₹0 free · ₹399/mo paid", aT: "~₹1,350 / month (USD)", a: false },
  { f: "Intake forms", basT: "Yes", aT: "Yes", a: true },
  { f: "Google Calendar sync", basT: "Yes", aT: "Yes", a: true },
  { f: "Email reminders", basT: "Yes", aT: "Yes", a: true },
  { f: "Custom booking page", basT: "Yes", aT: "Yes", a: true },
  { f: "Free plan", basT: "Yes", aT: "No (7-day trial)", a: false },
];

const INDUSTRIES = [
  { name: "Beauty & Salons", emoji: "💇", desc: "Appointment booking with advance payment — no more no-show walk-ins" },
  { name: "Business Consulting", emoji: "💼", desc: "Paid strategy calls with auto-invoicing and follow-up flows" },
  { name: "Wellness & Therapy", emoji: "🧘", desc: "Confidential session scheduling with gentle WhatsApp reminders" },
  { name: "Fitness & Training", emoji: "💪", desc: "Group class slots, personal training bookings, payment upfront" },
  { name: "Education & Tutoring", emoji: "📚", desc: "1:1 tutoring sessions with intake forms and payment at booking" },
  { name: "Creative & Arts", emoji: "🎨", desc: "Portfolio-style booking pages for photographers, designers, artists" },
];

const FAQ = [
  {
    q: "How is Book A Sloth different from Acuity Scheduling?",
    a: "Acuity is built for the US market — USD billing, Stripe/Square payments, no UPI. Book A Sloth is built from the ground up for India: Razorpay + UPI payments, WhatsApp reminders, GST invoices, and pricing in INR — free to start, ₹399/month when you upgrade.",
  },
  {
    q: "Can I migrate my Acuity clients to Book A Sloth?",
    a: "Yes. Share your new Book A Sloth booking link with existing clients. Since bookings are forward-looking, there's nothing to import — your clients simply start booking through your new link.",
  },
  {
    q: "Does Book A Sloth support intake forms like Acuity?",
    a: "Yes. You can add custom intake fields to any service — collect client details, medical history, project briefs, or anything you need before the session. All data stays with the booking.",
  },
  {
    q: "What about packages, subscriptions, and deposits?",
    a: "Book A Sloth supports paid bookings with full or partial payment at booking time. Subscription billing for recurring sessions is on our roadmap. Unlike Acuity, every payment is in ₹ via UPI/cards with zero conversion fees.",
  },
  {
    q: "Is there a free plan? Acuity removed theirs.",
    a: "Yes — Book A Sloth has a generous free Sloth plan. No credit card, no trial countdown. Upgrade to Sloth Active (₹399/mo, or ₹3,599/yr) when you need more.",
  },
  {
    q: "I'm locked into Squarespace. Can I still use Book A Sloth?",
    a: "Absolutely. Book A Sloth works independently — share your booking link anywhere (website, WhatsApp, Instagram bio). No Squarespace dependency, no ecosystem lock-in.",
  },
];

/* ════════════════════════════════════════
   PAGE
   ════════════════════════════════════════ */
const AcuityAlternative = () => {
  const feeOnly = useFeeOnly();
  const plans = feeOnly ? ALL_PLANS.filter((p) => p.monthly !== 0) : ALL_PLANS;
  const utm = useUtm();
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  useDocumentMeta({
    title: "Book A Sloth — Acuity Scheduling alternative built for India",
    description:
      "Acuity books appointments. Book A Sloth books AND collects ₹ via UPI — with GST invoices, WhatsApp reminders, and pricing that makes sense in India.",
  });

  useEffect(() => {
    analytics.page({ lp: SLUG });
    analytics.track(EVENTS.LP_VIEWED, { slug: SLUG, ...utm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-dvh overflow-x-hidden bg-white"
      style={{ fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif", color: ACU_DARK }}
    >
      <Seo
        title="The Best Acuity Scheduling Alternative for India — Book A Sloth"
        description="Looking for an Acuity alternative? Book A Sloth adds UPI payments, WhatsApp reminders, GST invoices, and a booking page built for Indian professionals."
        image={ogCard('lp-acuity-alternative')}
        canonical={`${SITE_URL}/lp/acuity-alternative`}
      />

      {/* ══════ HEADER ══════ */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur" style={{ borderColor: `${ACU_BLUE}15` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="font-heading text-base font-extrabold tracking-tight" style={{ color: ACU_DARK }}>
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
                onMouseEnter={(e) => { e.currentTarget.style.color = ACU_DARK; }}
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
            <AcuCta slot="header" label="Get started" className="!py-2 !px-4 !text-[13px]" />
          </div>
        </div>
      </header>

      {/* ══════ HERO — Acuity minimal style with blue gradient accent ══════ */}
      <section className="overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pt-20" style={{ background: `linear-gradient(180deg, ${ACU_LIGHT} 0%, white 100%)` }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: ACU_BLUE }}>
              Acuity alternative for India
            </p>
            <h1
              className="font-heading text-[2.6rem] font-extrabold leading-[1.08] tracking-tight sm:text-[3.4rem]"
              style={{ color: ACU_DARK }}
            >
              Scheduling that gets you paid —{" "}
              <span style={{ background: `linear-gradient(135deg, ${ACU_BLUE}, ${ACU_TEAL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                not just booked
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed" style={{ color: ACU_BODY }}>
              Acuity books appointments. Book A Sloth books AND collects ₹ via UPI — with GST invoices,
              WhatsApp reminders, and pricing that makes sense in India.
            </p>

            <div id="start" className="mt-8 max-w-xs scroll-mt-24">
              <AcuCta slot="hero-google" label="Sign up with Google" variant="google" />
              <p className="mt-2.5 text-xs text-gray-400">Free plan · No credit card · No trial countdown</p>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t pt-6" style={{ borderColor: `${ACU_BLUE}15` }}>
              {[
                { e: "🔒", t: "Secured by Razorpay" },
                { e: "📄", t: "GST invoices" },
                { e: "💬", t: "WhatsApp reminders" },
                { e: "🇮🇳", t: "UPI + cards" },
              ].map((b) => (
                <li key={b.t} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: ACU_BODY }}>
                  {b.e} {b.t}
                </li>
              ))}
            </ul>
          </div>

          {/* Right — Acuity-style scheduling preview card */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[380px]">
              <div className="relative py-8 px-6">
                <div
                  className="absolute inset-0 -z-10"
                  style={{
                    background: `linear-gradient(135deg, ${ACU_BLUE} 0%, ${ACU_TEAL} 50%, ${BAS_ORANGE} 100%)`,
                    borderRadius: "40% 60% 55% 45% / 55% 40% 60% 45%",
                    transform: "scale(1.08)",
                  }}
                />
                <div className="rounded-[6px] border border-white/30 bg-white p-5 shadow-[0_24px_80px_-8px_rgba(0,0,0,0.3)]">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: ACU_BLUE }}>Client experience</span>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: ACU_BLUE }}>✓</span>
                  </div>
                  <div className="mb-3 font-heading text-sm font-bold" style={{ color: ACU_DARK }}>Book, pay, show up. Done.</div>
                  <div className="space-y-2">
                    {[
                      { t: "Client picks a slot", sub: "From your available hours", icon: "📅" },
                      { t: "Pays via UPI / card", sub: "Razorpay — instant confirmation", icon: "💳" },
                      { t: "Gets WhatsApp reminder", sub: "24 hours before the session", icon: "💬" },
                      { t: "Receives GST invoice", sub: "Auto-generated after payment", icon: "📄" },
                    ].map((w) => (
                      <div key={w.t} className="flex items-start gap-2.5 rounded-[6px] border border-gray-100 p-2.5" style={{ background: ACU_LIGHT }}>
                        <span className="mt-0.5 text-sm">{w.icon}</span>
                        <div>
                          <div className="text-[11px] font-semibold" style={{ color: ACU_DARK }}>{w.t}</div>
                          <div className="mt-0.5 text-[10px] text-gray-400">{w.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ LOGO MARQUEE ══════ */}
      <div className="border-y border-gray-100 bg-white">
        <LogoMarquee />
      </div>

      {/* ══════ HOW IT WORKS — dark band ══════ */}
      <section id="how-it-works" className="scroll-mt-16 bg-neutral-900 px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: ACU_BLUE }}>
            How it works
          </p>
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Power exceptional client experiences
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-lg text-neutral-300">
            Everything Acuity does — plus UPI payments, GST invoices and WhatsApp reminders, built for India.
          </p>
          <div className="mt-6 flex justify-center">
            <AcuCta slot="how-it-works" label="Start for free" />
          </div>
          <HowItWorks />
        </div>
      </section>

      {/* ══════ FEATURE GRID — Acuity-style 3-col cards ══════ */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: ACU_BLUE }}>
            Features
          </p>
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ACU_DARK }}>
            Reduce no-shows. Automate tasks. Grow revenue.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm" style={{ color: ACU_BODY }}>
            Acuity's feature set — redesigned with Indian payment rails, Indian messaging, and Indian pricing.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => (
              <AccentCard
                key={feat.title}
                accent={feat.color}
                className="rounded-[6px] border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[6px]" style={{ background: `${feat.color}15` }}>
                  <feat.icon size={20} style={{ color: feat.color }} />
                </div>
                <h3 className="font-heading text-base font-bold" style={{ color: ACU_DARK }}>{feat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: ACU_BODY }}>{feat.desc}</p>
              </AccentCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ INTEGRATIONS ══════ */}
      <section id="integrations" className="scroll-mt-16 px-5 py-20 sm:px-8" style={{ background: ACU_LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
            <div className="lg:max-w-[280px]">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: ACU_BLUE }}>
                Integrations
              </p>
              <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ACU_DARK }}>
                Connect the tools India runs on
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: ACU_BODY }}>
                Google Calendar, Razorpay, WhatsApp, UPI — the tools Acuity doesn't integrate with, we do natively.
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
                    className="flex flex-col items-center gap-1.5 rounded-[6px] border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-gray-100 bg-white">
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
                  { title: "Google suite", body: "Calendar, Meet, Gmail — all connected in one click", color: ACU_BLUE },
                  { title: "UPI + payment suite", body: "Razorpay, PhonePe, Paytm — pay at booking in ₹", color: BAS_ORANGE },
                ].map((card) => (
                  <AccentCard
                    key={card.title}
                    accent={card.color}
                    className="rounded-[6px] border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-heading text-sm font-bold" style={{ color: ACU_DARK }}>{card.title}</div>
                        <div className="mt-0.5 text-xs" style={{ color: ACU_BODY }}>{card.body}</div>
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

      {/* ══════ COMPARISON TABLE ══════ */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ACU_DARK }}>
            Book A Sloth vs Acuity Scheduling
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm" style={{ color: ACU_BODY }}>
            Same scheduling power — plus the Indian toolkit Acuity can't offer.
          </p>
          <div className="mt-8 overflow-hidden rounded-[6px] border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Feature</th>
                    <th className="px-5 py-4 font-heading text-sm font-bold" style={{ background: BAS_PEACH, color: BAS_CTA }}>
                      Book A Sloth 🇮🇳
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold" style={{ color: ACU_BLUE }}>Acuity</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row, i) => (
                    <tr key={row.f} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 ? "#FFFBF8" : "white" }}>
                      <th scope="row" className="px-5 py-3 text-sm font-medium" style={{ color: ACU_DARK }}>{row.f}</th>
                      <td className="px-5 py-3" style={{ background: i % 2 ? "#FFE3D2" : BAS_PEACH }}>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BAS_CTA }}>
                          <Check size={14} /> {row.basT}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-sm ${row.a ? "text-gray-600" : "text-gray-400"}`}>
                          {row.a ? <Check size={14} className="text-gray-400" /> : <X size={14} className="text-gray-300" />}
                          {row.aT}
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
                      <div className="font-heading text-sm font-extrabold leading-snug sm:text-base" style={{ color: ACU_DARK }}>
                        Say Yes to<br />Book A Sloth.
                      </div>
                      <p className="mt-1 hidden text-xs sm:block" style={{ color: ACU_BODY }}>
                        Built for India. Paid in ₹ from day one.
                      </p>
                      <div className="mt-3 sm:max-w-[220px]">
                        <AcuCta slot="compare-yes" label="Sign up with Google" variant="google" />
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top sm:px-5">
                      <div className="font-heading text-sm font-bold leading-snug text-gray-400 line-through sm:text-base">
                        Say No to Acuity.
                      </div>
                      <p className="mt-1 hidden text-xs text-gray-400 sm:block">
                        USD billing. No UPI. No GST. No WhatsApp.
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-[6px] border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-300">
                        <X size={13} /> No thanks
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            Acuity Emerging ~US$16/mo, Growing ~US$27/mo, billed in USD, as of Jul 2026. Owned by Squarespace.
          </p>
        </div>
      </section>

      {/* ══════ INDUSTRY TABS — Acuity-style tab selector ══════ */}
      <section className="px-5 py-20 sm:px-8" style={{ background: ACU_LIGHT }}>
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: ACU_BLUE }}>
            Your industry
          </p>
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ACU_DARK }}>
            Built for every profession Acuity serves — and more
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm" style={{ color: ACU_BODY }}>
            Acuity targets Beauty, Business, Wellness, Fitness, Arts, Education. So do we — with Indian payment rails baked in.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {INDUSTRIES.map((ind, i) => (
              <button
                key={ind.name}
                type="button"
                onClick={() => setActiveIndustry(i)}
                className="rounded-full border px-4 py-2 text-sm font-semibold transition"
                style={{
                  background: activeIndustry === i ? ACU_BLUE : "white",
                  color: activeIndustry === i ? "white" : ACU_DARK,
                  borderColor: activeIndustry === i ? ACU_BLUE : "#E5E7EB",
                }}
              >
                {ind.emoji} {ind.name}
              </button>
            ))}
          </div>

          <AccentCard
            accent={ACU_BLUE}
            className="mx-auto mt-8 max-w-2xl rounded-[6px] border border-gray-200 bg-white p-8 shadow-sm"
          >
            <div className="text-center">
              <span className="text-4xl">{INDUSTRIES[activeIndustry].emoji}</span>
              <h3 className="mt-3 font-heading text-xl font-bold" style={{ color: ACU_DARK }}>
                {INDUSTRIES[activeIndustry].name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: ACU_BODY }}>
                {INDUSTRIES[activeIndustry].desc}
              </p>
              <div className="mt-5">
                <AcuCta slot={`industry-${activeIndustry}`} label="Get started for free" />
              </div>
            </div>
          </AccentCard>
        </div>
      </section>

      {/* ══════ PRICING ══════ */}
      <section id="pricing" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: ACU_DARK }}>
            Pricing that makes sense in India
          </h2>
          <p className="mt-2 text-center" style={{ color: ACU_BODY }}>
            Acuity starts at ~₹1,350/mo (USD). We start at ₹0. All plans billed in ₹, GST included.
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
                  className={`flex h-full flex-col rounded-[6px] border bg-white p-7 transition hover:-translate-y-1 ${
                    highlight ? "shadow-[0_24px_60px_-30px_rgba(254,81,0,0.45)]" : "shadow-[0_8px_30px_rgba(26,26,26,0.05)]"
                  }`}
                  style={{ borderColor: highlight ? BAS_ORANGE : "#E5E7EB" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-lg font-bold" style={{ color: ACU_DARK }}>{plan.name}</span>
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
                    <span className="text-4xl font-extrabold" style={{ color: ACU_DARK }}>{big}</span>
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

                  <AcuCta
                    slot={`pricing-${plan.name}`}
                    label={isFree ? "Start for Free" : "Get Started Now"}
                    className="mt-5 w-full !justify-center"
                  />

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={14} className="mt-0.5 shrink-0" style={{ color: accent }} />
                        <span style={{ color: ACU_BODY }}>{f}</span>
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
      <section className="px-5 py-20 sm:px-8" style={{ background: ACU_LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ACU_DARK }}>
            Indian Professionals Who Switched to Book A Sloth
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-sm" style={{ color: ACU_BODY }}>
            Coaches, doctors, architects, freelancers — real professionals who replaced the
            back-and-forth with one booking link.
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
                  <span className="font-heading text-3xl font-extrabold leading-none" style={{ color: accent }} aria-hidden>&ldquo;</span>
                  <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: ACU_DARK }}>{t.quote}</p>
                  <div className="mt-5 flex items-center gap-2.5">
                    <Avatar src={t.avatar} name={t.name} accent={accent} />
                    <div>
                      <div className="text-xs font-bold" style={{ color: ACU_DARK }}>{t.name}</div>
                      <div className="text-[11px]" style={{ color: ACU_BODY }}>{t.role}</div>
                    </div>
                  </div>
                </AccentCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ FAQ ══════ */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ACU_DARK }}>
            Switching from Acuity? Common questions.
          </h2>
          <div className="mt-10 divide-y divide-gray-100">
            {FAQ.map((item, i) => (
              <div key={item.q} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="pr-4 font-heading text-sm font-bold sm:text-base" style={{ color: ACU_DARK }}>{item.q}</span>
                  <ChevronRight
                    size={16}
                    className="shrink-0 transition-transform"
                    style={{ color: ACU_BLUE, transform: openFaq === i ? "rotate(90deg)" : "rotate(0deg)" }}
                  />
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: ACU_BODY }}>
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA — dark section ══════ */}
      <section className="px-5 py-20 sm:px-8" style={{ background: ACU_DARK }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Ditch the USD billing.
            <br />
            <span style={{ color: BAS_ORANGE }}>Start collecting ₹ today.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-neutral-300">
            Free to start. UPI payments from day one. No credit card. No Squarespace lock-in.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-full max-w-xs">
              <AcuCta slot="final-google" label="Sign up with Google" variant="google" />
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

      {/* ══════ FOOTER ══════ */}
      <footer className="border-t border-gray-100 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-xs text-gray-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Book A Sloth &mdash; The Acuity Scheduling alternative built for India</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = ACU_DARK; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              Privacy
            </Link>
            <Link to="/help" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = ACU_DARK; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              Help
            </Link>
            <a href="mailto:bolt@bookasloth.in" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = ACU_DARK; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              bolt@bookasloth.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AcuityAlternative;

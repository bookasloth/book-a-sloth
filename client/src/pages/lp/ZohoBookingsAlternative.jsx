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
  Zap,
  Users,
  Puzzle,
  Bot,
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
  /lp/zoho-bookings-alternative
  Zoho-inspired corporate grid layout + Book A Sloth brand CTAs.
  Copy: "Enterprise scheduling is overkill — you just need bookings that work."
*/

const SLUG = "zoho-bookings-alternative";

/* Palette — Zoho brand accents + BAS brand */
const ZOHO_RED = "#E42527";
const ZOHO_BLUE = "#1F76DB";
const ZOHO_NAVY = "#1A1A2E";
const ZOHO_BODY = "#4B5563";
const ZOHO_LIGHT = "#FFF5F5"; // red-tinted section bg
const ZOHO_NEUTRAL = "#F8FAFC"; // neutral section bg

const ACCENTS = [ZOHO_RED, BAS_ORANGE, ZOHO_BLUE, "#059669", "#db2777", "#0891b2", "#2563eb", "#f59e0b"];


/* ─── CTA Button ─── */
const ZohoCta = (p) => <LpCta slug={SLUG} {...p} />;

/* ─── AccentCard ─── */
const AccentCard = (p) => <KitAccentCard accent={ZOHO_RED} {...p} />;

/* ─── Avatar ─── */
const Avatar = (p) => <KitAvatar accent={ZOHO_RED} {...p} />;

/* ─── Hero product visual ─── */
const HERO_IMG = "https://company-assets.bookasloth.in/images/lp/zoho-bookings-alternative-hero.png";

function HeroBookingMock() {
  return (
    <div className="rounded-[6px] border border-white/30 bg-white p-5 shadow-[0_24px_80px_-8px_rgba(0,0,0,0.3)]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: BAS_ORANGE }}>Your booking page</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: BAS_ORANGE }}>✓</span>
      </div>
      <div className="mb-3 font-heading text-sm font-bold" style={{ color: ZOHO_NAVY }}>Simple. No workspaces needed.</div>
      <div className="space-y-2">
        {[
          { t: "Client books a session", sub: "Picks date, time & pays via UPI", tag: "1 step" },
          { t: "You get notified instantly", sub: "WhatsApp + email confirmation", tag: "Auto" },
          { t: "Google Calendar syncs", sub: "Meet link auto-created", tag: "Auto" },
        ].map((w) => (
          <div key={w.t} className="rounded-[6px] border border-gray-100 p-2.5" style={{ background: ZOHO_NEUTRAL }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: ZOHO_NAVY }}>{w.t}</span>
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: BAS_PEACH, color: BAS_CTA }}>{w.tag}</span>
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
          background: `linear-gradient(135deg, ${ZOHO_RED} 0%, ${BAS_ORANGE} 45%, ${ZOHO_BLUE} 100%)`,
          borderRadius: "40% 60% 55% 45% / 55% 40% 60% 45%",
          transform: "scale(1.08)",
        }}
      />
      {imgOk ? (
        <img
          src={HERO_IMG}
          alt="Book A Sloth — simple bookings without enterprise overhead"
          onError={() => setImgOk(false)}
          className="w-full rounded-[6px] border border-white/30 bg-white shadow-[0_24px_80px_-8px_rgba(0,0,0,0.3)]"
        />
      ) : (
        <HeroBookingMock />
      )}
    </div>
  );
}

/* ─── Data ─── */
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
  { f: "Setup time", basT: "Under 5 minutes", zT: "Hours (workspaces, event types, workflows)", z: false },
  { f: "Built for solo creators", basT: "Yes", zT: "No — team/enterprise focus", z: false },
  { f: "UPI payments at booking", basT: "Built in", zT: "Via Razorpay add-on", z: "partial" },
  { f: "GST invoices — automatic", basT: "Yes", zT: "No", z: false },
  { f: "WhatsApp reminders", basT: "Yes", zT: "Via Zoho ecosystem", z: "partial" },
  { f: "Starting price (solo)", basT: "₹0 free · ₹399/mo paid", zT: "Free (limited) then ₹per user", z: "partial" },
  { f: "No ecosystem lock-in", basT: "Yes — standalone", zT: "Best with Zoho CRM, Mail, etc.", z: false },
  { f: "Google Calendar sync", basT: "Yes", zT: "Yes", z: true },
  { f: "Google Meet links", basT: "Yes", zT: "Yes", z: true },
  { f: "Custom booking page", basT: "Yes", zT: "Yes", z: true },
  { f: "Email reminders", basT: "Yes", zT: "Yes", z: true },
  { f: "Razorpay payments", basT: "Yes", zT: "Yes", z: true },
];

const FAQS = [
  {
    q: "Does Zoho Bookings support Razorpay?",
    a: "Yes, Zoho Bookings does integrate with Razorpay. The difference is that Book A Sloth has Razorpay built into the core — UPI, cards, and wallets work out of the box with zero configuration. With Zoho, you need to connect your Razorpay account through settings and manage the integration separately.",
  },
  {
    q: "I'm already using Zoho CRM. Should I switch?",
    a: "If you rely heavily on the Zoho ecosystem (CRM, Mail, Invoice, etc.), Zoho Bookings makes sense as part of that suite. But if you're a solo professional who just needs a booking page with payments, Book A Sloth is simpler and cheaper than paying for the full Zoho stack.",
  },
  {
    q: "Can I migrate my booking data from Zoho?",
    a: "There's no automated import yet, but our support team will help you get set up. Most solo professionals can recreate their services in under 10 minutes since Book A Sloth doesn't require complex workspace or event-type configuration.",
  },
  {
    q: "Does Book A Sloth have group bookings like Zoho?",
    a: "Not yet. If you need multi-person group bookings, collective scheduling, or resource-based events, Zoho's enterprise features are more comprehensive. Book A Sloth focuses on one-on-one sessions — the core use case for freelancers, tutors, coaches, and consultants.",
  },
  {
    q: "What about Zoho's AI scheduling features?",
    a: "Zoho's AI features are designed for enterprise teams managing complex multi-person calendars. If you're a solo creator, you don't need AI to find a meeting time — you need a clean booking page where clients pick a slot and pay. That's what we do best.",
  },
  {
    q: "Is Book A Sloth really free to start?",
    a: "Yes. The Sloth plan is free forever — no 15-day trial, no credit card required. You get a booking page, Google Calendar sync, and can accept 2 free services. Sloth Active is ₹399/month (₹3,599/year) for 0% commission.",
  },
];

/* ════════════════════════════════════════
   PAGE
   ════════════════════════════════════════ */
const ZohoBookingsAlternative = () => {
  const feeOnly = useFeeOnly();
  const plans = feeOnly ? ALL_PLANS.filter((p) => p.monthly !== 0) : ALL_PLANS;
  const utm = useUtm();
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useDocumentMeta({
    title: "Book A Sloth — Zoho Bookings alternative for Indian creators",
    description:
      "Zoho Bookings is built for enterprises. Book A Sloth is built for you — simple scheduling with UPI payments, GST invoices & WhatsApp reminders free to start.",
  });

  useEffect(() => {
    analytics.page({ lp: SLUG });
    analytics.track(EVENTS.LP_VIEWED, { slug: SLUG, ...utm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-dvh overflow-x-hidden bg-white"
      style={{ fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif", color: ZOHO_NAVY }}
    >
      <Seo
        title="The Best Zoho Bookings Alternative for Creators — Book A Sloth"
        description="Looking for a Zoho Bookings alternative? Book A Sloth offers simple scheduling with UPI payments, GST invoices, and WhatsApp reminders — built for Indian professionals."
        image={ogCard('lp-zoho-bookings-alternative')}
        canonical={`${SITE_URL}/lp/zoho-bookings-alternative`}
      />

      {/* ══════ HEADER ══════ */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur" style={{ borderColor: `${ZOHO_RED}15` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="font-heading text-base font-extrabold tracking-tight" style={{ color: ZOHO_NAVY }}>
              Book A Sloth
            </span>
            <span
              className="hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline"
              style={{ background: ZOHO_LIGHT, color: ZOHO_RED }}
            >
              vs Zoho Bookings
            </span>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" style={{ color: "#6B7280" }}>
            {[["#how-it-works", "Product"], ["#compare", "Compare"], ["#pricing", "Pricing"], ["#faq", "FAQ"]].map(([href, label]) => (
              <a
                key={label}
                href={href}
                className="transition-colors hover:no-underline"
                style={{ color: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = ZOHO_NAVY; }}
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
            <ZohoCta slot="header" label="Get started" className="!py-2 !px-4 !text-[13px]" />
          </div>
        </div>
      </header>

      {/* ══════ HERO ══════ */}
      <section className="overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pt-20" style={{ background: `linear-gradient(180deg, ${ZOHO_LIGHT} 0%, white 100%)` }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: `${ZOHO_RED}30`, color: ZOHO_RED, background: `${ZOHO_RED}08` }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ZOHO_RED }} />
              Zoho Bookings Alternative
            </div>
            <h1
              className="font-heading text-[2.4rem] font-extrabold leading-[1.08] tracking-tight sm:text-[3.2rem]"
              style={{ color: ZOHO_NAVY }}
            >
              Enterprise scheduling is overkill.
              <br />
              <span style={{ color: BAS_ORANGE }}>You just need bookings that work.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed" style={{ color: ZOHO_BODY }}>
              Zoho Bookings has workspaces, event types, collective scheduling, and 75+ integrations.
              You need a booking link that collects payments. We built that.
            </p>

            <div id="start" className="mt-8 max-w-xs scroll-mt-24">
              <ZohoCta slot="hero-google" label="Sign up with Google" variant="google" />
              <p className="mt-2.5 text-xs text-gray-400">Free forever plan · No 15-day trial</p>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-6">
              {[
                { e: "🇮🇳", t: "Built for India" },
                { e: "💳", t: "UPI + cards at booking" },
                { e: "📄", t: "GST invoices" },
                { e: "💬", t: "WhatsApp reminders" },
              ].map((b) => (
                <li key={b.t} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: ZOHO_BODY }}>
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
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: ZOHO_RED }}>
            How it works
          </p>
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            3 steps. No workspaces. No training.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-lg text-neutral-300">
            While Zoho needs workspace setup, event-type configuration, and workflow builders — you just sign up and share your link.
          </p>
          <div className="mt-6 flex justify-center">
            <ZohoCta slot="how-it-works" label="Start for free" />
          </div>
          <HowItWorks />
        </div>
      </section>

      {/* ══════ "ZOHO IS BUILT FOR ENTERPRISES" ══════ */}
      <section className="px-5 py-20 sm:px-8" style={{ background: ZOHO_NEUTRAL }}>
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: ZOHO_RED }}>
            The honest truth
          </p>
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ZOHO_NAVY }}>
            Zoho Bookings is powerful. Too powerful for you.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm" style={{ color: ZOHO_BODY }}>
            Built for enterprises with 50-person teams. Here&apos;s what you don&apos;t need.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Users,
                color: ZOHO_RED,
                h: "You don't need workspaces",
                b: "Zoho lets you create multiple workspaces with separate staff, services, and calendars. You're one person. You need one booking page.",
                vs: "BAS: One link. Share it. Done.",
              },
              {
                icon: Puzzle,
                color: ZOHO_BLUE,
                h: "You don't need 75 integrations",
                b: "Zoho connects to 75+ tools and works best inside the Zoho ecosystem (CRM, Mail, Invoice). You need Google Calendar and a payment gateway.",
                vs: "BAS: Google + Razorpay. Built in.",
              },
              {
                icon: Bot,
                color: BAS_ORANGE,
                h: "You don't need AI scheduling",
                b: "Zoho's AI finds optimal meeting times across teams and time zones. Your clients just need to pick a slot from your availability.",
                vs: "BAS: Clean calendar. Clients pick & pay.",
              },
            ].map((card) => (
              <AccentCard
                key={card.h}
                accent={card.color}
                className="flex flex-col rounded-[6px] border border-gray-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[6px]" style={{ background: `${card.color}12` }}>
                  <card.icon size={20} style={{ color: card.color }} />
                </div>
                <h3 className="font-heading text-lg font-bold" style={{ color: ZOHO_NAVY }}>{card.h}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: ZOHO_BODY }}>{card.b}</p>
                <p className="mt-4 rounded-[6px] px-3 py-2 text-xs font-semibold" style={{ background: BAS_PEACH, color: BAS_CTA }}>
                  {card.vs}
                </p>
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
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: ZOHO_RED }}>
                Integrations
              </p>
              <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ZOHO_NAVY }}>
                The tools you actually use
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: ZOHO_BODY }}>
                Zoho offers 75+ integrations. We focus on the ones Indian professionals actually need — Google, Razorpay, WhatsApp, UPI.
              </p>
              <a
                href="#start"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold transition-opacity hover:no-underline hover:opacity-80"
                style={{ color: BAS_CTA }}
              >
                Get started free <ChevronRight size={15} />
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
                  { title: "No ecosystem lock-in", body: "Works standalone — no Zoho CRM, Zoho Mail, or Zoho One required", color: ZOHO_RED },
                  { title: "India-first payments", body: "UPI, Razorpay, PhonePe, Paytm — clients pay in ₹ at booking", color: BAS_ORANGE },
                ].map((card) => (
                  <AccentCard
                    key={card.title}
                    accent={card.color}
                    className="rounded-[6px] border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-heading text-sm font-bold" style={{ color: ZOHO_NAVY }}>{card.title}</div>
                        <div className="mt-0.5 text-xs" style={{ color: ZOHO_BODY }}>{card.body}</div>
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
      <section id="compare" className="scroll-mt-16 px-5 py-16 sm:px-8" style={{ background: ZOHO_LIGHT }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ZOHO_NAVY }}>
            Book A Sloth vs Zoho Bookings
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm" style={{ color: ZOHO_BODY }}>
            An honest comparison. Zoho is great for enterprises — we&apos;re great for you.
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
                    <th className="px-5 py-4 text-sm font-semibold" style={{ color: ZOHO_RED }}>Zoho Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row, i) => (
                    <tr key={row.f} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 ? "#FFFBF8" : "white" }}>
                      <th scope="row" className="px-5 py-3 text-sm font-medium" style={{ color: ZOHO_NAVY }}>{row.f}</th>
                      <td className="px-5 py-3" style={{ background: i % 2 ? "#FFE3D2" : BAS_PEACH }}>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BAS_CTA }}>
                          <Check size={14} /> {row.basT}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-sm ${row.z === true ? "text-gray-600" : row.z === "partial" ? "text-amber-600" : "text-gray-400"}`}>
                          {row.z === true ? (
                            <Check size={14} className="text-gray-400" />
                          ) : row.z === "partial" ? (
                            <span className="text-[10px]">~</span>
                          ) : (
                            <X size={14} className="text-gray-300" />
                          )}
                          {row.zT}
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
                      <div className="font-heading text-sm font-extrabold leading-snug sm:text-base" style={{ color: ZOHO_NAVY }}>
                        Simple &amp; effective.<br />Book A Sloth.
                      </div>
                      <p className="mt-1 hidden text-xs sm:block" style={{ color: ZOHO_BODY }}>
                        Built for creators. Paid in ₹.
                      </p>
                      <div className="mt-3 sm:max-w-[220px]">
                        <ZohoCta slot="compare-yes" label="Sign up with Google" variant="google" />
                      </div>
                    </td>
                    <td className="px-4 py-5 align-top sm:px-5">
                      <div className="font-heading text-sm font-bold leading-snug text-gray-400 sm:text-base">
                        Great for enterprises.
                      </div>
                      <p className="mt-1 hidden text-xs text-gray-400 sm:block">
                        Overkill for solo professionals.
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-[6px] border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-300">
                        Enterprise-grade
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            Zoho Bookings pricing varies by plan and user count. Comparison as of Jul 2026.
          </p>
        </div>
      </section>

      {/* ══════ PRICING ══════ */}
      <section id="pricing" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: ZOHO_NAVY }}>
            Simple pricing. No per-user fees.
          </h2>
          <p className="mt-2 text-center" style={{ color: ZOHO_BODY }}>
            Zoho charges per user. We charge per plan — one price, everything included, billed in ₹.
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
                ? "Free forever — no 15-day trial"
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
                    <span className="font-heading text-lg font-bold" style={{ color: ZOHO_NAVY }}>{plan.name}</span>
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
                    <span className="text-4xl font-extrabold" style={{ color: ZOHO_NAVY }}>{big}</span>
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

                  <ZohoCta
                    slot={`pricing-${plan.name}`}
                    label={isFree ? "Start for Free" : "Get Started Now"}
                    className="mt-5 w-full !justify-center"
                  />

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={14} className="mt-0.5 shrink-0" style={{ color: accent }} />
                        <span style={{ color: ZOHO_BODY }}>{f}</span>
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
      <section className="px-5 py-20 sm:px-8" style={{ background: ZOHO_NEUTRAL }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ZOHO_NAVY }}>
            Indian Professionals Who Chose Simplicity
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-sm" style={{ color: ZOHO_BODY }}>
            Coaches, consultants, tutors, freelancers — real creators who ditched the enterprise overhead.
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
                  <span className="font-heading text-3xl font-extrabold leading-none" style={{ color: accent }} aria-hidden>"</span>
                  <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: ZOHO_NAVY }}>{t.quote}</p>
                  <div className="mt-5 flex items-center gap-2.5">
                    <Avatar src={t.avatar} name={t.name} accent={accent} />
                    <div>
                      <div className="text-xs font-bold" style={{ color: ZOHO_NAVY }}>{t.name}</div>
                      <div className="text-[11px]" style={{ color: ZOHO_BODY }}>{t.role}</div>
                    </div>
                  </div>
                </AccentCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ FAQ ══════ */}
      <section id="faq" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: ZOHO_NAVY }}>
            Switching from Zoho? Questions answered.
          </h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={faq.q} className="rounded-[6px] border border-gray-200 bg-white transition-shadow hover:shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left"
                  >
                    <span className="pr-4 text-sm font-semibold" style={{ color: ZOHO_NAVY }}>{faq.q}</span>
                    <ChevronRight
                      size={16}
                      className="shrink-0 transition-transform duration-200"
                      style={{ color: ZOHO_BODY, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 pb-4 pt-3">
                      <p className="text-sm leading-relaxed" style={{ color: ZOHO_BODY }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="px-5 py-20 sm:px-8" style={{ background: ZOHO_NAVY }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Built for creators,
            <br />
            <span style={{ color: BAS_ORANGE }}>not corporations.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-neutral-300">
            Free to start. UPI payments from day one. No 15-day trial, no ecosystem lock-in.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-full max-w-xs">
              <ZohoCta slot="final-google" label="Sign up with Google" variant="google" />
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
          <p>© {new Date().getFullYear()} Book A Sloth — The Zoho Bookings alternative for Indian creators</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = ZOHO_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              Privacy
            </Link>
            <Link to="/help" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = ZOHO_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              Help
            </Link>
            <a href="mailto:bolt@bookasloth.in" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = ZOHO_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              bolt@bookasloth.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ZohoBookingsAlternative;

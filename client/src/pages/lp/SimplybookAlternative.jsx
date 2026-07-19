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
  Clock,
  Eye,
  Settings,
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
import { TESTIMONIALS } from "../../data/testimonials";
import { LpCta, AccentCard as KitAccentCard, Avatar as KitAvatar, fmtINR, BAS_ORANGE, BAS_CTA, BAS_PEACH } from "./_altKit";

/*
  /lp/simplybook-alternative
  Mimics SimplyBook.me's design language — their blue palette, gradient cards,
  rounded icon containers — but positions Book A Sloth as the simpler,
  India-native alternative. "100 features you'll never use vs the 10 that matter."
*/

const SLUG = "simplybook-alternative";

/* SimplyBook-inspired palette + BAS brand */
const SB_BLUE = "#3E7BFA"; // SimplyBook primary blue
const SB_NAVY = "#1A1F36"; // SimplyBook dark heading ink
const SB_BODY = "#475569"; // muted slate body text
const SB_LIGHT = "#EEF2FF"; // SimplyBook light blue tinted bg
const SB_GREEN = "#10B981"; // SimplyBook accent green (confirmations)

const ACCENTS = [SB_BLUE, BAS_ORANGE, "#5E3AD4", "#059669", "#db2777", "#0891b2", "#2563eb", "#f59e0b"];


/* ─────────────────────────────────────────────
   CTA
   ───────────────────────────────────────────── */
const SbCta = (p) => <LpCta slug={SLUG} {...p} />;

/* ─────────────────────────────────────────────
   AccentCard — SimplyBook-style gradient bloom on hover
   ───────────────────────────────────────────── */
const AccentCard = (p) => <KitAccentCard accent={SB_BLUE} {...p} />;

/* Avatar with initials fallback */
const Avatar = (p) => <KitAvatar accent={SB_BLUE} fallback="S" {...p} />;

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

const PAIN_POINTS = [
  {
    icon: Eye,
    color: SB_BLUE,
    title: "Opaque pricing",
    body: "SimplyBook hides real costs behind a 14-day trial and complex add-on modules. You don't know what you'll pay until you're already invested.",
    bas: "BAS shows every plan, every price, upfront. In rupees.",
  },
  {
    icon: Settings,
    color: "#8B5CF6",
    title: "Complex setup",
    body: "\"Full customization step-by-step\" sounds great until you're 45 minutes into configuration wizards for features you'll never use.",
    bas: "BAS: sign in with Google, set your availability, share your link. Done in 3 minutes.",
  },
  {
    icon: IndianRupee,
    color: "#059669",
    title: "No India payments",
    body: "No UPI. No Razorpay. No GST invoices. SimplyBook was built for Western markets — Indian clients can't pay the way they want to.",
    bas: "BAS collects UPI/cards at booking time, settled to your Indian bank account.",
  },
  {
    icon: Clock,
    color: BAS_ORANGE,
    title: "24/5 support + trial pressure",
    body: "Support vanishes on weekends. And the 14-day trial clock starts ticking the moment you sign up — convert or lose everything.",
    bas: "BAS has a free plan forever. No trial. No pressure. No deadline.",
  },
];

const COMPARE = [
  { f: "Upfront pricing (no trial wall)", basT: "Yes", sbT: "No — 14-day trial first", sb: false },
  { f: "UPI / Razorpay payments at booking", basT: "Built in", sbT: "No", sb: false },
  { f: "GST invoices — automatic", basT: "Yes", sbT: "No", sb: false },
  { f: "WhatsApp reminders", basT: "Yes", sbT: "No", sb: false },
  { f: "INR billing (₹)", basT: "Yes", sbT: "USD / EUR only", sb: false },
  { f: "Setup time", basT: "~3 minutes", sbT: "30-60 minutes", sb: false },
  { f: "0% commission on paid plans", basT: "Yes", sbT: "Varies by plan", sb: false },
  { f: "Starting price (paid)", basT: "₹229/mo", sbT: "~₹700/mo (USD)", sb: false },
  { f: "Google Calendar sync", basT: "Yes", sbT: "Yes", sb: true },
  { f: "Custom booking page", basT: "Yes", sbT: "Yes", sb: true },
  { f: "Email reminders", basT: "Yes", sbT: "Yes", sb: true },
  { f: "Online payments (intl.)", basT: "Yes", sbT: "Yes", sb: true },
  { f: "Free plan", basT: "Yes (forever)", sbT: "No — trial only", sb: false },
];

const FAQS = [
  {
    q: "Can I migrate my bookings from SimplyBook.me to Book A Sloth?",
    a: "Yes. Export your client list from SimplyBook.me and share it with us — we'll help you get set up with your existing client base. Your booking link will be live in minutes.",
  },
  {
    q: "Does Book A Sloth support the same payment methods as SimplyBook?",
    a: "We support more payment methods for India — UPI, all major cards, Razorpay, PhonePe, Paytm, and net banking. For international clients, we support cards and wallets via Razorpay.",
  },
  {
    q: "SimplyBook has 100+ features. Will I miss anything?",
    a: "Most professionals use fewer than 10 features regularly. Book A Sloth focuses on the features that actually matter — scheduling, payments, reminders, and a professional booking page. No feature bloat, no module add-ons.",
  },
  {
    q: "Is Book A Sloth really free to start?",
    a: "Yes. Our Starter plan is free forever — not a 14-day trial. You get a booking page, Google Calendar sync, and email reminders at no cost. Upgrade only when you need payments or WhatsApp reminders.",
  },
  {
    q: "How does pricing compare to SimplyBook.me?",
    a: "SimplyBook's Basic plan starts at ~$8.25/month (billed in USD). Book A Sloth's paid plan starts at ₹229/month (billed in INR), includes UPI payments and GST invoices — features SimplyBook charges extra for or doesn't offer at all.",
  },
  {
    q: "Do you support multi-channel booking like SimplyBook?",
    a: "Yes. Clients can book via your personal booking page link, which you can share on Instagram, WhatsApp, your website, Google Business — anywhere. No complex widget embeds needed.",
  },
];

/* ════════════════════════════════════════
   PAGE
   ════════════════════════════════════════ */
const SimplybookAlternative = () => {
  const utm = useUtm();
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useDocumentMeta({
    title: "Book A Sloth — SimplyBook.me alternative built for India",
    description:
      "SimplyBook.me has 100 features you'll never use. Book A Sloth has the 10 that matter — UPI payments, WhatsApp reminders, GST invoices — at a price you can actually see upfront.",
  });

  useEffect(() => {
    analytics.page({ lp: SLUG });
    analytics.track(EVENTS.LP_VIEWED, { slug: SLUG, ...utm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-dvh overflow-x-hidden bg-white"
      style={{ fontFamily: "'Poppins', ui-sans-serif, system-ui, sans-serif", color: SB_NAVY }}
    >
      <Seo
        title="Best SimplyBook.me Alternative for India — Book A Sloth"
        description="Looking for a SimplyBook.me alternative? Book A Sloth gives you UPI payments, WhatsApp reminders, and GST invoices — with pricing you can actually see upfront."
        image={ogCard('lp-simplybook-alternative')}
        canonical={`${SITE_URL}/lp/simplybook-alternative`}
      />

      {/* ══════ HEADER ══════ */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur" style={{ borderColor: `${SB_BLUE}15` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="font-heading text-base font-extrabold tracking-tight" style={{ color: SB_NAVY }}>
              Book A Sloth
            </span>
            <span
              className="hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline"
              style={{ background: BAS_PEACH, color: BAS_CTA }}
            >
              Built for India
            </span>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium md:flex" style={{ color: "#6B7280" }}>
            {[["#how-it-works", "Product"], ["#integrations", "Integrations"], ["#pricing", "Pricing"], ["#faq", "FAQ"]].map(([href, label]) => (
              <a
                key={label}
                href={href}
                className="transition-colors hover:no-underline"
                style={{ color: "inherit" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = SB_NAVY; }}
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
            <SbCta slot="header" label="Get started" className="!py-2 !px-4 !text-[13px]" />
          </div>
        </div>
      </header>

      {/* ══════ HERO — SimplyBook-style gradient bg ══════ */}
      <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pt-20" style={{ background: `linear-gradient(165deg, ${SB_LIGHT} 0%, white 50%, ${SB_LIGHT} 100%)` }}>
        {/* Decorative gradient blob */}
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${SB_BLUE}, transparent 70%)` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-15 blur-3xl"
          style={{ background: `radial-gradient(circle, ${BAS_ORANGE}, transparent 70%)` }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl text-center">
          <div className="mx-auto max-w-3xl">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold"
              style={{ borderColor: `${SB_BLUE}30`, background: `${SB_BLUE}08`, color: SB_BLUE }}
            >
              <Zap size={13} /> SimplyBook.me alternative
            </div>

            <h1
              className="font-heading text-[2.4rem] font-extrabold leading-[1.08] tracking-tight sm:text-[3.2rem]"
              style={{ color: SB_NAVY }}
            >
              Simple scheduling.
              <br />
              No gimmicks.{" "}
              <span style={{ color: BAS_ORANGE }}>Just bookings that work.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed" style={{ color: SB_BODY }}>
              SimplyBook.me has 100 features you&apos;ll never use. Book A Sloth has the 10 that
              matter — payments in ₹, WhatsApp reminders, GST invoices — at a price you can
              actually see upfront.
            </p>

            <div id="start" className="mt-8 flex flex-col items-center gap-3 scroll-mt-24">
              <div className="w-full max-w-xs">
                <SbCta slot="hero-google" label="Sign up with Google" variant="google" />
              </div>
              <p className="text-xs text-gray-400">Free plan forever · No credit card · No 14-day trial</p>
            </div>

            {/* Feature pills */}
            <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-gray-100 pt-6">
              {[
                { e: "₹", t: "UPI + cards" },
                { e: "💬", t: "WhatsApp reminders" },
                { e: "📄", t: "GST invoices" },
                { e: "⚡", t: "3-min setup" },
              ].map((b) => (
                <li key={b.t} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: SB_BODY }}>
                  {b.e} {b.t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════ LOGO MARQUEE ══════ */}
      <div className="border-y border-gray-100 bg-white">
        <LogoMarquee />
      </div>

      {/* ══════ HOW IT WORKS — dark band ══════ */}
      <section id="how-it-works" className="scroll-mt-16 px-5 py-20 sm:px-8 lg:py-24" style={{ background: SB_NAVY }}>
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: SB_BLUE }}>
            How it works
          </p>
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Set up in 3 minutes, not 30
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-lg text-neutral-300">
            No configuration wizards. No module add-ons. Sign in, set your availability, share your link.
          </p>
          <div className="mt-6 flex justify-center">
            <SbCta slot="how-it-works" label="Sign up for free" />
          </div>
          <HowItWorks />
        </div>
      </section>

      {/* ══════ WHY NOT SIMPLYBOOK — pain point cards ══════ */}
      <section className="px-5 py-20 sm:px-8" style={{ background: SB_LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: SB_BLUE }}>
            Why switch?
          </p>
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: SB_NAVY }}>
            SimplyBook.me wasn&apos;t built for India
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm" style={{ color: SB_BODY }}>
            Great for European salons. Not so great when your clients pay via UPI and read WhatsApp, not email.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {PAIN_POINTS.map((p) => (
              <AccentCard
                key={p.title}
                accent={p.color}
                className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: `${p.color}14` }}
                >
                  <p.icon size={20} style={{ color: p.color }} />
                </div>
                <h3 className="font-heading text-base font-bold" style={{ color: SB_NAVY }}>{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: SB_BODY }}>{p.body}</p>
                <div
                  className="mt-4 rounded-lg border-l-[3px] py-2 pl-3 text-xs font-semibold"
                  style={{ borderColor: SB_GREEN, background: `${SB_GREEN}08`, color: "#065F46" }}
                >
                  <Check size={12} className="mb-0.5 mr-1 inline" style={{ color: SB_GREEN }} />
                  {p.bas}
                </div>
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
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: SB_BLUE }}>
                Integrations
              </p>
              <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: SB_NAVY }}>
                Connect the tools you already use
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: SB_BODY }}>
                Google Calendar, Razorpay, WhatsApp, UPI — no complex widget embeds or API keys needed.
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
                  { title: "India payment suite", body: "Razorpay, UPI, PhonePe, Paytm — clients pay at booking in ₹", color: BAS_ORANGE },
                  { title: "Google suite", body: "Calendar, Meet, Gmail — all connected in one click", color: SB_BLUE },
                ].map((card) => (
                  <AccentCard
                    key={card.title}
                    accent={card.color}
                    className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-heading text-sm font-bold" style={{ color: SB_NAVY }}>{card.title}</div>
                        <div className="mt-0.5 text-xs" style={{ color: SB_BODY }}>{card.body}</div>
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
      <section className="px-5 py-16 sm:px-8" style={{ background: SB_LIGHT }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: SB_NAVY }}>
            Book A Sloth vs SimplyBook.me
          </h2>
          <p className="mx-auto mt-2 max-w-md text-center text-sm" style={{ color: SB_BODY }}>
            The features that matter for Indian professionals — side by side.
          </p>
          <div className="mt-8 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Feature</th>
                  <th className="px-5 py-4 font-heading text-sm font-bold" style={{ background: BAS_PEACH, color: BAS_CTA }}>
                    Book A Sloth
                  </th>
                  <th className="px-5 py-4 text-sm font-semibold" style={{ color: SB_BLUE }}>SimplyBook.me</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={row.f} style={{ borderTop: "1px solid #F3F4F6", background: i % 2 ? "#FFFBF8" : "white" }}>
                    <th scope="row" className="px-5 py-3 text-sm font-medium" style={{ color: SB_NAVY }}>{row.f}</th>
                    <td className="px-5 py-3" style={{ background: i % 2 ? "#FFE3D2" : BAS_PEACH }}>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BAS_CTA }}>
                        <Check size={14} style={{ color: SB_GREEN }} /> {row.basT}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-sm ${row.sb ? "text-gray-600" : "text-gray-400"}`}>
                        {row.sb ? <Check size={14} className="text-gray-400" /> : <X size={14} className="text-gray-300" />}
                        {row.sbT}
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
                    <div className="font-heading text-sm font-extrabold leading-snug sm:text-base" style={{ color: SB_NAVY }}>
                      Say Yes to<br />Book A Sloth.
                    </div>
                    <p className="mt-1 hidden text-xs sm:block" style={{ color: SB_BODY }}>
                      Built for India. Priced in ₹. No trial games.
                    </p>
                    <div className="mt-3 sm:max-w-[220px]">
                      <SbCta slot="compare-yes" label="Sign up with Google" variant="google" />
                    </div>
                  </td>
                  <td className="px-4 py-5 align-top sm:px-5">
                    <div className="font-heading text-sm font-bold leading-snug text-gray-400 line-through sm:text-base">
                      Say No to SimplyBook.
                    </div>
                    <p className="mt-1 hidden text-xs text-gray-400 sm:block">
                      USD billing. No UPI. No GST. Trial wall.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-[6px] border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-300">
                      <X size={13} /> No thanks
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            SimplyBook.me Basic ~$8.25/mo (billed in USD), as of Jul 2026. Add-on modules cost extra.
          </p>
        </div>
      </section>

      {/* ══════ PRICING ══════ */}
      <section id="pricing" className="scroll-mt-16 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-heading text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: SB_NAVY }}>
            Transparent pricing. No module add-ons.
          </h2>
          <p className="mt-2 text-center" style={{ color: SB_BODY }}>
            All plans billed in ₹. Every feature included. No hidden costs — unlike SimplyBook&apos;s add-on maze.
          </p>

          {/* Billing toggle */}
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

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {ALL_PLANS.map((plan, i) => {
              const isFree = plan.monthly === 0;
              const perMo = isFree ? 0 : Math.round(plan.yearly / 12);
              const savePct = isFree ? 0 : Math.round((1 - plan.yearly / 12 / plan.monthly) * 100);
              const big = isFree ? "Free" : (billingAnnual ? fmtINR(plan.yearly) : fmtINR(plan.monthly));
              const cadence = isFree ? "" : (billingAnnual ? "/ year" : "/ month");
              const sub = isFree
                ? "Free forever — not a 14-day trial"
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
                    <span className="font-heading text-lg font-bold" style={{ color: SB_NAVY }}>{plan.name}</span>
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
                    <span className="text-4xl font-extrabold" style={{ color: SB_NAVY }}>{big}</span>
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

                  <SbCta
                    slot={`pricing-${plan.name}`}
                    label={isFree ? "Start for Free" : "Get Started Now"}
                    className="mt-5 w-full !justify-center"
                  />

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={14} className="mt-0.5 shrink-0" style={{ color: accent }} />
                        <span style={{ color: SB_BODY }}>{f}</span>
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

      {/* ══════ TESTIMONIALS ══════ */}
      <section className="px-5 py-20 sm:px-8" style={{ background: SB_LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-3 text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: SB_NAVY }}>
            Indian Professionals Trust Book A Sloth
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-sm" style={{ color: SB_BODY }}>
            Coaches, consultants, therapists, freelancers — professionals who chose simplicity over feature bloat.
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
                  <span className="font-heading text-3xl font-extrabold leading-none" style={{ color: accent }} aria-hidden>&ldquo;</span>
                  <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: SB_NAVY }}>{t.quote}</p>
                  <div className="mt-5 flex items-center gap-2.5">
                    <Avatar src={t.avatar} name={t.name} accent={accent} />
                    <div>
                      <div className="text-xs font-bold" style={{ color: SB_NAVY }}>{t.name}</div>
                      <div className="text-[11px]" style={{ color: SB_BODY }}>{t.role}</div>
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
          <h2 className="text-center font-heading text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: SB_NAVY }}>
            Switching from SimplyBook.me? Questions answered.
          </h2>
          <div className="mt-10 space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border transition-colors"
                  style={{ borderColor: isOpen ? `${SB_BLUE}40` : "#E5E7EB", background: isOpen ? `${SB_BLUE}05` : "white" }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold transition-colors"
                    style={{ color: SB_NAVY }}
                  >
                    {faq.q}
                    <ChevronRight
                      size={16}
                      className="shrink-0 transition-transform duration-200"
                      style={{ color: SB_BLUE, transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: SB_BODY }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA — dark ══════ */}
      <section className="px-5 py-20 sm:px-8" style={{ background: SB_NAVY }}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            No trial needed.
            <br />
            <span style={{ color: BAS_ORANGE }}>Start free. Stay free.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-neutral-300">
            Unlike SimplyBook&apos;s 14-day trial, our Starter plan is free forever. Upgrade when you&apos;re ready — not when a countdown says so.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="w-full max-w-xs">
              <SbCta slot="final-google" label="Sign up with Google" variant="google" />
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
          <p>&copy; {new Date().getFullYear()} Book A Sloth — The SimplyBook.me alternative built for India</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = SB_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              Privacy
            </Link>
            <Link to="/help" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = SB_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              Help
            </Link>
            <a href="mailto:bolt@bookasloth.in" className="hover:no-underline" style={{ color: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = SB_NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#9CA3AF"; }}>
              bolt@bookasloth.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimplybookAlternative;

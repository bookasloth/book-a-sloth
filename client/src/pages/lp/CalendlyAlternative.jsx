import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  Video,
  IndianRupee,
  MessageCircle,
  FileText,
  Wallet,
  LogIn,
  Share2,
  Sparkles,
} from "lucide-react";
import useUtm from "../../hooks/useUtm";
import useDocumentMeta from "../../hooks/useDocumentMeta";
import { analytics, EVENTS } from "../../services/analytics";
import LeadForm from "./_shared/LeadForm";

/* ════════════════════════════════════════════════════════════════════
   /lp/calendly-alternative
   Wedge: Calendly schedules; Book A Sloth schedules AND gets you paid,
   in ₹, with UPI + GST + WhatsApp — built for India. (Calendly is NOT
   commission-based, so this is a payments + India + price angle, not 0%.)
   ════════════════════════════════════════════════════════════════════ */

const SLUG = "calendly-alternative";

const PRO_MONTHLY = 499; // Book A Sloth Pro, flat ₹/mo
// Calendly Pro is billed in USD (~$12–16/mo). Approx ₹ shown for comparison.
const CALENDLY_APPROX = "~₹1,200";
const CALENDLY_AS_OF = "Jun 2026";

/* ─── What Calendly leaves you to stitch together ─── */
const GAPS = [
  {
    icon: Wallet,
    t: "Get paid when they book",
    d: "Collect over UPI, cards or wallets the moment a slot is taken — no separate payment link.",
  },
  {
    icon: FileText,
    t: "Send GST invoices",
    d: "Automatic, India-compliant invoices on every booking. No spreadsheet, no chasing.",
  },
  {
    icon: MessageCircle,
    t: "Remind on WhatsApp",
    d: "Nudges where India actually reads them. Fewer no-shows, zero manual follow-up.",
  },
];

/* ─── Honest comparison (differentiators first, parity rows after) ─── */
const COMPARE = [
  { f: "Take payment in ₹ (UPI / cards)", bas: { t: "Built in", good: true }, c: { t: "USD via Stripe only", good: false } },
  { f: "GST invoices, India-native", bas: { t: "Automatic", good: true }, c: { t: "No", good: false } },
  { f: "WhatsApp reminders", bas: { t: "Yes", good: true }, c: { t: "No", good: false } },
  { f: "Price", bas: { t: "₹499/mo flat", good: true }, c: { t: `${CALENDLY_APPROX}/mo (USD)`, good: false } },
  { f: "Built for India (INR · UPI · GST)", bas: { t: "Yes", good: true }, c: { t: "No", good: false } },
  { f: "Google Calendar + Meet", bas: { t: "Built in", good: true }, c: { t: "Yes", good: true } },
  { f: "Custom booking page", bas: { t: "Yes", good: true }, c: { t: "Yes", good: true } },
  { f: "Email reminders + reschedule", bas: { t: "Yes", good: true }, c: { t: "Yes", good: true } },
  { f: "Free plan to start", bas: { t: "Yes", good: true }, c: { t: "Yes", good: true } },
];

const Cell = ({ good, children, strong }) => (
  <span className="inline-flex items-center gap-1.5">
    {good ? (
      <Check size={15} className={strong ? "text-primary" : "text-emerald-600"} />
    ) : (
      <X size={15} className="text-neutral-400" />
    )}
    <span className={strong ? "font-semibold text-ink" : "text-neutral-600"}>
      {children}
    </span>
  </span>
);

const TRUST = [
  { icon: ShieldCheck, label: "Payments secured by Razorpay" },
  { icon: IndianRupee, label: "UPI · cards · wallets" },
  { icon: FileText, label: "GST invoices" },
  { icon: CalendarCheck, label: "Google Calendar + Meet" },
];

const STEPS = [
  { icon: LogIn, t: "Continue with Google", d: "30 seconds, no password. Your calendar connects instantly." },
  { icon: Sparkles, t: "Build your booking page", d: "Add your services and prices. Set your availability once." },
  { icon: Share2, t: "Share your link", d: "Clients pick a slot and pay up-front. You just show up." },
];

const FAQ = [
  {
    q: "Can it take payments like I wish Calendly did?",
    a: "Yes — and in rupees. Clients pay over UPI, cards or wallets the moment they book, settled to you via Razorpay. No USD Stripe bolt-on, no separate payment links.",
  },
  {
    q: "Does it sync Google Calendar and Meet?",
    a: "Yes, automatically — exactly like Calendly. Busy times are never double-booked, and a Google Meet link is created for every online booking.",
  },
  {
    q: "Why switch if Calendly already works for me?",
    a: "Calendly stops at the calendar. Book A Sloth gets you booked AND paid, adds GST invoices and WhatsApp reminders, and costs less per month — all in one place built for India.",
  },
  {
    q: "Will my clients need to install or sign up for anything?",
    a: "No. They open your link, pick a slot, and pay in a couple of taps. No account required.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — start free and upgrade to Pro (₹499/month, flat) whenever you're ready for unlimited bookings and the full toolkit.",
  },
];

/* ════════════════════════════════════════ PAGE ════════════════════════════════════════ */
const CalendlyAlternative = () => {
  const utm = useUtm();

  useDocumentMeta({
    title: "Book A Sloth — the Calendly alternative that gets you paid (India)",
    description:
      "Calendly schedules; Book A Sloth schedules and gets you paid. UPI, GST invoices and WhatsApp reminders — built for India at ₹499/month. Start free.",
  });

  useEffect(() => {
    analytics.page({ lp: SLUG });
    analytics.track(EVENTS.LP_VIEWED, { slug: SLUG, ...utm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-canvas text-ink">
      {/* ───── Minimal header ───── */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-extrabold tracking-tight text-ink">
              Book A Sloth
            </span>
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary sm:inline">
              Made for India
            </span>
          </div>
          <a
            href="#start"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:no-underline"
          >
            Start free <ArrowRight size={14} />
          </a>
        </div>
      </header>

      {/* ───── HERO ───── */}
      <section className="px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
            <Sparkles size={13} className="text-primary" /> The Calendly alternative for India
          </span>

          <h1 className="mt-6 text-[2.4rem] leading-[1.05] sm:text-6xl">
            Booked and paid.
            <br />
            <span className="text-primary">In rupees.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
            Calendly schedules the meeting. <strong className="text-ink">Book A Sloth</strong>{" "}
            schedules it, collects payment over UPI, sends a GST invoice and reminds on
            WhatsApp — built for India, at a flat ₹499/month.
          </p>

          <div id="start" className="mt-9 flex scroll-mt-24 flex-col items-center">
            <LeadForm slug={SLUG} slot="hero" />
          </div>

          <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
            {TRUST.map((t) => (
              <li key={t.label} className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                <t.icon size={15} className="text-neutral-400" />
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───── CALENDLY STOPS AT THE CALENDAR ───── */}
      <section className="bg-sand px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Calendly stops at the calendar
            </p>
            <h2 className="mx-auto mt-3 max-w-xl text-3xl sm:text-4xl">
              The booking is the easy part. Getting paid is the point.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {GAPS.map((g) => (
              <div
                key={g.t}
                className="rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-[0_10px_30px_-16px_rgba(26,26,26,0.25)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <g.icon size={20} />
                </span>
                <h3 className="mt-4 font-heading text-base font-bold text-ink">{g.t}</h3>
                <p className="mt-1.5 text-sm text-neutral-600">{g.d}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-neutral-600">
            Calendly needs add-ons for these. Book A Sloth includes them — for{" "}
            <strong className="text-ink">₹{PRO_MONTHLY}/month</strong>, flat.
          </p>

          {/* Price compare */}
          <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 text-center ring-1 ring-black/5">
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Calendly Pro
              </div>
              <div className="mt-1 text-3xl font-bold text-neutral-700 [font-variant-numeric:tabular-nums]">
                {CALENDLY_APPROX}<span className="text-base font-medium text-neutral-400">/mo</span>
              </div>
              <div className="mt-1 text-xs text-neutral-500">billed in USD · no UPI</div>
            </div>
            <div className="rounded-2xl bg-primary/10 p-5 text-center ring-1 ring-primary/20">
              <div className="text-xs font-medium uppercase tracking-wide text-primary">
                Book A Sloth Pro
              </div>
              <div className="mt-1 text-3xl font-bold text-primary [font-variant-numeric:tabular-nums]">
                ₹{PRO_MONTHLY}<span className="text-base font-medium text-neutral-500">/mo</span>
              </div>
              <div className="mt-1 text-xs text-neutral-500">flat ₹ · takes payments</div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-neutral-500">
            Calendly Pro approx US$12–16/mo, billed in USD, as of {CALENDLY_AS_OF}.
          </p>
        </div>
      </section>

      {/* ───── COMPARISON TABLE ───── */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl sm:text-4xl">Book A Sloth vs Calendly</h2>
          <p className="mx-auto mt-3 max-w-md text-center text-neutral-600">
            Great scheduling — plus the payments, invoices and reminders Indian
            professionals actually need.
          </p>

          <div className="mt-10 overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-[0_16px_50px_-24px_rgba(26,26,26,0.25)]">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Feature comparison between Book A Sloth and Calendly
              </caption>
              <thead>
                <tr className="border-b border-black/5">
                  <th scope="col" className="px-4 py-4 font-semibold text-neutral-500 sm:px-6">
                    Feature
                  </th>
                  <th scope="col" className="bg-primary/5 px-4 py-4 font-bold text-primary sm:px-6">
                    Book A Sloth
                  </th>
                  <th scope="col" className="px-4 py-4 font-semibold text-neutral-500 sm:px-6">
                    Calendly
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={row.f} className={i % 2 ? "bg-neutral-50/60" : ""}>
                    <th scope="row" className="px-4 py-3.5 font-medium text-ink sm:px-6">
                      {row.f}
                    </th>
                    <td className="bg-primary/5 px-4 py-3.5 sm:px-6">
                      <Cell good={row.bas.good} strong>
                        {row.bas.t}
                      </Cell>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6">
                      <Cell good={row.c.good}>{row.c.t}</Cell>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="bg-sand px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl sm:text-4xl">Live in 2 minutes.</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((s, i) => (
              <div key={s.t} className="text-center md:text-left">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-[0_10px_30px_-12px_rgba(26,26,26,0.25)] md:mx-0">
                  <s.icon size={22} />
                </div>
                <div className="mt-4 text-xs font-bold text-neutral-400">0{i + 1}</div>
                <h3 className="mt-1 font-heading text-lg font-bold text-ink">{s.t}</h3>
                <p className="mt-1.5 text-sm text-neutral-600">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl sm:text-4xl">Questions, answered.</h2>
          <div className="mt-10 divide-y divide-black/5 rounded-[1.5rem] border border-black/5 bg-white px-6 shadow-sm">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-base font-semibold text-ink marker:content-none">
                  {item.q}
                  <span className="text-primary transition-transform duration-200 group-open:rotate-45">
                    <span className="block text-xl leading-none">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] bg-ink px-6 py-16 text-center text-white sm:py-20">
          <h2 className="mx-auto max-w-xl text-3xl leading-tight text-white sm:text-5xl">
            Your calendar is sorted. Your payments aren&apos;t.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Get booked and paid — over UPI, with GST invoices, for ₹499/month.
          </p>
          <div className="mt-9 flex flex-col items-center">
            <LeadForm slug={SLUG} slot="final" dark />
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="px-5 pb-10 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-3 border-t border-black/5 pt-8 text-xs text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Book A Sloth</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className="hover:text-ink hover:no-underline">
              Privacy
            </Link>
            <Link to="/help" className="hover:text-ink hover:no-underline">
              Help
            </Link>
            <a href="mailto:bolt@bookasloth.in" className="hover:text-ink hover:no-underline">
              bolt@bookasloth.in
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CalendlyAlternative;

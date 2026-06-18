import { useEffect, useMemo, useState } from "react";
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
  LogIn,
  Share2,
  Sparkles,
} from "lucide-react";
import useUtm from "../../hooks/useUtm";
import useDocumentMeta from "../../hooks/useDocumentMeta";
import { analytics, EVENTS } from "../../services/analytics";
import LeadForm from "./_shared/LeadForm";

/* ════════════════════════════════════════════════════════════════════
   /lp/topmate-vs-bookasloth
   Conversion landing page for paid ad traffic (Topmate switchers).
   Single goal: start a 0%-commission vendor signup.
   No global Navbar/footer (App.jsx hides nav on /lp). No exit links.
   ════════════════════════════════════════════════════════════════════ */

const SLUG = "topmate-vs-bookasloth";

// Pricing facts — source of truth: subscription_plans + pricingEngine.js.
const PRO_MONTHLY = 499; // Professional plan, ₹/mo (0% commission)
const PRO_ANNUAL = PRO_MONTHLY * 12; // flat yearly cost on Pro
// Topmate publishes a 10–30% commission band. Update + date-stamp if it changes.
const TM_RATE_LO = 0.1;
const TM_RATE_HI = 0.3;
const TM_CLAIM_AS_OF = "Jun 2026";

const inr = (n) =>
  "₹" + Math.round(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

/* LeadForm is shared across all /lp pages — see ./_shared/LeadForm.jsx */

/* ─── Trust badges (honest: product + security facts, no invented counts) ─── */
const TRUST = [
  { icon: ShieldCheck, label: "Payments secured by Razorpay" },
  { icon: CalendarCheck, label: "Google Calendar sync" },
  { icon: Video, label: "Auto Google Meet links" },
  { icon: IndianRupee, label: "UPI · GST · INR-native" },
];

/* ─── Comparison rows ─── */
const COMPARE = [
  { f: "Commission per booking", bas: { t: "0%", good: true }, tm: { t: "Up to 30%", good: false } },
  { f: "You keep on a ₹1,000 booking", bas: { t: "₹1,000", good: true }, tm: { t: "₹700 – ₹900", good: false } },
  { f: "Pricing model", bas: { t: "Flat ₹499/mo", good: true }, tm: { t: "% of every booking", good: false } },
  { f: "Free plan to start", bas: { t: "Yes (5% only)", good: true }, tm: { t: "Yes", good: true } },
  { f: "Your own booking page", bas: { t: "Yes", good: true }, tm: { t: "Yes", good: true } },
  { f: "Google Calendar + Meet, automatic", bas: { t: "Built in", good: true }, tm: { t: "Limited", good: false } },
  { f: "WhatsApp + email reminders", bas: { t: "Yes", good: true }, tm: { t: "Limited", good: false } },
  { f: "GST invoices, India-native", bas: { t: "Yes", good: true }, tm: { t: "Partial", good: false } },
  { f: "Your clients stay yours", bas: { t: "Yes", good: true }, tm: { t: "Yes", good: true } },
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

/* ─── Savings calculator ─── */
function SavingsCalc() {
  const [monthly, setMonthly] = useState(50000);
  const figures = useMemo(() => {
    const yearly = monthly * 12;
    const tmLo = yearly * TM_RATE_LO;
    const tmHi = yearly * TM_RATE_HI;
    const keepMore = Math.max(0, tmHi - PRO_ANNUAL); // worst-case Topmate vs flat Pro
    return { tmLo, tmHi, keepMore };
  }, [monthly]);

  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_20px_60px_-25px_rgba(26,26,26,0.25)] sm:p-9">
      <label htmlFor="calc-earn" className="block text-sm font-medium text-neutral-600">
        I earn about{" "}
        <span className="font-bold text-ink [font-variant-numeric:tabular-nums]">
          {inr(monthly)}
        </span>{" "}
        / month from bookings
      </label>
      <input
        id="calc-earn"
        type="range"
        min={5000}
        max={500000}
        step={5000}
        value={monthly}
        onChange={(e) => setMonthly(Number(e.target.value))}
        className="mt-4 w-full accent-primary"
        aria-valuetext={`${inr(monthly)} per month`}
      />
      <div className="mt-2 flex justify-between text-[11px] text-neutral-400">
        <span>₹5K</span>
        <span>₹5L</span>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-neutral-100 p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Topmate takes / year
          </div>
          <div className="mt-1 text-2xl font-bold text-neutral-700 [font-variant-numeric:tabular-nums]">
            {inr(figures.tmLo)} – {inr(figures.tmHi)}
          </div>
          <div className="mt-1 text-xs text-neutral-500">at 10–30% commission</div>
        </div>
        <div className="rounded-2xl bg-primary/10 p-5 ring-1 ring-primary/20">
          <div className="text-xs font-medium uppercase tracking-wide text-primary">
            Book A Sloth takes / year
          </div>
          <div className="mt-1 text-2xl font-bold text-primary [font-variant-numeric:tabular-nums]">
            ₹0 <span className="text-sm font-medium text-neutral-500">commission</span>
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            just {inr(PRO_ANNUAL)}/yr flat (Pro)
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-lg text-ink sm:text-xl">
        You could keep{" "}
        <span className="font-bold text-primary [font-variant-numeric:tabular-nums]">
          up to {inr(figures.keepMore)}
        </span>{" "}
        more every year.
      </p>
    </div>
  );
}

/* ─── How switching works ─── */
const STEPS = [
  { icon: LogIn, t: "Continue with Google", d: "30 seconds, no password. Your calendar connects instantly." },
  { icon: Sparkles, t: "Claim your SlothPage", d: "Add your services and prices. Import what you already offer." },
  { icon: Share2, t: "Share your link", d: "Clients book and pay up-front. You keep 100% of the fee." },
];

/* ─── FAQ (objection handling; native <details> = accessible + progressive) ─── */
const FAQ = [
  {
    q: "Is it really 0% commission?",
    a: "Yes — on every paid plan, Book A Sloth takes 0% commission. The only per-booking cost is a flat ₹10 platform fee plus your payment gateway's standard charge. Nothing is skimmed as commission.",
  },
  {
    q: "What does ₹499/month include?",
    a: "Unlimited bookings, up-front payments, WhatsApp + email reminders, your own SlothPage, and automatic Google Calendar + Meet. One flat price — it never scales with how much you earn.",
  },
  {
    q: "Can I move my existing clients over?",
    a: "Yes. Share your new SlothPage link — your clients book in seconds. No migration, no lock-in. Your client list stays yours.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. The Starter plan is free with a small 5% commission — still far below Topmate. Upgrade to a 0%-commission paid plan whenever you're ready.",
  },
  {
    q: "How do payouts work?",
    a: "Clients pay up-front through Razorpay when they book. Your earnings are settled to you after the session completes.",
  },
];

/* ════════════════════════════════ PAGE ════════════════════════════════ */
const TopmateVsBookASloth = () => {
  const utm = useUtm();

  useDocumentMeta({
    title: "Book A Sloth — the 0% commission Topmate alternative",
    description:
      "Switching from Topmate? Keep what you earn — 0% commission, flat ₹499/month, UPI & GST built in. Start free.",
  });

  useEffect(() => {
    analytics.page({ lp: SLUG });
    analytics.track(EVENTS.LP_VIEWED, { slug: SLUG, ...utm });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-canvas text-ink">
      {/* ───── Minimal header (no nav links = no exit) ───── */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-extrabold tracking-tight text-ink">
              Book A Sloth
            </span>
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary sm:inline">
              0% commission
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

      {/* ───── HERO (Attention) ───── */}
      <section className="px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
            <Sparkles size={13} className="text-primary" /> The Topmate alternative · Built for India
          </span>

          <h1 className="mt-6 text-[2.4rem] leading-[1.05] sm:text-6xl">
            Every booking,
            <br />
            <span className="text-primary">100% yours.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
            Book A Sloth is the <strong className="text-ink">0% commission</strong>{" "}
            alternative to Topmate. A flat ₹499/month — keep every rupee your clients
            pay, instead of losing up to 30% on every single booking.
          </p>

          <div id="start" className="mt-9 flex scroll-mt-24 flex-col items-center">
            <LeadForm slug={SLUG} slot="hero" ctaLabel="Start free — 0% commission" />
          </div>

          {/* Trust strip */}
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

      {/* ───── THE MATH (Interest → Desire) ───── */}
      <section className="bg-sand px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              The commission math
            </p>
            <h2 className="mx-auto mt-3 max-w-xl text-3xl sm:text-4xl">
              See what commission is quietly costing you.
            </h2>
          </div>
          <div className="mt-10">
            <SavingsCalc />
          </div>
          <p className="mt-5 text-center text-xs text-neutral-500">
            Topmate commission band of 10–30% as of {TM_CLAIM_AS_OF}. Book A Sloth Pro:
            0% commission, flat {inr(PRO_ANNUAL)}/year.
          </p>
        </div>
      </section>

      {/* ───── COMPARISON TABLE (Desire) ───── */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl sm:text-4xl">Book A Sloth vs Topmate</h2>
          <p className="mx-auto mt-3 max-w-md text-center text-neutral-600">
            Same booking page. Same payments. One of them takes a cut of everything
            you earn.
          </p>

          <div className="mt-10 overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-[0_16px_50px_-24px_rgba(26,26,26,0.25)]">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Feature comparison between Book A Sloth and Topmate
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
                    Topmate
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={row.f} className={i % 2 ? "bg-neutral-50/60" : ""}>
                    <th
                      scope="row"
                      className="px-4 py-3.5 font-medium text-ink sm:px-6"
                    >
                      {row.f}
                    </th>
                    <td className="bg-primary/5 px-4 py-3.5 sm:px-6">
                      <Cell good={row.bas.good} strong>
                        {row.bas.t}
                      </Cell>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6">
                      <Cell good={row.tm.good}>{row.tm.t}</Cell>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───── HOW SWITCHING WORKS (Action setup) ───── */}
      <section className="bg-sand px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl sm:text-4xl">Switch in 2 minutes.</h2>
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

      {/* ───── FAQ (objection handling) ───── */}
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

      {/* ───── FINAL CTA (Action) ───── */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] bg-ink px-6 py-16 text-center text-white sm:py-20">
          <h2 className="mx-auto max-w-xl text-3xl leading-tight text-white sm:text-5xl">
            Stop paying commission on your own work.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Move to flat ₹499/month. Keep what you earn — starting with your next
            booking.
          </p>
          <div className="mt-9 flex flex-col items-center">
            <LeadForm slug={SLUG} slot="final" dark ctaLabel="Start free — 0% commission" />
          </div>
        </div>
      </section>

      {/* ───── Minimal footer ───── */}
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
            <a href="mailto:hello@bookasloth.com" className="hover:text-ink hover:no-underline">
              hello@bookasloth.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TopmateVsBookASloth;

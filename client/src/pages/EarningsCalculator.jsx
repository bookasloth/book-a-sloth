import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sprout, Sparkles, Rocket, TrendingUp, ArrowUpRight, ShieldCheck, Info, Check } from "lucide-react";
import Seo from "../components/common/Seo";
import { ogCard } from "../config/ogImages";
import { SITE_URL } from "../utils/seo";
import {
  resultsFor, pickWinner, annualSaving, ceilingState,
  starterCommissionPerYear, ANNUAL_FEE, HOSTPLUS_ANNUAL_CAP,
  deltaVsFree, hostplusCrossover,
} from "../lib/earningsCalc";

// /earnings-calculator — public conversion tool. Host drags price + monthly
// volume; sees annual take-home per plan (annual billing default), what Starter's
// 5% commission costs over a year, and — once volume passes Host+'s 1,000/yr cap —
// an honest nudge to Studio (identical take-home, uncapped). Winner is always the
// highest annual take-home among non-capped plans; Studio never fakes a higher
// number. Math: lib/earningsCalc.js + lib/morPricing.js (server mirror). Display
// only; real pricing computed server-side at booking.

const ROUTE_START = "/be-a-sloth";
const ICON = { starter: Sprout, hostplus: Sparkles, studio: Rocket };
const ACCENT = { starter: "#4AB765", hostplus: "#269CEF", studio: "#FE5100" };

// What the recommended plan actually *does* — so the verdict answers "what am I
// paying for", not just "how much". Short labels mirror data/plans.js features.
const VALUE_CHIPS = {
  starter: ["Free forever", "Online payments", "Your booking page"],
  hostplus: ["0% commission", "Auto reminders", "Auto invoices"],
  studio: ["Unlimited bookings", "Client CRM", "Advanced analytics"],
};

// One-line "who's this for" per plan, so a card sells a fit — not just a price.
const POSITION = {
  starter: "Test the waters, free.",
  hostplus: "Booking regularly? Kill the commission.",
  studio: "Outgrowing the limits.",
};

const inr0 = (n) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n) || 0);
const inr2 = (n) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(n) || 0);

// ponytail: hand-rolled count-up (rAF, ~500ms). Snaps to final when reduced-motion
// is set OR matchMedia is unavailable (jsdom in tests). No animation lib.
function useCountUp(value, ms = 500) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const reduce =
      typeof window === "undefined" || !window.matchMedia
        ? true
        : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setDisplay(value); fromRef.current = value; return; }
    const from = fromRef.current;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return display;
}

function Field({ label, hint, value, min, max, step, onChange, prefix }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-semibold text-ink">{label}</label>
        <span className="text-xs text-neutral-500">{hint}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-[6px] border border-black/10 bg-white px-3 py-2 focus-within:border-primary">
        {prefix && <span className="text-neutral-400">{prefix}</span>}
        <input
          type="number" inputMode="numeric" min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-lg font-semibold text-ink outline-none"
          aria-label={label}
        />
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={Math.min(Math.max(Number(value) || min, min), max)}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full accent-primary" aria-label={`${label} slider`}
      />
    </div>
  );
}

function PlanCard({ result, winnerKey, cycle }) {
  const { plan } = result;
  const Icon = ICON[plan.key] ?? Sparkles;
  const accent = ACCENT[plan.key];
  const isWinner = winnerKey === plan.key;
  // Studio rarely wins on take-home (its higher fee makes it look "worse" than
  // Host+ until you're over the cap). Below the cap, stop competing on rupees —
  // sell what it's actually for: capacity + features.
  const studioCapacity = plan.key === "studio" && !isWinner && !result.outgrows;
  return (
    <div
      className={`relative flex flex-col rounded-[6px] border bg-white p-5 transition-all sm:p-6 ${
        isWinner ? "shadow-[0_10px_36px_rgba(26,26,26,0.10)]" : "border-black/5"
      }`}
      style={isWinner ? { borderColor: accent } : undefined}
    >
      {isWinner && (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: accent }}>
          <TrendingUp size={12} /> Best for your volume
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[6px]" style={{ color: accent, background: `${accent}14` }}>
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{plan.name}</p>
          <p className="text-[11px] text-neutral-500">{plan.note}</p>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-neutral-600">{POSITION[plan.key]}</p>

      {studioCapacity ? (
        <div className="mt-4">
          <p className="text-xs text-neutral-500">Same take-home as Host+</p>
          <p className="mt-1 text-sm font-semibold text-ink">Unlock CRM, unlimited bookings &amp; analytics when you outgrow Host+&rsquo;s limits.</p>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs text-neutral-500">You keep, per year</p>
          <p className="text-2xl font-extrabold" style={{ color: accent }}>{inr0(result.netAnnual)}</p>
        </div>
      )}

      {/* Math collapsed by default so the card reads as a plan, not a spreadsheet.
          Open on the recommended card so the proof is one glance away. */}
      <details className="mt-3" {...(isWinner ? { open: true } : {})}>
        <summary className="cursor-pointer select-none text-[11px] font-semibold text-neutral-500 hover:text-ink">See the math</summary>
        <div className="mt-2 space-y-1.5 border-t border-black/5 pt-3 text-xs">
          {plan.monthly > 0 && (
            <p className="text-[11px] text-neutral-400">
              {inr0(result.grossAnnual)} earned − {inr0(result.fee)} plan fee{cycle === "annual" ? " (yearly)" : " (monthly ×12)"}
            </p>
          )}
          <div className="flex justify-between"><span className="text-neutral-500">Take-home / session</span><span className="font-semibold text-ink">{inr2(result.perBookingTakeHome)}</span></div>
        </div>
      </details>

      {result.capped && (
        <p className="mt-3 rounded-[6px] bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
          Starter caps at {inr0(plan.maxServicePrice)} per session. Host+ prices above it.
        </p>
      )}
      {result.outgrows && (
        <p className="mt-3 rounded-[6px] bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
          Caps at {result.bookingCap.toLocaleString("en-IN")} bookings/year — {result.uncollectedBookings.toLocaleString("en-IN")} you couldn't take
          {result.uncollectedValue > 0 ? `, ${inr0(result.uncollectedValue)} left uncollected` : ""}.
        </p>
      )}
    </div>
  );
}

export default function EarningsCalculator() {
  const [earning, setEarning] = useState(1500);
  const [bookings, setBookings] = useState(12);
  const [cycle, setCycle] = useState("annual"); // annual | monthly

  const results = useMemo(() => resultsFor(earning, bookings, cycle), [earning, bookings, cycle]);
  const winnerKey = useMemo(() => pickWinner(results), [results]);
  const winner = results.find((r) => r.plan.key === winnerKey);
  const loss = starterCommissionPerYear(earning, bookings);
  const ceiling = ceilingState(bookings);
  const saving = annualSaving(winnerKey);

  const winnerIsFree = winnerKey === "starter";
  const delta = deltaVsFree(results, winnerKey);      // ₹/yr the winner beats free by
  const crossover = hostplusCrossover(earning);       // sessions/mo Host+ starts paying off
  const chips = VALUE_CHIPS[winnerKey] ?? [];

  const animatedDelta = useCountUp(delta);
  const animatedLoss = useCountUp(loss);

  const canonical = `${SITE_URL}/earnings-calculator`;

  return (
    <div className="min-h-screen" style={{ background: "#f7f5ef" }}>
      <Seo
        title="Earnings Calculator | Book A Sloth"
        description="See what you'd actually pocket on Book A Sloth. Drag your price and monthly bookings to watch your yearly take-home — and what the wrong plan quietly costs you."
        canonical={canonical}
        image={ogCard("earnings-calculator", "png")}
      />
      <div className="app-container py-10 sm:py-14">
        <div className="mx-auto max-w-3xl pb-24 sm:pb-0">
          {/* HERO + INPUTS (fused) */}
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Your booking page, payments &amp; reminders — for people who get paid for their time
          </p>
          <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">See exactly what you'd keep.</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
            Set your price and how often you book. We'll pick the plan that leaves the most in your pocket — and show you what it does for you.
          </p>

          <div className="mt-8 grid gap-6 rounded-[6px] border border-black/5 bg-white p-6 sm:grid-cols-2 sm:p-7">
            <Field label="Price per session" hint="what you keep" prefix="₹" value={earning}
              min={100} max={10000} step={50}
              onChange={(v) => setEarning(v === "" ? "" : Math.max(0, Number(v)))} />
            <Field label="Sessions per month" hint="your volume" value={bookings}
              min={1} max={120} step={1}
              onChange={(v) => setBookings(v === "" ? "" : Math.max(0, Number(v)))} />
          </div>

          {/* VERDICT: recommendation-first — one plan, the delta vs free, what it
              does, and the CTA, all above the fold. Replaces the twin big-number
              reveal strip so the visitor decides and acts in a single glance. */}
          <div className="mt-6 grid gap-4 sm:grid-cols-5">
            <div className="sm:col-span-3 rounded-[6px] border-2 bg-white p-5 sm:p-6" style={{ borderColor: ACCENT[winnerKey] }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Your plan</p>
              <p className="mt-0.5 text-2xl font-extrabold" style={{ color: ACCENT[winnerKey] }}>
                {winner.plan.name}{winnerIsFree ? " · free" : ""}
              </p>

              {winnerIsFree ? (
                <p className="mt-1.5 text-sm text-neutral-700">
                  <strong className="text-ink">Start free.</strong> At your volume the 5% commission is still
                  less than a paid plan's fee. You'll want Host+ past{" "}
                  <strong className="text-ink">~{Number.isFinite(crossover) ? crossover : "—"} sessions/mo</strong> — we'll tell you when.
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-neutral-700">
                  You keep <strong className="text-ink">{inr0(animatedDelta)} more a year</strong> than the free plan —
                  because {winner.plan.name} drops the 5% commission, and that beats the {inr0(winner.fee)} fee at your volume.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {chips.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                    <Check size={12} className="text-primary" /> {c}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link to={ROUTE_START} className="inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95">
                  Start on {winner.plan.name} <ArrowUpRight size={16} />
                </Link>
                <span className="text-[11px] text-neutral-500">Free to set up · cancel anytime</span>
              </div>
            </div>

            {/* Dynamic commission card — never contradicts the recommendation */}
            <div className="sm:col-span-2 rounded-[6px] border border-black/5 bg-white p-5">
              {winnerIsFree ? (
                <>
                  <p className="text-xs text-neutral-500">Staying free is the math</p>
                  <p className="text-3xl font-extrabold" style={{ color: ACCENT.starter }}>{inr0(animatedLoss)}</p>
                  <p className="mt-1 text-[11px] text-neutral-500">in commission this year — still less than a {inr0(ANNUAL_FEE.hostplus)} plan. No fee beats it yet.</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-neutral-500">On Starter, 5% walks out the door</p>
                  <p className="text-3xl font-extrabold text-[#c0392b]">− {inr0(animatedLoss)}</p>
                  <p className="mt-1 text-[11px] text-neutral-500">in commission this year. On {winner.plan.name}, that's <strong>₹0</strong>.</p>
                </>
              )}
            </div>
          </div>

          {/* BILLING TOGGLE */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <button type="button" onClick={() => setCycle("annual")}
              className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold ${cycle === "annual" ? "bg-primary text-white" : "text-neutral-500"}`}
              aria-pressed={cycle === "annual"}>
              Pay yearly{saving > 0 ? ` · save ${inr0(saving)}` : ""}
            </button>
            <button type="button" onClick={() => setCycle("monthly")}
              className={`rounded-[6px] px-3 py-1.5 text-xs font-semibold ${cycle === "monthly" ? "bg-primary text-white" : "text-neutral-500"}`}
              aria-pressed={cycle === "monthly"}>
              Pay monthly
            </button>
          </div>

          {/* PLAN CARDS — winner first (matters most on the mobile stack) */}
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            {[...results]
              .sort((a, b) => (b.plan.key === winnerKey) - (a.plan.key === winnerKey))
              .map((r) => (
                <PlanCard key={r.plan.key} result={r} winnerKey={winnerKey} cycle={cycle} />
              ))}
          </div>

          {/* Guest price, once — it never varies by plan, so showing it 3× was noise */}
          <p className="mt-3 text-center text-[11px] leading-relaxed text-neutral-500">
            Your guest pays <strong>{inr2(winner.guestPays)}</strong> — your {inr0(earning)} price plus a flat ₹10 booking fee. You never eat it; your take-home is your price minus taxes.
          </p>

          {/* CEILING NUDGE (honest top-plan moment) */}
          {ceiling !== "none" && (
            <div className="mt-6 flex items-start gap-3 rounded-[6px] border p-5" style={{ borderColor: ACCENT.studio, background: `${ACCENT.studio}0D` }}>
              <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[6px]" style={{ color: ACCENT.studio, background: `${ACCENT.studio}14` }}>
                <Rocket size={18} />
              </span>
              <p className="text-sm text-neutral-700">
                {ceiling === "over" ? "You're booking past" : "You're closing in on"} Host+'s{" "}
                <strong>{HOSTPLUS_ANNUAL_CAP.toLocaleString("en-IN")}/year limit</strong>.{" "}
                <strong style={{ color: ACCENT.studio }}>Studio keeps you uncapped</strong> — same 0% cut, same take-home per session, room to grow.
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <Link to={ROUTE_START} className="inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-95">
              Start on {winner.plan.name} <ArrowUpRight size={16} />
            </Link>
            <Link to="/pricing" className="text-xs text-neutral-500 hover:text-primary hover:underline">
              Compare every feature →
            </Link>
          </div>

          {/* OBJECTION RESOLVER + footnote */}
          <div className="mt-8 grid gap-2.5 rounded-[6px] border border-black/5 bg-white/60 p-4 text-xs leading-relaxed text-neutral-600 sm:grid-cols-2">
            <p className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-primary" /> Free to start — test the waters at zero cost.</p>
            <p className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-primary" /> Cancel anytime — no lock-in.</p>
            <p className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-primary" /> Real payout math, not a sales number.</p>
            <p className="flex gap-2"><ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-primary" /> Same take-home whether or not you're GST-registered.</p>
          </div>
          <div className="mt-3 flex gap-2.5 text-[11px] leading-relaxed text-neutral-500">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            <p>
              An illustration, not a quote. Figures assume 18% GST (most categories; some differ) and your exact price is confirmed when you list a service. See the{" "}
              <Link to="/host-fees" className="text-primary hover:underline">Host Fee &amp; Payment Schedule</Link> for the full breakdown.
            </p>
          </div>
        </div>
      </div>

      {/* Sticky CTA on mobile — keep the action one thumb-reach away */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur sm:hidden">
        <Link to={ROUTE_START} className="flex items-center justify-center gap-1.5 rounded-[6px] bg-primary px-5 py-3 text-sm font-semibold text-white">
          Start on {winner.plan.name} <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}

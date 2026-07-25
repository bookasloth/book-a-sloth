import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Sprout, Sparkles, Rocket, TrendingUp, Info } from "lucide-react";
import Seo from "../components/common/Seo";
import { SITE_URL } from "../utils/seo";
import { CALC_PLANS, monthlyForPlan, DEFAULT_GST_RATE } from "../lib/morPricing";

// /earnings-calculator — public tool. A host enters what they want to earn per
// session and their monthly volume, and sees take-home per session, what the
// guest pays, and monthly income net of subscription across all three plans —
// with the most profitable plan highlighted. That crossover (Starter loses to
// Host+ once volume is high enough) is the upgrade story, shown rather than told.
//
// Math is client/src/lib/morPricing.js, a mirror of the server pricing engine
// (drift-guarded by a shared-number test). Display/illustration only; real
// pricing is computed server-side at booking time. Assumes 18% GST until the CA
// confirms per-category treatment.

const ROUTE_START = "/be-a-sloth";
const ICON = { starter: Sprout, hostplus: Sparkles, studio: Rocket };
const ACCENT = { starter: "#4AB765", hostplus: "#269CEF", studio: "#FE5100" };

const inr = (n) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(n) || 0);
const inr0 = (n) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n) || 0);

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
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-lg font-semibold text-ink outline-none"
          aria-label={label}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(Math.max(Number(value) || min, min), max)}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full accent-primary"
        aria-label={`${label} slider`}
      />
    </div>
  );
}

function PlanResult({ result, best }) {
  const { plan } = result;
  const Icon = ICON[plan.key] ?? Sparkles;
  const accent = ACCENT[plan.key];
  const isBest = best === plan.key;
  return (
    <div
      className={`relative flex flex-col rounded-[6px] border bg-white p-5 sm:p-6 ${
        isBest ? "shadow-[0_10px_36px_rgba(26,26,26,0.10)]" : "border-black/5"
      }`}
      style={isBest ? { borderColor: accent } : undefined}
    >
      {isBest && (
        <span
          className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
          style={{ background: accent }}
        >
          <TrendingUp size={12} /> You earn the most here
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-[6px]"
          style={{ color: accent, background: `${accent}14` }}
        >
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{plan.name}</p>
          <p className="text-[11px] text-neutral-500">{plan.note}</p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs text-neutral-500">You keep, per month</p>
        <p className="text-2xl font-extrabold text-ink" style={{ color: accent }}>
          {inr0(result.netMonthly)}
        </p>
        {plan.monthly > 0 && (
          <p className="text-[11px] text-neutral-400">
            {inr0(result.grossMonthly)} earned − {inr0(result.subscription)} plan fee
          </p>
        )}
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-black/5 pt-4 text-xs">
        <div className="flex justify-between">
          <dt className="text-neutral-500">Take-home / session</dt>
          <dd className="font-semibold text-ink">{inr(result.perBookingTakeHome)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-500">Your guest pays</dt>
          <dd className="font-semibold text-ink">{inr(result.guestPays)}</dd>
        </div>
      </dl>

      {result.capped && (
        <p className="mt-3 rounded-[6px] bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
          Starter caps at {inr0(plan.maxServicePrice)} per session. Upgrade to Host+ to price above it.
        </p>
      )}
    </div>
  );
}

export default function EarningsCalculator() {
  const [earning, setEarning] = useState(1000);
  const [bookings, setBookings] = useState(10);

  const results = useMemo(
    () => CALC_PLANS.map((p) => monthlyForPlan(p, earning, bookings, DEFAULT_GST_RATE)),
    [earning, bookings]
  );

  // Best = highest net monthly; a capped Starter can't be the winner above its ceiling.
  const eligible = results.filter((r) => !r.capped);
  const best = (eligible.length ? eligible : results).reduce((a, b) =>
    b.netMonthly > a.netMonthly ? b : a
  );

  const canonical = `${SITE_URL}/earnings-calculator`;

  return (
    <div className="min-h-screen" style={{ background: "#f7f5ef" }}>
      <Seo
        title="Earnings Calculator | Book A Sloth"
        description="See exactly what you take home on Book A Sloth. Enter your price and monthly bookings to compare your net income across Starter, Host+, and Studio."
        canonical={canonical}
      />
      <div className="app-container py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">What will you actually take home?</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
            Set what you want to earn per session and how many you do a month. We&rsquo;ll show your real
            monthly income on each plan — after every charge and the plan fee — and which plan pays you the
            most at your volume.
          </p>

          {/* Inputs */}
          <div className="mt-8 grid gap-6 rounded-[6px] border border-black/5 bg-white p-6 sm:grid-cols-2 sm:p-7">
            <Field
              label="You want to earn per session"
              hint="what you keep"
              prefix="₹"
              value={earning}
              min={100}
              max={10000}
              step={50}
              onChange={(v) => setEarning(v === "" ? "" : Math.max(0, Number(v)))}
            />
            <Field
              label="Sessions per month"
              hint="your volume"
              value={bookings}
              min={1}
              max={100}
              step={1}
              onChange={(v) => setBookings(v === "" ? "" : Math.max(0, Number(v)))}
            />
          </div>

          {/* Headline */}
          <div className="mt-6 flex items-center gap-3 rounded-[6px] border border-black/5 bg-white p-5">
            <span
              className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[6px]"
              style={{ color: ACCENT[best.plan.key], background: `${ACCENT[best.plan.key]}14` }}
            >
              <TrendingUp size={20} />
            </span>
            <p className="text-sm text-neutral-700">
              At <strong>{Math.floor(Number(bookings) || 0)}</strong> sessions a month of{" "}
              <strong>{inr0(earning)}</strong>, you keep the most on{" "}
              <strong style={{ color: ACCENT[best.plan.key] }}>{best.plan.name}</strong> —{" "}
              <strong>{inr0(best.netMonthly)}/month</strong>.
            </p>
          </div>

          {/* Plan cards */}
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {results.map((r) => (
              <PlanResult key={r.plan.key} result={r} best={best.plan.key} />
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <Link
              to={ROUTE_START}
              className="inline-flex items-center justify-center rounded-[6px] bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-95"
            >
              Start earning on Book A Sloth
            </Link>
            <Link to="/pricing" className="text-sm font-semibold text-primary hover:underline">
              See full plan comparison →
            </Link>
          </div>

          {/* Notes */}
          <div className="mt-8 flex gap-2.5 rounded-[6px] border border-black/5 bg-white/60 p-4 text-xs leading-relaxed text-neutral-500">
            <Info size={15} className="mt-0.5 flex-shrink-0" />
            <div className="space-y-1.5">
              <p>
                An illustration, not a quote. Figures assume 18% GST, which applies to most service
                categories; some categories differ. Your exact price is confirmed when you list a service.
              </p>
              <p>
                Your take-home is the same whether or not you&rsquo;re GST-registered — registration only
                changes the paperwork, not what you keep. See the{" "}
                <Link to="/host-fees" className="text-primary hover:underline">
                  Host Fee &amp; Payment Schedule
                </Link>{" "}
                for the full breakdown.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

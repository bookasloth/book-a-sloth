import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sprout, Rocket } from "lucide-react";
import { FREE_PLAN, PREMIUM_PLAN, PREMIUM_PER_DAY, PREMIUM_ANNUAL_SAVE_PCT } from "../../data/plans";
import useFeeOnly from "../../hooks/useFeeOnly";

const ROUTE_START = "/be-a-sloth"; // must match Home.jsx
const ICONS = { Sprout, Rocket };

function AccentIcon({ name, accent, size = 20 }) {
  const Icon = ICONS[name] ?? Rocket;
  return (
    <span
      className="inline-flex h-10 w-10 items-center justify-center rounded-[6px]"
      style={{ color: accent, background: `${accent}14`, boxShadow: `0 0 18px ${accent}55` }}
    >
      <Icon size={size} strokeWidth={1.75} />
    </span>
  );
}

function Persona({ plan }) {
  return (
    <div className="mt-7 flex items-start gap-3 border-t border-black/5 pt-5">
      <AccentIcon name={plan.icon} accent={plan.accent} size={18} />
      <div>
        <p className="text-sm font-semibold text-ink">{plan.persona.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{plan.persona.blurb}</p>
      </div>
    </div>
  );
}

function Features({ plan }) {
  return (
    <>
      {plan.intro && <p className="mt-7 text-sm font-semibold text-ink">{plan.intro}</p>}
      <ul className={`space-y-3 ${plan.intro ? "mt-4" : "mt-7"}`}>
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600">
            <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: plan.accent }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

function PlanCard({ plan, yearly, children }) {
  const recommended = !!plan.recommended;
  return (
    <div
      className={`relative flex h-full flex-col rounded-[6px] border bg-white p-7 sm:p-8 ${
        recommended ? "" : "border-black/5 shadow-[0_8px_30px_rgba(26,26,26,0.05)]"
      }`}
      style={
        recommended
          ? { borderColor: `${plan.accent}4d`, boxShadow: `0 24px 60px -30px ${plan.accent}73` }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <span
          className="rounded-[6px] border px-2.5 py-1 font-heading text-lg font-bold"
          style={{ color: plan.accent, borderColor: `${plan.accent}33` }}
        >
          {plan.name}
        </span>
        {recommended ? (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ background: plan.accent }}
          >
            Save {PREMIUM_ANNUAL_SAVE_PCT}%
          </span>
        ) : (
          <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-primary">{plan.badge}</span>
        )}
      </div>
      <p className="mt-3 text-sm text-neutral-500">{plan.tagline}</p>
      {children}
      <Features plan={plan} />
      <div className="flex-1" />
      <Persona plan={plan} />
    </div>
  );
}

export default function PricingCards() {
  const [yearly, setYearly] = useState(true);
  // Interim (fee-only) mode: hide the free plan from the pricing display. Free
  // signup still works — we just don't advertise it. Reverts on Route go-live.
  const feeOnly = useFeeOnly();

  // Yearly is the headline: ₹3,599 is where the "under ₹10 a day" figure comes
  // from. Monthly (₹399) is shown as the alternative, never as the anchor.
  const price = yearly ? PREMIUM_PLAN.yearly : PREMIUM_PLAN.monthly;

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-black/5 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${!yearly ? "bg-ink text-white" : "text-neutral-500 hover:text-ink"}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${yearly ? "bg-ink text-white" : "text-neutral-500 hover:text-ink"}`}
          >
            Yearly
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${yearly ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}>
              Best value
            </span>
          </button>
        </div>
      </div>

      <div className={`mt-10 grid gap-5 ${feeOnly ? "mx-auto max-w-lg" : "md:grid-cols-2"}`}>
        {/* Sloth — free (hidden in interim fee-only mode; free signup still works) */}
        {!feeOnly && (
          <PlanCard plan={FREE_PLAN} yearly={yearly}>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-5xl font-extrabold text-ink">₹0</span>
              <span className="mb-1.5 text-sm text-neutral-400">/ forever</span>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              We take 5% when you get paid. Nothing when you don't.
            </p>
            <Link
              to={ROUTE_START}
              className="mt-6 inline-flex items-center justify-center rounded-[6px] bg-ink px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 hover:no-underline"
            >
              Start free
            </Link>
          </PlanCard>
        )}

        {/* Sloth Active — premium */}
        <PlanCard plan={PREMIUM_PLAN} yearly={yearly}>
          <div className="mt-6 flex items-end gap-2">
            <span className="text-5xl font-extrabold text-ink">₹{price.toLocaleString("en-IN")}</span>
            <span className="mb-1.5 text-sm text-neutral-400">/ {yearly ? "year" : "month"}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            {yearly
              ? `under ${PREMIUM_PER_DAY} a day · incl. GST`
              : `or ₹${PREMIUM_PLAN.yearly.toLocaleString("en-IN")}/year and save ${PREMIUM_ANNUAL_SAVE_PCT}% · incl. GST`}
          </p>
          <Link
            to={ROUTE_START}
            className="mt-6 inline-flex items-center justify-center rounded-[6px] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 hover:no-underline"
            style={{ background: PREMIUM_PLAN.accent }}
          >
            Go Premium
          </Link>
        </PlanCard>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sprout, Sparkles, Rocket, Building2 } from "lucide-react";
import { PAID_PLANS, STARTER_PLAN, ENTERPRISE_PLAN } from "../../data/plans";

const ROUTE_START = "/be-a-sloth"; // must match Home.jsx (confirmed in Task 2 Step 1)
const ICONS = { Sprout, Sparkles, Rocket, Building2 };

function AccentIcon({ name, accent, size = 20 }) {
  const Icon = ICONS[name] ?? Sparkles;
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
      <ul className="mt-4 space-y-3">
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

function PaidCard({ plan, yearly }) {
  const isEnterprise = plan.slug === "enterprise";
  const perMo = isEnterprise ? 0 : Math.round(plan.yearly / 12);
  const savePct = isEnterprise ? 0 : Math.round((1 - plan.yearly / 12 / plan.monthly) * 100);
  const bigPrice = yearly ? plan.yearly : plan.monthly;
  const cta = isEnterprise ? plan.cta : { label: "Let's Get Started", to: ROUTE_START };

  return (
    <div
      className={`relative flex h-full flex-col rounded-[6px] border bg-white p-7 sm:p-8 ${
        plan.recommended ? "" : "border-black/5 shadow-[0_8px_30px_rgba(26,26,26,0.05)]"
      }`}
      style={
        plan.recommended
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
        {plan.recommended ? (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ background: plan.accent }}
          >
            Recommended
          </span>
        ) : (
          <AccentIcon name={plan.icon} accent={plan.accent} />
        )}
      </div>
      <p className="mt-3 text-sm text-neutral-500">{plan.tagline}</p>

      <div className="mt-6 flex items-end gap-2">
        {isEnterprise ? (
          <span className="text-4xl font-extrabold text-ink">Custom</span>
        ) : (
          <>
            <span className="text-5xl font-extrabold text-ink">₹{bigPrice.toLocaleString("en-IN")}</span>
            <span className="mb-1.5 text-sm text-neutral-400">/ {yearly ? "year" : "month"}</span>
            {yearly && (
              <span className="mb-2 rounded-full bg-sand px-2 py-0.5 text-xs font-semibold" style={{ color: plan.accent }}>
                Save {savePct}%
              </span>
            )}
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-400">
        {isEnterprise ? "Volume pricing — tailored to your team" : yearly ? `just ₹${perMo}/month, billed yearly` : "billed monthly"}
      </p>

      <Link
        to={cta.to}
        className="mt-6 inline-flex items-center justify-center rounded-[6px] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 hover:no-underline"
        style={{ background: plan.recommended ? plan.accent : "#1a1a1a" }}
      >
        {cta.label}
      </Link>

      <Features plan={plan} />
      <div className="flex-1" />
      <Persona plan={plan} />
    </div>
  );
}

export default function PricingCards() {
  const [yearly, setYearly] = useState(true);
  const paid = [...PAID_PLANS, ENTERPRISE_PLAN]; // Host+, Studio, Enterprise

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

      {/* Top row: 3 paid cards */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {paid.map((p) => (
          <PaidCard key={p.slug} plan={p} yearly={yearly} />
        ))}
      </div>

      {/* Starter — wide card */}
      <div className="mt-5 rounded-[6px] border border-black/5 bg-white p-7 shadow-[0_8px_30px_rgba(26,26,26,0.05)] sm:p-8 lg:flex lg:items-center lg:gap-8">
        <div className="lg:shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className="rounded-[6px] border px-2.5 py-1 font-heading text-lg font-bold"
              style={{ color: STARTER_PLAN.accent, borderColor: `${STARTER_PLAN.accent}33` }}
            >
              {STARTER_PLAN.name}
            </span>
            <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-primary">{STARTER_PLAN.badge}</span>
            <AccentIcon name={STARTER_PLAN.icon} accent={STARTER_PLAN.accent} />
          </div>
          <p className="mt-2 text-sm text-neutral-500">{STARTER_PLAN.tagline}</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-extrabold text-ink">₹0</span>
            <span className="mb-1 text-sm text-neutral-400">/ forever</span>
          </div>
        </div>
        <ul className="mt-6 grid gap-3 lg:mt-0 lg:flex-1 lg:grid-cols-2 lg:gap-x-8">
          {STARTER_PLAN.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600">
              <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: STARTER_PLAN.accent }} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 lg:mt-0 lg:shrink-0">
          <Link
            to={ROUTE_START}
            className="inline-flex w-full items-center justify-center rounded-[6px] bg-ink px-7 py-3 text-sm font-semibold text-white transition-transform hover:bg-neutral-800 hover:no-underline lg:w-auto"
          >
            Let's Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

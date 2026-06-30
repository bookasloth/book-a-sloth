import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import Seo from "../components/common/Seo";
import { ALL_PLANS, PLAN_COLUMNS, PLAN_MATRIX } from "../data/plans";

// /pricing — dedicated public pricing page. Plan cards + full feature comparison.
// Single-sourced from client/src/data/plans.js (mirrors DB migration v3.55), so
// the table here, the homepage cards and the enforced limits never drift apart.

const ROUTE_START = "/be-a-sloth";

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Book A Sloth",
  description:
    "Zero-commission appointment booking for Indian creators — publish services, get booked via OTP or login, collect payments through Razorpay.",
  brand: { "@type": "Brand", name: "Book A Sloth" },
  offers: [
    { "@type": "Offer", name: "Starter", price: "0", priceCurrency: "INR" },
    { "@type": "Offer", name: "Host+", price: "199", priceCurrency: "INR" },
    { "@type": "Offer", name: "Studio", price: "499", priceCurrency: "INR" },
  ],
};

// One comparison cell: ✓ / ✗ for booleans, verbatim text otherwise.
const Cell = ({ value }) => {
  if (value === true) return <Check size={18} className="mx-auto text-primary" aria-label="Included" />;
  if (value === false)
    return <X size={16} className="mx-auto text-neutral-300" aria-label="Not included" />;
  return <span className="text-sm text-neutral-700">{value}</span>;
};

export default function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <main className="bg-white">
      <Seo
        title="Pricing — Book A Sloth | Zero-commission booking from ₹0"
        description="Simple, honest pricing. Start free, keep 0% commission on paid plans. Compare Starter, Host+ and Studio side by side — prices in INR, excl. GST."
        jsonLd={JSON_LD}
      />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="px-5 pb-10 pt-16 sm:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            Simple pricing. <span className="text-primary">Zero commission.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[640px] text-neutral-500">
            Start free, upgrade when your bookings demand it, and keep everything you earn — always.
          </p>

          {/* Billing toggle — yearly active by default */}
          <div className="mt-8 flex justify-center">
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
        </div>
      </section>

      {/* ── Plan cards ─────────────────────────────────────── */}
      <section className="px-5 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {ALL_PLANS.map((p) => {
            const isFree = p.monthly === 0 && p.yearly === 0;
            const bigPrice = yearly ? p.yearly : p.monthly;
            const perMo = isFree ? 0 : Math.round(p.yearly / 12);
            const savePct = isFree ? 0 : Math.round((1 - p.yearly / 12 / p.monthly) * 100);
            return (
              <div
                key={p.name}
                className={`relative flex h-full flex-col rounded-[6px] border bg-white p-7 sm:p-8 ${
                  p.recommended
                    ? "border-primary/30 shadow-[0_24px_60px_-30px_rgba(254,81,0,0.45)] ring-1 ring-primary/20"
                    : "border-black/5 shadow-[0_8px_30px_rgba(26,26,26,0.05)]"
                }`}
              >
                {p.recommended && (
                  <span className="absolute right-6 top-6 rounded-full bg-primary-cta px-3 py-1 text-xs font-semibold text-white">
                    Recommended
                  </span>
                )}
                <div className="flex items-center gap-2.5">
                  <h3 className="font-heading text-2xl font-bold text-ink">{p.name}</h3>
                  {p.badge && (
                    <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-primary">{p.badge}</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-500">{p.tagline}</p>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-5xl font-extrabold text-ink">₹{bigPrice.toLocaleString("en-IN")}</span>
                  <span className="mb-1.5 text-sm text-neutral-400">/ {isFree ? "forever" : yearly ? "year" : "month"}</span>
                  {yearly && !isFree && (
                    <span className="mb-2 rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-primary">
                      Save {savePct}%
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-neutral-400">
                  {isFree ? "free, forever" : yearly ? `just ₹${perMo}/month, billed yearly` : "billed monthly"}
                </p>

                <Link
                  to={ROUTE_START}
                  className={`mt-6 inline-flex items-center justify-center rounded-[6px] px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 hover:no-underline ${
                    p.recommended ? "bg-primary-cta text-white hover:bg-primary-dark" : "bg-ink text-white hover:bg-neutral-800"
                  }`}
                >
                  Let's Get Started
                </Link>

                {p.intro && <p className="mt-7 text-sm font-semibold text-ink">{p.intro}</p>}
                <ul className="mt-4 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600">
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mx-auto mt-6 max-w-5xl text-center text-xs text-neutral-400">
          0% commission on paid plans · Prices in INR, excl. GST · ~2.4% payment gateway fee applies (not our charge) · Cancel anytime
        </p>
      </section>

      {/* ── Full feature comparison ────────────────────────── */}
      <section className="px-5 pb-20 pt-16 sm:px-8 lg:pt-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-extrabold text-ink sm:text-4xl">Compare every feature</h2>
          <p className="mx-auto mt-3 max-w-[600px] text-center text-neutral-500">
            Everything each plan includes — no fine print, no surprises.
          </p>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="py-3 pr-4 text-sm font-semibold text-neutral-500">Feature</th>
                  {PLAN_COLUMNS.map((c) => (
                    <th key={c.key} className="px-3 py-3 text-center">
                      <span className={`text-base font-bold ${c.recommended ? "text-primary" : "text-ink"}`}>{c.name}</span>
                      {c.recommended && (
                        <span className="ml-1.5 align-middle text-[10px] font-bold uppercase tracking-wide text-primary">★</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAN_MATRIX.map((section) => (
                  <FragmentSection key={section.group} section={section} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ────────────────────────────────────── */}
      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto max-w-3xl rounded-[10px] bg-ink px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-extrabold text-primary sm:text-4xl">Ready when you are.</h2>
          <p className="mx-auto mt-3 max-w-[520px] text-neutral-300">
            Start free in minutes. Upgrade in one click whenever your bookings grow.
          </p>
          <Link
            to={ROUTE_START}
            className="mt-7 inline-flex items-center justify-center rounded-[6px] bg-primary-cta px-7 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-dark hover:no-underline"
          >
            Let's Get Started
          </Link>
        </div>
      </section>
    </main>
  );
}

// A grouped block of comparison rows with a section header row.
function FragmentSection({ section }) {
  return (
    <>
      <tr className="bg-sand/40">
        <td colSpan={PLAN_COLUMNS.length + 1} className="px-1 py-2.5 text-xs font-bold uppercase tracking-wide text-primary">
          {section.group}
        </td>
      </tr>
      {section.rows.map((row) => (
        <tr key={row.label} className="border-b border-black/5">
          <td className="py-3 pr-4 text-sm text-neutral-700">{row.label}</td>
          <td className="px-3 py-3 text-center"><Cell value={row.starter} /></td>
          <td className="px-3 py-3 text-center"><Cell value={row.hostplus} /></td>
          <td className="px-3 py-3 text-center"><Cell value={row.studio} /></td>
        </tr>
      ))}
    </>
  );
}

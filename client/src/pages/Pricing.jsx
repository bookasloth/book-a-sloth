import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import Seo from "../components/common/Seo";
import { ogCard } from "../config/ogImages";
import { PLAN_COLUMNS, PLAN_MATRIX } from "../data/plans";
import PricingCards from "../components/pricing/PricingCards";

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
    { "@type": "Offer", name: "Starter", price: "0", priceCurrency: "INR", availability: "https://schema.org/InStock" },
    { "@type": "Offer", name: "Host+", price: "229", priceCurrency: "INR", availability: "https://schema.org/InStock" },
    { "@type": "Offer", name: "Studio", price: "555", priceCurrency: "INR", availability: "https://schema.org/InStock" },
  ],
  // No aggregateRating: Google penalises self-serving ratings that aren't
  // backed by real, verifiable reviews. Re-add (with an on-page badge) only
  // when sourced from actual review data — see enterpriseSeo.js for the pattern.
};

// One comparison cell: ✓ / ✗ for booleans, verbatim text otherwise.
const Cell = ({ value }) => {
  if (value === true) return <Check size={18} className="mx-auto text-primary" aria-label="Included" />;
  if (value === false)
    return <X size={16} className="mx-auto text-neutral-300" aria-label="Not included" />;
  return <span className="text-sm text-neutral-700">{value}</span>;
};

export default function Pricing() {
  return (
    <main className="bg-white">
      <Seo
        title="Pricing — Book A Sloth | Zero-commission booking from ₹0"
        description="Simple, honest pricing. Start free, keep 0% commission on paid plans. Compare Starter, Host+ and Studio side by side — prices in INR, excl. GST."
        image={ogCard('pricing')}
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
        </div>
      </section>

      {/* ── Plan cards ─────────────────────────────────────── */}
      <section className="px-5 sm:px-8">
        <div className="mx-auto max-w-[1050px]">
          <PricingCards />
        </div>
        <p className="mx-auto mt-6 max-w-[1050px] text-center text-xs text-neutral-400">
          0% commission on paid plans · Prices in INR, excl. GST · ~2.4% payment gateway fee applies (not our charge) · Cancel anytime
        </p>
      </section>

      {/* ── Full feature comparison ────────────────────────── */}
      <section className="px-5 pb-20 pt-16 sm:px-8 lg:pt-24">
        <div className="mx-auto max-w-[1050px]">
          <h2 className="text-center text-3xl font-extrabold text-ink sm:text-4xl">Compare every feature</h2>
          <p className="mx-auto mt-3 max-w-[600px] text-center text-neutral-500">
            Everything each plan includes — no fine print, no surprises.
          </p>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
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
            className="mt-7 inline-flex items-center justify-center rounded-[6px] bg-primary-cta px-7 py-3 text-sm font-semibold text-white transition-transform hover:bg-primary-dark hover:no-underline"
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
          {PLAN_COLUMNS.map((c) => (
            <td key={c.key} className="px-3 py-3 text-center"><Cell value={row[c.key]} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

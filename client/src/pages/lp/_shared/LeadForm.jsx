import { useState } from "react";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import useUtm from "../../../hooks/useUtm";
import { analytics, EVENTS } from "../../../services/analytics";

/**
 * Shared lead-capture CTA for every /lp/* landing page.
 *
 *   email submit → LEAD_CAPTURED (→ Meta 'Lead') + stored lead → Google signup
 *   "continue with Google" → LP_CTA_CLICKED → Google signup (no email)
 *
 * Kept in one place so the conversion-critical path (validation, event names,
 * handoff) is identical across all LPs. Pass a unique `slug` per page and a
 * `slot` per instance ("hero" / "final") for funnel attribution.
 *
 * `mode="email"` (default) renders the email field + "or continue with Google".
 * `mode="google-only"` renders a single one-click Google CTA (no email field).
 */
export default function LeadForm({
  slug,
  slot,
  dark = false,
  ctaLabel = "Start free — ₹0 to begin",
  mode = "email",
}) {
  const { startVendorGoogleAuth } = useAuth();
  const utm = useUtm();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const handoff = async (withEmail) => {
    if (busy) return;

    if (withEmail) {
      const e = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        toast.error("Enter a valid email to continue.");
        return;
      }
      analytics.track(EVENTS.LEAD_CAPTURED, { slug, slot, ...utm });
      try {
        sessionStorage.setItem(
          "bas_lp_lead",
          JSON.stringify({ email: e, slug, utm, ts: Date.now() })
        );
      } catch (_) {
        /* storage blocked — lead still tracked above */
      }
    }

    analytics.track(EVENTS.LP_CTA_CLICKED, {
      slug,
      slot,
      with_email: !!withEmail,
      ...utm,
    });

    setBusy(true);
    try {
      await startVendorGoogleAuth("signup");
    } catch (err) {
      setBusy(false);
      toast.error(
        err?.response?.data?.message || "Could not start sign-up. Please try again."
      );
    }
  };

  const labelId = `lead-email-${slot}`;

  // Shared CTA pill style — single source so the two render paths can't drift.
  const ctaBtn =
    "inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-8px_rgba(254,81,0,0.5)] transition-all hover:-translate-y-0.5 hover:bg-primary-dark disabled:opacity-60 disabled:hover:translate-y-0";

  if (mode === "google-only") {
    return (
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => handoff(false)}
          disabled={busy}
          className={`${ctaBtn} w-full`}
        >
          {busy ? "Opening…" : ctaLabel}
          {!busy && <ArrowRight size={15} />}
        </button>
        <p className={`mt-2.5 text-center text-xs ${dark ? "text-white/60" : "text-neutral-500"}`}>
          No card · Free plan available · Cancel anytime
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handoff(true);
      }}
      className="w-full max-w-md"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={labelId} className="sr-only">
          Your email
        </label>
        <input
          id={labelId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="!h-12 flex-1 rounded-full border border-black/10 bg-white px-5 text-sm text-ink shadow-sm focus:!border-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className={`${ctaBtn} shrink-0`}
        >
          {busy ? "Opening…" : ctaLabel}
          {!busy && <ArrowRight size={15} />}
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => handoff(false)}
          disabled={busy}
          className={`text-xs font-medium underline-offset-2 hover:underline ${
            dark ? "text-white/70" : "text-neutral-500"
          }`}
        >
          or continue with Google →
        </button>
        <span className={`text-xs ${dark ? "text-white/50" : "text-neutral-500"}`}>
          No card · Free plan available · Cancel anytime
        </span>
      </div>
    </form>
  );
}

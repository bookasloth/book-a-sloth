/*
  Shared primitives for the "<Competitor> Alternative" landing pages
  (Acuity / Setmore / Simplybook / Zoho). Extracted from four byte-identical
  copies: the Google-only CTA button, the accent-shape card, the avatar, the
  INR formatter, and the BAS brand palette.

  Each page keeps its own bespoke body + brand colours and passes its `slug`
  (analytics) and brand `accent` down. Calendly (/lp/calendly-alternative) and
  Topmate (TopmateVsBookASloth) deliberately keep their own bespoke primitives —
  different visual design — do NOT migrate them here.
*/
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import useUtm from "../../hooks/useUtm";
import { analytics, EVENTS } from "../../services/analytics";

export const ROUTE_START = "/be-a-sloth"; // every CTA hands off to the real signup funnel

/* BAS brand palette — shared across all four pages */
export const BAS_ORANGE = "#FE5100"; // brand accent / large text
export const BAS_CTA = "#c23d00";    // brand orange for white-text buttons (WCAG AA)
export const BAS_PEACH = "#FFE9DD";  // primary-light tint

export const fmtINR = (n) => `₹${n.toLocaleString("en-IN")}`;

/* ─────────────────────────────────────────────
   CTA — Google-only signup. Every CTA → /be-a-sloth. Pass the page `slug`.
   ───────────────────────────────────────────── */
export function LpCta({ slug, slot, label = "Get started", variant = "primary", className = "" }) {
  const utm = useUtm();
  const track = () => analytics.track(EVENTS.LP_CTA_CLICKED, { slug, slot, ...utm });

  if (variant === "google") {
    return (
      <Link
        to={ROUTE_START}
        onClick={track}
        className={`flex w-full items-center justify-center gap-3 rounded-[6px] border-2 border-black/10 bg-white py-3 text-sm font-semibold text-ink shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition hover:-translate-y-0.5 hover:border-black/20 hover:no-underline ${className}`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        {label}
      </Link>
    );
  }

  return (
    <Link
      to={ROUTE_START}
      onClick={track}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-95 hover:no-underline ${className}`}
      style={{ background: BAS_CTA }}
    >
      {label}
      <ArrowRight size={14} />
    </Link>
  );
}

/* ─────────────────────────────────────────────
   AccentCard — brand-coloured abstract shapes. Pass brand `accent`.
   ───────────────────────────────────────────── */
export function AccentCard({ accent, className = "", children, ...rest }) {
  return (
    <div className={`group relative overflow-hidden ${className}`} {...rest}>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[0.08] transition-all duration-500 ease-out group-hover:scale-[1.45] group-hover:opacity-[0.22]"
        style={{ background: accent }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-[42%] opacity-[0.06] transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:opacity-[0.16]"
        style={{ background: accent }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(130% 130% at 100% 0%, ${accent}1f, transparent 55%)` }}
      />
      <div className="relative z-[1] h-full">{children}</div>
    </div>
  );
}

/* Avatar with initials fallback. Pass brand `accent`; `fallback` glyph when no name. */
export function Avatar({ src, name, accent, fallback = "★" }) {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: `${accent}1a`, color: accent }}
      >
        {name?.charAt(0) || fallback}
      </div>
    );
  }
  return (
    <img
      src={src}
      onError={() => setErr(true)}
      alt={name}
      loading="lazy"
      className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
    />
  );
}

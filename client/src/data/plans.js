/**
 * Single source of truth for Book A Sloth plan pricing + features (display side).
 *
 * Imported by the homepage (Home.jsx), the dedicated pricing page (Pricing.jsx),
 * the competitor landing pages (lp/*Alternative) and the profession landings, so
 * prices never drift between surfaces. Display names follow themeUtils
 * PLAN_DISPLAY (DB slugs free / premium → Sloth / Sloth Active).
 *
 * KEEP IN SYNC with server migration v3.165 (subscription_plans) — the DB is the
 * enforcement authority; this file is the marketing copy that mirrors it.
 *
 * ── PRICES ARE GST-INCLUSIVE ────────────────────────────────────────────────
 * What the customer is actually charged. The DB stores the ex-GST base and the
 * engine adds 18% on top, so the numbers here are the DB values grossed up:
 *
 *   monthly   DB 338.13  →  ₹399   (charged ₹398.99 — a paisa under, never over)
 *   yearly    DB 3050.00 →  ₹3,599
 *
 * Yearly saves ₹1,189 = 24.83%, advertised as "Save 25%". ₹3,599 / 365 = ₹9.86,
 * the "under ₹10 a day" headline. Every price shown to a customer must stay on
 * this one basis — quoting monthly ex-GST against yearly incl-GST is what made
 * the old ₹300/₹3,650 pair read as if annual cost MORE than twelve months.
 */

export const FREE_PLAN = {
  name: "Sloth",
  slug: "free",
  tagline: "Everything you need to get booked.",
  badge: "5% per booking",
  accent: "#4AB765",
  icon: "Sprout",
  persona: { title: "Just starting out", blurb: "Your booking page, your first customers, at zero cost." },
  monthly: 0,
  yearly: 0,
  features: [
    "Unlimited services & bookings",
    "Booking page + UPI payments",
    "24-hour booking reminders",
    "Online & in-person appointments",
    "Google Calendar & Meet",
    "3 digital products",
    "GST invoices & payouts",
  ],
};

export const PREMIUM_PLAN = {
  name: "Sloth Active",
  slug: "premium",
  tagline: "Keep every rupee. Automate the rest.",
  // GST-inclusive — see the header note.
  monthly: 399,
  yearly: 3599,
  recommended: true,
  accent: "#FE5100",
  icon: "Rocket",
  persona: { title: "Booked and growing", blurb: "Earning over ₹6,000 a month? This already costs you less than the 5%." },
  intro: "Everything in Sloth, plus:",
  features: [
    "0% commission — keep it all",
    "Client CRM with notes & history",
    "1-hour reminders + reschedule alerts",
    "Follow-up & rebook automation",
    "Unlimited digital products",
    "2 calendar integrations",
    "Unlimited AI service writing",
    "Priority WhatsApp support",
  ],
};

/** Array form — several surfaces index into this ([0] / [length-1]). */
export const PAID_PLANS = [PREMIUM_PLAN];

/** Both plans in display order. */
export const ALL_PLANS = [FREE_PLAN, PREMIUM_PLAN];

/** Headline daily figure for Sloth Active: ₹3,599 / 365 = ₹9.86. */
export const PREMIUM_PER_DAY = "₹9.86";

/** Annual saving vs 12 × monthly — kept here so no surface recomputes it wrong. */
export const PREMIUM_ANNUAL_SAVING = PREMIUM_PLAN.monthly * 12 - PREMIUM_PLAN.yearly; // ₹1,189
export const PREMIUM_ANNUAL_SAVE_PCT = Math.round((PREMIUM_ANNUAL_SAVING / (PREMIUM_PLAN.monthly * 12)) * 100); // 25

/* ────────────────────────────────────────────────────────────────────────────
 * Everything both plans include.
 *
 * In a two-plan world most of the old comparison grid collapsed to ✓/✓, which is
 * noise in a table. These are listed once as a reassurance band instead, and the
 * table below carries only what actually DIFFERS.
 * ──────────────────────────────────────────────────────────────────────────── */
export const PLAN_INCLUDED = [
  "Unlimited services",
  "Unlimited bookings",
  "Unlimited service categories",
  "Public booking page + custom URL",
  "Online and in-person appointments",
  "Payment collection via UPI & cards",
  "Booking confirmations (email + WhatsApp)",
  "24-hour booking reminders",
  "Reschedule & cancellation",
  "Google Calendar + Meet",
  "All profile theme colours",
  "GST invoices",
  "Earnings, payouts & transaction history",
  "Guest reviews",
];

/* ────────────────────────────────────────────────────────────────────────────
 * Comparison table — ONLY rows the server actually enforces.
 *
 * Every row here maps to a real gate: commission_percentage, limits.crm,
 * limits.reminder_flows, limits.followup_flows, limits.digital_products,
 * limits.calendar_integrations, limits.ai_generations, support_type.
 *
 * Deliberately ABSENT: advanced_reports and data_export. They live in
 * subscription_plans.features, which nothing on the server reads — a Free
 * account reaches both today. Listing them would be a promise the product does
 * not keep. Add the rows when the gates exist, not before.
 * ──────────────────────────────────────────────────────────────────────────── */
export const PLAN_COLUMNS = [
  { key: "free", name: "Sloth", slug: "free" },
  { key: "premium", name: "Sloth Active", slug: "premium", recommended: true },
];

export const PLAN_MATRIX = [
  {
    group: "Price",
    rows: [
      { label: "Monthly", free: "₹0", premium: "₹399" },
      { label: "Yearly", free: "₹0", premium: "₹3,599" },
      { label: "Commission on your bookings", free: "5%", premium: "0%" },
    ],
  },
  {
    group: "Automation",
    rows: [
      { label: "Booking reminders", free: "24h before", premium: "24h + 1h + reschedule alerts" },
      { label: "Follow-up & rebook automation", free: false, premium: true },
    ],
  },
  {
    group: "Clients",
    rows: [
      { label: "Client CRM — records, history, notes", free: false, premium: true },
    ],
  },
  {
    group: "Limits",
    rows: [
      { label: "Digital products", free: "3", premium: "Unlimited" },
      { label: "Calendar integrations", free: "1 (Google)", premium: "2 (Google + iCal)" },
      { label: "AI service writing", free: "10 per 6 months", premium: "Unlimited" },
    ],
  },
  {
    group: "Support",
    rows: [
      { label: "Support", free: "Email", premium: "Priority — WhatsApp + email" },
    ],
  },
];

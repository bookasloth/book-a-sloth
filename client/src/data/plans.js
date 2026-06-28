/**
 * Single source of truth for Book A Sloth plan pricing + features.
 *
 * Imported by the homepage (Home.jsx) and landing pages (e.g.
 * lp/CalendlyAlternative) so prices never drift between surfaces. Display
 * names follow themeUtils PLAN_DISPLAY (DB slugs starter / creator /
 * professional → Starter / Host+ / Studio).
 *
 * Prices are in INR, exclusive of GST. `monthly` / `yearly` are the headline
 * numbers; each page derives per-month + savings from them.
 */

export const STARTER_PLAN = {
  name: "Starter",
  tagline: "For professionals just getting started.",
  badge: "5% per booking",
  monthly: 0,
  yearly: 0,
  features: [
    "Up to 5 services",
    "200 bookings a year",
    "1 calendar integration",
    "Email reminders",
  ],
};

export const PAID_PLANS = [
  {
    name: "Host+",
    tagline: "For solo creators & freelancers.",
    monthly: 199,
    yearly: 999,
    intro: "What's included:",
    features: [
      "0% commission on bookings",
      "Up to 20 services",
      "2,000 bookings a year",
      "2 calendar integrations (Google Calendar + Zoom)",
      "1 service category",
      "Auto invoices",
      "Basic reports",
      "Client history",
      "Priority email support",
    ],
  },
  {
    name: "Studio",
    tagline: "Top tier, for growing practices & studios.",
    monthly: 499,
    yearly: 3650,
    recommended: true,
    intro: "Everything in Host+, plus:",
    features: [
      "Up to 30 services",
      "3,000 bookings a year",
      "3 calendar integrations (Google Calendar + Zoom + iCal)",
      "3 service categories",
      "Client notes",
      "Advanced reports",
      "Data export",
      "Priority support",
    ],
  },
];

/** All three plans in display order — handy for 3-up pricing grids (landing pages). */
export const ALL_PLANS = [STARTER_PLAN, ...PAID_PLANS];

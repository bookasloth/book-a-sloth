/**
 * Single source of truth for Book A Sloth plan pricing + features (display side).
 *
 * Imported by the homepage (Home.jsx), the dedicated pricing page (Pricing.jsx)
 * and landing pages (e.g. lp/CalendlyAlternative) so prices never drift between
 * surfaces. Display names follow themeUtils PLAN_DISPLAY (DB slugs
 * starter / creator / professional → Starter / Host+ / Studio).
 *
 * KEEP IN SYNC with server migration v3.55 (subscription_plans) — the DB is the
 * enforcement authority; this file is the marketing copy that mirrors it. If you
 * change a number here, change it there too (and re-run on BOTH DBs).
 *
 * Prices are in INR, exclusive of GST. `monthly` / `yearly` are the headline
 * numbers; each page derives per-month + savings from them.
 */

export const STARTER_PLAN = {
  name: "Starter",
  slug: "starter",
  tagline: "For professionals just getting started.",
  badge: "5% per booking",
  accent: "#4AB765",
  icon: "Sprout",
  persona: { title: "Just Starting Out", blurb: "Testing the waters — your first bookings, at zero cost." },
  monthly: 0,
  yearly: 0,
  features: [
    "Up to 3 services",
    "300 bookings a year",
    "1 service category",
    "Booking page + online payments",
    "Community + email support",
  ],
};

export const PAID_PLANS = [
  {
    name: "Host+",
    slug: "creator",
    tagline: "For solo creators & freelancers.",
    monthly: 229,
    yearly: 1499,
    accent: "#269CEF",
    icon: "Sparkles",
    persona: { title: "Solo Creator", blurb: "Booking regularly and want 0% commission + automation." },
    intro: "What's included:",
    features: [
      "0% commission on bookings",
      "Up to 5 services",
      "1,000 bookings a year",
      "5 digital products",
      "2 service categories",
      "Offline appointments",
      "Auto invoices + basic reports",
      "Booking reminder automation (1 flow)",
      "Email + chat support",
    ],
  },
  {
    name: "Studio",
    slug: "professional",
    tagline: "Top tier, for growing practices & studios.",
    monthly: 555,
    yearly: 3650,
    recommended: true,
    accent: "#FE5100",
    icon: "Rocket",
    persona: { title: "Growing Studio", blurb: "A full practice — CRM, analytics, unlimited everything." },
    intro: "Everything in Host+, plus:",
    features: [
      "Unlimited services & bookings",
      "Unlimited digital products & categories",
      "2 calendar integrations (Google + iCal soon)",
      "Client CRM, history & notes",
      "Custom fields + recurring clients",
      "Advanced analytics + data export",
      "Unlimited reminder automation",
      "WhatsApp + call support",
    ],
  },
];

/** Enterprise — no self-serve price; card teases and links to /enterprise. */
export const ENTERPRISE_PLAN = {
  name: "Enterprise",
  slug: "enterprise",
  tagline: "For teams, agencies & multi-location practices.",
  price: "Custom",
  cta: { label: "Talk to Sales", to: "/enterprise" },
  accent: "#FF4D93",
  icon: "Building2",
  intro: "Everything in Studio, plus:",
  features: [
    "SSO & SAML sign-in",
    "Role-based team access",
    "Multi-location & multi-seat",
    "REST API + webhooks",
    "Dedicated SLA & onboarding",
  ],
  persona: { title: "Teams & Agencies", blurb: "Multiple seats, locations and workflows, custom needs." },
};

/** All three plans in display order — handy for 3-up pricing grids (landing pages + /pricing). */
export const ALL_PLANS = [STARTER_PLAN, ...PAID_PLANS];

/* ────────────────────────────────────────────────────────────────────────────
 * Full feature comparison — drives the table on /pricing (Pricing.jsx).
 * Single-sourced here so the comparison grid never drifts from the plan cards.
 * Cell values: true (✓) · false (✗/—) · string (verbatim label).
 * Columns map to DB slugs: starter / creator (Host+) / professional (Studio).
 * ──────────────────────────────────────────────────────────────────────────── */
export const PLAN_COLUMNS = [
  { key: "starter", name: "Starter", slug: "starter" },
  { key: "hostplus", name: "Host+", slug: "creator" },
  { key: "studio", name: "Studio", slug: "professional", recommended: true },
  { key: "enterprise", name: "Enterprise", slug: "enterprise" },
];

export const PLAN_MATRIX = [
  {
    group: "Pricing & commission",
    rows: [
      { label: "Price (monthly)", starter: "₹0", hostplus: "₹229", studio: "₹555", enterprise: "Custom" },
      { label: "Price (yearly)", starter: "₹0", hostplus: "₹1,499", studio: "₹3,650", enterprise: "Custom" },
      { label: "Commission", starter: "5%", hostplus: "0%", studio: "0%", enterprise: "0%" },
      { label: "Support", starter: "Community + Email", hostplus: "Email + Chat", studio: "WhatsApp + Call", enterprise: "Dedicated + SLA" },
    ],
  },
  {
    group: "Limits",
    rows: [
      { label: "Services", starter: "3", hostplus: "5", studio: "Unlimited", enterprise: "Unlimited" },
      { label: "Bookings / year", starter: "300", hostplus: "1,000", studio: "Unlimited", enterprise: "Unlimited" },
      { label: "Digital products", starter: "1", hostplus: "5", studio: "Unlimited", enterprise: "Unlimited" },
      { label: "Service categories", starter: "1", hostplus: "2", studio: "Unlimited", enterprise: "Unlimited" },
      { label: "Calendar integrations", starter: "1", hostplus: "1", studio: "2", enterprise: "Unlimited" },
      { label: "Meeting integrations", starter: "Google", hostplus: "Google", studio: "Google & iCal (Planned)", enterprise: "Google, iCal & custom" },
    ],
  },
  {
    group: "Booking & scheduling",
    rows: [
      { label: "Professional booking page", starter: true, hostplus: true, studio: true, enterprise: true },
      { label: "Online appointments", starter: true, hostplus: true, studio: true, enterprise: true },
      { label: "Offline appointments", starter: false, hostplus: true, studio: true, enterprise: true },
      { label: "Payment collection", starter: true, hostplus: true, studio: true, enterprise: true },
      { label: "Multiple availability schedules", starter: false, hostplus: false, studio: true, enterprise: true },
      { label: "Priority feature access", starter: false, hostplus: false, studio: true, enterprise: true },
    ],
  },
  {
    group: "Notifications",
    rows: [
      { label: "Booking confirmations", starter: true, hostplus: true, studio: true, enterprise: true },
      { label: "Email & WhatsApp notifications", starter: "Partial", hostplus: "Basic", studio: "Advanced", enterprise: "Advanced" },
      { label: "Booking reminder automation", starter: false, hostplus: "1 Flow", studio: "Unlimited", enterprise: "Unlimited" },
    ],
  },
  {
    group: "Clients (CRM)",
    rows: [
      { label: "Booking history", starter: false, hostplus: false, studio: true, enterprise: true },
      { label: "Client records (CRM)", starter: false, hostplus: false, studio: true, enterprise: true },
      { label: "Client history", starter: false, hostplus: false, studio: true, enterprise: true },
      { label: "Client notes", starter: false, hostplus: false, studio: true, enterprise: true },
      { label: "Custom fields", starter: false, hostplus: false, studio: true, enterprise: true },
      { label: "Recurring clients", starter: false, hostplus: false, studio: true, enterprise: true },
    ],
  },
  {
    group: "Invoicing & reports",
    rows: [
      { label: "Auto invoices", starter: false, hostplus: true, studio: true, enterprise: true },
      { label: "Basic reports", starter: false, hostplus: true, studio: true, enterprise: true },
      { label: "Advanced analytics", starter: false, hostplus: false, studio: true, enterprise: true },
      { label: "Data export", starter: false, hostplus: false, studio: true, enterprise: true },
    ],
  },
  {
    group: "Branding",
    rows: [
      { label: "Custom branding", starter: "None", hostplus: "Standard", studio: "Premium", enterprise: "White-label" },
    ],
  },
  {
    group: "Enterprise",
    rows: [
      { label: "SSO & SAML", starter: false, hostplus: false, studio: false, enterprise: true },
      { label: "Role-based access", starter: false, hostplus: false, studio: false, enterprise: true },
      { label: "REST API + webhooks", starter: false, hostplus: false, studio: false, enterprise: true },
    ],
  },
];

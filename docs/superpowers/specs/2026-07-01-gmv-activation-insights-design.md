# GMV + Activation North-Star — Design

_Date: 2026-07-01 · Q1 "Prove value" item #7 (GMV & activation instrumentation)_

## Problem

The Q1 roadmap names "GMV & activation instrumentation" as **foundational — enables all
revenue decisions**. Today the platform has:

- `insightsAdminController.getKpis` + `AdminInsights.jsx` — surfaces platform **revenue**
  (`platform_fee_amount + commission_applied`), booking counts, booking→paid conversion,
  host growth, guest count. All Postgres-truth, gated by `requireAdmin('analytics.view')`.
- PostHog / GA4 / Pixel / Clarity wired but prod keys unset (separate founder action).

**Gap:** there is no **GMV** (gross value transacted to hosts) and no **activation** metric
(host reaching first paid booking). Revenue ≠ GMV — revenue is the platform's take; GMV is
the total marketplace volume the take is a fraction of. Without GMV we can't measure the
North Star the roadmap is built around ("hosts feel money recovered fast"), and without an
activation rate we can't tell what fraction of hosts ever transact.

## Decision summary (locked with founder 2026-07-01)

- **GMV = paid service bookings (gross service value) + paid digital-product sales.**
  Excludes platform subscription revenue (that is the platform's own SaaS income, not
  marketplace GMV).
- **Activation = host with ≥1 paid booking.** Report count, rate, and time-to-first.
- **Placement = extend the existing `AdminInsights` surface.** No new page/route/nav item.

## Approach

Extend `insightsAdminController.getKpis` (server) and `AdminInsights.jsx` (client). Reuse the
existing single-scan + schema-fallback pattern. No new route, controller, permission, nav
item, or migration. Postgres-truth; independent of external analytics keys.

## Metrics

### GMV (gross value transacted to hosts)

There is **no raw service-price column** on `bookings`; the money snapshot stores
`vendor_amount`, `platform_fee_amount`, `platform_fee_gst`, `customer_total`,
`commission_applied`, `commission_gst`. Gross service price is reconstructed exactly:

- **Booking GMV** = Σ over `bookings` where `payment_status = 'paid'` of
  `(customer_total − platform_fee_amount − platform_fee_gst)`.
  - Rationale: `customer_total = service_price + platform_fee + platform_fee_gst` (money
    model v2.2). Subtracting fee + its GST yields the gross service price = the value the
    host transacted.
  - **Pre-v2.2 schema fallback:** if `customer_total` / `platform_fee_gst` are absent, fall
    back to `vendor_amount + commission_applied` (host-take + commission ≈ service price,
    minus razorpay fee — acceptable degraded estimate). Both live DBs are past v3.57, so the
    primary formula is the live path; the fallback only guards a pre-migration DB.
- **Product GMV** = Σ over `product_purchases` where `payment_status = 'paid'` of
  `amount_paid` (the product price paid; `platform_fee` is stored separately and excluded).
- **GMV total** = Booking GMV + Product GMV.
- Reported windows: `total`, `last30`, `prev30` (prior [60d, 30d) window) — same shape as
  the existing revenue tile, giving a 30-day growth delta.
- **Take-rate** = `revenue.total / gmv.total` (revenue already computed in `getKpis`),
  surfaced as a sub-line. Zero-safe when GMV = 0.

### Activation (host first paid booking)

- **Activated host** = distinct `host_id` appearing on ≥1 `payment_status = 'paid'` booking.
- Reported:
  - `activatedCount` — distinct activated hosts.
  - `totalHosts` — all `role = 'host'` profiles (already fetched in `getKpis`).
  - `activationRate` — `activatedCount / totalHosts` as a %, zero-safe.
  - `new30` — hosts whose **first** paid booking falls in the last 30 days (activation
    momentum).
  - `medianTimeToFirstBookingDays` — median of (first paid booking `created_at` −
    host `created_at`) across activated hosts, in days, rounded to 1 decimal. Null when no
    hosts are activated.

## Data flow

- Extend the existing bookings select in `getKpis` to include
  `host_id, created_at, customer_total, platform_fee_amount, platform_fee_gst`
  (already selects `payment_status, platform_fee_amount, commission_applied, created_at`).
- Add one scan of `product_purchases` (`payment_status, amount_paid, created_at`), with a
  schema-fallback if `amount_paid` is absent (skip product GMV → contributes 0).
- All aggregation in-memory, matching the current controller style. A SQL view / materialized
  aggregate is a later optimization once volume grows — **not built here** (noted).
- Preserve the existing v1.7 `commission_applied` fallback branch.

## Client

Two new tiles on `AdminInsights.jsx`, styled to match the existing KPI tiles:

- **GMV** — `total` (₹, formatted), 30-day delta arrow (`last30` vs `prev30`), take-rate
  sub-line ("Platform take: X%").
- **Host Activation** — `activationRate %` as the headline, `activated / total` hosts,
  median time-to-first-booking, `+new30` this month.

Reuse existing currency/number formatting helpers and delta-arrow rendering already present
on the page. No new design tokens.

## Testing

Extend `server/tests/unit/insightsAdminController.test.js`:

- GMV math: booking GMV formula, product GMV, combined total, paid-only filtering,
  30/60-day window split, take-rate ratio.
- Activation: distinct-host counting, rate %, `new30` (first-booking-in-window), median TTFB
  (odd/even count), empty-DB zero/null safety.
- Schema-fallback: bookings pre-v2.2 path and product `amount_paid`-absent path both degrade
  without throwing.

## Out of scope (YAGNI)

- Time-series charts / sparklines (totals + 30-day delta only).
- Refund adjustments to GMV (no refund system exists yet — P3 ledger not built).
- Subscription revenue in GMV (excluded by decision).
- Server-side PostHog funnel query (stays a launchpad link, per existing controller note).
- SuperDashboard KPI mirror.
- SQL-view aggregation (in-memory scan is sufficient at current volume).

## Files touched

- `server/controllers/insightsAdminController.js` — add GMV + activation to `getKpis`.
- `server/tests/unit/insightsAdminController.test.js` — new assertions.
- `client/src/pages/admin/AdminInsights.jsx` — two new tiles.

No migration. No new route/permission/nav.

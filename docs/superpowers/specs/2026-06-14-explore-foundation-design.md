# Explore — Foundation Design (Data Capture now, Feature later)

_Date: 2026-06-14 · Status: **Foundation shipping now; full feature deferred ~3–4 months**_

## TL;DR

The Explore page (public vendor discovery + paid placement) is **not** being built
for the initial launch. The only thing that cannot be backfilled is **behavioural
event history**, so we build _just_ that now and defer everything else.

- **NOW (this sprint):** capture discovery signals — searches (with result counts)
  and profile/service views — into one table, `discovery_events`, from main go-live.
  Hide the WIP Explore page from the public.
- **LATER (~3–4 months):** build the full Explore feature (index, ranking, self-serve
  paid placement, admin tooling, the public page) on top of the accumulated data, so
  "recommended" ranking opens on real signal instead of a cold start.

---

## Why this split

| Asset | Backfillable later? | Decision |
|---|---|---|
| Search index, ranking, checkout, pricing, admin UI, the page itself | ✅ derived from current DB state — rebuild anytime | **defer** |
| Collections, featured/boost/keyword placements | ✅ no value until public | **defer** |
| **Behavioural event history** (searches, views, clicks) | ❌ **gone forever if not logged** | **capture now** |

The product **already** generates the valuable signal: `Home.jsx` has a live search box
(`searchVendors`) and public profile/service pages get viewed. We just open a drain to
catch it.

**Highest-value signal:** searches with `result_count = 0` — people looking for things
we don't have yet. That list is the vendor-recruitment plan and the future
collections/categories roadmap.

---

## Part 1 — What ships NOW (the foundation)

### 1.1 Data model — `discovery_events`

Migration: `server/migrations/v3.0_discovery_events.sql` (applied to live Supabase 2026-06-14).

```
discovery_events
  id BIGSERIAL PK
  event_type   TEXT  CHECK ('search' | 'view' | 'click')
  surface      TEXT  -- home_search | profile | service | category_chip | (future explore_*)
  vendor_id    UUID  → profiles(id) ON DELETE SET NULL
  query        TEXT
  category     TEXT
  result_count INT          -- searches; 0 = unmet demand
  source       TEXT         -- referer / path
  session_id   TEXT         -- anon first-party id (x-sloth-sid), no PII
  user_id      UUID         -- only when request was authenticated
  created_at   TIMESTAMPTZ DEFAULT now()
```
Indexes: `created_at DESC`, `(vendor_id, created_at)`, `(event_type, created_at)`,
partial `(query) WHERE query IS NOT NULL`. RLS enabled, **no policies** → deny-all to
anon/auth; only the service role (`supabaseAdmin`) reads/writes.

The same table is reused by the future Explore feature (it just adds new `surface`
values like `explore_grid`, `sponsored_search`), so there is no schema churn later.

### 1.2 Capture — `server/services/discoveryEvents.js`

`logEvent(evt)` — fire-and-forget. Never throws into the request path, never blocks the
response, swallows a missing-table error (so it is safe to deploy before the migration).
`contextFromReq(req)` extracts `session_id` (header `x-sloth-sid`), `source`, `user_id`.

Wired into three existing public handlers in `server/controllers/hostController.js`:
- `searchVendors` (`GET /api/host/search`) → `event_type:'search'`, `surface:'home_search'`, `query`, `result_count`
- `getHostProfile` (`GET /api/host/:username`) → `event_type:'view'`, `surface:'profile'`, `vendor_id`
- `getServiceBySlug` (`GET /api/host/:username/:slug`) → `event_type:'view'`, `surface:'service'`, `vendor_id`, `category`

Client: `client/src/services/api.js` sets a stable anonymous `sloth_sid` (localStorage)
and sends it as the `x-sloth-sid` header on every request. CORS already reflects custom
request headers — no server CORS change needed.

### 1.3 Hide the WIP Explore page

- `client/src/components/common/Navbar.jsx` — `Explore` removed from `PUBLIC_NAV` and `CUSTOMER_NAV`.
- `client/src/App.jsx` — `/explore` route now `<Navigate to="/" replace />`.
- `Explore.jsx`, `AdminExplore.jsx`, `exploreController.js`, and `v2.9_explore.sql` stay
  in the repo **unchanged and unapplied** as the future foundation. `v2.9` is NOT applied.

### 1.4 Tests
`server/tests/unit/discoveryEvents.test.js` — valid insert, invalid-type drop, zero-result
retention, query truncation, null-coercion, never-throws-on-db-error, `contextFromReq`.

---

## Part 2 — What is DEFERRED (the full feature, ~3–4 months out)

Approved design, to be built later on top of `discovery_events`. **Architecture: Approach A
— 4 isolated layers + a go-live flag.**

### 2.1 Locked decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Build scope | Full revenue infrastructure |
| 2 | Eligibility | Plan tier only (paid plans visible) |
| 3 | Go-live | Manual admin flag at N vendors (N≈25) |
| 4 | Default sort | Rotating seeded shuffle (graduates to a real score once `discovery_events` has signal) |
| 5 | Selling | Self-serve via Razorpay |
| 6 | Visibility source | Plan tier only |
| 7 | Search | Postgres full-text (tsvector + GIN) |
| 8 | Foundation data | Impression/click + search index (THIS sprint does the event half) |
| 9 | Buy timing | Self-serve built, Buy locked behind go-live flag |
| 10 | Pricing | Admin-configurable pricing catalog |

### 2.2 Data model (deferred)

**Keep (already in `v2.9_explore.sql`, unapplied):** `explore_featured_slots`,
`explore_sponsored_keywords`, `explore_collections` (+`_vendors`), `explore_boosts`,
`explore_verified_badges`, `explore_category_sponsors`.

**Add when building the feature:**
- `explore_index` — denormalized searchable vendor row (`search_doc tsvector GENERATED`,
  tags, `min_price`, `completeness`, `is_eligible`), GIN index; refreshed app-side on
  plan/profile/service/review change + nightly `rebuildAll()`.
- `explore_pricing` — admin price catalog (one active row per `product_type`).
- `explore_placement_orders` — Razorpay order → placement fulfillment bridge; webhook
  `payment.captured` creates the real placement row, idempotent on `razorpay_order_id`.
- `explore_stats_daily` — rollup of `discovery_events`/impressions for cheap vendor
  dashboards + billing.
- `explore_settings` — singleton: `is_live`, `min_vendor_threshold`, `purchases_enabled`.
- `profiles.explore_opt_out BOOL`.

### 2.3 The 4 layers (deferred)

1. **Eligibility & Index** — `exploreIndexService.js`: derive eligibility from plan tier,
   maintain `explore_index`. Eligibility = paid plan AND ≥1 active service AND complete
   AND NOT `explore_opt_out`.
2. **Ranking** — `exploreRanking.js` (pure, no DB): `recommended` = rotating seeded shuffle
   seeded by day bucket; boost = weighted nudge; featured = separate top row; sponsored
   search injects ≤3 keyword-bid matches above organic. Every paid surface labeled
   (disclosure). Unit-testable in isolation.
3. **Monetization** — `explorePricingService.js` + `explorePurchaseController.js`:
   `createOrder` (price from catalog → Razorpay order → `explore_placement_orders`),
   webhook activation (idempotent). Buy gated on `purchases_enabled`; buyer must be paid-plan.
4. **Telemetry** — extend capture to Explore surfaces (`explore_grid`, `sponsored_search`),
   roll `discovery_events` → `explore_stats_daily` (cron) for vendor "your Explore
   performance" + future placement billing.

Plus go-live flag + public states: API checks `explore_settings.is_live`; not-live + non-admin
→ "coming soon"; admin `?preview=1` sees the real page while still closed.

### 2.4 Build order (deferred sprint)
1. Apply `v2.9_explore.sql` + the new tables in 2.2.
2. Layer 1 index + eligibility + hooks + backfill existing vendors.
3. Layer 2 ranking + wire real public API (replace the stubs in `exploreController.js`),
   behind `is_live`.
4. Layer 4 Explore-surface telemetry + rollup cron.
5. Layer 3 pricing + checkout + webhook + vendor Buy UI (gated off).
6. Admin: settings flag, pricing editor, stats (extend `AdminExplore.jsx`).
7. QA via admin preview → flip `is_live` + `purchases_enabled` at N vendors.

---

## Where-is-what (quick map)

| Concern | Location |
|---|---|
| **Capture (now)** | `server/services/discoveryEvents.js` |
| Capture hooks | `server/controllers/hostController.js` (`searchVendors`, `getHostProfile`, `getServiceBySlug`) |
| Data table (now) | `discovery_events` — migration `server/migrations/v3.0_discovery_events.sql` |
| Client session id | `client/src/services/api.js` (`sloth_sid` → `x-sloth-sid`) |
| Page hidden | `Navbar.jsx` (nav links removed), `App.jsx` (`/explore` → redirect) |
| **Future page** | `client/src/pages/Explore.jsx` (built, on mock data, unrouted) |
| Future admin | `client/src/pages/admin/AdminExplore.jsx`, `server/controllers/exploreController.js` |
| Future tables | `server/migrations/v2.9_explore.sql` (**unapplied**) |
| This spec | `docs/superpowers/specs/2026-06-14-explore-foundation-design.md` |

## How to resume (when building the feature)
1. Read this spec + `server/controllers/exploreController.js` (stubbed handlers ready to fill).
2. Query `discovery_events` first — top searches, zero-result searches, most-viewed vendors
   — to seed collections/categories and the initial "recommended" score.
3. Follow the build order in 2.4. Replace the mock data in `Explore.jsx` with the real API.
4. Flip `explore_settings.is_live` when vendor count ≥ N.

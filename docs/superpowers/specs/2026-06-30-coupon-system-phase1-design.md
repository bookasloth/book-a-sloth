# Coupon System — Phase 1 Design Spec

**Date:** 2026-06-30
**Branch:** `docs/coupon-system-phase1`
**Status:** Draft for review — **spec only, no implementation**
**Author:** Brainstorming session (Book A Sloth)

---

## 1. Problem & Goal

Book A Sloth wants promo / discount codes. The trigger was a manually-created Razorpay
dashboard offer ("Get ₹500 off on Creator Plan, min ₹1499"). The question: do we need a
checkout system, and can it be built easily?

**Decision:** Razorpay's native offers are **not enough**. They cannot:
- Zero out an order (no free / 100%-off codes).
- Cleanly handle variable guest-booking amounts across different hosts.
- Give us per-code usage caps, per-user limits, or redemption analytics.

So we build our own coupon system. Because all Razorpay orders are already created
server-side, a coupon simply **reduces the order amount before `orders.create`**, and skips
Razorpay entirely when the amount hits ₹0.

## 2. Scope

### Phase 1 (this spec) — Platform-funded coupons only
- Admin-only coupon creation. **Platform eats every discount → zero settlement math → low risk.**
- Works on guest bookings and plan upgrades.
- Discount types: percent, flat, free (100%).
- Constraints: min amount, total max uses, per-user limit, validity window, active toggle,
  scope (plan / booking / both), optional plan-slug restriction.
- Full redemption tracking (who / when / which order / amounts).

### Out of scope — Phase 2 (separate spec, later)
- **Host-funded coupons** (host creates own codes, host eats discount). Requires settlement-
  engine integration to reduce that host's payout, plus stacking rules (platform + host code
  on one booking). Deliberately deferred — it touches money flow and deserves its own
  design/plan cycle. See `settlement-engine-p2` and `financial-ledger` memory notes.
- **Partial (% / flat) discounts on recurring plan subscriptions** — see §7 decision; default
  defers this.

## 3. Ground Truth (current code)

Mapped via codebase exploration on 2026-06-30:

| Aspect | Location | Notes |
|---|---|---|
| Client checkout modal | `client/src/utils/loadRazorpay.js`; `ServiceBooking.jsx:103`; `UpgradePlan.jsx:103` | Standard Razorpay Checkout. Booking = `order_id` mode; plan = `subscription_id` mode. |
| Booking order creation | `server/controllers/paymentController.js:47` `createOrder()`, `orders.create()` at `:118` | `amount` = service price + platform fee + GST, in paise. Route `POST /api/payment/create-order`. |
| Plan one-time order | `server/controllers/paymentController.js:387` `subscribePlan()`, `orders.create()` at `:399` | `amount` = plan price + GST. Route `POST /api/payment/subscribe`. |
| Plan recurring (live path) | `server/controllers/paymentController.js:564` `createVendorSubscription()`, Subscriptions API at `:694` | Mandate-based. **This is what `UpgradePlan.jsx` actually uses.** Route `POST /api/payment/subscription/create`. |
| Plan prices (display) | `client/src/data/plans.js` | Single source for UI. Server authoritative via `subscription_plans` table (`planService.getPlan()`). |
| Razorpay config | `server/services/razorpayConfig.js` | Admin-managed DB (`platform_settings`) + env fallback, encrypted, 60s cache. |
| Coupons today | — | **None exist.** But `coupons.view` / `coupons.manage` permissions already defined in `server/lib/adminPermissions.js`. `/redeem /coupon /promo /deals /offers` already reserved in `server/config/reservedNamespaces.js`. |

**Key implication:** guest bookings + one-time plan orders are simple one-time `orders.create`
calls → a coupon is a trivial amount reduction. The live plan-upgrade path is a **recurring
Razorpay mandate**, whose price is fixed by a Razorpay plan ID — partial discounts there are
not trivial. This drives the §7 decision.

## 4. Data Model

New migration `server/migrations/v3.56_coupons.sql`, applied to **both DBs** (Mumbai prod +
Tokyo staging — note the inverted names per `staging-prod-pipeline-and-db-inversion` memory).

### `coupons`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text, unique | Stored normalized: upper-case, trimmed, NFKC. |
| `description` | text | Admin-facing label, e.g. "Launch — ₹500 off Host+". |
| `discount_type` | text | `percent` \| `flat` \| `free`. |
| `discount_value` | numeric | percent: 0–100; flat: ₹ amount; ignored for `free`. |
| `max_discount` | numeric null | Cap for `percent` type (e.g. 20% up to ₹300). |
| `min_amount` | numeric default 0 | Minimum order ₹ (pre-discount) required. |
| `scope` | text | `plan` \| `booking` \| `both`. |
| `applies_to_plans` | text[] null | Restrict to plan slugs (e.g. `{host_plus}`); null = all plans. |
| `max_uses` | int null | Total redemption cap; null = unlimited. |
| `per_user_limit` | int default 1 | Per-user redemption cap. |
| `used_count` | int default 0 | Denormalized counter; source of truth = `coupon_redemptions`. |
| `starts_at` | timestamptz null | Validity window start; null = immediately. |
| `expires_at` | timestamptz null | Validity window end; null = never. |
| `active` | boolean default true | Hard on/off toggle. |
| `created_by` | uuid | Admin user id. |
| `created_at` | timestamptz default now() | |

Indexes: unique on `code`; partial index on `active`.

### `coupon_redemptions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `coupon_id` | uuid FK → coupons | |
| `user_id` | uuid null | Redeemer (host for plan; resolved guest id for booking). |
| `guest_email` | text null | For guest bookings without an account. |
| `order_type` | text | `plan` \| `booking`. |
| `order_id` | text | `booking_id` or plan order/subscription id. |
| `original_amount` | numeric | Pre-discount ₹. |
| `discount_amount` | numeric | ₹ discounted. |
| `final_amount` | numeric | Charged ₹ (0 for free codes). |
| `status` | text | `reserved` \| `confirmed` \| `released`. See §6 lifecycle. |
| `redeemed_at` | timestamptz default now() | |

Indexes: `coupon_id`; `(coupon_id, user_id)` for per-user counting.

**RLS:** both tables service-role-only (no anon/auth direct access), consistent with the
post-audit lockdown (`security-audit-remediation-2026-06-23` memory). All access via server.

## 5. Server Components

### `server/lib/couponEngine.js` — single source of truth
```
validateCoupon({ code, scope, amount, userId, guestEmail, plan }) ->
  { valid, reason?, discount_type, discount_amount, final_amount, coupon_id }
```
Checks, in order: coupon exists & `active`; within `starts_at`/`expires_at`; `scope` matches
the requested scope; `plan` ∈ `applies_to_plans` (when set); `amount >= min_amount`;
`used_count < max_uses`; per-user redemptions `< per_user_limit`. Computes discount
(percent w/ `max_discount` cap, flat clamped to amount, free = full amount). Returns a clean
verdict. **Pure read + compute; performs no writes.**

Used by BOTH the `/validate` preview endpoint and the apply-at-order-creation path, so preview
and charge can never diverge.

### `server/controllers/couponController.js` + `server/routes/couponRoutes.js`
- `POST /api/coupons/validate` — public, rate-limited. Body `{ code, scope, amount, plan? }`.
  Returns preview verdict. **No redemption.** Never reveals whether a code exists beyond
  valid/invalid (avoid enumeration; align with login-enum hardening posture).
- Admin CRUD under `/api/admin/coupons`, gated by existing `coupons.manage` permission:
  `GET` (list + per-coupon redemption stats), `POST` (create), `PUT /:id` (edit),
  `DELETE /:id` (or soft-deactivate via `active=false`). List view gated by `coupons.view`.

### Discount is always computed server-side
The client `/validate` result is for display only. At order creation the server **re-runs
`couponEngine`** against the authoritative amount and ignores any client-sent discount value.

## 6. Redemption Lifecycle

Goal: don't let a code's `max_uses` be consumed by abandoned checkouts, but don't oversell either.

1. **Order creation** (`createOrder` / plan order): re-validate via engine. If valid, insert a
   `coupon_redemptions` row with `status='reserved'` and increment `used_count` **atomically**
   (DB transaction / RPC) so concurrent redemptions can't exceed `max_uses`.
2. **Payment success** (existing verify/webhook handlers): flip the row to `confirmed`.
3. **Payment failure / expiry / abandoned** (existing slot-reaper or a sweep): flip to
   `released` and decrement `used_count`.
4. **Free (₹0) codes**: no Razorpay round-trip — redeem directly as `confirmed` at grant time.

Per-user and total caps count `reserved` + `confirmed` (not `released`).

## 7. Plan-Discount Decision (recurring mandate)

The live plan-upgrade path is a recurring Razorpay subscription. Options for partial discounts:

- **(A) Free codes only on plans — DEFAULT for Phase 1.** A 100%-off plan code skips Razorpay
  entirely and grants the plan in DB for a set period (great for comping influencers / early
  hosts). Partial % / flat plan discounts deferred. Bookings still get full percent/flat/free.
  Simplest, ships fast, no Razorpay-subscription surgery.
- **(B) One-time order when a coupon is applied.** Applying any plan coupon switches that
  purchase to a single upfront payment (no auto-renew) via the existing `subscribePlan()`
  one-time path → discount is trivial. Host re-subscribes later for auto-renew. Enables partial
  plan discounts now, at the cost of losing auto-renew on the discounted purchase.
- **(C) Razorpay native subscription offer.** Map the coupon to a Razorpay `offer_id` passed at
  subscription creation. Partial discounts + keeps auto-renew, but discount becomes
  Razorpay-defined and adds dashboard-sync work.

**This spec assumes (A).** If reviewer prefers (B) or (C), §4/§5/§6 are unaffected; only the
plan integration point in §8 changes. Free-code grant duration (e.g. 1 month / 1 year / custom
per coupon) is an open sub-decision under (A) — proposed: add `free_grant_days` to `coupons`,
applied only when `discount_type='free'` and `scope` includes `plan`.

## 8. Integration Points

1. **Guest booking** — `createOrder()` (`paymentController.js:47`): accept `coupon_code`, call
   `couponEngine`, reduce `totalPaise`. If final = 0 → skip Razorpay, mark booking paid, write
   `confirmed` redemption, fire existing booking-confirmed notifications.
2. **Plan (under decision A)** — free plan code path: validate, grant plan in DB for
   `free_grant_days`, write `confirmed` redemption, skip Razorpay. Partial plan discounts: not
   wired in Phase 1.
3. **Payment success/failure handlers** — extend to confirm/release reserved redemptions (§6).

## 9. Client Components

- **`<CouponField>`** (new shared component): text input + "Apply" → `POST /api/coupons/validate`
  → shows discount line + new total, or inline error. Clearable / re-editable.
  - Mount on `client/src/pages/ServiceBooking.jsx` (booking checkout).
  - Mount on `client/src/pages/UpgradePlan.jsx` (plan checkout; under (A), only enables free
    codes — partial codes show "not applicable to plans yet").
- **₹0 path:** when final amount is 0, hide the Razorpay modal trigger and show a
  "Confirm (Free)" button that calls the order endpoint directly.

## 10. Admin UI

New "Coupons" admin page (list + create/edit form), under the existing admin shell. Uses the
already-seeded `coupons.view` / `coupons.manage` permissions. List shows code, type/value,
scope, uses (`used_count` / `max_uses`), window, active. Create/edit form maps 1:1 to §4 columns.
Per-coupon drill-in shows redemptions (from `coupon_redemptions`).

## 11. Tracking & Analytics (Phase 1 deliverable)

`coupon_redemptions` + `used_count` answer: who used which code, when, on what order, how much
discounted, current vs max uses, per-user counts. Surfaced in the admin per-coupon view.
(PostHog event emission optional — out of scope unless trivial.)

## 12. Edge Cases & Rules

- Code normalization (upper/trim/NFKC) on both create and lookup → case-insensitive match.
- One coupon per order in Phase 1 (no stacking; stacking is a Phase 2 / host-code concern).
- `min_amount` checked against pre-discount amount.
- Percent discount capped by `max_discount` and never exceeds the order amount.
- Expired / inactive / exhausted / wrong-scope / wrong-plan → clear, non-enumerating error.
- Concurrency: `used_count` increment + cap check must be atomic (transaction/RPC).
- GST interaction: define whether discount applies pre- or post-GST. **Proposed: discount the
  pre-GST base, then recompute GST** (cleaner invoices, matches receipt builder). Flag for
  reviewer confirmation.

## 13. Testing Notes

- `couponEngine` unit tests: each rule (window, min, scope, plan-restrict, caps, per-user),
  and each discount type incl. `max_discount` cap and free.
- Integration: `/validate` preview; booking order with code (reduced amount); ₹0 free booking
  (no Razorpay); reserved→confirmed and reserved→released transitions; concurrent redemption
  cannot exceed `max_uses`.
- Server tests live in `server/tests` (not `__tests__`) per `industry-categories-build` memory.
- Client: `<CouponField>` apply/error/clear; ₹0 hides Razorpay trigger. Vitest only loads a
  subset of jest-dom matchers — use `.getAttribute()` / `.textContent` (`jest-dom-matcher-gap`).

## 14. Migration / Deploy Checklist (for the eventual build)

- [ ] `v3.56_coupons.sql` applied to **both** Supabase DBs.
- [ ] Confirm `coupons.view` / `coupons.manage` permissions assigned to relevant admin roles.
- [ ] Reserved namespaces already cover `/redeem /coupon /promo /offers` — no change needed.
- [ ] Rate-limit `/api/coupons/validate`.

## 15. Open Decisions for Reviewer

1. Plan-discount approach §7: confirm **(A)** default, or pick (B) / (C).
2. Under (A): free-code grant duration model (`free_grant_days` per coupon?).
3. GST: discount pre-GST base then recompute (proposed) vs discount gross.
4. Confirm "one coupon per order, no stacking" for Phase 1.

---

*Next step after approval: invoke the writing-plans skill to turn this into a step-by-step
implementation plan. No code is written until the plan is reviewed.*

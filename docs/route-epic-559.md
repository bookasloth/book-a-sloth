# Route Marketplace Go-Live — Epic #559

**Status:** BLOCKED on Razorpay Route API (approved 2026-08-10 via ticket #20267942 / earlier #19996920, but **not yet live in dashboard/API** — RZP said "within two days"). Build the dormant layer now; cut over when API lights up.

**Current model:** interim fee-only (`fee_only_mode` default TRUE). No host money moves; every booking collects only BAS fee + GST. See [interim-fee-only-mode] and `docs/payment-model.md` (v4 marketplace).

---

## 1. What exists vs missing (audit 2026-08-10)

| Item | Status | Evidence |
|---|---|---|
| pricingEngine payout/TDS/TCS math | ✅ EXISTS | `server/lib/pricingEngine.js:129,142,158,188` (`calculateVendorPayout`, `computeBreakdown`); `migrations/v3.93_marketplace_tds_tcs.sql` |
| `fee_only_mode` flag (read + enforced) | ✅ EXISTS | `services/platformConfig.js:24,84`; enforced `serviceController.js:229`, `hostController.js:529`, `bookingController.js:385,395`, `paymentController.js:161`, `lib/pricingEngine.js:63`; exposed `server.js:172` |
| Linked-account creation (host→RZP account) | ❌ MISSING | no `account.create` anywhere; `razorpay_account_id` documented `docs/DATABASE.md:54` but **no migration, no code** |
| Transfer-on-payment split | ❌ MISSING | order creates `paymentController.js:188,499,934,970` pass only amount/currency/receipt/notes; no `transfers[]` |
| Route webhooks | ❌ MISSING | `handleWebhook` `paymentController.js:1188` only branches subscription.* + payment.captured/failed |
| KYC → Razorpay onboarding | ❌ standalone | `kycController.js` + `v3.68_kyc.sql` = encrypted bank store, zero RZP linkage |

**Net:** money-math present; entire Razorpay marketplace layer (linked accounts, transfers, Route webhooks, KYC bridge) absent. Existing payout = **manual admin rail** (`payout_requests`, `v1.4.sql:7`, `v3.9_payout_approval.sql`), not auto-split.

**Correction to prior assumptions:** flipping `fee_only_mode` false does **NOT** create the split. It only (a) lets hosts save non-zero price, (b) makes `computeBreakdown` run real math, (c) un-hides client price UI. Money still flows through the **single BAS merchant account** with payout *owed*, settled via the manual rail. Auto-split requires Phases 1–3 below.

---

## 2. Price backup — VERIFIED (prod Mumbai `ayjhlwyzszykqtnaktpb`, 2026-08-10)

- `services_price_backup_v394` **EXISTS** (runtime table, not in migration files — that's why the code audit missed it).
- 22 rows, all non-zero (₹1–₹7000), all 22 match live `services.id`.
- Live services = 43, all currently `price=0`. The 21 not in backup = born ₹0 (free-tier or created post-flip) → correctly stay ₹0 on restore.
- **Restore SQL (prod):** `UPDATE services s SET price = b.price FROM services_price_backup_v394 b WHERE s.id = b.id;` (touches 22 rows).
- ⚠️ Hosts who listed *after* the flip never had a real price → must re-set manually post-launch.
- ⚠️ **Staging (Tokyo `xwvciqkayammbvsidqig`) not yet verified** — check its backup before its own flip.

---

## 3. Phase 0 — design decisions (settle before building)

1. **Linked-account model:** Route `route` linked accounts. Standard onboarding (RZP collects host KYC) vs push our existing encrypted KYC via `/accounts` API. We already hold PAN/Aadhaar/bank (`kycController`) → pushing avoids double-KYC, but RZP still needs its own activation.
2. **Transfer timing:** split-at-capture (`transfers[]` on order) vs post-capture `payment.transfer()`. Our settlement rule = completion + 7d → favor **post-capture transfer with `on_hold` + `on_hold_until`**, released by settlement engine. Reuse `computeSettlementBalance` [settlement-engine-p2].
3. **`razorpayFee` bearer:** already host-borne in pricingEngine; confirm RZP Route fee model matches (fee deducted from transfer vs from platform).
4. **Reversals/refunds:** transfer reversal on booking cancel/refund — map to existing refund path.

---

## 4. Build phases (all dormant behind `fee_only_mode=true`)

### Phase 1 — linked-account onboarding
- Migration: add `razorpay_account_id` (+ `razorpay_account_status`) to `profiles`. **Keep code-side schema fallback until applied BOTH DBs** (project convention).
- Bridge `kycController` → RZP `/accounts` create + product configuration (route).
- Host dashboard: onboarding state (needs_kyc → pending → activated), gate on existing KYC-approved.
- Guard: no linked account → host cannot go paid at launch.

### Phase 2 — transfer-on-payment
- `paymentController` order/capture: assemble `transfers[]` from `computeBreakdown.vendorPayout` → host `razorpay_account_id`.
- `on_hold` until completion + 7d (settlement engine).
- Snapshot transfer id on booking for reconciliation.

### Phase 3 — Route webhooks
- Extend `handleWebhook` (`paymentController.js:1188`): `account.activated`, `transfer.processed`, `transfer.settled`, `transfer.failed`, transfer reversal events.
- Update linked-account status + settlement records.

### Phase 4 — cutover (Route API live + Phases 1–3 merged & tested)
1. Confirm Route live in RZP dashboard + API (not just approval email).
2. Migrations applied BOTH DBs.
3. Flip `fee_only_mode` → false (`platform_settings`).
4. Restore prices: prod SQL above; staging after its own backup check.
5. Soften `HostAgreement` clause 6.3 (ITC moot under marketplace) [ca-tax-ruling-route].
6. Re-set prices for post-flip hosts (manual/notify).

---

## 5. Gotchas / landmines

- **Both-DB migration rule:** every new migration runs on prod + staging, code keeps SELECT/INSERT schema fallback until confirmed applied everywhere.
- **RZP config is DB-encrypted** — never hardcode `process.env.RAZORPAY_*` [razorpay-admin-config]; use `razorpayConfig.js`.
- **Razorpay is source of truth** — verify signatures server-side; snapshot pricing, never trust client.
- **Backup table is runtime-created**, not versioned — don't `DROP` it; it's the only app-side price recovery.
- CA ruling: collect TDS 194-O 1% + TCS §52 1% (both). Host's own GST not BAS's problem (direct-settle). Math already correct in pricingEngine [ca-tax-ruling-route].
- §9(5) classification still open but current catalogue clears it [gst-9-5-classification].

---

## 6. Not doing now (credits + no API)

Phases 1–3 are the real build; deferred until Route API live in dashboard **and** build budget available. This doc is the pickup point. Verify section 1 audit still holds before starting (code may have moved).

# Build Plan — Merchant of Record

**Version:** 2 — 24 July 2026
**Model spec:** `docs/payment-model.md` (v3)
**Legal set:** `/terms`, `/guest-terms`, `/refund`, `/host-agreement`, `/host-fees` (shipped in #564)
**Legal review brief:** `docs/legal-review-brief.md`
**Status:** not started. Phase 0 blockers are real blockers.

---

## There is no migration

Production, checked 24 July 2026:

| | |
|---|---|
| Bookings total | 32 |
| Paid bookings | 27 |
| **Total paid GMV** | **₹190.26** |
| Hosts | 53 |
| Hosts who ever had a paid booking | 5 |
| Booking invoices issued | 5 |
| Subscription invoices | 0 |

₹190 across 27 bookings is about ₹7 each — test transactions. Founder confirms every existing host is a
friend or a test account.

**So we rewrite in place.** v1 of this plan proposed a per-host migration with a dual pricing engine
(`profiles.pricing_model`, `computeBreakdownV2` running alongside v1). That was insurance against
migrating live hosts with real money mid-flight. There are none. The insurance costs more than the risk.

Deleted from the plan:

- `profiles.pricing_model` and the legacy/mor split
- Dual-engine coexistence — `pricingEngine.js` is rewritten, not extended
- Host acceptance campaign, deadline policy, delisting logic — 53 friends, told directly
- The question "when does legacy support end"

Kept:

- `bookings.pricing_version` as a **stamped column only** — one write, no branching. Free, and it
  records which math produced a row.

### Why rewriting in place is safe

Only **three** non-test files call the pricing engine: `controllers/paymentController.js`,
`controllers/bookingController.js`, `services/bookingCapture.js`. Small blast radius.

Nothing recomputes historical bookings. `services/settlementService.js` reads the **stored**
`vendor_amount` column (lines 31, 40, 108, 137); it never recalculates from inputs. Old rows keep the
numbers they were written with, and no code path needs the old formulas to reproduce them.

### The column reuse that saves a day

`vendor_amount` already means "what the host receives" — which is exactly `H` in the new model. Same for
`customer_total` = `guestTotal`.

**Keep writing both.** New model populates `vendor_amount = hostConsideration` and
`customer_total = guestTotal` alongside the new breakdown columns. Result: `settlementService`, the
Earnings page, and every existing admin report keep working with **zero changes**.

New columns are added for what genuinely has no equivalent — the GST on the whole taxable value, the
commission and processing split, the GST-registration snapshot.

---

## Phase 0 — Blockers

Not "nice to have before launch". These change the shape of the code.

**Confirmed by the CA on 25 July 2026** (see `docs/legal-review-brief.md` §1A):

- **Self-billing is allowed.** One-time authorisation from the host, then we raise every invoice in their
  name. Build item, not a blocker — see Phase 3 and Phase 6.
- **Hosts do not need GST registration.** Live in Host Agreement cl. 6.8 and Fee Schedule §5.
- **SAC and rate are not uniform.** This one got worse on examination, not better — see the row below.

| Blocker | Blocks | Why |
|---|---|---|
| **CA: category *treatment*, not just rate** | Phases 1, 2, 4, 6 | Confirmed to vary, and the CA raised medical consultations. Healthcare is **exempt** (Notif. 12/2017 Entry 74) — but the exemption is framed around the *supplier* being a clinical establishment or authorised practitioner, and under this model **the supplier is us**. If the exemption doesn't carry, medical is 18% through us vs 0% direct and the category is unusable. If it does carry, we make exempt supplies and eat Rule 42/43 ITC reversal across the **whole** book. Advocates are a third case — reverse charge, a different money flow entirely. Full questions in the brief §2A. |
| CA: TDS section, rate, current threshold | Phase 7 | Sets the deduction table and the per-host per-FY tracker. Wrong = tax + penalty + 30% expense disallowance. |
| CA: place-of-supply rule, online vs in-person, unregistered guests | Phase 5 | Decides the checkout field and IGST vs CGST+SGST. |
| **CA: the 5 existing booking invoices** | cleanup | Real GST documents with serials in a gap-free series. ₹190 of tests, but if they were reported in GSTR-1 they are in a filed return. Ask whether to leave them or credit-note them. **Do not delete the rows either way — that breaks the serial series.** |
| Counsel: Host Agreement markup | Phase 3 | Hosts accept the **reviewed** text. Acceptance collected against an unreviewed draft is wasted. |
| Founder: real go-live date | Everything | `MOR_EFFECTIVE` in `client/src/components/common/LegalLayout.jsx`. |

**Done already:** Razorpay branding updated to Book A Sloth with logo and brand colour. Still worth
confirming the **billing label** (bank-statement text) changed and not only the checkout branding — the
statement line is what prevents chargebacks, and it is a separate setting.

---

## Phase 1 — `server/lib/pricingEngine.js`

Pure functions, no DB, no side effects. First, because everything else asserts against it.

Replace `computeBreakdown`:

```js
computeBreakdown({ targetEarning, bookingCharge, commissionPct, pgChargePct, absorbsPg, gstRate })
// → { targetEarning, bookingCharge, commission, pgCharge, hostConsideration,
//     taxableValue, gstAmount, guestTotal, platformMargin }
```

- `taxableValue    = targetEarning + bookingCharge`
- `guestTotal      = taxableValue × (1 + gstRate)`
- `pgCharge        = absorbsPg ? 0 : guestTotal × pgChargePct`
- `commission      = targetEarning × commissionPct`
- `hostConsideration = targetEarning − commission − pgCharge`

Retired: `calculateVendorPayout`, `calculateCommissionGst`, `calculateCustomerTotal`,
`calculatePlatformFee`. Commission GST is no longer a separate vendor-borne line — it sits inside our
output GST on the whole sale.

`computeSubscriptionBreakdown` is unchanged. Subscriptions remain GST on top of the plan price.

`gstRate` stays an injected parameter, never a constant. That is what makes this phase safe to build
before the CA answers on rates.

Update `server/tests/unit/pricingEngine.test.js` to assert the four Fee Schedule scenarios to the paisa
(registered/unregistered × Starter/paid). Those numbers are published on `/host-fees` and hosts will
quote them back.

---

## Phase 2 — Migration v3.93 (apply on BOTH DBs)

Additive only. Nothing renamed, nothing dropped.

**`bookings`** — add:

`target_earning` · `booking_charge` · `commission_amount` · `pg_charge` · `taxable_value` ·
`gst_amount` · `guest_state_code` · `host_gst_registered` · `sac_code` ·
`pricing_version SMALLINT NOT NULL DEFAULT 1`

Existing `vendor_amount` and `customer_total` are reused, not replaced. Existing `platform_fee_gst`
stays for the 27 old rows; new rows use `gst_amount`.

`host_gst_registered` is a **snapshot**, and that matters. Host Agreement clause 6.5 makes a change of
GST status prospective only. Read it live at payment time and a host registering in October retroactively
changes September's input-credit position.

**`profiles`** — add: `gstin` · `gstin_legal_name` · `gstin_verified_at` ·
`host_agreement_accepted_at` · `host_agreement_version`

**New tables**

- **`host_bills`** — the purchase document. `doc_type ('tax_invoice' | 'payment_advice')`, serial,
  taxable value, GST, TDS withheld, status, `gstr2b_matched_at`.
- **`host_payment_runs`** — cycle header: period, cut-off, totals, status.
- **`host_bill_deductions`** — every set-off with a reason code. Clause 9 gives broad set-off rights;
  this table is the evidence they were exercised correctly when a host challenges a statement.

**`subscription_plans.limits`** gains `max_service_price` (Starter 5000), `booking_charge`,
`commission_pct`, `pg_charge_pct`, `absorbs_pg`. Per the project rule, limits are never hardcoded.

**`service_categories`** gains `gst_treatment TEXT` (`taxable` | `exempt` | `rcm`) · `gst_rate` ·
`sac_code` · `onboarding_enabled BOOLEAN DEFAULT false`.

Default `onboarding_enabled` to **false** and switch categories on as the CA rules on each. Launch with
plain-18% categories only — salon, fitness, photography, coaching, consulting, tutoring, astrology, events.
Medical, legal, and charitable-yoga stay off until answered. Host Agreement clause 6.9 reserves the right
to gate categories exactly this way, so no agreement is breached by doing it.

**`profiles`** also gains `self_billing_authorised_at` and `self_billing_authorisation_version`.

---

## Phase 3 — Host fields and agreement acceptance

| Field | Notes |
|---|---|
| GSTIN | `GSTIN_RE` already exists at `server/services/invoiceService.js:18`. Reuse it — do not write a second regex. |
| GSTIN legal name | A mismatch against our records denies input credit. Warn at entry; verify against GSTN if feasible. |
| PAN | Already stored encrypted in `kyc_submissions.pan_number` via `utils/kycCrypto.js`. **Gate the first payment on it** — §206AA is 20% vs 10%, and the host will blame us. |
| Agreement acceptance | Blocking step at dashboard entry, recorded with version and timestamp. |
| **Self-billing authorisation** | `profiles.self_billing_authorised_at` + `self_billing_authorisation_version`. One click, covers every future booking, withdrawable on 30 days' notice (Agreement cl. 6.1.2). Only meaningful for GST-registered hosts, but capture it from everyone so a host who registers later needs no extra step. |

**Self-billing is the highest-leverage thing in this phase.** Without it, every registered host has to
generate, number, and upload a compliant GST invoice every fortnight — and the ones who don't cost us the
input credit. With it, they click once and never think about invoicing again. Build the authorisation
before the payment run (Phase 7) depends on it.

With 53 friends and test accounts there is no campaign, no deadline, and no delisting logic. Ship the
acceptance step for correctness and tell the real people directly.

---

## Phase 4 — Host service pricing UI

`services.price` becomes **target earning**, not the guest-facing list price. No new column and no
per-host interpretation — after the rewrite there is only one meaning.

Live breakdown while typing, specified in `/host-fees` §3. Non-negotiable: what the host **receives**,
the GST line, and the upgrade prompt ("on Host+ you'd receive ₹1,000 — same price for your guest").

Enforce `max_service_price` for Starter in the UI **and** server-side.

The 22 existing priced services were set as list prices under the old meaning. With ₹190 of GMV behind
them, just reprice them by hand rather than writing a converter.

---

## Phase 5 — Checkout

- **Remove the ₹11.80 platform-fee line.** It is inside the price now. That line is the intermediary
  characterisation printed on a guest invoice — the worst single thing to leave in place.
- **Add guest state capture.** Required for IGST vs CGST+SGST.
- Non-refundable disclosure immediately above the pay button. The Refund Policy position only holds
  because the charge is disclosed *before* payment.
- Razorpay order amount is `guestTotal`. The flat 2.5% charge removed all method-dependent pricing, so
  the payment method need not be known before the order is created.

---

## Phase 6 — Invoicing

`server/services/invoiceService.js` is in good shape — gap-free serials via the `create_invoice` RPC,
correct CGST/SGST/IGST split, idempotent, and fail-soft so a captured payment is never failed by an
invoicing problem. **Extend it, do not replace it.**

- Guest tax invoice: taxable value becomes `targetEarning + bookingCharge`, not the fee. One line.
  **No host GSTIN anywhere on it.**
- New series in `config/sellerIdentity.js`: `HB` for host bills, `CN` for credit notes.
- **Self-billed host tax invoice** (registered hosts): raised by us in the host's name, showing the
  host's GSTIN as supplier and ours as recipient. This is the host's document, not ours — it needs its own
  series and must not be numbered from our outward series.
- Payment Advice generator (unregistered hosts): never renders as "Tax Invoice", carries the explicit
  no-input-credit line, separate serial series again.
- Credit notes on refund, with the 30 November following-FY deadline tracked.
- **Exempt categories, once any are enabled:** the invoice must read "exempt supply", not "GST @ 0%" —
  different legal wording, and no tax line at all. The engine needs no change (`gstRate = 0` already
  works); the document does.

Three document types now flow through here — our outward invoice, the host's self-billed invoice, and the
Payment Advice. Keeping their serial series separate is not cosmetic; sharing one would corrupt both sets
of records.

---

## Phase 7 — Payment run (replaces payouts)

`vendorController.requestPayout` is retired. `services/settlementService.js` becomes
`services/hostBillingService.js` — but note it already reads stored values, so the balance logic mostly
survives.

Twice-monthly cron:

1. select completed bookings past the 7-day clearing window with all dispute windows closed
2. build `host_bills` (tax invoice or payment advice, per the snapshot)
3. apply `host_bill_deductions`
4. apply the 10% holdback if the host is inside the first 90 days / 20 bookings
5. compute TDS against the per-host per-FY running total
6. skip and carry forward if net is under ₹500
7. pay, then email

The per-host per-FY cumulative tracker is the fiddly part. The threshold applies **once**, not per
booking.

---

## Phase 8 — Refunds

The admin refund button, previously declined, is now mandatory: it is how consumer liability is
discharged.

Full and partial → credit note → GST adjustment → automatic clawback into `host_bill_deductions`.
Cancellation windows (24h / 6h) computed against `bookings.scheduled_at`.

---

## Phase 9 — Emails

Nine new keys in `server/config/emailTemplates.js` (34 today):

`GUEST_TAX_INVOICE` · `GUEST_CREDIT_NOTE` · `HOST_BILL_RAISED` · `HOST_PAYMENT_SENT` ·
`HOST_PAYMENT_DEFERRED` · `HOST_TDS_CERTIFICATE` · `HOST_GSTR1_MISSING` · `HOST_PAN_REQUIRED` ·
`HOST_AGREEMENT_ACCEPTANCE_REQUIRED`

Reseed with `server/scripts/seedEmailTemplates.js` on **both** DBs.

**Rewrite the copy** in the existing booking templates. `BOOKING_CONFIRMED_VENDOR` and
`BOOKING_COMPLETED_VENDOR` currently talk about payouts and earnings.

---

## Phase 10 — Admin

- **Host360**: GSTIN, agreement acceptance state, bill history, deduction log.
- **Finance**: payment runs, GSTR-2B reconciliation queue, TDS register for 26Q filing.

---

## Phase 11 — Vocabulary purge

`grep -riE "payout|settle" server/ client/src/` and fix everything guest- or host-facing.
`Payouts.jsx` → `Bills.jsx`. Rewrite `Earnings.jsx` copy. Rename in code too — code ends up in
screenshots.

Only negations survive ("nothing is settled", "not a settlement").

---

## Phase 12 — Income calculator

Trivial once Phase 1 exists: the same `computeBreakdown`, client-side, with a plan toggle and "here is
what you would receive". **Build it last** so it cannot disagree with production.

---

## Manual ops — no code does these

1. v3.93 on **both** DBs (Tokyo `xwvciqkayammbvsidqig` = staging, Mumbai `ayjhlwyzszykqtnaktpb` = prod)
2. `seedEmailTemplates.js` on both
3. `subscription_plans.limits` rows updated on both
4. ~~Razorpay statement descriptor~~ — branding done; confirm the **billing label** specifically
5. Flip `MOR_EFFECTIVE` on go-live
6. `SAC_BOOKING` per category once the CA answers
7. Reprice the 22 existing paid services by hand under the new meaning
8. Whatever the CA says about the 5 existing booking invoices

---

## Sequencing

**1 → 2 → 3 → 4 → 6 → 5 → 7 → 8 → 9 / 10 / 11 → 12**

Phase 6 lands before Phase 5 deliberately: get invoicing correct while checkout is still on the old
shape, so only one thing moves at a time.

With the Phase 0 answers in hand: Phases 1–2 about a day, 3–5 the bulk, 6–8 the fiddly money work,
9–12 mechanical. Call it **6–9 working days** — down from 8–12 now that the migration machinery is gone.

Without the Phase 0 answers, Phases 2, 5 and 7 are guesswork. Phase 1 is safe to build now because the
GST rate is injected.

---

## The real risk now

v1 of this plan said the risk was two payment models running in parallel forever. That risk is gone with
the migration.

What is left is narrower and sharper: **the guest invoice and the host document are the two artifacts
the whole structure is judged on.** A "platform fee" line on a guest invoice, or a Payment Advice that
looks like a tax invoice, reintroduces exactly the characterisation the model exists to avoid — and
neither would be caught by any test that only checks arithmetic.

Phase 6 deserves the most review attention, not the most code.

---

## Changelog

- **v3** — CA confirmed three things. **Self-billing allowed**: build a one-time authorisation
  (`profiles.self_billing_authorised_at`) and generate every registered host's invoice ourselves; this
  removes the model's worst UX and its most likely ITC failure. **Hosts need no GST registration**: now an
  acquisition line, live in Host Agreement cl. 6.8 and Fee Schedule §5. **SAC and rate vary** — and on
  examination this is worse than a rate column: healthcare is exempt at source but the exemption is framed
  around the *supplier*, and under this model the supplier is us. Added `service_categories.gst_treatment`
  with `onboarding_enabled` defaulting to false, so we launch on plain-18% categories and switch the rest
  on as answered. Host Agreement cl. 6.9 added to reserve that right.
- **v2** — production checked: ₹190 GMV across 27 test bookings, so no migration is needed. Dropped the
  per-host `pricing_model` split and the dual pricing engine; `pricingEngine.js` is rewritten in place.
  Established that `settlementService` reads stored values and never recomputes, and that reusing
  `vendor_amount` / `customer_total` keeps every existing read path working unchanged. Added the CA
  question about the 5 already-issued booking invoices. Estimate 8–12 days → 6–9.
- **v1** — initial 12-phase plan with per-host migration.

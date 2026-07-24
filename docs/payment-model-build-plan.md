# Build Plan — Merchant of Record

**Version:** 1 — 24 July 2026
**Model spec:** `docs/payment-model.md` (v3)
**Legal set:** `/terms`, `/guest-terms`, `/refund`, `/host-agreement`, `/host-fees` (shipped in #564)
**Legal review brief:** `docs/legal-review-brief.md`
**Status:** not started. Phase 0 blockers are real blockers.

---

## The architecture decision that de-risks everything

**Do not cut over. Migrate per host.**

```
profiles.pricing_model    'legacy' | 'mor'     new hosts default 'mor'
bookings.pricing_version   1 | 2               snapshot at confirm, never backfilled
```

A host flips to `mor` **when they accept the reviewed Host Services Agreement**. Old bookings keep old
math forever. Both engines run side by side; roll forward at whatever pace suits, and roll back one host
at a time if something is wrong.

Without this you need a big-bang cutover in which in-flight bookings, pending host balances, and unfiled
GST all change meaning at midnight. With it, the risky part is one boolean per host.

Every downstream phase depends on this, so it is decision one, not an implementation detail.

---

## Phase 0 — Blockers

Nothing below is safe to build without these. They are not "nice to have before launch" — they change
the shape of the code.

| Blocker | What it blocks | Why |
|---|---|---|
| CA: SAC code + GST rate **per service category** | Phases 1, 2 | `sellerIdentity.js` hardcodes `SAC_BOOKING = '998314'` for everything. Acceptable on a ₹10 fee. At gross GMV, an under-collected rate is a real liability. |
| CA: TDS section, rate, current threshold | Phase 7 | Determines the deduction table and the per-host per-FY tracker. Wrong = tax + penalty + 30% expense disallowance. |
| CA: place-of-supply rule, online vs in-person, to unregistered guests | Phase 5 | Decides what we must capture at checkout and whether it is IGST or CGST+SGST. |
| Counsel: Host Agreement markup | Phase 3 | Hosts must accept the **reviewed** text. Collecting acceptance against an unreviewed draft wastes the acceptance. |
| Founder: real go-live date | Everything | `MOR_EFFECTIVE` in `client/src/components/common/LegalLayout.jsx`. |

---

## Phase 1 — `server/lib/pricingEngine.js`

Pure functions, no DB, no side effects. Do this first because everything else asserts against it.

The current engine is the old model: GST on the platform fee only, and
`vendorPayout = servicePrice − commission − commissionGst − razorpayFee`.

Add alongside it:

```js
computeBreakdownV2({ targetEarning, bookingCharge, commissionPct, pgChargePct, absorbsPg, gstRate })
// → { targetEarning, bookingCharge, commission, pgCharge, hostConsideration,
//     taxableValue, gstAmount, guestTotal, platformMargin }
```

- `taxableValue = targetEarning + bookingCharge`
- `guestTotal = taxableValue × (1 + gstRate)`
- `pgCharge = absorbsPg ? 0 : guestTotal × pgChargePct`
- `commission = targetEarning × commissionPct`
- `hostConsideration = targetEarning − commission − pgCharge`

**Keep every v1 function.** `pricing_version = 1` rows still need them. Dispatch on version at the call
site; do not delete and do not "unify" the two.

`calculateCommissionGst` is not used by v2. Commission GST is no longer a separate vendor-borne line —
it sits inside our output GST on the whole sale. Leave the function for v1.

`computeSubscriptionBreakdown` is unchanged. Subscriptions are still GST on top of the plan price.

**Test:** assert the four Fee Schedule scenarios to the paisa (registered/unregistered × Starter/paid).
Those numbers are published on `/host-fees` and hosts will quote them back.

---

## Phase 2 — Migration v3.93 (apply on BOTH DBs)

Additive only. Nothing renamed, nothing dropped — v1 rows must keep working.

**`bookings`**

`target_earning` · `booking_charge` · `commission_amount` · `pg_charge` · `host_consideration` ·
`taxable_value` · `gst_amount` · `guest_state_code` · `host_gst_registered` · `sac_code` ·
`pricing_version SMALLINT NOT NULL DEFAULT 1`

`host_gst_registered` is a **snapshot**, and that matters. Host Agreement clause 6.5 makes a change of
GST status prospective only. Read it live at payment time and a host registering in October retroactively
changes September's input-credit position.

**`profiles`**

`gstin` · `gstin_legal_name` · `gstin_verified_at` · `pricing_model TEXT NOT NULL DEFAULT 'legacy'` ·
`host_agreement_accepted_at` · `host_agreement_version`

**New tables**

- **`host_bills`** — the purchase document. `doc_type ('tax_invoice' | 'payment_advice')`, serial,
  taxable value, GST, TDS withheld, status, `gstr2b_matched_at`.
- **`host_payment_runs`** — cycle header: period, cut-off, totals, status.
- **`host_bill_deductions`** — every set-off with a reason code, so a host statement is defensible when
  challenged. Clause 9 gives us broad set-off rights; this table is the evidence we exercised them
  correctly.

**`subscription_plans.limits`** gains `max_service_price` (Starter 5000), `booking_charge`,
`commission_pct`, `pg_charge_pct`, `absorbs_pg`. Per the project rule, limits never get hardcoded.

---

## Phase 3 — Host onboarding fields

| Field | Notes |
|---|---|
| GSTIN | `GSTIN_RE` already exists at `server/services/invoiceService.js:18`. Reuse it — do not write a second regex. |
| GSTIN legal name | Mismatch against our records denies input credit. Warn at entry, verify against GSTN if feasible. |
| PAN | Already stored encrypted in `kyc_submissions.pan_number` via `utils/kycCrypto.js`. **Gate the first payment on it** — §206AA is 20% vs 10%, and the host will blame us. |
| Agreement acceptance | Blocks `pricing_model = 'mor'`. |

**Existing hosts need fresh affirmative acceptance.** Not a dismissible banner — a blocking step at
dashboard entry, recorded with version and timestamp. This is a real work item with real drop-off, not a
checkbox.

**Open decision:** what happens to a host who never accepts? Frozen at `legacy` indefinitely, or
delisted after N days? Decide before the campaign goes out, because the answer changes the copy.

---

## Phase 4 — Host service pricing UI

`services.price` semantics invert: it becomes **target earning**, not the guest-facing list price.
Interpret it through the host's `pricing_model` — do not add a second column, the model already tells
you which meaning applies.

The live breakdown while typing is specified in `/host-fees` §3. Non-negotiable parts: what the host
**receives**, the GST line, and the upgrade prompt ("on Host+ you'd receive ₹1,000 — same price for your
guest").

Enforce `max_service_price` for Starter in the UI **and** server-side.

---

## Phase 5 — Checkout

- **Remove the ₹11.80 platform-fee line.** It is inside the price now. That line is the intermediary
  characterisation printed on a guest invoice — the single worst thing we could leave in place.
- **Add guest state capture.** Required for IGST vs CGST+SGST.
- Non-refundable disclosure immediately above the pay button. The Refund Policy position only holds
  because the charge is disclosed *before* payment.
- Razorpay order amount is `guestTotal`. The flat 2.5% charge removed all method-dependent pricing, so
  there is no need to know the payment method before creating the order.

---

## Phase 6 — Invoicing

`server/services/invoiceService.js` is in good shape — gap-free serials via the `create_invoice` RPC,
correct CGST/SGST/IGST split, idempotent, fail-soft so a captured payment is never failed by an
invoicing problem. **Extend it, do not replace it.**

- Guest tax invoice: taxable value becomes `targetEarning + bookingCharge`, not the fee. One line.
  **No host GSTIN anywhere on it.**
- New series in `server/config/sellerIdentity.js`: `HB` for host bills, `CN` for credit notes.
- Payment Advice generator: must never render as "Tax Invoice", must carry the explicit
  no-input-credit line, separate serial series.
- Credit notes on refund, with the 30 November following-FY deadline tracked.

---

## Phase 7 — Payment run (replaces payouts)

`vendorController.requestPayout` is retired. `services/settlementService.js` becomes
`services/hostBillingService.js`.

Twice-monthly cron:

1. select completed bookings past the 7-day clearing window with all dispute windows closed
2. build `host_bills` (tax invoice or payment advice per snapshot)
3. apply `host_bill_deductions`
4. apply the 10% holdback if the host is inside the first 90 days / 20 bookings
5. compute TDS against the per-host per-FY running total
6. skip and carry forward if net is under ₹500
7. pay, then email

The per-host per-FY cumulative tracker is the fiddly part. The threshold applies **once**, not per
booking.

---

## Phase 8 — Refunds

The admin refund button, previously declined, is now mandatory: it is the mechanism our consumer
liability is discharged through.

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

- **Host360**: GSTIN, pricing model, agreement acceptance state, bill history, deduction log.
- **Finance**: payment runs, GSTR-2B reconciliation queue, TDS register for 26Q filing.

---

## Phase 11 — Vocabulary purge

`grep -riE "payout|settle" server/ client/src/` and fix everything guest- or host-facing. `Payouts.jsx`
→ `Bills.jsx`. Rewrite `Earnings.jsx` copy. Rename in code too — code ends up in screenshots.

Only negations survive ("nothing is settled", "not a settlement").

---

## Phase 12 — Income calculator

Trivial once Phase 1 exists: the same `computeBreakdownV2`, client-side, with a plan toggle and "here is
what you would receive". **Build it last** so it cannot disagree with production.

---

## Manual ops — no code does these

1. v3.93 on **both** DBs (Tokyo `xwvciqkayammbvsidqig` = staging, Mumbai `ayjhlwyzszykqtnaktpb` = prod)
2. `seedEmailTemplates.js` on both
3. `subscription_plans.limits` rows updated on both
4. **Razorpay statement descriptor → `BOOKASLOTH`.** Do this now. It is free, and it is the chargeback
   defence — guests dispute what they do not recognise.
5. Flip `MOR_EFFECTIVE` on go-live
6. `SAC_BOOKING` per category once the CA answers
7. Existing-host acceptance campaign

---

## Sequencing

**1 → 2 → 3 → 4 → 6 → 5 → 7 → 8 → 9 / 10 / 11 → 12**

Phase 6 lands before Phase 5 deliberately: get invoicing correct while checkout is still on the old
shape, so only one thing is moving at a time.

Rough shape with the CA answers in hand: Phases 1–2 about a day, 3–5 the bulk, 6–8 the fiddly money
work, 9–12 mechanical. Call it **8–12 working days**. Without the Phase 0 answers, Phases 1, 2, 5 and 7
are all guessing.

---

## The biggest risk is not code

It is that Phase 3's acceptance flow stalls and both models run in parallel for months — two code paths,
two GST treatments, two support scripts, indefinitely. The per-host migration is what makes the build
safe; it is also what makes it easy to never finish.

Set a date for `legacy` support ending, and decide the answer to the open question in Phase 3 before the
acceptance campaign goes out.

# Payment Model — Merchant of Record

**Version:** v3 (final) — 24 July 2026
**Status:** Model settled. Pending CA and lawyer confirmation before build.
**Supersedes:** Structure A (host collects direct), Razorpay Route plan (epic #559)

> Written by an engineer, not a CA or a lawyer. Every tax and legal position below is
> an assumption to be confirmed. Nothing here gets filed, signed, or shipped before that.

---

## 1. The model in four lines

1. The host sells the service to Book A Sloth. The host gives me an invoice.
2. Book A Sloth sells it to the guest. I give the guest an invoice.
3. The guest's money is my own revenue. I pay the host as a supplier.
4. Nothing is settled to anyone. No aggregation. The PA Directions never apply.

**Payment gateway is a flat 2.5% of the guest total, every method.** Razorpay costs more, I pay. Costs less, I keep. The host's number never moves.

---

## 2. Why the regulator does not knock

### 2.1 The rule being avoided

The RBI *Regulation of Payment Aggregators Directions, 2025* defines a payment aggregator as an entity that collects payments from customers **on behalf of merchants** and **subsequently settles those funds to those merchants** (§4(i)). There is no exemption for holding funds briefly. Money in for someone else, money out to them later, is aggregation.

Two ways out. Only one is available today.

- **Split at source.** A licensed aggregator splits the payment so the host's share never reaches me. Razorpay Route does this but requires GST-3B turnover above ₹40 lakh. We don't qualify.
- **Be the merchant.** If the money is my own revenue there is nobody to settle to, and the Directions never engage. Available immediately, at any scale, with any gateway.

We take the second.

### 2.2 This is not a loophole

It is the ordinary structure of every inventory-model business in India. A retailer buys from a supplier and sells to a customer, and needs no aggregator licence to accept card payments, because the money it collects is its own. Same thing, services instead of goods.

The regulator's test is substance over form. It survives only if the contracts, the invoices, the books, and the product all say the same thing. Say "merchant of record" on the cover page while the Terms say "marketplace" and the invoice says "platform fee", and the label saves nothing.

### 2.3 The six artifacts that make it true

Not optional. Each is evidence.

1. **The host contract is a procurement contract.** Host supplies to Book A Sloth. Book A Sloth supplies to the guest. The host has no contract with the guest.
2. **Guest terms name Book A Sloth as the supplier.** I am liable for the service. Not "we connect you with providers".
3. **The guest invoice is mine, under my GSTIN, as a single supply.** The host may be named in the description. The host's GSTIN never appears. No line item called platform fee or commission.
4. **I deduct TDS from every host payment and issue Form 16A.** The strongest single piece of evidence in the structure. Nobody withholds income tax from money they are merely passing through. A buyer withholds tax from a vendor bill.
5. **My books show gross revenue.** Full guest price is revenue, host payment is cost of services. True in the P&L, the GST returns, and the income tax return.
6. **The product uses procurement language.** No payout, no settlement, no "your earnings are being transferred".

### 2.4 Why this survives a gateway problem

Because the money is my own revenue, I am gateway-agnostic. Any standard merchant account works. No Route, no split settlement, no sub-merchant KYC, no ₹40 lakh threshold, no dependency on one provider's underwriting.

**Razorpay does something I dislike, I migrate in a day.** I am asking them for nothing unusual — just to collect my own money. The gateway is replaceable. The regulator is not. That is the whole point of this structure.

### 2.5 The second-order benefit

Turnover is now gross merchandise value, not fee income. Roughly 4,000 bookings of ₹1,000 puts GST-3B past ₹40 lakh — the Route threshold. This model actively walks us toward qualifying for split settlement, which is the better long-term structure. **Structure B is the bridge, not the destination.**

---

## 3. The three plans

| Plan | Booking charge | Commission | Payment charge | Max service price |
|---|---|---|---|---|
| **Starter** (free) | ₹10 | **5% — all-inclusive** | **I bear it** | **₹5,000** |
| **Host+** | ₹10 | 0% | 2.5% | none |
| **Studio** | ₹10 | 0% | 2.5% | none |

Starter sees **one number: 5%**. Processing is inside it and I carry the risk.
Paid plans see **₹10 + 2.5%** and no commission at all.

Studio and Host+ are economically identical by design. Studio is differentiated on **non-financial platform features only**.

Subscriptions unchanged: Starter free, Host+ ₹229/month or ₹1,499/year, Studio ₹555/month, Enterprise negotiated. Billed by me to the host as a normal B2B supply with GST.

---

## 4. The master formula

The host types what he wants to **earn**. Everything else is computed.

```
V  =  E + F                      taxable value   (E = target earning, F = ₹10)
G  =  V × 1.18                   what the guest pays
H  =  E − commission − pgCharge  what the host actually earns
```

**`V` is always `E + F`.** Commission and processing cancel out of the guest price.

Therefore **the guest pays the same** whatever the plan, whatever the host's GST status, whatever the payment method. One price. That single property removes most of the complexity from the build — no gross-up, no method-before-order-creation, no two-tier listings.

Reference constants used throughout: **E = ₹1,000, F = ₹10, GST 18%** → V = ₹1,010, **G = ₹1,191.80**, my output GST = ₹181.80.

---

# Scenarios

## Scenario 1 — GST host, Host+ or Studio

| | |
|---|---|
| Guest pays | ₹1,191.80 |
| My output GST | ₹181.80 |
| Payment charge 2.5% | ₹29.80 |
| **Host earns** | **₹970.20** |
| His invoice to me (970.20 + 18%) | ₹1,144.84 |
| My ITC | ₹174.64 |
| **Net GST I remit** | **₹7.16** |
| TDS 10% on ₹970.20 | ₹97.02 |
| **Credited to his bank** | **₹1,047.82** |
| He remits his own GST | −₹174.64 |
| **He keeps** | **₹970.20** |
| **My margin — UPI** | **₹39.80** |
| **— card** (real MDR ₹23.84) | **₹15.96** |
| **— international** (₹35.75) | **₹4.05** |

**LANDMINE — biggest on this page.** He must file his GSTR-1. If he doesn't, my ₹174.64 credit is reversed with interest — **11× my margin** on this booking. Nothing else here comes close.
→ Reconcile GSTR-2B monthly. Hold his next cycle until his invoice appears.

**LANDMINE — premium cards.** Break-even MDR on paid plans is **3.34%**. AmEx at ~3.5% puts this booking at **−₹1.91**. Check the rate before enabling AmEx or international cards, or leave them off.

## Scenario 2 — No-GST host, Host+ or Studio

| | |
|---|---|
| Guest pays | ₹1,191.80 |
| My output GST | ₹181.80 |
| Payment charge 2.5% | ₹29.80 |
| **Host earns** | **₹970.20** |
| My document to him | **Payment Advice** ₹970.20 |
| My ITC | **₹0** |
| **Net GST I remit** | **₹181.80** |
| TDS 10% | ₹97.02 |
| **Credited to his bank** | **₹873.18** |
| **My margin** | **₹39.80** — identical |

Guest pays the same. Host earns the same. I earn the same. Only my GST cheque is bigger.

**LANDMINE.** The document must **never** say "Tax Invoice". Title it **Payment Advice**, no GST line, and print: *"Supplier not registered under GST. No tax charged, no input credit arises."* Treating it as ITC-bearing is a false credit claim. Separate serial series from guest invoices.

**LANDMINE.** He'd keep ₹1,000 selling direct on WhatsApp. Through me his guest pays ₹1,191.80 — he is **19% more expensive**. Unavoidable; it is the cost of me being the seller. The product has to be worth more than 19% to him.

## Scenario 3 — GST host, Starter (free)

| | |
|---|---|
| Guest pays | ₹1,191.80 |
| My output GST | ₹181.80 |
| **Commission 5% (all-in)** | **₹50.00** |
| Payment charge | **₹0 — I bear it** |
| **Host earns** | **₹950.00** |
| His invoice (950 + 18%) | ₹1,121.00 |
| My ITC | ₹171.00 |
| Net GST I remit | ₹10.80 |
| TDS 10% on ₹950 | ₹95.00 |
| **Credited to his bank** | **₹1,026.00** |
| **My margin — UPI** | **₹60.00** |
| **— card** | **₹36.16** |
| **— international** | **₹24.25** |

Guest pays exactly the same as Host+. The commission never touches the guest price.

Starter is my **safest** plan — ₹60 of cover means even AmEx at 3.5% leaves ₹18.29.

**LANDMINE.** "No commission" is dead as positioning on the free plan. The host agreement must state the 5% inside the price formula, and the pricing page must print it. A host who finds out from his payment statement is entitled to be angry.

## Scenario 4 — No-GST host, Starter (free)

As Scenario 3 except: **Payment Advice ₹950**, no ITC, I remit the full ₹181.80, bank credit **₹855.00**, host keeps ₹950. My margin identical.

**This is the most common host on the platform. Design every screen for this person.**

## Scenario 5 — Free booking (₹0)

Nothing happens. No payment, no invoice, no GST, no TDS, no commission, no processing.

**LANDMINE.** Hard-guard it. The formula must not return a charge on ₹0.

## Scenario 6 — Guest cancels

| | |
|---|---|
| Refunded to guest | ₹1,152.00 |
| **Retained: ₹10 booking + 2.5%** | ₹39.80 |
| Host paid | ₹0 |
| Credit note | issued, GST adjusted |

**LANDMINE.** Razorpay does **not** return MDR on a refund. A full refund of ₹1,191.80 costs me the MDR *plus* my margin — around **−₹64** on a card booking. Three good bookings wiped by one cancel.
→ **Booking charge and payment charge are non-refundable.** Printed above the pay button, before payment.

**LANDMINE.** Credit note must be issued before **30 November** following that financial year or the GST cannot be adjusted.

## Scenario 7 — Host no-show

| | |
|---|---|
| Refunded to guest | **₹1,191.80 — full, including my charges** |
| My loss | ~₹64 |
| Recovered from host's next payment | ₹64 |

I am the seller. The guest's contract is with me. I refund first and argue with the host after.

**LANDMINE.** **Never pay the host instantly.** A host balance is the only thing a refund can be clawed from. Pay weekly, 72 hours after the session. Same-day payment means every no-show comes out of my pocket with zero recourse.

**LANDMINE.** The admin refund button — previously declined — is now mandatory. It is the mechanism my legal liability runs through. Needs full + partial, reason capture, auto credit note, GST adjustment, auto clawback.

## Scenario 8 — Chargeback

Guest disputes a card payment. **₹1,500–2,500 fee plus the full amount reversed.** One chargeback ≈ **40 bookings** of Host+ margin.

Cannot be priced in. Only prevented:
- 3DS on all cards
- Statement descriptor must read `BOOKASLOTH` — guests dispute what they don't recognise
- Keep booking confirmation and attendance mark as evidence

**LANDMINE.** Biggest tail risk in the model. Check the descriptor **before** launch, not after the first dispute.

## Scenario 9 — Host registers for GST mid-year

He adds his GSTIN on 1 October.

- Before 1 Oct → Payment Advice, no ITC. **Never retrospective.**
- From 1 Oct → tax invoices, I claim ITC.
- **His earning does not change.** ₹970.20 before, ₹970.20 after.

**LANDMINE.** GSTIN legal name must match the name I raise documents against. Mismatch = ITC denied. Validate format on entry; verify against the GSTN portal if possible.

## Scenario 10 — Host has no PAN

TDS jumps 10% → **20%** under section 206AA. Bank credit drops ₹873 → ₹776. He will blame me.

**LANDMINE.** Block the first payment until PAN is on file. v3.68 KYC already collects it — enforce it as a gate.

## Scenario 11 — Host under the TDS threshold

Below roughly ₹30,000 per host per financial year, **no TDS at all.** Most small hosts never cross it. Host+ example: bank credit becomes ₹1,144.84 instead of ₹1,047.82.

**LANDMINE.** Track cumulative payments **per host, per financial year**. Deduction starts at the right booking; the threshold applies once, not per booking. Get it wrong and I owe the tax, plus penalty, plus 30% of the host payment disallowed under section 40(a)(ia).

**LANDMINE.** Confirm the current threshold with the CA — it was revised recently.

## Scenario 12 — International guest

Real MDR ~3%. I charge 2.5%, or absorb it entirely on Starter.

| Plan | Margin | Break-even MDR |
|---|---|---|
| Starter | ₹24.25 | **5.03%** — very safe |
| Host+ / Studio | ₹4.05 | **3.34%** — thin |

**LANDMINE.** Paid plans go negative above 3.34%. AmEx and premium cards live there.

## Scenario 13 — Guest in another state

Place of supply decides **IGST** vs **CGST+SGST**.

**LANDMINE.** Capture the guest's state at checkout. Not optional. New required field.

## Scenario 14 — Different service types

Not everything is 18%. SAC and rate vary by category.

**LANDMINE.** The single `998314` will not survive. At gross turnover, under-collected GST is a materially larger exposure than it was on ₹10 fees. Needs per-category SAC and rate.

## Scenario 15 — High-value booking on the free plan

**Starter cannot list a service above ₹5,000.** Want to sell a ₹20,000 package? Upgrade to Host+.

Max commission on Starter is therefore 5% × ₹5,000 = **₹250**.

Margins at the ceiling (E = ₹5,000, guest pays ₹5,911.80):

| Method | My margin |
|---|---|
| UPI | ₹260.00 |
| Card | ₹141.76 |
| International | ₹82.65 |
| AmEx 3.5% | ₹53.09 |

**LANDMINE — never cap the Starter commission in rupees.** I absorb processing on that plan, and processing is ~2.95% of the host's earning. A flat ₹500 cap goes **−₹228** at ₹25,000 and **−₹965** at ₹50,000. A rupee cap on a percentage-based cost is a promise to lose money at scale. **Cap the booking price, not the fee.** The price cap lives in `subscription_plans.limits` like every other limit.

Bounded leakage: at the ₹5,000 ceiling a host saves ₹250 by going off-platform. That is the maximum incentive to cheat this model will ever create. Uncapped, a ₹50,000 booking would have handed him ₹2,500 to route around us.

---

# The landmines that kill the whole structure

Not per-booking problems. These break the model itself.

**1. A line item called "platform fee" on the guest invoice.** Intermediary language — hands back the exact characterisation I am paying 18% to escape. **The guest invoice shows one supply.** Remove the existing ₹11.80 checkout line; it lives inside the price now.

**2. Mixed models.** Some bookings through me, some paid host-direct, is part-time aggregation and the whole defence weakens. **One model, every paid booking.**

**3. The words payout, settlement, earnings transfer** — guest-facing, host-facing, and in the code, because code ends up in screenshots. The host is a supplier. I raise purchase documents and pay bills.

**4. Hosts collecting from guests on the side.** Confuses who supplied whom. Contract clause, and enforce it.

**5. Books showing "collections" and "payouts."** P&L must show gross revenue and cost of services. **The ledger shape is the compliance position** — not the wording on the website.

**6. Calling the 2.5% a "gateway charge."** UPI costs me ₹0. A host who learns that sees a fake pass-through and then doubts everything else. Label it **"Payment processing — flat 2.5%, all payment methods."** Say it is flat. Then nothing can be discovered, because nothing is hidden. Never show a processing figure larger than the gateway actually charged.

**7. Not deducting TDS.** Beyond the penalty — TDS deduction is the **strongest single piece of evidence** that I am a buyer and not an aggregator.

---

# Internal billing — documents per booking

### Book A Sloth → Guest: Tax Invoice
Issued on payment confirmation. My GSTIN, my address. Guest name and **guest state** (determines IGST vs CGST+SGST). Description names the host as description, not as supplier. Single taxable line at V, GST at r, total G. SAC per service category. Serial from the existing gap-free series (v3.67). **No fee line. No host GSTIN.**

### Host → Book A Sloth (registered): Tax Invoice
Legally his document. Preferred: he issues it, we provide a generated PDF he adopts or he uploads his own. Alternative: self-billing under written consent — confirm acceptability with the CA first. Contents: his GSTIN, my GSTIN as recipient, value H, GST H×r. **ITC is only real if he files** — see Scenario 1.

### Book A Sloth → Host (unregistered): Payment Advice
Not a tax invoice, never titled as one. Value H, no GST, no GSTIN. Explicit line: *"Supplier is not registered under GST. No tax has been charged and no input tax credit arises on this document."* Separate serial series.

### TDS
Monthly challan by the 7th. Quarterly Form 26Q. Quarterly Form 16A to every host deducted from.

### Credit note
On refund or cancellation, against the original guest invoice, adjusting output GST. Before 30 November following that FY.

### Accounting entries

| Event | Debit | Credit |
|---|---|---|
| Guest pays | Bank `G` | Revenue `V`, Output GST `V×r` |
| Host bill accrued (registered) | Cost of services `H`, Input GST `H×r` | Host payable `H×(1+r)` |
| Host bill accrued (unregistered) | Cost of services `H` | Host payable `H` |
| TDS withheld | Host payable | TDS payable |
| Host paid | Host payable | Bank |

Gross revenue, cost of services, a payable. No suspense account, no client-money account, no "collections held on behalf".

---

# Vendor–Company agreement — key clauses

To be drafted by a lawyer. These are the clauses the structure depends on; drafting must not soften them.

1. **Nature of relationship.** The host supplies services to Book A Sloth. Book A Sloth supplies them onward in its own name and on its own account. Independent contractor. No agency, partnership, employment, or joint venture. The host has no contractual relationship with the end customer.
2. **Ordering.** Each confirmed booking is a purchase order from Book A Sloth to the host at value H.
3. **Price and its construction.** The host sets his target earning E. The parties agree prices are inclusive of all applicable taxes. The host's consideration is `H = E − commission − payment charge`, per his then-current plan, as set out in the pricing schedule. The host acknowledges he is shown this computation before setting each price.
4. **GST status.** The host warrants his status is accurate and will notify within seven days of change. A registered host will issue a valid tax invoice and report it in his GSTR-1 within the statutory period. ITC denied because he failed to file, failed to pay, or issued a defective invoice is recoverable from him.
5. **TDS.** Book A Sloth deducts at source where applicable and issues Form 16A. The host furnishes a valid PAN before first payment and acknowledges the higher rate without one.
6. **Payment terms.** Weekly cycle, 72 hours after delivery and expiry of the cancellation window, net of TDS and any recoverable amounts.
7. **Service standards.** Attendance obligations, no-show consequences, right of set-off.
8. **Indemnity.** The host indemnifies Book A Sloth against claims arising from his performance, conduct, qualifications, licences, and any injury or loss caused.
9. **Licences.** He warrants he holds every licence and qualification required, producible on request.
10. **Disintermediation.** No soliciting platform-introduced customers off-platform for a defined period.
11. **No collection on either's behalf.** Neither party collects money as agent for the other. The host will not accept payment directly from a customer for a platform booking. **This clause is what stops the structure blurring back into aggregation.**
12. Data protection, confidentiality, term and termination, governing law, jurisdiction.

---

# What to build

**Remove**
- ₹11.80 platform fee line at checkout
- `requestPayout` manual transfer flow
- payout / settlement / commission vocabulary, product and code

**Add**
- Host sets **target earning**, not list price, with live breakdown
- GSTIN field, format-validated
- Guest **state** at checkout
- Per-category SAC and GST rate
- Payment Advice document + separate serial series
- Cumulative per-host per-FY payment tracking (TDS threshold)
- Weekly payment run, 72h after completion
- Admin refund → credit note → GST adjustment → host clawback
- GSTR-2B reconciliation with next-cycle hold
- Starter max service price in `subscription_plans.limits`

**Rewrite**
- Host terms → procurement agreement
- Guest terms → I am the supplier and I am liable
- Refund policy → now a binding contract, not a description

---

# Ask the CA

1. Confirm merchant-of-record keeps us fully outside the PA Directions.
2. Confirm no ITC on unregistered hosts, and no RCM or self-invoicing route to recover it.
3. Confirm §9(5) e-commerce operator liability does not apply to our categories.
4. **Confirm §24(ix) compulsory registration does not hit our hosts** — they supply *to* us, not *through* us. A real benefit to small hosts if it holds.
5. TDS section and rate per category, current threshold, mid-year crossing.
6. Confirm TCS 194-O no longer applies.
7. SAC codes and rates per category.
8. Place of supply for online vs in-person services to unregistered guests.
9. Should registered hosts issue their own invoices, or is self-billing acceptable?
10. Which turnover thresholds arrive early now that revenue is gross.

# Ask the lawyer

Procurement agreement · guest terms with us as supplier · refund policy as a binding term · Consumer Protection Act exposure and whether liability insurance is warranted.

---

**One sentence.** I buy from the host and sell to the guest, so the money is mine, so there is nothing to settle, so the rules do not apply — and every landmine above is just a way of accidentally proving otherwise.

---

## Changelog

- **v3** — Studio booking charge ₹0 → ₹10. Starter became a single all-inclusive 5% with processing absorbed by us (margin ₹60 vs ₹39.80, now the safest plan). Commission left uncapped; Starter instead capped at a ₹5,000 max service price, because a rupee cap on a percentage cost goes negative at scale. Studio/Host+ parity closed — differentiated on non-financial features only.
- **v2** — Flat 2.5% payment charge replacing per-method gross-up. Deleted the gross-up formula and the method-before-order-creation constraint.
- **v1** — Merchant-of-record model adopted over Structure A and Razorpay Route.

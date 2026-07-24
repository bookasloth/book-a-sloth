# Legal & Tax Review Brief — Merchant-of-Record Documents

**For:** external counsel and chartered accountant
**From:** Timewheel Internet Private Limited (Book A Sloth)
**Date:** 24 July 2026
**Documents to review:** `/terms`, `/guest-terms`, `/refund`, `/host-agreement`, `/host-fees`
**Commercial model:** `docs/payment-model.md`

> These documents are **drafts prepared in-house**, not by a lawyer. They have not been
> reviewed by counsel. No host should be onboarded and no guest should transact against
> them until they have been. They carry a future effective date for that reason.

---

## 1. What changed and why

Book A Sloth previously operated, and its published terms described, a **marketplace**: guests paid into
one company account, the company deducted a fee, and hosts were paid by manual transfer.

Razorpay confirmed in writing that a standard merchant account does not permit collecting from customers
and redistributing to third parties, and that Razorpay Route is the compliant path for that model. Route
requires GST-3B turnover above ₹40 lakh, which the company does not have. An own payment-aggregator
licence requires ₹15 crore net worth.

The company has therefore restructured as a **merchant of record**:

> The host sells the service to Book A Sloth and invoices us. Book A Sloth sells it to the guest and
> invoices the guest. Money received from guests is the company's own revenue; payment to the host is a
> vendor bill. Nothing is collected on behalf of, or settled to, a third party.

The intended consequence is that the RBI *Regulation of Payment Aggregators Directions, 2025* do not
engage at all, because §4(i) applies to entities that collect from customers on behalf of merchants and
subsequently settle those funds to those merchants. This is the ordinary structure of an inventory-model
e-commerce business.

**The documents in this review exist to make that characterisation true in substance, not just in
label.** That is the specific thing we need confirmed.

---

## 1A. Already confirmed by the CA (25 July 2026)

These three are settled and the documents have been updated accordingly. Listed so nothing is
re-litigated, and so the rest of the review can assume them.

1. **Self-billing is acceptable.** Book A Sloth may raise tax invoices in a registered Host's name and
   on their behalf under a one-time authorisation. Implemented as Host Agreement clause 6.1 (with 6.1.1
   to 6.1.3 on scope, withdrawal on 30 days' notice, and the Host's continuing responsibility to check
   the invoices and report them in GSTR-1). Fee Schedule section 6 explains it to Hosts.
2. **GST registration is not compulsory for Hosts.** Supplying *to* us rather than *through* us does not
   trigger registration. Host Agreement clause 6.8; Fee Schedule section 5.
3. **SAC and rate are not uniform.** A single blanket code will not do — see section 2A, which is now the
   sharpest open item in this brief.

## 2. Questions for the chartered accountant

1. Confirm that as merchant of record — receiving guest payments as our own revenue and paying hosts as
   suppliers — we fall **outside** the PA Directions entirely.
2. Confirm that **no input tax credit** arises on purchases from unregistered hosts, and that no reverse
   charge or self-invoicing route is available to recover it for our service categories.
3. Confirm **§9(5) e-commerce operator liability** does not apply to our categories (we are not
   passenger transport, accommodation, restaurant, or housekeeping).
4. ~~Confirm §24(ix) compulsory registration does not hit our hosts.~~ **Confirmed — hosts do not need
   to register.** See section 1A. Now stated in Host Agreement clause 6.8 and Fee Schedule section 5, and
   we intend to use it in marketing. Please confirm that wording does not overstate the position.
5. Correct **TDS section and rate** per service category (we have assumed 194-J at 10%), the current
   threshold, and the treatment where a host crosses it mid-year.
6. Confirm **TCS under §194-O no longer applies**, since we are the supplier rather than a facilitator.
7. **SAC codes and GST rates per service category.** Confirmed as varying — now expanded into section 2A,
   which is the highest-priority open item in this brief.
8. **Place of supply** for online and in-person services supplied to unregistered guests — IGST vs
   CGST+SGST, and exactly what we must capture at checkout.
9. ~~Should registered hosts issue their own tax invoices, or is self-billing acceptable?~~
   **Confirmed: self-billing is acceptable.** See section 1A. Remaining sub-question — please review the
   wording of the authorisation in Host Agreement clause 6.1 and tell us whether anything further is
   required to make it valid (for example a specific form of consent, or a record we must retain).
10. Which **turnover thresholds** arrive earlier now that declared revenue is gross merchandise value
    rather than fee income — tax audit and any others.
11. Whether our own **GST registration needs amendment** for the change in the nature of supply.

---

## 2A. The category-treatment problem — highest priority

The CA has confirmed SAC and rate vary by category, and specifically raised **medical practitioners
offering consultations** through the Platform. On examination this is not a rate question. It may be a
structural one, and it may mean merchant-of-record is the wrong model for some categories.

### The medical question

Healthcare services are **exempt** under Notification 12/2017-CT(R), Entry 74. But the exemption is
framed around *who supplies*: "a clinical establishment, an authorised medical practitioner or
para-medics."

Under merchant of record **the supplier is Book A Sloth**, which is none of those things.

> **Q1. Does the Entry 74 exemption survive when Book A Sloth, as merchant of record, resells a
> consultation performed by an authorised medical practitioner? Or does our outward supply become
> taxable at 18%?**

Both answers cost us, so we need to know which:

- **Exemption does not carry** → a ₹1,000 consultation that attracts no GST when the doctor bills the
  patient directly becomes roughly ₹1,190 through us. That is likely fatal for the category, and we
  should not onboard doctors at all under this model.
- **Exemption does carry** → we are making exempt supplies. That triggers input tax credit apportionment
  under Rules 42 and 43, so part of the credit on *our own* costs (gateway charges, hosting, software)
  becomes non-recoverable in proportion to exempt turnover — reducing margin across the entire book, not
  only on medical bookings.

> **Q2. If the exemption does carry, quantify the Rule 42/43 reversal on a book that is, say, 20% exempt
> by value.**
>
> **Q3. Our ₹10 booking charge is presumably taxable even where the underlying service is exempt. Does
> that make the transaction a composite or a mixed supply, and how must the invoice present it?**

### Advocates and reverse charge

Legal services supplied by an advocate to a business entity fall under reverse charge. We are a business
entity, so a host who is an advocate supplies to us under RCM.

> **Q4. Confirm that an advocate host's supply to us is under reverse charge, that we must self-invoice
> under section 31(3)(f) and discharge the tax, and that we may then claim it as credit. Is the resulting
> outward supply to the guest taxable at 18%?**

This is a materially different money flow from every other category, not a different rate.

### Everything else we think varies

Our current understanding, for correction:

| Category | What we think | Confirm? |
|---|---|---|
| Doctor / medical consultation | Exempt at source — survival on resale unknown | **Q1** |
| Advocate / legal | Reverse charge to us as a business | **Q4** |
| Yoga instruction | Exempt only where the supplier is registered under 12AA/12AB; a commercial instructor is 18% | ? |
| Tutoring / coaching | 18% for a private tutor; exempt for an "educational institution" | ? |
| Salon, fitness, photography, astrology, events, consulting | Plain 18% | ? |

> **Q5. Please give us the treatment (taxable / exempt / reverse charge), the rate, and the SAC code for
> each category, so we can hold them in a table rather than in code.**

### What we intend to do meanwhile

Launch with plain-18% categories only, and gate medical, legal, and charitable-yoga behind a flag until
each is ruled on. Host Agreement clause 6.9 reserves the right to do this. Please confirm that is
prudent, and flag any category in the table above that we have mis-assumed as safe.

---

### Specific document points for the CA

- **Host Agreement clause 5.2** treats all Platform prices as tax-inclusive. Is that formulation safe?
- **Clause 6.3** makes denied input tax credit recoverable from the host. Enforceable as drafted?
- **Clause 6.4** — the *Payment Advice* for unregistered hosts. We have been explicit that it is not a
  tax invoice and generates no credit. Confirm the format and the wording are correct.
- **Host Fee Schedule section 4** contains the worked examples hosts will rely on. Please check every
  number.

---

## 3. Questions for counsel

### 3.1 Points where we believe the drafting is deliberately weak, and want confirmation

We have **not** attempted to disclaim the following, because we believe the attempt would fail and
would also contradict our tax position. Please confirm or correct:

1. **Consumer Protection Act 2019 liability cannot be contracted away.** As seller of record we are the
   supplier and are liable to the guest for deficiency in service. Guest Terms clause 8 is drafted on
   that basis rather than attempting a broad exclusion.
2. **An arbitration clause does not bind a consumer** in India; consumer disputes are non-arbitrable.
   Arbitration therefore appears only in the Host Agreement (clause 20), not in the guest documents.
3. **An exclusive jurisdiction clause cannot override a consumer's statutory right** to file where they
   reside or work (CPA §34(2)(d)). The previous Terms claimed exclusive jurisdiction at Jajpur against
   all users; that has been removed for guests.
4. **"All sales final" cannot defeat a deficiency-of-service claim.** The Refund Policy therefore states
   cancellation windows but preserves the statutory remedy expressly.

### 3.2 Points where we have drafted in the company's favour and want an enforceability opinion

Please tell us which of these would survive challenge, and which read as **unfair contract terms** under
CPA §2(46) and are liable to be struck down under §49(2)/§59(2):

| Ref | Term |
|---|---|
| Host Agreement 7.1 | Twice-monthly payment cycle, 7-day clearing before a booking enters a cycle |
| Host Agreement 7.2 | ₹500 minimum payment threshold, balance carried forward |
| **Host Agreement 7.3** | **10% security holdback for the first 90 days / 20 bookings** — we consider this the most likely to be challenged |
| Host Agreement 7.4 | Broad right to defer payment during any open complaint or verification |
| Host Agreement 7.7 | Statement deemed accepted after 30 days |
| Host Agreement 9.1 | Broad set-off, including ₹500 chargeback handling charge |
| Host Agreement 12.3 | ₹250 handling charge on host cancellation or non-attendance |
| **Host Agreement 15.3** | **12-month disintermediation with liquidated damages at 3× charges, capped ₹10,000** — genuine pre-estimate, or a penalty? |
| Host Agreement 18.3 | Our liability to hosts capped at 3 months' charges or ₹10,000 |
| Host Agreement 19.4 | Final payment up to 120 days after the last booking |
| Guest Terms 5.2 / Refund 2 | Booking and processing charge non-refundable on guest cancellation |
| Refund 1 | 24h / 6h cancellation tiers with 100% / 50% / 0% refund of the service amount |

The hosts are businesses, so we expect more latitude there than in the guest documents — but several
hosts will be individuals, and we would like to know where that distinction stops helping us.

### 3.3 Structural questions

5. **Consumer Protection (E-Commerce) Rules 2020.** As an *inventory* e-commerce entity rather than a
   *marketplace* entity, Rule 7 duties appear to attach to us directly, and they are more onerous than
   the marketplace regime we were previously in. Please advise what we must publish, disclose, and
   operate as a result. **This is the compliance surface we understand least.**
6. **Substitution right** (Host Agreement 3.4 / Guest Terms 5.5) — we allow ourselves to substitute an
   equivalently qualified provider, with a full refund if the guest objects. Acceptable?
7. **Host classification.** The Host Agreement is drafted as independent contractor. Given we set the
   commercial terms, hold the customer relationship, and control the platform, is there any misclassification
   risk we should be drafting against?
8. **Professional liability.** We are now the supplier of services performed by third parties, some of
   which are regulated or physical. Should the company carry professional indemnity or public liability
   insurance, and at what level? Host Agreement clause 17 indemnifies us, but an indemnity from an
   individual with no assets is worth little.
9. **DPDP Act 2023.** Host Agreement clause 13 treats the host as processing guest data on our
   instructions, with a 24-hour breach notification. Is that the correct allocation, and is the clause
   sufficient?
10. **Data of hosts.** We collect PAN, bank details, and KYC documents. Please confirm our retention and
    security obligations are adequately reflected in the Privacy Policy.
11. **The transition.** Existing hosts accepted the old marketplace terms. What is required to move them
    onto the Host Services Agreement — fresh affirmative acceptance, notice period, both? We assume
    fresh acceptance and have not drafted a migration mechanism yet.

---

## 4. The one commercial fact both reviewers should know

An unregistered host is legitimately below the GST threshold, so selling privately his service carries
no GST. By inserting ourselves as seller of record, **an 18% tax arises that did not previously exist**.
It is borne from the listed price, so the host's guest pays roughly 19% more than if the host had been
booked directly.

We have not hidden this. The Fee Schedule states it in section 5, the Host Agreement states it at clause
5.5, and the product shows the host the exact figures before publishing a price.

Please tell us if there is any structuring that mitigates it which we have missed, and whether our
disclosure of it is adequate.

---

## 5. What we are asking for

1. Confirmation that the merchant-of-record characterisation holds, and a list of anything in these
   documents that undermines it.
2. A redraft or markup of the Host Services Agreement and Guest Terms of Sale.
3. A view on each term in the table at 3.2.
4. Answers to the CA questions at section 2 that we can rely on.
5. Advice on the Consumer Protection (E-Commerce) Rules 2020 obligations.
6. A view on insurance.

We are not onboarding new hosts until this is done.

**Contact:** Shubham Narendra Datarkar · team@timewheel.co.in · +91 8637758344
**Company:** Timewheel Internet Private Limited · CIN U62012OD2026PTC052654 · GSTIN 21AAMCT8270C1ZF

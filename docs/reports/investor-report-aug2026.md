# Book A Sloth — Investor Update

**Reporting period:** 1–25 August 2026 (25 days) · **Prepared:** 25 Aug 2026
**Source:** Live production database (read-only). All figures in ₹ (INR).

> **Read this first — what stage we're at.** We flipped on *real-money payouts*
> (Razorpay Route + host KYC) during this window. So the numbers split cleanly
> into two stories: **subscription revenue is real cash in the bank**, while
> **per-booking transactions are still pilot/test-value** — hosts and our team
> were running ₹1–₹10 test bookings to validate the payment rail before real
> checkout volume ramps. We report both honestly rather than blending them.

---

## 1. Money — what we actually collected

| Line | Aug 1–25 | All-time |
|---|---|---|
| **Subscription revenue (real cash)** | **₹2,039** | **₹3,808** |
| Active paying subscribers | — | **4** |
| Paid subscription charges | 2 | 3 |
| GST invoices issued | 16 | 21 |

**Booking transactions (pilot — test-value, not real revenue yet):**

| Line | Aug 1–25 |
|---|---|
| Paid bookings | 17 |
| Booking GMV | ₹100 *(≈₹6/booking — test payments)* |
| Platform fee earned on bookings | ₹68 |
| Completed bookings (all-time) | 30 of 43 |

> **Transparency call-out (do not hide this):** the ₹100 booking GMV is **test
> and token-value transactions**, not customer revenue. Real per-booking revenue
> starts once payout-approved hosts turn on paid checkout at real prices. Our
> defensible revenue number for this period is the **₹2,039 in subscriptions.**

**Take-home for investors:** revenue is small and early, but it is *real,
recurring, and GST-compliant* — 4 paying subscribers, mostly on annual plans,
with proper tax invoices. The payment/payout infrastructure (Route, KYC, ledger,
GST) is built and live, so the transaction rail is ready before demand is.

---

## 2. Growth & funnel — the top is strong, the bottom is the work

| Stage | Aug 1–25 | Total to date |
|---|---|---|
| Leads generated | **146** | 208 |
| → of which from launch event ("The Opening") | 125 | 125 |
| New host accounts | 20 | 75 |
| Hosts who completed onboarding | — | 59 |
| Hosts with a **live, bookable service** | — | 34 |
| Hosts **KYC-approved (payout-ready)** | — | 7 |
| **Paying subscribers (active)** | — | **4** |
| Hosts who took a paid booking (window) | 3 | 5 (ever) |

**Lead sources (all-time):** event 125 · host self-signup 73 · guest booking 9.
**Lead status:** contacted 105 · activated 56 · new 30 · paid 17.

**Honest read:** we are very good at getting people *in* (208 leads, 75 hosts,
34 with a live listing) and not yet good at getting them to *pay and transact*
(4 paying, 3 active). That activation gap — signed-up host → payout-ready →
first real booking — is the single most important number to move next quarter,
and most of the product work below is aimed straight at it.

---

## 3. Engagement & retention

| Metric | Value |
|---|---|
| Unique paying guests | 20 |
| Repeat guests | 7 (**35% repeat rate**) |
| Reviews collected | 5 · **avg 5.0 / 5** |
| Support-bot conversations (all-time) | 329 |
| Active hosts in window | 3 |

Early, but the signal is positive: a 35% repeat-booking rate and a perfect (if
tiny) review sample suggest the core experience works when a host is live. The
constraint is supply activation, not guest satisfaction.

---

## 4. Product — what shipped this window

**170 changes merged to production in 25 days.** Major themes:

- **Sales CRM built end-to-end** — leads auto-created on signup/booking, lead
  scoring + intent engine, Kanban pipeline, sequences, WhatsApp/email outreach.
  This is the machine that will close the activation gap above.
- **Payments & payout rail live** — Razorpay Route, deferred KYC (verify only
  after first earning), gap-free GST invoicing, financial ledger hardening.
- **Onboarding redesign** — all 4 screens rebuilt, first service created on the
  "You're live" screen, live profile preview, multiple host-loss bugs fixed.
- **Activation loop** — host activation-funnel analytics, earnings-triggered
  upgrade nudges, weekly host recap email (the retention habit loop).
- **Positioning** — site-wide shift to "a booking link that gets you paid."

---

## What we recommend disclosing (transparency audit)

To keep this credible with investors, **lead with these, don't bury them:**

1. **Separate real revenue from test volume.** Headline the ₹2,039 subscription
   cash; label booking GMV as pilot/test. Blending them would overstate revenue ~20x.
2. **Show the activation gap openly** (146 leads / 20 signups / 4 paying). It's a
   solvable funnel problem and the CRM was built to solve it — that's a stronger
   story than hiding the drop-off.
3. **Frame the stage correctly:** infrastructure-complete, pre-transaction-scale.
   The value built this quarter is the *rail* (payments, KYC, CRM, GST), which
   de-risks the next quarter's revenue ramp.
4. **Small-n honesty:** several metrics (reviews, repeat rate) sit on <25 data
   points — present them as directional signal, not proven trend.

*All figures pulled directly from the production database on 25 Aug 2026 and are
reproducible on request.*

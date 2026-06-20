# Project Status — Book A Sloth

_Last updated: 2026-06-20_

---

## Current State: LIVE in Production

Book A Sloth is **live on its custom domain** as of 2026-06-19/20. The booking platform is functionally complete and all critical flows work end-to-end.

**Live URLs:**
- Frontend: `https://bookasloth.com` (+ `www`) — Vercel (Root Directory = `client`)
- Backend: `https://book-a-sloth.onrender.com` — Render Web Service (`/api`)
- DB: Supabase Mumbai (`ayjhlwyzszykqtnaktpb`)

**Go-live ops — ALL DONE 2026-06-20 (founder-confirmed):**
- ✅ Razorpay live creds + webhook (`/api/payment/webhook`, 6 events)
- ✅ `bookasloth.com` DNS (Vercel nameserver delegation, SSL valid) + Vercel `API_ORIGIN` set (edge 301 + sitemap rewrite work)
- ✅ UptimeRobot keep-alive on `/health` (counters Render free-tier spin-down)
- ✅ Supabase PITR upgrade, `main` branch-protection, `service_role` key rotation
- ✅ First admin `founder` seeded + mandatory 2FA enrolled
- ✅ GSC domain verified + sitemap submitted (12 URLs discovered)
- ✅ Real test booking e2e + Google OAuth consent-screen publish

**Test coverage:** server **595** / client **160** — all passing.

---

## ✅ What's Complete

### Booking & Payments
- ✅ Guest OTP-based booking (DB-backed OTP, survives restarts)
- ✅ Logged-in user booking (skips OTP)
- ✅ Double-booking prevention (grace period + `bookings_no_overlap` gist constraint)
- ✅ Razorpay payments (service + plan + product) + actual fee recording
- ✅ Full money model v3: platform fee + 18% GST + commission GST + subscription GST, split Razorpay fee/tax
- ✅ Booking reschedule with guest acknowledgement + reschedule fee
- ✅ Google Calendar Meet event for online bookings (deferred to post-payment for paid services)
- ✅ 24h/1h reminder emails + missed-webhook reconciler cron

### Authentication
- ✅ Host (Google-only) + guest signup/login; phone-primary user login
- ✅ Permanent usernames (history + gated change RPC + edge 301)
- ✅ Password reset via OTP, JWT auto-refresh
- ✅ Admin RBAC auth (bcrypt, lockout, separate store) + **mandatory TOTP 2FA** (all admins)

### Host Dashboard & Public
- ✅ Services CRUD (v2 fields), availability editor, bookings management
- ✅ Earnings + payout requests + transaction history (paid-only vendor visibility)
- ✅ Public profile (theme), service detail, badge showcase, reviews
- ✅ Vendor paid-only-visibility enforced

### Plans, Subscriptions & Settlement
- ✅ DB-driven plan config + enforcement; admin plan management
- ✅ **Monthly + annual subscriptions** via Razorpay Subscriptions (auto-renew)
- ✅ **Settlement engine P2** — accurate vendor balance (completion + 7d clearing window)
- ✅ **Admin payout approval** workflow (pending → approved → paid / rejected, ledger relief)
- ✅ Financial Ledger **P1** — double-entry accounting + hourly self-heal reconciler

### Platform Systems
- ✅ Email engine (DB templates, multi-provider, queue/retry) — **Resend live on prod**
- ✅ Notification system (AiSensy WhatsApp, DB-configured) + host WhatsApp OTP verify
- ✅ Email + WhatsApp **campaign platform** (contacts/segments/worker, consent-enforced)
- ✅ Email **unsubscribe** (marketing opt-out, HMAC token)
- ✅ Badge system (DB rule engine + auto-eval)
- ✅ **Feature kill-switches** (33 flags, admin-managed) + bidirectional reviews kill-switch
- ✅ Admin RBAC (6 roles, 45 perms, audit log, staff mgmt)
- ✅ Razorpay admin config (DB-backed encrypted creds, no hardcoded keys)
- ✅ **Newsletter** signup (homepage → welcome email)
- ✅ Admin-managed **navbar logo** + email logo
- ✅ Guest booking history (`/my-bookings` → `CustomerBookings.jsx`)
- ✅ **SEO**: dynamic sitemap engine + admin service/profile SEO + JSON-LD + robots.txt (live, GSC-submitted)
- ✅ Analytics stack (PostHog + GA4 + Meta Pixel + Clarity, consent-gated) + LP conversion pages
- ✅ Deploy hardening (8 PRs: backup workflow, runbook, webhook alert, reconciler, Sentry no-op, etc.)

---

## 🔄 Partial / Not Yet Built

| Feature | State | Gap |
|---|---|---|
| Refunds | `refunded` enum only | No Razorpay refund API (= Ledger P3) |
| Ledger P4 | P1 + P2 built | Reconciliation, accounting periods, reports/exports, GST invoicing, TDS |
| Analytics dashboard | Attention queue real | SuperDashboard trend % still hardcoded; no GMV/MRR/churn/funnel |
| CMS pages | Admin UI shells | No DB tables (pages, blogs, FAQ, testimonials; newsletter welcome shipped) |
| Support center | Admin UI shells | No DB tables (tickets, disputes) |
| KYC / provider verification | UI shell | No state machine |
| Badge metrics | 12 of 14 real | `avg_response_time_minutes` + `login_streak` = 0 (no data source) |
| Deferred email triggers | Templates ready | Birthday, anniversary, profile-completion, subscription-expiring, milestones, login-alert not wired (need DOB col + crons + counter hooks) |
| Campaign v2 | Broadcast works | Delivery/read funnel + scheduled-send trigger (column exists, scheduler unwired) |
| Explore page | Capture only | Deferred ~3–4mo; only `discovery_events` live (do NOT apply v2.9_explore.sql) |
| SEO Phase 3 | Phases 0–2 shipped | Prerender/SSR for non-JS crawlers (see `docs/seo-aeo-geo-plan.md`); llms.txt |
| Build-in-public blog | 30 posts drafted | Not published (`docs/build-in-public-blog-series.md`) |

**Ideas / not committed:** Razorpay Route (split payouts), coupons/discounts, multi-currency, referral/affiliate, Twilio as alt WhatsApp provider, system-health dashboard, admin SSO.

---

## 🛠 Remaining Ops (founder, not code)

These are the **only** ops items still open after the 2026-06-20 go-live:
1. Dedicated **staging Supabase** project (prod currently has no isolated staging DB)
2. Activate **#79 daily DB backup** — add repo secrets `BACKUP_DATABASE_URL` + `BACKUP_PASSPHRASE`, run once, test-restore
3. Set **`SENTRY_DSN`** in Render to activate #83 error tracking (currently no-op)

## 🧩 Data Loose Ends (verify)
- `v1.7_pricing_snapshot.sql` (`commission_applied`) — code has schema fallback; confirm applied live
- `server/scripts/backfillLedger.js` — historical ledger backfill not yet run on live (run with `--dry-run` first)

---

## 📋 Next Priorities (by impact)
1. **Refunds** (Razorpay refund API + Ledger P3) — only money flow still missing
2. **Analytics dashboard** — replace hardcoded SuperDashboard trends with real GMV/MRR/churn
3. **Wire deferred email triggers** — `SUBSCRIPTION_EXPIRING` first (cheapest churn-saver)
4. **Badge metric data sources** — response-time + login-streak hooks
5. **SEO Phase 3** — prerender bot traffic to lift the AEO/GEO ceiling

---

## Related Documentation
- [ROADMAP.md](ROADMAP.md) — full backlog (note: some "planned" items now shipped)
- [current-state.md](current-state.md) — feature-level working/broken
- [DECISIONS.md](DECISIONS.md) — why key choices were made

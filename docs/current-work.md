# Current Work — Book A Sloth
_Last updated: 2026-07-02_

## Sprint: Service Category Redesign (branch `feat/service-categories`) — built 2026-07-02

> **Status: BUILT.** Migration split into a zero-downtime pipeline `v3.60`→`v3.61`→`v3.62`→`v3.63`, NOT yet applied to either DB. Full release runbook: `docs/releases/2026-07-03-service-category-v3.60-release.md`.

**Spec / plan:** `docs/superpowers/specs/2026-07-02-service-category-redesign-design.md`; `docs/superpowers/plans/2026-07-02-service-category-redesign.md`.

Closes the gaps left by the 2026-06-21 service-categories build (below): categories are now a composite-FK-enforced pair instead of a loose slug, and the category catalog gets public SEO landing pages + a live Explore listing.

- **Migration set (PENDING both DBs) — zero-downtime 4-phase split:** `v3.60_service_category_expand.sql` (additive only: nullable `services.primary_category`, `service_categories.description`/`.icon`, `CREATE INDEX CONCURRENTLY idx_services_prof_cat`); `v3.61_service_category_backfill.sql` (data only, idempotent plain statements + optional batched `PROCEDURE` for scale: orphan `service_categories` cleanup, stamp the pair from the host's profession where valid, clear stale unpaired rows); `v3.62_service_category_validate.sql` (read-only gate, RAISEs if any constraint precondition is unmet); `v3.63_service_category_enforce.sql` (composite FK `fk_services_category` + `fk_sc_primary` + CHECK `chk_category_pair`, each `ADD ... NOT VALID` then `VALIDATE CONSTRAINT` to avoid scan-under-strong-lock). Rollback for the enforce phase: `v3.63_service_category_rollback.sql`.
- **Server:** `resolveAndValidateCategory` (`server/lib/serviceCategory.js`) now returns `{ok,value,primary}`; both service writers (`serviceController.js`, `hostController.js`) stamp the pair, with 42703 schema fallbacks for pre-migration DBs. `PUT /api/host/categories` de-categorises services on profession change and returns `services_cleared` in the response. `serviceCategoryController.js` gained description/icon fields, a friendly 400 on FK violation (23503), and a cached public list (`responseCache`, key `svccat:`, `Cache-Control: 300`); all 4 admin mutations bust `svccat:` + `svcdir:` + sitemap cache.
- **New public endpoints:** `GET /api/services-directory` + `GET /api/services-directory/:profession` (`servicesDirectoryController.js`/`servicesDirectoryRoutes.js`, cached `svcdir:`, template description fallback, 404 for unknown/empty professions). Real `GET /api/explore` `listVendors` (profession `category` + `service` params; `service` requires `category` else 400; verified hosts only; paginated). `/sitemap-professions.xml` added as a sitemap-index child.
- **Seed:** `serviceCategorySeed.js` entries are now `string | {name, description}`; 10 professions with curated descriptions (photographer added). `seedServiceCategories.js` gap-fills `description` where NULL — **re-run on both DBs after v3.60 applies**.
- **Client:** new public routes `/services` (`ServicesDirectory.jsx`) + `/services/:profession` (`ProfessionServices.jsx`), built on `ServiceCategoryCard` + `professionIcons.js`; `services` added to `reservedSegments`. **Explore page goes live** (`COMING_SOON` stub removed) — real API listing, `service` filter chip, stale-async-response guard (`e7c3672`, review finding). `AdminServiceCategories` modal gained description/icon fields; `CategoriesSection` toast now surfaces `services_cleared`.
- **Ops (zero-downtime Expand→Deploy→Backfill→Validate→Enforce):** the enforce-phase CHECK/FK reject the OLD server's `category`-without-`primary_category` writes (23514/23503), so enforcement must never precede the new server. Split so each phase is independently safe. Order, staging Tokyo first then prod Mumbai, once per DB: **(1)** apply `v3.60` expand (additive, invisible to old code — safe even before deploy); **(2)** merge + deploy SERVER (new code writes complete pairs; still forward-compatible via 42703 fallbacks); **(3)** apply `v3.61` backfill; **(4)** run `node server/scripts/seedServiceCategories.js` (idempotent gap-fill of descriptions); **(5)** apply `v3.62` validate — a raised exception here is a hard STOP; **(6)** on green, apply `v3.63` enforce; **(7)** deploy client. Rollback the enforce phase with `v3.63_service_category_rollback.sql` (drops the 3 constraints, instant, no data change). Full step-by-step with health checks + rollback per stage: `docs/releases/2026-07-03-service-category-v3.60-release.md`.

## Sprint: Guest/Host URL Separation (branch `feat/guest-host-url-separation`) — built 2026-06-24

> **Status: BUILT, tests green (client 254/254, server 758/758, client build clean). NOT merged. No DB migration.**

**Spec / plan:** `docs/superpowers/specs/2026-06-24-guest-host-url-separation-design.md`; `docs/superpowers/plans/2026-06-24-guest-host-url-separation.md`.

Separate-account model enforced at the routing layer (**supersedes** the unified-account decision in the 2026-06-23 account-role-separation spec). Guest = phone identity, host = email identity; one identity = one type.

- **Guest space → `/user/*`:** `/user/my-bookings`, `/user/profile`, `/user/reviews`, `/user/loyalty`. Old flat paths are bare `<Navigate replace>` redirects (in-flight email links / bookmarks keep working).
- **Two-way role wall:** new `HostRoute`/`GuestRoute` (`client/src/components/common/`) compose the existing `ProtectedRoute` (auth + onboarding-resume untouched) and add a role gate. Guest on `/dashboard/*` → guest equivalent (`hostPathToGuestPath`); host on `/user/*` → `/dashboard`. Shared `isHost(user)` + path map in `client/src/utils/roleRoutes.js`. No feature flag — the wall is un-toggleable.
- **Leave-review `/review/:bookingId` stays shared** (role-agnostic, ownership-checked, top-level — NOT under /user) so either party can use the booking-completed email CTA.
- **`become-host` in-place role flip removed** (client `activateHost` + CTAs in BeASloth/Dashboard; server `POST /auth/become-host` route + `becomeHost` handler + its test). "Become a host" now routes to host signup (separate email/Google account). Dashboard's dead guest branch → `<Navigate to="/user/my-bookings">`.
- **Server/static:** email footer link → `/user/my-bookings`; `robots.txt` → `Disallow: /user/`; removed the auth-gated `/reviews` entry from the sitemap.
- **Reserved usernames** extended (`review`, `refund`, `lp`) so a host slug can't shadow a top-level route (`user` was already reserved).
- **Verification note:** E2E preview of the wall is blocked headlessly — `supabase.auth.onAuthStateChange` emits `SIGNED_OUT` and wipes any injected `localStorage` session. Covered instead by `RouteGuards.test.jsx` (real guard components, both directions + superadmin) + `roleRoutes.test.js`.

## Sprint: Service Categories (branch `feat/service-categories`) — built 2026-06-21

> **Status: BUILT, tests green (server 626/626, client 177/177, client build clean). NOT merged. Migration `v3.22` NOT yet applied to either DB.**

**Spec / plan:** `docs/superpowers/specs/2026-06-20-service-categories-design.md`; `docs/superpowers/plans/2026-06-21-service-categories.md`.

Each **service** now carries one `category` slug, drawn from the host's own categories (`profiles.categories`, primary-first; from PR #107). Built on top of #107 — fills the gap it left (#107 reworked *host* categories only, never touched `services`).

- **Migration `v3.22_service_category.sql` (NOT applied):** adds nullable `services.category TEXT` + `services_category_idx`. Additive/safe; no backfill.
- **Validation:** shared pure validator `server/lib/serviceCategory.js` (`validateServiceCategory` + `resolveAndValidateCategory`). Enforced server-side in BOTH service backends — `serviceController` (`/services`, dashboard) and `hostController` (`/host/services`, onboarding), create + update. A category not in the host's `profiles.categories` → 400. `host_id` always `req.user.id`.
- **Pre-migration tolerant:** `category` added to `V2_SELECT_COLS`; `hostController` safe-fallback regex broadened to include `category`; writes drop `category` gracefully until the column exists (currently load-bearing since v3.22 unapplied).
- **Client:** `ServiceCategoryPicker` (auto-chip when host has 1 category, single-select chips when 2–3), wired into dashboard `ServiceForm` + onboarding `FirstServiceStep`, default = `primary_category`. Category **badge** on dashboard list (`Services.jsx`) + public page (`ServiceDetail.jsx`, server-resolved `category_label`). slug→label via `categoryUtils.categoryLabel`.
- **Deferred (follow-ups):** Explore filter by category; sharpen `admin_category_stats()` to count by the service's own category; guard against null-wiping a category on update for a 0-category host; client retry if the host-categories fetch fails.
- **Ops:** `v3.22` **applied** to both Supabase projects (prod Mumbai `ayjhlwyzszykqtnaktpb` + staging Tokyo `xwvciqkayammbvsidqig`), verified 2026-07-01.

## Sprint: Industry Categories (branch `feat/category-system`) — built 2026-06-20

> **Status: BUILT, tests green (server 616/616, client 171/171, client build clean). NOT merged. Migration `v3.21` NOT yet applied to live DB.**

**Spec / plan:** `docs/superpowers/specs/2026-06-20-industry-categories-design.md`; `docs/superpowers/plans/2026-06-20-industry-categories.md`.

- **Migration `v3.21_industry_categories.sql` (NOT applied — destructive):** `categories` gains `group_label` + `status` enum `+disabled`; replaces the 11-row seed with the curated **60** (20 `active` Day-1 / 40 `disabled` Day-30+60); adds `profiles.primary_category`; clears host arrays referencing the old slugs; adds per-plan `limits.categories` (starter `0` locked / creator `1` / professional `3`); adds `admin_category_stats()` RPC (registered hosts + active services per category).
- **Plan caps** mirrored in `planService.FALLBACK_PLANS` (starter 0 / creator 1 / professional 3) and client `categoryUtils.getCategoryRules`.
- **Primary Category** is a first-class concept: chosen at onboarding (single-select "Pick Your Primary Service Category"), drives profile/listings. Free locked (contact admin), Creator swaps 1, Pro adds up to 3 (one always primary).
- **Endpoints:** `GET`/`PUT /api/host/categories` (plan-capped, pure validator `server/lib/categoryRules.js`), `PATCH /api/admin/users/:id/categories` (admin override, uncapped).
- **Admin `/admin/services/categories` redesigned:** grouped table with status **dropdown** (🟢 Active / 🔴 Off), 5 columns (Category Name · Status · Registered Hosts · Active Services · Date Added), summary strip, delete-guard (blocks delete when hosts registered; server returns 409). Vendor "suggest category" pending flow retained.
- **Profile settings:** new plan-gated "Categories" tab (`components/dashboard/CategoriesSection.jsx`). **HostProfile** shows a primary-category chip; `getHostProfile` returns `primary_category_label`.
- **Ops:** `v3.21` **applied** to the live Supabase DBs (verified 2026-07-01). Remaining (optional): phased rollout = flip Day-30/Day-60 categories to Active when ready.

## Sprint: Financial Ledger P1 (Ledger Core) — Double-Entry Accounting (DONE 2026-06-13)

> **Status: SHIPPED on branch `sd/adoring-elgamal-625af7` (NOT merged).** Migrations APPLIED to live Supabase (`xwvciqkayammbvsidqig`). Tests: server **281/281**, client **115/115**, build clean. Live ledger integrity verified: Σdebit = Σcredit, imbalance 0.

**Spec / plan:** `docs/superpowers/specs/2026-06-13-financial-ledger-p1-design.md`; `docs/superpowers/plans/2026-06-13-financial-ledger-p1.md` (full P1→P5 decomposition; only **P1** built).

**Migrations (applied live):**
- `v2.8_financial_ledger` — `chart_of_accounts` (+12 seeded accounts), `journal_entries`, `journal_lines`, `ledger_entries`, `account_balances`, `subscription_payments`; +10 `bookings` columns; RLS deny-all on all; `post_journal_entry(jsonb)` RPC (atomic, balanced, idempotent on `source_type+source_id`).
- `v2.8.1_ledger_hardening` — ordered account locks, idempotency-race handling, auto-seed balance rows, immutability triggers on journal/ledger tables, ledger amount CHECK, dropped redundant index, clock_timestamp ledger ordering.
- `v2.8.2_subscription_payment_idempotency` — partial unique index on `subscription_payments.razorpay_payment_id`.

**Money model v3 (was v2.2):**
- Added **commission GST** = 18% of commission, vendor-borne. New vendor payable = `service_price − commission − commission_gst − razorpay_fee − razorpay_tax`. Fixtures: Free ₹1000 → vendor ₹917.40; Paid ₹1000 → ₹976.40. Razorpay fee now stored **split** (`razorpay_fee_actual` excl-tax + `razorpay_tax_actual`). Old bookings keep original snapshots.
- **Subscription GST**: plans charge 18% on top (₹999 → ₹1,178.82 total, ₹179.82 GST). New `subscription_payments` records each charge. Subscription Razorpay fees are platform-borne (expense); order fees vendor-borne.
- `server/lib/pricingEngine.js` v3: `calculateCommissionGst`, new `calculateVendorPayout(price, commission, commissionGst, razorpayFee)`, `computeBreakdown` returns `commissionGst`, `computeSubscriptionBreakdown`.

**Posting pipeline:**
- Pure builders `server/services/ledger/journalTemplates.js` → `server/services/ledger/postingService.js` (`post` throws / `postSafe` never throws) → RPC. Order-payment template posts gross receivable + same-entry gateway relief (Razorpay Receivable = net remittance; account 5000 nets 0).
- Triggers wired: `paymentController.verifyPayment` posts ORDER_PAYMENT + stamps `paid_at` + fee/tax split + concurrent-verify guard (`.neq payment_status paid`); `bookingController.completeBooking` stamps `completed_at`/`revenue_recognized_at`/`revenue_recognition_status=recognized`/`settlement_status` (paid→`eligible_for_settlement` else `not_eligible`) + idempotent re-complete guard; `verifySubscription` inserts `subscription_payments` + posts SUBSCRIPTION_PAYMENT + replay guard.
- **Self-heal**: hourly `server/services/ledger/ledgerReconciler.js` cron (env `LEDGER_RECONCILE_INTERVAL_MIN`, default 60) reposts paid bookings + subscription_payments missing a journal entry; per-row try/catch.
- **Backfill**: `server/scripts/backfillLedger.js` (idempotent, `--dry-run`) replays historical paid bookings/plan_purchases/executed payouts. **NOT yet run on live** (dataset near-empty today; run at deploy from an env with `server/.env`).

**Admin (API + UI):**
- API `/api/admin/finance/*` (`server/controllers/financeAdminController.js`): summary, accounts, journals, journals/:id, ledger/:accountId (reads, `finance.view`); adjustment, reversal, bank-transfer (writes, `finance.manage`). New perm `finance.manage` added to `lib/adminPermissions.js` + live admin_roles finance row.
- UI (new FINANCE nav): `AdminFinanceDashboard.jsx` (`/admin/finance`, 12 metric cards), `AdminJournal.jsx` (`/admin/finance/journal`, browser + expandable lines + reverse + manual-entry modal with client-side balance gate), `AdminLedger.jsx` (`/admin/finance/ledger`, per-account running balance). `UpgradePlan.jsx` shows +18% GST line.

**NOT done (future phases):** P2 settlement engine (eligibility/batches/holds/vendor ledger), P3 refunds, P4 reconciliation+periods+reports/exports, P5 Razorpay recurring-mandate subscriptions. Followups noted in PR: `getSummary` in-memory aggregation → P4 SQL view; account_code 400-vs-500 on adjustment; fee-fetch-failure has no auto re-fetch (manual ADJUSTMENT).

## Sprint: Communication → Campaign Platform — Email + WhatsApp (SHIPPED 2026-06-12)

> **Status: SHIPPED.** Audience + segment + campaign layers built on the existing engines; migrations v2.6 + v2.7 applied live; email **and** WhatsApp broadcast campaigns work. Tests: server **253/253**, client **113/113**. Local-only git (branch `feat/email-campaigns`, no GitHub remote), committed task-by-task.

**What shipped (plan: `docs/superpowers/plans/2026-06-12-email-campaigns.md`; reference: `docs/communication-campaigns-architecture.md`; guides: `docs/guides/*-campaigns.md`):**
- **Audience:** `contacts` table synced from profiles/bookings/product_purchases (vendor phones included), per-channel `*_opt_in` / `*_suppressed`; `segments` (4 system seeds) resolved with consent enforced.
- **Campaign engine:** `email_campaigns` + `campaign_recipients` + a throttled `campaignWorker` (60s). Email reuses `communicationEngine` queue/retry (Resend for bulk); WhatsApp sends approved AiSensy templates via `aisensyService` with named variable mapping (`whatsappTemplateService`).
- **Consent enforced twice** (segment resolve + worker re-check); inbound **STOP** opt-out via public secret-gated `POST /api/notifications/aisensy/webhook` → `whatsapp_suppressed`.
- **Admin:** `/admin/campaigns` (`AdminCampaigns.jsx`) — builder with channel selector, segment recipient-count preview, email/WhatsApp template pick, launch + the WhatsApp template registry. API `/api/admin/campaigns/*`. New perms `campaigns.view`/`campaigns.manage` (marketing + super). Provider self-test `POST /api/admin/email/test-provider`.
- **Deferred:** stepped AiSensy onboarding wizard (Task 20, cosmetic); delivery/read funnel (open rates / read receipts) = v2; scheduled-campaign trigger (column exists, scheduler not wired).
- **Manual e2e still TODO (needs live creds):** real Resend send; real AiSensy send to an opted-in test number + STOP suppression. Code + all unit tests pass without creds.

### Audit findings that motivated the rebuild (kept for reference)

- **Full plan:** `docs/superpowers/plans/2026-06-12-email-campaigns.md` — 26 tasks across 3 phases, TDD with complete code + tests per step. Execute on command, all 3 phases together.
- **Trigger:** UX audit of "Communication Settings". The area is messy — email and WhatsApp (AiSensy) configuration are spread across **three overlapping admin pages** with **two divergent data models**.
- **Audit findings (recorded for the rebuild):**
  - Two admin pages overlap: `AdminNotifications.jsx` (`/admin/notifications`, AiSensy + per-event email toggles) and `AdminCommunication.jsx` (`/admin/platform/communication`, email templates/logs/settings). Plus an empty `AdminNewsletter.jsx` shell promising "campaigns".
  - **Two event registries:** `notification_events` (channel routing + AiSensy campaign names, 12 rows) vs `email_templates` (content, 29 rows) — divergent lists, no single "what fires on event X" view.
  - **Dead field:** `notification_events.email_subject` is editable in the UI but ignored by the engine (which uses `email_templates.subject`).
  - **Two log stores, double-logged:** `notification_logs` + `email_logs`, surfaced in two separate "Logs" tabs.
  - **No campaigns at all:** the only "campaign" today is the AiSensy `campaign_name` text field per event; no audience/segment concept; WhatsApp `{{n}}` param order is hardcoded in code.
  - **The real gap:** no contactable/consented audience layer. Contacts are scattered across `profiles` (email only, no phone), `bookings` (`guest_*`), `product_purchases` (`buyer_*`); no suppression/opt-out anywhere. "System in place, purpose unfulfilled" = there was no list to point the engines at.
- **Architecture decided (4 layers):** Delivery (exists: communicationEngine + aisensyService) → Routing (exists: notification_events) → **Audience (new: `contacts` + consent/suppression + `segments`)** → **Campaign (new: `email_campaigns` + `campaign_recipients` + a throttled worker)**. Campaigns reuse the existing `email_logs` queue + 60s worker; no new send infra.
- **Phase plan:** P1 Email campaigns (Tasks 1–12) → P2 WhatsApp campaigns (Tasks 13–21, additive, never edits P1 schema) → P3 Documentation (Tasks 22–26).
- **Key decisions made this session:**
  - Bulk email → **Resend** (provider abstraction already supports it); transactional OTP can stay SMTP. Gmail/Workspace SMTP can't do campaign volume.
  - Schema is **multi-channel from Phase 1** (contacts/segments/recipients all channel-aware), so WhatsApp slots in additively.
  - **Consent basis:** users agree via T&C at signup to email + WhatsApp; suppression/opt-out is still enforced in two places (segment resolve + worker re-check). WhatsApp STOP → suppress via a webhook (P2).
  - Naming debt accepted: the campaigns table stays named `email_campaigns` even when holding WhatsApp campaigns (avoids a risky live rename).
  - **Git: local only, never pushed.** Migrations (v2.6, v2.7) are additive and need explicit go before hitting live Supabase.
- **Open confirmations before/within execution:** vendor phone source (P2 pre-task — may scope WhatsApp to guests first), AiSensy Pro webhook payload shape (P2 Task 18), `RESEND_API_KEY` + verified sender for the email e2e.

## Sprint: Auth Split + Availability Engine + Theme/Media Fixes (DONE 2026-06-11)
- **Vendor Google-only auth**: `GET /api/auth/google/vendor?intent=signup|login` (public) → callback auto-creates/logs-in vendor with ONE consent screen (identity + full calendar scopes). Session minted password-less via `mintSessionForEmail()` (admin generateLink → disposable-client verifyOtp — same poisoning rule as signInWithPassword). Tokens delivered in URL fragment to `/auth/google/done`. New pages: `/be-a-sloth` (signup), `/login-as-vendor` (login), `GoogleAuthDone.jsx`. Legacy `/login` email/password kept for pre-migration vendors (back-compat).
- **OAuth state JWT**: both flows now carry signed state (`OAUTH_STATE_SECRET` env, falls back to service-role key) — fixes CSRF gap + email-collision token attach. Legacy calendar-connect identifies vendor by `state.uid`, not email match. Callback stores `google_id` (v2.5 column, schema fallback) and seeds `availability.timezone` from Google Calendar settings (only when no availability row exists).
- **CalendarStep fixed**: was `window.location='/api/auth/google?onboarding=true'` → 401 JSON (protected endpoint, no header). Now uses `connectGoogleCalendar()`; auto-skips when `google_calendar_connected`.
- **Customer identity = mobile**: booking phone now required; OTP keyed by normalised phone (email fallback for old clients) in `otp_codes` (email PK column stores the identifier — no migration needed); delivery via WhatsApp (AiSensy engine) + email backup. `verify-otp` accepts `{email, phone, otp}`. `/signup` route → redirect home (no customer registration); Navbar → "Be a Sloth"/"Vendor Login". Guest account still auto-created by email server-side (notifications/receipts stay email-driven).
- **Availability engine** (`server/services/availabilityService.js`): slots = working hours − blocked_dates − platform bookings (grace-padded) − **Google FreeBusy** − buffers. Google failures fail-OPEN (outage must not block bookings). New `GET /api/bookings/available-slots?host_id&service_id&date` — ServiceBooking renders the server list (legacy client computation kept as deploy-skew fallback). `createBooking` validates via `validateSlot` (replaces inline conflict loop); `createOrder` re-validates BEFORE charging (excludeBookingId=self); reschedule keeps `end_at` in sync.
- **Migration `v2.5_google_auth_availability.sql` (APPLIED via MCP)**: `profiles.google_id`, `bookings.end_at` (backfilled), `bookings_no_overlap` EXCLUDE USING gist (host_id =, tstzrange(scheduled_at,end_at) &&) partial: non-cancelled + end_at NOT NULL + scheduled_at > 2026-06-11. Insert/reschedule catch 23P01 → 409. Grace padding stays app-level by design.
- **Blocked dates**: column existed but was never written/read anywhere. Added editor in Availability.jsx (date list, save includes blocked_dates), enforced in engine + client calendar `isDateSelectable`.
- **Media**: cover photo cropper REMOVED — plain file input → `/upload/image?folder=covers` → object-cover render. Profile photo keeps ImageCropper (crop/zoom/drag).
- **Theme**: root causes = (1) server silently dropped invalid hex (now 400) + no plan enforcement (now 403, palettes mirrored from themeUtils), (2) CSS vars only applied on HostProfile. `applyProfileTheme` extended (--profile-accent-hover/light/dark via `shadeHex`); now applied in ServiceBooking + ServiceDetail; ServiceDetail Book CTAs consume vars; Razorpay modal colour was hardcoded indigo → host theme. `svcGetPublicByProfile` vendor select += theme_color, plan.
- **Deps**: server += `jsonwebtoken`. Tests: server 205/205, client 112/112, build clean.
- **NOT done / decisions**: vendor password login still functional server-side (back-compat; UI no longer offers it for new vendors).

### Open-item follow-ups (DONE 2026-06-11, same day)
- **Google tokens encrypted at rest**: `server/utils/cryptoTokens.js` AES-256-GCM (`enc:v1:iv:tag:ct`). Key = `GOOGLE_TOKEN_KEY` env (32B base64/hex) or scrypt-derived from service-role key (zero-config). `decrypt()` passes legacy plaintext through verbatim → no breakage, re-encryption optional. Encrypt on write in authController `attachGoogleToProfile`; decrypt on read in availabilityService `getGoogleBusy` + bookingController createCalendarEvent. Hygiene script `scripts/encryptGoogleTokens.js` (idempotent, run once).
- **FreeBusy cache + visible degrade**: migration `v2.6_freebusy_cache.sql` (APPLIED) `google_freebusy_cache(host_id, day, busy jsonb, fetched_at)` deny-all RLS. `getGoogleBusy` now returns `{intervals, unverified}`: success caches; failure reads last-good cache (unverified=true) else `[]`. computeSlots returns `calendarUnverified`; ServiceBooking shows amber "couldn't reach calendar, subject to confirmation" banner. Still fail-open.
- **Google-vendor slim onboarding**: new Google signups get `onboarding_slug=username` + `onboarding_step_completed=3` → ProtectedRoute routes them into type→category→booking-type→[calendar auto-skips]→profile→first-service→plans (verify+password done by Google). Schema-guarded; existing/legacy vendors untouched. `markGoogleVendorOnboarding()` in authController.
- **Customer bookings page**: `client/src/pages/CustomerBookings.jsx` at `/my-bookings` (was vendor Dashboard) — read-only upcoming/past list from existing `GET /bookings/guest`, join + cancel. NOTE: pure phone-OTP guests have no session yet, so this serves session-bearing guests; magic-link guest sessions = future work.
- Dep: server += `jsonwebtoken`. Tests: server 205/205, client 112/112, build clean.

### OAuth e2e coverage + bug fix (DONE 2026-06-11)
- **Bug fixed**: `googleCallback` catch block sent ALL failures to `/dashboard?google=error`. For a vendor-auth failure (e.g. `mintSessionForEmail` throws) the user isn't logged in → `/dashboard` bounces to `/login` = dead-end. Now tracks `isVendorAuthFlow` and routes vendor-auth failures to `/login-as-vendor?error=auth_failed` (VendorLogin already has copy for it).
- **New test** `server/tests/unit/authGoogleOAuth.test.js` (9 tests): real `jsonwebtoken` state sign/verify + real flow branching, Google (`googleapis` + config/google) and `mintSessionForEmail` mocked. Covers signup (new→createUser+mint+new=1), login (existing host→no create+new=0), customer-email rejection, forged state→invalid_state (CSRF, no Google call), missing code→400, mint-throws→/login-as-vendor, calendar-connect→/dashboard?google=connected. Closest CI can get to live consent (real Google round-trip still needs manual post-deploy smoke).
- Tests: server **214/214**, client 112/112.

## Sprint: Admin Platform M0 + M1 — RBAC Foundation (DONE 2026-06-11)
- Phase 1 architecture doc: `docs/admin-platform-architecture.md` (audit, IA, RBAC, DB plan, milestones, all decisions in Part L).
- **M0 hygiene**: removed dangerous `POST /admin/cleanup-users`; fixed `getStats` revenue bug (now sums `platform_fee_amount + commission_applied` from SELECTed columns — was always ₹0); added `maintenanceMiddleware` enforcing `platform_settings.maintenance_mode` (503 public, admin stays reachable, 30s cache, busted on settings save); admin JWT secret now fail-closed in production (`adminAuthService` throws if `SUPER_ADMIN_JWT_SECRET` unset).
- **Migration `v2.4_admin_rbac.sql` (APPLIED via MCP)**: `admin_roles`, `admin_users` (SEPARATE bcrypt credential store, NOT auth.users), `admin_audit_logs` (append-only). All `deny_all` RLS. Seeded 6 roles + 4 staff accounts.
- **Auth rewrite**: `adminAuthController` now authenticates against `admin_users` (username OR email + bcrypt), 5-fail/15-min lockout, mints JWT carrying role + resolved permissions. `lib/adminPermissions.js` = canonical catalog (45 perms) + 6 roles, kept in sync with DB seed. `requireAdmin(permission)` / `requireSuperAdmin` middleware replace blanket guard; applied per-route across ALL admin endpoints. `services/auditService.js` `audit()` on every destructive mutation (user/booking/service/staff). `GET /admin-auth/me`.
- **New modules**: staffAdminController (CRUD/invite/reset/activate, last-super + self-deactivate guards), opsAdminController (`/admin/ops/summary` real attention queue), auditAdminController (`/admin/audit` viewer).
- **Frontend**: AdminLogin → username field; AdminLayout guard → `type==='admin'`, permission-aware nav (hides items the role lacks), sidebar recolored to brand ink `#1E1E1E`; new AdminStaff + AdminAudit pages (routes `/admin/staff`, `/admin/system/audit`); SuperDashboard Operations Center now uses real `/ops/summary` (removed fake trends/chart/pending=0).
- **Verified live**: all 4 logins work; RBAC enforced (finance 403 on staff, 200 on ops); audit rows written; revenue now ₹2 (real). Tests: server 205/205, client 112/112.
- **Admin logins** (credentials delivered in chat, NOT committed): superadmin/ops/finance/support at `/hello-sloth`. Change passwords after first login.


## Sprint: Email Communication Engine (DONE 2026-06-10)
- Migration `v2.3_email_communication_engine.sql` (APPLIED): email_settings (single-row provider+brand config), email_templates (DB templates keyed by event_key+audience, one active per pair), email_logs (backs BOTH queue status=queued AND delivery log; attempts/retry/provider_response/is_test).
- 29 templates seeded (`config/emailTemplates.js` + `scripts/seedEmailTemplates.js`) covering all §20: auth (OTP, email verify, password reset), security (password changed, login alert), booking confirm/reminder/cancel/complete/reschedule (customer+vendor), profile, badge, 4 milestones, subscription, celebrations. 17 new events registered in notification_events.
- Core under `server/services/email/`: placeholderResolver ({{snake_case}}, globals, unknown→'' tracked), emailLayout (ONE 600px header+footer shell — no template has its own), providers/ (smtp working + resend + ses behind getProvider factory — swap via email_settings.provider), communicationEngine (render→OTP immediate|queue→provider→log).
- Queue worker in server.js (60s): retry backoff 5m/30m/2h then permanent fail. OTP/password reset send immediately (immediate:true).
- NotificationEngine email path now delegates to communicationEngine by (event, audience, data) — NO inline HTML in business logic. All callers migrated: auth (OTP/reset/password-changed), booking (all lifecycle, both audiences, +new BOOKING_COMPLETED_VENDOR), payment (paid confirm + SUBSCRIPTION_PURCHASED), badge assign (BADGE_UNLOCKED), vendor onboarding OTP. notification_logs kept as cross-channel summary; email_logs is the email detail.
- Admin: `/api/admin/email/*` (templates CRUD/duplicate/archive/preview/test, logs search, settings, events) + rebuilt AdminCommunication.jsx (Templates+editor w/ live iframe preview & test send, Logs w/ retry, Settings provider picker, System Events) at /admin/platform/communication.
- Test mode: marked is_test, excluded from normal logs view (PRD §15). Tests: server 172/172 (added placeholderResolver 11 + communicationEngine 9), client 113/113.
- DEFERRED triggers (templates seeded + fire-ready, no live trigger yet): BIRTHDAY/ACCOUNT_ANNIVERSARY (need DOB+cron), PROFILE_COMPLETION_REMINDER & SUBSCRIPTION_EXPIRING (need cron), milestones 10/50/100 (need counter hook), LOGIN_ALERT (would wire on login). notificationAdminController retry tool still uses raw sendEmail (admin infra, not business template).

## Sprint: Final Commission/Fees/Payout Model (DONE 2026-06-10)
- Migration `v2.2_payout_model.sql` (APPLIED): bookings += platform_fee_gst, razorpay_fee_actual, customer_total, gst_rate. platform_settings seeded platform_fee=10, platform_fee_gst_rate=0.18.
- Money model: customer pays service + platform_fee(₹10 flat, admin-editable) + 18% GST. Razorpay fee ALWAYS vendor-borne, recorded ACTUAL from `razorpay.payments.fetch().fee` at capture. Vendor payout = price − commission − actualRazorpayFee. Commission = plan.commission_percentage % of price (DB-driven). GST is pass-through liability, not platform revenue.
- `server/lib/pricingEngine.js` fully rewritten: pure, config-injectable, commission% as param. Removed old tiered fee / ₹200 floor / 30-day grace logic. New `computeBreakdown()` helper. Tests rewritten (23 cases incl spec's worked ₹100 examples).
- `server/services/platformConfig.js` reads platform_fee + gst_rate from settings (60s cache, robust parse, clearCache on admin save).
- bookingController: snapshot uses computeBreakdown + plan commission% + settings; stores all new columns w/ schema fallback. paymentController.createOrder charges customer_total (incl GST); verifyPayment fetches actual Razorpay fee → finalises vendor_amount.
- COMMISSION CORRECTED: paid plans (creator/professional) now 0% (were 5%) per final spec — Free=5%, paid=0%. Live DB + v2.1 seed updated.
- Client ServiceBooking checkout now shows Platform fee + GST lines and charges customer_total (was omitting GST → would've under-shown the total).
- Live verified: Free ₹100 → vendor ₹92.66/platform ₹15; Paid → ₹97.66/₹10; GST ₹1.80. Tests: server 158/158, client 113/113.
- Future-ready (not built): Razorpay Route split, refunds, GST invoicing, TDS — schema/snapshots support them.

## Sprint: Subscription Plans Module v1.1 (DONE 2026-06-10)
- Migration `v2.1_subscription_plans.sql` (APPLIED to live DB): `subscription_plans` table — limits/features/integrations JSONB, commission_percentage, sort_order, active. Seeded Starter (₹0)/Creator (₹999)/Professional (₹3,650) verbatim from spec JSON. profiles plan CHECK relaxed to allow 'starter'.
- `server/services/planService.js` — cached DB reads, legacy alias explorer→starter, fallback defaults pre-migration. NO hardcoded plan logic anywhere.
- `planMiddleware.js` rewritten DB-driven; booking limit is now per subscription YEAR (anchor = plan_activated_at). paymentController PLAN_PRICES removed → reads annual_price from DB; subscription expiry fixed 30→365 days; plan_activated_at now set on purchase.
- Admin: `/api/admin/plans*` (create/edit/archive/restore/clone/reorder/assign; min 2 / max 3 active plans enforced) + rebuilt `AdminPlans.jsx`; public `GET /api/plans` for the pricing page.
- KNOWN DECISION: commission_percentage seeded at 5% for ALL plans per spec JSON, but payout math still uses pricingEngine (paid plans 0%) — the PRD v2.0 contradicts the JSON here; wire pricing to plan.commission_percentage once resolved.
- PRD DOCX generated at docs/BookASloth_Subscription_PRD_v2.docx.
- Tests: server 166/166, client 113/113.

## Sprint: Badge System (DONE 2026-06-10)
- Migration `v2.0_badge_system.sql` (APPLIED to live DB via MCP): `badge_categories`, `badges`, `badge_rules`, `vendor_badges` (soft-revoke history, partial unique index on active awards), `vendor_metrics` SQL view (14 PRD metrics, one batched read — no N+1). Seeded 5 categories + 10 BAS Team manual badges.
- `server/services/badgeEngine.js` — zero badge-specific logic; rules from DB; groups ANDed internally, combined with badge.rule_logic; awards engine badges, auto-revokes ONLY engine-awarded ones. Hourly cron in server.js (`BADGE_EVAL_INTERVAL_MIN`) + event hooks on booking completion and review creation.
- APIs: `/api/admin/badges*` (CRUD, status, rule preview, evaluate, vendor assign/revoke with required reason) behind `requireSuperAdmin`; public `/api/vendors/:username/badges[/:badgeId]` — negative badges filtered at query layer, 404 for unknown usernames (no enumeration), 60s cache headers, rank by assigned_at order.
- Client: `AdminBadges.jsx` (`/admin/badges`, sidebar → OPERATIONS → Badges) — list w/ earned_count, 4-step wizard with visual rule builder + live vendor-count preview, vendor badge audit panel; `BadgeShowcase.jsx` public at `/:username/badges` (responsive 2/3/5 grid, accessible modal w/ focus trap + Escape, full-screen on mobile).
- Known gaps: `avg_response_time_minutes` and `login_streak` metrics have no data source yet (exposed as 0 in the view); badge image upload uses URL field (reuse Cloudinary upload pipeline later).
- Tests: server 166/166, client 113/113 passing.

## Sprint: Dynamic Notification System (DONE 2026-06-10)
- New tables (migration `v1.9_notification_system.sql`, ALREADY APPLIED to live DB via MCP): `notification_providers`, `notification_events`, `notification_logs`; hardened `otp_codes` (otp_hash, attempts, send_count, first_send_at, locked_until). v1.7 `commission_applied` also applied.
- `server/services/notificationEngine.js` — central dispatcher. Business code emits semantic events (`BOOKING_CONFIRMED_CUSTOMER` etc.); engine reads channel toggles + AiSensy campaign names + provider key from DB, sends WhatsApp (AiSensy) + email, logs to `notification_logs`. 60s config cache; `clearCache()` after admin edits.
- `server/services/aisensyService.js` — AiSensy campaign API client (no hardcoded keys/campaigns).
- `server/utils/otpStore.js` rewritten: bcrypt hash, 10-min TTL, 3 attempts, 3 sends/hour, 15-min lockout; legacy plaintext fallback for pre-v1.9 DBs.
- Controllers refactored to engine events: auth (OTP, password reset), booking (confirm/cancel/complete/reschedule/reminders — also fixed undefined `sendAppointmentWhatsApp` bug), payment (paid confirmations).
- Admin: `/api/admin/notifications/*` (provider masked-key CRUD, test connection, events CRUD, test send, logs, retry) + `client/src/pages/admin/AdminNotifications.jsx` at `/admin/notifications` (sidebar → PLATFORM → Notification Settings).
- AiSensy credentials live in the `notification_providers` DB row (entered via admin UI), never in code.
- Tests: server 155/155, client 113/113 passing.

## Sprint: Bug Fixes + Project Memory Setup

### Completed This Session

#### Fix 1 — commission_applied schema error (DONE)
- **File:** `server/controllers/bookingController.js`
- **Root cause:** `v1.7_pricing_snapshot.sql` not applied to live DB
- **Fix:** Booking INSERT now uses `bookingPayload` object; on schema-cache error, retries without `commission_applied` field using destructuring
- **Lines:** ~254–295

#### Fix 2 — OTP "No OTP found" bug (DONE)
- **File:** `server/utils/otpStore.js`
- **Root cause:** In-memory `Map` cleared on server restart / multi-instance deployments
- **Fix:** Full rewrite to use `otp_codes` Supabase table via `supabaseAdmin`. Uses `upsert` (email is PK). `verify()` does DB lookup + expiry check + single-use delete.
- **Benefit:** OTPs now survive server restarts and work across multiple instances

#### Fix 3 — Dashboard View Public Page icon (DONE)
- **File:** `client/src/pages/services/ServicesList.jsx`
- **Root cause:** Href was `/profile/service/${s.slug}` — a non-existent route
- **Fix:** Added `useAuth` import, `const { user } = useAuth()`, changed href to `/${user?.username}/booking/${s.slug}`

#### Fix 4 — Booking Flow UI card width consistency (DONE)
- **File:** `client/src/pages/ServiceBooking.jsx`
- **Root cause:** OTP/payment/confirmed steps used `max-w-lg mx-auto` making them narrower than time/details steps
- **Fix:** Removed `max-w-lg mx-auto` from all 3 cards, standardised to `p-5 sm:p-7`. Added `max-w-md mx-auto text-center` inner wrapper for icon/heading content

#### Fix 5 — bookingController.js truncated file (DONE)
- **File:** `server/controllers/bookingController.js`
- **Root cause:** File was truncated at line 706 (processReminders function incomplete)
- **Fix:** Appended missing tail of `processReminders` function + `module.exports` block using coverage report as reference

#### Docs — Project Memory (DONE — this session)
- Created `CLAUDE.md` at repo root
- Created all 11 `docs/*.md` files

---

## Pending Actions

### Must Do Before Production
1. ~~Run migration `v1.7_pricing_snapshot.sql`~~ — **DONE.** `commission_applied` is
   applied on both DBs (verified 2026-07-01). All migrations through v3.57 are applied.

2. **Test end-to-end booking flow** with a real service (routine regression check)

### Nice To Have
- Guest booking history: dedicated page for guests at `/my-bookings`
- Review submission: UI for guests to leave reviews after completed bookings
- WhatsApp notifications: re-enable Twilio in `notify.js` when credentials ready
- Admin payout workflow: complete approval/reject UI in `AdminSettings` or new page

---

## Recent Architectural Decisions

### OTP Storage: Memory → Database
- Previous: `Map` (cleared on restart)
- Current: `otp_codes` Supabase table via `supabaseAdmin.upsert()`
- Reason: Production server restarts lost all pending OTPs
- Impact: `otpStore.set/verify/cleanup` are now async DB operations (were synchronous)
- Callsites unaffected — already `await`-ing them

### Booking Insert: Direct → Payload Object with Fallback
- Previous: Inline object literal with `commission_applied` field
- Current: `bookingPayload` object, try with `commission_applied`, fallback without
- Reason: Matches existing fallback pattern in SELECT queries; survives pre-v1.7 DBs
- Impact: Booking creation works on any DB state

### ServicesList URL Fix
- Previous: `/profile/service/${s.slug}` (404)
- Current: `/${user?.username}/booking/${s.slug}`
- Reason: Route is `/:username/booking/:serviceSlug` per App.jsx

# Current Work — Book A Sloth
_Last updated: 2026-06-11_

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
1. **Run migration** `server/migrations/v1.7_pricing_snapshot.sql` in Supabase SQL Editor
   - Adds `commission_applied NUMERIC(10,2) NOT NULL DEFAULT 0` to `bookings`
   - Until done: column not stored but fallback prevents crashes

2. **Test end-to-end booking flow** with a real service after migration

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

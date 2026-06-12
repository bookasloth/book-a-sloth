# Current State — Book A Sloth
_Last updated: 2026-06-12_

## ✅ Working Features

### Booking Flow
- Date/time selection with booked-slot exclusion (grace period aware)
- Guest OTP verification (DB-backed — survives server restarts)
- Logged-in user booking (skips OTP — BUG-16 fix)
- Booking creation with pricing snapshot (vendor_amount, platform_fee_amount)
- commission_applied insert with schema fallback for pre-v1.7 DBs
- Razorpay payment integration
- Google Calendar event creation for online bookings
- Confirmation emails (host + guest)
- Booking confirmation UI step

### Dashboard
- Services list with filter, search, toggle, duplicate, delete
- View Public Page icon links to correct URL (`/:username/booking/:slug`)
- Add/Edit service with slug, rich fields
- Availability editor (weekly schedule + blocked dates)
- Bookings list with cancel/complete/reschedule
- Earnings overview
- Payout requests
- Transaction history

### Authentication
- Vendor + guest registration
- Login with JWT + refresh token auto-refresh on 401
- Google OAuth for calendar
- Password reset via OTP
- Admin auth (OTP-based, separate JWT)

### Public Profiles
- Host profile with theme color
- Service listing
- Plan-gated avatar border color
- Service detail page
- Review display

### Pricing
- Platform fee tiers: ₹0/₹2/₹5/₹10
- Commission: 5% of amount above ₹200 (free plan, after 30-day grace)
- Paid plans: 0% commission
- Plan limits enforced (services, bookings/month, products)

### Reminders
- 24h and 1h booking reminder emails
- Cron runs every 5 minutes

## ⚠️ Pending / Known Limitations

### DB Migration Required
- `v1.7_pricing_snapshot.sql` must be run in Supabase SQL Editor
- Adds `commission_applied` column to bookings
- Fallback code in `bookingController.js` handles missing column gracefully
- Until migration runs: `commission_applied` snapshot not stored

### Twilio WhatsApp Disabled
- All WhatsApp sends in `notify.js` are stubs (`sendAppointmentWhatsApp` → returns false)
- OTP → email only
- Appointment notifications → email only
- Re-enable: restore Twilio imports in `notify.js`

### Features Not Yet Built
- Guest booking history dashboard (guests redirected to `/my-bookings` but shows host dashboard)
- Booking reschedule UI in guest-facing flow (API exists, UI limited)
- Review submission UI (API exists, no dedicated page)
- Admin payout approval workflow (requests stored, approval UI may be partial)
- **Email & WhatsApp campaigns (SHIPPED 2026-06-12)** — broadcast to consented segments at `/admin/campaigns`. Audience (`contacts` + consent/suppression), `segments`, `email_campaigns`/`campaign_recipients`, throttled `campaignWorker`. Email via Resend (set provider in Communication → Settings); WhatsApp via approved AiSensy templates. Reference: `docs/communication-campaigns-architecture.md`; guides: `docs/guides/`. **Pending:** real-creds e2e (Resend + AiSensy test number), delivery/read funnel (v2), scheduled-send trigger.

## Environment Status
- Server port: 5000
- Client port: 5173 (dev) / built to `client/dist/`
- DB: Supabase (PostgreSQL)
- Auth: Supabase Auth with service role on server
- Payments: Razorpay (test/live keys in env)
- Email: SMTP via Nodemailer
- Upload: Cloudinary

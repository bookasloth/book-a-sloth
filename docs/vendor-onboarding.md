# Vendor Onboarding — Complete 10-Step Flow

## Overview
The vendor onboarding is a continuous, stateful experience where:
- Every step persists its state immediately
- Vendors can resume from their last incomplete step
- Account creation happens ONLY after OTP verification
- Payment is verified via webhook before plan activation
- Profile photo and bio are optional but encouraged early

## Database Changes
**Migration: `v1.8_vendor_onboarding.sql`**

New tables:
- `otp_sessions` — stores email + phone OTPs with expiry and attempt tracking (server-only RLS)
- `razorpay_orders` — tracks plan purchase orders and payment verification status

New `profiles` columns:
- `onboarding_slug` — claimed username (unique)
- `onboarding_step_completed` — integer 0–10 for resume logic
- `vendor_type` — 'individual' or 'organisation'
- `categories` — JSONB array of selected service categories
- `booking_type` — 'online_only', 'offline_only', or 'both'
- `calendar_connected` — true if Google Calendar linked
- `calendar_skipped` — true if intentionally skipped
- `onboarding_completed` — true when finished
- `plan_activated_at` — when paid plan activated

## Steps (10 Total)

### Step 0: Claim Username (`/vendor-register`)
- **Action:** Input slug (e.g., "yourname")
- **Validation:** URL-safe, 3–60 chars, debounced availability check
- **Save:** `sessionStorage.onboarding_slug = slug`
- **Navigate:** → Step 1

### Step 1: Verify Details (`/vendor-register/:slug/verify`)
- **Action:** Submit name, email, phone
- **API:** POST `/api/onboarding/send-otp` → sends OTP to email + WhatsApp (parallel)
- **OTP UI:** Two input boxes side-by-side, 6-digit codes, 10-min expiry, max 3 attempts, 60s resend cooldown
- **Verification:** Both email OTP required, phone OTP optional
- **Save:** `otp_sessions` table with hashed OTPs, attempt counts, expiry timestamps
- **Navigate:** → Step 2

### Step 2: Password (`/vendor-register/:slug/password`) — **ACCOUNT CREATION POINT**
- **Action:** Set password (min 8 chars, strength indicator)
- **API:** POST `/api/onboarding/create-account`
  - Checks OTP verification status
  - Creates Supabase auth user
  - Creates profile with role='host'
  - Saves to localStorage as JWT session
- **Navigate:** → Step 3

### Step 3: Vendor Type (`/vendor-register/:slug/type`)
- **UI:** Two large button cards (Individual / Organisation)
- **Auto-save:** Selection immediately persists
- **Navigate:** → Step 4

### Step 4: Categories (`/vendor-register/:slug/category`)
- **UI:** Multi-select tile grid (11 categories + Other)
- **Validation:** At least one required
- **Save:** `profiles.categories` array
- **Navigate:** → Step 5

### Step 5: Booking Type (`/vendor-register/:slug/booking-type`)
- **UI:** Three toggle buttons (Online only / In-person only / Both)
- **Auto-save:** Selection persists
- **Skip condition:** If 'offline_only' selected, skip calendar step (step 6)
- **Navigate:** → Step 6

### Step 6: Calendar (`/vendor-register/:slug/calendar`)
- **Skip logic:** If booking_type='offline_only', skip here automatically
- **UI:** One primary CTA "Connect Google Calendar" + smaller "Skip for now" link
- **Google OAuth:** Redirect to `/api/auth/google?onboarding=true` (re-uses existing oauth callback)
- **Save:** `profiles.google_calendar_connected=true OR calendar_skipped=true`
- **Navigate:** → Step 7

### Step 7: Profile (`/vendor-register/:slug/profile`)
- **UI:** Drag-drop profile photo (crop to square, max 5MB) + 160-char bio textarea
- **Auto-upload:** Image immediately uploaded to Cloudinary
- **Skip option:** "Skip for now" link at bottom
- **Save:** `profiles.profile_image`, `profiles.bio`
- **Navigate:** → Step 8

### Step 8: First Service (`/vendor-register/:slug/first-service`)
- **Fields:**
  - Title (required, text input)
  - Short description (required, max 140 chars)
  - Type: Online / In-Person (select)
  - Duration (required, minutes, number input)
  - Price (required, numeric input in ₹)
- **API:** POST `/api/host/services` → creates service with auto-slug
- **Save:** `onboarding_step_completed=8` in profiles
- **Navigate:** → Step 9

### Step 9: Plans (`/vendor-register/:slug/plans`)
- **UI:** Three plan cards in a grid (500–1000px width each)
  - Explorer: ₹0 — free tier
  - Creator: ₹999/year — 2px border accent + "Most Popular" badge (pre-selected)
  - Professional: ₹3,650/year — premium tier
- **Payment Flow (for paid plans):**
  1. POST `/api/onboarding/create-order` → creates Razorpay order, stores in DB with status='pending'
  2. Open Razorpay checkout (frontend-side)
  3. On success, POST `/api/onboarding/verify-payment` with `razorpay_payment_id`, `order_id`, `plan`
     - Verifies payment via Razorpay API
     - Updates `razorpay_orders.status='completed'`, `payment_verified=true`
     - Activates plan: `profiles.plan=plan`, `plan_expires_at=1yr`, `onboarding_completed=true`
  4. On failure, return to this step with error banner
- **Free plan:** Activates immediately without Razorpay
- **Navigate:** → Step 10

### Step 10: Explore (`/vendor-register/:slug/explore`)
- **UI:** Welcome screen with Sloth emoji
- **CTAs:**
  - Primary: "📅 Book a demo with the BAS team" (links to demo booking flow)
  - Secondary: "Go to my dashboard" →
- **Action on either CTA:** POST `/api/onboarding/mark-complete` → `profiles.onboarding_completed=true`, `onboarding_step_completed=10`
- **End:** Redirect to `/dashboard` or demo flow

## Resume Logic

When a vendor returns (logs in):
1. ProtectedRoute calls GET `/api/onboarding/status` → returns `{ slug, stepCompleted, isComplete }`
2. If `isComplete=true`: Allow dashboard access
3. If `isComplete=false`: Redirect to **next incomplete step**
   - Next step = steps[stepCompleted] (0-indexed)
   - URL = nextStep.replace(':slug', savedSlug)

**Example:** If stepCompleted=5 (booking-type), redirect to /vendor-register/:slug/calendar

## API Endpoints

### Public (no auth required)

```
POST /api/onboarding/check-slug
  Params: { slug }
  Response: { available: boolean }

POST /api/onboarding/send-otp
  Params: { slug, email, phone, name }
  Response: { message: "OTPs sent..." }

POST /api/onboarding/verify-otp
  Params: { slug, channel: 'email'|'phone', otp: string }
  Response: { verified: true, message }

POST /api/onboarding/create-account
  Params: { slug, email, password, name }
  Response: { id, token, refresh_token, slug }
  Creates auth user + profile (ACCOUNT CREATION)
```

### Protected (require JWT auth)

```
POST /api/onboarding/update-step
  Params: { slug, step: number, data: object }
  Response: { message, step, profile }

GET /api/onboarding/status
  Response: { slug, stepCompleted, isComplete }

POST /api/onboarding/create-order
  Params: { plan: 'explorer'|'creator'|'professional' }
  Response: { orderId, amount, currency, key } (for Razorpay)
    OR { plan, amount: 0, skipPayment: true } (for free plan)

POST /api/onboarding/verify-payment
  Params: { paymentId, orderId, plan }
  Response: { message, plan, onboarding_completed }

POST /api/onboarding/mark-complete
  Response: { message, onboarding_completed }
```

## OTP Lifecycle

### Storage: `otp_sessions` table
- Email OTP + Phone OTP stored separately with timestamps
- Max 3 verification attempts per channel
- 60-second lockout after 3 failed attempts
- 10-minute expiry from creation

### Attempt Tracking
```
email_attempts: 0
email_locked_until: null | TIMESTAMPTZ

phone_attempts: 0
phone_locked_until: null | TIMESTAMPTZ
```

### Cleanup
- OTPs auto-expire after 10 minutes
- Cron job periodically purges expired entries

## Razorpay Webhook (Future Enhancement)

For production, add webhook handler:
```
POST /api/payment/webhook/onboarding
```

Receives: `payment.captured` event from Razorpay

Action: Trigger `verifyRazorpayPayment` automatically instead of waiting for frontend redirect

## Error Handling

### Slug already taken
- Status 409: "Slug already taken"

### OTP expired
- Status 400: "Email OTP expired" or "Phone OTP expired"

### OTP invalid / attempts exceeded
- Status 400: "Invalid OTP" or "Too many attempts. Try again in 60 seconds."

### Account already exists for slug
- Status 409: "Account already exists for this slug"

### Email/phone not verified for account creation
- Status 400: "Email and/or phone verification required"

### Payment verification failed
- Status 400: "Payment not captured" or "Order ID mismatch"

## Security Considerations

1. **OTP Storage:** In-memory + DB (survives restarts)
2. **RLS:** otp_sessions and razorpay_orders have `DENY ALL` for authenticated users (server-only)
3. **Webhook Verification:** Razorpay webhook payload verified via signature (if enabled)
4. **Rate Limiting:** otpLimiter applies to /send-otp and /verify-otp (3 requests per minute per IP)
5. **Password:** Only accepted after OTP verification (prevents account hijacking)
6. **Session Isolation:** onboarding_slug used as request-scoped key to prevent cross-vendor interference

## UX Principles

1. **Progress visibility:** Progress bar at top shows step N of 10 + percentage
2. **Smooth transitions:** CSS fade/slide between steps (no flash)
3. **Mobile-first:** All steps responsive to 375px viewport
4. **Minimize friction:** Auto-advances when possible (type selection, category select)
5. **Skippable non-critical steps:** Profile photo, bio, calendar can be skipped
6. **Single primary CTA per step:** One action focus
7. **Form validation:** Real-time feedback, disabled button until valid

## Testing Checklist

- [ ] Slug availability check (debounced 400ms)
- [ ] OTP sending to email (HTML email template renders)
- [ ] OTP sending to WhatsApp (logs in dev mode)
- [ ] OTP verification with attempt lockout after 3 failures
- [ ] Account creation ONLY after OTP verification
- [ ] Password strength meter updates in real-time
- [ ] Each step saves immediately on completion
- [ ] Resume logic redirects to last incomplete step on login
- [ ] Offline vendor skips calendar step automatically
- [ ] Profile photo upload & crop
- [ ] First service creation with slug auto-generation
- [ ] Plan selection and Razorpay checkout flow
- [ ] Free plan activates without payment
- [ ] Payment verification marks plan as activated
- [ ] Onboarding completion redirects to dashboard
- [ ] Dashboard access blocked until onboarding complete
- [ ] Navigation between steps validates prerequisites
- [ ] Mobile layout at 375px width
- [ ] No console errors or broken routes

## Future Enhancements

1. Razorpay webhook auto-verification (payment.captured event)
2. Email template customization per locale
3. A/B testing on plan selection UX
4. Vendor referral code generation on completion
5. Integration with email deliverability monitoring
6. Abandoned onboarding recovery emails
7. Admin onboarding analytics dashboard

/**
 * featureRegistry.js — canonical list of platform kill-switches.
 *
 * Single source of truth for every admin-toggleable feature. On boot (and on
 * each admin GET /features) these rows are upserted into the `feature_flags`
 * table WITHOUT overwriting the `enabled` value of existing rows, so an admin's
 * on/off choice always wins over the default here.
 *
 * Defaults are ALL `true` — nothing ships off. A flag only changes behaviour
 * once an admin explicitly flips it in the Feature Status page.
 *
 * scope:    'vendor' | 'customer' | 'both'  (admin UI grouping)
 * category: free-text bucket within a scope
 *
 * Enforcement: server middleware `requireFeature(key)` (routes) + client
 * `<FeatureGate flag={key}>` / `useFeature(key)` (UI). A flag with neither is
 * inert — see docs when adding new ones.
 */

const REGISTRY = [
  // ── VENDOR · Profile & Branding ──────────────────────────────
  { key: 'profile_photo',        label: 'Profile Photo',        category: 'Profile',  scope: 'vendor',   description: 'Vendor profile photo upload. Off = upload hidden, existing photos still shown.' },
  { key: 'cover_photo',          label: 'Cover Photo',          category: 'Profile',  scope: 'vendor',   description: 'Vendor cover/banner image upload. Off = cover section hidden.' },
  { key: 'theme_colors',         label: 'Theme Colours',        category: 'Profile',  scope: 'vendor',   description: 'Profile theme colour swatches. Off = forced to default brand colour.' },
  { key: 'custom_hex_color',     label: 'Custom Hex Colour',    category: 'Profile',  scope: 'vendor',   description: 'Pro-tier custom hex colour picker. Off = preset swatches only.' },
  { key: 'social_links',         label: 'Social Links',         category: 'Profile',  scope: 'vendor',   description: 'Social profile links on the public page. Off = social section hidden.' },
  { key: 'custom_slug',          label: 'Custom Profile URL',   category: 'Profile',  scope: 'vendor',   description: 'Vendor-chosen username/slug editing. Off = slug locked.' },

  // ── VENDOR · Services ────────────────────────────────────────
  { key: 'services',             label: 'Service Publishing',   category: 'Services', scope: 'vendor',   description: 'Create/edit/publish services. Off = service mutations blocked.' },
  { key: 'service_thumbnail',    label: 'Service Thumbnail',    category: 'Services', scope: 'vendor',   description: 'Service thumbnail crop/upload. Off = thumbnail editor hidden.' },
  { key: 'service_rich_overview',label: 'Service Rich Overview',category: 'Services', scope: 'vendor',   description: 'Rich-text overview editor on services. Off = editor hidden.' },
  { key: 'service_inclusions',   label: 'Inclusions / Exclusions', category: 'Services', scope: 'vendor', description: "What's included / not included tags. Off = sections hidden." },
  { key: 'service_faqs',         label: 'Service FAQs',         category: 'Services', scope: 'vendor',   description: 'Per-service FAQ builder. Off = FAQ builder hidden.' },
  { key: 'service_offline_type', label: 'Offline Services',     category: 'Services', scope: 'vendor',   description: 'Allow offline (in-person) service type. Off = online only.' },
  { key: 'service_custom_duration', label: 'Custom Duration',   category: 'Services', scope: 'vendor',   description: 'Arbitrary custom service duration. Off = preset durations only.' },
  { key: 'service_grace_period', label: 'Grace Period Buffer',  category: 'Services', scope: 'vendor',   description: 'Buffer minutes before/after a service. Off = no buffer option.' },

  // ── VENDOR · Products ────────────────────────────────────────
  { key: 'digital_products',     label: 'Digital Products',     category: 'Products', scope: 'vendor',   description: 'Sell downloadable digital products. Off = product mutations blocked.' },

  // ── VENDOR · Operations ──────────────────────────────────────
  { key: 'availability_editor',  label: 'Availability Editor',  category: 'Operations', scope: 'vendor', description: 'Weekly schedule + blocked dates editor. Off = availability locked.' },
  { key: 'payouts',              label: 'Payout Requests',      category: 'Operations', scope: 'vendor', description: 'Vendor payout requests. Off = payout requests blocked.' },
  { key: 'earnings',             label: 'Earnings View',        category: 'Operations', scope: 'vendor', description: 'Earnings dashboard. Off = earnings page hidden.' },
  { key: 'transactions',         label: 'Transaction History',  category: 'Operations', scope: 'vendor', description: 'Vendor transaction history. Off = page hidden.' },
  { key: 'plan_upgrade',         label: 'Plan Upgrade',         category: 'Account',  scope: 'vendor',   description: 'Subscription plan purchase/upgrade. Off = upgrades blocked.' },

  // ── VENDOR · Integrations ────────────────────────────────────
  { key: 'google_calendar',      label: 'Google Calendar',      category: 'Integrations', scope: 'vendor', description: 'Google Calendar / Meet integration. Off = connect hidden, no Meet links.' },

  // ── BOOKINGS (shared) ────────────────────────────────────────
  { key: 'reschedule',           label: 'Booking Reschedule',   category: 'Bookings', scope: 'both',     description: 'Allow guests and vendors to reschedule bookings. Off = all reschedule blocked.' },
  { key: 'reschedule_fee',       label: 'Reschedule Fee Charging', category: 'Bookings', scope: 'both',  description: 'Charge the vendor-set reschedule fee from the 2nd reschedule. Off = all reschedules free.' },

  // ── CUSTOMER · Booking ───────────────────────────────────────
  { key: 'guest_booking',        label: 'Guest Booking',        category: 'Booking',  scope: 'customer', description: 'Create new bookings. Off = booking creation blocked platform-wide.' },
  { key: 'guest_otp',            label: 'Guest OTP Verify',     category: 'Auth',     scope: 'customer', description: 'Email OTP for unauthenticated guests. Off = OTP flow blocked.' },
  { key: 'guest_signup',         label: 'Guest Signup',         category: 'Auth',     scope: 'customer', description: 'Customer account registration. Off = new guest signup blocked.' },
  { key: 'guest_login',          label: 'Guest Login',          category: 'Auth',     scope: 'customer', description: 'Customer sign-in. Off = customer login blocked.' },
  { key: 'razorpay_payment',     label: 'Razorpay Payment',     category: 'Payments', scope: 'customer', description: 'Paid checkout via Razorpay. Off = paid bookings/purchases blocked.' },
  { key: 'product_purchase',     label: 'Product Purchase',     category: 'Payments', scope: 'customer', description: 'Buy digital products. Off = product checkout blocked.' },
  { key: 'review_submission',    label: 'Review Submission',    category: 'Engagement', scope: 'customer', description: 'Submit reviews on bookings. Off = new reviews blocked.' },
  { key: 'customer_bookings',    label: 'Customer Booking History', category: 'Engagement', scope: 'customer', description: 'Guest "my bookings" dashboard. Off = page hidden.' },

  // ── CUSTOMER · Notifications ─────────────────────────────────
  { key: 'booking_reminders',    label: 'Booking Reminder Emails', category: 'Notifications', scope: 'customer', description: '24h / 1h reminder emails. Off = reminders not sent.' },
  { key: 'confirmation_emails',  label: 'Confirmation Emails',  category: 'Notifications', scope: 'customer', description: 'Booking confirmation emails. Off = confirmations not sent.' },
];

const KEYS = REGISTRY.map((f) => f.key);

module.exports = { REGISTRY, KEYS };

# Database Schema — Book A Sloth

## Run Order for Fresh Setup
1. `server/config/schema.sql` — base tables + RLS
2. `server/migrations/v1.6_catchup.sql` — all columns through v1.6
3. `server/migrations/v1.7_pricing_snapshot.sql` — commission_applied ⚠️ PENDING on production

---

## Tables

### profiles
Extends `auth.users`. One row per user (host or guest).
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | References `auth.users(id)` |
| name | TEXT | Display name |
| email | TEXT | |
| role | TEXT | `'host'` or `'guest'` |
| username | TEXT UNIQUE | URL slug for public profile |
| bio | TEXT | |
| tagline | TEXT | Short headline |
| profession | TEXT | |
| profile_image | TEXT | Cloudinary URL |
| cover_image | TEXT | Cloudinary URL |
| social_links | JSONB | `{ instagram, youtube, linkedin, ... }` |
| theme_color | TEXT | Hex color (plan-gated palette) |
| is_verified | BOOLEAN | Admin-set verification badge |
| plan | TEXT | `'explorer'` \| `'creator'` \| `'professional'` |
| plan_expires_at | TIMESTAMPTZ | Null = no expiry (lifetime) |
| plan_updated_at | TIMESTAMPTZ | |
| google_calendar_connected | BOOLEAN | |
| google_access_token | TEXT | |
| google_refresh_token | TEXT | |
| razorpay_account_id | TEXT | For payouts |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Trigger:** `on_auth_user_created` → auto-creates profile row on Supabase auth signup.

**RLS:**
- SELECT: public (anyone can read)
- UPDATE: `auth.uid() = id`

---

### services
One service per row. Services belong to a host.
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| host_id | UUID FK | → `profiles(id)` |
| title | TEXT | |
| description | TEXT | Legacy long description |
| short_description | TEXT | v2 — shown in cards |
| long_description | TEXT | v2 — full details |
| type | TEXT | `'one_on_one'` \| `'group'` \| `'paid_dm'` |
| service_type | TEXT | v2 alias: `'online'` \| `'offline'` |
| duration | INTEGER | Minutes |
| price | NUMERIC(10,2) | 0 = free |
| currency | TEXT | Default `'INR'` |
| meeting_mode | TEXT | `'online'` \| `'offline'` |
| thumbnail_url | TEXT | Cloudinary URL |
| grace_period_minutes | INTEGER | Default 10 — overlap buffer |
| slug | TEXT | URL slug (unique per host) |
| is_active | BOOLEAN | Default true |
| included_items | JSONB | v2 — what's included |
| excluded_items | JSONB | v2 — what's not included |
| faqs | JSONB | v2 — FAQ array |
| important_note | TEXT | v2 — disclaimer |
| total_bookings | INTEGER | Cached count |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Index:** `UNIQUE (host_id, slug)` — `services_host_slug_idx`

**RLS:**
- SELECT: `is_active = true`
- INSERT/UPDATE/DELETE: `auth.uid() = host_id`

---

### availability
One row per host. JSONB schedule.
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| host_id | UUID FK UNIQUE | → `profiles(id)` |
| weekly_schedule | JSONB | `{ monday: [{start,end},...], ... }` |
| blocked_dates | JSONB | Array of ISO date strings |
| timezone | TEXT | Default `'Asia/Kolkata'` |
| buffer_minutes | INTEGER | Gap between bookings |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:**
- SELECT: public
- INSERT/UPDATE: `auth.uid() = host_id`

---

### bookings
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| service_id | UUID FK | → `services(id)` |
| host_id | UUID FK | → `profiles(id)` |
| guest_id | UUID FK nullable | → `profiles(id)` (null for unregistered guests) |
| guest_name | TEXT | |
| guest_email | TEXT | |
| guest_phone | TEXT | |
| scheduled_at | TIMESTAMPTZ | UTC |
| status | TEXT | `'pending'` \| `'confirmed'` \| `'cancelled'` \| `'completed'` |
| payment_status | TEXT | `'unpaid'` \| `'paid'` \| `'refunded'` |
| payment_id | TEXT | Razorpay payment ID |
| meeting_link | TEXT | Google Meet URL |
| notes | TEXT | Guest notes |
| vendor_amount | NUMERIC | Pricing snapshot: vendor payout |
| platform_fee_amount | NUMERIC | Pricing snapshot: platform fee |
| commission_applied | NUMERIC | Pricing snapshot: commission ⚠️ requires v1.7 migration |
| reminder_24h_sent | BOOLEAN | |
| reminder_1h_sent | BOOLEAN | |
| reschedule_status | TEXT | `'none'` \| `'awaiting_guest_ack'` \| `'acknowledged'` |
| reschedule_ack_token | TEXT | One-time token for guest acknowledgement |
| reschedule_acknowledged_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:**
- SELECT: `auth.uid() = host_id OR auth.uid() = guest_id`
- INSERT: public (anyone can book)
- UPDATE: `auth.uid() = host_id OR auth.uid() = guest_id`

---

### otp_codes
Booking OTP + password reset OTP storage.
| Column | Type | Notes |
|---|---|---|
| email | TEXT PK | Normalized (lowercase, trimmed) |
| otp | TEXT | 6-digit string |
| phone | TEXT | Optional, default '' |
| type | TEXT | `'booking'` \| `'password_reset'` (default 'booking') |
| expires_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

**RLS:** `deny_all` policy — only supabaseAdmin can access.

---

### plan_purchases
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| vendor_id | UUID FK | → `profiles(id)` |
| plan | TEXT | `'creator'` \| `'professional'` |
| amount | NUMERIC | |
| razorpay_payment_id | TEXT | |
| purchased_at | TIMESTAMPTZ | |

---

### payout_requests
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| host_id | UUID FK | → `profiles(id)` |
| amount | NUMERIC(10,2) | |
| status | TEXT | `'pending'` \| `'approved'` \| `'rejected'` |
| created_at | TIMESTAMPTZ | |
| processed_at | TIMESTAMPTZ | |

---

### products
Digital downloadable products.
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| host_id | UUID FK | → `profiles(id)` |
| title | TEXT | |
| description | TEXT | |
| price | NUMERIC | 0 = free |
| file_url | TEXT | Cloudinary or signed URL |
| thumbnail_url | TEXT | |
| is_active | BOOLEAN | |
| purchase_count | INTEGER | Incremented via DB function |
| created_at | TIMESTAMPTZ | |

---

### product_purchases
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| product_id | UUID FK | → `products(id)` |
| buyer_email | TEXT | |
| buyer_phone | TEXT | |
| buyer_name | TEXT | |
| amount | NUMERIC | |
| razorpay_payment_id | TEXT | |
| download_token | TEXT UNIQUE | Time-limited download link |
| download_expires_at | TIMESTAMPTZ | |
| purchased_at | TIMESTAMPTZ | |

---

### reviews
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| booking_id | UUID FK UNIQUE | → `bookings(id)` |
| host_id | UUID FK | → `profiles(id)` |
| guest_name | TEXT | |
| rating | INTEGER | 1-5 |
| comment | TEXT | |
| created_at | TIMESTAMPTZ | |

---

### app_settings
Key-value store for admin-configurable platform settings.
| Column | Type | Notes |
|---|---|---|
| key | TEXT PK | e.g. `'plan_price_creator'`, `'plan_limits'` |
| value | TEXT | JSON-encoded string |

**Seeded values:**
- `plan_price_creator` = `'99900'` (paise)
- `plan_price_professional` = `'365000'` (paise)
- `plan_limits` = JSON of plan limits

---

## Database Functions
| Function | Purpose |
|---|---|
| `handle_new_user()` | Trigger: auto-create profile on auth.users insert |
| `increment_product_purchase_count(uuid)` | Atomic increment of `products.purchase_count` |

---

## Migration History
| Version | Key Change |
|---|---|
| schema.sql | Base tables: profiles, services, availability, bookings |
| v1.1 | otp_codes table |
| v1.2 | profiles.plan + plan_purchases table |
| v1.3 | services.grace_period_minutes, slug, thumbnail_url, otp_codes.type |
| v1.4 | payout_requests table |
| v1.5 | increment_product_purchase_count function |
| v1.6 | Catch-up: all profile columns (google tokens, razorpay, cover_image etc) |
| v1.7 | ⚠️ PENDING: bookings.commission_applied column |

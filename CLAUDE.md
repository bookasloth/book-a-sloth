# Book A Sloth — Claude Project Memory

## Quick Start (every session)
Read these 4 files before touching any code:
1. `docs/ai-context.md` — project snapshot + active rules
2. `docs/current-state.md` — what's working / broken right now
3. `docs/current-work.md` — active sprint + recent changes
4. `docs/feature-map.md` — find any file in seconds

## Project in One Sentence
**Book A Sloth** is a SaaS appointment-booking platform where creators (hosts) publish services, guests book them via OTP or account login, and payments flow through Razorpay.

## Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, Tailwind CSS, react-router-dom v6 |
| Backend | Node.js + Express 4 |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Payments | Razorpay (orders + subscriptions) |
| Email | Nodemailer (SMTP) |
| WhatsApp | AiSensy (active, DB-configured via `notification_providers`) |
| Uploads | Cloudinary |
| Calendar | Google Calendar API |

## Repo Layout
```
appointment-booking/
  client/          # React SPA (Vite)
    src/
      pages/       # Route-level components
      components/  # Shared UI components
      context/     # AuthContext
      services/    # api.js + supabaseClient.js
      utils/       # themeUtils.js
      styles/      # CSS tokens + component classes
  server/          # Express API
    controllers/   # Business logic
    routes/        # Express routers
    middleware/    # auth, plan, security, error
    config/        # supabase.js, google.js, migrations, schema
    lib/           # pricingEngine.js
    utils/         # otpStore.js, sendEmail.js, notify.js
    migrations/    # v1.1 → v1.7 SQL files
  docs/            # This documentation
```

## Critical Commands
```bash
# Server
cd server && npm run dev          # nodemon on port 5000
cd server && npm test             # Jest unit + integration

# Client
cd client && npm run dev          # Vite on port 5173
cd client && npm run build        # Production build
cd client && npm test             # Vitest
```

## Env Files
- `server/.env` — DB, Supabase, SMTP, AiSensy, Razorpay keys
- `client/.env` — VITE_API_URL, VITE_RAZORPAY_KEY_ID, VITE_SUPABASE_*

## Database Migrations — Status (verified 2026-07-01 against both DBs)
All migrations through **v3.57 are APPLIED** on both prod (Mumbai `ayjhlwyzszykqtnaktpb`)
and staging (Tokyo `xwvciqkayammbvsidqig`), verified by live schema introspection.
Items previously listed here as pending are now live:
- **v1.7** (`bookings.commission_applied`) — applied.
- **v3.53** (profession-scoped `service_categories` redesign + `seedServiceCategories.js`) — applied.
- **v3.57** (two partial `bookings` indexes for host paid-booking reads) — applied 2026-07-01.

**OUTSTANDING: v3.81** (`v3.81_host_documents_permissions.sql`) — grants `documents.view` /
`documents.manage` to the `operations` role in `admin_roles`. Until it is run on BOTH DBs,
ops admins cannot see or upload host documents in Host 360 (login reads permissions from
`admin_roles` first — `lib/adminPermissions.js` is only the fallback). Support losing access
is the intended effect and needs no migration. Takes effect on each admin's NEXT login.

Workflow for any NEW migration: run it in the Supabase SQL Editor on BOTH DBs, and keep the
code-side schema fallback (SELECT/INSERT destructure) until it is confirmed applied everywhere.

## Documentation Map
| File | Purpose |
|---|---|
| `docs/ai-context.md` | Project rules, conventions, active context |
| `docs/project-index.md` | Every folder explained |
| `docs/feature-map.md` | Feature → file ownership |
| `docs/architecture.md` | How systems connect |
| `docs/database-schema.md` | All tables, columns, RLS, migrations |
| `docs/coding-rules.md` | Patterns, naming, anti-patterns |
| `docs/design-system.md` | Colors, typography, components |
| `docs/current-state.md` | What works, what's broken |
| `docs/current-work.md` | Recent changes + next tasks |
| `docs/common-workflows.md` | How to implement recurring tasks |
| `docs/critical-files.md` | High-risk files + consequences |


# Before Writing Any Code

Never assume how a feature works.
Search first.

Always preserve existing behaviour unless explicitly asked.

If changing authentication, payments, bookings, pricing,
subscriptions, or middleware:
    Read docs/feature-map.md first.

Do not rename APIs, routes, or database columns unless instructed.

Prefer modifying existing components over creating new ones.

Never remove comments that explain business logic.

When unsure, ask.


## Product Rules

Guests
- Login using OTP.
- Phone number is identity.
- Auto-created if new.

Hosts
- Login only using Google
- Never show  email login.
- Never show OTP login.

Bookings
- Always snapshot pricing.
- Never trust client-side pricing.

Payments
- Razorpay is source of truth.
- Verify signatures server-side.

Plans
Starter
Host+
Studio

Limits always come from: subscription_plans.limits


## UI Rules

Always use existing design tokens.

Do not invent colors.

4px borders.

Rounded-xl only where already used.

Plus Jakarta Sans headings.

Poppins body.

Reuse existing components before creating new ones.



## Quick Search

Authentication
server/routes/authRoutes.js
server/controllers/authController.js
client/context/AuthContext.jsx

Bookings
server/controllers/bookingController.js
client/src/pages/ServiceBooking.jsx

Payments
server/controllers/paymentController.js

Hosts
client/pages/dashboard/*
server/controllers/vendorController.js

Pricing
server/lib/pricingEngine.js

Plans
subscription_plans table
server/middleware/planMiddleware.js


## Current Priority

1. Stability
2. Performance
3. DX
4. UI polish

Never refactor unrelated code.

## Never Do

❌ Change database schema without migration.

❌ Hardcode plan limits.

❌ Duplicate API endpoints.

❌ Create another auth flow.

❌ Store secrets in code.

❌ Break backward compatibility.


## Before Finishing

Run:

Server
npm test

Client
npm run build

Only mention failures caused by existing code.
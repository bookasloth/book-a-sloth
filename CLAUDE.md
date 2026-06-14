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
| WhatsApp | Twilio (currently disabled — stubs only) |
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
- `server/.env` — DB, Supabase, SMTP, Twilio, Razorpay keys
- `client/.env` — VITE_API_URL, VITE_RAZORPAY_KEY_ID, VITE_SUPABASE_*

## Pending DB Migration
Run `server/migrations/v1.7_pricing_snapshot.sql` in Supabase SQL Editor.
Adds `commission_applied` column to `bookings`. Code has fallback until applied.

## Explore (DEFERRED feature — data capture is LIVE now)
The Explore page (public vendor discovery + paid placement) is **not** built for
launch. Only the irreplaceable part — behavioural event history — is captured now;
the feature is built ~3–4 months later on top of that data.
- **Spec / how to build it / where-is-what:** `docs/superpowers/specs/2026-06-14-explore-foundation-design.md`
- **Live now:** `discovery_events` table (`v3.0_discovery_events.sql`, applied) +
  `server/services/discoveryEvents.js`, hooked into `hostController` search + profile +
  service views. Client sends anon `x-sloth-sid`.
- **Hidden:** Explore removed from `Navbar`; `/explore` redirects home. The page
  (`Explore.jsx`), admin (`AdminExplore.jsx`), `exploreController.js`, and
  `v2.9_explore.sql` (**unapplied**) remain as the foundation — do NOT apply v2.9 yet.
- **To resume:** query `discovery_events` (top + zero-result searches, most-viewed
  vendors) first, then follow the build order in the spec.

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

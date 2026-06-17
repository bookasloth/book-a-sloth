# Book A Sloth — Deployment Runbook

Plain-English guide to taking Book A Sloth from your laptop to a live, secure,
auto-deploying production site. Written for someone new to DevOps. Follow the
phases in order. Each phase says **what you do** (only you can click these) and
**how to verify** it worked.

> **Architecture (what runs where)**
> ```
>                     yourdomain.com
>                           │
>               ┌───────────┴────────────┐
>          (apex + www)             api.yourdomain.com
>               │                          │
>         ┌─────▼─────┐            ┌───────▼────────┐
>         │  Vercel    │ ──API──▶  │  Render (Node) │
>         │ React/Vite │           │ Express + crons │
>         └────────────┘           └───────┬─────────┘
>                                          │
>           Supabase · SMTP · Cloudinary · Razorpay (managed already)
>                                          ▲
>                                  UptimeRobot (monitor)
>
>   git push main → CI (tests) → Render & Vercel auto-deploy
>   Sentry = error tracking   |   daily Supabase backup
> ```
> - **Frontend** → Vercel (free)
> - **Backend** → Render Starter ($7/mo, always-on so reminder/email crons run)
> - **DB/Auth** → Supabase (already hosted)
> - **Monitoring** → UptimeRobot (free) + Sentry (free)
> - **Domain** → Hostinger (DNS only; sites live on Vercel/Render)

---

## Phase 0 — Repo scaffolding ✅ (already done)

These files were added for you:
- `server/server.js` — new `GET /health` endpoint (used by Render + UptimeRobot)
- `render.yaml` — Render blueprint (build/start/health/region/plan)
- `client/vercel.json` — SPA routing + security headers
- `.github/workflows/ci.yml` — runs build + tests on every push/PR
- `server/.env.example`, `client/.env.example` — full env var templates
- `DEPLOYMENT.md` — this file

**Commit them:**
```bash
git checkout -b chore/deploy-scaffolding
git add server/server.js render.yaml client/vercel.json .github/workflows/ci.yml server/.env.example client/.env.example DEPLOYMENT.md
git commit -m "chore(devops): add deploy scaffolding (health, render, vercel, CI, env templates)"
git push -u origin chore/deploy-scaffolding
# open a PR to main on GitHub, confirm CI is green, then merge
```

---

## Phase 1 — Create accounts (~15 min, free)

Sign up for each **using "Continue with GitHub"** (simplest):

| Service | URL | Why | Cost |
|---|---|---|---|
| Render | https://render.com | Hosts the backend API | $7/mo |
| Vercel | https://vercel.com | Hosts the frontend | Free |
| UptimeRobot | https://uptimerobot.com | Alerts you if site goes down | Free |
| Sentry | https://sentry.io | Tells you when code errors in production | Free |

You already have: GitHub, Supabase, Razorpay, Hostinger, Cloudinary, SMTP.

**Verify:** you can log into all four dashboards.

---

## Phase 2 — Deploy the backend (Render)

### Generate the new production secrets first
Run these locally and **save the output somewhere safe** (a password manager):
```bash
# SUPER_ADMIN_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# OAUTH_STATE_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
# GOOGLE_TOKEN_KEY (must be exactly 32 bytes → 64 hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
> If a secret already exists in your current `server/.env` and is in use, **reuse
> it** — don't regenerate, or you'll invalidate existing admin sessions /
> encrypted Google tokens.

### Deploy
1. Render dashboard → **New → Blueprint**.
2. Connect your GitHub repo. Render reads `render.yaml` and proposes the
   `bookasloth-api` service. Click **Apply**.
3. It will fail/wait on env vars — that's expected. Go to the service →
   **Environment** tab → add the real values for every `sync:false` key. Copy
   them from your working `server/.env`. For now set:
   - `CLIENT_URL` = `http://localhost:5173` (temporary; fixed in Phase 4)
   - `API_URL` = your Render URL (e.g. `https://bookasloth-api.onrender.com`)
   - `GOOGLE_REDIRECT_URI` = `https://bookasloth-api.onrender.com/api/auth/google/callback`
   - `POSTHOG_PROJECT_TOKEN` = your PostHog project token (`phc_...`)
   - `POSTHOG_HOST` = `https://us.i.posthog.com`
     (server-side analytics — without these, backend booking/payment events
     are silently dropped; the app still runs fine)
4. **Manual Deploy → Deploy latest commit.**

**Verify:**
```bash
curl https://bookasloth-api.onrender.com/health
# expect: {"status":"ok","uptime":...,"ts":...}
```
Render dashboard → service should show **Live** (green) and health check passing.

---

## Phase 3 — Deploy the frontend (Vercel)

1. Vercel → **Add New → Project** → import your GitHub repo.
2. **Root Directory** → set to `client` (important — repo has client + server).
3. Framework preset auto-detects **Vite**. Leave build (`vite build`) / output
   (`dist`) as-is.
4. **Environment Variables** → add:
   - `VITE_API_URL` = `https://bookasloth-api.onrender.com` (your Render URL for now)
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
   - `VITE_RAZORPAY_KEY_ID` = your Razorpay key id
   - `VITE_POSTHOG_PROJECT_TOKEN` = your PostHog project token (`phc_...`)
   - `VITE_POSTHOG_HOST` = `https://us.i.posthog.com`
     (frontend analytics — without these, no pageviews/events are captured in prod)
5. **Deploy.**

**Verify:** open the `*.vercel.app` URL Vercel gives you. Site loads. Open
browser DevTools → Network: API calls go to the Render URL and return 200.

---

## Phase 4 — Point your domain (Hostinger DNS)

> Replace `yourdomain.com` with your real domain. DNS changes take 5 min–24 hr
> to propagate (usually fast).

### A. Tell the platforms about your domain (do this first)
- **Vercel** → Project → Settings → **Domains** → add `yourdomain.com` AND
  `www.yourdomain.com`. Vercel shows the records you need.
- **Render** → Service → Settings → **Custom Domains** → add
  `api.yourdomain.com`. Render shows a CNAME target (e.g. `bookasloth-api.onrender.com`).

### B. Add the records in Hostinger
Hostinger **hPanel → Domains → (your domain) → DNS / Nameservers → Manage DNS records.**
Add:

| Type | Name / Host | Value / Points to | TTL |
|---|---|---|---|
| A | `@` | `76.76.21.21` (Vercel apex IP) | 3600 |
| CNAME | `www` | `cname.vercel-dns.com` | 3600 |
| CNAME | `api` | `bookasloth-api.onrender.com` (your Render target) | 3600 |

> If Hostinger already has default `A @` or `CNAME www` records, **edit/replace**
> them rather than adding duplicates. Always confirm the exact values shown in
> the Vercel/Render dashboards — they are authoritative if they differ from above.

### C. Update the env vars to the real domains
- **Render → Environment:**
  - `CLIENT_URL` = `https://yourdomain.com`
  - `API_URL` = `https://api.yourdomain.com`
  - `GOOGLE_REDIRECT_URI` = `https://api.yourdomain.com/api/auth/google/callback`
  - → then **Manual Deploy** to apply.
- **Vercel → Environment:**
  - `VITE_API_URL` = `https://api.yourdomain.com`
  - → **Redeploy** (Deployments → ⋯ → Redeploy).

### D. Update third-party allow-lists
- **Google Cloud Console** → OAuth client → Authorized redirect URIs → add
  `https://api.yourdomain.com/api/auth/google/callback`.
- **Razorpay dashboard** → Webhooks → set URL to
  `https://api.yourdomain.com/api/payment/webhook` (use your `RAZORPAY_WEBHOOK_SECRET`).
- **Supabase** → Auth → URL Configuration → Site URL = `https://yourdomain.com`.
- **PostHog** → Project Settings → **Authorized Domains** → add `https://yourdomain.com`
  and `https://www.yourdomain.com` (concrete URLs only, no wildcards). Drives Web
  Analytics breakdowns + toolbar; not a security gate (events still ingest regardless).

**Verify:**
```bash
curl https://api.yourdomain.com/health      # {"status":"ok",...}
```
Open `https://yourdomain.com` → padlock (HTTPS) present → do a full test booking
end-to-end (login, book, pay with a Razorpay test card).

---

## Phase 5 — Monitoring & alerts

### UptimeRobot (is the site up?)
- Add monitor → **HTTPS** → `https://api.yourdomain.com/health` → interval 5 min.
- Add monitor → **HTTPS** → `https://yourdomain.com` → interval 5 min.
- Alert contact → your email (and/or phone).

### Sentry (did the code error?)
- Create two projects: **Node** (backend) and **React** (frontend).
- Sentry gives an install snippet + a `DSN` for each. Wiring Sentry into the code
  is a small code change — **ask Claude to do this as a separate task** ("add
  Sentry to client and server"). It's not in the scaffolding yet.

**Verify:** UptimeRobot shows both monitors green. Trigger a test error and see it
land in Sentry.

---

## Phase 6 — Backups & security sweep

### Database backups
- **Supabase Free** keeps limited automatic backups but **no point-in-time
  restore**. For a booking app holding customer + payment data, add your own
  daily dump. Two options:
  - **Cheapest:** upgrade Supabase to Pro ($25/mo) → daily backups + PITR. Best
    safety, costs money.
  - **$0:** a GitHub Actions scheduled `pg_dump` to an artifact / cheap bucket.
    Ask Claude to add this workflow when you're ready.
- **Always test a restore** at least once — an untested backup is not a backup.

### Security sweep (ask Claude to run)
- Confirm no secrets in git history.
- `npm audit` on client + server, patch high/critical.
- Verify CORS locked to your domain, rate limits active, Razorpay webhook
  signature verified, helmet on (already in code — confirm in prod).

---

## Routine operations

### Deploy a change
```bash
git checkout -b feature/whatever
# ...make changes...
git commit -am "feat: whatever"
git push -u origin feature/whatever
# open PR → CI runs → merge to main → Render + Vercel auto-deploy
```

### Node / npm version (avoid lockfile drift)
The client is **pinned to Node 22.x** (`client/package.json` `engines.node` +
`client/.nvmrc`). Node 22 bundles **npm 10** — the same npm Vercel uses — so the
committed `client/package-lock.json` resolves identically locally and on deploy.

- **Locally:** run `nvm use` (reads `.nvmrc` → Node 22) before `npm install` in
  `client/`. If you're on a newer Node (e.g. 24 → npm 11) and must install,
  use `npx npm@10 install` so you don't rewrite the lockfile with npm 11's
  resolution.
- **Never commit a lockfile regenerated by npm 11.** A `client/package-lock.json`
  produced by a different npm major can make Vercel's `npm ci` fail on deploy.
- Quick drift check (writes nothing to `node_modules`):
  `cd client && npx npm@10 install --package-lock-only` then
  `git diff client/package-lock.json` — a non-empty diff means drift.

### Rollback (something broke in prod)
- **Frontend:** Vercel → Deployments → pick the last good one → **Promote to
  Production**. Instant.
- **Backend:** Render → service → **Events/Deploys** → pick last good deploy →
  **Rollback** (or `git revert` the bad commit and push).
- **Database migration gone wrong:** restore from the latest backup (Phase 6).
  Never run destructive SQL in prod without a fresh backup first.

### Where to look when something's wrong
1. UptimeRobot email — is it down or just slow?
2. Render → **Logs** (live backend logs, including the `[perf:SLOW]` lines).
3. Sentry — the actual stack trace.
4. Vercel → Deployment → **Logs** for frontend build/runtime issues.

---

## Cost summary

| Item | Monthly |
|---|---|
| Render Starter (backend) | $7 |
| Vercel (frontend) | $0 |
| UptimeRobot | $0 |
| Sentry | $0 |
| Supabase (free tier) | $0 (Pro $25 if you want managed backups) |
| **Total** | **~$7/mo** |

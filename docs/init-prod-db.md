# One-time: initialize the clean production database (Option B launch)

You decided (June 2026): launch on the **fresh Mumbai** Supabase project, leaving
the current dev data behind as staging. This is the one-time setup to make that
real. After this, the everyday flow is [release-pipeline.md](release-pipeline.md).

> **The roles (memorise this — the Supabase project *names* are currently misleading):**
>
> | Role going forward | Project ref | Region | Today |
> |---|---|---|---|
> | **PRODUCTION** (real, live) | `ayjhlwyzszykqtnaktpb` | Mumbai (ap-south-1) | empty shell — gets schema + config here |
> | **STAGING** (rehearsal) | `xwvciqkayammbvsidqig` | Tokyo (ap-northeast-1) | your current dev DB (all test data) |
>
> **Rename them in Supabase** (Settings → General → project name) so the labels
> match the roles. Renaming changes nothing technical — refs/keys stay the same.

---

## Step 1 — Remap your local `.env` files to the new roles

Today `.env.production` points at `xwvciqkayammbvsidqig` — that project is now
**staging**, so the mapping must flip:

| File | Should point at | How |
|---|---|---|
| `server/.env.staging`, `client/.env.staging` | `xwvciqkayammbvsidqig` | Copy your current `*.env.production` values into them (same project). Then swap Razorpay to **TEST** keys so staging never charges real cards. |
| `server/.env.production`, `client/.env.production` | `ayjhlwyzszykqtnaktpb` | Replace only the Supabase values (URL + anon + service-role) with the **Mumbai** project's, from Supabase → Production project → Settings → API. Keep every other secret. |

Then `node scripts/use-env.js staging` puts your laptop on staging (the safe
default). The `REPLACE_ME` guard stops the switch until the files are filled.

---

## Step 2 — Get the two Postgres connection strings

Supabase → **each** project → **Settings → Database → Connection string**. Copy
the URI (it includes the db password). If your network has no IPv6, use the
**Session pooler** (IPv4) string. URL-encode special chars in the password
(`@`→`%40`, `#`→`%23`).

```bash
export STAGING_DB_URL='postgresql://postgres:[PW]@db.xwvciqkayammbvsidqig.supabase.co:5432/postgres'
export PROD_DB_URL='postgresql://postgres:[PW]@db.ayjhlwyzszykqtnaktpb.supabase.co:5432/postgres'
```
These live only in your shell — never commit them.

---

## Step 3 — Run the clone (`scripts/init-prod-db.sh`)

Needs **PostgreSQL 17 client tools** (`pg_dump` + `psql`) — install the
"PostgreSQL 17" command-line tools on Windows; check with `pg_dump --version`.

```bash
bash scripts/init-prod-db.sh --dry-run     # writes .db-clone/01-schema.sql + 02-seed.sql, applies nothing
#   ...open those two files, sanity-check them...
bash scripts/init-prod-db.sh               # rebuilds prod schema + seeds config (type CLONE to confirm)
```

What it does, and its guard rails:
- **Copies:** full schema (tables, types, functions/RPCs, triggers, RLS policies,
  indexes, grants) **+ config rows only** — categories, subscription_plans,
  feature_flags, chart_of_accounts, email/notification templates, badges,
  admin_roles, and the settings tables (platform/email/notification/appearance).
- **Never copies:** profiles, bookings, payments, ledger, logs, OTPs, reviews,
  contacts, campaigns — prod launches with **zero** test data.
- **Refuses** unless `STAGING_DB_URL`/`PROD_DB_URL` point at the exact projects
  above, and makes you type `CLONE`. It rebuilds the *target* (prod) schema, which
  is safe because prod is empty today.

### Admins
By default `admin_users` is **not** copied (so prod admin credentials are
independent). Two ways to get into `/admin` on prod:
- **Easiest** — re-run with `--with-admins` to copy your existing admin login +
  2FA. Works only if prod's env has the **same** `SUPER_ADMIN_JWT_SECRET` /
  `GOOGLE_TOKEN_KEY` as staging (else the 2FA secret won't decrypt).
- **Cleanest** — leave it off and bootstrap a fresh prod admin after launch.

---

## Step 4 — Security follow-up (do not skip)

The clone faithfully reproduces staging, where **RLS is OFF** on `feature_flags`
and `reschedule_payments`. So prod inherits that hole. Enabling RLS is **not** a
one-liner — toggling it on without policies blocks all access. Treat as its own
task: design read/write policies, then enable. (Already flagged separately.)

---

## Step 5 — Point production at the Mumbai DB

When you deploy (DEPLOYMENT.md Phases 2–4), the **prod** Render + Vercel envs use
the **Mumbai** (`ayjhlwyzszykqtnaktpb`) Supabase URL + keys; the **staging**
Render + Vercel envs use `xwvciqkayammbvsidqig`. After deploy, verify a test
booking on `bookasloth.com` lands in the Mumbai project, and prod still shows
**0** profiles/bookings until the first real customer.

---

## Later: refreshing staging from prod

This script runs **staging → prod** once, for launch. The *ongoing* direction is
the reverse — periodically refresh staging's schema **from** prod so staging
keeps mirroring live. Same idea, swapped URLs; ask Claude to add a
`refresh-staging.sh` when you need it.

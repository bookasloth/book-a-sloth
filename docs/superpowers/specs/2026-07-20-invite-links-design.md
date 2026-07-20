# Invite Links — Lead-Source Attribution (`/invite/:slug`)

**Date:** 2026-07-20
**Status:** Design approved, spec for review
**Type:** New feature (net-new; no existing generic trackable-link system)

## Goal

Give the sales/marketing team shareable pretty links like
`bookasloth.com/invite/social` that:

1. **Attribute new host signups** to a named source (social platform, sales rep,
   campaign, QR code, etc.) — stored in our own DB, visible in admin.
2. Make vendors "feel invited" via a light VIP landing (marketing gimmick).

**Explicitly NOT in scope:** payouts / rewards. Attribution-only, kept fully
separate from the Refer & Earn `referrals` table and its payout machinery.

## Hard rules (loud)

- **Invite attribution NEVER creates a payout `referrals` row.** `profiles.invite_slug`
  is a separate axis from Refer & Earn. A host may have BOTH a `?ref` referrer
  (payout) AND an `invite_slug` (attribution); they never touch each other.
- **New host signups only.** Attribution is stamped once, at host-account
  creation. Existing/returning hosts are never stamped, even if they click an
  invite link.
- **Slugs are never deleted** — only `active` toggled off. Inactive OR unknown
  slug → silent redirect to `/`, never a 404.

## Non-goals (deferred, YAGNI)

- Per-slug custom landing content. ONE shared landing for all slugs first;
  invest per-slug only if it proves out.
- Per-slug perks / plan incentives.
- Guest attribution. Only **host** signups (vendors = the target).
- Paid-plan funnel column. Bolt on later via the existing `onReferredCharge` hook.

## Data model

### New table: `invite_links`
| column        | type        | notes |
|---------------|-------------|-------|
| `slug`          | text PK     | URL segment, e.g. `social`. Lowercased, validated, reserved-namespace-checked, unique. **Immutable after creation** — never editable. |
| `label`         | text        | Human name, shown in landing greeting + admin, e.g. "Social Squad". Editable. |
| `assigned_to`   | text NULL   | Free-text owner/source: sales rep, campaign, platform, "QR code". Editable. Group-by dimension in admin. |
| `active`        | boolean default true | Off → landing redirects to `/`. Editable. |
| `unique_visits` | bigint default 0 | Estimated unique landing hits (de-botted + IP/day deduped). Named `unique_visits` in DB and admin so the estimate is honest. |
| `metadata`      | jsonb default '{}' | Free-form campaign details (budget, notes, dates…) without a future migration. |
| `created_by`    | uuid NULL   | Admin/sales-manager who created it (FK → admin id). Audit + "my links" filter. |
| `created_at`    | timestamptz default now() | |

Only `label`, `assigned_to`, `active`, `metadata` are editable. `slug` is immutable.
RLS: on / service-role only (like other admin-config tables). No anon policy.

### New column: `profiles.invite_slug` (text NULL)
First-touch attribution, stamped once at **account creation** (the moment the
`profiles` row is inserted on first Google sign-in via the invite CTA) — NOT at
onboarding completion.

- **Atomic write-once at the DB level:** stamp via a single conditional update
  `UPDATE profiles SET invite_slug = $1 WHERE id = $2 AND invite_slug IS NULL`
  (or set inline in the creation INSERT). No read-then-write; no race, no overwrite.
- **Server-side validation before stamping:** the browser only carries the slug;
  the server confirms the slug EXISTS in `invite_links` before writing. (Existence
  only — see "Deactivation" below; a since-deactivated slug still attributes.)
- Signup count per slug = `COUNT(profiles WHERE invite_slug = <slug>)`.
- Partial index on `profiles(invite_slug) WHERE invite_slug IS NOT NULL`.

### Deactivation vs attribution
If a host clicked a then-valid invite and signs up AFTER the slug is deactivated,
they are **still attributed**. `active=false` gates the LANDING (redirect to `/`),
not attribution. Stamping validates slug *existence*, not `active`.

### Slug reservation
`invite` becomes a new top-level route → MUST be added to `reservedSegments.js`
(client) and `reservedNamespaces.js` (server), or the route-manifest drift test
fails the whole deploy. (Known landmine.)

## Components & flow

### 1. Public landing `GET /invite/:slug`
- ONE shared landing = trimmed homepage. Reuse existing homepage section
  components; do NOT fork the whole homepage. Sections, in order:
  1. **Hero** (with dynamic greeting — see below)
  2. **Numbers** — top 3 stat integrations from the current homepage
  3. **Why Book A Sloth**
  4. **Pricing**
  5. **Testimonials**
  6. **Minimal footer** — bottom strip only (no full footer columns)
- On mount:
  - Fetch `GET /api/invite/:slug` → `{ label, active }`. Missing / `active:false`
    → redirect to `/`.
  - First-touch rule (single source of truth = `bas_invite`): **if `bas_invite`
    already exists, change neither attribution value.** Otherwise set
    `localStorage['bas_invite'] = slug` AND set the invite-specific UTM source to
    `invite/<slug>` in the UTM stash (`useUtm.js` / `sessionStorage['bas_utm']`).
    Existing non-invite UTM data is preserved per the existing UTM attribution
    rules. (`bas_invite` mirrors `bas_ref` and survives OAuth; it — not
    sessionStorage — is the durable gate, so the two stores can't diverge on source.)
  - Fire-and-forget `POST /api/invite/:slug/visit`.
- Dynamic greeting: inject `label` into the hero headline, e.g.
  *"Welcome, {label} 🦥"*. One line; no per-slug design.
- CTA → existing host onboarding (Google-only). No new auth flow.

### 2. Bot / inflated-visit handling
Social + QR links attract preview/unfurl bots (WhatsApp, FB, Slack) and
scrapers. `POST /api/invite/:slug/visit`:
- Skip increment if request UA matches a known-bot list (bot UAs self-identify).
- De-dupe genuine hits by `(slug, client-IP, day)` — best-effort via a
  short-TTL in-memory cache. Result increments `unique_visits`.
- `// ponytail: UA-skip + IP/day dedupe is a heuristic, not exact. Upgrade to a
  visit-log table only if sales needs precise unique-visitor counts.`

### 3. Attribution capture (NEW profile creation branch ONLY)
- Attribution lives **inside the new-profile-creation branch** of the sign-in
  path. Existing profiles never enter the invite-attribution write path AT ALL —
  regardless of whether their `invite_slug` is null. (A null-guarded update alone
  is NOT sufficient: an old account can have `invite_slug IS NULL` and would be
  wrongly stamped. The branch, not the guard, is the gate.)
- In that new-profile branch: client passes `bas_invite`; server validates the
  slug exists in `invite_links`; set `invite_slug` inline in the creation INSERT.
  The `invite_slug IS NULL` condition is kept only as a belt-and-suspenders
  write-once safety, not as the returning-account gate.
- Clear the stash after. Independent of referral capture.

### 4. Admin UI (alongside `AdminReferrals`)
- Create: `slug` + `label` + `assigned_to` (+ optional `metadata`). Slug validated
  against reserved namespaces + uniqueness.
- Edit: `label`, `assigned_to`, `active`, `metadata` only. **`slug` is immutable**
  (not shown as editable). No delete — deactivate via `active` toggle.
- Stats table: `slug · label · assigned_to · unique_visits · signups · conversion %`
  (conv % = signups / unique_visits). Optional group-by `assigned_to`.

### 5. API surface
| method | route | auth | purpose |
|--------|-------|------|---------|
| GET  | `/api/invite/:slug`             | public | landing config `{label, active}` |
| POST | `/api/invite/:slug/visit`       | public | de-botted `unique_visits++` (rate-limited, fire-and-forget) |
| GET  | `/api/admin/invite-links`       | admin  | list + stats |
| POST | `/api/admin/invite-links`       | admin  | create (slug immutable hereafter) |
| PATCH| `/api/admin/invite-links/:slug` | admin  | edit `label`/`assigned_to`/`active`/`metadata` only |

(No capture endpoint — attribution is stamped inline in the existing host-creation
path, since it's new-signups-only.)

## Migration
- `v3.90_invite_links.sql` — create `invite_links` (incl. `unique_visits`,
  `metadata jsonb`) + add `profiles.invite_slug` + partial index.
- Apply to **BOTH** DBs (prod Mumbai + staging Tokyo).
- Code keeps schema-fallback (SELECT/INSERT degrade on "table/column not found")
  until confirmed applied everywhere. House rule.

## Error handling
- Unknown/inactive slug → redirect `/`, never 404.
- Visit counter best-effort: failure never blocks landing render.
- Capture write-once + idempotent; duplicates no-op.
- Reserved-slug / duplicate blocked at admin create.

## Testing (minimal, per house style)
- Backend: attribution happens ONLY in the new-profile branch (an EXISTING
  account with `invite_slug IS NULL` that carries a slug is NOT stamped);
  atomic write-once (concurrent new-profile creates → one wins, no overwrite);
  server rejects a slug not in `invite_links`; a since-deactivated (but existing)
  slug STILL attributes;
  bot UA skips `unique_visits` increment; inactive slug config returns `active:false`.
- Client: `/invite/:slug` stashes `bas_invite` first-touch, no overwrite; sets
  `utm_source=invite/<slug>`.
- Route-manifest drift test passes (`invite` in both reserved lists).

## Rollout
1. Migration on both DBs.
2. Ship in normal deploy (additive, inert until a slug is created — no kill-switch).
3. Sales creates first slug in admin, shares `bookasloth.com/invite/<slug>`.

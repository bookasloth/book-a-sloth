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
| `slug`        | text PK     | URL segment, e.g. `social`. Lowercased, validated, reserved-namespace-checked, unique. |
| `label`       | text        | Human name, shown in landing greeting + admin, e.g. "Social Squad". |
| `assigned_to` | text NULL   | Free-text owner/source: sales rep, campaign, platform, "QR code". Group-by dimension in admin. |
| `active`      | boolean default true | Off → landing redirects to `/`. |
| `visits`      | bigint default 0 | De-botted landing hits (see Bot handling). |
| `created_at`  | timestamptz default now() | |

RLS: on / service-role only (like other admin-config tables). No anon policy.

### New column: `profiles.invite_slug` (text NULL)
First-touch attribution, stamped once at **host-account creation**. Write-once
(only if null). Separate from `referrals`.

- Signup count per slug = `COUNT(profiles WHERE invite_slug = <slug>)`.
- Partial index on `profiles(invite_slug) WHERE invite_slug IS NOT NULL`.

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
  - Stash `localStorage['bas_invite'] = slug` **first-touch** (never overwrite,
    mirrors existing `bas_ref` in AuthContext) — survives Google OAuth round-trip.
  - Also set `utm_source = "invite/<slug>"` into the existing UTM stash
    (`useUtm.js` / `sessionStorage['bas_utm']`) so PostHog/GA get it free.
  - Fire-and-forget `POST /api/invite/:slug/visit`.
- Dynamic greeting: inject `label` into the hero headline, e.g.
  *"Welcome, {label} 🦥"*. One line; no per-slug design.
- CTA → existing host onboarding (Google-only). No new auth flow.

### 2. Bot / inflated-visit handling
Social + QR links attract preview/unfurl bots (WhatsApp, FB, Slack) and
scrapers. `POST /api/invite/:slug/visit`:
- Skip increment if request UA matches a known-bot list (bot UAs self-identify).
- De-dupe genuine hits by `(slug, client-IP, day)` — best-effort via a
  short-TTL in-memory cache.
- `// ponytail: UA-skip + IP/day dedupe is a heuristic, not exact. Upgrade to a
  visit-log table only if sales needs precise unique-visitor counts.`

### 3. Attribution capture (new host creation only)
- At the point a **new** host profile is created (onboarding completion), read
  `localStorage['bas_invite']`; if set AND `profiles.invite_slug` is null AND the
  slug exists → stamp `invite_slug`, then clear the stash.
- Returning/existing hosts: never stamped.
- Idempotent + write-once; independent of referral capture.

### 4. Admin UI (alongside `AdminReferrals`)
- CRUD (no delete): add/edit `slug` + `label` + `assigned_to`, `active` toggle.
- Stats table: `slug · label · assigned_to · visits · signups · conversion %`
  (conv % = signups / visits). Optional group-by `assigned_to`.
- Slug create validates reserved namespaces + uniqueness.

### 5. API surface
| method | route | auth | purpose |
|--------|-------|------|---------|
| GET  | `/api/invite/:slug`             | public | landing config `{label, active}` |
| POST | `/api/invite/:slug/visit`       | public | de-botted `visits++` (rate-limited, fire-and-forget) |
| GET  | `/api/admin/invite-links`       | admin  | list + stats |
| POST | `/api/admin/invite-links`       | admin  | create |
| PATCH| `/api/admin/invite-links/:slug` | admin  | edit / toggle active |

(No capture endpoint — attribution is stamped inline in the existing host-creation
path, since it's new-signups-only.)

## Migration
- `v3.90_invite_links.sql` — create `invite_links` + add `profiles.invite_slug` +
  partial index.
- Apply to **BOTH** DBs (prod Mumbai + staging Tokyo).
- Code keeps schema-fallback (SELECT/INSERT degrade on "table/column not found")
  until confirmed applied everywhere. House rule.

## Error handling
- Unknown/inactive slug → redirect `/`, never 404.
- Visit counter best-effort: failure never blocks landing render.
- Capture write-once + idempotent; duplicates no-op.
- Reserved-slug / duplicate blocked at admin create.

## Testing (minimal, per house style)
- Backend: attribution write-once (second stamp no-ops); existing host never
  stamped; bot UA skips visit increment; inactive slug config returns `active:false`.
- Client: `/invite/:slug` stashes `bas_invite` first-touch, no overwrite; sets
  `utm_source=invite/<slug>`.
- Route-manifest drift test passes (`invite` in both reserved lists).

## Rollout
1. Migration on both DBs.
2. Ship in normal deploy (additive, inert until a slug is created — no kill-switch).
3. Sales creates first slug in admin, shares `bookasloth.com/invite/<slug>`.

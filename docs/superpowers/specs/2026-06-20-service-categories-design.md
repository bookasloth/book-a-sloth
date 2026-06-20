# Service Categories + Category-Picker Polish — Design

**Date:** 2026-06-20
**Branch:** `feat/service-categories`
**Status:** Approved (brainstorming), pending implementation plan

## Problem

Hosts pick one or more **categories** during onboarding (step 4, [CategoryStep.jsx](../../../client/src/pages/onboarding/CategoryStep.jsx)), stored as a slug array in `profiles.categories`. But **services have no category at all** — the `services` table has no category column, and neither the onboarding first-service step nor the dashboard service form captures one. A host declares "I do Coaching & Consulting," then every service they create is category-less and disconnected from that declaration.

Two asks:
1. **Services must live inside the host's declared categories.** A service's category = one of the host's onboarding-picked categories. (This is the missing link.)
2. **Polish the category-picking grid** — light UX only, keep the existing multi-select searchable grid.

## Goals

- Every service carries a `category` (a category slug) drawn from the host's own `profiles.categories`.
- Capture the category wherever a service is created: onboarding first-service step **and** dashboard add/edit.
- Display the category on service cards and the public service page.
- Light polish to the onboarding category grid.

## Non-Goals (deferred)

- Explore page filtering by category (Explore foundation is deferred project-wide).
- Service templates / pre-filled suggested services per category.
- Editing host categories from the dashboard after onboarding.
- Multi-category-per-service (single category only for now; column choice does not block adding this later).

## Decisions (approved)

- **One category per service**, **required** when the host has ≥1 category.
- Auto-assign when the host has exactly one category (no decision forced on them).
- Store as a **slug string** (`services.category TEXT`), matching the slug convention used everywhere else (`profiles.categories`, `/api/categories`).

## Approach (chosen: A)

**A — `category` slug column on `services`.** Reuses the existing slug convention (profiles store slugs, the public categories API returns slugs), so no joins and no new key type. Tiny additive schema change. Forward-compatible with future Explore filtering.

Rejected:
- **B — `category_id` UUID FK to `categories.id`.** Referential integrity, but the whole app keys categories by *slug*; a UUID forces joins everywhere and breaks convention.
- **C — multi-category array per service.** Flexible but YAGNI; a service is one thing in practice. A nullable TEXT column can be widened to an array later if needed.

## Design

### 1. Data model

New migration `server/migrations/vX_service_category.sql` (next version number at implementation time):

```sql
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS services_category_idx ON services(category);
```

- **Nullable** so existing rows remain valid (no backfill — legacy services display an "Uncategorized" fallback until edited).
- Stores a category **slug** (e.g. `'coaching'`). Allowed values = the host's own `profiles.categories`.
- Index supports future category filtering.

### 2. Backend ([serviceController.js](../../../server/controllers/serviceController.js))

- `buildPayload`: whitelist `category` → `p.category` (trimmed string or null).
- `V2_SELECT_COLS`: add `category` so reads return it. The existing `schemaMissing()` graceful-degrade path already falls back when the column isn't present yet (pre-migration safety).
- **Validation** on create + update: if `category` is provided, assert it is a member of the host's `profiles.categories`. If not, return 400. If the host has zero categories (edge), skip the requirement.
- Surface `category` on public service reads (it's already covered once added to `V2_SELECT_COLS`).

### 3. Category selector — shared component

New `client/src/components/services/ServiceCategoryPicker.jsx` (small, presentational):

- Props: `categories` (host's list: `[{slug,label}]`), `value` (slug), `onChange`.
- **Host has exactly 1 category** → auto-select it; render a read-only chip ("Category: Coaching"). No interaction required.
- **Host has 2+ categories** → required single-select chips; nothing selected blocks submit.
- slug→label resolved from the host's category objects (fallback: prettified slug).

Used in two places:

- **[ServiceForm.jsx](../../../client/src/pages/services/ServiceForm.jsx)** (dashboard add/edit): fetch host categories via `/auth/me` (profile already carries `categories`); add `category` to form state; prefill from `initialData.category` on edit; include in submit payload.
- **[FirstServiceStep.jsx](../../../client/src/pages/onboarding/FirstServiceStep.jsx)** (onboarding step 9): read the host's categories from onboarding state (keyed by `slug`); include `category` in the `createService` call. (Integration point: confirm the onboarding-state fetch exposes `categories`, or extend it to.)

### 4. Display

- **Dashboard service cards** and **public service page header**: render a small category badge.
- slug→label via the categories list already available on those pages (fallback: prettified slug).
- Legacy null category → no badge (or "Uncategorized" muted label on the dashboard only).

### 5. Category-grid polish ([CategoryStep.jsx](../../../client/src/pages/onboarding/CategoryStep.jsx)) — light

Keep the searchable multi-select grid, the custom-suggest box, and the optimistic save. Only:

- Selected-chips summary row + count ("2 selected") above the grid, with quick remove.
- Clearer selected state and larger tap targets.
- Single column under ~380px (long labels wrap badly at 2-col on small phones).
- "Save & Continue" reflects the count.

## Edge cases

- **Host with 0 categories** (shouldn't happen — onboarding requires ≥1): selector hidden, category optional, service saves null.
- **Host edits a service whose category they no longer have** (categories not editable post-onboarding yet, so rare): keep the stored value, show it, but only offer the host's current categories in the picker.
- **Pre-migration runtime** (column not yet added in a given DB): `schemaMissing()` fallback keeps reads working; writes simply omit `category` until the column exists.

## Testing

- Backend: create/update service with a valid host category → persists; with a slug not in the host's categories → 400; with no category when host has none → allowed.
- Frontend: single-category host sees auto-assigned read-only chip; multi-category host must pick; edit prefills existing category.
- Migration applied to both DBs (staging Tokyo + prod Mumbai) before merge.

## Rollout

1. Apply migration to both Supabase DBs.
2. Ship backend (graceful pre-migration fallback means order is forgiving).
3. Ship frontend selector + display + grid polish.

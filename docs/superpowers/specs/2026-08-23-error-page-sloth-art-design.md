# Detective-Sloth 404 Refresh — Design Spec

**Date:** 2026-08-23
**Branch:** `feat/error-page-sloth-art`
**Status:** Approved, ready for implementation plan

## Problem

Book A Sloth renders a 404 in **three different places, each with a different look**:

| # | Surface | File | Current look | Who hits it |
|---|---|---|---|---|
| 1 | Client SPA (React) | `client/src/components/error/ErrorLayout.jsx` + `errorCatalog.js` | Sloth inline-SVG line-art, favicon logo, Tailwind, dark-aware | In-app 404s + catch-all `path="*"` — the main one |
| 2 | API host browser | `server/utils/brandPage.js` via `server/middleware/errorMiddleware.js` | Lightning-bolt logo, inline CSS, different fonts | Direct hits to the render.com API host — rare |
| 3 | Edge middleware | `client/middleware.js` (unknown-username branch) | Raw `font-family:sans-serif`, zero brand | Direct/shared dead profile URLs (humans + bots) |

They say different things, use different logos, and #3 is unstyled. The goal is a single, on-brand look driven by three supplied detective-sloth illustrations, propagated to all three surfaces.

## Decisions (locked with user)

- **Approach: C (hybrid).** Detective sloth on the `lost` mood (404 + 410) only. Every other error code keeps its existing line-art. A clean slot is left so more per-mood images can be dropped in later without a rebuild.
- **All three images used as rotating variants.**
- **Random each visit** — page picks one of three at load / per request.
- **Images live in `client/public/errors/`.** Relative `/errors/*.png` for the client; absolute `https://bookasloth.com/errors/*.png` for server + edge (same files, one source of truth).
- **Copy rewritten** for the detective theme (below).
- **Real 404 status + `noindex` preserved** on edge (#3) and server (#2) — crawlers must still see 404.

## Assets

Three files → `client/public/errors/`:

| Filename | Image |
|---|---|
| `sloth-tracks.png` | Walking, following footprints |
| `sloth-think.png` | Thinking, "?" above head |
| `sloth-glass.png` | Standing, magnifying glass up |

Backgrounds trimmed to transparent so they sit cleanly on the white/dark card. Keep them reasonably small (target < 60 KB each; downscale to ~264px display @2x = ~528px source if larger).

A single shared list of the three basenames is the source of truth for "which variants exist," referenced by all three surfaces (each surface hardcodes the same three names — see Duplication note).

## Surface 1 — Client (React)

**Files:** `client/src/config/errorCatalog.js`, `client/src/components/error/ErrorIllustration.jsx`, `client/src/components/error/ErrorLayout.jsx` (pass-through only if needed).

- `errorCatalog.js`: the 404 and 410 entries gain an `images` array field listing the three variant basenames (e.g. `images: ['sloth-tracks', 'sloth-think', 'sloth-glass']`). No other entry changes.
- `ErrorIllustration.jsx`: if the rendered entry supplies `images`, render an `<img>` picking a **random** variant on mount (via `useState(() => pick)` so it stays stable within a mount but varies across visits); otherwise fall back to the existing `ART[art]` SVG. `<img>` uses `/errors/<name>.png`, `alt=""` (decorative — the copy carries meaning), explicit width/height to avoid CLS, `loading="eager"`.
- `ErrorPage.jsx` passes the entry's `images` through to the layout/illustration. Minimal wiring — the catalog entry already flows to `ErrorLayout` via props; add `images` alongside `art`.
- Line-art path for every other code is untouched.

**Prerender safety:** error pages are `noindex` and NOT in `PRERENDER_ROUTES`, so random-on-mount never gets baked into prerendered HTML. No prerender change needed.

## Surface 2 — Server (`brandPage.js` + `errorMiddleware.js`)

**Files:** `server/utils/brandPage.js`, `server/middleware/errorMiddleware.js`.

- `brandPage.js`: `shell()`/`brandPage()` gain an optional `image` param. When present, render an `<img>` (absolute URL) as the hero above the heading. CSS for the hero image added to `BRAND_CSS` (namespaced within the existing `.card`).
- Swap the lightning-bolt logo mark for the sloth wordmark to match the client (reference `https://bookasloth.com/favicon.svg` + "Book A Sloth" text), so #2 and #1 read as the same brand. (If favicon reference proves flaky cross-origin, keep the existing bolt — logo unification is nice-to-have, not the core of this spec.)
- A small helper picks a random detective-sloth absolute URL. `errorMiddleware.js` passes it **only on `statusCode === 404`**; other codes call `brandPage` without an image (unchanged behavior).

## Surface 3 — Edge (`middleware.js`)

**File:** `client/middleware.js` (the `res.status === 404` unknown-username branch, currently lines ~120–130).

- Replace the raw inline HTML with a branded card that visually matches #2: same brand CSS tokens, sloth wordmark, random detective-sloth hero (absolute URL), the new copy, CTA → `/explore`.
- **Must stay `status: 404` with `<meta name="robots" content="noindex">`.** Keep the existing `Cache-Control: public, max-age=300`.
- Edge runs in the Vercel edge bundle and **cannot import `server/utils/brandPage.js`** (different runtime/bundle). The branded HTML is therefore inlined here — a small, deliberate duplication of the brand shell. Mark it with a comment pointing at `brandPage.js` as the visual reference so the two are kept in sync by hand.
- Random pick: edge has `Math`/`crypto` — use a simple random index over the three basenames.

**Duplication note (ponytail):** the brand shell now exists as HTML strings in two runtimes (server `brandPage.js`, edge `middleware.js`). Sharing them would require a cross-bundle build step not worth its cost for ~40 lines of static markup. Accepted; each copy carries a `// keep in sync with brandPage.js` comment.

## Copy

**404** (in-app + catch-all `path="*"`):
- Title: **"This page pulled a vanishing act"**
- Body: "We searched high and low — magnifying glass and all — but this page isn't here. It may have moved, or it never existed."
- CTA: **Go Home** → `/`

**410** (gone for good):
- Title: **"This one's gone for good"**
- Body: "We looked, but this page was permanently removed and isn't coming back."
- CTA: **Go Home** → `/`

**Edge — profile not found** (`/username` the resolver has never seen):
- Title: **"No host at this address"**
- Body: "We couldn't track anyone down at /{slug}. The link may be mistyped, or the profile has moved on." (`{slug}` sanitized as it already is today.)
- CTA: **Explore hosts** → `https://bookasloth.com/explore`

**Server generic 404** (API host browser, no specific resource): keep a general message — reuse the 404 title/body above.

## Out of scope (unchanged)

- All other error codes: 400/401/403/405/408/409/413/415/422/429/500/502/503/504/offline — same copy, same line-art.
- No changes to `error-pages.css` beyond what a raster hero needs (sizing only).
- No new dependencies. No routing changes. No prerender changes.
- Service Worker / offline caching — untouched.

## Testing / validation

- **Client:** extend `client/src/__tests__/errorPages.test.jsx` — assert the 404/410 entries render an `<img>` from `/errors/`, and a non-image code still renders the SVG. Run `npx vitest run`.
- **Client build:** `cd client && npm run build` must pass (Vercel gate).
- **Server:** extend `server/tests/unit/brandPage.test.js` — `brandPage({ image })` includes the `<img>` and absolute URL; without `image` it does not. Run `cd server && npm test`.
- **Edge:** the branch returns `status 404`, contains `noindex`, contains one of the three image URLs, and escapes `{slug}` (existing XSS guard preserved). Add an assertion to whichever suite covers middleware, or a small unit check.
- **Manual:** hit `/404`, `/410`, and a random dead in-app path in the dev preview; reload several times to see variants rotate.

## Risks / landmines

- `ErrorLayout` calls `useHideChrome()` (ChromeContext) — must not regress; don't move the illustration out of the no-chrome tree.
- Random-on-mount must be stable within a single mount (no flicker/re-pick on re-render) — use lazy `useState` initializer, not a bare `Math.random()` in render.
- Absolute image URLs on server/edge depend on `bookasloth.com` serving `client/public/errors/*` — verify the deployed path resolves before relying on it (the client build publishes `public/` at the domain root).
- Image background must be transparent or it shows a box on the card.

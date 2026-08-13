# The Opening — Build Spec

> Public launch event. Visitors cut a golden ribbon, curtains fly open, confetti
> storms, and they carve their name permanently onto the **Inaugurators Wall**.
> A 24-hour window mints a permanent, ordered founder list that lives on the site
> forever.
>
> Branch: `feat/opening-ceremony` · Status: spec · Owner: founder

## 1. Product intent

Not a confetti gimmick — a **monument**. The feeling to manufacture: *"I was
there the day Book A Sloth opened, and my name proves it."*

Three loads every design decision carries:
1. **Ownership** — a permanent opener **number** (#47 can never be minted again).
2. **A place to return** — the Wall lives on the site forever; you find your name years later.
3. **Emotion** — the physical cut, the curtain, the storm of confetti.

## 2. Scope — phased

**Phase 1 (this branch, ships first):**
- `/opening` — curtain + ribbon-cut interaction (finger on mobile, mouse on desktop) + confetti.
- Name capture (name + optional message).
- `/inaugurators` — permanent, ordered, public Wall.
- Backend: 1 table, 3 endpoints, 24-hour window enforcement.

**Phase 2 (deferred, designed here so phase 1 doesn't box us in):**
- Optional **WhatsApp verification** of an opener's number → `✓ verified` badge (event-scoped OTP, see §7).
- Auto-generated **share card** (OG image) + share flow.

Everything in phase 1 must leave clean seams for phase 2 (schema columns exist,
UI has a disabled/placeholder verify affordance). No rework.

## 3. Routes

| Route | Purpose | Public |
|---|---|---|
| `/opening` | The ceremony: curtain, ribbon, cut, confetti, name capture | yes |
| `/inaugurators` | Permanent Wall of all openers, ordered by number | yes |

**Both are new top-level routes.** Each first segment MUST be added to:
- `client/src/config/reservedSegments.js` (`RESERVED_FIRST_SEGMENTS`)
- `server/config/reservedNamespaces.js` (server L1 registry)

Otherwise `routeManifestSync` / `reservedSegmentsSync` drift tests fail the
Vercel deploy. Add `'opening'` and `'inaugurators'` to both, same PR as the route.

## 4. The experience (phase 1)

### 4.1 Cold open — `/opening`
- Full-screen dark. Heavy **velvet curtains** drawn edge-to-edge, gold rope trim.
- Center headline (glowing): *"Book A Sloth isn't open yet. Someone has to open it. Today, that's you."*
- Live counter: **"3,412 people have opened the doors."** (from `GET /count`).
- Countdown: **"Doors close in 21h 04m."** (client ticks off a server-provided `closes_at`).
- The **golden ribbon** across the curtains, scissors resting on it, pulsing.

### 4.2 The cut
- **Desktop:** press on scissors, drag along ribbon. Slight resistance, then snip; both halves whip away.
- **Mobile:** drag finger across ribbon. Same snip + `navigator.vibrate()` haptic if available.
- Interaction detail: ribbon is an SVG path; track pointer x across its length; when drag crosses a threshold (~70% of ribbon width) → fire `onCut()`. One-shot, debounced, ignores accidental taps.

### 4.3 The reveal
On cut:
- Curtains sweep open (CSS transform, both sides translate outward, eased ~1s).
- **Confetti storm** — full-screen, gold + sloth-green, layered, slow fall, ~4–6s. Not a sprinkle. Optional cheer chime (respect muted/reduced-motion).
- Behind curtain: the real homepage / brand reveal.
- Headline lands: **"You opened Book A Sloth. You're Opener #3,413."** (number from `POST /open`).

`prefers-reduced-motion`: skip curtain physics + confetti storm, still show the
number and name capture. Accessibility is not optional.

### 4.4 Name capture
Soft prompt: *"Put your name on the wall — forever?"*
- Fields: **name** (required, 2–40 chars), **message** (optional, ≤80 chars).
- Phase-2 affordance: a greyed **"Verify my number on WhatsApp"** row, disabled with a "coming soon" tag. Wire it in phase 2, no layout change.
- Submit → `POST /open` → returns their permanent `number`. Show their stone:
  **"Opener #3,413 — [Name] — opened the doors on 13 Aug 2026."**
- Anti-abuse (phase 1, lightweight): one open per browser (localStorage token +
  server-side IP+ua soft rate-limit via existing limiter). Real dedupe is
  phase-2 WhatsApp verify. Do NOT gate phase 1 on verification.

### 4.5 The Wall — `/inaugurators`
- Permanent public page, lives on the site forever (also linkable from footer/About after event).
- Ordered list, **#1 at top**, number · name · optional message · date · (phase 2) ✓ verified.
- Search box to find your own name.
- Pagination / windowed render (could be thousands of rows) — server paginates, client infinite-scrolls.
- After the 24h window closes: page becomes read-only ("Doors sealed on … · N openers"). No new names ever.

## 5. Data model — `v3.100_opening_ceremony.sql`

New dedicated table (self-contained, easy to seal; does not touch `profiles`).

```sql
create table if not exists openers (
  id           uuid primary key default gen_random_uuid(),
  number       bigint unique not null,          -- permanent opener number, gap-free, 1-based
  name         text not null check (char_length(name) between 1 and 40),
  message      text check (char_length(message) <= 80),
  -- phase 2 (columns exist now, unused in phase 1):
  phone        text,                            -- E.164, only set when verified
  verified     boolean not null default false,
  verified_at  timestamptz,
  -- provenance / anti-abuse:
  ip           inet,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists openers_number_idx on openers (number);
-- one verified opener per phone (partial: nulls/unverified excluded):
create unique index if not exists openers_phone_unique
  on openers (phone) where phone is not null;
```

**Gap-free number allocation:** same pattern as GST invoice serials — allocate
inside a transaction via a Postgres sequence or `select … for update` on a
counter row, so concurrent opens never collide or skip. Do NOT compute
`max(number)+1` in app code (race). Reuse the invoice-serial RPC approach.

**Window config:** store `opening_opens_at` / `opening_closes_at` in
`platform_settings` (existing table) — not hardcoded. Server is the clock;
client only renders the countdown from a server value.

Migration workflow (per CLAUDE.md): apply on **BOTH** DBs (prod Mumbai +
staging Tokyo), keep code-side schema fallback until confirmed applied on both.

## 6. API — phase 1

All under existing Express app. New router `server/routes/openingRoutes.js` +
`server/controllers/openingController.js`.

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| `GET` | `/api/opening/status` | — | `{ opens_at, closes_at, open, count }` | drives countdown + counter |
| `POST` | `/api/opening/open` | `{ name, message? }` | `{ number, name, created_at }` | allocates number in txn; 403 if window closed; rate-limited |
| `GET` | `/api/opening/wall` | `?cursor=&limit=` | `{ openers: [...], next_cursor }` | paginated, ordered by number asc |

- **Window guard:** `POST /open` rejects (`410 Gone`, branded error) once
  `now > closes_at`. Same guard server-side — never trust client countdown.
- **Rate limit:** reuse existing limiter middleware; cap opens per IP.
- **No PII in phase 1** beyond name + optional message (public by design). Phone
  only enters in phase 2 behind verification.

## 7. Phase 2 — WhatsApp verification (designed, not built here)

- **Event-scoped OTP** (per your call): new lightweight flow, isolated from guest
  auth — never touches `authController` / login. New `openingOtpStore` (mirror
  `utils/otpStore.js`) + AiSensy send via existing `notify.js`/provider config.
- Flow: enter number → `POST /api/opening/verify/start` (send OTP) →
  `POST /api/opening/verify/confirm { code }` → sets `openers.verified=true`,
  `phone`, `verified_at`. Enforced by `openers_phone_unique` (one wall entry per
  real number).
- Verified openers get `✓` on the Wall + their stone "locked" to them. This is
  the anti-fake layer and the status flex. Optional — unverified names still
  count and stay on the wall.
- Share card: reuse OG-card pipeline (host-og / blog clone,
  `client/scripts/generate*OgImages.mjs`) → per-opener card
  ("I opened Book A Sloth 🦥 — Opener #3,413"). Store URL on the row or render on demand.

## 8. File map (planned)

```
client/src/
  pages/Opening.jsx           # ceremony: curtain, ribbon, cut, confetti, capture
  pages/Inaugurators.jsx      # permanent wall
  components/opening/
    Curtain.jsx               # curtain open animation
    RibbonCut.jsx             # pointer-driven cut interaction (mouse + touch)
    ConfettiStorm.jsx         # full-screen confetti (reduced-motion aware)
  config/reservedSegments.js  # + 'opening', 'inaugurators'
server/
  routes/openingRoutes.js
  controllers/openingController.js
  config/reservedNamespaces.js  # + 'opening', 'inaugurators' in L1
  migrations/v3.100_opening_ceremony.sql
docs/opening-ceremony-spec.md  # this file
```

## 9. Build order (phase 1)

1. Migration `v3.100` + apply on both DBs; seed `platform_settings` window values.
2. Backend: controller + routes + gap-free number allocation + window guard + tests.
3. Reserved-segment entries (both files) — keep deploy green.
4. `/inaugurators` Wall (read path first — easiest to verify).
5. `/opening` ceremony: curtain → ribbon cut → confetti → capture → number reveal.
6. Reduced-motion + mobile-touch pass.
7. `npm test` (server) + `npm run build` (client) + drift tests green.

## 10. Guardrails / landmines

- **Deploy drift:** new route not in BOTH reserved files → CI red, deploy skipped. (`docs` memory: reserved-namespace-system, vercel-deploy-blocked-by-vitest.)
- **Number race:** allocate in a transaction, never `max()+1` in JS.
- **Window is server-authoritative:** client countdown is cosmetic; the 410 guard is the real gate.
- **Reduced motion / no-JS:** ceremony must degrade to "enter name, get number." Never trap a user behind an animation.
- **Migration on both DBs**, code-side schema fallback until confirmed (CLAUDE.md rule).
- **Don't gate the real site** behind the ceremony. `/opening` is a moment, not a wall in front of the product.

## 11. Open questions (pre-build)

1. What does "the reveal" show behind the curtain — homepage, or a dedicated brand splash?
2. Exact 24-hour window date/time (Asia/Kolkata) — set at build or via admin toggle?
3. Footer/About link to `/inaugurators` after the event — in scope now or later?
4. Reward tie-in (booking credit / founder badge) — phase 1, phase 2, or separate epic?

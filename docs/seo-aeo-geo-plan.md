# SEO / AEO / GEO Plan — Book A Sloth

_Last updated: 2026-06-20 • Owner: Shubham • Status: planning_

## Context (current state, verified from code)

- **Stack:** React 18 + Vite SPA, client-rendered, deployed on Vercel (`client/vercel.json`, `client/middleware.js`).
- **What exists today:**
  - `index.html` — title, meta description, single canonical (root only), OG + Twitter card set (one shared static card), `theme-color`, `og-image.png` (1200×630) in `public/`.
  - `useDocumentMeta` hook — sets per-route `<title>` + description in JS (works for Google, not for non-JS crawlers/scrapers).
  - Edge middleware — real **301** redirects on username change (preserves link equity).
- **What's missing:** `robots.txt`, `sitemap.xml`, `llms.txt`, any JSON-LD structured data, per-route canonical/OG, and SSR/prerender (non-Google bots see an empty `<div id="root">`).

The core architectural fact driving this plan: **a client-rendered SPA is invisible to crawlers that don't execute JS** (Bing, most social scrapers, several AI crawlers). Google renders JS but with delay and budget limits. Everything below is sequenced around closing that gap cheaply first, then deciding on prerender.

---

## Definitions (so we're aligned)

| Term | Means | Primary surface |
|---|---|---|
| **SEO** | Rank in classic search results | Google, Bing |
| **AEO** | Win answer boxes / rich results / featured snippets | Google AI Overviews, featured snippets, voice |
| **GEO** | Get cited inside generative answers | ChatGPT, Perplexity, Gemini, Claude |
| **AI search** | Umbrella for AEO + GEO crawler/citation behavior | All of the above |

They share one foundation: **machine-readable, server-visible content.** Structured data and a crawlable HTML surface help all four at once — that's why they're front-loaded.

---

## Phase 0 — Quick wins (no architecture change)

High impact, low effort, ship in one pass. All static files into `client/public/` so Vite copies them to `dist/`.

1. **`robots.txt`** — allow crawl, point to sitemap, optionally welcome AI crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended) explicitly.
2. **`sitemap.xml`** — static URLs first (home, `/explore`, `/about`, `/help`, legal, both `/lp/*` pages). Host-profile URLs come in Phase 2 via a generated sitemap.
3. **`llms.txt`** — machine-readable summary of what Book A Sloth is, pricing (0% commission, ₹499 Pro), key pages, and positioning. Cheap GEO signal.
4. **JSON-LD `Organization`** in `index.html` — name, url, logo, `sameAs` (social profiles), `description`. Static, ships immediately.
5. **Per-route canonical** — extend `useDocumentMeta` to also manage `<link rel="canonical">` per route (Google honors JS-injected canonicals).

_Outcome: discoverable, crawl-directed, one real entity signal. ~half a day._

---

## Phase 1 — Structured data (AEO core)

Highest leverage for answer boxes and AI citation. Inject route-specific JSON-LD via the meta hook (extend it to accept a `jsonLd` object) or a small `<JsonLd>` component.

1. **`FAQPage`** on the comparison LPs (`CalendlyAlternative`, `TopmateVsBookASloth`) — you already have the Q&A content; mark it up. Directly targets featured snippets + "is X better than Y" AI queries.
2. **`Service` / `Product` + `Offer`** on host service pages (`ServiceDetail.jsx`) — name, description, price in INR, provider. Feeds price-aware rich results.
3. **`ProfilePage` / `Person`** on host profiles (`HostProfile.jsx`) — host name, role, services offered.
4. **`BreadcrumbList`** on nested pages.
5. **`AggregateRating` / `Review`** wherever reviews exist (you have a `/reviews` route) — star ratings in results.

_Validate each with Google Rich Results Test before shipping._

---

## Phase 2 — Crawlability & freshness

1. **Dynamic sitemap for host profiles** — small server route (`/sitemap-hosts.xml`) querying Supabase for public usernames, referenced from the index sitemap. Keeps new creators discoverable automatically.
2. **Per-route OG/meta** — currently one shared card. Real per-page social/AI previews need server-visible tags → ties into the Phase 3 decision.
3. **Internal linking** — ensure `/explore` links to host profiles in real anchors (crawl paths for the long tail of creator pages).

---

## Phase 3 — The SSR / prerender decision (biggest lever, biggest cost)

The ceiling on AEO/GEO until resolved: scrapers and JS-light AI crawlers see an empty shell. Options, cheapest first:

- **A. Prerender bot traffic only** (e.g. Prerender.io / a render service via the existing Vercel edge middleware) — serve fully-rendered HTML to known bots, SPA to humans. Lowest code change, monthly cost, works with current architecture. **Recommended starting point.**
- **B. Build-time prerender** of static/marketing routes (home, LPs, about) via `vite-plugin-ssr`/`vite-react-ssg` — free at runtime, but only covers known-at-build URLs (not dynamic host profiles).
- **C. Full SSR / migrate marketing surface to Next.js** — best result, largest effort. Only justified if SEO becomes a primary growth channel.

Recommendation: **A for dynamic pages (host profiles) + B for marketing/LP pages.** Defer C unless data demands it.

---

## Phase 4 — Measurement & iteration

- Google Search Console + Bing Webmaster Tools (submit sitemaps, watch coverage/render).
- Track AI-referral traffic (ChatGPT, Perplexity referrers) in analytics.
- Periodic Rich Results / schema validation in CI.
- Re-crawl check: confirm bots receive rendered HTML post-Phase 3.

---

## Suggested sequence

```
Phase 0  (quick wins)          ── ship first, ~0.5 day
Phase 1  (structured data)     ── highest ROI for AEO/GEO
Phase 2  (sitemaps + linking)
Phase 3  (prerender decision)  ── unblocks the ceiling
Phase 4  (measure + iterate)   ── ongoing
```

## Open questions / your ideas
_(to fill in before implementation)_

- [ ] Additional landing pages / comparison targets?
- [ ] Target keywords / queries you most want to own?
- [ ] Priority geographies (India-only vs broader)?
- [ ] _Your ideas here →_

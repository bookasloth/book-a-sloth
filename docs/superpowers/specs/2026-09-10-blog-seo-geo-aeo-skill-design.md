# Blog SEO/GEO/AEO Optimizer Skill — Design

**Date:** 2026-09-10
**Status:** Design (awaiting review)
**Branch:** `feat/blog-seo-geo-aeo-skill`

## Problem

Publishing a blog post to Book A Sloth today is manual: write Markdown → hand-edit
`client/src/data/blogPosts.js` → `node server/scripts/seedBlogs.js` on both DBs. Nothing
enforces the SEO/GEO/AEO bar before publish. The existing audit engine
(`server/services/seo/scoring/`, #960) only scores **live crawled URLs** after publish, so a
weak post ships, ranks poorly, and is fixed reactively.

We want a skill that takes a blog post Markdown file and returns a fully optimized, scored,
PR-ready post — running the same scoring rubric *before* publish and iterating until it clears a
threshold.

## Goals

- Input: one Markdown file (front-matter + body).
- Optimize for SEO + GEO + AEO: title/meta, answer-first structure, headings, extractable
  chunks, FAQ, E-E-A-T signals, image alt, internal + outbound links.
- Score the draft using the **live** `v2.scorePage` scorer (no live crawl) and auto-iterate
  (threshold 90, max 3 passes).
- Research link targets via built-in WebSearch; pull internal-link targets from the live
  `blogs` table.
- Output: updated `client/src/data/blogPosts.js`, fresh branch, commit, PR. Stop at PR.

## Non-goals (v1)

- **Portability / public repo.** v1 is BAS-coupled. A portable core (bundled rubric, generic
  adapters) and a public MIT repo are a documented future phase (see "Future: extraction"),
  not built now.
- Real off-site backlinks (require outreach, out of scope — skill adds *outbound* + *internal*
  links only).
- Auto-merge / auto-deploy. Skill stops at the PR link; the user merges.
- Writing JSON-LD by hand (relies on the existing `articleGraphJsonLd` builder).
- GSC-dependent scoring. The `search_performance` dimension needs live Google Search Console
  data a never-published draft cannot have — see "Scoring ceiling".

## Key facts (from repo map)

- **Scorer is pure and callable:** `v2.scorePage(page, ctx)` — `server/services/seo/scoring/index.js:36`.
  Signature `scorePage(page, { issues=[], gsc=null, queries=[], robots={} })`, returns
  `{ seo:{score,uncapped,profile,dimensions,caps}, geo:{...}, recommendations[], signals{} }`.
- **Signal extraction:** `extract(page, ctx)` — `server/services/seo/scoring/signals.js:58`. For a
  blog it reads top-level/`raw_signals` fields: `headings`, `links.{internal,external}`,
  `images`, `wordCount`/`word_count`, `bodyText`, `jsonLd`, `title`, `meta_description`,
  `canonical`, `robots`, `http_status`, `page_type`.
- **Blog weight profile:** `page_type: 'blog'` — `server/services/seo/scoring/weights.js:9`.
  SEO dimensions (`seoScore.js:21`): indexability, canonical, metadata, content,
  internal_linking, structured_data, media, search_performance. GEO dimensions
  (`geoScore.js:9`): crawler_access, extractability, entity_clarity, answer_coverage,
  structure, evidence, structured_data, freshness. Blog content-depth bands `seoScore.js:13`.
- **Source of truth:** `client/src/data/blogPosts.js` exports `BLOG_POSTS[]`, `AUTHOR`
  (`:36`), `CATEGORY_THEME` (`:53`). Post shape (`:7-28`): `slug, title, date, author,
  readMins, category, image, icons[], excerpt, body[]`.
- **Seeder:** `server/scripts/seedBlogs.js` dynamic-imports the ESM file, upserts into `blogs`
  by slug. Does NOT write `og_image`/`seo_title`/`tags` (client-only or separate).
- **Body = jsonb block array** (`blogPosts.js:17-28`, renderer `BlogPost.jsx:72`). Block types:
  `{p}`, `{h2}`, `{ul:[]}`, `{ol:[]}`, `{steps:[]}`, `{quote,cite}`, `{info:{title,text}}`,
  `{table:{head,rows}}`, `{faq:[{q,a}],faqTitle}`. **Inline links = markdown `[label](href)`
  inside any text string**, parsed by `rich()` (`BlogPost.jsx:49`) — internal `/x` → SPA Link,
  external `http…` → `<a target=_blank rel=noopener>`. No new block type needed to add links.
- **JSON-LD single builder:** `articleGraphJsonLd` — `client/src/utils/seo.js:305`. Emits one
  `@graph` (WebSite, Organization, Person author by `@id`, WebPage, BlogPosting, BreadcrumbList,
  FAQPage when FAQs exist). `sameAs` from `author.sameAs[]`. Both bot paths share this: client
  runtime (`BlogPost.jsx:334`) + build-time Puppeteer bake (`client/scripts/prerender.mjs`).
  Nothing to sync manually.
- **Classification:** free-text `category` column only (News/Product/Feature Update/Guide/
  Growth/Engineering/Security/Money/Comparison/Host Story). No marketing-vs-product column →
  infer from content/slug.
- **LANDMINE:** body-anchor edits require re-seeding BOTH DBs (prod Mumbai + staging Tokyo).
  Client-only tags/clusters do not.

## Architecture (v1, BAS-coupled)

Two committed pieces + the skill definition:

### 1. `server/scripts/scoreBlogDraft.mjs` (the one real script)

A thin, reusable CLI the skill shells out to. Responsibilities:

- Read a **draft post object** (JSON on stdin or a temp file path) in `blogPosts.js` post shape.
- Render `body[]` → plain `bodyText` + extract `headings`, `links.{internal,external}`,
  `images` (with alt), `wordCount`.
- Build `jsonLd` by calling the live `articleGraphJsonLd` (import from
  `client/src/utils/seo.js`) with the post's author/FAQ/image/date fields, so the scored schema
  is exactly what ships.
- Synthesize a `seo_crawl_pages`-shaped row (`page_type:'blog'`, `http_status:200`,
  `canonical` = `${SITE_URL}/blog/${slug}`, `robots` allow, the extracted signals).
- Call `v2.scorePage(page, { robots, gsc:null })` and print
  `{ seo, geo, recommendations }` as JSON.

Pure, no DB writes, no network. Usable in CI later (e.g. score every post in `blogPosts.js`).

### 2. The skill: `~/.claude/skills/blog-seo-optimizer/SKILL.md`

Orchestration instructions (no app code). Pipeline:

1. **Parse** the input MD → front-matter (`title, slug, category, date, author, excerpt`) +
   body Markdown → typed `body[]` blocks. Missing slug → derive from title.
2. **Research (WebSearch)** the primary keyword (+ 3–5 secondary derived from title/intent):
   - authority outbound-link targets (high-credibility sources),
   - People-Also-Ask / related questions → FAQ block + GEO answer-coverage,
   - competitor headings → content-gap fill.
3. **Internal-link targets (Supabase MCP):** query the `blogs` table for published posts; pick
   3–5 topically relevant by title/category/slug overlap; add key product pages (`/be-a-sloth`,
   host profiles, pricing). Classify marketing vs product-update by content/slug inference.
4. **Optimize** the draft post object:
   - Title ≤ 60 chars, keyword front-loaded; `excerpt` 140–160 chars.
   - Answer-first intro (2–3 sentences directly answering the title) for GEO extractability.
   - Heading hierarchy, keyword variants in H2s.
   - Extractable chunks: short declarative sentences, a `table` or `steps` block where it fits.
   - `faq` block from PAA (feeds FAQPage schema + AEO).
   - E-E-A-T: author byline, `date`, first-hand/specific claims.
   - Image alt text on hero + inline.
   - **Links: max 4 outbound authority + 3–5 internal**, inserted as inline `[label](href)`
     inside existing text blocks (internal `/blog/slug`, outbound `https://…`).
5. **Score:** write the draft object to a temp file, run `scoreBlogDraft.mjs`, read SEO + GEO
   score + recommendations.
6. **Iterate:** if either SEO or GEO < **90**, apply the returned recommendations and re-score.
   Cap at **3** passes. Report final scores + residual gaps and *why* (esp. the GSC ceiling).
7. **Ship:** write the optimized post object into `client/src/data/blogPosts.js` (respect the
   file's existing formatting/ordering). Branch already fresh from main per workflow; commit;
   `gh pr create`. **Stop at the PR.** PR body MUST include the reminder: after merge, run
   `node server/scripts/seedBlogs.js` against **both** DBs (body-anchor landmine).

### Scoring ceiling (honest "100")

`search_performance` (SEO) and parts of GEO `evidence`/`freshness` reward live GSC + real
traffic. A never-published draft scores `gsc:null`, so those dimensions sit at their
no-data baseline and the **pre-publish ceiling is high-90s, not a true 100**. The skill reports
`pre-publish score: X / pre-publish ceiling: Y` so the remaining gap reads as *demand/authority*
(the #957 verdict), not markup. True 100 only after the post ranks and GSC feeds back.

## Data flow

```
MD file
  → parse (front-matter + body blocks)
  → WebSearch (outbound targets, PAA, competitor gaps)
  → Supabase blogs query (internal targets)
  → optimize → draft post object
  → scoreBlogDraft.mjs  ──calls──▶ v2.scorePage + articleGraphJsonLd
  → {seo, geo, recommendations}
  → (loop ≤3 until ≥90)
  → write blogPosts.js → commit → PR  [STOP]
  → (post-merge, manual) seedBlogs.js × both DBs
```

## Error handling

- **MD parse fails / missing title:** abort with a clear message; never write a half-post.
- **WebSearch unavailable or empty:** proceed without outbound links; report "no outbound links
  added" — do not fabricate URLs.
- **Supabase MCP unreachable:** fall back to parsing `blogPosts.js` for internal targets; warn
  that the list may lag prod.
- **Scorer import/run fails:** abort before any git action; surface the node error verbatim.
- **Threshold not reached in 3 passes:** ship anyway with a flagged report of residual gaps (do
  not loop forever); user decides.
- **Slug collision** with an existing post: stop and ask — never silently overwrite.

## Testing

- `scoreBlogDraft.mjs`: one `assert`-based self-check (`--selfcheck`) that feeds a known
  fixture post object and asserts the score is in range and the blog profile is selected. Fails
  if the scoring contract (field names `v2.scorePage` expects) drifts.
- Skill-level: a dry-run mode (`--no-pr`) that stops after scoring + writing files, used to
  eyeball one real post before trusting the PR path.

## Future: extraction to a portable public skill (NOT v1)

Once proven on BAS, extract a **core + adapter** split:
- **Core (public, MIT):** bundled clean-room rubric (port of the 8 SEO + 8 GEO dimensions),
  generic link research, Markdown-native I/O, driven by a `blogseo.config` file.
- **Adapter (per-project):** BAS keeps a config pointing the scorer at the live `v2.scorePage`
  and the writer at `blogPosts.js` (so BAS never drifts from prod); other users get the bundled
  rubric + Markdown output.
- Publish as a standalone GitHub repo (MIT). Publishing is a separate, explicitly-confirmed
  action.

## Open questions

- None blocking v1. (License = MIT confirmed for the future public phase.)

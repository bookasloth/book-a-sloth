// Static blog content. No DB / no server yet — posts are authored here as data
// and rendered by pages/Blog.jsx (index) + pages/BlogPost.jsx (detail).
// When the real blog CMS lands, this file is the single thing to replace.
//
// Each post:
//   slug      — URL segment (/blog/:slug). Must be unique + URL-safe.
//   title     — headline
//   date      — display string (also sort order, newest first below)
//   author    — byline (links to AUTHOR_URL on the post page)
//   readMins  — rough read time, shown on cards
//   category  — drives the post-hero colour. Must be a key of CATEGORY_THEME.
//   image     — hero image URL (right half of the split hero). null → a
//               branded fallback panel is shown. Hidden on mobile either way.
//   excerpt   — 1–2 line summary for the index card + post hero subtitle
//   body      — array of blocks. Supported renderers (see BlogPost.jsx):
//                 { p }                        paragraph
//                 { h2 }                       section heading
//                 { ul: [..] }                 bullet list
//                 { ol: [..] }                 decimal numbered list
//                 { steps: [..] }              01/02 mono-indexed steps
//                 { quote, cite? }             pull-quote + optional attribution
//                 { info: { title, text } }    callout box
//                 { table: { head, rows } }    two-column data table
//
// Posts are listed newest-first; keep that order when adding.

// Author backlink — the byline + Author meta link out here.
export const AUTHOR_URL = 'https://bolt958.xyz';

// One colour theme per blog category. The post hero (+ bottom CTA band) use
// `band`; the dark reading body uses `accent`; index chips use chip*.
// `light: true` flips band text to ink (Growth / yellow).
export const CATEGORY_THEME = {
  News:             { band: '#FE5100', accent: '#FF8A3D', light: false, chipBg: 'rgba(254,81,0,0.10)',  chipFg: '#c2410c' },
  Product:          { band: '#FE5100', accent: '#FF8A3D', light: false, chipBg: 'rgba(254,81,0,0.10)',  chipFg: '#c2410c' },
  'Feature Update': { band: '#1E63C9', accent: '#5BA8F5', light: false, chipBg: 'rgba(30,99,201,0.10)', chipFg: '#1e63c9' },
  Guide:            { band: '#2E9D58', accent: '#5FD089', light: false, chipBg: 'rgba(46,157,88,0.12)', chipFg: '#1f7a43' },
  Growth:           { band: '#FFCC1C', accent: '#B98900', light: true,  chipBg: 'rgba(255,204,28,0.18)',chipFg: '#9a7400' },
  Engineering:      { band: '#1E63C9', accent: '#5BA8F5', light: false, chipBg: 'rgba(30,99,201,0.10)', chipFg: '#1e63c9' },
  Internal:         { band: '#E63B82', accent: '#FF7DAE', light: false, chipBg: 'rgba(230,59,130,0.10)',chipFg: '#c2326f' },
};
export const themeFor = (category) => CATEGORY_THEME[category] || CATEGORY_THEME.News;

export const BLOG_POSTS = [
  {
    slug: 'how-explore-ranking-works',
    title: 'How Explore Ranking Works on Book A Sloth: A Host’s Guide to Getting Found',
    date: 'Jul 11, 2026',
    author: 'Book A Sloth Team',
    readMins: 16,
    category: 'Guide',
    image: null,
    icons: ['chart', 'target', 'megaphone'],
    excerpt:
      'Your service’s spot on /explore isn’t random or pay-to-win — it’s a quality score computed from what you control. Here’s exactly what the algorithm measures, what moves it today, the penalties that quietly sink you, and a 30-minute setup that lifts most listings.',
    body: [
      { p: 'When a guest opens the Explore page on Book A Sloth, they don’t see hosts in a random order, and they don’t see whoever paid the most. They see services ranked by a quality score — a single number from 0 to 100 that the platform computes for every active service from signals you almost entirely control. This guide opens the box. You’ll learn exactly what the score measures, which levers actually move it today, the penalties that quietly drag good listings down, and a short setup routine that lifts most services in under half an hour.' },
      { p: 'The important promise first: Explore ranking is earned, not bought. There is no bid, no boost, no “featured” fee that jumps you to the top of the main grid. Everything below is available to every host on every plan, for free. If you do the work, you rank.' },

      { h2: 'How ranking works, in one sentence' },
      { p: 'Every active service gets a precomputed quality score (0–100); when a guest browses with no search, services are ordered by that score, and when a guest searches, the score is multiplied by how well your listing matches their words. That’s the whole model — quality × relevance.' },
      { p: 'Two details matter. First, the score is precomputed, not calculated when a guest loads the page. It’s stored, refreshed when your data changes, and re-swept once a week. That’s why an edit you make today shows up in your ranking shortly after — not instantly on every keystroke, but close. Second, the score is per service, not per profile. If you offer three services, each is ranked on its own merits. A beautifully finished flagship service can rank well while a half-filled second listing sits far below it.' },
      { info: { title: 'The one-line mental model', text: 'No search → services sorted by quality score, highest first. With a search → quality score × how closely your title, category, and description match the query. Quality is what you build; relevance is how well your words match what the guest typed.' } },

      { h2: 'The five things the score measures' },
      { p: 'The 100 points are split across five areas. Knowing the weights tells you where your effort pays off most:' },
      { table: {
        head: ['Area', 'Weight', 'What it rewards'],
        rows: [
          ['Customer Satisfaction', '30', 'Ratings, review recency & count, repeat guests'],
          ['Booking Performance', '25', 'Recent bookings, completion rate'],
          ['Reliability', '20', 'Low cancellations, dependable delivery'],
          ['Listing Quality & SEO', '15', 'A complete, well-written, verified listing'],
          ['Availability & Activity', '10', 'Open slots, a fresh calendar, an active host'],
        ],
      } },
      { p: 'On paper, Satisfaction and Bookings dominate — more than half the score. But here’s the honest part most ranking guides won’t tell you: those two areas are powered by history you accumulate over time. A brand-new service has no reviews and few bookings yet, so on day one the areas you can fully control — Listing Quality, Availability, and Reliability — decide almost everything. That’s good news. The parts you can fix in an afternoon are exactly the parts that get a new listing off the floor.' },

      { h2: 'What actually moves your score today' },
      { p: 'Let’s separate the levers you can pull right now from the ones that build up over time. Pull the first list today; the second list rewards you for simply being good at your craft over the coming weeks.' },
      { p: 'Fully in your control, effective immediately:' },
      { ul: [
        'A complete, well-written listing — title, description, cover image, price, category, FAQs.',
        'An open, fresh calendar — real availability in the next 7 days, updated recently.',
        'Being an active host — logging in and tending your page, not going dark.',
        'Getting verified — completing KYC so your listing carries the trust signal.',
        'Never cancelling on a guest — reliability is both scored and penalised.',
      ] },
      { p: 'Builds over time as you deliver great sessions:' },
      { ul: [
        'Reviews — their rating, how recent they are, and how many you’ve earned.',
        'Repeat guests — people booking you more than once.',
        'A steady flow of recent bookings.',
        'A high completion rate — sessions that actually happen, not no-shows.',
      ] },
      { info: { title: 'A note on honesty', text: 'Some ranking signals you may have seen on other platforms — photo galleries, keyword tags, an “instant book” toggle, response-time scoring — are not part of Book A Sloth’s scoring today. We’d rather tell you what actually works than pad this list. As the platform grows, this guide will grow with it.' } },

      { h2: 'Listing Quality: the 30-minute win' },
      { p: 'This is the highest-return work for any host, because every point here is available immediately and none of it depends on history. Walk your listing through this checklist:' },
      { steps: [
        'Title — make it descriptive and specific, roughly 30 to 60 characters. “Strategy” scores nothing here; “90-Minute SEO Strategy Session for Founders” tells a guest (and the algorithm) exactly what they’re getting. Say the thing and, where it fits naturally, where you serve.',
        'Description — write a real one, at least 150 characters, ideally far more. Explain who it’s for, what happens in the session, and what they walk away with. A thin description caps your listing-quality points and, worse, loses the guest.',
        'Meta / SEO description — a clean 120–160 character summary. This is what shows in search results and previews; it’s also a scored field. One or two tight sentences.',
        'Cover image — add one. A listing with a cover reads as finished; one without reads as abandoned. This is the single fastest visual credibility win.',
        'Price — set one, and don’t hide it. A listed price (paid or free) scores; a hidden price does not. Guests trust a number.',
        'Category — pick the right one. A correctly categorised service both scores and shows up when guests filter by profession.',
        'FAQs — add at least three genuine questions and answers. This clears a scored threshold and pre-empts the questions that make guests hesitate.',
        'Service area — set your location on your profile. It fills a scored field and helps local guests find you.',
        'Get verified — complete KYC. A verified host carries a trust badge and a scored point; it’s also required before payouts, so there’s no reason to skip it.',
      ] },
      { p: 'None of this is clever. It’s just complete. The gap between a half-filled listing and a finished one is often the difference between page one and page three.' },

      { h2: 'Availability & Activity: don’t go dark' },
      { p: 'Ten points ride on being genuinely bookable and genuinely present. The algorithm can tell the difference between a live host and a dormant one.' },
      { ul: [
        'Keep real availability open in the next seven days — the more days with open slots, the better. A calendar with every day open scores the full band here.',
        'Keep your calendar fresh — update it recently rather than letting it drift for weeks. A recently-touched calendar signals “I’m taking bookings.”',
        'Stay active — log in and tend your page. A host who hasn’t appeared in weeks looks closed for business, and the score reflects that.',
      ] },
      { p: 'This area is small in points but outsized in consequence, because it also feeds the penalties below. An empty calendar doesn’t just cost you availability points — it triggers a multiplier that slashes your whole score.' },

      { h2: 'The penalties that quietly sink good listings' },
      { p: 'Everything so far adds points. Penalties do something more dangerous: they multiply your entire score down, after all the adding is done. A great listing with a penalty attached can rank below a mediocre one without. There are three you need to respect.' },
      { info: { title: 'Zero availability — the score-killer', text: 'If your service has no open availability, its score is multiplied by 0.3 — a 70% cut. This is the harshest penalty by far, and the most common self-inflicted wound. A superb listing with a closed calendar is a superb listing nobody can rank. Always keep real slots open.' } },
      { info: { title: 'Going inactive — the slow fade', text: 'If you go inactive for more than 45 days, your score is multiplied by 0.6 — a 40% cut. Discovery rewards hosts who are actually here. A five-minute login and a calendar check every few weeks is enough to stay out of this band.' } },
      { info: { title: 'A recent cancellation — the trust dent', text: 'A host-side cancellation in the last 7 days multiplies your score by 0.85. It’s the mildest of the three and it heals on its own after the week passes — but it’s a real reminder that cancelling on a guest costs you visibility, not just goodwill.' } },
      { p: 'Read those together and the message is simple: stay open, stay active, and don’t cancel. Do those three things and you’re immune to the penalties that quietly bury most listings.' },

      { h2: 'Reviews and bookings: the long game' },
      { p: 'More than half the total score lives in Satisfaction and Booking Performance, and you can’t fake either. They accrue from doing good work: guests book you, you deliver, they come back, they leave a five-star review. There’s no shortcut, and that’s deliberate — it keeps the top of Explore honest.' },
      { p: 'What you can do is set the flywheel spinning. Every completed session is a booking-performance point and a chance at a review. Reviews are weighted on rating, how recent they are, and how many you’ve earned — so a steady trickle of fresh five-stars beats a burst that goes stale. Repeat guests count too, so a service worth booking twice compounds. Completion rate matters as much as volume: a booking that actually happens is worth far more than one that no-shows, so confirm, remind, and show up.' },
      { p: 'If you’re brand new, don’t wait passively. Nail the levers in the earlier sections to earn your first page-one impressions, deliver so well that your first guests want to review you, and the heavy half of the score starts filling itself in.' },

      { h2: 'How search relevance works' },
      { p: 'Everything above sets your quality score. When a guest types a query into Explore, a second factor kicks in: relevance. Your quality score is multiplied by how well your listing matches the words they used, and listings that don’t match at all are filtered out entirely.' },
      { p: 'Matches are tiered by where the query appears:' },
      { table: {
        head: ['Where the query matches', 'Relevance weight'],
        rows: [
          ['In your title', 'Strongest'],
          ['In your category', 'Strong'],
          ['In your description', 'Standard'],
          ['Nowhere', 'Excluded from that search'],
        ],
      } },
      { p: 'The practical takeaway: put the words your guests actually search into your title and category, in plain language. If people look for “career coaching,” a title that says “Career Coaching” will out-rank an equally-good service titled only “Consultation,” because relevance multiplies quality. Write for the words in a guest’s head, not the jargon in yours.' },

      { h2: 'Common mistakes that cost hosts visibility' },
      { ul: [
        'A closed or empty calendar. The single most damaging mistake — it triggers the 0.3 multiplier and erases most of your score. Fix this before anything else.',
        'A one-word or vague title. “Session,” “Call,” “Service” tell nobody anything and match no searches. Be specific.',
        'A thin description. Under 150 characters caps your listing points and fails to convince the guest.',
        'A hidden price. Guests skip what they can’t price, and the score rewards a listed price over a hidden one.',
        'Skipping verification. Unverified means no trust badge, a lost point, and no payouts.',
        'Going dark for weeks. Inactivity past 45 days costs 40% of your score for no reason other than absence.',
        'Cancelling on guests. Beyond the immediate 7-day penalty, it suppresses the reviews and repeat bookings that carry the heavy half of the score.',
        'Spreading effort thin across many half-built services instead of finishing one. Each service is ranked alone — one complete listing beats three empty ones.',
      ] },

      { h2: 'A tale of two services' },
      { p: 'Same profession, same skill, very different Explore outcomes — because of choices, not luck.' },
      { p: 'Service A is titled “Consultation.” No cover image. A 40-character description. Price hidden. No FAQs. The host set up a calendar in March and hasn’t touched it since; there are no open slots this week. On paper the host is talented — but the listing scores near the floor on quality and then gets multiplied down by the zero-availability penalty. It sits on page three, and the host concludes “Explore doesn’t work.”' },
      { p: 'Service B is titled “90-Minute Career Strategy Session for Career Switchers.” It has a cover image, a 400-word description, a listed price, the right category, five FAQs, and a verified host. The calendar has open slots every day this week and was updated yesterday. It has two completed bookings and one recent five-star review. It ranks on page one, gets found, gets booked — and every new booking and review pushes it higher.' },
      { p: 'The gap between them isn’t talent. It’s a finished listing, an open calendar, and showing up. Every bit of it is copyable in an afternoon.' },

      { h2: 'Your 30-minute Explore setup' },
      { steps: [
        'Minutes 0–10 — Rewrite your title (specific, 30–60 chars) and description (150+ chars, ideally more). Add a meta description of 120–160 characters.',
        'Minutes 10–18 — Add a cover image, set a visible price, confirm the correct category, and add at least three real FAQs.',
        'Minutes 18–24 — Open real availability across the next seven days and save your calendar so it’s freshly dated. Set your service area on your profile.',
        'Minutes 24–30 — Finish KYC verification if you haven’t. Then set a recurring reminder to log in every couple of weeks, keep the calendar open, and never let a cancellation or a 45-day silence creep in.',
      ] },
      { p: 'That’s it. You won’t out-rank a host with fifty five-star reviews on day one — but you’ll clear every penalty, max out every lever you control, and start earning the history that carries the rest.' },

      { h2: 'Frequently asked questions' },
      { p: 'Can I pay to rank higher on Explore? No. The main Explore grid is ranked purely by quality score and search relevance. There’s no bid or boost that lifts you in it — which is exactly why doing the work pays off.' },
      { p: 'How fast do my changes take effect? Quickly. Your score is recomputed when your data changes — for example when a booking or review comes in — and the whole catalogue is re-swept once a week, so time-based factors like calendar freshness and activity stay current. Make a good edit and your ranking follows shortly after.' },
      { p: 'I’m brand new with no reviews. Am I stuck at the bottom? No. Reviews and booking history are a big part of the ceiling, but a new listing that nails listing quality, availability, reliability and verification clears every penalty and ranks on the strength of what it can control. That’s how you earn the first bookings that start the review flywheel.' },
      { p: 'Why did my ranking drop? The usual culprits are a calendar that ran empty (the biggest penalty), a stretch of inactivity, or a recent cancellation. Check those three first — they’re almost always the cause, and all three are fixable.' },
      { p: 'Does having more services help or hurt? Each service is ranked on its own. More services means more surface area in Explore, but only if each is genuinely complete. One finished, bookable service beats several half-filled ones every time.' },
      { p: 'Do I have to keep my price visible? To rank best, yes — a listed price (paid or free) scores better than a hidden one, and guests trust a number they can see. Free is a perfectly good price; hidden is the one that costs you.' },

      { h2: 'The bottom line' },
      { p: 'Explore ranking rewards exactly the things that make you a good host to book: a clear, complete listing; an open calendar; showing up; delivering; and earning reviews. There’s no trick, no fee, and no secret — just a score that adds up the quality you build and multiplies away the neglect you let slip in. Finish your listing, keep your calendar open, stay active, and let your delivered sessions do the compounding. Explore will meet you where you put in the work.' },
      { quote: 'Ranking on Explore is earned, not bought. Finish the listing, open the calendar, show up — the score does the rest.' },
    ],
  },
  {
    slug: 'digital-marketing-strategy-vibe-coders',
    title: 'Digital Marketing Strategy for Vibe Coders: How to Pay Down Distribution Debt',
    date: 'Jul 6, 2026',
    author: 'Bolt 958',
    readMins: 13,
    category: 'Guide',
    image: null,
    icons: ['chart', 'megaphone', 'target'],
    excerpt:
      'You didn’t ship a product — you took out a loan. Every app you build 10x faster accrues Distribution Debt. Here’s the framework, the channel logic, and a 30-day sprint to pay it down.',
    body: [
      { p: 'A digital marketing strategy for vibe coders starts with an uncomfortable reframe: you didn’t just ship a product, you took out a loan. Every app you build 10x faster accrues Distribution Debt — the widening gap between your build speed and your ability to get found. The interest compounds silently, then comes due when nobody shows up. Most vibe coders spend 40+ hours automating their product and under 4 on customer acquisition (VibeCom, 2026). This guide gives you the frameworks, the channel logic, and a 30-day sprint to pay that debt down.' },
      { p: 'Shipping is no longer the bottleneck. Getting found is.' },

      { h2: 'Why Can’t Vibe Coders Get Traction Anymore?' },
      { p: 'Vibe coders can’t get traction because two curves crossed in 2026 — and their tools only tell them about one of them.' },
      { p: 'The first curve fell off a cliff. The cost of building a functional SaaS dropped from roughly $200,000 to about $5,000, with timelines compressing from six months to six weeks (Keyhole Software, Q1 2026). The second curve went the other way: customer acquisition costs rose about 60% between 2021 and 2026 (VibeCom, May 2026). Building got cheap. Attention got expensive. Nobody sent you the second invoice.' },
      { p: 'That second invoice has a name. Borrow the industry’s favorite phrase — technical debt, the future cost of shipping code fast today — and apply it to growth. Distribution Debt is the accumulated cost of shipping a product faster than you can build an audience for it. Technical debt is covered exhaustively; a JetBrains-cited 2026 survey and Escape.tech’s scan of 1,400+ vibe-coded apps (65% with security issues) made sure of that. Distribution Debt is the debt nobody’s tracking — and it’s the one that actually kills products.' },
      { p: 'Here’s why it compounds. When everyone can ship, shipping stops being a signal. Apple took in 235,800 new app submissions in Q1 2026 alone, up 84% year over year (FindSkill.ai, April 2026). Your Lovable-built CRM now launches into a market with forty near-identical twins born the same week. The feature that would have earned attention in 2020 earns a shrug in 2026, because the scarce resource flipped from code to trust — and trust doesn’t respond to prompts.' },

      { h2: 'The Distribution Debt Curve' },
      { p: 'Picture two lines on the same chart. Build Capability shoots up almost vertically the day you adopt AI tools. Audience Capability — the number of people who know you exist and believe you — crawls upward, because it’s made of relationships, reputation, and search rankings that no tool can one-shot. The vertical gap between those two lines is your Distribution Debt, and it widens every time you ship without distributing.' },
      { info: { title: 'The Distribution Debt Curve', text: 'Build Capability shoots near-vertical after AI adoption. Audience Capability crawls upward slowly. The shaded gap between them is your Distribution Debt — and it widens every time you ship without distributing. Day 1 → Launch → Month 3 → Month 6: the gap only grows unless you actively service it.' } },
      { p: 'The founder pattern falls straight out of the curve. You ship a habit tracker in a weekend, post it once, get 30 visits, and conclude the product is weak — so you add features. Features live on the Build line. Your problem lives in the gap. You just serviced the wrong debt, and the interest kept running.' },

      { h2: 'What Actually Is a Marketing Strategy for Vibe Coders?' },
      { p: 'A marketing strategy for vibe coders is a debt-servicing schedule, not a campaign. It has exactly three moving parts, and the discipline that makes it work is one you already own.' },
      { p: 'You already run the loop. Every build follows the same cycle: describe → generate → review → refine → deploy. Marketing answers to the identical rhythm. This is the Ship-to-Signal Loop — the same five moves, pointed at humans instead of a compiler:' },
      { ol: [
        'DESCRIBE — who, where they already are, what they type when the pain hits, in their words not your feature names.',
        'GENERATE — the asset: a landing page, a comparison post, a demo, a free tool.',
        'REVIEW — against real signal: clicks, replies, signups. Not likes.',
        'REFINE — sharpen the angle the data pointed at.',
        'DEPLOY — publish, then repeat tomorrow.',
      ] },
      { p: 'The loop matters because it converts marketing from a vague obligation (“I should post more”) into an engineering task with a feedback signal — the exact shape of work vibe coders don’t avoid. Founders are already wiring this up: Forbes documented a LinkedIn growth coach who built a workflow in Claude Cowork mapping a year of her posts against which ones produced booked calls (Forbes, March 2026). That’s the Ship-to-Signal Loop, automated.' },
      { p: 'Set an interest rate, not a resolution. “Do more marketing someday” pays down nothing. A rule does: for every 3 hours on the Build line, 1 hour on the Audience line, from day one. A 3:1 ratio is livable. The 10:1 ratio most founders run is how Distribution Debt goes to collections.' },

      { h2: 'Turn the “vibe coded” stigma into a distribution asset' },
      { p: 'Here’s a counterintuitive move most founders get backwards. Because AI-generated products have a documented trust problem — Escape.tech found 58% of scanned vibe-coded apps carried at least one critical vulnerability (CSA Labs, March 2026) — buyers arrive skeptical. The instinct is to hide that you vibe coded it. The better play is to publish your diligence. A plain /security or /how-we-build page describing your review, testing, and secret-scanning process out-markets a feature page, because it addresses the exact objection your competitors are pretending doesn’t exist. Trust is a marketing asset now, and software scales faster than trust ever will.' },

      { h2: 'Which Channel Should You Actually Pick First?' },
      { p: 'Pick the one channel whose feedback loop matches your product’s discovery mode — searched-for, discovered, or demonstrated — and ignore the other five until it works. Spreading across channels is how solo founders convert a time shortage into six half-built ones.' },
      { p: 'And now the contrarian part, because the standard advice is wrong for most vibe coders:' },
      { p: 'Don’t start with SEO. It’s the strongest compounding channel and it’s the wrong first move, because it pays out in 6–12 weeks and you need signal in 6–12 days to stay sane and stay funded. Start SEO on day one; just don’t wait on it.' },
      { p: 'Don’t start with paid ads. Ads don’t create demand; they buy volume against a conversion rate you don’t know yet. Running ads pre-revenue is paying to learn what a free landing-page test teaches for nothing. Ads are an amplifier, and amplifying an unvalidated offer just makes the loss faster.' },

      { h2: 'The Vibe Coder’s Channel-Fit Matrix' },
      { table: {
        head: ['Channel', 'Time to Signal', 'Hours/Wk', 'Compounds?', 'Best For'],
        rows: [
          ['Launch platforms (PH, HN)', '1–7 days', '2–3', 'No', 'Novel, demo-able products'],
          ['Build in public (X, LinkedIn)', '2–4 weeks', '3–5', 'Partially', 'Solo founders, dev tools'],
          ['SEO + AEO', '6–12 weeks', '4–6', 'Yes (strongest)', 'Products people search for'],
          ['Free tool (eng-as-marketing)', '2–6 weeks', '1 build + 1', 'Yes', 'Any calculable pain'],
          ['Paid ads', '1–3 days', '2 + budget', 'No', 'Validated offer with known CAC'],
          ['Cold outreach', '1–2 weeks', '4–6', 'No', 'B2B, higher price points'],
        ],
      } },

      { h2: 'Optimize for the AI answer, not just the blue link' },
      { p: 'Your buyers increasingly find tools by asking ChatGPT, Perplexity, and Claude — which means answer engine optimization (AEO) and generative engine optimization (GEO) now sit alongside classic SEO. The practical translation: write self-contained, directly-answering pages an AI can lift verbatim — honest “X vs Y” comparisons, “best [tool] for [niche]” pages that name real competitors, and pricing an engine can quote. One founder in the Forbes piece built a semantic content-map generator tied to Ahrefs that surfaces topics rivals haven’t covered, tuned for how LLMs pick sources (Forbes, March 2026). You can vibe code the same asset in an afternoon — the rare case where your build speed is the marketing moat.' },

      { h2: 'Free tools: the one channel where vibe coders have an unfair advantage' },
      { p: 'Ship a small free tool that solves one slice of the customer’s problem. ALM Corp’s 2026 search-marketing guide flags interactive ROI calculators as among the highest-value B2B assets precisely because AI Overviews can’t replicate a working tool — they can only summarize a static page. A calculator, grader, or generator costs you one evening in Bolt or v0, ranks for “[problem] calculator,” and captures emails while you sleep. Every other founder treats tool-building as expensive. For you it’s a Tuesday.' },
      { p: 'Example — when personality is the channel: Book A Sloth, a niche booking product, is the archetype where build-in-public overdelivers. The name alone is a hook, every demo screenshot is inherently shareable, and a weekly “weirdest bookings this week” post markets the product without ever pitching it. Rule of thumb from the matrix: if your product has a personality, the personality is the channel; if it doesn’t, pick SEO and let the compounding do the talking.' },

      { h2: 'How Do You Pay Down Distribution Debt in 30 Days?' },
      { p: 'Spend 30 days proving one channel can produce signups — not “doing marketing.” Run it as the Debt-Payoff Sprint, structured as the Ship-to-Signal Loop stretched across a month.' },
      { steps: [
        'Days 1–5 — DESCRIBE. Write the positioning spec before any content: who exactly, where they already gather, what they search or ask an AI when the pain hits, and the vocabulary they use. One page. This is a PRD for demand, and skipping it is the single most common reason launches flop.',
        'Days 6–10 — GENERATE. Ship the minimum distribution surface: one landing page with one claim and one CTA, one comparison page against the incumbent, and five pieces of channel content drafted in your voice. Vibe code the assets.',
        'Days 11–25 — REVIEW & REFINE. Publish on your ONE chosen channel. Daily 30-minute loop: read the signal, reply to every comment, sharpen the angle. Kill nothing before day 25 — compounding channels look dead right up until they don’t.',
        'Days 26–30 — DEPLOY OR PIVOT. Decide on data. Signups, not likes: if the channel produced real signups, pour hours into it. If it produced nothing, switch channels, not products.',
      ] },
      { info: { title: 'The mistake that eats sprints', text: 'Over-automating before validating. Founders wire up a seven-tool lead pipeline before proving a single message converts. Build one connection, let it run two weeks, measure, then extend. Complexity before validation is just silent failure with more moving parts.' } },

      { h2: 'When Does Hiring a Marketing Agency Make Sense?' },
      { p: 'Hire help when you have a validated channel and no time — never before, because no agency can outsource your positioning. The honest sequence: prove one channel yourself (that’s how you learn what your market responds to), then hand off execution once each founder-hour is worth more spent on product or sales than on scheduling posts.' },

      { h2: 'The Agency-Readiness Scorecard' },
      { table: {
        head: ['Signal', 'Not Ready (DIY)', 'Ready to Hire'],
        rows: [
          ['Channel proof', 'No channel has produced signups yet', 'At least one channel reliably converts'],
          ['Bottleneck', 'You don’t know what works', 'You know what works but can’t scale it alone'],
          ['Data', 'No usage or conversion data', 'Real numbers an agency can optimize against'],
          ['Skill floor', 'Task is learnable in a week', 'Task needs technical SEO, paid, or AEO depth'],
          ['Runway', 'Every hour is survival', 'Founder-hours are worth more elsewhere'],
        ],
      } },
      { p: 'Three or more boxes on the right, it’s time. Mostly on the left, an agency will bill you to discover what you should have learned for free.' },
      { p: 'Even Karpathy’s own arc rhymes with this. A year after coining “vibe coding,” he’d moved to advocating structured, reviewed, agent-driven engineering (Taskade, March 2026). Improvised distribution gets you signal. Systematized distribution gets you a business.' },

      { h2: 'Frequently Asked Questions' },

      { h2: 'What is distribution debt in vibe coding?' },
      { p: 'Distribution Debt is the accumulated cost of shipping a product faster than you can build an audience for it. AI collapsed build time while acquisition costs rose ~60% since 2021 (VibeCom, 2026), so every fast launch widens the gap between what you’ve built and who knows it exists. Like technical debt, the interest compounds until you service it.' },

      { h2: 'Can you do marketing with vibe coding tools?' },
      { p: 'Yes. Vibe coding tools build most core marketing assets — landing pages, ROI calculators, email workflows, comparison pages, dashboards. Forbes documented founders building full content-analysis and lead-enrichment systems this way in March 2026. The tools handle the assets; you still supply positioning, judgment, and consistency.' },

      { h2: 'What is the biggest marketing mistake vibe coders make?' },
      { p: 'Servicing the wrong debt. Founders answer weak traction by adding features, but features sit on the Build line while the problem sits in the distribution gap. The documented pattern is 40+ hours on the product versus under 4 on acquisition (VibeCom, 2026) — a 10:1 imbalance that guarantees the debt compounds.' },

      { h2: 'How long before SEO works for a vibe-coded product?' },
      { p: 'Expect 6–12 weeks before meaningful organic signal, longer in competitive niches. That’s why SEO shouldn’t be your first channel even though it’s your strongest — pair it with a fast-signal channel like a launch platform so you get feedback while SEO compounds in the background.' },

      { h2: 'Should I mention my app is vibe coded?' },
      { p: 'Yes, paired with proof of diligence. Escape.tech found 58% of scanned vibe-coded apps carried a critical vulnerability (CSA Labs, 2026), so buyers are wary. Publishing your review, testing, and security process turns “vibe coded” from a red flag into a transparency signal your competitors won’t match.' },

      { h2: 'Is build-in-public dead in 2026?' },
      { p: 'No, but launch-announcement posting is. Feeds are saturated with “shipped in 2 hours” content. What still earns attention is specific, honest process-sharing — real numbers, failed experiments, weird user stories — because specificity is the one thing AI-generated feed content can’t fake well.' },

      { h2: 'Do I need a marketing budget to start?' },
      { p: 'No. Launch platforms, build-in-public, SEO, and free-tool marketing cost time, not money. Paid ads only make sense once you know your conversion rate and can calculate an acceptable acquisition cost — spending before that is paying to guess.' },

      { h2: 'Service the Debt Before It Collects' },
      { p: 'The mental model to keep: you don’t have a marketing problem, you have a Distribution Debt problem — and debt responds to schedules, not bursts of motivation. AI handed you a near-vertical Build line and left your Audience line crawling. The gap between them is the whole game now, and it closes exactly one way: run the Ship-to-Signal Loop on one channel from the Channel-Fit Matrix, at a 3:1 hours ratio, starting the day you ship — not the day you panic.' },
      { p: 'The founders winning in 2026 aren’t shipping better apps. They’re the ones who realized the code was never the moat.' },
      { quote: 'AI writes the software. You still have to write the reason anyone shows up.' },
      { p: 'Next step: run the Debt-Payoff Sprint on your current product. Day 1 is the positioning spec — one page, tonight.' },
    ],
  },
  {
    slug: 'building-in-public-why-we-blog',
    title: 'Building in public: why we’re writing this down',
    date: 'Jun 28, 2026',
    author: 'Bolt 958',
    icons: ['code', 'palette', 'star'],
    readMins: 3,
    category: 'Internal',
    image: null,
    excerpt:
      'We’re building a 0% commission booking platform in the open. Here’s why we’re sharing the messy middle, not just the launch.',
    body: [
      { p: 'Most product stories you read are written after the fact, once everything worked out and the rough edges have been sanded off. We wanted to do the opposite — write things down while they’re still in motion.' },
      { p: 'Book A Sloth is a place for creators and professionals to get booked and get paid, at 0% commission. That promise is simple to say and hard to keep, and the only way we know how to keep it honest is to show our work.' },
      { h2: 'What you’ll find here' },
      { ul: [
        'Build logs — what we shipped, what broke, what we learned.',
        'Product thinking — why a feature exists and what we said no to.',
        'Engineering notes — the unglamorous infrastructure that keeps payments and calendars reliable.',
      ] },
      { p: 'This first batch of posts is a catch-up: a look back at how we got from an empty repo to a live product handling real bookings. From here on, we write as we go.' },
      { quote: 'Ship, write it down, repeat.', cite: 'Our operating loop' },
    ],
  },
  {
    slug: 'zero-commission-bet',
    title: 'The 0% commission bet',
    date: 'Jun 26, 2026',
    icons: ['money', 'target', 'users'],
    author: 'Bolt 958',
    readMins: 4,
    category: 'Growth',
    image: null,
    excerpt:
      'Every booking platform takes a cut. We decided not to. Here’s the reasoning — and how the math actually works.',
    body: [
      { p: 'When you sell a session through most booking tools, the platform quietly keeps a slice — often 10% to 20%. For a creator running on thin margins, that slice is the difference between a side project and a living.' },
      { p: 'We took the other side of that bet: hosts keep 100% of what they earn on their sessions. We make money on subscriptions and add-ons, not by standing between a creator and their customer.' },
      { h2: 'Doesn’t that leave money on the table?' },
      { p: 'In the short term, yes. In the long term, we think a platform that’s aligned with its hosts grows faster than one that taxes them. When you win because they win, you build very different software.' },
      { ul: [
        'Hosts keep their full session price.',
        'Payments settle straight to verified hosts with GST-ready invoices.',
        'Our revenue comes from optional plans, not a per-booking cut.',
      ] },
      { info: { title: 'The simple test', text: 'If a feature only makes money by costing the host money, it doesn’t ship. That single rule kills a lot of tempting ideas — on purpose.' } },
      { p: 'It’s a constraint we put on ourselves on purpose. It shapes every pricing decision we make.' },
    ],
  },
  {
    slug: 'payments-and-calendars-on-autopilot',
    title: 'Payments and calendars, on autopilot',
    date: 'Jun 22, 2026',
    icons: ['money', 'calendar', 'shield'],
    author: 'Bolt 958',
    readMins: 5,
    category: 'Engineering',
    image: null,
    excerpt:
      'Two systems make or break a booking product: taking money safely and never double-booking. Here’s how we wired them.',
    body: [
      { p: 'A booking platform lives or dies on two boring-sounding things: money has to move correctly, and two people must never end up in the same slot. Get either wrong and trust evaporates.' },
      { h2: 'Money that moves correctly' },
      { p: 'Payments run through Razorpay — cards, UPI and netbanking at checkout, with auto-renewing subscriptions for hosts on paid plans. Every successful payment is reconciled against a webhook, so a flaky network on the customer’s phone can’t leave an order in limbo.' },
      { steps: [
        'A guest pays at checkout — the order is created and held.',
        'Razorpay confirms the payment over a signed webhook.',
        'We reconcile the webhook against the order before anything is marked paid.',
        'The booking, invoice and notifications fire only once money is real.',
      ] },
      { h2: 'Calendars that never collide' },
      { p: 'Connect Google Calendar once and your busy times are blocked automatically. Every online session gets a Google Meet link generated for it. The availability a guest sees is the truth, not a stale snapshot.' },
      { quote: 'Reliability isn’t a feature you add later. It’s the floor you build on.', cite: 'Engineering principle' },
    ],
  },
  {
    slug: 'booking-in-under-a-minute',
    title: 'Designing a booking flow guests breeze through',
    date: 'Jun 18, 2026',
    icons: ['calendar', 'lightning', 'users'],
    author: 'Bolt 958',
    readMins: 4,
    category: 'Product',
    image: null,
    excerpt:
      'The fastest booking is the one a guest doesn’t have to think about. How we cut friction down to a phone number.',
    body: [
      { p: 'Every extra step in a booking flow costs you customers. So we kept asking one question: can we remove this?' },
      { h2: 'No account required' },
      { p: 'Guests don’t register. They pick a slot, enter their phone number, confirm with a one-time WhatsApp code, and pay. An account is created quietly in the background — they never fill out a form.' },
      { ol: [
        'High-quality visuals and a clean layout set the tone before the first tap.',
        'Real-time availability means guests only ever see slots that are actually open.',
        'A WhatsApp one-time code verifies them in seconds — no password to invent.',
      ] },
      { p: 'The result is a flow that feels less like filling out paperwork and more like sending a message.' },
      { info: { title: 'Why WhatsApp codes', text: 'In India, WhatsApp is where verification already lives. Meeting guests where they are beats teaching them a new habit at the worst possible moment — checkout.' } },
    ],
  },
  {
    slug: 'onboarding-a-host-in-60-seconds',
    title: 'From sign-up to live in 60 seconds',
    date: 'Jun 24, 2026',
    icons: ['rocket', 'users', 'lightning'],
    author: 'Bolt 958',
    readMins: 4,
    category: 'Feature Update',
    image: null,
    excerpt:
      'We rebuilt host onboarding around a single Google tap — no passwords to invent, no setup maze.',
    body: [
      { p: 'The first five minutes decide whether a new host ever publishes a page. Our old flow asked for too much, too soon. So we tore it down and started from a single tap.' },
      { h2: 'Google-first' },
      { p: 'One tap connects a host’s identity, calendar and Meet links at once — no passwords to invent, no separate calendar-connect step buried in settings later.' },
      { steps: [
        'Tap “Continue with Google” — identity, calendar and Meet connect together.',
        'Claim your booking link, bookasloth.com/yourname, and keep it forever.',
        'Add one service with a price and duration.',
        'Go live and share your link.',
      ] },
      { p: 'Even if you change your handle later, old links keep redirecting, so you never lose a booking.' },
      { quote: 'Onboarding should feel like an open door, not an obstacle course.', cite: 'Product principle' },
    ],
  },
  {
    slug: 'notifications-that-actually-arrive',
    title: 'Notifications that actually arrive',
    icons: ['bell', 'server', 'shield'],
    date: 'Jun 14, 2026',
    author: 'Bolt 958',
    readMins: 4,
    category: 'Engineering',
    image: null,
    excerpt:
      'A confirmation that never lands is worse than no confirmation. How we built a notification engine we trust.',
    body: [
      { p: 'A booking confirmation that silently fails to send is one of the fastest ways to lose someone’s trust. So notifications got their own engine instead of being an afterthought bolted onto each feature.' },
      { h2: 'Queued, retried, logged' },
      { p: 'Booking confirmations and reminders go out over email and WhatsApp through a single pipeline. Every message is queued, retried on failure, and logged — so when something does go wrong, we can see exactly what happened.' },
      { ul: [
        'One engine for every transactional message, not scattered send calls.',
        'Automatic retries so a momentary provider hiccup doesn’t drop a message.',
        'A full log of what was sent, when, and to whom.',
      ] },
      { info: { title: 'Sent ≠ delivered', text: 'We learned the hard way that a provider accepting a message isn’t the same as it landing. The log tracks both, so “it said it sent” is never the end of the investigation.' } },
      { p: 'Boring infrastructure, but it’s the kind of boring that lets people sleep.' },
    ],
  },
  {
    slug: 'the-first-booking',
    title: 'The First Booking',
    date: 'May 8, 2026',
    icons: ['calendar', 'star', 'users'],
    author: 'Bolt 958',
    readMins: 6,
    category: 'Product',
    image: null,
    excerpt:
      'The first thing every creator wants to do is simple: publish a service and start accepting bookings. We decided that should take minutes, not an afternoon.',
    body: [
      { h2: 'Every booking starts with one question.' },
      { p: '"What do you offer?"' },
      { p: 'Sounds simple. But most booking tools make you answer twenty more questions before anyone can book you. Templates. Availability rules. Meeting apps. Payment gateways. Time zones. Confirmation emails. Custom forms. Before long, you\'re configuring software instead of growing your business. We wanted to flip that around.' },
      { h2: 'A service should be as easy as writing a social media post.' },
      { p: 'When you create a service in Book A Sloth, you\'re really answering just a few questions.' },
      { table: { head: ['You Tell Us', 'We Handle'], rows: [['Service name', 'Booking page'], ['Price', 'Payment flow'], ['Duration', 'Calendar availability'], ['Description', 'Public presentation'], ['Meeting type', 'Delivery experience']] } },
      { p: 'The goal isn\'t fewer features. The goal is fewer decisions.' },
      { quote: 'Software shouldn\'t ask you everything it can know. It should only ask what it needs to know.' },
      { h2: 'Built for real businesses.' },
      { p: 'Not everyone sells a one-hour consultation. Some people teach yoga. Others shoot weddings. Some repair laptops. Others tutor students. One platform has to work for all of them. Here\'s what we\'re designing for.' },
      { table: { head: ['Profession', 'Example Service'], rows: [['Coach', '1:1 Coaching Session'], ['Tutor', 'Mathematics Class'], ['Photographer', 'Couple Photoshoot'], ['Salon', 'Haircut & Styling'], ['Doctor', 'General Consultation'], ['Designer', 'Brand Strategy Call'], ['Lawyer', 'Legal Consultation'], ['Fitness Trainer', 'Personal Training Session']] } },
      { p: 'Different businesses. One booking experience.' },
      { h2: 'Every service deserves its own home.' },
      { p: 'Imagine sharing a single link. Instead of saying "Message me for availability," your customer sees:' },
      { ul: ['What you offer', 'How much it costs', 'How long it takes', 'Available dates', 'Instant booking'] },
      { p: 'No waiting. No back-and-forth. No awkward follow-up messages.' },
      { h2: 'Behind the scenes' },
      { p: 'While you\'re creating your service, Book A Sloth is quietly preparing everything else.' },
      { ul: ['Public booking page', 'Search-friendly URL', 'Calendar compatibility', 'Future payment support', 'Reminder workflow', 'Booking records'] },
      { p: 'The setup stays simple because the heavy lifting happens behind the curtain.' },
      { h2: 'Designing for clarity' },
      { p: 'We removed a surprising amount before adding anything. Instead of overwhelming forms, we\'re focusing on:' },
      { ul: ['Clear typography', 'Large tap targets', 'Mobile-first layouts', 'Friendly language', 'Sensible defaults', 'Fast loading pages'] },
      { p: 'Every screen has one job. Every button has one purpose.' },
      { quote: 'The best interface is the one your customer barely notices.' },
      { h2: 'Where we\'re headed' },
      { p: 'Publishing a service is only the beginning. Soon, every service will support:' },
      { table: { head: ['Coming Soon', 'Why It Matters'], rows: [['Online payments', 'Get paid before the session'], ['Google Calendar sync', 'Avoid double bookings'], ['Google Meet links', 'Automatic online meetings'], ['WhatsApp reminders', 'Fewer no-shows'], ['Reviews', 'Build trust with every booking'], ['Digital products', 'Sell beyond your time']] } },
      { p: 'One service. An entire business behind it.' },
      { h2: 'One step closer' },
      { p: 'This week was all about laying the foundation. Because before payments, before calendars, before notifications, you need something worth booking. That starts with your very first service.' },
      { p: 'Next week, we\'ll dive into something just as important: why accepting payments wasn\'t an add-on. It was one of the first things we built.' },
    ],
  },
  {
    slug: 'hello-world',
    title: 'Hello, World. We\'re Building Book A Sloth.',
    icons: ['rocket', 'code', 'star'],
    date: 'May 1, 2026',
    author: 'Bolt 958',
    readMins: 5,
    category: 'News',
    image: null,
    excerpt:
      'Every great product starts with a problem. Ours started with a calendar full of screenshots, WhatsApp messages, and "Is 5 PM available?"',
    body: [
      { h2: 'Before we wrote a single line of code' },
      { p: '...we asked one question.' },
      { p: 'Why is booking someone\'s time still so complicated?' },
      { p: 'A freelancer jumps between WhatsApp and Google Calendar. A coach manually sends payment links. A photographer confirms appointments through Instagram DMs. A doctor maintains three different diaries. A consultant copies Zoom links into emails.' },
      { p: 'Everyone has built their own system. Almost nobody enjoys using it.' },
      { h2: 'The problem wasn\'t a lack of software' },
      { p: 'It was too much software.' },
      { table: { head: ['Need', 'Usually Requires'], rows: [
        ['Accept bookings', 'One app'],
        ['Collect payments', 'Another app'],
        ['Block calendar', 'Google Calendar'],
        ['Video meetings', 'Google Meet or Zoom'],
        ['Send reminders', 'WhatsApp or Email'],
        ['Track customers', 'Spreadsheet or CRM'],
        ['Manage everything', 'Your brain 🧠'],
      ] } },
      { p: 'By the end of the day, you\'re not running your business. You\'re managing your tools.' },
      { quote: 'Your job is to serve people. Our job is to make booking disappear into the background.' },
      { h2: 'That\'s why we\'re building Book A Sloth' },
      { p: 'Not another productivity app. Not another calendar. Not another CRM. A place where your business simply works.' },
      { p: 'Imagine sharing one link. Your customer picks a time. Pays online. Receives confirmations. Gets reminders. Joins the meeting. Leaves a review. And you never had to chase them once. That\'s the experience we\'re chasing.' },
      { h2: 'What we\'re building' },
      { p: 'Over the next few months, Book A Sloth will grow into a complete booking platform.' },
      { table: { head: ['Planned Feature', 'Status'], rows: [
        ['Beautiful Booking Pages', '🛠️ Building'],
        ['Online Payments', '🛠️ Building'],
        ['Google Calendar Sync', '🛠️ Building'],
        ['Google Meet Integration', '🛠️ Building'],
        ['WhatsApp Notifications', '🛠️ Building'],
        ['Reviews & Ratings', '🛠️ Building'],
        ['Digital Products', '📍 Planned'],
        ['Analytics Dashboard', '📍 Planned'],
      ] } },
      { h2: 'Why "Sloth"?' },
      { p: 'People ask us this a lot. The answer surprises them. The sloth isn\'t slow because it\'s lazy. It\'s deliberate. It wastes almost no energy. Every movement has a purpose.' },
      { p: 'That\'s the philosophy we want for business software. Not more dashboards. Not more notifications. Not more complexity. Just thoughtful software that gets out of your way.' },
      { h2: 'Building in Public' },
      { p: 'Every Friday, we\'ll publish what changed. Sometimes it\'ll be a shiny new feature. Sometimes it\'ll be a bug that taught us something. Sometimes it\'ll be a complete redesign because we got it wrong the first time.' },
      { p: 'You\'ll see the wins. You\'ll also see the rewrites. Because that\'s what building software actually looks like.' },
      { quote: 'Help creators, professionals and small businesses spend less time managing bookings, and more time doing the work they love.', cite: 'Our North Star' },
      { h2: 'What\'s Next?' },
      { p: 'Next week, we\'ll share the first major milestone: how we\'re building services that take less than five minutes to publish. The journey starts here. Welcome aboard. 🦥' },
    ],
  },
  {
    slug: 'going-live',
    title: 'Book A Sloth goes live',
    icons: ['rocket', 'lightning', 'megaphone'],
    date: 'Jun 19, 2026',
    author: 'Bolt 958',
    readMins: 3,
    category: 'News',
    image: null,
    excerpt:
      'The day the “coming soon” came down. What launch day actually looked like behind the scenes.',
    body: [
      { p: 'On June 19th we flipped the switch. Payments, calendars and notifications all running on hardened, monitored infrastructure — and a “coming soon” that finally came down.' },
      { h2: 'What launch really means' },
      { p: 'Launch day isn’t fireworks. It’s automated backups running on schedule, error tracking watching every request, and a documented deploy pipeline so a fix can ship in minutes instead of hours.' },
      { ul: [
        'Production payments, calendars and notifications, live.',
        'Automated backups and error tracking from day one.',
        'A repeatable deploy pipeline so shipping stays safe.',
      ] },
      { p: 'If you’re reading this early — thank you for being here. The product you see today is the worst it will ever be. The best is still ahead.' },
      { quote: 'Hello, Book A Sloth. 🦥', cite: 'Day one' },
    ],
  },
];

export const getPost = (slug) => BLOG_POSTS.find((p) => p.slug === slug);

export default BLOG_POSTS;

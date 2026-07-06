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

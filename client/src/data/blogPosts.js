// Static blog content. No DB / no server yet — posts are authored here as data
// and rendered by pages/Blog.jsx (index) + pages/BlogPost.jsx (detail).
// When the real blog CMS lands, this file is the single thing to replace.
//
// Each post:
//   slug        — URL segment (/blog/:slug). Must be unique + URL-safe.
//   title       — headline
//   date        — display string (also sort order, newest first below)
//   author      — byline
//   readMins    — rough read time, shown on cards
//   tag         — single category chip (Build log / Product / Engineering / Story)
//   excerpt     — 1–2 line summary for the index card + post hero subtitle
//   color       — hero band theme key. One of the About-hero palette:
//                 blue | orange | pink | green | yellow | black | white
//   bottomColor — bottom CTA band theme key (pick a DIFFERENT colour to hero)
//   body        — array of blocks. Supported renderers (see BlogPost.jsx):
//                 { p }                        paragraph
//                 { h2 }                       section heading
//                 { ul: [..] }                 bullet list
//                 { ol: [..] }                 decimal numbered list
//                 { steps: [..] }              01/02 mono-indexed steps
//                 { quote, cite? }             pull-quote + optional attribution
//                 { info: { title, text } }    callout box
//
// Posts are listed newest-first; keep that order when adding.

export const BLOG_POSTS = [
  {
    slug: 'building-in-public-why-we-blog',
    title: 'Building in public: why we’re writing this down',
    date: 'Jun 28, 2026',
    author: 'Bolt 958',
    readMins: 3,
    tag: 'Story',
    color: 'orange',
    bottomColor: 'black',
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
    author: 'Bolt 958',
    readMins: 4,
    tag: 'Story',
    color: 'green',
    bottomColor: 'orange',
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
    author: 'Bolt 958',
    readMins: 5,
    tag: 'Engineering',
    color: 'blue',
    bottomColor: 'pink',
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
    author: 'Bolt 958',
    readMins: 4,
    tag: 'Product',
    color: 'pink',
    bottomColor: 'blue',
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
    author: 'Bolt 958',
    readMins: 4,
    tag: 'Product',
    color: 'yellow',
    bottomColor: 'green',
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
    date: 'Jun 14, 2026',
    author: 'Bolt 958',
    readMins: 4,
    tag: 'Engineering',
    color: 'black',
    bottomColor: 'orange',
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
    slug: 'going-live',
    title: 'Book A Sloth goes live',
    date: 'Jun 19, 2026',
    author: 'Bolt 958',
    readMins: 3,
    tag: 'Build log',
    color: 'orange',
    bottomColor: 'blue',
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

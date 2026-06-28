// All About-page copy + data. Round-2: replace placeholders / [bracketed] values + wire real photos.
// Swappable image/data slots are marked with a `swap` field rendered as data-swap="…".
// Find them all: grep -r 'data-swap' client/src/components/about

// Public company-assets bucket base for About-page imagery.
export const ABOUT_ASSETS = "https://company-assets.bookasloth.in/images/about";

export const hero = {
  leadPre: "Built for people who'd rather",
  // Typewriter cycles these one word at a time (type → hold → erase).
  typeWords: ["Create.", "Teach.", "Heal.", "Coach.", "Perform."],
  leadPost: "than chase bookings.",
  sub: "Book A Sloth helps creators publish their services, get booked, and get paid — without chasing DMs or losing a cut to commission.",
  ctaPrimary: "Let's Get Started",
  ctaGhost: "See how it works",
  image: `${ABOUT_ASSETS}/book-a-sloth-about-hero.png`,
};

export const problem = {
  heading: "Getting booked shouldn't feel like a second job.",
  rows: [
    { pain: 'Endless "what time works?" DMs', fix: "One link. They pick. Done." },
    { pain: "Platforms taking a cut of every booking", fix: "0% commission. You keep it all." },
    { pain: "No-shows and forgotten sessions", fix: "Auto reminders + paid-upfront options." },
    { pain: "Your audience locked inside someone else's app", fix: "Your page, your customers, your data." },
  ],
};

export const beliefs = {
  heading: "What we believe.",
  items: [
    { title: "Time should never be wasted.", body: "Every tap removed is a minute given back." },
    { title: "Software should simplify, not complicate.", body: "If it needs a tutorial, we failed." },
    { title: "Creators should own their audience.", body: "Your customers are yours. Always." },
    { title: "Automation should feel invisible.", body: "The best tool is the one you forget is there." },
    { title: "Calm beats hustle.", body: "Work slower. Earn smarter." },
    { title: "You keep what you earn.", body: "0% commission. Your money is yours." },
  ],
};

export const behind = {
  heading: "Made by people who hate busywork as much as you do.",
  sub: "No stock photos. Real workspace, real process — swap these for the real thing soon.",
  tiles: [
    { caption: "Whiteboard sessions", swap: "behind-1" },
    { caption: "Real support", swap: "behind-2" },
    { caption: "Shipping weekly", swap: "behind-3" },
  ],
};

// HONEST framing only — no invented customer counts. [bracketed] values swap with real data round-2.
export const stats = {
  heading: "The calm, by the numbers.",
  items: [
    { value: 0, suffix: "%", label: "commission, ever" },
    { value: "99.9", suffix: "%", label: "uptime" },
    { value: 24, prefix: "<", suffix: "h", label: "support response", swap: "stat-support" },
    { value: 1, suffix: "+", label: "countries ready", swap: "stat-countries" },
    { value: 1, suffix: "", label: "years building", swap: "stat-years" },
  ],
};

// Order is intentional (3 across, 2 rows):
//   Durga · Happy · Mohini  /  Sujata · Aastha · Shubham
// Photos live in company-assets/images/about. Shubham has no photo yet → fallback initials.
// Socials: linkedin + facebook + sloth (their Book A Sloth page). Swap "#" hrefs for real ones.
export const team = {
  heading: "The people behind Book A Sloth.",
  sub: "A small team that sweats the calm so you don't have to.",
  members: [
    {
      name: "Durga Laxne",
      role: "Marketing",
      photo: `${ABOUT_ASSETS}/durga-laxne.jpg`,
      bio: "Tells the Book A Sloth story so the right creators find us — and feel calmer the moment they land.",
      socials: [{ type: "linkedin", href: "#" }, { type: "facebook", href: "#" }, { type: "sloth", href: "#" }],
    },
    {
      name: "Happy Singh",
      role: "Content",
      photo: `${ABOUT_ASSETS}/happy-singh.jpg`,
      bio: "Turns the product into words people actually enjoy reading. Believes good content respects your time.",
      socials: [{ type: "linkedin", href: "#" }, { type: "facebook", href: "#" }, { type: "sloth", href: "#" }],
    },
    {
      name: "Mohini Daf",
      role: "Automation",
      photo: `${ABOUT_ASSETS}/mohini-daf.jpg`,
      bio: "Makes the boring parts vanish. If a task can run itself, she's probably already automated it.",
      socials: [{ type: "linkedin", href: "#" }, { type: "facebook", href: "#" }, { type: "sloth", href: "#" }],
    },
    {
      name: "Sujata Mishra",
      role: "Operations",
      photo: `${ABOUT_ASSETS}/sujata-mishra.jpg`,
      bio: "Keeps the whole machine humming behind the scenes so nothing — and no one — slips through the cracks.",
      socials: [{ type: "linkedin", href: "#" }, { type: "facebook", href: "#" }, { type: "sloth", href: "#" }],
    },
    {
      name: "Aastha Nikhare",
      role: "Product",
      photo: `${ABOUT_ASSETS}/aastha-nikhare.jpg`,
      bio: "Obsesses over every tap so you never have to think twice. Removes friction for a living.",
      socials: [{ type: "linkedin", href: "#" }, { type: "facebook", href: "#" }, { type: "sloth", href: "#" }],
    },
    {
      name: "Shubham",
      role: "Engineering",
      photo: "",
      bio: "Builds the calm under the hood — fast, reliable, and quietly out of your way.",
      socials: [{ type: "linkedin", href: "#" }, { type: "facebook", href: "#" }, { type: "sloth", href: "#" }],
    },
  ],
};

export const build = {
  heading: "How we build.",
  steps: [
    { title: "Listen", body: "Talk to creators. A lot." },
    { title: "Research", body: "Find the real friction." },
    { title: "Prototype", body: "Make it real fast." },
    { title: "Build", body: "Ship it small." },
    { title: "Launch", body: "Put it in your hands." },
    { title: "Improve", body: "Then do it again." },
  ],
};

export const trust = {
  heading: "Built to be trusted.",
  cards: [
    { title: "Encrypted by default", body: "Your data is protected in transit and at rest." },
    { title: "Payments you can trust", body: "Razorpay-secured. Money handled right." },
    { title: "Always backed up", body: "Regular backups. Nothing lost." },
    { title: "Privacy-first", body: "We never sell your data. Export anytime." },
  ],
};

export const faq = {
  heading: "Questions, answered.",
  items: [
    { q: "Who are you?", a: "A small team building the calmest way for creators to get booked and paid. [Swap with real team note round-2.]" },
    { q: "Where are you based?", a: "[Placeholder — add real HQ/location round-2.]" },
    { q: "How do you handle my data?", a: "Encrypted in transit and at rest, never sold, and exportable anytime." },
    { q: "Can I export everything?", a: "Yes. Your bookings and customer data are yours to take with you." },
    { q: "How fast is support?", a: "We aim to reply within a day. [Swap with real SLA round-2.]" },
    { q: "How often do you ship updates?", a: "Constantly — small improvements land every week." },
  ],
};

export const finalCta = {
  heading: "Your calmer booking business starts today.",
  sub: "Set up your page in minutes. Keep 100% of what you earn.",
  ctaPrimary: "Let's Get Started",
};

// Reused verbatim from homepage TESTIMONIALS (Home.jsx). Round-2: de-dup into a shared module.
export const testimonials = {
  heading: "Loved by the people who use it.",
  items: [
    { quote: "Half my day used to go in 'is a cabin free at 4?' WhatsApps. Now people just book it themselves.", name: "Mukesh Tidke", role: "Coworking Space Owner", avatar: "https://company-assets.bookasloth.in/images/testimonials/mukesh-tidke.jpg" },
    { quote: "Clients book site-visit slots straight off my link and pay upfront. No more chasing dates over WhatsApp.", name: "Ar. Pranav Kadoo", role: "Architect", avatar: "https://company-assets.bookasloth.in/images/testimonials/pranav-kadoo.jpg" },
    { quote: "I send the link, they pick a slot, payment's sorted before the call. No more awkward money talk.", name: "Vishal Chaware", role: "Salesforce Developer", avatar: "https://company-assets.bookasloth.in/images/testimonials/vishal-chaware.jpg" },
    { quote: "Set up my weekend mentoring in one evening and kind of forgot about it. Slots fill, money's already in.", name: "Sangharata Somkuvar", role: "DevOps Engineer", avatar: "https://company-assets.bookasloth.in/images/testimonials/sangharata-somkuvar.jpg" },
    { quote: "My patients forget appointments easily. The reminder texts have honestly been a lifesaver.", name: "Dr. Yukta Bawankar", role: "Physiotherapist", avatar: "https://company-assets.bookasloth.in/images/testimonials/yukta-bawankar.jpg" },
    { quote: "Stuck the link in my Insta bio. Looks way better than sending a GPay QR after the call.", name: "Happy Singh", role: "Creative Lead", avatar: "https://company-assets.bookasloth.in/images/testimonials/happy-singh.jpg" },
    { quote: "Honestly I picked it because 0% commission. I charge for audits and Sloth doesn't take a cut.", name: "Arjun Ravikumar", role: "Performance Marketeer", avatar: "https://company-assets.bookasloth.in/images/testimonials/arjun-ravikumar.jpg" },
    { quote: "I run mentoring calls on the side — slots fill, payment's sorted, zero admin after work hours.", name: "Tushar Malvi", role: "Management Trainee, ECL", avatar: "https://company-assets.bookasloth.in/images/testimonials/tushar-malvi.jpg" },
  ],
};

// Shared CTA destination — matches homepage ROUTE_START.
export const ROUTE_START = "/be-a-sloth";

// ── New rebuild sections (2026-06-26). [TBD] assets marked data-swap. ──

// Section 2 — logo marquee. Placeholder names until real customer logos land.
export const logos = {
  eyebrow: "Trusted by calm professionals",
  row1: [
    { name: "Acme", swap: "logo-1" },
    { name: "Northwind", swap: "logo-2" },
    { name: "Globex", swap: "logo-3" },
    { name: "Umbra", swap: "logo-4" },
    { name: "Initech", swap: "logo-5" },
    { name: "Hooli", swap: "logo-6" },
  ],
  row2: [
    { name: "Soylent", swap: "logo-7" },
    { name: "Vehement", swap: "logo-8" },
    { name: "Massive", swap: "logo-9" },
    { name: "Pied Piper", swap: "logo-10" },
    { name: "Stark", swap: "logo-11" },
    { name: "Wayne", swap: "logo-12" },
  ],
};

// Section 3 — join / recruiting split (30/70). [COPY + IMAGE TBD]
export const join = {
  heading: "Join our team",
  body: "We're a small team building the calm way to get booked. Come build it with us.",
  cta: "Join the moment",
  href: "/careers",
  imageSwap: "join-hero",
};

// Section 4 — stacking cards. Big feature card + 4 sticky-stacking cards.
export const stackCards = {
  heading: "Everything you need. Nothing you don't.",
  feature: {
    title: "One calm link does the whole job.",
    body: "Publish your services, share one link, and let bookings, payments and reminders run themselves.",
    swap: "stack-feature",
  },
  cards: [
    { title: "Get booked", body: "Your page is live 24/7. Clients book while you sleep.", more: "Personal booking page, availability rules and two-way calendar sync — all in one place.", swap: "stack-1" },
    { title: "Get paid", body: "Money in before the session. No invoicing, no chasing.", more: "Razorpay UPI, cards and netbanking. Advance or full payment. Auto GST invoices.", swap: "stack-2" },
    { title: "Stay organized", body: "Every client, booking and rupee in one place.", more: "Client history, private notes, and bookings & revenue reports — zero spreadsheets.", swap: "stack-3" },
    { title: "Reduce no-shows", body: "Gentle reminders go out automatically.", more: "Email + WhatsApp reminders, instant confirmations and post-session follow-ups.", swap: "stack-4" },
  ],
};

// Section 5 — case studies asymmetric grid (top 70/30, bottom 30/30/30). [TBD]
export const caseStudies = {
  heading: "Stories from the calm.",
  tiles: [
    { title: "Coworking space cut no-shows", blurb: "Members book cabins themselves now.", swap: "case-1" },
    { title: "Clinic stopped chasing", blurb: "Patients pay upfront and turn up.", swap: "case-2" },
    { title: "Mentor on autopilot", blurb: "Weekend slots fill, money's in.", swap: "case-3" },
    { title: "GST season, sane", blurb: "Clients book instead of calling.", swap: "case-4" },
    { title: "One link in bio", blurb: "Looks better than a GPay QR.", swap: "case-5" },
  ],
};

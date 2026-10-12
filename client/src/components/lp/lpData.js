/* ════════════════════════════════════════════════════════════════════
   lpData.js — single source of placeholder content for
   /compare/topmate-alternative (Topmate-style rebuild).

   PROFILES + COHORTS use testimonial avatars as PLACEHOLDERS. Swap the
   `img` / names here in ONE place when real creator profiles are chosen.
   ════════════════════════════════════════════════════════════════════ */

const CDN = "/images/testimonials";

/* ─── Hero floating columns + creators carousel (placeholder creators) ─── */
export const PROFILES = [
  { name: "Mukesh Tidke",        tagline: "Coworking Space Owner",  img: `${CDN}/mukesh-tidke.webp`,        accent: "c-amber"   },
  { name: "Ar. Pranav Kadoo",    tagline: "Architect",              img: `${CDN}/pranav-kadoo.webp`,        accent: "c-emerald" },
  { name: "Vishal Chaware",      tagline: "Salesforce Developer",   img: `${CDN}/vishal-chaware.webp`,      accent: "c-blue"    },
  { name: "Sangharata Somkuvar", tagline: "DevOps Engineer",        img: `${CDN}/sangharata-somkuvar.webp`, accent: "c-violet"  },
  { name: "Dr. Yukta Bawankar",  tagline: "Physiotherapist",        img: `${CDN}/yukta-bawankar.webp`,      accent: "c-pink"    },
  { name: "Happy Singh",         tagline: "Creative Lead",          img: `${CDN}/happy-singh.webp`,         accent: "c-cyan"    },
  { name: "Arjun Ravikumar",     tagline: "Performance Marketeer",  img: `${CDN}/arjun-ravikumar.webp`,     accent: "c-blue"    },
  { name: "Tushar Malvi",        tagline: "Management Trainee, ECL", img: `${CDN}/tushar-malvi.webp`,       accent: "c-emerald" },
];

/* Two hero columns — column A scrolls up, column B scrolls down. */
export const HERO_COL_A = PROFILES.slice(0, 4);
export const HERO_COL_B = PROFILES.slice(4, 8);

/* ─── Block 2: "See what creators build" carousel cards ─── */
export const COHORTS = [
  { title: "Weekend Coworking Pass", blurb: "Book a cabin in seconds — no more 'is 4pm free?' WhatsApps.", tag: "Coworking · 0% cut", name: "Mukesh Tidke",        img: `${CDN}/mukesh-tidke.webp`        },
  { title: "Site-Visit Bookings",     blurb: "Clients pick a slot and pay upfront — no WhatsApp date juggling.", tag: "1:1 · Design",       name: "Ar. Pranav Kadoo",    img: `${CDN}/pranav-kadoo.webp`       },
  { title: "Salesforce Audit Calls",  blurb: "Link out, slot picked, paid up-front. No money talk.",          tag: "1:1 · 45 min",       name: "Vishal Chaware",      img: `${CDN}/vishal-chaware.webp`     },
  { title: "Weekend Mentoring",       blurb: "Set it up once. Slots fill, money's already in.",                tag: "Mentoring · Recurring", name: "Sangharata Somkuvar", img: `${CDN}/sangharata-somkuvar.webp`},
  { title: "Recovery Sessions",       blurb: "Reminder texts mean patients never forget a slot.",              tag: "1:1 · Physio",       name: "Dr. Yukta Bawankar",  img: `${CDN}/yukta-bawankar.webp`     },
  { title: "Brand Power Hours",       blurb: "One link in the Insta bio. No GPay QR after the call.",          tag: "1:1 · Design",       name: "Happy Singh",         img: `${CDN}/happy-singh.webp`        },
];

/* ─── Block 4: interactive accordion (left preview swaps on open) ─── */
export const CAPABILITIES = [
  {
    title: "Offer 1:1 sessions",
    body: "Sell your time by the slot. Clients pick, pay up-front, and Google Meet links generate automatically.",
    preview: { kind: "session", title: "Strategy Call", meta: "Tomorrow · 5:00pm", price: "₹1,200", accent: "c-violet" },
  },
  {
    title: "Setup Priority DM in seconds",
    body: "Let fans pay to skip the queue and get a guaranteed reply. Zero commission on the fee.",
    preview: { kind: "dm", title: "Priority DM", meta: "Guaranteed reply in 24h", price: "₹299", accent: "c-pink" },
  },
  {
    title: "Host a webinar",
    body: "Connect with hundreds at once — classes, group calls, workshops. One link, one price.",
    preview: { kind: "webinar", title: "Personal Branding Workshop", meta: "Sat · 11:00am · 120 seats", price: "₹599", accent: "c-amber" },
  },
  {
    title: "Bundle your services",
    body: "Package multiple sessions into one offer at a price you set, with 0% commission on Sloth Active.",
    preview: { kind: "bundle", title: "4-Session Coaching Pack", meta: "Save 20% vs single", price: "₹3,999", accent: "c-emerald" },
  },
  {
    title: "Sell courses & products",
    body: "Drop a digital product or course on your SlothPage and get paid instantly to your bank.",
    preview: { kind: "product", title: "GST Filing Playbook (PDF)", meta: "Instant download", price: "₹799", accent: "c-blue" },
  },
];

/* ─── Block 5: testimonials (reused from Home.jsx — real hosts) ─── */
export const TESTIMONIALS = [
  { quote: "Half my day used to go in 'is a cabin free at 4?' WhatsApps. Now people just book it themselves.", name: "Mukesh Tidke", role: "Coworking Space Owner", avatar: `${CDN}/mukesh-tidke.webp` },
  { quote: "Clients book site-visit slots straight off my link and pay upfront. No more chasing dates over WhatsApp.", name: "Ar. Pranav Kadoo", role: "Architect", avatar: `${CDN}/pranav-kadoo.webp` },
  { quote: "I send the link, they pick a slot, payment's sorted before the call. No more awkward money talk.", name: "Vishal Chaware", role: "Salesforce Developer", avatar: `${CDN}/vishal-chaware.webp` },
  { quote: "Set up my weekend mentoring in one evening and kind of forgot about it. Slots fill, money's already in.", name: "Sangharata Somkuvar", role: "DevOps Engineer", avatar: `${CDN}/sangharata-somkuvar.webp` },
  { quote: "My patients forget appointments easily. The reminder texts have honestly been a lifesaver.", name: "Dr. Yukta Bawankar", role: "Physiotherapist", avatar: `${CDN}/yukta-bawankar.webp` },
  { quote: "Stuck the link in my Insta bio. Looks way better than sending a GPay QR after the call.", name: "Happy Singh", role: "Creative Lead", avatar: `${CDN}/happy-singh.webp` },
  { quote: "Honestly I picked it because 0% commission. I charge for audits and Sloth doesn't take a cut.", name: "Arjun Ravikumar", role: "Performance Marketeer", avatar: `${CDN}/arjun-ravikumar.webp` },
  { quote: "I run mentoring calls on the side — slots fill, payment's sorted, zero admin after work hours.", name: "Tushar Malvi", role: "Management Trainee, ECL", avatar: `${CDN}/tushar-malvi.webp` },
];

/* ─── Block 6: bento stat grid ("Earn & Convert more") ─── */
export const BENTO = [
  { big: "0%",   label: "commission on every booking", sub: "Just Rs. 10 / Day — never a cut of what you earn.", color: "c-pink",    span: false },
  { big: "40%",  label: "more trust with testimonials", sub: "Showcase guest & host reviews right on your page.",   color: "c-violet",  span: false },
  { big: "100%", label: "yours — clients & data",       sub: "Your client list stays yours. No lock-in, ever.",     color: "c-emerald", span: false },
  { big: "UPI",  label: "GST · INR-native payouts",      sub: "Razorpay up-front payments, settled straight to bank.", color: "c-blue",    span: false },
  { big: "2-min",label: "setup, then it runs itself",    sub: "Google sign-in, claim your page, share the link.",     color: "c-amber",   span: false },
  { big: "24×7", label: "reminders that cut no-shows",   sub: "Automatic WhatsApp + email nudges before every slot.", color: "c-cyan",    span: false },
];

/* ─── Block: Book A Sloth vs Topmate comparison table ─────────────────
   Honest stance: BAS wins the money/India rows, real parity rows are
   marked, and ONE row concedes Topmate's larger discovery network today
   (`win: false`). Competitor cells kept qualitative on purpose — no hard
   fee % that would rot. Re-verify the Topmate column when it changes.
   `win`: true = BAS advantage · null = parity (both ✓) · false = Topmate edge.
   ──────────────────────────────────────────────────────────────────── */
export const COMPARE_TM = [
  { f: "Commission on paid bookings",        bas: "0% on Sloth Active",  tm: "10% of each sale", win: true },
  { f: "GST invoices — automatic",           bas: "Yes",                  tm: "No",                      win: true },
  { f: "WhatsApp reminders",                 bas: "Built in",             tm: "Email-first",             win: true },
  { f: "Flat price (never scales w/ earnings)", bas: "Yes — ₹399 / mo",  tm: "Fee grows as you earn",   win: true },
  { f: "Your client list & data",            bas: "100% yours, no lock-in", tm: "Held on the platform",  win: true },
  { f: "UPI / INR payments at booking",      bas: "Yes",                  tm: "Yes",                     win: null },
  { f: "1:1 sessions, webinars & products",  bas: "Yes",                  tm: "Yes",                     win: null },
  { f: "Public creator page",                bas: "Yes (SlothPage)",      tm: "Yes",                     win: null },
  { f: "Google Calendar + Meet",             bas: "Yes",                  tm: "Yes",                     win: null },
  { f: "Creator discovery network",          bas: "Growing",              tm: "Larger today",            win: false },
];

/* ─── Block 7: FAQ (objection handling; answers front-loaded for AI/GEO) ─── */
export const FAQ = [
  { q: "Does Book A Sloth take a commission like Topmate?", a: "No. On every paid plan Book A Sloth takes 0% commission — just the flat ₹399/month Sloth Active plan. Your client pays a flat ₹10 + GST booking fee, and your payment gateway's standard charge applies. Topmate takes a cut of what you earn, so the more you make, the more it costs you. With Book A Sloth the price stays flat." },
  { q: "Is it really 0% commission?", a: "Yes — on every paid plan, Book A Sloth takes 0% commission. The only per-booking cost is a flat ₹10 platform fee plus your payment gateway's standard charge. Nothing is skimmed as commission." },
  { q: "What does Rs. 10 / Day include?", a: "Unlimited bookings, up-front payments, WhatsApp + email reminders, your own SlothPage, and automatic Google Calendar + Meet. One flat price — it never scales with how much you earn." },
  { q: "Can my clients pay by UPI, and do I get paid in ₹?", a: "Yes. Clients pay up-front by UPI or card through Razorpay, and your earnings settle straight to your Indian bank account in ₹ — no USD, no foreign-currency conversion." },
  { q: "Do I get GST invoices automatically?", a: "Yes. Book A Sloth generates GST-ready invoices automatically for your bookings — no separate accounting tool needed. Topmate doesn't do this for you." },
  { q: "How do I switch from Topmate?", a: "Just share your new SlothPage link. There's nothing to migrate and no lock-in — your clients book in seconds and your client list stays yours. You can even run both side by side while you move over." },
  { q: "Is there a free plan?", a: "Yes. The Sloth plan is free with a 5% commission, half of Topmate's 10%. Upgrade to a 0%-commission paid plan whenever you're ready." },
  { q: "How do payouts work?", a: "Clients pay up-front through Razorpay when they book. Your earnings are settled to you after the session completes." },
  { q: "Is Topmate better than Book A Sloth for anything?", a: "Honestly, yes — Topmate has a larger creator discovery network today, so if you rely on its marketplace to find you new audience, that's its edge. Book A Sloth wins on keeping more of your money: 0% commission on paid plans, a flat ₹399/month price, automatic GST invoices, and WhatsApp reminders built in." },
];

/**
 * Marketing content for the /features/:slug pages (one page per Book A Sloth
 * capability). Pure data — no logic beyond the lookup helper below. Mirrors
 * the pattern in client/src/data/plans.js (single source of truth for copy,
 * consumed by whatever page component renders it).
 *
 * Colors follow the brand palette (see docs/design-system.md):
 *   #FE5100 orange (primary CTA) · #FF4D93 pink · #4AB765 green ·
 *   #FFCC1C yellow · #269CEF blue · #0F1111 / #1A1D24 dark backgrounds.
 */

export const FEATURES = [
  {
    slug: "online-scheduling",
    title: "Online Scheduling",
    tagline: "Bookings that fill themselves in.",
    description:
      "Give clients a link and let them pick a slot that actually works — no back-and-forth on WhatsApp. Book A Sloth checks your real availability, blocks double-bookings, and confirms instantly, 24/7.",
    heroImage:
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=1200&q=80",
    accent: "#269CEF",
    accentLight: "rgba(38,156,239,0.1)",
    darkBg: "#0F1111",
    layout: { hero: "split", sections: "zigzag", heroReverse: false },
    features: [
      {
        title: "Real-time availability",
        description:
          "Clients only ever see slots you're actually free for — pulled live from your calendar and existing bookings.",
        image:
          "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=80",
      },
      {
        title: "Buffer times & durations",
        description:
          "Set prep time before and after every service so back-to-back calls never leave you scrambling.",
        image:
          "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=600&q=80",
      },
      {
        title: "Multiple service types",
        description:
          "Run a 15-minute discovery call and a 90-minute workshop from the same page, each with its own rules.",
        image:
          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
      },
      {
        title: "Instant confirmation",
        description:
          "The moment a client books, both of you get a confirmation — no manual approval step slowing things down.",
        image:
          "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&q=80",
      },
      {
        title: "Built for Indian time zones",
        description:
          "Clients booking from Dubai or New York see slots converted to their local time automatically.",
        image:
          "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=600&q=80",
      },
    ],
    competitors: [
      { name: "Calendly", color: "#006BFF" },
      { name: "Cal.com", color: "#111111" },
      { name: "Acuity", color: "#7B68EE" },
    ],
    stats: [
      { value: "24/7", label: "bookings without a phone call" },
      { value: "2x", label: "faster bookings than manual DMs" },
      { value: "0", label: "double-bookings once live" },
    ],
    faq: [
      {
        q: "Do clients need to create an account to book?",
        a: "No. Guests book with just their phone number and an OTP — no password, no app download.",
      },
      {
        q: "Can I offer different durations for the same service?",
        a: "Yes, each service can have its own duration, buffer time, and pricing, all shown on your booking page.",
      },
      {
        q: "What happens if two people try to book the same slot?",
        a: "The first confirmed payment locks the slot. Everyone else instantly sees it as unavailable — no overlaps.",
      },
      {
        q: "Is this only for one-on-one appointments?",
        a: "You can also cap group sessions at a fixed number of seats, so workshops and classes work the same way.",
      },
    ],
    cta: {
      headline: "Stop scheduling over WhatsApp.",
      subline: "Set up your booking page free in under 5 minutes.",
    },
    seo: {
      title: "Online Scheduling Software for Creators | Book A Sloth",
      description:
        "Let clients book themselves 24/7 with real-time availability, no double-bookings, and instant confirmation. Built for Indian creators and freelancers.",
    },
  },

  {
    slug: "payments",
    title: "Payments & Invoicing",
    tagline: "Get paid before you show up.",
    description:
      "Every booking is paid upfront through Razorpay — UPI, cards, netbanking, wallets — before it ever hits your calendar. GST-ready invoices generate automatically, so you never chase a payment or a receipt again.",
    heroImage:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
    accent: "#4AB765",
    accentLight: "rgba(74,183,101,0.1)",
    darkBg: "#1A1D24",
    layout: { hero: "overlap", sections: "cards", heroReverse: false },
    features: [
      {
        title: "UPI, cards & netbanking",
        description:
          "Razorpay checkout supports every payment method Indian clients already trust — no separate payment link needed.",
        image:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80",
      },
      {
        title: "Auto-generated GST invoices",
        description:
          "Every paid booking produces a compliant, sequentially numbered invoice — no spreadsheet, no manual entry.",
        image:
          "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
      },
      {
        title: "Subscription billing",
        description:
          "Set up recurring monthly or yearly packages and let Razorpay auto-charge clients on renewal.",
        image:
          "https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=600&q=80",
      },
      {
        title: "Payout tracking",
        description:
          "See exactly how much has settled to your bank account and what's still clearing, in one dashboard.",
        image:
          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
      },
      {
        title: "One-click refunds",
        description:
          "Cancel a booking and refund the client's original payment method directly — no manual bank transfer.",
        image:
          "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=600&q=80",
      },
    ],
    competitors: [
      { name: "Razorpay Dashboard", color: "#3395FF" },
      { name: "Stripe Dashboard", color: "#635BFF" },
      { name: "PayPal", color: "#003087" },
    ],
    stats: [
      { value: "0", label: "payment failures on verified UPI flows" },
      { value: "₹0", label: "setup fee to start accepting payments" },
      { value: "1-click", label: "GST invoice generation per booking" },
    ],
    faq: [
      {
        q: "Do I need my own Razorpay account?",
        a: "Book A Sloth handles the payment processing for you — you just connect your bank account to receive payouts.",
      },
      {
        q: "Are GST invoices automatic?",
        a: "Yes, every paid booking generates a numbered, GST-compliant invoice you and your client can download instantly.",
      },
      {
        q: "What happens if a payment fails?",
        a: "The booking simply isn't confirmed — no slot is held on unpaid bookings, so your calendar stays accurate.",
      },
      {
        q: "Can I offer monthly retainers, not just one-off bookings?",
        a: "Yes, subscription plans bill clients automatically every month or year through Razorpay Subscriptions.",
      },
    ],
    cta: {
      headline: "Never chase a payment again.",
      subline: "Every booking is paid before it lands on your calendar.",
    },
    seo: {
      title: "Payments & GST Invoicing for Bookings | Book A Sloth",
      description:
        "Accept UPI, cards, and netbanking with Razorpay, and get auto-generated GST invoices on every paid booking. Built for Indian creators.",
    },
  },

  {
    slug: "google-calendar",
    title: "Google Calendar Sync",
    tagline: "One calendar. Zero clashes.",
    description:
      "Connect your Google Calendar once and Book A Sloth reads your existing events to block busy time, while every new booking gets pushed straight back — with a Meet link attached. Your personal and client calendars finally agree.",
    heroImage:
      "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=1200&q=80",
    accent: "#FF4D93",
    accentLight: "rgba(255,77,147,0.1)",
    darkBg: "#0F1111",
    layout: { hero: "diagonal", sections: "bento", heroReverse: false },
    features: [
      {
        title: "Two-way sync",
        description:
          "New bookings appear on your Google Calendar automatically, and events you add there block your booking page.",
        image:
          "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=80",
      },
      {
        title: "Free/busy blocking",
        description:
          "A personal event or another meeting instantly hides that slot from clients — no manual availability updates.",
        image:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
      },
      {
        title: "Auto-generated Meet links",
        description:
          "Every video booking gets a unique Google Meet link created and attached at confirmation time.",
        image:
          "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=600&q=80",
      },
      {
        title: "One calendar, not two",
        description:
          "Stop maintaining a separate 'booking calendar' — your existing Google Calendar becomes the single source of truth.",
        image:
          "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
      },
      {
        title: "Reschedules stay in sync",
        description:
          "When a client reschedules, the calendar event updates automatically — no stray duplicate invites.",
        image:
          "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=80",
      },
    ],
    competitors: [
      { name: "Google Calendar (standalone)", color: "#4285F4" },
      { name: "Fantastical", color: "#FF3B30" },
      { name: "Notion Calendar", color: "#000000" },
    ],
    stats: [
      { value: "1", label: "calendar to maintain, not two" },
      { value: "100%", label: "of bookings sync automatically" },
      { value: "<2s", label: "average sync time after booking" },
    ],
    faq: [
      {
        q: "Do I need Google Workspace to use this?",
        a: "No, a free personal Gmail account works — you just connect it once from your dashboard settings.",
      },
      {
        q: "What scopes does Book A Sloth request?",
        a: "Only calendar read/write access needed for availability and event creation — never your inbox or drive.",
      },
      {
        q: "Can I disconnect my calendar later?",
        a: "Yes, revoke access anytime from your dashboard or Google account settings with no impact on past bookings.",
      },
      {
        q: "Does this work with Outlook too?",
        a: "Google Calendar sync is live today; Outlook/iCal support is on our roadmap based on host demand.",
      },
    ],
    cta: {
      headline: "Let your calendar do the blocking for you.",
      subline: "Connect Google Calendar in one click, no double-booking ever again.",
    },
    seo: {
      title: "Google Calendar Sync for Bookings | Book A Sloth",
      description:
        "Two-way Google Calendar sync with automatic Meet links and free/busy blocking. Keep one calendar instead of two.",
    },
  },

  {
    slug: "notifications",
    title: "Smart Notifications",
    tagline: "Fewer no-shows. More showing up.",
    description:
      "Automatic WhatsApp and email reminders keep every booking top of mind for your clients — from confirmation to a nudge an hour before. Reschedules and cancellations notify everyone instantly, so nobody's left guessing.",
    heroImage:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80",
    accent: "#FFCC1C",
    accentLight: "rgba(255,204,28,0.1)",
    darkBg: "#1A1D24",
    layout: { hero: "centered", sections: "showcase", heroReverse: false },
    features: [
      {
        title: "WhatsApp reminders",
        description:
          "Clients get a WhatsApp message before their booking — the channel Indian clients actually check first.",
        image:
          "https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=600&q=80",
      },
      {
        title: "Email confirmations",
        description:
          "Branded confirmation and receipt emails go out the moment payment clears, no manual follow-up needed.",
        image:
          "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&q=80",
      },
      {
        title: "Automated follow-ups",
        description:
          "After a session ends, clients get a review request or rebooking nudge automatically, on your schedule.",
        image:
          "https://images.unsplash.com/photo-1596742578443-7682ef7b7301?w=600&q=80",
      },
      {
        title: "Reschedule & cancel alerts",
        description:
          "Any change to a booking notifies both sides immediately, so nobody shows up to an empty slot.",
        image:
          "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=600&q=80",
      },
      {
        title: "Custom reminder timing",
        description:
          "Choose how far in advance reminders fire — an hour before a call, a day before a workshop, your call.",
        image:
          "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=600&q=80",
      },
    ],
    competitors: [
      { name: "Twilio", color: "#F22F46" },
      { name: "AiSensy", color: "#25D366" },
      { name: "Interakt", color: "#0B5FFF" },
    ],
    stats: [
      { value: "38%", label: "fewer no-shows with reminders on" },
      { value: "90%+", label: "WhatsApp message open rate" },
      { value: "3", label: "automatic touchpoints per booking" },
    ],
    faq: [
      {
        q: "Do clients need to save a WhatsApp number to get reminders?",
        a: "No, reminders arrive from our verified business number — no saving contacts required to receive them.",
      },
      {
        q: "Can I turn off WhatsApp and use only email?",
        a: "Yes, notification channels are configurable per host from your dashboard settings.",
      },
      {
        q: "What if a client's number is unreachable?",
        a: "Email confirmation still goes out as a fallback, so the booking record is never lost.",
      },
      {
        q: "Are notifications plan-gated?",
        a: "Core booking confirmations are available on every plan; advanced follow-up flows scale with paid plans.",
      },
    ],
    cta: {
      headline: "Let reminders chase your clients, not you.",
      subline: "Turn on WhatsApp + email notifications in your dashboard today.",
    },
    seo: {
      title: "WhatsApp & Email Booking Reminders | Book A Sloth",
      description:
        "Cut no-shows with automatic WhatsApp and email reminders for every booking, reschedule, and cancellation.",
    },
  },

  {
    slug: "booking-pages",
    title: "Custom Booking Pages",
    tagline: "Your brand, not a generic form.",
    description:
      "Your booking page lives at your own bookasloth.in/username, styled with your colors, photo, and bio — not a bare scheduling widget. Showcase every service, link your socials, and let it double as your creator page.",
    heroImage:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1200&q=80",
    accent: "#FE5100",
    accentLight: "rgba(254,81,0,0.1)",
    darkBg: "#0F1111",
    layout: { hero: "editorial", sections: "zigzag", heroReverse: false },
    features: [
      {
        title: "Custom themes & colors",
        description:
          "Pick from curated palettes that match your personal brand instead of a one-size-fits-all template.",
        image:
          "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?w=600&q=80",
      },
      {
        title: "Your own link",
        description:
          "bookasloth.in/yourname is yours permanently — easy to put on Instagram, a resume, or a business card.",
        image:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
      },
      {
        title: "Full service showcase",
        description:
          "List every offering with pricing, duration, and description — clients see exactly what they're booking.",
        image:
          "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80",
      },
      {
        title: "Mobile-first design",
        description:
          "Most Indian clients book from a phone — your page is built to convert on small screens first.",
        image:
          "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80",
      },
      {
        title: "Social links & bio",
        description:
          "Add Instagram, LinkedIn, and a short bio so your page works as a link-in-bio too, not just a scheduler.",
        image:
          "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80",
      },
    ],
    competitors: [
      { name: "Topmate", color: "#1E88E5" },
      { name: "Linktree", color: "#43E660" },
      { name: "Carrd", color: "#4285F4" },
    ],
    stats: [
      { value: "1", label: "link for bookings, bio, and socials" },
      { value: "60s", label: "average setup time for a new page" },
      { value: "5+", label: "themes tailored to Indian creators" },
    ],
    faq: [
      {
        q: "Can I change my username later?",
        a: "Yes, though your old link keeps redirecting for a while so existing shares don't break.",
      },
      {
        q: "Can I use my own domain instead of bookasloth.in?",
        a: "Custom domains are on the roadmap; today every host gets a permanent bookasloth.in/username link.",
      },
      {
        q: "How many services can I list?",
        a: "Starter includes up to 3 services; paid plans raise or remove that cap entirely.",
      },
      {
        q: "Does the page work without JavaScript-heavy widgets?",
        a: "It's a fast, mobile-first page designed to load instantly even on slower mobile connections.",
      },
    ],
    cta: {
      headline: "Get a booking page that looks like you.",
      subline: "Claim your bookasloth.in link free, no credit card needed.",
    },
    seo: {
      title: "Custom Booking Page Builder for Creators | Book A Sloth",
      description:
        "A branded, mobile-first booking page at your own bookasloth.in link — services, pricing, bio, and socials in one place.",
    },
  },

  {
    slug: "digital-products",
    title: "Digital Products",
    tagline: "Sell templates and courses, no separate store.",
    description:
      "List ebooks, templates, or pre-recorded courses right next to your bookable services. Clients pay once through the same Razorpay checkout and get an instant, secure download link — no separate Gumroad account required.",
    heroImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80",
    accent: "#269CEF",
    accentLight: "rgba(38,156,239,0.1)",
    darkBg: "#1A1D24",
    layout: { hero: "gradient", sections: "cards", heroReverse: false },
    features: [
      {
        title: "One-time downloads",
        description:
          "Upload a PDF, template, or resource pack once and sell it unlimited times without any inventory to manage.",
        image:
          "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80",
      },
      {
        title: "Secure delivery links",
        description:
          "Every purchase generates a unique, expiring download link — no public file URLs that can be shared around.",
        image:
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80",
      },
      {
        title: "Bundle with services",
        description:
          "Offer a template pack alongside a consulting call on the same page, and let clients buy either or both.",
        image:
          "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&q=80",
      },
      {
        title: "Instant payment on purchase",
        description:
          "Money settles the same way as bookings — through Razorpay — so there's one payout stream to track, not two.",
        image:
          "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
      },
      {
        title: "Sales analytics",
        description:
          "See which products are actually selling, and how much revenue they add next to your bookings.",
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
      },
    ],
    competitors: [
      { name: "Gumroad", color: "#FF90E8" },
      { name: "Payhip", color: "#5E17EB" },
      { name: "Instamojo", color: "#4595E0" },
    ],
    stats: [
      { value: "1", label: "checkout for products and bookings" },
      { value: "2MB", label: "max file size, kept fast for mobile" },
      { value: "₹0", label: "extra platform fee beyond your plan" },
    ],
    faq: [
      {
        q: "What file types can I sell?",
        a: "PDFs, templates, and other downloadable files up to 2MB — kept intentionally light for fast delivery.",
      },
      {
        q: "Is this available on every plan?",
        a: "Digital products currently roll out to Studio-tier hosts first, with a wider release planned soon.",
      },
      {
        q: "How do buyers receive their file?",
        a: "A secure download link is emailed instantly after payment confirms — no manual sending on your end.",
      },
      {
        q: "Can I see who bought what?",
        a: "Yes, every purchase appears in your dashboard alongside your regular bookings and payments.",
      },
    ],
    cta: {
      headline: "Turn your knowledge into a second income stream.",
      subline: "List your first digital product next to your services today.",
    },
    seo: {
      title: "Sell Digital Products & Templates | Book A Sloth",
      description:
        "Sell ebooks, templates, and courses alongside your bookings with secure instant delivery and one unified checkout.",
    },
  },

  {
    slug: "reviews",
    title: "Reviews & Ratings",
    tagline: "Let happy clients do the selling.",
    description:
      "After every completed booking, clients get a one-tap prompt to leave a review — verified against a real booking, never fake. Your rating and testimonials show right on your booking page, building trust before a stranger even books.",
    heroImage:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",
    accent: "#FF4D93",
    accentLight: "rgba(255,77,147,0.1)",
    darkBg: "#0F1111",
    layout: { hero: "split", sections: "bento", heroReverse: true },
    features: [
      {
        title: "Post-booking review requests",
        description:
          "A review prompt goes out automatically once a session is marked complete — no need to remember to ask.",
        image:
          "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80",
      },
      {
        title: "Verified bookings only",
        description:
          "Every review is tied to a real, paid booking — no anonymous drive-by ratings inflating or hurting your score.",
        image:
          "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&q=80",
      },
      {
        title: "Public rating on your profile",
        description:
          "Your average rating and review count show directly on your booking page, right where clients decide to book.",
        image:
          "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
      },
      {
        title: "Respond to reviews",
        description:
          "Reply publicly to any review, showing future clients that you're engaged and easy to work with.",
        image:
          "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
      },
      {
        title: "Showcase your best testimonials",
        description:
          "Pin standout reviews to the top of your page so they're the first thing a new visitor reads.",
        image:
          "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80",
      },
    ],
    competitors: [
      { name: "Google Reviews", color: "#4285F4" },
      { name: "Trustpilot", color: "#00B67A" },
      { name: "Yelp", color: "#D32323" },
    ],
    stats: [
      { value: "4.9★", label: "average rating across active hosts" },
      { value: "100%", label: "of reviews tied to a real booking" },
      { value: "2x", label: "conversion lift with 10+ reviews shown" },
    ],
    faq: [
      {
        q: "Can clients leave a review without booking?",
        a: "No, every review requires a completed, verified booking — this keeps ratings honest and spam-free.",
      },
      {
        q: "Can I remove a review I disagree with?",
        a: "You can respond publicly to any review, but reviews tied to genuine bookings can't be deleted by hosts.",
      },
      {
        q: "Do guests review hosts, or is it two-way?",
        a: "Reviews are bidirectional — hosts can also rate guests, helping build trust on both sides of a booking.",
      },
      {
        q: "Where do reviews show up?",
        a: "On your public booking page and in your dashboard, so you can track your rating trend over time.",
      },
    ],
    cta: {
      headline: "Build trust before the first call even starts.",
      subline: "Turn every happy client into a public testimonial, automatically.",
    },
    seo: {
      title: "Verified Reviews & Ratings for Hosts | Book A Sloth",
      description:
        "Automatic, booking-verified reviews shown right on your page. Build trust and convert more visitors into paying clients.",
    },
  },

  {
    slug: "availability",
    title: "Smart Availability",
    tagline: "Set your hours once. Forget about it.",
    description:
      "Define your weekly working hours, breaks, and holidays once, and Book A Sloth handles the rest — blocking booked slots, respecting buffers, and adjusting for every client's timezone automatically.",
    heroImage:
      "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=1200&q=80",
    accent: "#4AB765",
    accentLight: "rgba(74,183,101,0.1)",
    darkBg: "#1A1D24",
    layout: { hero: "overlap", sections: "showcase", heroReverse: false },
    features: [
      {
        title: "Weekly recurring hours",
        description:
          "Set your working hours for each day of the week once — no need to re-enter availability every week.",
        image:
          "https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=600&q=80",
      },
      {
        title: "Buffers & breaks",
        description:
          "Block lunch, travel time, or prep time between sessions so your calendar never overbooks you.",
        image:
          "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=600&q=80",
      },
      {
        title: "Holiday & leave blocking",
        description:
          "Mark a date off once and it disappears from your booking page instantly, across every service.",
        image:
          "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
      },
      {
        title: "Per-service availability",
        description:
          "Offer a service only on weekends, or another only on weekday mornings — rules apply independently.",
        image:
          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80",
      },
      {
        title: "Multi-timezone support",
        description:
          "Clients abroad see your availability converted to their own timezone, no manual conversion needed.",
        image:
          "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=600&q=80",
      },
    ],
    competitors: [
      { name: "When2meet", color: "#5A9BD5" },
      { name: "Doodle", color: "#8FC73E" },
      { name: "YouCanBook.me", color: "#F26D4F" },
    ],
    stats: [
      { value: "1x", label: "setup, applies every week after" },
      { value: "0", label: "manual availability updates needed" },
      { value: "24/7", label: "accurate booking page, always live" },
    ],
    faq: [
      {
        q: "Can I set different hours for different services?",
        a: "Yes, each service can carry its own availability rules layered on top of your general weekly hours.",
      },
      {
        q: "What happens on days I mark as off?",
        a: "Those dates disappear from your booking page entirely — clients simply can't select them.",
      },
      {
        q: "Does this respect my Google Calendar too?",
        a: "Yes, any event on your connected Google Calendar blocks that time automatically, on top of your set hours.",
      },
      {
        q: "Can I block time temporarily for a single day?",
        a: "Yes, one-off blocks work alongside your recurring weekly schedule without changing it permanently.",
      },
    ],
    cta: {
      headline: "Set your schedule once. Let it run itself.",
      subline: "Define your availability today and stop manually updating your calendar.",
    },
    seo: {
      title: "Smart Availability & Scheduling Rules | Book A Sloth",
      description:
        "Set weekly hours, buffers, and holidays once. Your booking page stays accurate automatically, in every client's timezone.",
    },
  },

  {
    slug: "analytics",
    title: "Analytics Dashboard",
    tagline: "Know what's actually growing your business.",
    description:
      "See revenue, booking trends, and repeat-client rate in one dashboard, instead of piecing it together from a payment app and a notebook. Spot your best-performing service and double down on what's working.",
    heroImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
    accent: "#FFCC1C",
    accentLight: "rgba(255,204,28,0.1)",
    darkBg: "#0F1111",
    layout: { hero: "diagonal", sections: "zigzag", heroReverse: false },
    features: [
      {
        title: "Revenue & booking trends",
        description:
          "Track earnings week over week and month over month, in rupees, with no spreadsheet exports needed.",
        image:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
      },
      {
        title: "Repeat-client tracking",
        description:
          "See what share of your revenue comes from returning clients versus first-time bookings.",
        image:
          "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
      },
      {
        title: "Top services breakdown",
        description:
          "Find out which service actually drives the most bookings and revenue, not just the one you promote most.",
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
      },
      {
        title: "Conversion funnel",
        description:
          "See how many page visits turn into started bookings, and how many of those actually complete payment.",
        image:
          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80",
      },
      {
        title: "Exportable reports",
        description:
          "Download a clean summary for your CA at tax time, or just to keep your own records outside the app.",
        image:
          "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80",
      },
    ],
    competitors: [
      { name: "Google Analytics", color: "#E37400" },
      { name: "Mixpanel", color: "#7856FF" },
      { name: "Amplitude", color: "#1E1E1E" },
    ],
    stats: [
      { value: "₹0", label: "extra spreadsheet tools required" },
      { value: "1", label: "dashboard for revenue and bookings" },
      { value: "Real-time", label: "numbers, no manual refresh needed" },
    ],
    faq: [
      {
        q: "Is analytics available on the free Starter plan?",
        a: "A basic revenue and booking summary is available on every plan; deeper breakdowns come with paid plans.",
      },
      {
        q: "Can I export my data?",
        a: "Yes, reports can be downloaded for your own records or handed straight to your accountant.",
      },
      {
        q: "Does this replace needing Google Analytics on my page?",
        a: "This dashboard tracks your bookings and revenue specifically — for site traffic, GA4 can run alongside it.",
      },
      {
        q: "How often does the dashboard update?",
        a: "Numbers reflect live data — a new booking or payment shows up without needing to refresh manually.",
      },
    ],
    cta: {
      headline: "Stop guessing what's working.",
      subline: "See your real numbers in one dashboard, updated live.",
    },
    seo: {
      title: "Booking & Revenue Analytics Dashboard | Book A Sloth",
      description:
        "Track revenue, repeat clients, and top services in one live dashboard. No spreadsheets, no guesswork.",
    },
  },

  {
    slug: "client-management",
    title: "Client Management",
    tagline: "Every client, every booking, one place.",
    description:
      "Every guest who books with you is automatically saved with their full booking history — so you always know who's a first-timer and who's coming back for the fifth time. No separate CRM to keep updated.",
    heroImage:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80",
    accent: "#FE5100",
    accentLight: "rgba(254,81,0,0.1)",
    darkBg: "#1A1D24",
    layout: { hero: "centered", sections: "cards", heroReverse: false },
    features: [
      {
        title: "Client history & notes",
        description:
          "See every past booking for a client in one view, with space to add your own private notes ahead of a call.",
        image:
          "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
      },
      {
        title: "Searchable contact database",
        description:
          "Every client who's ever booked is saved automatically — searchable by name, phone, or email.",
        image:
          "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80",
      },
      {
        title: "Repeat-client tagging",
        description:
          "Instantly spot your loyal clients versus first-timers, right from your bookings list.",
        image:
          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
      },
      {
        title: "Full booking timeline",
        description:
          "Every past and upcoming appointment for a client lines up chronologically, no digging through emails.",
        image:
          "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600&q=80",
      },
      {
        title: "Export your client list",
        description:
          "Download your full client base anytime — it's your data, not locked into the platform.",
        image:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
      },
    ],
    competitors: [
      { name: "HubSpot", color: "#FF7A59" },
      { name: "Freshsales", color: "#25C16F" },
      { name: "Zoho CRM", color: "#E42527" },
    ],
    stats: [
      { value: "Auto", label: "every client saved, no manual entry" },
      { value: "1", label: "place for history, notes, and contact info" },
      { value: "₹0", label: "extra CRM subscription needed" },
    ],
    faq: [
      {
        q: "Do I need to manually add clients?",
        a: "No, anyone who books through your page is added to your client list automatically, with full history.",
      },
      {
        q: "Can I add private notes about a client?",
        a: "Yes, notes are visible only to you and are saved against that client for every future booking.",
      },
      {
        q: "Can I export my client list if I switch tools?",
        a: "Yes, your client data belongs to you and can be exported at any time from your dashboard.",
      },
      {
        q: "Does this work for one-time guests too?",
        a: "Every guest is recorded the same way, whether it's their first booking or their fiftieth.",
      },
    ],
    cta: {
      headline: "Know your clients without a separate CRM.",
      subline: "Every booking builds your client list automatically, starting today.",
    },
    seo: {
      title: "Client Management for Hosts & Creators | Book A Sloth",
      description:
        "Automatic client history, notes, and repeat-booking tracking — no separate CRM subscription required.",
    },
  },
];

export function getFeature(slug) {
  return FEATURES.find((feature) => feature.slug === slug);
}

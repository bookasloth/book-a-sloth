/**
 * professionLandingData.js — per-profession content + theme for /for/:profession
 * marketing landing pages (ProfessionLanding.jsx).
 *
 * Each entry is fully data-driven: the template renders whatever is here, so a
 * new profession page is just a new entry — no new component. Each profession
 * carries its OWN palette + voice so the pages feel distinct (a lawyer page must
 * read differently from a doctor page), per product direction.
 *
 * Build order: perfect ONE profession, then add the next. Currently: lawyers.
 *
 * Theme keys drive CSS custom properties on the page root (see ProfessionLanding):
 *   primary   — dark heading / hero surface ink
 *   accent    — the profession's signature colour (CTAs, highlights)
 *   accentCta — WCAG-AA text-on-accent button bg (darker accent)
 *   tint      — soft section background wash
 *   heroFrom / heroTo — hero gradient stops (dark surface)
 *
 * SEO note: `title`/`description` stay clean + commercial (Google). `ogTitle`/
 * `ogDescription` are intentionally CLICKBAIT (₹10/day hook) — social shares only.
 * `ogImage` is a 1200×630 asset on the company CDN (founder upload; falls back).
 */

import {
  Scale, PhoneOff, IndianRupee, CalendarX2, MessageSquareX, FileClock,
  ShieldCheck, CalendarCheck, Wallet, BellRing, Landmark,
  Lock, FileCheck, BadgePercent, Clock3,
  HeartPulse, Stethoscope, CalendarClock, UserX, PhoneCall, ClipboardList, TrendingDown,
  Briefcase, Target, TrendingUp, Presentation, Handshake, LineChart,
  Scissors, Sparkles, Laptop, Zap,
  GraduationCap, BookOpen, Camera, Calendar, Building2, Users,
} from 'lucide-react';

export const PROFESSION_LANDING = {
  lawyers: {
    slug: 'lawyers',
    label: 'Lawyers & CAs',
    icon: Scale,

    // ── Theme — authority: deep slate + legal gold ──────────────────────────
    theme: {
      primary: '#1e293b',   // slate-800 — ink / headings
      accent: '#b7892f',    // muted legal gold — signature colour
      accentCta: '#8a6220', // AA-safe gold for white-text buttons
      tint: '#f8f6f1',      // warm parchment section wash
      heroFrom: '#0f172a',  // slate-900
      heroTo: '#1e293b',    // slate-800
    },

    // ── SEO (Google, commercial intent) ─────────────────────────────────────
    seo: {
      title: 'Appointment Booking Software for Lawyers | Book A Sloth',
      description:
        'Let clients book paid consultations online. Book A Sloth is appointment booking software for lawyers & CAs — fees collected upfront, calendar synced, no-shows gone. From ₹10/day.',
      keywords:
        'appointment booking software for lawyers, legal consultation booking, lawyer scheduling software, CA appointment software, book legal consultation online, advocate booking page India',
      // Clickbait — OG / social share only (NOT the indexed title)
      ogTitle: 'Your law practice still runs on WhatsApp? Fix it for ₹10/day.',
      ogDescription:
        "Clients book your consultation, pay the fee upfront, and get reminded — automatically. The booking page every advocate & CA should've had years ago.",
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-lawyers-og-1200x630.jpg',
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
      eyebrow: 'For Lawyers, Advocates & Chartered Accountants',
      headline: 'Argue the case,',
      headlineAccent: 'not the calendar.',
      headlineTail: ' Clients book your consultation, pay the fee upfront, and get reminded — automatically.',
      subline:
        'You practise law. Book A Sloth handles everything around it — clients pick a slot, pay your fee upfront, and get reminded — so you stay in court, not in your inbox.',
      ctaText: 'Set Up My Booking Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      // Hero product-mockup content — a themed booking page for this profession.
      mock: {
        practice: 'Adv. Meera Kulkarni',
        practiceTag: 'Advocate · High Court',
        services: [
          { name: 'Initial Legal Consultation', meta: '30 min · Online', price: '₹1,500' },
          { name: 'Contract Review & Advice', meta: '45 min · Online', price: '₹2,500' },
        ],
      },
    },

    // ── Social proof strip ───────────────────────────────────────────────────
    socialProof: 'Trusted by independent advocates, CAs and legal consultants across India.',

    // ── Trust badges (Trust & Authority pattern) ─────────────────────────────
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'SSL encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],

    // ── Authority stat band ──────────────────────────────────────────────────
    stats: [
      { icon: Clock3, value: '24/7', label: 'Consultations booked, even mid-hearing' },
      { icon: BadgePercent, value: '0%', label: 'Commission — you keep every fee' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your page' },
    ],

    // ── Problem / Agitation → Solution ───────────────────────────────────────
    // Host-facing pains, in a lawyer's own language.
    painPoints: [
      {
        icon: PhoneOff,
        problem: 'Consultation requests scattered across calls and WhatsApp',
        solution: 'One booking link. Clients pick a slot themselves — even while you are in a hearing.',
      },
      {
        icon: IndianRupee,
        problem: 'Awkward conversations about your consultation fee',
        solution: 'Your fee is shown upfront and collected before the meeting. No haggling, no invoices.',
      },
      {
        icon: CalendarX2,
        problem: 'Court dates and client meetings colliding',
        solution: 'Google Calendar busy times are blocked automatically. No double-booking, ever.',
      },
      {
        icon: FileClock,
        problem: 'No-shows eating billable hours you can never recover',
        solution: 'Automatic email + WhatsApp reminders go out before every consultation. No-shows drop.',
      },
      {
        icon: MessageSquareX,
        problem: 'Sharing a GPay QR after advice — it looks unprofessional',
        solution: 'A clean, branded page with Razorpay checkout. The first impression a legal practice deserves.',
      },
      {
        icon: Clock3,
        problem: 'Repeating your availability to every new enquiry',
        solution: 'Your live calendar shows only your open slots — clients self-serve a time, you stop re-typing them.',
      },
    ],

    // ── Features / Benefits (benefit-first) ──────────────────────────────────
    features: [
      {
        icon: CalendarCheck,
        title: 'Get booked around the clock',
        desc: 'Your consultation page is live 24/7. Clients book while you sleep, travel, or argue a matter.',
      },
      {
        icon: Wallet,
        title: 'Get paid before you advise',
        desc: 'Collect the full fee or an advance upfront via UPI, card or netbanking. GST invoice generated automatically.',
      },
      {
        icon: ShieldCheck,
        title: 'Keep client matters private',
        desc: 'Encrypted, access-controlled, never sold. Client details and notes stay yours alone.',
      },
      {
        icon: BellRing,
        title: 'End the no-show problem',
        desc: 'Reminders send themselves before every session — you never write another follow-up.',
      },
    ],

    // ── Pricing framing ──────────────────────────────────────────────────────
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — it pays for itself in a single recovered no-show.',
    },

    // ── FAQ (drives FAQPage schema — AEO/GEO) ────────────────────────────────
    faq: [
      {
        q: 'What is the best appointment booking software for lawyers in India?',
        a: 'Book A Sloth is built for Indian legal professionals — it lets clients book consultations online, pay your fee upfront via UPI or card, syncs with your Google Calendar around court dates, and sends automatic reminders. It handles GST invoicing and charges 0% commission on paid plans.',
      },
      {
        q: 'Can clients pay my consultation fee when they book?',
        a: 'Yes. Your fee is shown on your booking page and collected at checkout through Razorpay (UPI, cards, netbanking) before the consultation begins. You can charge the full fee or take an advance.',
      },
      {
        q: 'Will it avoid clashes with my court dates?',
        a: 'Yes. Book A Sloth reads the busy times on your Google Calendar, so blocked court dates and existing appointments are never offered as available slots. Booked slots lock instantly to prevent double-booking.',
      },
      {
        q: 'Do my clients need to create an account to book?',
        a: 'No. Clients book and pay without creating any account — they simply pick a slot, enter their details, and pay. This keeps the process fast and professional.',
      },
      {
        q: 'How much does it cost?',
        a: 'You can start free with a 5% per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every consultation fee.',
      },
      {
        q: 'Is it suitable for Chartered Accountants and legal consultants too?',
        a: 'Yes. Any professional who charges for advisory time — advocates, CAs, company secretaries, legal and tax consultants — can use Book A Sloth to sell booked, paid consultations from one link.',
      },
    ],

    // ── Mid-page CTA banners (contextual, placed after key sections) ─────────
    midCtas: {
      afterProblems: {
        text: 'Stop running your practice from your phone.',
        ctaText: 'Get My Booking Link',
      },
      afterHow: {
        text: 'Your next client is ready to book. Give them somewhere to do it.',
        ctaText: 'Set Up My Page Free',
      },
    },

    // ── Final CTA ────────────────────────────────────────────────────────────
    finalCta: {
      icon: Landmark,
      urgency: 'Every missed call is a client who booked someone else.',
      headline: 'Run a practice, not an inbox.',
      subline: 'Set up your consultation booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Booking Page',
    },

    // ── Section headings (profession-specific, not homepage reuse) ───────────
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Practising law is hard enough.', titleAccent: 'Client scheduling shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'Appointment booking software that works like a', titleAccent: 'clerk who never sleeps.' },
      testimonials: { title: 'Built for how legal work really runs.', subtitle: 'Advocates, CAs and consultants — booked, paid and reminded, without the admin.' },
    },

    // Footer tagline — "Made for India's <this>"
    madeFor: "India's Lawyers & CAs",

    // ── Lawyer testimonials (real) ───────────────────────────────────────────
    testimonials: [
      {
        quote: 'Clients book a consultation slot and pay the fee before we even speak. The awkward money conversation is just gone.',
        name: 'Adv. R. Menon',
        role: 'Advocate, Civil & Property',
        avatar: null,
      },
      {
        quote: 'During filing season my phone never stops. Now clients pick a slot around my deadlines instead of calling at 10pm.',
        name: 'CA Priya Nair',
        role: 'Chartered Accountant',
        avatar: null,
      },
      {
        quote: 'A clean booking link on my profile looks far more professional than sharing a UPI number after every call.',
        name: 'Adv. S. Bhatt',
        role: 'Legal Consultant',
        avatar: null,
      },
    ],
  },

  dentists: {
    slug: 'dentists',
    label: 'Dentists & Clinics',
    icon: Sparkles,

    // ── Theme — clean clinical teal + bright dental cyan ─────────────────────
    theme: {
      primary: '#0e3a4f',    // deep clinical teal — ink / headings
      accent: '#1fb6c9',     // bright dental cyan — signature colour
      accentCta: '#0e7f90',  // AA-safe cyan for white-text buttons
      tint: '#eefafb',       // soft aqua wash
      heroFrom: '#082a39',   // dark teal
      heroTo: '#0e3a4f',
    },

    // Basic meta only (no keywords / clickbait OG — pages are kept out of AI).
    seo: {
      title: 'Online Booking for Dental Clinics | Book A Sloth',
      description:
        'Let patients book and pay for their appointment online — and actually turn up. Book A Sloth keeps the dental chair full with automatic reminders, prepaid slots and a calendar that never double-books.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-dentists-og-1200x630.jpg',
    },

    hero: {
      eyebrow: 'For Dentists, Orthodontists & Dental Clinics',
      headline: 'The chair fills itself.',
      headlineAccent: 'The front desk finally breathes.',
      headlineTail: ' Patients pick a slot, pay, and get reminded — you just keep drilling.',
      subline:
        'You look after teeth. Book A Sloth looks after everything around the appointment — so your day is fewer no-shows, fewer “are you open?” calls, and a reception that isn’t glued to the phone.',
      ctaText: 'Set Up My Clinic Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Dr. Neha Kapoor',
        practiceTag: 'Dental Surgeon · Smile Studio',
        services: [
          { name: 'Consultation & Check-up', meta: '20 min · In-clinic', price: '₹400' },
          { name: 'Scaling & Polishing', meta: '45 min · In-clinic', price: '₹1,200' },
        ],
      },
    },

    socialProof: 'Trusted by dental surgeons, orthodontists and multi-chair clinics across India.',

    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Patient data encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],

    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Appointments booked, even after the clinic shuts' },
      { icon: TrendingDown, value: '1 in 5', label: 'Dental slots go no-show — reminders win them back' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your clinic page' },
    ],

    painPoints: [
      { icon: PhoneOff, problem: 'Reception spends half the day confirming and rescheduling by phone', solution: 'One booking link. Patients pick, move or cancel their own slot — the desk stops dialling.' },
      { icon: FileClock, problem: 'Empty chairs when patients forget a cleaning or a follow-up', solution: 'Automatic email + WhatsApp reminders go out before every appointment. The chair stays full.' },
      { icon: IndianRupee, problem: 'Chasing payment after the procedure is awkward and slow', solution: 'Take the consult fee or a deposit upfront at booking. GST invoice generated automatically.' },
      { icon: CalendarX2, problem: 'Double-booked chairs and clashing surgeon schedules', solution: 'Each chair’s Google Calendar is read live — booked slots lock instantly, no overlaps.' },
      { icon: MessageSquareX, problem: 'A GPay QR taped to the reception desk', solution: 'A clean, branded booking page with proper checkout — the first impression a clinic deserves.' },
      { icon: Clock3, problem: 'Repeating opening hours to every caller', solution: 'Your live availability shows only open slots — patients self-serve, the desk stops repeating itself.' },
    ],

    features: [
      { icon: CalendarCheck, title: 'Book around the clock', desc: 'Your clinic page takes appointments at midnight, on Sundays, and while you’re mid-procedure.' },
      { icon: Wallet, title: 'Collect before the chair', desc: 'Consult fee or deposit paid upfront via UPI, card or netbanking — with an automatic GST invoice.' },
      { icon: BellRing, title: 'Kill the no-show', desc: 'Reminders send themselves before every appointment, so recalls and cleanings don’t slip.' },
      { icon: ShieldCheck, title: 'Keep patient data private', desc: 'Encrypted, access-controlled, never sold. Patient details and notes stay yours alone.' },
    ],

    pricing: {
      hook: 'Less than a box of gloves a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show pays for the month.',
    },

    faq: [
      { q: 'Can patients book a dental appointment online and pay upfront?', a: 'Yes. Patients pick a slot on your clinic’s booking page and pay the consult fee or a deposit at checkout through Razorpay (UPI, cards, netbanking) before they arrive. You can also offer free-to-book slots.' },
      { q: 'Will it stop two patients landing in the same chair?', a: 'Yes. Book A Sloth reads each chair’s Google Calendar, so busy times are never offered and a booked slot locks instantly — no double-booking across surgeons or chairs.' },
      { q: 'How does it cut no-shows at a dental clinic?', a: 'Every appointment triggers automatic email and WhatsApp reminders before the slot, which is exactly where dental recalls and cleanings usually slip. Prepaid slots reduce no-shows further.' },
      { q: 'Do patients need an account to book?', a: 'No. Patients just pick a time, enter their details and pay — no sign-up. It keeps booking fast for walk-in and recall patients alike.' },
      { q: 'How much does it cost for a clinic?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],

    midCtas: {
      afterProblems: { text: 'Give your reception desk its day back.', ctaText: 'Get My Clinic Link' },
      afterHow: { text: 'Your next patient is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },

    finalCta: {
      icon: CalendarCheck,
      urgency: 'Every forgotten recall is a chair sitting empty.',
      headline: 'Keep the chair full, not the voicemail.',
      subline: 'Set up your clinic’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Clinic Page',
    },

    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Dentistry is detailed enough.', titleAccent: 'Booking shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'receptionist who never sleeps.' },
      testimonials: { title: 'Built for how a clinic really runs.', subtitle: 'Surgeons, orthodontists and multi-chair clinics — booked, paid and reminded, without the front-desk churn.' },
    },

    madeFor: "India's Dentists & Clinics",

    testimonials: [
      { quote: 'Recalls used to slip through the cracks. Now patients get a reminder and just rebook themselves.', name: 'Dr. A. Sheth', role: 'Dental Surgeon', avatar: null },
      { quote: 'My front desk isn’t on the phone all day confirming slots anymore. It changed how the clinic feels.', name: 'Dr. R. Iyer', role: 'Orthodontist', avatar: null },
      { quote: 'Taking a deposit at booking quietly ended most of our no-shows.', name: 'Dr. M. Pillai', role: 'Dental Clinic Owner', avatar: null },
    ],
  },

  astrologers: {
    slug: 'astrologers',
    label: 'Astrologers & Readers',
    icon: Sparkles,
    theme: {
      primary: '#241a4d', accent: '#c99a3e', accentCta: '#8f6b22',
      tint: '#f6f3ec', heroFrom: '#140f30', heroTo: '#241a4d',
    },
    seo: {
      title: 'Online Booking for Astrologers & Readers | Book A Sloth',
      description:
        'Let clients book and pay for a reading online. Book A Sloth gives astrologers, tarot and numerology readers a clean booking page — fees collected upfront, slots reminded, calendar always in sync.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-astrologers-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Astrologers, Tarot & Numerology Readers',
      headline: 'The stars align.',
      headlineAccent: 'So does your calendar.',
      headlineTail: ' Clients book a reading, pay upfront, and get reminded — you just tune in.',
      subline:
        'You read the charts. Book A Sloth handles the rest — seekers pick a slot, pay your fee, and get reminded — so your day is readings, not DMs about “are you free?”.',
      ctaText: 'Set Up My Reading Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Ananya · Vedic Astrologer',
        practiceTag: 'Astrology · Tarot',
        services: [
          { name: 'Birth Chart Reading', meta: '45 min · Online', price: '₹1,100' },
          { name: 'Quick Tarot Session', meta: '20 min · Online', price: '₹500' },
        ],
      },
    },
    socialProof: 'Trusted by astrologers, tarot readers and numerologists across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Readings kept private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: Clock3, value: '24/7', label: 'Readings booked, across every time zone' },
      { icon: BadgePercent, value: '0%', label: 'Commission — you keep every fee' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your reading page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Reading requests scattered across Instagram DMs and WhatsApp', solution: 'One booking link. Seekers pick their own slot — you stop screenshotting your calendar.' },
      { icon: IndianRupee, problem: 'Chasing payment before or after a reading feels awkward', solution: 'Your fee is paid upfront at booking. No “pay karo” message, no no-pay no-shows.' },
      { icon: CalendarX2, problem: 'Clients across time zones booking your sleeping hours', solution: 'Your live availability shows only your real open slots — in the client’s own time.' },
      { icon: FileClock, problem: 'Seekers forgetting the slot they asked for', solution: 'Automatic email + WhatsApp reminders go out before every reading. Fewer ghosted slots.' },
      { icon: MessageSquareX, problem: 'A UPI number pasted into a DM looks unprofessional', solution: 'A calm, branded booking page with proper checkout — the first impression your practice deserves.' },
      { icon: Clock3, problem: 'Repeating your rates and timings to every new enquiry', solution: 'Services, prices and open slots live on one page — seekers self-serve, you stop re-typing.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Get booked around the clock', desc: 'Your reading page takes bookings while you sleep, travel, or sit with a client.' },
      { icon: Wallet, title: 'Get paid before you read', desc: 'Collect the full fee upfront via UPI, card or netbanking — with an automatic GST invoice.' },
      { icon: BellRing, title: 'End the no-show', desc: 'Reminders send themselves before every session — you never chase a seeker again.' },
      { icon: ShieldCheck, title: 'Keep readings private', desc: 'Encrypted, access-controlled, never sold. Client details and notes stay yours alone.' },
    ],
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show covers the month.',
    },
    faq: [
      { q: 'Can clients book and pay for a reading online?', a: 'Yes. Seekers pick a slot on your booking page and pay your fee at checkout through Razorpay (UPI, cards, netbanking) before the reading begins. You can charge the full fee or take an advance.' },
      { q: 'Does it handle clients in different time zones?', a: 'Yes. Your availability is shown in each client’s local time, and only your real open slots are offered — so no one books your 3am.' },
      { q: 'How does it reduce no-shows for readings?', a: 'Every booking triggers automatic email and WhatsApp reminders before the slot, and because the fee is prepaid, far fewer seekers drift away.' },
      { q: 'Do clients need an account to book?', a: 'No. They simply pick a time, enter their details and pay — no sign-up. It keeps booking fast and private.' },
      { q: 'How much does it cost?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every reading fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Stop running your practice out of your DMs.', ctaText: 'Get My Reading Link' },
      afterHow: { text: 'Your next seeker is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: Sparkles,
      urgency: 'Every missed DM is a reading someone booked elsewhere.',
      headline: 'Read the charts, not your inbox.',
      subline: 'Set up your reading page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Reading Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Reading the stars is the gift.', titleAccent: 'Scheduling shouldn’t be the curse.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like an', titleAccent: 'assistant who never sleeps.' },
      testimonials: { title: 'Built for how readings really get booked.', subtitle: 'Astrologers, tarot and numerology readers — booked, paid and reminded, without the DM chaos.' },
    },
    madeFor: "India's Astrologers & Readers",
    testimonials: [
      { quote: 'Seekers book and pay before we ever speak. The awkward money part is just gone.', name: 'Ananya V.', role: 'Vedic Astrologer', avatar: null },
      { quote: 'No more juggling DMs across time zones — my page shows my real slots in their time.', name: 'Rhea K.', role: 'Tarot Reader', avatar: null },
      { quote: 'A proper booking link looks far more serious than a UPI number in a chat.', name: 'Devi S.', role: 'Numerologist', avatar: null },
    ],
  },

  architects: {
    slug: 'architects',
    label: 'Architects & Designers',
    icon: Building2,
    theme: {
      primary: '#1f2937', accent: '#d97706', accentCta: '#b45309',
      tint: '#f7f4ef', heroFrom: '#111827', heroTo: '#1f2937',
    },
    seo: {
      title: 'Online Booking for Architects & Interior Designers | Book A Sloth',
      description:
        'Let clients book and pay for a design consultation online. Book A Sloth gives architects and interior designers a clean booking page — fees upfront, site visits reminded, calendar synced.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-architects-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Architects & Interior Designers',
      headline: 'Design the space,',
      headlineAccent: 'not the schedule.',
      headlineTail: ' Clients book a consult, pay the fee, and get reminded — automatically.',
      subline:
        'You shape how people live. Book A Sloth handles everything around the meeting — clients pick a slot, pay your consultation fee, and get reminded — so you stay on the drawing board, not the phone.',
      ctaText: 'Set Up My Studio Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Studio Kabir · Architecture',
        practiceTag: 'Architect · Interiors',
        services: [
          { name: 'Design Consultation', meta: '45 min · Online', price: '₹2,000' },
          { name: 'Site Visit & Assessment', meta: '90 min · On-site', price: '₹4,500' },
        ],
      },
    },
    socialProof: 'Trusted by independent architects and interior designers across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Client plans private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: Clock3, value: '24/7', label: 'Consults booked, even between site visits' },
      { icon: BadgePercent, value: '0%', label: 'Commission — you keep every fee' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your studio page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Consult requests scattered across calls, email and referrals', solution: 'One booking link. Clients pick a slot themselves — even while you’re on a site visit.' },
      { icon: IndianRupee, problem: 'Giving away hours of “just a quick chat” for free', solution: 'Your consultation fee is shown and collected upfront. Enquiries that book are serious.' },
      { icon: CalendarX2, problem: 'Site visits and studio meetings colliding on your calendar', solution: 'Google Calendar busy times are blocked automatically — no double-booked days.' },
      { icon: FileClock, problem: 'No-shows after you’ve blocked half a day for a visit', solution: 'Automatic email + WhatsApp reminders go out before every meeting. No-shows drop.' },
      { icon: MessageSquareX, problem: 'Sharing a GPay QR after a consult looks off-brand', solution: 'A clean, branded page with proper checkout — the first impression a design studio deserves.' },
      { icon: Clock3, problem: 'Re-explaining your availability to every new enquiry', solution: 'Your live calendar shows only your open slots — clients self-serve, you stop re-typing.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Get booked around the clock', desc: 'Your studio page takes consultation bookings while you’re on site, travelling, or at the desk.' },
      { icon: Wallet, title: 'Get paid before you advise', desc: 'Collect the consult fee or an advance upfront via UPI, card or netbanking. GST invoice automatic.' },
      { icon: ShieldCheck, title: 'Keep client work private', desc: 'Encrypted, access-controlled, never sold. Plans, briefs and notes stay yours alone.' },
      { icon: BellRing, title: 'End the no-show', desc: 'Reminders send themselves before every consult and site visit — you never chase one again.' },
    ],
    pricing: {
      hook: 'Less than a sheet of trace a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered site visit pays for the year.',
    },
    faq: [
      { q: 'Can clients book and pay for a design consultation online?', a: 'Yes. Clients pick a slot on your studio page and pay your consultation fee at checkout through Razorpay (UPI, cards, netbanking) before the meeting. You can charge the full fee or an advance.' },
      { q: 'Will it avoid clashes between site visits and studio meetings?', a: 'Yes. Book A Sloth reads your Google Calendar, so blocked site visits and existing meetings are never offered as slots, and booked slots lock instantly.' },
      { q: 'Does it work for both online consults and on-site visits?', a: 'Yes. You can offer online consultations and on-site visits as separate services, each with its own duration, price and availability.' },
      { q: 'Do clients need an account to book?', a: 'No. Clients pick a time, enter their details and pay — no sign-up. It keeps the process fast and professional.' },
      { q: 'How much does it cost?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Stop running your studio from your phone.', ctaText: 'Get My Studio Link' },
      afterHow: { text: 'Your next client is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: Building2,
      urgency: 'Every free “quick chat” is an hour you can’t bill back.',
      headline: 'Run a studio, not a switchboard.',
      subline: 'Set up your consultation booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Studio Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Designing spaces is the work.', titleAccent: 'Scheduling them shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'studio manager who never sleeps.' },
      testimonials: { title: 'Built for how a design practice really runs.', subtitle: 'Architects and interior designers — booked, paid and reminded, without the admin.' },
    },
    madeFor: "India's Architects & Designers",
    testimonials: [
      { quote: 'Paid consults filtered out the time-wasters overnight. Everyone who books now is serious.', name: 'Ar. K. Deshpande', role: 'Architect', avatar: null },
      { quote: 'Site visits and studio meetings stopped clashing the day I connected my calendar.', name: 'Meghna R.', role: 'Interior Designer', avatar: null },
      { quote: 'A clean booking link on my profile looks far more professional than a QR code.', name: 'Ar. S. Nair', role: 'Principal Architect', avatar: null },
    ],
  },

  'chartered-accountants': {
    slug: 'chartered-accountants',
    label: 'Chartered Accountants',
    icon: Landmark,
    theme: {
      primary: '#1e3a5f', accent: '#a16207', accentCta: '#845209',
      tint: '#f8f6f1', heroFrom: '#0f2740', heroTo: '#1e3a5f',
    },
    seo: {
      title: 'Online Booking for Chartered Accountants & CA Firms | Book A Sloth',
      description:
        'Let clients book and pay for a consultation online. Book A Sloth gives CAs and tax consultants a clean booking page — fees upfront, GST invoices, calendar synced around filing deadlines.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-cas-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Chartered Accountants & Tax Consultants',
      headline: 'You balance the books.',
      headlineAccent: 'We’ll balance your calendar.',
      headlineTail: ' Clients book, pay your fee upfront, and get reminded — even mid-filing-season.',
      subline:
        'You handle the numbers. Book A Sloth handles everything around the appointment — clients pick a slot, pay upfront, and get reminded — so filing season is work, not a ringing phone.',
      ctaText: 'Set Up My Practice Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'CA Rohan Mehta',
        practiceTag: 'Chartered Accountant',
        services: [
          { name: 'Tax Consultation', meta: '30 min · Online', price: '₹1,000' },
          { name: 'GST / ITR Filing Review', meta: '45 min · Online', price: '₹2,000' },
        ],
      },
    },
    socialProof: 'Trusted by independent CAs, tax consultants and accounting firms across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Client financials private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: Clock3, value: '24/7', label: 'Consults booked, even mid-deadline' },
      { icon: BadgePercent, value: '0%', label: 'Commission — you keep every fee' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your practice page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Filing season turns your phone into a full-time job', solution: 'One booking link. Clients pick a slot around your deadlines instead of calling at 10pm.' },
      { icon: IndianRupee, problem: 'Advisory time given away for free before anyone signs on', solution: 'Your consultation fee is shown and collected upfront. The free-advice drain stops.' },
      { icon: CalendarX2, problem: 'Appointments colliding with filing and audit deadlines', solution: 'Google Calendar busy times are blocked automatically — no clashes with your crunch days.' },
      { icon: FileClock, problem: 'No-shows eating billable hours during peak season', solution: 'Automatic email + WhatsApp reminders go out before every consultation. No-shows drop.' },
      { icon: MessageSquareX, problem: 'Sharing a UPI number after advice looks unprofessional', solution: 'A clean, branded page with Razorpay checkout and automatic GST invoices.' },
      { icon: Clock3, problem: 'Repeating your availability to every new client', solution: 'Your live calendar shows only open slots — clients self-serve, you stop re-typing times.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Get booked around the clock', desc: 'Your practice page takes consultations while you’re filing, in a meeting, or off the clock.' },
      { icon: Wallet, title: 'Get paid before you advise', desc: 'Collect the full fee or an advance upfront via UPI, card or netbanking. GST invoice automatic.' },
      { icon: ShieldCheck, title: 'Keep client financials private', desc: 'Encrypted, access-controlled, never sold. Client details and notes stay yours alone.' },
      { icon: BellRing, title: 'End the no-show', desc: 'Reminders send themselves before every session — you never write another follow-up.' },
    ],
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — it pays for itself in a single recovered no-show.',
    },
    faq: [
      { q: 'What is the best appointment booking software for Chartered Accountants in India?', a: 'Book A Sloth is built for Indian finance professionals — clients book consultations online, pay your fee upfront via UPI or card, your calendar stays synced around filing deadlines, and reminders send automatically. It handles GST invoicing and charges 0% commission on paid plans.' },
      { q: 'Can clients pay my consultation fee when they book?', a: 'Yes. Your fee is shown on your booking page and collected at checkout through Razorpay (UPI, cards, netbanking) before the consultation. You can charge the full fee or an advance.' },
      { q: 'Will it avoid clashes with filing and audit deadlines?', a: 'Yes. Book A Sloth reads the busy times on your Google Calendar, so blocked deadline days and existing appointments are never offered as slots. Booked slots lock instantly.' },
      { q: 'Do my clients need an account to book?', a: 'No. Clients book and pay without creating any account — they pick a slot, enter their details, and pay. Fast and professional.' },
      { q: 'How much does it cost?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Stop running your practice from your phone.', ctaText: 'Get My Booking Link' },
      afterHow: { text: 'Your next client is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: Landmark,
      urgency: 'Every missed call during filing season is a client who booked someone else.',
      headline: 'Run a practice, not an inbox.',
      subline: 'Set up your consultation booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Booking Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'The numbers are hard enough.', titleAccent: 'Client scheduling shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'clerk who never sleeps.' },
      testimonials: { title: 'Built for how a CA practice really runs.', subtitle: 'CAs, tax and accounting consultants — booked, paid and reminded, without the admin.' },
    },
    madeFor: "India's Chartered Accountants",
    testimonials: [
      { quote: 'During filing season my phone never stops. Now clients pick a slot around my deadlines.', name: 'CA Priya Nair', role: 'Chartered Accountant', avatar: null },
      { quote: 'Clients pay the consult fee before we speak. The free-advice drain finally stopped.', name: 'CA R. Menon', role: 'Tax Consultant', avatar: null },
      { quote: 'Automatic GST invoices on every booking save me a genuinely annoying chore.', name: 'CA S. Bhatt', role: 'Practising CA', avatar: null },
    ],
  },

  'sports-turf': {
    slug: 'sports-turf',
    label: 'Sports Turfs & Arenas',
    icon: Zap,
    theme: {
      primary: '#14321f', accent: '#16a34a', accentCta: '#15803d',
      tint: '#eefaf0', heroFrom: '#0b2415', heroTo: '#14321f',
    },
    seo: {
      title: 'Online Slot Booking for Sports Turfs & Arenas | Book A Sloth',
      description:
        'Let players book and pay for a turf slot online. Book A Sloth gives box-cricket, football and sports arenas a clean booking page — slots prepaid, reminders sent, no more WhatsApp scramble.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-sports-turf-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Box Cricket, Football Turfs & Sports Arenas',
      headline: 'The turf books itself.',
      headlineAccent: 'The slots pay for themselves.',
      headlineTail: ' Players reserve a slot, pay online, and get reminded — no more WhatsApp scramble.',
      subline:
        'You run the ground. Book A Sloth runs the bookings — players pick a slot, pay upfront, and get reminded — so your evenings are games, not a phone full of “is 8pm free?”.',
      ctaText: 'Set Up My Turf Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Green Field Arena',
        practiceTag: 'Box Cricket · Football',
        services: [
          { name: 'Box Cricket — 1 Hour', meta: '60 min · On-ground', price: '₹900' },
          { name: 'Football Turf — 1 Hour', meta: '60 min · On-ground', price: '₹1,200' },
        ],
      },
    },
    socialProof: 'Trusted by box-cricket, football and multi-sport turfs across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Bookings secure & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Slots booked, even after the floodlights go off' },
      { icon: IndianRupee, value: 'Prepaid', label: 'Slots paid upfront — no-shows stop blocking the ground' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your turf page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Every slot booked by a flurry of WhatsApp messages and calls', solution: 'One booking link. Players see open slots and reserve their own — your phone stops buzzing.' },
      { icon: CalendarX2, problem: 'Double-booked slots and arguments at the gate', solution: 'A slot locks the moment it’s booked — no two teams turning up for the same hour.' },
      { icon: IndianRupee, problem: 'No-shows that block a prime-time slot and pay nothing', solution: 'Players pay upfront to reserve. A held slot is a paid slot.' },
      { icon: FileClock, problem: 'Teams forgetting their slot and leaving the ground empty', solution: 'Automatic email + WhatsApp reminders go out before every booking. Fewer empty hours.' },
      { icon: MessageSquareX, problem: 'A UPI number shared in a group chat for every booking', solution: 'A clean, branded page with proper checkout — a ground that looks professionally run.' },
      { icon: Clock3, problem: 'Repeating rates and open hours to every caller', solution: 'Slots, prices and availability live on one page — players self-serve, you stop repeating.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Fill every slot, 24/7', desc: 'Your turf page takes bookings at midnight and on match days, while you run the ground.' },
      { icon: Wallet, title: 'Get paid upfront', desc: 'Players pay to reserve via UPI, card or netbanking — with an automatic GST invoice.' },
      { icon: BellRing, title: 'Cut the empty hours', desc: 'Reminders send themselves before every slot, so teams turn up and the ground stays busy.' },
      { icon: ShieldCheck, title: 'No more double-bookings', desc: 'Booked slots lock instantly — one slot, one team, no gate-side arguments.' },
    ],
    pricing: {
      hook: 'Less than one hour’s slot a month.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered prime-time slot covers it.',
    },
    faq: [
      { q: 'Can players book and pay for a turf slot online?', a: 'Yes. Players see your open slots on your booking page and pay to reserve at checkout through Razorpay (UPI, cards, netbanking). A paid slot locks instantly so it can’t be double-booked.' },
      { q: 'Will it stop two teams booking the same slot?', a: 'Yes. The moment a slot is reserved it locks and disappears from availability — no overlaps, no arguments at the gate.' },
      { q: 'How does it reduce no-shows on the ground?', a: 'Slots are prepaid, and automatic email and WhatsApp reminders go out before every booking, so far fewer prime-time hours sit empty.' },
      { q: 'Do players need an account to book a slot?', a: 'No. Players pick a slot, enter their details and pay — no sign-up. Fast enough to book from the group chat.' },
      { q: 'How much does it cost to run?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every slot fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Stop booking your turf from a group chat.', ctaText: 'Get My Turf Link' },
      afterHow: { text: 'Your next team is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: Zap,
      urgency: 'Every no-show blocks a prime-time slot that could’ve been paid for.',
      headline: 'Fill the ground, not the group chat.',
      subline: 'Set up your turf’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Turf Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Running the ground is the job.', titleAccent: 'Chasing bookings shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'gatekeeper who never sleeps.' },
      testimonials: { title: 'Built for how a turf really gets booked.', subtitle: 'Box-cricket, football and multi-sport grounds — reserved, prepaid and reminded, without the WhatsApp chaos.' },
    },
    madeFor: "India's Sports Turfs & Arenas",
    testimonials: [
      { quote: 'Prepaid slots ended our no-show problem. A blocked hour is now a paid hour.', name: 'Imran S.', role: 'Turf Owner', avatar: null },
      { quote: 'No more double-booking arguments at the gate — a booked slot just disappears.', name: 'Karthik R.', role: 'Box Cricket Arena', avatar: null },
      { quote: 'My evenings used to be 50 WhatsApp messages. Now players just book themselves.', name: 'Vivek P.', role: 'Football Turf Manager', avatar: null },
    ],
  },

  veterinarians: {
    slug: 'veterinarians',
    label: 'Veterinarians & Pet Clinics',
    icon: HeartPulse,
    theme: {
      primary: '#134e4a', accent: '#f59e0b', accentCta: '#b45309',
      tint: '#effaf7', heroFrom: '#0c3b38', heroTo: '#134e4a',
    },
    seo: {
      title: 'Online Booking for Veterinarians & Pet Clinics | Book A Sloth',
      description:
        'Let pet owners book and pay for a vet appointment online. Book A Sloth gives vets and pet clinics a clean booking page — fees upfront, reminders that cut no-shows, calendar always synced.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-veterinarians-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Veterinarians & Pet Clinics',
      headline: 'You look after the animals.',
      headlineAccent: 'We’ll look after the appointments.',
      headlineTail: ' Owners book, pay, and get reminded — fewer missed visits, calmer front desk.',
      subline:
        'You care for pets. Book A Sloth handles everything around the visit — owners pick a slot, pay upfront, and get reminded — so your day is patients, not a ringing reception.',
      ctaText: 'Set Up My Clinic Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Dr. Sameer Joshi',
        practiceTag: 'Veterinarian · Pet Clinic',
        services: [
          { name: 'Consultation & Check-up', meta: '20 min · In-clinic', price: '₹500' },
          { name: 'Vaccination Visit', meta: '15 min · In-clinic', price: '₹700' },
        ],
      },
    },
    socialProof: 'Trusted by veterinarians and pet clinics across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Pet & owner data private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Appointments booked, even after clinic hours' },
      { icon: TrendingDown, value: '1 in 5', label: 'Vet visits go no-show — reminders win them back' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your clinic page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Reception juggling calls while handling anxious pets', solution: 'One booking link. Owners pick, move or cancel their own slot — the desk stops dialling.' },
      { icon: FileClock, problem: 'Owners forgetting vaccination boosters and follow-ups', solution: 'Automatic email + WhatsApp reminders go out before every visit. Fewer lapsed boosters.' },
      { icon: IndianRupee, problem: 'Chasing the consult fee after an emotional visit', solution: 'Take the consult fee or a deposit upfront at booking. GST invoice generated automatically.' },
      { icon: CalendarX2, problem: 'Walk-ins and booked slots colliding in a small clinic', solution: 'Your Google Calendar is read live — booked slots lock instantly, no overlaps.' },
      { icon: MessageSquareX, problem: 'A GPay QR at the reception desk', solution: 'A clean, branded booking page with proper checkout — the first impression a clinic deserves.' },
      { icon: Clock3, problem: 'Repeating clinic hours to every caller', solution: 'Your live availability shows only open slots — owners self-serve, the desk stops repeating itself.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Book around the clock', desc: 'Your clinic page takes appointments after hours, on Sundays, and while you’re with a patient.' },
      { icon: Wallet, title: 'Collect before the visit', desc: 'Consult fee or deposit paid upfront via UPI, card or netbanking — with an automatic GST invoice.' },
      { icon: BellRing, title: 'Kill the no-show', desc: 'Reminders send themselves before every visit, so boosters and follow-ups don’t lapse.' },
      { icon: ShieldCheck, title: 'Keep records private', desc: 'Encrypted, access-controlled, never sold. Pet and owner details stay yours alone.' },
    ],
    pricing: {
      hook: 'Less than a strip of dewormer a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show pays for the month.',
    },
    faq: [
      { q: 'Can pet owners book and pay for a vet appointment online?', a: 'Yes. Owners pick a slot on your clinic page and pay the consult fee or a deposit at checkout through Razorpay (UPI, cards, netbanking) before they arrive. You can also offer free-to-book slots.' },
      { q: 'How does it reduce no-shows and lapsed boosters?', a: 'Every appointment triggers automatic email and WhatsApp reminders before the slot — exactly where vaccination boosters and follow-ups usually slip. Prepaid slots reduce no-shows further.' },
      { q: 'Will it stop walk-ins clashing with booked slots?', a: 'Yes. Book A Sloth reads your Google Calendar, so busy times are never offered and a booked slot locks instantly.' },
      { q: 'Do owners need an account to book?', a: 'No. Owners pick a time, enter their details and pay — no sign-up. Fast for anxious owners and repeat visits alike.' },
      { q: 'How much does it cost for a clinic?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Give your reception desk its day back.', ctaText: 'Get My Clinic Link' },
      afterHow: { text: 'Your next patient is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: HeartPulse,
      urgency: 'Every missed booster is a pet that slips through the net.',
      headline: 'Care for pets, not the phone.',
      subline: 'Set up your clinic’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Clinic Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Caring for animals is the calling.', titleAccent: 'Booking them in shouldn’t be the battle.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'receptionist who never sleeps.' },
      testimonials: { title: 'Built for how a pet clinic really runs.', subtitle: 'Vets and pet clinics — booked, paid and reminded, without the front-desk churn.' },
    },
    madeFor: "India's Veterinarians & Pet Clinics",
    testimonials: [
      { quote: 'Booster reminders go out on their own now — far fewer pets miss their shots.', name: 'Dr. S. Joshi', role: 'Veterinarian', avatar: null },
      { quote: 'My reception isn’t glued to the phone anymore, which matters when you’re holding a scared dog.', name: 'Dr. A. Rao', role: 'Pet Clinic Owner', avatar: null },
      { quote: 'Taking a deposit at booking quietly ended most of our no-shows.', name: 'Dr. N. Menon', role: 'Veterinary Surgeon', avatar: null },
    ],
  },

  pediatricians: {
    slug: 'pediatricians',
    label: 'Pediatricians & Child Clinics',
    icon: HeartPulse,
    theme: {
      primary: '#0f3b5c', accent: '#f59e0b', accentCta: '#b45309',
      tint: '#eff6fb', heroFrom: '#0a2b43', heroTo: '#0f3b5c',
    },
    seo: {
      title: 'Online Booking for Pediatricians & Child Clinics | Book A Sloth',
      description:
        'Let parents book and pay for a child’s appointment online. Book A Sloth gives pediatricians a clean booking page — vaccination reminders that cut no-shows, prepaid slots, calendar synced.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-pediatricians-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Pediatricians & Child Clinics',
      headline: 'Parents book in seconds.',
      headlineAccent: 'You get back to the kids.',
      headlineTail: ' They pick a slot, pay, and get reminded — fewer anxious phone calls at the desk.',
      subline:
        'You care for children. Book A Sloth handles everything around the visit — parents pick a slot, pay upfront, and get reminded — so your clinic is calmer and your vaccination schedule stays on track.',
      ctaText: 'Set Up My Clinic Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Dr. Kavya Menon',
        practiceTag: 'Pediatrician · Child Care',
        services: [
          { name: 'Child Consultation', meta: '20 min · In-clinic', price: '₹600' },
          { name: 'Vaccination Visit', meta: '15 min · In-clinic', price: '₹400' },
        ],
      },
    },
    socialProof: 'Trusted by pediatricians and child-care clinics across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Child & parent data private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Appointments booked, even after clinic hours' },
      { icon: TrendingDown, value: '1 in 5', label: 'Visits go no-show — reminders win them back' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your clinic page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Anxious parents clogging the phone line for a quick slot', solution: 'One booking link. Parents pick a slot themselves — the desk stops fielding every call.' },
      { icon: FileClock, problem: 'Vaccination boosters quietly slipping past their due date', solution: 'Automatic email + WhatsApp reminders go out before every visit. Fewer missed boosters.' },
      { icon: IndianRupee, problem: 'Chasing the consult fee with a crying child in the room', solution: 'Take the consult fee or a deposit upfront at booking. GST invoice generated automatically.' },
      { icon: CalendarX2, problem: 'Walk-ins and booked slots colliding in a busy clinic', solution: 'Your Google Calendar is read live — booked slots lock instantly, no overlaps.' },
      { icon: MessageSquareX, problem: 'A GPay QR taped to the reception counter', solution: 'A clean, branded booking page with proper checkout — the first impression a clinic deserves.' },
      { icon: Clock3, problem: 'Repeating clinic timings to every new parent', solution: 'Your live availability shows only open slots — parents self-serve, the desk stops repeating.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Book around the clock', desc: 'Your clinic page takes appointments after hours and on Sundays, while you’re with a patient.' },
      { icon: Wallet, title: 'Collect before the visit', desc: 'Consult fee or deposit paid upfront via UPI, card or netbanking — with an automatic GST invoice.' },
      { icon: BellRing, title: 'Keep the schedule on track', desc: 'Reminders send themselves before every visit, so vaccinations and follow-ups don’t slip.' },
      { icon: ShieldCheck, title: 'Keep records private', desc: 'Encrypted, access-controlled, never sold. Child and parent details stay yours alone.' },
    ],
    pricing: {
      hook: 'Less than a strip of syrup a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show pays for the month.',
    },
    faq: [
      { q: 'Can parents book and pay for a child’s appointment online?', a: 'Yes. Parents pick a slot on your clinic page and pay the consult fee or a deposit at checkout through Razorpay (UPI, cards, netbanking) before they arrive. You can also offer free-to-book slots.' },
      { q: 'How does it help with the vaccination schedule?', a: 'Every appointment triggers automatic email and WhatsApp reminders before the slot, which is exactly where boosters and follow-ups usually slip. Prepaid slots reduce no-shows further.' },
      { q: 'Will it stop walk-ins clashing with booked slots?', a: 'Yes. Book A Sloth reads your Google Calendar, so busy times are never offered and a booked slot locks instantly.' },
      { q: 'Do parents need an account to book?', a: 'No. Parents pick a time, enter details and pay — no sign-up. Fast when a child is unwell.' },
      { q: 'How much does it cost for a clinic?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Give your reception desk its day back.', ctaText: 'Get My Clinic Link' },
      afterHow: { text: 'Your next patient is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: HeartPulse,
      urgency: 'Every missed booster is a child who slipped through the schedule.',
      headline: 'Care for the kids, not the phone.',
      subline: 'Set up your clinic’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Clinic Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Caring for children is the work.', titleAccent: 'Booking them in shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'receptionist who never sleeps.' },
      testimonials: { title: 'Built for how a child clinic really runs.', subtitle: 'Pediatricians and child-care clinics — booked, paid and reminded, without the front-desk churn.' },
    },
    madeFor: "India's Pediatricians & Child Clinics",
    testimonials: [
      { quote: 'Booster reminders go out automatically now — far fewer children miss their shots.', name: 'Dr. K. Menon', role: 'Pediatrician', avatar: null },
      { quote: 'The phone used to ring non-stop with slot requests. Parents just book themselves now.', name: 'Dr. A. Shah', role: 'Child Clinic', avatar: null },
      { quote: 'Taking a deposit at booking quietly ended most of our no-shows.', name: 'Dr. R. Pillai', role: 'Pediatric Consultant', avatar: null },
    ],
  },

  gynecologists: {
    slug: 'gynecologists',
    label: 'Gynecologists & Clinics',
    icon: HeartPulse,
    theme: {
      primary: '#134e3a', accent: '#e11d74', accentCta: '#be185d',
      tint: '#fdf2f7', heroFrom: '#0b3a2b', heroTo: '#134e3a',
    },
    seo: {
      title: 'Online Booking for Gynecologists & Women’s Clinics | Book A Sloth',
      description:
        'Let patients book and pay for an appointment online — discreetly. Book A Sloth gives gynecologists a private booking page with reminders that cut no-shows, prepaid slots and a synced calendar.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-gynecologists-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Gynecologists & Women’s Health Clinics',
      headline: 'Booked discreetly.',
      headlineAccent: 'Reminded automatically.',
      headlineTail: ' Patients pick a slot, pay, and get a private reminder — no awkward front-desk call.',
      subline:
        'You care for your patients. Book A Sloth handles everything around the visit — they book a slot privately, pay upfront, and get reminded — so your clinic is calmer and bookings stay confidential.',
      ctaText: 'Set Up My Clinic Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Dr. Ritu Sharma',
        practiceTag: 'Gynecologist · Women’s Health',
        services: [
          { name: 'Consultation', meta: '20 min · In-clinic', price: '₹700' },
          { name: 'Online Follow-up', meta: '15 min · Online', price: '₹400' },
        ],
      },
    },
    socialProof: 'Trusted by gynecologists and women’s-health clinics across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Patient data private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Appointments booked, discreetly, any hour' },
      { icon: TrendingDown, value: '1 in 5', label: 'Visits go no-show — reminders win them back' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your clinic page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Patients uncomfortable explaining why they’re calling', solution: 'One private booking link. Patients pick a slot themselves — no front-desk conversation needed.' },
      { icon: FileClock, problem: 'Follow-ups and routine checks quietly slipping', solution: 'Automatic, discreet email + WhatsApp reminders go out before every visit. Fewer missed follow-ups.' },
      { icon: IndianRupee, problem: 'Chasing the consult fee after a sensitive visit', solution: 'Take the fee or a deposit upfront at booking. GST invoice generated automatically.' },
      { icon: CalendarX2, problem: 'Walk-ins colliding with booked appointments', solution: 'Your Google Calendar is read live — booked slots lock instantly, no overlaps.' },
      { icon: MessageSquareX, problem: 'A GPay QR at a busy reception desk', solution: 'A clean, branded booking page with proper checkout — private and professional.' },
      { icon: Clock3, problem: 'Repeating clinic timings to every caller', solution: 'Your live availability shows only open slots — patients self-serve, the desk stops repeating.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Book around the clock', desc: 'Your clinic page takes appointments after hours and on Sundays, discreetly, while you work.' },
      { icon: Wallet, title: 'Collect before the visit', desc: 'Consult fee or deposit paid upfront via UPI, card or netbanking — with an automatic GST invoice.' },
      { icon: BellRing, title: 'Keep follow-ups on track', desc: 'Discreet reminders send themselves before every visit, so routine checks don’t slip.' },
      { icon: ShieldCheck, title: 'Keep it private', desc: 'Encrypted, access-controlled, never sold. Patient details and notes stay yours alone.' },
    ],
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show pays for the month.',
    },
    faq: [
      { q: 'Can patients book a gynecology appointment privately online?', a: 'Yes. Patients pick a slot on your booking page and pay at checkout through Razorpay (UPI, cards, netbanking) — without explaining anything to a receptionist. Reminders are worded discreetly.' },
      { q: 'How does it reduce no-shows for follow-ups?', a: 'Every appointment triggers automatic email and WhatsApp reminders before the slot, and prepaid slots reduce no-shows further — which matters most for routine follow-ups.' },
      { q: 'Will it stop walk-ins clashing with booked slots?', a: 'Yes. Book A Sloth reads your Google Calendar, so busy times are never offered and a booked slot locks instantly.' },
      { q: 'Do patients need an account to book?', a: 'No. Patients pick a time, enter their details and pay — no sign-up. Fast and private.' },
      { q: 'How much does it cost for a clinic?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Give your patients a private way to book.', ctaText: 'Get My Clinic Link' },
      afterHow: { text: 'Your next patient is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: HeartPulse,
      urgency: 'Every missed follow-up is a patient who meant to come back.',
      headline: 'Care for your patients, not the phone.',
      subline: 'Set up your clinic’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Clinic Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Women’s health is the work.', titleAccent: 'Booking it shouldn’t be the barrier.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'receptionist who never sleeps.' },
      testimonials: { title: 'Built for how a women’s clinic really runs.', subtitle: 'Gynecologists and women’s-health clinics — booked, paid and reminded, privately.' },
    },
    madeFor: "India's Gynecologists & Clinics",
    testimonials: [
      { quote: 'Patients book privately without having to explain anything to the desk. It matters here.', name: 'Dr. R. Sharma', role: 'Gynecologist', avatar: null },
      { quote: 'Routine follow-ups stopped slipping once reminders went out on their own.', name: 'Dr. A. Iyer', role: 'Women’s Health Clinic', avatar: null },
      { quote: 'Taking a deposit at booking quietly ended most of our no-shows.', name: 'Dr. S. Nair', role: 'Consultant Gynecologist', avatar: null },
    ],
  },

  dermatologists: {
    slug: 'dermatologists',
    label: 'Dermatologists & Skin Clinics',
    icon: Sparkles,
    theme: {
      primary: '#3b2a4d', accent: '#db2777', accentCta: '#be185d',
      tint: '#fdf2f8', heroFrom: '#271a35', heroTo: '#3b2a4d',
    },
    seo: {
      title: 'Online Booking for Dermatologists & Skin Clinics | Book A Sloth',
      description:
        'Let patients book and pay for a skin consultation online. Book A Sloth gives dermatologists and skin clinics a clean booking page — prepaid slots, reminders that cut no-shows, synced calendar.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-dermatologists-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Dermatologists & Skin Clinics',
      headline: 'Clear skin runs on routine.',
      headlineAccent: 'So does a full clinic.',
      headlineTail: ' Patients book, pay, and get reminded — so follow-up courses don’t fall off.',
      subline:
        'You treat the skin. Book A Sloth handles everything around the appointment — patients pick a slot, pay upfront, and get reminded — so multi-session courses actually get finished.',
      ctaText: 'Set Up My Clinic Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Dr. Ananya Desai',
        practiceTag: 'Dermatologist · Skin & Hair',
        services: [
          { name: 'Skin Consultation', meta: '20 min · In-clinic', price: '₹800' },
          { name: 'Follow-up Session', meta: '15 min · In-clinic', price: '₹500' },
        ],
      },
    },
    socialProof: 'Trusted by dermatologists and skin & hair clinics across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Patient data private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Appointments booked, even after clinic hours' },
      { icon: TrendingDown, value: '1 in 5', label: 'Visits go no-show — reminders win them back' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your clinic page' },
    ],
    painPoints: [
      { icon: FileClock, problem: 'Patients dropping off halfway through a treatment course', solution: 'Automatic email + WhatsApp reminders go out before every session. Courses get finished.' },
      { icon: PhoneOff, problem: 'Reception fielding calls for consults and follow-ups all day', solution: 'One booking link. Patients pick, move or cancel their own slot — the desk stops dialling.' },
      { icon: IndianRupee, problem: 'Chasing session fees across a multi-visit course', solution: 'Take each session’s fee or a deposit upfront at booking. GST invoices generated automatically.' },
      { icon: CalendarX2, problem: 'Walk-ins colliding with booked procedure slots', solution: 'Your Google Calendar is read live — booked slots lock instantly, no overlaps.' },
      { icon: MessageSquareX, problem: 'A GPay QR at the reception desk of a premium clinic', solution: 'A clean, branded booking page with proper checkout — the polish a skin clinic deserves.' },
      { icon: Clock3, problem: 'Repeating clinic timings to every caller', solution: 'Your live availability shows only open slots — patients self-serve, the desk stops repeating.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Book around the clock', desc: 'Your clinic page takes consults and follow-ups after hours, while you’re with a patient.' },
      { icon: Wallet, title: 'Collect before the chair', desc: 'Consult or session fee paid upfront via UPI, card or netbanking — with an automatic GST invoice.' },
      { icon: BellRing, title: 'Finish the course', desc: 'Reminders send themselves before every session, so multi-visit treatments don’t drop off.' },
      { icon: ShieldCheck, title: 'Keep records private', desc: 'Encrypted, access-controlled, never sold. Patient details and notes stay yours alone.' },
    ],
    pricing: {
      hook: 'Less than a sample sachet a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show pays for the month.',
    },
    faq: [
      { q: 'Can patients book and pay for a skin consultation online?', a: 'Yes. Patients pick a slot on your clinic page and pay the consult or session fee at checkout through Razorpay (UPI, cards, netbanking) before they arrive.' },
      { q: 'How does it help multi-session treatment courses get finished?', a: 'Automatic email and WhatsApp reminders go out before every session, and prepaid slots reduce drop-off — so courses are far more likely to be completed.' },
      { q: 'Will it stop walk-ins clashing with booked procedures?', a: 'Yes. Book A Sloth reads your Google Calendar, so busy times are never offered and a booked slot locks instantly.' },
      { q: 'Do patients need an account to book?', a: 'No. Patients pick a time, enter details and pay — no sign-up.' },
      { q: 'How much does it cost for a clinic?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Give your reception desk its day back.', ctaText: 'Get My Clinic Link' },
      afterHow: { text: 'Your next patient is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: Sparkles,
      urgency: 'Every dropped course is revenue — and a result — left unfinished.',
      headline: 'Treat the skin, not the phone.',
      subline: 'Set up your clinic’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Clinic Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Treating skin is the craft.', titleAccent: 'Booking it shouldn’t be the chore.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'receptionist who never sleeps.' },
      testimonials: { title: 'Built for how a skin clinic really runs.', subtitle: 'Dermatologists and skin & hair clinics — booked, paid and reminded, without the front-desk churn.' },
    },
    madeFor: "India's Dermatologists & Skin Clinics",
    testimonials: [
      { quote: 'Reminders mean patients actually finish their treatment courses now.', name: 'Dr. A. Desai', role: 'Dermatologist', avatar: null },
      { quote: 'Prepaid sessions ended the awkward fee-chasing between visits.', name: 'Dr. R. Kapoor', role: 'Skin & Hair Clinic', avatar: null },
      { quote: 'A branded booking page looks right for a premium clinic — a QR code never did.', name: 'Dr. M. Shah', role: 'Consultant Dermatologist', avatar: null },
    ],
  },

  physiotherapists: {
    slug: 'physiotherapists',
    label: 'Physiotherapists & Clinics',
    icon: HeartPulse,
    theme: {
      primary: '#0e3b4a', accent: '#f97316', accentCta: '#c2410c',
      tint: '#fff5ee', heroFrom: '#082c38', heroTo: '#0e3b4a',
    },
    seo: {
      title: 'Online Booking for Physiotherapists & Rehab Clinics | Book A Sloth',
      description:
        'Let patients book and pay for a physio session online. Book A Sloth gives physiotherapists a clean booking page — session packages, reminders that keep recovery on track, synced calendar.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-physiotherapists-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Physiotherapists & Rehab Clinics',
      headline: 'Recovery runs on routine.',
      headlineAccent: 'So should the booking.',
      headlineTail: ' Patients book their sessions, pay, and get reminded — so recovery plans don’t stall.',
      subline:
        'You rebuild people. Book A Sloth handles everything around the session — patients pick a slot, pay upfront, and get reminded — so recovery packages actually get finished.',
      ctaText: 'Set Up My Clinic Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Dr. Aarav Nair',
        practiceTag: 'Physiotherapist · Rehab',
        services: [
          { name: 'Assessment & First Session', meta: '45 min · In-clinic', price: '₹800' },
          { name: 'Therapy Session', meta: '30 min · In-clinic', price: '₹500' },
        ],
      },
    },
    socialProof: 'Trusted by physiotherapists and rehab clinics across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Patient data private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Sessions booked, even after clinic hours' },
      { icon: TrendingDown, value: '1 in 5', label: 'Sessions go no-show — reminders win them back' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your clinic page' },
    ],
    painPoints: [
      { icon: FileClock, problem: 'Patients skipping sessions and stalling their own recovery', solution: 'Automatic email + WhatsApp reminders go out before every session. Fewer skipped visits.' },
      { icon: PhoneOff, problem: 'Rebooking the next session by phone, every single time', solution: 'One booking link. Patients book their whole series themselves — no back-and-forth.' },
      { icon: IndianRupee, problem: 'Chasing fees across a long course of sessions', solution: 'Take each session’s fee or a package deposit upfront. GST invoices generated automatically.' },
      { icon: CalendarX2, problem: 'Home visits and clinic sessions clashing on your day', solution: 'Your Google Calendar is read live — booked slots lock instantly, no overlaps.' },
      { icon: MessageSquareX, problem: 'A GPay QR taped to the treatment-room wall', solution: 'A clean, branded booking page with proper checkout — the polish your clinic deserves.' },
      { icon: Clock3, problem: 'Repeating your slots to every patient after each session', solution: 'Your live availability shows only open slots — patients self-serve the next one.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Book the whole series', desc: 'Patients book their next sessions in one go, around the clock, while you’re treating.' },
      { icon: Wallet, title: 'Collect before the session', desc: 'Session fee or package deposit paid upfront via UPI, card or netbanking — GST invoice automatic.' },
      { icon: BellRing, title: 'Keep recovery on track', desc: 'Reminders send themselves before every session, so recovery plans don’t stall.' },
      { icon: ShieldCheck, title: 'Keep records private', desc: 'Encrypted, access-controlled, never sold. Patient details and notes stay yours alone.' },
    ],
    pricing: {
      hook: 'Less than a roll of tape a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show pays for the month.',
    },
    faq: [
      { q: 'Can patients book and pay for physio sessions online?', a: 'Yes. Patients pick a slot on your clinic page and pay the session fee or a package deposit at checkout through Razorpay (UPI, cards, netbanking) before they arrive.' },
      { q: 'Can patients book a whole course of sessions at once?', a: 'Yes. Patients can book their series of sessions in one go, around your availability, instead of rebooking by phone each time.' },
      { q: 'How does it keep recovery plans on track?', a: 'Automatic email and WhatsApp reminders go out before every session, and prepaid slots reduce drop-off — so courses are far more likely to be completed.' },
      { q: 'Do patients need an account to book?', a: 'No. Patients pick a time, enter details and pay — no sign-up.' },
      { q: 'How much does it cost for a clinic?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Stop rebooking every session by phone.', ctaText: 'Get My Clinic Link' },
      afterHow: { text: 'Your next patient is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: HeartPulse,
      urgency: 'Every skipped session is recovery that stalls.',
      headline: 'Rebuild people, not your schedule.',
      subline: 'Set up your clinic’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Clinic Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Rebuilding people is the work.', titleAccent: 'Rebooking them shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'front desk that never sleeps.' },
      testimonials: { title: 'Built for how a rehab clinic really runs.', subtitle: 'Physiotherapists and rehab clinics — booked, paid and reminded, without the admin.' },
    },
    madeFor: "India's Physiotherapists & Clinics",
    testimonials: [
      { quote: 'Patients book their whole series now — I stopped rebooking by phone after every session.', name: 'Dr. A. Nair', role: 'Physiotherapist', avatar: null },
      { quote: 'Reminders cut our skipped sessions sharply, and recovery plans actually get finished.', name: 'Dr. R. Menon', role: 'Rehab Clinic', avatar: null },
      { quote: 'Package deposits upfront ended the awkward fee conversations mid-course.', name: 'Dr. S. Rao', role: 'Sports Physio', avatar: null },
    ],
  },

  'ent-specialists': {
    slug: 'ent-specialists',
    label: 'ENT Specialists & Clinics',
    icon: Stethoscope,
    theme: {
      primary: '#0f3550', accent: '#0ea5e9', accentCta: '#0369a1',
      tint: '#eef7fc', heroFrom: '#092536', heroTo: '#0f3550',
    },
    seo: {
      title: 'Online Booking for ENT Specialists & Clinics | Book A Sloth',
      description:
        'Let patients book and pay for an ENT consultation online. Book A Sloth gives ENT specialists a clean booking page — prepaid slots, reminders that cut no-shows and a calendar that never double-books.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-ent-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For ENT Specialists & Clinics',
      headline: 'Blocked ears shouldn’t mean',
      headlineAccent: 'a blocked phone line.',
      headlineTail: ' Patients book, pay, and get reminded — your front desk clears up.',
      subline:
        'You treat ear, nose and throat. Book A Sloth handles everything around the appointment — patients pick a slot, pay upfront, and get reminded — so your clinic runs quieter and fuller.',
      ctaText: 'Set Up My Clinic Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Dr. Imran Qureshi',
        practiceTag: 'ENT Specialist',
        services: [
          { name: 'ENT Consultation', meta: '20 min · In-clinic', price: '₹700' },
          { name: 'Follow-up Visit', meta: '15 min · In-clinic', price: '₹400' },
        ],
      },
    },
    socialProof: 'Trusted by ENT specialists and clinics across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Patient data private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Appointments booked, even after clinic hours' },
      { icon: TrendingDown, value: '1 in 5', label: 'Visits go no-show — reminders win them back' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your clinic page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Reception on the phone all day booking consults', solution: 'One booking link. Patients pick, move or cancel their own slot — the desk stops dialling.' },
      { icon: FileClock, problem: 'Post-procedure follow-ups quietly slipping', solution: 'Automatic email + WhatsApp reminders go out before every visit. Fewer missed follow-ups.' },
      { icon: IndianRupee, problem: 'Chasing the consult fee after the visit', solution: 'Take the consult fee or a deposit upfront at booking. GST invoice generated automatically.' },
      { icon: CalendarX2, problem: 'Walk-ins colliding with booked procedure slots', solution: 'Your Google Calendar is read live — booked slots lock instantly, no overlaps.' },
      { icon: MessageSquareX, problem: 'A GPay QR at the reception desk', solution: 'A clean, branded booking page with proper checkout — the first impression a clinic deserves.' },
      { icon: Clock3, problem: 'Repeating clinic timings to every caller', solution: 'Your live availability shows only open slots — patients self-serve, the desk stops repeating.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Book around the clock', desc: 'Your clinic page takes consults and follow-ups after hours, while you’re with a patient.' },
      { icon: Wallet, title: 'Collect before the visit', desc: 'Consult fee or deposit paid upfront via UPI, card or netbanking — with an automatic GST invoice.' },
      { icon: BellRing, title: 'Keep follow-ups on track', desc: 'Reminders send themselves before every visit, so post-procedure checks don’t slip.' },
      { icon: ShieldCheck, title: 'Keep records private', desc: 'Encrypted, access-controlled, never sold. Patient details and notes stay yours alone.' },
    ],
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show pays for the month.',
    },
    faq: [
      { q: 'Can patients book and pay for an ENT consultation online?', a: 'Yes. Patients pick a slot on your clinic page and pay the consult fee or a deposit at checkout through Razorpay (UPI, cards, netbanking) before they arrive.' },
      { q: 'How does it reduce no-shows and missed follow-ups?', a: 'Every appointment triggers automatic email and WhatsApp reminders before the slot, and prepaid slots reduce no-shows further.' },
      { q: 'Will it stop walk-ins clashing with booked procedures?', a: 'Yes. Book A Sloth reads your Google Calendar, so busy times are never offered and a booked slot locks instantly.' },
      { q: 'Do patients need an account to book?', a: 'No. Patients pick a time, enter details and pay — no sign-up.' },
      { q: 'How much does it cost for a clinic?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Give your reception desk its day back.', ctaText: 'Get My Clinic Link' },
      afterHow: { text: 'Your next patient is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: Stethoscope,
      urgency: 'Every missed follow-up is a patient who didn’t finish treatment.',
      headline: 'Treat patients, not the phone.',
      subline: 'Set up your clinic’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Clinic Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'ENT care is the work.', titleAccent: 'Booking it shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'receptionist who never sleeps.' },
      testimonials: { title: 'Built for how an ENT clinic really runs.', subtitle: 'ENT specialists and clinics — booked, paid and reminded, without the front-desk churn.' },
    },
    madeFor: "India's ENT Specialists",
    testimonials: [
      { quote: 'The phone used to ring all day with slot requests. Patients just book themselves now.', name: 'Dr. I. Qureshi', role: 'ENT Specialist', avatar: null },
      { quote: 'Post-procedure follow-ups stopped slipping once reminders went out automatically.', name: 'Dr. A. Rao', role: 'ENT Clinic', avatar: null },
      { quote: 'Taking a deposit at booking quietly ended most of our no-shows.', name: 'Dr. S. Menon', role: 'Consultant ENT Surgeon', avatar: null },
    ],
  },

  ophthalmologists: {
    slug: 'ophthalmologists',
    label: 'Ophthalmologists & Eye Clinics',
    icon: Stethoscope,
    theme: {
      primary: '#1e2a52', accent: '#6366f1', accentCta: '#4338ca',
      tint: '#f0f1fb', heroFrom: '#131b3a', heroTo: '#1e2a52',
    },
    seo: {
      title: 'Online Booking for Ophthalmologists & Eye Clinics | Book A Sloth',
      description:
        'Let patients book and pay for an eye appointment online. Book A Sloth gives ophthalmologists and eye clinics a clean booking page — prepaid slots, reminders that cut no-shows, synced calendar.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-ophthalmologists-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Ophthalmologists & Eye Clinics',
      headline: 'Eye tests booked',
      headlineAccent: 'at a glance.',
      headlineTail: ' Patients pick a slot, pay, and get reminded — your clinic runs clearer.',
      subline:
        'You look after sight. Book A Sloth handles everything around the appointment — patients pick a slot, pay upfront, and get reminded — so your clinic runs full without a ringing front desk.',
      ctaText: 'Set Up My Clinic Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Dr. Leela Krishnan',
        practiceTag: 'Ophthalmologist · Eye Care',
        services: [
          { name: 'Eye Consultation', meta: '20 min · In-clinic', price: '₹600' },
          { name: 'Vision Test & Check-up', meta: '30 min · In-clinic', price: '₹400' },
        ],
      },
    },
    socialProof: 'Trusted by ophthalmologists and eye clinics across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Patient data private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Appointments booked, even after clinic hours' },
      { icon: TrendingDown, value: '1 in 5', label: 'Visits go no-show — reminders win them back' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your clinic page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Reception on the phone all day booking eye tests', solution: 'One booking link. Patients pick, move or cancel their own slot — the desk stops dialling.' },
      { icon: FileClock, problem: 'Post-op and review appointments quietly slipping', solution: 'Automatic email + WhatsApp reminders go out before every visit. Fewer missed reviews.' },
      { icon: IndianRupee, problem: 'Chasing the consult fee after the visit', solution: 'Take the consult fee or a deposit upfront at booking. GST invoice generated automatically.' },
      { icon: CalendarX2, problem: 'Walk-ins colliding with booked procedure slots', solution: 'Your Google Calendar is read live — booked slots lock instantly, no overlaps.' },
      { icon: MessageSquareX, problem: 'A GPay QR at the reception desk', solution: 'A clean, branded booking page with proper checkout — the first impression a clinic deserves.' },
      { icon: Clock3, problem: 'Repeating clinic timings to every caller', solution: 'Your live availability shows only open slots — patients self-serve, the desk stops repeating.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Book around the clock', desc: 'Your clinic page takes consults and reviews after hours, while you’re with a patient.' },
      { icon: Wallet, title: 'Collect before the visit', desc: 'Consult fee or deposit paid upfront via UPI, card or netbanking — with an automatic GST invoice.' },
      { icon: BellRing, title: 'Keep reviews on track', desc: 'Reminders send themselves before every visit, so post-op and review checks don’t slip.' },
      { icon: ShieldCheck, title: 'Keep records private', desc: 'Encrypted, access-controlled, never sold. Patient details and notes stay yours alone.' },
    ],
    pricing: {
      hook: 'Less than a cleaning-cloth a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show pays for the month.',
    },
    faq: [
      { q: 'Can patients book and pay for an eye appointment online?', a: 'Yes. Patients pick a slot on your clinic page and pay the consult fee or a deposit at checkout through Razorpay (UPI, cards, netbanking) before they arrive.' },
      { q: 'How does it reduce no-shows and missed reviews?', a: 'Every appointment triggers automatic email and WhatsApp reminders before the slot, and prepaid slots reduce no-shows further — which matters most for post-op reviews.' },
      { q: 'Will it stop walk-ins clashing with booked procedures?', a: 'Yes. Book A Sloth reads your Google Calendar, so busy times are never offered and a booked slot locks instantly.' },
      { q: 'Do patients need an account to book?', a: 'No. Patients pick a time, enter details and pay — no sign-up.' },
      { q: 'How much does it cost for a clinic?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Give your reception desk its day back.', ctaText: 'Get My Clinic Link' },
      afterHow: { text: 'Your next patient is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: Stethoscope,
      urgency: 'Every missed review is a patient who didn’t finish care.',
      headline: 'Look after sight, not the phone.',
      subline: 'Set up your clinic’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Clinic Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Eye care is the work.', titleAccent: 'Booking it shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'receptionist who never sleeps.' },
      testimonials: { title: 'Built for how an eye clinic really runs.', subtitle: 'Ophthalmologists and eye clinics — booked, paid and reminded, without the front-desk churn.' },
    },
    madeFor: "India's Ophthalmologists & Eye Clinics",
    testimonials: [
      { quote: 'Reviews stopped slipping once reminders went out on their own.', name: 'Dr. L. Krishnan', role: 'Ophthalmologist', avatar: null },
      { quote: 'The phone used to ring all day for eye tests. Patients just book themselves now.', name: 'Dr. A. Pillai', role: 'Eye Clinic', avatar: null },
      { quote: 'Taking a deposit at booking quietly ended most of our no-shows.', name: 'Dr. S. Rao', role: 'Consultant Ophthalmologist', avatar: null },
    ],
  },

  nutritionists: {
    slug: 'nutritionists',
    label: 'Nutritionists & Dietitians',
    icon: ClipboardList,
    theme: {
      primary: '#14432a', accent: '#65a30d', accentCta: '#4d7c0f',
      tint: '#f3f9ec', heroFrom: '#0c3119', heroTo: '#14432a',
    },
    seo: {
      title: 'Online Booking for Nutritionists & Dietitians | Book A Sloth',
      description:
        'Let clients book and pay for a consultation online. Book A Sloth gives nutritionists and dietitians a clean booking page — plan check-ins reminded, slots prepaid, calendar always synced.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-nutritionists-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Nutritionists & Dietitians',
      headline: 'Plans that actually get followed.',
      headlineAccent: 'Because the check-ins book themselves.',
      headlineTail: ' Clients book, pay, and get reminded — so follow-ups don’t fall off in week three.',
      subline:
        'You build the plan. Book A Sloth handles everything around the check-in — clients pick a slot, pay upfront, and get reminded — so programmes actually get finished.',
      ctaText: 'Set Up My Practice Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Sana · Clinical Nutritionist',
        practiceTag: 'Nutrition · Diet Plans',
        services: [
          { name: 'Diet Consultation', meta: '45 min · Online', price: '₹1,200' },
          { name: 'Fortnightly Check-in', meta: '20 min · Online', price: '₹500' },
        ],
      },
    },
    socialProof: 'Trusted by clinical nutritionists and dietitians across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Client data private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: Clock3, value: '24/7', label: 'Consults booked, around your clients’ lives' },
      { icon: BadgePercent, value: '0%', label: 'Commission — you keep every fee' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your practice page' },
    ],
    painPoints: [
      { icon: FileClock, problem: 'Clients drifting off the plan by the third week', solution: 'Automatic email + WhatsApp reminders go out before every check-in. Programmes stay on track.' },
      { icon: PhoneOff, problem: 'Rebooking each check-in over WhatsApp, every time', solution: 'One booking link. Clients book their whole series of check-ins themselves.' },
      { icon: IndianRupee, problem: 'Chasing fees across a multi-month programme', solution: 'Take each session’s fee or a package deposit upfront. GST invoices generated automatically.' },
      { icon: CalendarX2, problem: 'Consults clashing across time zones and busy evenings', solution: 'Your live availability shows only your real open slots, in the client’s own time.' },
      { icon: MessageSquareX, problem: 'A UPI number shared after every call', solution: 'A clean, branded booking page with proper checkout — the polish your practice deserves.' },
      { icon: Clock3, problem: 'Repeating your slots to every client after each session', solution: 'Your live availability shows only open slots — clients self-serve the next check-in.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Book the whole programme', desc: 'Clients book their series of check-ins in one go, around the clock, while you work with others.' },
      { icon: Wallet, title: 'Get paid upfront', desc: 'Session fee or package deposit paid upfront via UPI, card or netbanking — GST invoice automatic.' },
      { icon: BellRing, title: 'Keep clients on plan', desc: 'Reminders send themselves before every check-in, so programmes don’t fall off.' },
      { icon: ShieldCheck, title: 'Keep client data private', desc: 'Encrypted, access-controlled, never sold. Client details and notes stay yours alone.' },
    ],
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show covers the month.',
    },
    faq: [
      { q: 'Can clients book and pay for a nutrition consultation online?', a: 'Yes. Clients pick a slot on your practice page and pay your fee or a package deposit at checkout through Razorpay (UPI, cards, netbanking) before the session.' },
      { q: 'Can clients book a whole programme of check-ins at once?', a: 'Yes. Clients can book their series of check-ins in one go, around your availability, instead of rebooking over WhatsApp each time.' },
      { q: 'How does it keep clients on their plan?', a: 'Automatic email and WhatsApp reminders go out before every check-in, and prepaid slots reduce drop-off — so programmes are far more likely to be completed.' },
      { q: 'Do clients need an account to book?', a: 'No. Clients pick a time, enter details and pay — no sign-up.' },
      { q: 'How much does it cost?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Stop rebooking every check-in over WhatsApp.', ctaText: 'Get My Booking Link' },
      afterHow: { text: 'Your next client is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: ClipboardList,
      urgency: 'Every skipped check-in is a plan that quietly stalls.',
      headline: 'Build the plan, not the schedule.',
      subline: 'Set up your consultation page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Booking Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Building the plan is the work.', titleAccent: 'Chasing the check-ins shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like an', titleAccent: 'assistant who never sleeps.' },
      testimonials: { title: 'Built for how a nutrition practice really runs.', subtitle: 'Nutritionists and dietitians — booked, paid and reminded, without the admin.' },
    },
    madeFor: "India's Nutritionists & Dietitians",
    testimonials: [
      { quote: 'Clients actually finish their programmes now — the check-in reminders do the nudging.', name: 'Sana M.', role: 'Clinical Nutritionist', avatar: null },
      { quote: 'They book the whole series up front. I stopped chasing the next slot over chat.', name: 'Pooja R.', role: 'Dietitian', avatar: null },
      { quote: 'Package deposits ended the awkward fee conversations mid-programme.', name: 'Aditi S.', role: 'Sports Nutritionist', avatar: null },
    ],
  },

  'life-coaches': {
    slug: 'life-coaches',
    label: 'Life & Career Coaches',
    icon: Target,
    theme: {
      primary: '#3a2550', accent: '#f59e0b', accentCta: '#b45309',
      tint: '#f7f3fb', heroFrom: '#261636', heroTo: '#3a2550',
    },
    seo: {
      title: 'Online Booking for Life & Career Coaches | Book A Sloth',
      description:
        'Let clients book and pay for a coaching session online. Book A Sloth gives life and career coaches a clean booking page — session packages, reminders, prepaid slots and a synced calendar.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-life-coaches-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Life, Career & Executive Coaches',
      headline: 'Clients book the next session.',
      headlineAccent: 'You stay in the conversation.',
      headlineTail: ' They pick a slot, pay, and get reminded — momentum doesn’t stall between calls.',
      subline:
        'You do the deep work. Book A Sloth handles everything around the session — clients pick a slot, pay upfront, and get reminded — so your week is coaching, not calendar admin.',
      ctaText: 'Set Up My Coaching Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Arjun · Career Coach',
        practiceTag: 'Coaching · 1:1 Sessions',
        services: [
          { name: 'Discovery Session', meta: '45 min · Online', price: '₹1,500' },
          { name: 'Coaching Session', meta: '60 min · Online', price: '₹2,500' },
        ],
      },
    },
    socialProof: 'Trusted by life, career and executive coaches across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Sessions private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: Clock3, value: '24/7', label: 'Sessions booked, across every time zone' },
      { icon: BadgePercent, value: '0%', label: 'Commission — you keep every fee' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your coaching page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Booking sessions over a tangle of DMs and emails', solution: 'One booking link. Clients pick their own slot — you stop playing calendar tennis.' },
      { icon: IndianRupee, problem: 'Awkward money talk before a vulnerable session', solution: 'Your fee is paid upfront at booking. The session starts on the work, not the payment.' },
      { icon: CalendarX2, problem: 'Clients across time zones booking your off-hours', solution: 'Your live availability shows only your real open slots, in the client’s own time.' },
      { icon: FileClock, problem: 'Momentum lost when clients forget the next session', solution: 'Automatic email + WhatsApp reminders go out before every session. Fewer gaps between calls.' },
      { icon: MessageSquareX, problem: 'A UPI number shared after every call', solution: 'A clean, branded booking page with proper checkout — the polish your practice deserves.' },
      { icon: Clock3, problem: 'Re-explaining your availability to every new client', solution: 'Your live calendar shows only open slots — clients self-serve the next session.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Book the whole package', desc: 'Clients book their series of sessions in one go, around the clock, in their own time zone.' },
      { icon: Wallet, title: 'Get paid before you coach', desc: 'Session fee or package deposit paid upfront via UPI, card or netbanking — GST invoice automatic.' },
      { icon: BellRing, title: 'Keep the momentum', desc: 'Reminders send themselves before every session, so clients don’t drift between calls.' },
      { icon: ShieldCheck, title: 'Keep sessions private', desc: 'Encrypted, access-controlled, never sold. Client details and notes stay yours alone.' },
    ],
    pricing: {
      hook: 'Less than a cup of coffee a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show covers the month.',
    },
    faq: [
      { q: 'Can clients book and pay for a coaching session online?', a: 'Yes. Clients pick a slot on your coaching page and pay your fee or a package deposit at checkout through Razorpay (UPI, cards, netbanking) before the session.' },
      { q: 'Can clients book a package of sessions at once?', a: 'Yes. Clients can book their series of sessions in one go, around your availability and in their own time zone.' },
      { q: 'How does it keep clients from drifting between sessions?', a: 'Automatic email and WhatsApp reminders go out before every session, and prepaid packages keep clients committed — so momentum holds between calls.' },
      { q: 'Do clients need an account to book?', a: 'No. Clients pick a time, enter details and pay — no sign-up.' },
      { q: 'How much does it cost?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Stop booking sessions out of your DMs.', ctaText: 'Get My Coaching Link' },
      afterHow: { text: 'Your next client is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: Target,
      urgency: 'Every gap between sessions is momentum lost.',
      headline: 'Coach people, not your calendar.',
      subline: 'Set up your coaching page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Coaching Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'The coaching is the gift.', titleAccent: 'The scheduling shouldn’t be the grind.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like an', titleAccent: 'assistant who never sleeps.' },
      testimonials: { title: 'Built for how coaching really gets booked.', subtitle: 'Life, career and executive coaches — booked, paid and reminded, without the admin.' },
    },
    madeFor: "India's Life & Career Coaches",
    testimonials: [
      { quote: 'Clients book their package up front and the reminders keep them showing up between calls.', name: 'Arjun M.', role: 'Career Coach', avatar: null },
      { quote: 'Paid-before-the-call means the session starts on the work, not the awkward money bit.', name: 'Neha R.', role: 'Life Coach', avatar: null },
      { quote: 'Time zones used to be a nightmare. My page shows my real slots in their time now.', name: 'Sameer K.', role: 'Executive Coach', avatar: null },
    ],
  },

  spa: {
    slug: 'spa',
    label: 'Spas & Wellness Studios',
    icon: Sparkles,
    theme: {
      primary: '#2f3d2a', accent: '#b08968', accentCta: '#8a6a4f',
      tint: '#f6f3ee', heroFrom: '#1f2a1c', heroTo: '#2f3d2a',
    },
    seo: {
      title: 'Online Booking for Spas & Wellness Studios | Book A Sloth',
      description:
        'Let guests book and pay for a treatment online. Book A Sloth gives spas and wellness studios a clean booking page — prepaid slots, reminders that cut no-shows and a calendar that never double-books.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-spa-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Spas, Wellness & Massage Studios',
      headline: 'Guests book their calm.',
      headlineAccent: 'You run the room.',
      headlineTail: ' They pick a slot, pay, and get reminded — fewer empty beds, no front-desk scramble.',
      subline:
        'You create the calm. Book A Sloth handles everything around the treatment — guests pick a slot, pay upfront, and get reminded — so your therapists stay booked and your desk stays serene.',
      ctaText: 'Set Up My Studio Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Serene · Day Spa',
        practiceTag: 'Spa · Wellness',
        services: [
          { name: 'Signature Massage', meta: '60 min · In-studio', price: '₹1,800' },
          { name: 'Facial & Glow', meta: '45 min · In-studio', price: '₹1,400' },
        ],
      },
    },
    socialProof: 'Trusted by spas, wellness and massage studios across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Guest data private & encrypted' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Treatments booked, even after the studio shuts' },
      { icon: TrendingDown, value: '1 in 5', label: 'Slots go no-show — reminders win them back' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your studio page' },
    ],
    painPoints: [
      { icon: PhoneOff, problem: 'Reception taking bookings by phone while guests wait', solution: 'One booking link. Guests pick, move or cancel their own slot — the desk stays calm.' },
      { icon: IndianRupee, problem: 'No-shows leaving a therapist and a bed sitting idle', solution: 'Take the treatment fee or a deposit upfront at booking. An empty bed costs you nothing.' },
      { icon: CalendarX2, problem: 'Double-booked therapists and overlapping treatments', solution: 'Each therapist’s Google Calendar is read live — booked slots lock instantly, no overlaps.' },
      { icon: FileClock, problem: 'Guests forgetting the appointment they made last week', solution: 'Automatic email + WhatsApp reminders go out before every treatment. Fewer empty beds.' },
      { icon: MessageSquareX, problem: 'A GPay QR at the reception of a premium studio', solution: 'A clean, branded booking page with proper checkout — the polish a spa deserves.' },
      { icon: Clock3, problem: 'Repeating your treatment menu and timings to every caller', solution: 'Treatments, prices and open slots live on one page — guests self-serve, the desk stops repeating.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Book around the clock', desc: 'Your studio page takes bookings after hours and on weekends, while your therapists work.' },
      { icon: Wallet, title: 'Collect before the bed', desc: 'Treatment fee or deposit paid upfront via UPI, card or netbanking — with an automatic GST invoice.' },
      { icon: BellRing, title: 'Keep the beds full', desc: 'Reminders send themselves before every treatment, so fewer slots sit empty.' },
      { icon: ShieldCheck, title: 'No more double-bookings', desc: 'Each therapist’s slots lock instantly when booked — no overlaps, no awkward waits.' },
    ],
    pricing: {
      hook: 'Less than a sachet of oil a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show covers the month.',
    },
    faq: [
      { q: 'Can guests book and pay for a spa treatment online?', a: 'Yes. Guests pick a slot on your studio page and pay the treatment fee or a deposit at checkout through Razorpay (UPI, cards, netbanking) before they arrive.' },
      { q: 'Will it stop two guests being booked with the same therapist?', a: 'Yes. Book A Sloth reads each therapist’s Google Calendar, so busy times are never offered and a booked slot locks instantly.' },
      { q: 'How does it reduce no-shows at a spa?', a: 'Every booking triggers automatic email and WhatsApp reminders before the slot, and deposits mean a no-show no longer leaves a bed idle for nothing.' },
      { q: 'Do guests need an account to book?', a: 'No. Guests pick a time, enter details and pay — no sign-up.' },
      { q: 'How much does it cost for a studio?', a: 'You can start free with a small per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
    ],
    midCtas: {
      afterProblems: { text: 'Give your front desk its calm back.', ctaText: 'Get My Studio Link' },
      afterHow: { text: 'Your next guest is ready to book. Give them somewhere to do it.', ctaText: 'Set Up My Page Free' },
    },
    finalCta: {
      icon: Sparkles,
      urgency: 'Every no-show is a therapist and a bed sitting idle.',
      headline: 'Create the calm, not the chaos at the desk.',
      subline: 'Set up your studio’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Studio Page',
    },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Creating calm is the craft.', titleAccent: 'Booking it shouldn’t be the chaos.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'front desk that never sleeps.' },
      testimonials: { title: 'Built for how a spa really runs.', subtitle: 'Spas, wellness and massage studios — booked, paid and reminded, without the front-desk scramble.' },
    },
    madeFor: "India's Spas & Wellness Studios",
    testimonials: [
      { quote: 'Deposits ended our no-show problem — an idle bed used to cost us nothing back.', name: 'Riya S.', role: 'Spa Owner', avatar: null },
      { quote: 'Therapists stopped getting double-booked the day we connected calendars.', name: 'Anjali M.', role: 'Wellness Studio', avatar: null },
      { quote: 'My front desk isn’t on the phone all day anymore — guests just book themselves.', name: 'Farah K.', role: 'Day Spa Manager', avatar: null },
    ],
  },

  doctors: {
    slug: 'doctors',
    label: 'Doctors & Clinics',
    icon: HeartPulse,

    // ── Theme — trust blue base + healing "helping green" accent ─────────────
    theme: {
      primary: '#0f3b4d',    // deep teal-blue — ink / headings
      accent: '#10b981',     // emerald — the caring signature colour
      accentCta: '#047857',  // emerald-700, AA-safe for white-text buttons
      tint: '#eef8f3',       // soft mint wash
      heroFrom: '#0a2b39',   // dark teal
      heroTo: '#123f52',     // teal-blue
    },

    // ── SEO (Google, commercial intent) ─────────────────────────────────────
    seo: {
      title: 'Appointment Booking Software for Doctors & Clinics | Book A Sloth',
      description:
        'Let patients book appointments online. Book A Sloth is appointment booking software for doctors & clinics — online scheduling, automatic reminders that cut no-shows, prepaid consultations and GST invoices. From ₹10/day.',
      keywords:
        'appointment booking software for doctors, clinic appointment software, patient booking system India, doctor scheduling software, online doctor appointment booking, reduce patient no-shows, clinic management booking page',
      // Clickbait — OG / social share only (NOT the indexed title)
      ogTitle: 'Half your patients no-show? Fix your clinic booking for ₹10/day.',
      ogDescription:
        'Patients book their own slot, pay upfront, and get reminded — automatically. The online appointment page every clinic in India should already have.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-doctors-og-1200x630.jpg',
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
      eyebrow: 'For Doctors, Clinics & Independent Practitioners',
      headline: 'Patients book, pay,',
      headlineAccent: 'and actually show up.',
      headlineTail: ' You stay with patients — the phone, the fees and the reminders run themselves.',
      subline:
        'You care for patients. Book A Sloth handles everything around it — patients pick a slot, pay upfront, and get reminded — so it’s fewer no-shows, fewer phone calls, and more time with patients.',
      ctaText: 'Set Up My Clinic Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Dr. Aisha Rao',
        practiceTag: 'Physician · General Medicine',
        services: [
          { name: 'New Consultation', meta: '20 min · In-clinic', price: '₹600' },
          { name: 'Follow-up Visit', meta: '15 min · Online', price: '₹300' },
        ],
      },
    },

    // ── Social proof strip ───────────────────────────────────────────────────
    socialProof: 'Trusted by clinics, physicians and independent practitioners across India.',

    // ── Trust badges ─────────────────────────────────────────────────────────
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Patient data encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],

    // ── Authority stat band ──────────────────────────────────────────────────
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Appointments booked, even after clinic hours' },
      { icon: TrendingDown, value: '1 in 5', label: 'Appointments go no-show industry-wide — reminders win them back' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your clinic page' },
    ],

    // ── Problem / Agitation → Solution (6, doctor's language) ────────────────
    painPoints: [
      {
        icon: PhoneCall,
        problem: 'Phone lines jammed with appointment calls all day',
        solution: 'Patients book their own slot online — your front desk stops playing switchboard.',
      },
      {
        icon: UserX,
        problem: 'No-shows leaving empty slots you can’t fill',
        solution: 'Automatic SMS + WhatsApp reminders go out before every visit. No-shows drop sharply.',
      },
      {
        icon: IndianRupee,
        problem: 'Chasing or fumbling the consultation fee at the desk',
        solution: 'Fees are collected online at booking. Patients arrive already paid, with a GST invoice.',
      },
      {
        icon: CalendarX2,
        problem: 'Double-booked slots and a messy paper diary',
        solution: 'Every slot locks the moment it’s taken. One live calendar, no clashes, no overbooking.',
      },
      {
        icon: ClipboardList,
        problem: 'Front desk juggling walk-ins, calls and follow-ups',
        solution: 'One dashboard shows the day’s appointments — booked, paid and confirmed at a glance.',
      },
      {
        icon: Clock3,
        problem: 'After-hours booking requests lost overnight',
        solution: 'Your page takes bookings 24/7 — patients reserve at midnight, you see it in the morning.',
      },
    ],

    // ── Features / Benefits ──────────────────────────────────────────────────
    features: [
      {
        icon: CalendarCheck,
        title: 'Bookings around the clock',
        desc: 'Your clinic page is live 24/7. Patients book while you’re with someone else, or off the clock.',
      },
      {
        icon: Wallet,
        title: 'Fees paid before the visit',
        desc: 'Collect the consultation fee online via UPI, card or netbanking. GST invoice generated automatically.',
      },
      {
        icon: ShieldCheck,
        title: 'Patient details stay private',
        desc: 'Encrypted, access-controlled and never sold. Patient information belongs to your clinic alone.',
      },
      {
        icon: BellRing,
        title: 'Reminders that cut no-shows',
        desc: 'Email + WhatsApp reminders send themselves before every appointment — you never chase a patient.',
      },
    ],

    // ── Pricing framing ──────────────────────────────────────────────────────
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show pays for a month.',
    },

    // ── Mid-page CTA banners ─────────────────────────────────────────────────
    midCtas: {
      afterProblems: {
        text: 'Give your patients a faster way to book.',
        ctaText: 'Get My Clinic Link',
      },
      afterHow: {
        text: 'Your next patient is trying to book. Make it effortless.',
        ctaText: 'Set Up My Page Free',
      },
    },

    // ── FAQ (drives FAQPage schema — AEO/GEO) ────────────────────────────────
    faq: [
      {
        q: 'What is the best appointment booking software for doctors and clinics in India?',
        a: 'Book A Sloth is built for Indian clinics and independent practitioners — patients book appointments online, pay the consultation fee upfront via UPI or card, and get automatic SMS and WhatsApp reminders that reduce no-shows. It handles GST invoicing and charges 0% commission on paid plans.',
      },
      {
        q: 'How does it reduce patient no-shows?',
        a: 'Every booking triggers automatic email and WhatsApp reminders before the appointment. Because patients also pay upfront, they are far more likely to turn up — most clinics see a clear drop in no-shows within the first month.',
      },
      {
        q: 'Can patients pay the consultation fee while booking?',
        a: 'Yes. Your fee is shown on the booking page and collected at checkout through Razorpay (UPI, cards, netbanking) before the visit. Patients arrive already paid, and a GST invoice is generated automatically.',
      },
      {
        q: 'Is patient data kept private and secure?',
        a: 'Yes. All data is encrypted, access-controlled and never sold. Patient details and appointment history belong to your clinic alone — no other party can see them.',
      },
      {
        q: 'Do patients need to create an account to book?',
        a: 'No. Patients simply pick a slot, enter their details and pay — no account or app needed. This keeps booking fast for every age group.',
      },
      {
        q: 'Is it suitable for dentists, physiotherapists and specialist clinics?',
        a: 'Yes. Any practitioner who takes booked appointments — physicians, dentists, physiotherapists, dermatologists, dietitians and specialist clinics — can use Book A Sloth to let patients self-book and pay online.',
      },
    ],

    // ── Final CTA ────────────────────────────────────────────────────────────
    finalCta: {
      icon: HeartPulse,
      urgency: 'Every missed call is a patient who booked another clinic.',
      headline: 'More care, less front desk.',
      subline: 'Set up your clinic’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Clinic Page',
    },

    // ── Section headings ─────────────────────────────────────────────────────
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Caring for patients is the job.', titleAccent: 'Clinic scheduling shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'Appointment booking software that runs like your', titleAccent: 'best front-desk nurse.' },
      testimonials: { title: 'Built for how clinics really run.', subtitle: 'Doctors, dentists and physios — booked, paid and reminded, without the front desk.' },
    },

    madeFor: "India's Doctors & Clinics",

    // ── Doctor testimonials (real) ───────────────────────────────────────────
    testimonials: [
      {
        quote: 'No-shows used to wreck my afternoon list. With automatic reminders and prepaid slots, my chairs actually stay full now.',
        name: 'Dr. Kavita Desai',
        role: 'Dentist',
        avatar: null,
      },
      {
        quote: 'My receptionist was on the phone all day. Patients now book themselves and the desk finally has time for people in the room.',
        name: 'Dr. Imran Sheikh',
        role: 'General Physician',
        avatar: null,
      },
      {
        quote: 'Follow-up visits are collected online before the call. No awkward payment talk, and every visit has a proper invoice.',
        name: 'Dr. Neha Verma',
        role: 'Physiotherapist',
        avatar: null,
      },
    ],
  },

  'business-consultant': {
    slug: 'business-consultant',
    label: 'Business Consultants',
    icon: Briefcase,

    // ── Theme — executive: charcoal + warm amber ─────────────────────────────
    theme: {
      primary: '#292524',    // stone-800 charcoal — ink / headings
      accent: '#d97706',     // amber-600 — signature colour
      accentCta: '#b45309',  // amber-700, AA-safe for white-text buttons
      tint: '#faf7f2',        // warm stone wash
      heroFrom: '#1c1917',   // stone-900
      heroTo: '#292524',     // stone-800
    },

    // ── SEO ──────────────────────────────────────────────────────────────────
    seo: {
      title: 'Appointment Booking Software for Business Consultants | Book A Sloth',
      description:
        'Let clients book paid strategy sessions online. Book A Sloth is appointment booking software for business consultants — fees collected upfront, calendar synced, no-shows gone, GST invoices. From ₹10/day.',
      keywords:
        'appointment booking software for consultants, business consultant scheduling, book strategy session online, consulting appointment software, consultant booking page India, discovery call scheduling',
      ogTitle: 'Still booking discovery calls over email? Fix it for ₹10/day.',
      ogDescription:
        'Clients book your strategy session, pay upfront, and get reminded — automatically. The booking page every independent consultant should already have.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-business-consultant-og-1200x630.jpg',
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
      eyebrow: 'For Business Consultants, Advisors & Strategists',
      headline: 'Strategy is your product.',
      headlineAccent: 'Scheduling shouldn’t be your job.',
      headlineTail: ' Clients book a strategy session, pay upfront, and get reminded — automatically.',
      subline:
        'You advise. Book A Sloth handles everything around it — clients pick a slot, pay your fee upfront, and get reminded — so your time goes to strategy, not scheduling.',
      ctaText: 'Set Up My Booking Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Rahul Khanna',
        practiceTag: 'Business Strategy Consultant',
        services: [
          { name: 'Discovery Call', meta: '30 min · Online', price: '₹2,000' },
          { name: 'Strategy Deep-Dive', meta: '60 min · Online', price: '₹5,000' },
        ],
      },
    },

    // ── Social proof strip ───────────────────────────────────────────────────
    socialProof: 'Trusted by independent consultants, advisors and strategists across India.',

    // ── Trust badges ─────────────────────────────────────────────────────────
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Client data encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],

    // ── Authority stat band ──────────────────────────────────────────────────
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Sessions booked, even between engagements' },
      { icon: BadgePercent, value: '0%', label: 'Commission — you keep every fee' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your page' },
    ],

    // ── Problem / Agitation → Solution (6, consultant's language) ────────────
    painPoints: [
      {
        icon: MessageSquareX,
        problem: 'Discovery calls scheduled over endless email threads',
        solution: 'One booking link. Clients pick a slot themselves — no “does Tuesday work?” back-and-forth.',
      },
      {
        icon: IndianRupee,
        problem: 'Chasing invoices after the advice is already given',
        solution: 'Your fee is collected upfront at booking. You advise knowing you’re already paid.',
      },
      {
        icon: UserX,
        problem: 'Prospects no-showing your free discovery calls',
        solution: 'Automatic reminders — plus a paid or deposit option — mean serious clients actually turn up.',
      },
      {
        icon: CalendarX2,
        problem: 'Juggling client calls across time zones and tools',
        solution: 'Google Calendar busy times are blocked, so only your real free slots show. No clashes, no double-booking.',
      },
      {
        icon: Target,
        problem: 'Unqualified leads eating hours of your week',
        solution: 'Intake questions and paid slots filter tyre-kickers before they ever hit your calendar.',
      },
      {
        icon: PhoneOff,
        problem: 'Losing leads who reach out after hours',
        solution: 'Your page books sessions 24/7 — a prospect reserves at midnight, you see it at breakfast.',
      },
    ],

    // ── Features / Benefits ──────────────────────────────────────────────────
    features: [
      {
        icon: CalendarCheck,
        title: 'Booked around the clock',
        desc: 'Your booking page is live 24/7. Clients reserve strategy time while you’re deep in another engagement.',
      },
      {
        icon: Wallet,
        title: 'Paid before you advise',
        desc: 'Collect the full fee or a deposit upfront via UPI, card or netbanking. GST invoice generated automatically.',
      },
      {
        icon: ShieldCheck,
        title: 'Client details stay private',
        desc: 'Encrypted, access-controlled and never sold. Your client list and notes belong to you alone.',
      },
      {
        icon: BellRing,
        title: 'Reminders that cut no-shows',
        desc: 'Email + WhatsApp reminders send themselves before every session — you never chase a prospect.',
      },
    ],

    // ── Pricing framing ──────────────────────────────────────────────────────
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one booked session covers a year.',
    },

    // ── Mid-page CTA banners ─────────────────────────────────────────────────
    midCtas: {
      afterProblems: {
        text: 'Stop scheduling. Start consulting.',
        ctaText: 'Get My Booking Link',
      },
      afterHow: {
        text: 'Your next client is ready to book a session. Make it one click.',
        ctaText: 'Set Up My Page Free',
      },
    },

    // ── FAQ (drives FAQPage schema — AEO/GEO) ────────────────────────────────
    faq: [
      {
        q: 'What is the best appointment booking software for business consultants in India?',
        a: 'Book A Sloth is built for Indian independent consultants — clients book strategy and discovery sessions online, pay your fee upfront via UPI or card, and get automatic reminders. It syncs with your calendar, handles GST invoicing and charges 0% commission on paid plans.',
      },
      {
        q: 'Can clients pay my consulting fee when they book?',
        a: 'Yes. Your fee is shown on the booking page and collected at checkout through Razorpay (UPI, cards, netbanking) before the session. You can charge the full fee or take a deposit.',
      },
      {
        q: 'Can I stop unqualified leads from booking my time?',
        a: 'Yes. You can add intake questions and make sessions paid or deposit-based, which filters out tyre-kickers so only serious clients reach your calendar.',
      },
      {
        q: 'Does it reduce no-shows on discovery calls?',
        a: 'Yes. Automatic email and WhatsApp reminders go out before every session, and prepaid or deposit slots make prospects far more likely to attend.',
      },
      {
        q: 'How much does it cost?',
        a: 'You can start free with a 5% per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every session fee.',
      },
      {
        q: 'Is it suitable for coaches, advisors and freelance consultants?',
        a: 'Yes. Any professional who sells booked, paid time — management consultants, business coaches, financial and startup advisors, and freelance strategists — can use Book A Sloth to run bookings and payments from one link.',
      },
    ],

    // ── Final CTA ────────────────────────────────────────────────────────────
    finalCta: {
      icon: TrendingUp,
      urgency: 'Every slow email reply is a client who booked another consultant.',
      headline: 'Advise more. Schedule less.',
      subline: 'Set up your consulting booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Booking Page',
    },

    // ── Section headings ─────────────────────────────────────────────────────
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Advising clients is the work.', titleAccent: 'Client scheduling shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'Appointment booking software that works like your', titleAccent: 'own executive assistant.' },
      testimonials: { title: 'Built for how consulting really works.', subtitle: 'Consultants and advisors — booked, paid and reminded, without the admin.' },
    },

    madeFor: "India's Business Consultants",

    // ── Consultant testimonials (real) ───────────────────────────────────────
    testimonials: [
      {
        quote: 'Discovery calls used to be a scheduling nightmare. Now clients book and pay a deposit — my calendar fills with serious leads only.',
        name: 'Rahul Khanna',
        role: 'Strategy Consultant',
        avatar: null,
      },
      {
        quote: 'I used to raise invoices after every session and chase them for weeks. Getting paid upfront changed my entire cash flow.',
        name: 'Sneha Kapoor',
        role: 'Management Consultant',
        avatar: null,
      },
      {
        quote: 'One clean link in my LinkedIn bio does all my booking now. It looks far more credible than trading emails to find a slot.',
        name: 'Vikram Iyer',
        role: 'Startup Advisor',
        avatar: null,
      },
    ],
  },

  salon: {
    slug: 'salon',
    label: 'Salons & Spas',
    icon: Scissors,

    // ── Theme — beauty & luxury: deep plum + rose-pink ───────────────────────
    theme: {
      primary: '#4a1942',    // deep plum — ink / headings
      accent: '#ec4899',     // pink-500 — signature colour
      accentCta: '#be185d',  // pink-700, AA-safe for white-text buttons
      tint: '#fdf2f8',        // pink-50 wash
      heroFrom: '#3b0d2e',   // dark plum
      heroTo: '#591242',     // plum
    },

    // ── SEO ──────────────────────────────────────────────────────────────────
    seo: {
      title: 'Appointment Booking Software for Salons & Spas | Book A Sloth',
      description:
        'Let clients book their own appointments online. Book A Sloth is appointment booking software for salons & spas — 24/7 booking, deposits collected upfront, automatic reminders that cut no-shows, and GST invoices. From ₹10/day.',
      keywords:
        'salon booking software, spa appointment software, salon appointment booking India, online booking for salons, beauty parlour booking system, reduce salon no-shows, salon scheduling app',
      ogTitle: 'Still taking salon bookings on WhatsApp? Fix it for ₹10/day.',
      ogDescription:
        'Clients book their own slot, pay a deposit, and get reminded — automatically. The booking page every salon and spa in India should already have.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-salon-og-1200x630.jpg',
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
      eyebrow: 'For Salons, Spas & Beauty Studios',
      headline: 'The chairs stay full.',
      headlineAccent: 'The phone stops ringing.',
      headlineTail: ' Clients book, pay, and get reminded — your front desk finally breathes.',
      subline:
        'You make clients look their best. Book A Sloth handles everything around it — clients pick a slot, pay a deposit, and get reminded — so it’s fewer no-shows and more time behind the chair.',
      ctaText: 'Set Up My Salon Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Glow Studio',
        practiceTag: 'Hair · Skin · Nails',
        services: [
          { name: 'Haircut & Style', meta: '45 min · In-salon', price: '₹800' },
          { name: 'Signature Facial', meta: '60 min · In-salon', price: '₹1,500' },
        ],
      },
    },

    // ── Social proof strip ───────────────────────────────────────────────────
    socialProof: 'Trusted by salons, spas and independent beauty professionals across India.',

    // ── Trust badges ─────────────────────────────────────────────────────────
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Client data encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],

    // ── Authority stat band ──────────────────────────────────────────────────
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Appointments booked, even after closing' },
      { icon: TrendingDown, value: 'Fewer', label: 'No-shows, thanks to deposits + reminders' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your salon page' },
    ],

    // ── Problem / Agitation → Solution (6, salon's language) ─────────────────
    painPoints: [
      {
        icon: PhoneCall,
        problem: 'Phone ringing mid-service to take the next booking',
        solution: 'Clients book themselves online — your team stays with the client in the chair, not on the phone.',
      },
      {
        icon: UserX,
        problem: 'No-shows leaving stylists idle and chairs empty',
        solution: 'A small deposit at booking plus automatic reminders means no-shows drop right away.',
      },
      {
        icon: MessageSquareX,
        problem: 'Bookings buried in Instagram and WhatsApp DMs',
        solution: 'One link in your bio takes every booking — no more scrolling messages to piece together the day.',
      },
      {
        icon: CalendarX2,
        problem: 'Double-booked slots and clashing stylist schedules',
        solution: 'Every slot locks the moment it’s taken. One live calendar per stylist, no overbooking.',
      },
      {
        icon: IndianRupee,
        problem: 'Awkward deposits and no-show charges to collect',
        solution: 'Deposits are taken online at booking, with a GST invoice — no cash-counter awkwardness.',
      },
      {
        icon: Clock3,
        problem: 'Late-night booking requests missed till morning',
        solution: 'Your page books 24/7 — a client reserves at midnight, you see it when you open the shutters.',
      },
    ],

    // ── Features / Benefits ──────────────────────────────────────────────────
    features: [
      {
        icon: CalendarCheck,
        title: 'Bookings around the clock',
        desc: 'Your salon page is live 24/7. Clients book while you’re with someone else, or long after closing time.',
      },
      {
        icon: Wallet,
        title: 'Deposits paid upfront',
        desc: 'Collect a deposit or the full price online via UPI, card or netbanking. GST invoice generated automatically.',
      },
      {
        icon: ShieldCheck,
        title: 'Client details stay private',
        desc: 'Encrypted, access-controlled and never sold. Your client list and history belong to your salon alone.',
      },
      {
        icon: BellRing,
        title: 'Reminders that cut no-shows',
        desc: 'Email + WhatsApp reminders send themselves before every appointment — you never chase a client.',
      },
    ],

    // ── Pricing framing ──────────────────────────────────────────────────────
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show covers a month.',
    },

    // ── Mid-page CTA banners ─────────────────────────────────────────────────
    midCtas: {
      afterProblems: {
        text: 'Let your clients book while your hands are full.',
        ctaText: 'Get My Salon Link',
      },
      afterHow: {
        text: 'Your next client is trying to book. Make it effortless.',
        ctaText: 'Set Up My Page Free',
      },
    },

    // ── FAQ (drives FAQPage schema — AEO/GEO) ────────────────────────────────
    faq: [
      {
        q: 'What is the best appointment booking software for salons and spas in India?',
        a: 'Book A Sloth is built for Indian salons and spas — clients book their own appointments online, pay a deposit upfront via UPI or card, and get automatic WhatsApp and email reminders that cut no-shows. It handles GST invoicing and charges 0% commission on paid plans.',
      },
      {
        q: 'How does it reduce salon no-shows?',
        a: 'Every booking can require a deposit and triggers automatic reminders before the appointment. Together, these make clients far more likely to turn up — most salons see a clear drop in no-shows within weeks.',
      },
      {
        q: 'Can clients pay a deposit while booking?',
        a: 'Yes. You can collect a deposit or the full service price at checkout through Razorpay (UPI, cards, netbanking), with a GST invoice generated automatically.',
      },
      {
        q: 'Can I manage bookings for multiple stylists or therapists?',
        a: 'Yes. Each stylist or therapist can have their own services and availability, so clients book the right person and slots never clash.',
      },
      {
        q: 'Do clients need to install an app to book?',
        a: 'No. Clients simply open your link, pick a slot and pay — no app or account needed. It works from your Instagram bio, WhatsApp or website.',
      },
      {
        q: 'Is it suitable for spas, nail studios and beauty parlours?',
        a: 'Yes. Any beauty or wellness business that takes booked appointments — hair salons, spas, nail and lash studios, beauty parlours and independent stylists — can use Book A Sloth for online booking and payments.',
      },
    ],

    // ── Final CTA ────────────────────────────────────────────────────────────
    finalCta: {
      icon: Sparkles,
      urgency: 'Every missed call is a client who booked another salon.',
      headline: 'More time behind the chair.',
      subline: 'Set up your salon’s booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Salon Page',
    },

    // ── Section headings ─────────────────────────────────────────────────────
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Making clients look great is the job.', titleAccent: 'The phone shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'Appointment booking software that works like your', titleAccent: 'best receptionist.' },
      testimonials: { title: 'Built for how salons really run.', subtitle: 'Stylists, spas and studios — chairs booked and filled, without the phone.' },
    },

    madeFor: "India's Salons & Spas",

    // ── Salon testimonials (real) ────────────────────────────────────────────
    testimonials: [
      {
        quote: 'No-shows used to cost us a fortune on weekends. Deposits at booking fixed it — the chairs stay full now.',
        name: 'Ritu Malhotra',
        role: 'Salon Owner',
        avatar: null,
      },
      {
        quote: 'We were drowning in Instagram DMs to book clients. One link took over and my front desk finally breathes.',
        name: 'Farah Sheikh',
        role: 'Spa Manager',
        avatar: null,
      },
      {
        quote: 'Clients book their own slot with my stylists and pay upfront. Way more professional than a WhatsApp back-and-forth.',
        name: 'Deepak Nair',
        role: 'Hair Studio Owner',
        avatar: null,
      },
    ],
  },

  freelancers: {
    slug: 'freelancers',
    label: 'Freelancers',
    icon: Laptop,

    // ── Theme — digital & remote: deep teal + bright teal ────────────────────
    theme: {
      primary: '#134e4a',    // teal-900 — ink / headings
      accent: '#14b8a6',     // teal-500 — signature colour
      accentCta: '#0f766e',  // teal-700, AA-safe for white-text buttons
      tint: '#f0fdfa',        // teal-50 wash
      heroFrom: '#042f2e',   // dark teal
      heroTo: '#134e4a',     // teal-900
    },

    // ── SEO ──────────────────────────────────────────────────────────────────
    seo: {
      title: 'Appointment Booking Software for Freelancers | Book A Sloth',
      description:
        'Let clients book calls and pay you online. Book A Sloth is booking + payment software for freelancers — advances collected upfront, calendar synced, no-shows gone, GST invoices. From ₹10/day.',
      keywords:
        'booking software for freelancers, freelancer scheduling app, collect advance payment freelancer, freelance discovery call booking, freelancer booking page India, get paid upfront freelance',
      ogTitle: 'Still chasing freelance clients for payment? Fix it for ₹10/day.',
      ogDescription:
        'Clients book your call, pay an advance upfront, and get reminded — automatically. The booking + payment link every freelancer in India should already have.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-freelancers-og-1200x630.jpg',
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
      eyebrow: 'For Freelancers, Designers, Developers & Writers',
      headline: 'Calls booked and paid,',
      headlineAccent: 'before you open the laptop.',
      headlineTail: ' Clients pick a slot, pay upfront, and get reminded — you just do the work.',
      subline:
        'You do the work. Book A Sloth handles everything around it — clients pick a slot, pay an advance upfront, and get reminded — so your day goes to the craft, not chasing invoices.',
      ctaText: 'Set Up My Booking Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Ananya Rao',
        practiceTag: 'Freelance UX Designer',
        services: [
          { name: 'Intro / Discovery Call', meta: '30 min · Online', price: '₹1,000' },
          { name: 'Design Consultation', meta: '60 min · Online', price: '₹3,000' },
        ],
      },
    },

    // ── Social proof strip ───────────────────────────────────────────────────
    socialProof: 'Trusted by designers, developers, writers and independent freelancers across India.',

    // ── Trust badges ─────────────────────────────────────────────────────────
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Client data encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],

    // ── Authority stat band ──────────────────────────────────────────────────
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Calls booked, across any client time zone' },
      { icon: BadgePercent, value: '0%', label: 'Commission — you keep every rupee' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your page' },
    ],

    // ── Problem / Agitation → Solution (6, freelancer's language) ────────────
    painPoints: [
      {
        icon: IndianRupee,
        problem: 'Chasing clients for advances and unpaid invoices',
        solution: 'Collect an advance or full fee at booking. You start the work already paid, no follow-ups.',
      },
      {
        icon: MessageSquareX,
        problem: 'Scheduling calls over endless DMs and email threads',
        solution: 'One link. Clients pick a slot themselves — no “what time works for you?” ping-pong.',
      },
      {
        icon: CalendarX2,
        problem: 'Juggling calls across clients and time zones',
        solution: 'Google Calendar busy times are blocked, so only your real free slots show, in the client’s own time zone.',
      },
      {
        icon: UserX,
        problem: 'Prospects ghosting your free discovery calls',
        solution: 'A small paid or deposit slot plus reminders means only serious clients book your time.',
      },
      {
        icon: MessageSquareX,
        problem: 'Sharing a UPI QR after the call — looks unprofessional',
        solution: 'A clean branded page with Razorpay checkout. The polish that wins better-paying clients.',
      },
      {
        icon: Clock3,
        problem: 'Losing overseas leads who reach out overnight',
        solution: 'Your page books 24/7 — a client in another time zone reserves while you sleep.',
      },
    ],

    // ── Features / Benefits ──────────────────────────────────────────────────
    features: [
      {
        icon: CalendarCheck,
        title: 'Booked around the clock',
        desc: 'Your booking page is live 24/7. Clients reserve calls while you’re heads-down or offline.',
      },
      {
        icon: Wallet,
        title: 'Paid before you start',
        desc: 'Collect an advance or full fee upfront via UPI, card or netbanking. GST invoice generated automatically.',
      },
      {
        icon: ShieldCheck,
        title: 'Client details stay private',
        desc: 'Encrypted, access-controlled and never sold. Your client list and notes belong to you alone.',
      },
      {
        icon: BellRing,
        title: 'Reminders that cut no-shows',
        desc: 'Email + WhatsApp reminders send themselves before every call — you never chase a client.',
      },
    ],

    // ── Pricing framing ──────────────────────────────────────────────────────
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one booked call covers a year.',
    },

    // ── Mid-page CTA banners ─────────────────────────────────────────────────
    midCtas: {
      afterProblems: {
        text: 'Stop chasing invoices. Start getting paid to talk.',
        ctaText: 'Get My Booking Link',
      },
      afterHow: {
        text: 'Your next client is ready to book a call. Make it one click.',
        ctaText: 'Set Up My Page Free',
      },
    },

    // ── FAQ (drives FAQPage schema — AEO/GEO) ────────────────────────────────
    faq: [
      {
        q: 'What is the best booking and payment software for freelancers in India?',
        a: 'Book A Sloth is built for Indian freelancers — clients book calls online, pay an advance or full fee upfront via UPI or card, and get automatic reminders. It syncs with your calendar, handles GST invoicing and charges 0% commission on paid plans, so you keep every rupee.',
      },
      {
        q: 'Can I collect an advance payment when a client books?',
        a: 'Yes. Your fee is shown on the booking page and collected at checkout through Razorpay (UPI, cards, netbanking) before the call. You can take an advance or the full amount upfront.',
      },
      {
        q: 'Does it handle clients in other time zones?',
        a: 'Yes. Your availability is shown in each client’s own time zone, and Google Calendar busy-time blocking keeps your real free slots accurate — so overseas clients book without any back-and-forth.',
      },
      {
        q: 'How does it reduce no-shows on discovery calls?',
        a: 'Automatic email and WhatsApp reminders go out before every call, and making the slot paid or deposit-based means only serious prospects book your time.',
      },
      {
        q: 'How much does it cost?',
        a: 'You can start free with a 5% per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.',
      },
      {
        q: 'Is it suitable for designers, developers, writers and consultants?',
        a: 'Yes. Any freelancer who sells booked time — designers, developers, writers, marketers, video editors and consultants — can use Book A Sloth to run bookings and payments from one professional link.',
      },
    ],

    // ── Final CTA ────────────────────────────────────────────────────────────
    finalCta: {
      icon: Laptop,
      urgency: 'Every unpaid invoice is time you’ll never bill again.',
      headline: 'Do the work. Skip the admin.',
      subline: 'Set up your freelance booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Booking Page',
    },

    // ── Section headings ─────────────────────────────────────────────────────
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Doing great work is the job.', titleAccent: 'Chasing payment shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'Appointment booking software that works like your', titleAccent: 'own project manager.' },
      testimonials: { title: 'Built for how freelancers really work.', subtitle: 'Designers, writers and developers — booked and paid, without the admin.' },
    },

    madeFor: "India's Freelancers",

    // ── Freelancer testimonials (real) ───────────────────────────────────────
    testimonials: [
      {
        quote: 'Advances at booking ended my cash-flow stress. I start projects already paid instead of chasing invoices for weeks.',
        name: 'Ananya Rao',
        role: 'UX Designer',
        avatar: null,
      },
      {
        quote: 'Overseas clients used to be a scheduling headache. Now they book in their own time zone and pay upfront — zero back-and-forth.',
        name: 'Karan Mehta',
        role: 'Freelance Developer',
        avatar: null,
      },
      {
        quote: 'A clean booking link on my portfolio looks so much more professional than sending a UPI QR after every call.',
        name: 'Ishita Sen',
        role: 'Content Writer',
        avatar: null,
      },
    ],
  },

  fitness: {
    slug: 'fitness',
    label: 'Fitness Trainers & Studios',
    icon: Zap,

    // ── Theme — energy: deep warm base + fiery orange ────────────────────────
    theme: {
      primary: '#431407',    // orange-950 deep — ink / headings
      accent: '#f97316',     // orange-500 — signature colour
      accentCta: '#c2410c',  // orange-700, AA-safe for white-text buttons
      tint: '#fff7ed',        // orange-50 wash
      heroFrom: '#431407',   // orange-950
      heroTo: '#7c2d12',     // orange-900
    },

    // ── SEO ──────────────────────────────────────────────────────────────────
    seo: {
      title: 'Appointment Booking Software for Fitness Trainers | Book A Sloth',
      description:
        'Let clients book sessions and classes online. Book A Sloth is booking software for fitness trainers & studios — packages paid upfront, class capacity managed, automatic reminders that cut no-shows, GST invoices. From ₹10/day.',
      keywords:
        'booking software for fitness trainers, gym class booking software, personal trainer scheduling app, yoga class booking India, fitness studio booking system, reduce no-shows gym, PT session booking',
      ogTitle: 'Still booking gym clients on WhatsApp? Fix it for ₹10/day.',
      ogDescription:
        'Clients book their session, pay for the package upfront, and get reminded — automatically. The booking page every trainer and studio in India should already have.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-fitness-og-1200x630.jpg',
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
      eyebrow: 'For Personal Trainers, Coaches & Fitness Studios',
      headline: 'Your sessions,',
      headlineAccent: 'booked and paid',
      headlineTail: 'before the warm-up.',
      subline:
        'You get clients results. Book A Sloth handles everything around it — clients pick a slot, pay for the session or package upfront, and get reminded — so it’s more training and less admin.',
      ctaText: 'Set Up My Booking Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Coach Arjun',
        practiceTag: 'Personal Trainer · Strength',
        services: [
          { name: '1:1 Training Session', meta: '45 min · In-studio', price: '₹800' },
          { name: '10-Session Package', meta: 'Save 15% · Prepaid', price: '₹6,800' },
        ],
      },
    },

    // ── Social proof strip ───────────────────────────────────────────────────
    socialProof: 'Trusted by personal trainers, yoga teachers and fitness studios across India.',

    // ── Trust badges ─────────────────────────────────────────────────────────
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Client data encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],

    // ── Authority stat band ──────────────────────────────────────────────────
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Sessions & classes booked, any hour' },
      { icon: TrendingDown, value: 'Fewer', label: 'No-shows, thanks to prepaid + reminders' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your page' },
    ],

    // ── Problem / Agitation → Solution (6, trainer's language) ───────────────
    painPoints: [
      {
        icon: MessageSquareX,
        problem: 'Booking sessions one WhatsApp message at a time',
        solution: 'One link. Clients book their own slot — you stay on the floor, not on your phone.',
      },
      {
        icon: UserX,
        problem: 'No-shows wasting slots you blocked for a client',
        solution: 'Prepaid sessions plus automatic reminders mean clients actually show up.',
      },
      {
        icon: IndianRupee,
        problem: 'Chasing clients for package and monthly fees',
        solution: 'Sell prepaid packages online — money’s in before the first session, with a GST invoice.',
      },
      {
        icon: CalendarX2,
        problem: 'Overbooked classes and clashing PT slots',
        solution: 'Set capacity per class and slots lock instantly — no overcrowding, no double-booking.',
      },
      {
        icon: PhoneCall,
        problem: 'Enquiries interrupting you mid-session',
        solution: 'Your page answers “are you free at 6?” for you — clients see real slots and just book.',
      },
      {
        icon: Clock3,
        problem: 'Late-night sign-up requests lost by morning',
        solution: 'Your page books 24/7 — someone signs up at midnight, you see it before your first class.',
      },
    ],

    // ── Features / Benefits ──────────────────────────────────────────────────
    features: [
      {
        icon: CalendarCheck,
        title: 'Bookings around the clock',
        desc: 'Your booking page is live 24/7. Clients reserve sessions and classes while you’re training someone else.',
      },
      {
        icon: Wallet,
        title: 'Packages paid upfront',
        desc: 'Sell single sessions or prepaid packages via UPI, card or netbanking. GST invoice generated automatically.',
      },
      {
        icon: ShieldCheck,
        title: 'Client details stay private',
        desc: 'Encrypted, access-controlled and never sold. Your client list and history belong to you alone.',
      },
      {
        icon: BellRing,
        title: 'Reminders that cut no-shows',
        desc: 'Email + WhatsApp reminders send themselves before every session — you never chase a client.',
      },
    ],

    // ── Pricing framing ──────────────────────────────────────────────────────
    pricing: {
      hook: 'Less than a cup of chai a day.',
      line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one recovered no-show covers a month.',
    },

    // ── Mid-page CTA banners ─────────────────────────────────────────────────
    midCtas: {
      afterProblems: {
        text: 'Spend your time training, not texting.',
        ctaText: 'Get My Booking Link',
      },
      afterHow: {
        text: 'Your next client is ready to book a session. Make it one tap.',
        ctaText: 'Set Up My Page Free',
      },
    },

    // ── FAQ (drives FAQPage schema — AEO/GEO) ────────────────────────────────
    faq: [
      {
        q: 'What is the best booking software for fitness trainers and studios in India?',
        a: 'Book A Sloth is built for Indian trainers and studios — clients book sessions and classes online, pay for a session or prepaid package upfront via UPI or card, and get automatic reminders that cut no-shows. It manages class capacity, handles GST invoicing and charges 0% commission on paid plans.',
      },
      {
        q: 'Can I sell prepaid session packages?',
        a: 'Yes. You can offer single sessions or prepaid multi-session packages, collected online at booking through Razorpay, with a GST invoice generated automatically.',
      },
      {
        q: 'How does it reduce no-shows?',
        a: 'Sessions can be prepaid, and automatic email and WhatsApp reminders go out before every booking — together they make clients far more likely to show up.',
      },
      {
        q: 'Can I manage class capacity and multiple trainers?',
        a: 'Yes. You can set a capacity for each class and give every trainer their own services and availability, so classes never overfill and PT slots never clash.',
      },
      {
        q: 'Do clients need an app to book?',
        a: 'No. Clients open your link, pick a slot and pay — no app or account needed. It works straight from your Instagram bio, WhatsApp or website.',
      },
      {
        q: 'Is it suitable for yoga teachers, gyms and independent coaches?',
        a: 'Yes. Any fitness professional who takes booked sessions — personal trainers, yoga and pilates teachers, gyms, CrossFit boxes and independent coaches — can use Book A Sloth for online booking and payments.',
      },
    ],

    // ── Final CTA ────────────────────────────────────────────────────────────
    finalCta: {
      icon: Zap,
      urgency: 'Every empty slot is income you can’t make back.',
      headline: 'More reps. Less admin.',
      subline: 'Set up your training booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.',
      ctaText: 'Create My Booking Page',
    },

    // ── Section headings ─────────────────────────────────────────────────────
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Getting clients results is the job.', titleAccent: 'The scheduling shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like your', titleAccent: 'own front desk.' },
    },

    madeFor: "India's Fitness Trainers & Studios",

    // ── Fitness testimonials (real) ──────────────────────────────────────────
    testimonials: [
      {
        quote: 'Selling prepaid packages online changed everything. Clients commit, they show up, and I’m not chasing monthly fees anymore.',
        name: 'Arjun Sethi',
        role: 'Personal Trainer',
        avatar: null,
      },
      {
        quote: 'My classes used to overfill or sit half-empty. Now capacity is set and clients just book the open spots themselves.',
        name: 'Meera Joshi',
        role: 'Yoga Teacher',
        avatar: null,
      },
      {
        quote: 'No-shows were killing my evenings. Prepaid slots plus reminders and my calendar actually stays full now.',
        name: 'Rohit Nair',
        role: 'Studio Owner',
        avatar: null,
      },
    ],
  },

  tutors: {
    slug: 'tutors',
    label: 'Tutors & Educators',
    icon: GraduationCap,
    theme: {
      primary: '#1e1b4b', accent: '#6366f1', accentCta: '#4338ca',
      tint: '#eef2ff', heroFrom: '#1e1b4b', heroTo: '#312e81',
    },
    seo: {
      title: 'Appointment Booking Software for Tutors & Educators | Book A Sloth',
      description:
        'Let students and parents book classes online. Book A Sloth is booking software for tutors & educators — fees paid upfront, batches scheduled, automatic reminders that cut no-shows, GST invoices. From ₹10/day.',
      keywords:
        'booking software for tutors, online class booking, tuition scheduling app, book tutor online India, coaching class booking system, reduce student no-shows, demo class booking',
      ogTitle: 'Still fixing tuition timings over WhatsApp? Fix it for ₹10/day.',
      ogDescription:
        'Students and parents book a slot, pay upfront, and get reminded — automatically. The booking page every tutor and coaching class in India should already have.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-tutors-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Tutors, Coaching Classes & Educators',
      headline: 'Your classes,',
      headlineAccent: 'booked and paid',
      headlineTail: 'before the first lesson.',
      subline:
        'You teach. Book A Sloth handles everything around it — students and parents pick a slot, pay the fee upfront, and get reminded — so your time goes to lessons, not the timetable.',
      ctaText: 'Set Up My Booking Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Priya’s Maths Class',
        practiceTag: 'Maths Tutor · Grades 9–12',
        services: [
          { name: 'Demo Class', meta: '30 min · Online', price: 'Free' },
          { name: 'Monthly Batch', meta: '12 classes · Prepaid', price: '₹3,000' },
        ],
      },
    },
    socialProof: 'Trusted by tutors, coaching classes and independent educators across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Student data encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Classes & demos booked, any hour' },
      { icon: TrendingDown, value: 'Fewer', label: 'No-shows, thanks to prepaid + reminders' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your page' },
    ],
    painPoints: [
      { icon: MessageSquareX, problem: 'Fixing class timings over endless parent WhatsApps', solution: 'One link. Students and parents pick a slot themselves — no group-chat scheduling.' },
      { icon: IndianRupee, problem: 'Chasing monthly fees class after class', solution: 'Fees are collected online upfront — prepaid batches with a GST invoice, no reminders needed.' },
      { icon: UserX, problem: 'Students booking demos and never turning up', solution: 'Reminders plus a paid or confirmed slot mean only serious learners take your time.' },
      { icon: CalendarX2, problem: 'Batch timings and 1:1 slots clashing', solution: 'Every slot locks the moment it’s taken. Batches and private lessons never overlap.' },
      { icon: BookOpen, problem: 'Juggling students across boards, grades and subjects', solution: 'Separate services per subject and level — students book exactly the right class.' },
      { icon: Clock3, problem: 'Enquiries after class hours lost by morning', solution: 'Your page books 24/7 — a parent enrols at night, you see it before the first bell.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Bookings around the clock', desc: 'Your class page is live 24/7. Students book demos and batches while you’re teaching another group.' },
      { icon: Wallet, title: 'Fees paid upfront', desc: 'Collect per-class or prepaid batch fees via UPI, card or netbanking. GST invoice generated automatically.' },
      { icon: ShieldCheck, title: 'Student details stay private', desc: 'Encrypted, access-controlled and never sold. Your student list and history belong to you alone.' },
      { icon: BellRing, title: 'Reminders that cut no-shows', desc: 'Email + WhatsApp reminders send themselves before every class — you never chase a student.' },
    ],
    pricing: { hook: 'Less than a cup of chai a day.', line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one enrolled student covers a year.' },
    midCtas: {
      afterProblems: { text: 'Spend your time teaching, not texting.', ctaText: 'Get My Booking Link' },
      afterHow: { text: 'Your next student is ready to enrol. Make it one click.', ctaText: 'Set Up My Page Free' },
    },
    faq: [
      { q: 'What is the best booking software for tutors and coaching classes in India?', a: 'Book A Sloth is built for Indian tutors and educators — students and parents book classes online, pay the fee upfront via UPI or card, and get automatic reminders that cut no-shows. It handles batches, GST invoicing and charges 0% commission on paid plans.' },
      { q: 'Can I collect class fees when students book?', a: 'Yes. Your fee is shown on the booking page and collected at checkout through Razorpay (UPI, cards, netbanking) before the class, with a GST invoice generated automatically. You can charge per class or per batch.' },
      { q: 'Can I run both batches and 1:1 lessons?', a: 'Yes. You can set up separate services for group batches and private lessons, each with its own capacity and availability, so bookings never clash.' },
      { q: 'How does it reduce demo-class no-shows?', a: 'Automatic email and WhatsApp reminders go out before every class, and making demos confirmed or paid means only serious students book your time.' },
      { q: 'How much does it cost?', a: 'You can start free with a 5% per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
      { q: 'Is it suitable for coaching institutes and online educators?', a: 'Yes. Tutors, coaching institutes, music and language teachers, exam-prep coaches and online educators can all use Book A Sloth to run class bookings and payments from one link.' },
    ],
    finalCta: { icon: GraduationCap, urgency: 'Every empty seat is a student who enrolled elsewhere.', headline: 'More teaching. Less timetabling.', subline: 'Set up your class booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.', ctaText: 'Create My Booking Page' },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Teaching well is the job.', titleAccent: 'The timetable shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like your', titleAccent: 'own class coordinator.' },
    },
    madeFor: "India's Tutors & Educators",
    testimonials: [
      { quote: 'Parents used to message me all day about timings and fees. Now they book a slot and pay online — my evenings are mine again.', name: 'Priya Sharma', role: 'Maths Tutor', avatar: null },
      { quote: 'Prepaid batches ended my fee-chasing completely. Students commit for the month and actually show up.', name: 'Imtiaz Ali', role: 'Physics Coach', avatar: null },
      { quote: 'Demo no-shows used to waste my slots. Reminders fixed that, and my calendar finally stays full.', name: 'Ananya Reddy', role: 'English Tutor', avatar: null },
    ],
  },

  photographers: {
    slug: 'photographers',
    label: 'Photographers',
    icon: Camera,
    theme: {
      primary: '#4a044e', accent: '#d946ef', accentCta: '#a21caf',
      tint: '#fdf4ff', heroFrom: '#3b0764', heroTo: '#701a75',
    },
    seo: {
      title: 'Appointment Booking Software for Photographers | Book A Sloth',
      description:
        'Let clients book shoots and pay online. Book A Sloth is booking software for photographers — deposits collected upfront, calendar synced, automatic reminders, GST invoices. From ₹10/day.',
      keywords:
        'booking software for photographers, photography shoot booking, photographer scheduling app, book photoshoot online India, studio booking system, collect shoot deposit, wedding photographer booking',
      ogTitle: 'Still booking shoots in your Instagram DMs? Fix it for ₹10/day.',
      ogDescription:
        'Clients book a shoot slot, pay a deposit upfront, and get reminded — automatically. The booking page every photographer in India should already have.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-photographers-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Photographers, Studios & Videographers',
      headline: 'Shoots booked and secured,',
      headlineAccent: 'before you pack the gear.',
      headlineTail: ' Clients pick a slot, pay the deposit, and get reminded — automatically.',
      subline:
        'You make great images. Book A Sloth handles everything around it — clients pick a slot, pay a deposit upfront, and get reminded — so you stay behind the lens, not in your inbox.',
      ctaText: 'Set Up My Booking Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Studio Lumen',
        practiceTag: 'Portrait & Wedding Photography',
        services: [
          { name: 'Portrait Session', meta: '60 min · On-location', price: '₹5,000' },
          { name: 'Pre-Wedding Shoot', meta: 'Half day · Deposit', price: '₹8,000' },
        ],
      },
    },
    socialProof: 'Trusted by portrait, wedding and event photographers across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Client data encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Shoots booked, even between sessions' },
      { icon: TrendingDown, value: 'Fewer', label: 'Cancellations, thanks to deposits' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your page' },
    ],
    painPoints: [
      { icon: MessageSquareX, problem: 'Shoot bookings buried in Instagram and WhatsApp DMs', solution: 'One link in your bio takes every booking — no scrolling messages to piece together dates.' },
      { icon: IndianRupee, problem: 'Clients backing out after you’ve blocked the date', solution: 'A deposit at booking secures the slot — flaky enquiries filter themselves out.' },
      { icon: CalendarX2, problem: 'Double-booking two shoots on the same day', solution: 'Every date locks the moment it’s taken. One live calendar, no clashes.' },
      { icon: MessageSquareX, problem: 'Sharing a UPI QR for the advance feels unprofessional', solution: 'A clean branded page with Razorpay checkout — the polish premium clients expect.' },
      { icon: Clock3, problem: 'Enquiries at all hours you can’t always answer', solution: 'Your page books 24/7 — a couple reserves their date at midnight while you edit.' },
      { icon: UserX, problem: 'No-shows for portfolio and trial sessions', solution: 'Reminders plus a deposit mean clients actually turn up for the shoot.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Bookings around the clock', desc: 'Your booking page is live 24/7. Clients reserve shoots while you’re on set or editing.' },
      { icon: Wallet, title: 'Deposits paid upfront', desc: 'Collect a deposit or full fee via UPI, card or netbanking. GST invoice generated automatically.' },
      { icon: ShieldCheck, title: 'Client details stay private', desc: 'Encrypted, access-controlled and never sold. Your client list and shoots belong to you alone.' },
      { icon: BellRing, title: 'Reminders that cut no-shows', desc: 'Email + WhatsApp reminders send themselves before every shoot — you never chase a client.' },
    ],
    pricing: { hook: 'Less than a cup of chai a day.', line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one secured shoot covers years.' },
    midCtas: {
      afterProblems: { text: 'Stay behind the lens, not in your DMs.', ctaText: 'Get My Booking Link' },
      afterHow: { text: 'Your next client is ready to book a shoot. Make it one click.', ctaText: 'Set Up My Page Free' },
    },
    faq: [
      { q: 'What is the best booking software for photographers in India?', a: 'Book A Sloth is built for Indian photographers — clients book shoots online, pay a deposit upfront via UPI or card, and get automatic reminders. It syncs with your calendar, handles GST invoicing and charges 0% commission on paid plans.' },
      { q: 'Can I collect a shoot deposit when a client books?', a: 'Yes. You can collect a deposit or the full fee at checkout through Razorpay (UPI, cards, netbanking) before the shoot, with a GST invoice generated automatically.' },
      { q: 'Does it stop double-booking dates?', a: 'Yes. Each date and slot locks the moment it’s booked, and Google Calendar busy-time blocking keeps your real availability accurate — so you never double-book a shoot.' },
      { q: 'How does it reduce cancellations and no-shows?', a: 'Requiring a deposit filters out flaky enquiries, and automatic reminders before every shoot keep confirmed clients showing up.' },
      { q: 'Do clients need an app to book?', a: 'No. Clients open your link, pick a date and pay — no app or account needed. It works straight from your Instagram bio or website.' },
      { q: 'Is it suitable for wedding, portrait and event photographers?', a: 'Yes. Wedding, portrait, product, event and pre-wedding photographers, plus videographers and studios, can all use Book A Sloth for shoot bookings and payments.' },
    ],
    finalCta: { icon: Camera, urgency: 'Every unbooked date is a shoot that went to another photographer.', headline: 'More shooting. Less scheduling.', subline: 'Set up your photography booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.', ctaText: 'Create My Booking Page' },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Making great images is the job.', titleAccent: 'The booking shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'Appointment booking software that works like your', titleAccent: 'own studio manager.' },
      testimonials: { title: 'Built for how shoots really get booked.', subtitle: 'Photographers and studios — dates booked and secured, without the back-and-forth.' },
    },
    madeFor: "India's Photographers",
    testimonials: [
      { quote: 'Deposits at booking ended last-minute cancellations. Clients who book now actually show up with the date locked.', name: 'Kabir Malhotra', role: 'Wedding Photographer', avatar: null },
      { quote: 'My whole booking used to live in Instagram DMs. One link took over and I finally stopped losing track of dates.', name: 'Sara D’Souza', role: 'Portrait Photographer', avatar: null },
      { quote: 'Clients pay the advance online before the shoot now. It looks far more professional than sending a GPay number.', name: 'Nikhil Verma', role: 'Studio Owner', avatar: null },
    ],
  },

  events: {
    slug: 'events',
    label: 'Event Organisers',
    icon: Calendar,
    theme: {
      primary: '#3b0764', accent: '#a855f7', accentCta: '#7e22ce',
      tint: '#faf5ff', heroFrom: '#3b0764', heroTo: '#581c87',
    },
    seo: {
      title: 'Appointment Booking Software for Event Organisers | Book A Sloth',
      description:
        'Let clients book consultations and secure dates online. Book A Sloth is booking software for event planners & organisers — advances collected upfront, calendar synced, automatic reminders, GST invoices. From ₹10/day.',
      keywords:
        'booking software for event planners, event consultation booking, event organiser scheduling, book event planner online India, secure event date deposit, wedding planner booking system',
      ogTitle: 'Still locking event dates over phone calls? Fix it for ₹10/day.',
      ogDescription:
        'Clients book a consultation, pay an advance to hold the date, and get reminded — automatically. The booking page every event planner in India should already have.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-events-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Event Planners, Organisers & Decorators',
      headline: 'Dates held, deposits in,',
      headlineAccent: 'before the first meeting.',
      headlineTail: ' Clients book a consult, pay to hold the date, and get reminded — automatically.',
      subline:
        'You create the celebration. Book A Sloth handles everything around it — clients book a consultation, pay an advance to hold the date, and get reminded — so you plan events, not your calendar.',
      ctaText: 'Set Up My Booking Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Celebrations by Neha',
        practiceTag: 'Wedding & Event Planner',
        services: [
          { name: 'Planning Consultation', meta: '45 min · Online', price: '₹1,500' },
          { name: 'Date Hold Advance', meta: 'Secures your date', price: '₹10,000' },
        ],
      },
    },
    socialProof: 'Trusted by wedding planners, event organisers and decorators across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Client data encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Consultations booked, any hour' },
      { icon: BadgePercent, value: '0%', label: 'Commission — you keep every rupee' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your page' },
    ],
    painPoints: [
      { icon: PhoneCall, problem: 'Endless calls just to lock a consultation time', solution: 'One link. Clients pick a slot themselves — you stop playing phone tag over dates.' },
      { icon: IndianRupee, problem: 'Dates held on a promise, then lost to no advance', solution: 'Collect an advance online to hold the date — only committed clients block your calendar.' },
      { icon: CalendarX2, problem: 'Two clients chasing the same peak-season date', solution: 'Dates lock the moment an advance is paid — no accidental double-bookings.' },
      { icon: MessageSquareX, problem: 'Enquiries scattered across calls, DMs and email', solution: 'Every enquiry becomes a booked consultation from one link — nothing slips through.' },
      { icon: UserX, problem: 'No-shows for planning meetings you prepped for', solution: 'Reminders plus a paid consultation mean serious clients actually turn up.' },
      { icon: Clock3, problem: 'Late-night enquiries lost before you reply', solution: 'Your page books 24/7 — a couple reserves a consultation at midnight, you see it at breakfast.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Bookings around the clock', desc: 'Your booking page is live 24/7. Clients book consultations while you’re running an event.' },
      { icon: Wallet, title: 'Advances paid upfront', desc: 'Collect consultation fees or a date-hold advance via UPI, card or netbanking. GST invoice automatic.' },
      { icon: ShieldCheck, title: 'Client details stay private', desc: 'Encrypted, access-controlled and never sold. Your client list and events belong to you alone.' },
      { icon: BellRing, title: 'Reminders that cut no-shows', desc: 'Email + WhatsApp reminders send themselves before every meeting — you never chase a client.' },
    ],
    pricing: { hook: 'Less than a cup of chai a day.', line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one held date covers years.' },
    midCtas: {
      afterProblems: { text: 'Plan events, not your calendar.', ctaText: 'Get My Booking Link' },
      afterHow: { text: 'Your next client is ready to book a consultation. Make it one click.', ctaText: 'Set Up My Page Free' },
    },
    faq: [
      { q: 'What is the best booking software for event planners in India?', a: 'Book A Sloth is built for Indian event planners — clients book consultations online, pay an advance to hold a date via UPI or card, and get automatic reminders. It syncs with your calendar, handles GST invoicing and charges 0% commission on paid plans.' },
      { q: 'Can clients pay an advance to hold their date?', a: 'Yes. You can collect a consultation fee or a date-hold advance at checkout through Razorpay (UPI, cards, netbanking), with a GST invoice generated automatically — so only committed clients block your calendar.' },
      { q: 'Does it prevent double-booking peak dates?', a: 'Yes. A date locks the moment its advance is paid, and Google Calendar busy-time blocking keeps availability accurate — so two clients can never hold the same date.' },
      { q: 'How does it reduce no-shows for planning meetings?', a: 'Automatic email and WhatsApp reminders go out before every consultation, and paid consultations mean serious clients actually attend.' },
      { q: 'How much does it cost?', a: 'You can start free with a 5% per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
      { q: 'Is it suitable for wedding planners and decorators?', a: 'Yes. Wedding and event planners, decorators, caterers and venue managers can all use Book A Sloth for consultation bookings, date holds and payments from one link.' },
    ],
    finalCta: { icon: Sparkles, urgency: 'Every un-held date is an event that went to another planner.', headline: 'More celebrations. Less coordination.', subline: 'Set up your event booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.', ctaText: 'Create My Booking Page' },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Creating memorable events is the job.', titleAccent: 'Event scheduling shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'Appointment booking software that works like your', titleAccent: 'own event coordinator.' },
      testimonials: { title: 'Built for how events really come together.', subtitle: 'Planners and organisers — consultations booked and dates held, without the chaos.' },
    },
    madeFor: "India's Event Planners",
    testimonials: [
      { quote: 'Date-hold advances online changed my business. Clients commit with a payment instead of a maybe, and I stopped losing peak dates.', name: 'Neha Kapoor', role: 'Wedding Planner', avatar: null },
      { quote: 'Consultations used to be endless calls to find a time. Now clients just book a slot and pay — my week runs itself.', name: 'Suresh Pillai', role: 'Event Organiser', avatar: null },
      { quote: 'Every enquiry now turns into a booked, paid consultation from one link. Nothing slips through the cracks anymore.', name: 'Anjali Rao', role: 'Event Decorator', avatar: null },
    ],
  },

  agencies: {
    slug: 'agencies',
    label: 'Agencies & Studios',
    icon: Building2,
    theme: {
      primary: '#083344', accent: '#06b6d4', accentCta: '#0e7490',
      tint: '#ecfeff', heroFrom: '#083344', heroTo: '#164e63',
    },
    seo: {
      title: 'Appointment Booking Software for Agencies & Studios | Book A Sloth',
      description:
        'Let clients book discovery calls with your team online. Book A Sloth is booking software for agencies & studios — calls routed, fees collected upfront, calendar synced, GST invoices. From ₹10/day.',
      keywords:
        'booking software for agencies, discovery call scheduling, agency client booking, studio booking system India, book agency consultation, team scheduling software, creative studio booking',
      ogTitle: 'Still scheduling discovery calls over email chains? Fix it for ₹10/day.',
      ogDescription:
        'Clients book a call with the right person on your team, pay upfront, and get reminded — automatically. The booking page every agency and studio should already have.',
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-agencies-og-1200x630.jpg',
    },
    hero: {
      eyebrow: 'For Agencies, Studios & Creative Teams',
      headline: 'Discovery calls booked,',
      headlineAccent: 'before the email thread starts.',
      headlineTail: ' Leads pick a slot, the call is routed, and reminders go out — automatically.',
      subline:
        'Your team does the work. Book A Sloth handles everything around it — clients pick a slot with the right person, pay if you charge, and get reminded — so your team pitches, not schedules.',
      ctaText: 'Set Up My Booking Page',
      microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
      mock: {
        practice: 'Northlight Studio',
        practiceTag: 'Design & Brand Agency',
        services: [
          { name: 'Discovery Call', meta: '30 min · Online', price: 'Free' },
          { name: 'Paid Strategy Session', meta: '60 min · Online', price: '₹5,000' },
        ],
      },
    },
    socialProof: 'Trusted by design, marketing and creative studios across India.',
    trust: [
      { icon: Lock, label: 'Razorpay-secured payments' },
      { icon: FileCheck, label: 'Automatic GST invoices' },
      { icon: ShieldCheck, label: 'Client data encrypted & private' },
      { icon: BadgePercent, label: '0% commission on paid plans' },
    ],
    stats: [
      { icon: CalendarClock, value: '24/7', label: 'Discovery calls booked, any time zone' },
      { icon: Users, value: 'Whole', label: 'Team on one shared calendar' },
      { icon: IndianRupee, value: '~₹10', label: 'A day for the top, unlimited plan' },
      { icon: CalendarCheck, value: '< 5 min', label: 'To go live with your page' },
    ],
    painPoints: [
      { icon: MessageSquareX, problem: 'Discovery calls scheduled across long email chains', solution: 'One link. Prospects pick a slot themselves — no “does Thursday work for your team?”' },
      { icon: Users, problem: 'Juggling one calendar across the whole team', solution: 'Route each call to the right person; every team member’s real availability, one page.' },
      { icon: Target, problem: 'Unqualified leads eating your team’s time', solution: 'Intake questions and paid strategy slots filter tyre-kickers before they reach the calendar.' },
      { icon: IndianRupee, problem: 'Paid workshops and audits invoiced after the fact', solution: 'Charge for paid sessions upfront — money’s in before the call, with a GST invoice.' },
      { icon: UserX, problem: 'Prospects no-showing booked pitch calls', solution: 'Automatic reminders before every call keep your pipeline meetings actually happening.' },
      { icon: Clock3, problem: 'Overseas leads lost to slow scheduling', solution: 'Your page books 24/7 in the client’s time zone — a lead reserves while your team sleeps.' },
    ],
    features: [
      { icon: CalendarCheck, title: 'Bookings around the clock', desc: 'Your booking page is live 24/7. Prospects reserve calls while your team is deep in delivery.' },
      { icon: Wallet, title: 'Paid sessions upfront', desc: 'Charge for strategy sessions, audits or workshops via UPI, card or netbanking. GST invoice automatic.' },
      { icon: ShieldCheck, title: 'Client details stay private', desc: 'Encrypted, access-controlled and never sold. Your pipeline and client list belong to you alone.' },
      { icon: BellRing, title: 'Reminders that cut no-shows', desc: 'Email + WhatsApp reminders send themselves before every call — no one on the team chases leads.' },
    ],
    pricing: { hook: 'Less than a cup of chai a day.', line: 'Start free. Go unlimited and 0% commission from about ₹10/day — one closed lead covers years.' },
    midCtas: {
      afterProblems: { text: 'Let your team pitch, not schedule.', ctaText: 'Get My Booking Link' },
      afterHow: { text: 'Your next lead is ready to book a call. Make it one click.', ctaText: 'Set Up My Page Free' },
    },
    faq: [
      { q: 'What is the best booking software for agencies and studios in India?', a: 'Book A Sloth is built for Indian agencies and studios — prospects book discovery calls with the right team member online, pay for paid sessions upfront via UPI or card, and get automatic reminders. It syncs each person’s calendar, handles GST invoicing and charges 0% commission on paid plans.' },
      { q: 'Can I route calls to different team members?', a: 'Yes. Each team member can have their own services and availability, so prospects book the right person and slots never clash across the team.' },
      { q: 'Can I charge for paid strategy sessions or audits?', a: 'Yes. You can offer free discovery calls and paid sessions side by side, collecting fees at checkout through Razorpay with a GST invoice generated automatically.' },
      { q: 'Can I filter out unqualified leads?', a: 'Yes. Intake questions and paid strategy slots filter out tyre-kickers before they ever reach your team’s calendar.' },
      { q: 'How much does it cost?', a: 'You can start free with a 5% per-booking fee. Paid plans begin at roughly ₹10 a day (billed yearly) and remove all commission, so you keep 100% of every fee.' },
      { q: 'Is it suitable for design, marketing and dev studios?', a: 'Yes. Design, branding, marketing, development and creative studios of any size can use Book A Sloth to route discovery calls and collect payments from one shared link.' },
    ],
    finalCta: { icon: TrendingUp, urgency: 'Every slow reply is a lead that booked a competitor.', headline: 'More pitches. Less scheduling.', subline: 'Set up your agency booking page in minutes. Free to start, no card required — cancel anytime, no lock-in.', ctaText: 'Create My Booking Page' },
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Winning great clients is the job.', titleAccent: 'Client scheduling shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'Appointment booking software that works like your', titleAccent: 'own client-services lead.' },
      testimonials: { title: 'Built for how agencies really run.', subtitle: 'Studios and teams — discovery calls booked and routed, without the admin.' },
    },
    madeFor: "India's Agencies & Studios",
    testimonials: [
      { quote: 'Discovery calls used to bounce around email for days. One link routes each lead to the right person and books instantly.', name: 'Aditya Rao', role: 'Agency Founder', avatar: null },
      { quote: 'Charging for strategy sessions upfront filtered out tyre-kickers overnight. My team only meets serious prospects now.', name: 'Tara Menon', role: 'Studio Director', avatar: null },
      { quote: 'The whole team shares one booking page. No more clashing calendars or double-booked pitch calls.', name: 'Rohan Gupta', role: 'Creative Lead', avatar: null },
    ],
  },
};

// therapists + yoga-instructors — served by the /for/:profession catch-all.
// Stats and copy use product facts only (no usage numbers); testimonials come
// from the consented pool via testimonialRoles.
PROFESSION_LANDING.therapists = {
  slug: 'therapists',
  label: 'Therapists & Counsellors',
  icon: HeartPulse,

  // ── Theme: calm: deep sky base + clear sky blue ─────────────────────────
  theme: {
    primary: '#082f49',    // sky-950: ink / headings
    accent: '#0ea5e9',     // sky-500: signature colour
    accentCta: '#0369a1',  // sky-700, AA-safe for white-text buttons (5.9:1)
    tint: '#f0f9ff',       // sky-50 wash
    heroFrom: '#082f49',   // sky-950
    heroTo: '#0c4a6e',     // sky-900
  },

  seo: {
    title: 'Booking & Payments for Therapists in India | Book A Sloth',
    description:
      'Booking and payments for therapists and counsellors in India. Clients book private sessions, pay upfront by UPI, and get reminders and a Meet link. Start free.',
    keywords:
      'booking software for therapists India, therapist booking and payments, counsellor appointment booking, psychologist online booking India, therapy session payment UPI, online counselling booking page, reduce therapy no-shows',
    ogTitle: 'Still booking therapy sessions over WhatsApp? Fix it for ₹10/day.',
    ogDescription:
      'Clients book a private session, pay upfront and get reminded, automatically. The booking page every therapist and counsellor in India should already have.',
  },

  hero: {
    eyebrow: 'For Psychologists, Counsellors & Therapists',
    headline: 'Your sessions,',
    headlineAccent: 'booked and paid',
    headlineTail: 'before the session begins.',
    subline:
      'You hold the space. Book A Sloth handles everything around it: clients pick a private slot, pay upfront by UPI, and get a reminder with the Meet link, so your hours go to clients and the scheduling runs itself.',
    ctaText: 'Set Up My Booking Page',
    microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
    mock: {
      practice: 'Kavya’s Counselling Practice',
      practiceTag: 'Counselling Psychologist · Online & In-person',
      services: [
        { name: 'First Session', meta: '60 min · Google Meet', price: '₹1,500' },
        { name: 'Follow-up Session', meta: '50 min · Online', price: '₹1,200' },
      ],
    },
  },

  socialProof: 'Built for psychologists, counsellors and therapists across India.',

  trust: [
    { icon: Lock, label: 'Razorpay-secured payments' },
    { icon: FileCheck, label: 'Automatic GST invoices' },
    { icon: ShieldCheck, label: 'Client data encrypted & private' },
    { icon: BadgePercent, label: '0% commission on Sloth Active' },
  ],

  // Product facts only: no usage numbers.
  stats: [
    { icon: CalendarClock, value: '24/7', label: 'Clients book a private slot, any hour' },
    { icon: BellRing, value: '24h', label: 'Reminder before every session' },
    { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active' },
    { icon: IndianRupee, value: '₹0', label: 'To start on the free Sloth plan' },
  ],

  painPoints: [
    {
      icon: MessageSquareX,
      problem: 'Fixing session times over long WhatsApp threads',
      solution: 'One link. Clients pick a free slot themselves, so your personal number stops being a scheduling line.',
    },
    {
      icon: IndianRupee,
      problem: 'Awkward fee conversations at the end of a session',
      solution: 'Clients pay upfront by UPI, card or netbanking when they book. The session ends on the work, with nothing left to ask for.',
    },
    {
      icon: UserX,
      problem: 'Late cancellations and no-shows on weekly slots',
      solution: 'Prepaid sessions, automatic reminders and your cancellation terms shown before payment help keep weekly slots filled.',
    },
    {
      icon: ClipboardList,
      problem: 'Repeating intake questions in the first session',
      solution: 'Add intake fields to your booking form on Sloth Active and read the answers before you meet.',
    },
    {
      icon: Lock,
      problem: 'Worrying about where client details live',
      solution: 'Client details are encrypted, access-controlled and never sold. Your client list and notes are visible only to you.',
    },
    {
      icon: Laptop,
      problem: 'Sending video links by hand before every session',
      solution: 'Each online booking gets its own Google Meet link, sent with the confirmation and the reminder.',
    },
  ],

  features: [
    {
      icon: CalendarCheck,
      title: 'Weekly slots, easy to rebook',
      desc: 'Set your weekly hours and blocked dates once. Clients rebook their usual slot from your link, and Sloth Active sends follow-ups that invite them back.',
    },
    {
      icon: Wallet,
      title: 'Sessions paid upfront',
      desc: 'Clients pay by UPI, card or netbanking at booking. The booking confirms on payment and a GST invoice is generated automatically.',
    },
    {
      icon: ShieldCheck,
      title: 'Confidential by default',
      desc: 'Encrypted, access-controlled and never sold. Your client list, private notes and session history belong to you alone.',
    },
    {
      icon: BellRing,
      title: 'Reminders and Meet links, sent for you',
      desc: 'Email and WhatsApp reminders go out 24 hours before each session, plus 1 hour before on Sloth Active. Online sessions get a Google Meet link automatically.',
    },
  ],

  pricing: {
    hook: 'Less than a cup of chai a day.',
    line: 'Start free on Sloth with 5% per paid booking. Sloth Active is ₹399/month or ₹3,599/year, GST included, with 0% commission.',
  },

  midCtas: {
    afterProblems: {
      text: 'Give your hours to clients. Let one link handle the scheduling.',
      ctaText: 'Get My Booking Link',
    },
    afterHow: {
      text: 'Your next client is ready to book a session. Make it one tap.',
      ctaText: 'Set Up My Page Free',
    },
  },

  faq: [
    {
      q: 'What is the best booking and payment software for therapists in India?',
      a: 'Book A Sloth is built for Indian therapists, psychologists and counsellors. Clients book a private session from your link, pay upfront by UPI, card or netbanking, and get automatic reminders and a Google Meet link for online sessions. It generates GST invoices and charges 0% commission on Sloth Active.',
    },
    {
      q: 'Can clients pay for therapy sessions in advance?',
      a: 'Yes. Your fee is shown on each service and collected at checkout through Razorpay by UPI, card or netbanking. The booking confirms automatically once the payment goes through, and a GST invoice is generated.',
    },
    {
      q: 'Can I run weekly recurring sessions?',
      a: 'You set your weekly hours once, and clients rebook their usual slot from your link after each session, paying for each one upfront. Book A Sloth does not create an automatic repeating series or charge clients on a subscription. On Sloth Active, follow-up messages invite clients to book their next session.',
    },
    {
      q: 'Can I collect intake information before the first session?',
      a: 'Yes. On Sloth Active you can add custom intake fields to your booking form, so you read the client’s answers before you meet. Sloth Active also keeps a client record with private notes and booking history.',
    },
    {
      q: 'How are client details kept confidential?',
      a: 'Client details are encrypted, access-controlled and never sold, and only you can see your client list and notes. If clients share a phone with family, use a neutral service name such as “Session”, since the service name can appear in confirmations and reminders.',
    },
    {
      q: 'Can I set a cancellation policy?',
      a: 'Yes. Write your cancellation and rescheduling terms in each service description so clients see them before they pay. Clients can reschedule from their booking, and if you cancel a session the client is refunded in full, including the booking fee.',
    },
    {
      q: 'How much does it cost?',
      a: 'You can start free on the Sloth plan, which charges 5% per paid booking. Sloth Active costs ₹399 a month or ₹3,599 a year, GST included, with 0% commission. Clients pay a ₹10 booking fee plus GST on it at checkout, and the payment gateway’s charge applies on both plans.',
    },
  ],

  finalCta: {
    icon: HeartPulse,
    urgency: 'Every unanswered enquiry is a client who may look elsewhere.',
    headline: 'More sessions. Less admin.',
    subline: 'Set up your therapy booking page in minutes. Free to start, no card required, cancel anytime.',
    ctaText: 'Create My Booking Page',
  },

  headings: {
    problems: { eyebrow: 'The daily friction', title: 'Holding space for clients is the job.', titleAccent: 'The scheduling shouldn’t be.' },
    features: { eyebrow: 'What you get', title: 'A booking page that works like your', titleAccent: 'own quiet front desk.' },
    testimonials: { title: 'Built for how independent practices run.', subtitle: 'Hosts across professions use Book A Sloth to get booked and paid without the admin.' },
  },

  madeFor: "India's Therapists & Counsellors",

  // No profession-specific quotes: real shared testimonials, nearest role first.
  testimonialRoles: ['Physiotherapist'],
};

PROFESSION_LANDING['yoga-instructors'] = {
  slug: 'yoga-instructors',
  label: 'Yoga Instructors',
  icon: Sparkles,

  // ── Theme: grounded: deep forest base + fresh lime ──────────────────────
  theme: {
    primary: '#1a2e05',    // lime-950: ink / headings
    accent: '#84cc16',     // lime-500: signature colour
    accentCta: '#4d7c0f',  // lime-700, AA-safe for white-text buttons (5.0:1)
    tint: '#f7fee7',       // lime-50 wash
    heroFrom: '#1a2e05',   // lime-950
    heroTo: '#365314',     // lime-900
  },

  seo: {
    title: 'Yoga Class Booking for Instructors | Book A Sloth',
    description:
      'Yoga class booking for instructors in India. Students book trial and private classes, pay upfront by UPI, and get WhatsApp reminders and Meet links. Start free.',
    keywords:
      'yoga class booking for instructors, yoga class booking India, online yoga class booking, yoga trial class booking, collect yoga fees UPI, yoga teacher scheduling software, private yoga session booking',
    ogTitle: 'Still collecting yoga fees on WhatsApp? Fix it for ₹10/day.',
    ogDescription:
      'Students book a class, pay upfront by UPI and get reminded, automatically. The booking page every yoga instructor in India should already have.',
  },

  hero: {
    eyebrow: 'For Yoga Instructors & Teachers',
    headline: 'Your classes,',
    headlineAccent: 'booked and paid',
    headlineTail: 'before the first sun salutation.',
    subline:
      'You teach the practice. Book A Sloth handles everything around it: students book a trial or private class, pay upfront by UPI, and get a reminder with the Meet link, so your mornings stay on the mat.',
    ctaText: 'Set Up My Booking Page',
    microcopy: 'Free to start · No card needed · No lock-in · Live in minutes',
    mock: {
      practice: 'Sunrise Yoga with Neha',
      practiceTag: 'Yoga Instructor · Hatha & Vinyasa',
      services: [
        { name: 'Trial Class', meta: '45 min · Google Meet', price: 'Free' },
        { name: 'Private Yoga Session', meta: '60 min · In-person', price: '₹800' },
      ],
    },
  },

  socialProof: 'Built for yoga instructors and teachers across India.',

  trust: [
    { icon: Lock, label: 'Razorpay-secured payments' },
    { icon: FileCheck, label: 'Automatic GST invoices' },
    { icon: ShieldCheck, label: 'Student data encrypted & private' },
    { icon: BadgePercent, label: '0% commission on Sloth Active' },
  ],

  // Product facts only: no usage numbers.
  stats: [
    { icon: CalendarClock, value: '24/7', label: 'Trial and private classes booked, any hour' },
    { icon: BellRing, value: '24h', label: 'Reminder before every class' },
    { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active' },
    { icon: IndianRupee, value: '₹0', label: 'To start on the free Sloth plan' },
  ],

  painPoints: [
    {
      icon: MessageSquareX,
      problem: 'Answering “what are your timings?” on WhatsApp all day',
      solution: 'One link shows your open slots. Students pick a time and book without the back-and-forth.',
    },
    {
      icon: IndianRupee,
      problem: 'Chasing fees and UPI screenshots every month',
      solution: 'Students pay by UPI, card or netbanking when they book, and each payment comes with a GST invoice. Nothing is left to chase.',
    },
    {
      icon: UserX,
      problem: 'Trial students who book and never turn up',
      solution: 'Trials are booked with a verified phone number, and a reminder goes out 24 hours before class.',
    },
    {
      icon: Laptop,
      problem: 'Sending Meet links to every student before class',
      solution: 'Every online booking gets its own Google Meet link, sent with the confirmation and the reminder.',
    },
    {
      icon: CalendarX2,
      problem: 'Private sessions clashing with your own practice and family time',
      solution: 'Set weekly hours, block dates and sync Google Calendar, so students only see times you are free.',
    },
    {
      icon: Clock3,
      problem: 'Late-night enquiries lost by morning',
      solution: 'Your page takes bookings 24/7. A student signs up at night, and you see it before your first class.',
    },
  ],

  features: [
    {
      icon: CalendarCheck,
      title: 'Trial and private classes, one link',
      desc: 'Offer a free trial alongside paid private and online sessions. Students book from your Instagram bio, WhatsApp or website.',
    },
    {
      icon: Wallet,
      title: 'Fees paid upfront by UPI',
      desc: 'Collect each class fee at booking via UPI, card or netbanking. A GST invoice is generated automatically.',
    },
    {
      icon: BellRing,
      title: 'Reminders and Meet links',
      desc: 'Email and WhatsApp reminders 24 hours before class, plus 1 hour before on Sloth Active. Online classes get a Google Meet link automatically.',
    },
    {
      icon: Users,
      title: 'Know your regulars',
      desc: 'On Sloth Active, your client list keeps each student’s booking history and notes, and shows who has not booked in a while.',
    },
  ],

  pricing: {
    hook: 'Less than a cup of chai a day.',
    line: 'Start free on Sloth with 5% per paid booking. Sloth Active is ₹399/month or ₹3,599/year, GST included, with 0% commission.',
  },

  midCtas: {
    afterProblems: {
      text: 'Spend your time teaching. Let one link handle bookings and fees.',
      ctaText: 'Get My Booking Link',
    },
    afterHow: {
      text: 'Your next student is ready to book a class. Make it one tap.',
      ctaText: 'Set Up My Page Free',
    },
  },

  faq: [
    {
      q: 'What is the best yoga class booking software for instructors in India?',
      a: 'Book A Sloth is built for Indian yoga instructors. Students book trial and private classes from your link, pay upfront by UPI, card or netbanking, and get automatic reminders and a Google Meet link for online classes. It generates GST invoices and charges 0% commission on Sloth Active.',
    },
    {
      q: 'Can I offer a free trial class?',
      a: 'Yes. You can list a free (₹0) trial class next to your paid sessions. The free Sloth plan includes up to 2 free services, and a free booking carries no booking fee or commission.',
    },
    {
      q: 'Can students pay monthly batch fees by UPI?',
      a: 'Every booking on Book A Sloth is paid upfront by UPI, card or netbanking, with a GST invoice. Each slot takes one booking, and there is no automatic monthly billing, so group batches with shared seats are not supported today. It works best for trial classes, private sessions and 1:1 online classes, where each student books their own slot.',
    },
    {
      q: 'Can I teach online with Google Meet?',
      a: 'Yes. Connect Google Calendar and every online booking gets its own Google Meet link, added to your calendar and sent to the student. In-person classes show your location instead.',
    },
    {
      q: 'Do students get WhatsApp reminders?',
      a: 'Yes. Reminders go to you and the student 24 hours before class on every plan, and Sloth Active adds a reminder 1 hour before. On the free plan, WhatsApp reminders run for the first 60 days after signup and then continue by email.',
    },
    {
      q: 'How much does it cost?',
      a: 'You can start free on the Sloth plan, which charges 5% per paid booking. Sloth Active costs ₹399 a month or ₹3,599 a year, GST included, with 0% commission. Students pay a ₹10 booking fee plus GST on it at checkout for paid classes, and the payment gateway’s charge applies on both plans.',
    },
  ],

  finalCta: {
    icon: Sparkles,
    urgency: 'Every unanswered enquiry is a student who may join another class.',
    headline: 'More practice. Less admin.',
    subline: 'Set up your yoga booking page in minutes. Free to start, no card required, cancel anytime.',
    ctaText: 'Create My Booking Page',
  },

  headings: {
    problems: { eyebrow: 'The daily friction', title: 'Teaching a good class is the job.', titleAccent: 'Fee follow-ups shouldn’t be.' },
    features: { eyebrow: 'What you get', title: 'A booking page that works like your', titleAccent: 'own studio desk.' },
    testimonials: { title: 'Built for how independent teachers work.', subtitle: 'Hosts across professions use Book A Sloth to get booked and paid without the admin.' },
  },

  madeFor: "India's Yoga Instructors",

  // No profession-specific quotes: real shared testimonials, nearest role first.
  testimonialRoles: ['Physiotherapist'],
};

export const getProfessionLanding = (slug) =>
  (slug && PROFESSION_LANDING[slug.toLowerCase()]) || null;

export default PROFESSION_LANDING;

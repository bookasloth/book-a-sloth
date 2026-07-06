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
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-lawyers-og-1200x630.png',
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
      eyebrow: 'For Lawyers, Advocates & Chartered Accountants',
      headline: 'Your consultations,',
      headlineAccent: 'booked and paid',
      headlineTail: 'before the first call.',
      subline:
        'Book A Sloth gives every lawyer and CA one professional link — clients pick a slot, pay your fee upfront, and get reminded. You stay in court, not in your inbox.',
      ctaText: 'Set Up My Booking Page',
      microcopy: 'Free to start · No card needed · Live in minutes',
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
        solution: 'Two-way Google Calendar sync locks your real availability. No double-booking, ever.',
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
        a: 'Yes. Book A Sloth offers two-way Google Calendar sync, so blocked court dates and existing appointments are never offered as available slots. Booked slots lock instantly to prevent double-booking.',
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
      subline: 'Set up your consultation booking page in minutes. Free to start, no card required.',
      ctaText: 'Create My Booking Page',
    },

    // ── Section headings (profession-specific, not homepage reuse) ───────────
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Practising law is hard enough.', titleAccent: 'The scheduling shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like a', titleAccent: 'clerk who never sleeps.' },
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
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-doctors-og-1200x630.png',
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
      eyebrow: 'For Doctors, Clinics & Independent Practitioners',
      headline: 'Your patients,',
      headlineAccent: 'booked and reminded',
      headlineTail: 'without the front-desk chaos.',
      subline:
        'Book A Sloth gives your clinic one link — patients pick a slot, pay upfront, and get automatic reminders. Fewer no-shows, fewer phone calls, more time with patients.',
      ctaText: 'Set Up My Clinic Page',
      microcopy: 'Free to start · No card needed · Live in minutes',
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
      { icon: TrendingDown, value: 'Fewer', label: 'No-shows, thanks to auto reminders' },
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
      subline: 'Set up your clinic’s booking page in minutes. Free to start, no card required.',
      ctaText: 'Create My Clinic Page',
    },

    // ── Section headings ─────────────────────────────────────────────────────
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Caring for patients is the job.', titleAccent: 'The scheduling shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that runs like your', titleAccent: 'best front-desk nurse.' },
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
      ogImage: 'https://company-assets.bookasloth.in/images/seo/for-business-consultant-og-1200x630.png',
    },

    // ── Hero ─────────────────────────────────────────────────────────────────
    hero: {
      eyebrow: 'For Business Consultants, Advisors & Strategists',
      headline: 'Your strategy sessions,',
      headlineAccent: 'booked and paid',
      headlineTail: 'before the first email reply.',
      subline:
        'Book A Sloth gives every consultant one professional link — clients pick a slot, pay your fee upfront, and get reminded. You spend your time advising, not scheduling.',
      ctaText: 'Set Up My Booking Page',
      microcopy: 'Free to start · No card needed · Live in minutes',
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
        solution: 'Two-way calendar sync shows only your real free slots. No clashes, no double-booking.',
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
      subline: 'Set up your consulting booking page in minutes. Free to start, no card required.',
      ctaText: 'Create My Booking Page',
    },

    // ── Section headings ─────────────────────────────────────────────────────
    headings: {
      problems: { eyebrow: 'The daily friction', title: 'Advising clients is the work.', titleAccent: 'The scheduling shouldn’t be.' },
      features: { eyebrow: 'What you get', title: 'A booking page that works like your', titleAccent: 'own executive assistant.' },
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
};

// doctors-india — identical content to `doctors`, but a blue palette. Built by
// spreading the doctors entry and overriding only slug + theme + SEO (canonical
// resolves to /for/doctors-india automatically in ProfessionLanding).
PROFESSION_LANDING['doctors-india'] = {
  ...PROFESSION_LANDING.doctors,
  slug: 'doctors-india',
  theme: {
    primary: '#12395c',    // deep blue — ink / headings
    accent: '#2563eb',     // brand blue — signature colour
    accentCta: '#1d4ed8',  // blue-700, AA-safe for white-text buttons
    tint: '#eef4fb',        // soft blue wash
    heroFrom: '#0a2540',   // dark navy
    heroTo: '#123a5c',     // navy-blue
  },
  seo: {
    ...PROFESSION_LANDING.doctors.seo,
    title: 'Appointment Booking Software for Doctors in India | Book A Sloth',
    ogImage: 'https://company-assets.bookasloth.in/images/seo/for-doctors-india-og-1200x630.png',
  },
};

export const getProfessionLanding = (slug) =>
  (slug && PROFESSION_LANDING[slug.toLowerCase()]) || null;

export default PROFESSION_LANDING;

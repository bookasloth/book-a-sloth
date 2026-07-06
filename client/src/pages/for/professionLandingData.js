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

    // ── Lawyer-specific testimonials (illustrative until real quotes collected) ─
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
    testimonialsNote: 'Illustrative examples pending verified client consent.',
  },
};

export const getProfessionLanding = (slug) =>
  (slug && PROFESSION_LANDING[slug.toLowerCase()]) || null;

export default PROFESSION_LANDING;

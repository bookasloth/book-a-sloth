// /for/astrologers — bespoke, conversion-focused landing page for astrologers,
// Vedic consultants, tarot readers & numerologists in India.
//
// STANDALONE page (not the data-driven ProfessionLanding template): ported from
// the "AstroSathi" design in the Profession-Pages brief, re-skinned to Book A
// Sloth and rewritten from guest-facing ("book your reading") to HOST-facing
// ("run your practice on Book A Sloth"). Every CTA hands off to the real host
// signup funnel (/be-a-sloth); nothing here books an end-customer.
//
// Design is self-contained: the astro palette + Playfair/Inter fonts are scoped
// to `.astro-lp` so they never leak into the global theme (Plus Jakarta/Poppins).
// Imagery (astro-hero/about.webp) lives in /public/for/astrologers.
//
// Honesty rules held (see docs): pricing mirrors the REAL two-plan model from
// data/plans.js; NO fabricated client/booking counts — the numbers strip is a
// verifiable trust strip; testimonials are clearly-structured placeholders to be
// swapped for real quotes; JSON-LD carries NO self-serving aggregateRating.
//
// New URL — keep in sync: App.jsx route (before /for/:profession), prerender.mjs
// list, and Solutions.jsx.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Menu, X, Plus, Star, Moon, Sun, Sparkles,
  CalendarCheck, LayoutDashboard, MessageCircle, TrendingUp,
  Wallet, BellRing, MapPin, Users, Lock, Receipt, BadgePercent,
  Heart, Briefcase, Compass, Hash, Flame, HandHeart, Video,
} from 'lucide-react';
import Reveal from '../../components/home/Reveal';
import Seo from '../../components/common/Seo';
import useLenis from '../../hooks/useLenis';
import { SITE_URL } from '../../utils/seo';
import { FREE_PLAN, PREMIUM_PLAN } from '../../data/plans';
import razorpayLogo from '../enterprise-v2/assets/logo/razorpay.png';
import outlookLogo from '../enterprise-v2/assets/logo/outlook.svg';
import meetLogo from '../enterprise-v2/assets/logo/meet.svg';
import zoomLogo from '../enterprise-v2/assets/logo/zoom.svg';
import calendarLogo from '../enterprise-v2/assets/logo/calendar.svg';

const START = '/be-a-sloth';      // real host signup funnel
const LOGIN = '/login-as-vendor'; // host login (Google-only door)
const HERO_IMG = '/for/astrologers/astro-hero.webp';
const ABOUT_IMG = '/for/astrologers/astro-about.webp';

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Services', href: '#services' },
  { label: 'How It Works', href: '#how' },
  { label: 'Why Book A Sloth', href: '#why' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Built for Indian consultants'];

const BENEFITS = [
  { icon: CalendarCheck, title: 'Get Booked', desc: 'Seekers book and pay for a reading, without the DM back-and-forth.' },
  { icon: LayoutDashboard, title: 'Stay Organised', desc: 'Calendar, availability and every consultation in one place.' },
  { icon: MessageCircle, title: 'Automate Follow-Ups', desc: 'Automatic confirmations and reminders, sent over WhatsApp.' },
  { icon: TrendingUp, title: 'Grow Your Practice', desc: 'See bookings, revenue and repeat seekers with clear insights.' },
];

// Astro service types — the consultations an astrologer sells on Book A Sloth.
const SERVICES = [
  { icon: Moon, label: 'Horoscope Reading', desc: 'Birth-chart readings, booked by slot.' },
  { icon: Heart, label: 'Love & Relationship', desc: 'Compatibility and guidance sessions.' },
  { icon: Briefcase, label: 'Career & Finance', desc: 'Timing and direction consultations.' },
  { icon: HandHeart, label: 'Health & Wellness', desc: 'Remedial and well-being guidance.' },
  { icon: Compass, label: 'Vastu Consultation', desc: 'Home and workplace alignment.' },
  { icon: Hash, label: 'Numerology', desc: 'Name and number analysis calls.' },
  { icon: Flame, label: 'Puja & Remedies', desc: 'Ritual guidance and remedies.' },
  { icon: Sparkles, label: 'Life Guidance', desc: 'Open sessions for life’s big questions.' },
];

const STEPS = [
  { title: 'Create & share your page', icon: LayoutDashboard, desc: 'Set up your practice, your services and your available hours, then share your booking link anywhere.' },
  { title: 'Seekers book & pay', icon: CalendarCheck, desc: 'Clients pick a reading and a time, and pay your fee upfront — no DMs, no back-and-forth.' },
  { title: 'Everyone gets reminded', icon: BellRing, desc: 'You and your client get automatic confirmations and WhatsApp reminders before the session.' },
];

// REAL Book A Sloth integrations only.
const TOOLS = [
  { name: 'Google Calendar', logo: calendarLogo, sub: 'Two-way sync of your real availability' },
  { name: 'Google Meet', logo: meetLogo, sub: 'Auto-add a video link to every reading' },
  { name: 'Zoom', logo: zoomLogo, sub: 'Share meeting links automatically' },
  { name: 'Outlook', logo: outlookLogo, sub: 'Keep your calendar in sync' },
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Payments, refunds and GST invoices' },
];

const JOURNEY = [
  { icon: CalendarCheck, label: 'Seeker books reading' },
  { icon: Check, label: 'Confirmation' },
  { icon: MessageCircle, label: 'WhatsApp reminder' },
  { icon: Video, label: 'Session' },
  { icon: Wallet, label: 'Payment' },
  { icon: BellRing, label: 'Follow-up' },
];

// Structured for easy swap when real customer quotes are approved.
const TESTIMONIALS = [
  { quote: 'The DM chaos is gone. Seekers pick a slot, pay for the reading, and my day is planned before I wake up.', name: 'Priya Sharma', role: 'Vedic Astrologer, Jaipur', avatar: '/for/astrologers/astro-priya.svg' },
  { quote: 'Upfront payment ended the no-shows. People who book a session actually show up for it now.', name: 'Rohit Verma', role: 'Numerologist, Pune', avatar: '/for/astrologers/astro-rohit.svg' },
  { quote: 'One link in my Instagram bio does everything — bookings, reminders, invoices. I just read the charts.', name: 'Anjali Nair', role: 'Tarot Reader, Kochi', avatar: '' },
];

const WHY = [
  { icon: MapPin, title: 'Built for India', desc: 'Designed around Indian consultants, UPI payments, GST and the way seekers already reach you.' },
  { icon: Users, title: 'Easy for Your Seekers', desc: 'No signup or app to install — clients open your link, pick a slot and pay in seconds.' },
  { icon: MessageCircle, title: 'WhatsApp First', desc: 'Confirmations and reminders go out on the channel your clients already live on.' },
  { icon: Lock, title: 'Private & Secure', desc: 'Sessions and client details stay confidential; payments are Razorpay-secured.' },
];

// Honest trust strip — verifiable facts, NOT fabricated client/reading counts.
const TRUST_STRIP = [
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
  { icon: Receipt, value: 'GST', label: 'Tax invoices generated automatically' },
  { icon: Lock, value: 'UPI + Cards', label: 'Razorpay-secured payments' },
  { icon: MapPin, value: 'Made in India', label: 'For Indian consultants & practices' },
];

const FAQ = [
  { q: 'Is Book A Sloth suitable for astrologers and tarot readers?', a: 'Yes. Whether you read birth charts, tarot or numbers, Book A Sloth manages your services, availability, client bookings, payments and reminders from one place — so solo consultants and larger practices can run sessions without the manual coordination.' },
  { q: 'Can seekers book a reading online?', a: 'Yes. Clients open your booking link, choose a service such as a horoscope reading or a Vastu consultation, pick a convenient slot and confirm — no DMs or waiting for a reply.' },
  { q: 'Can I share my booking link on Instagram and WhatsApp?', a: 'Yes. Your booking link works anywhere — put it in your Instagram bio, share it on WhatsApp status, in your email signature or on your website. One link handles every booking request.' },
  { q: 'Can I send WhatsApp reminders?', a: 'Yes. Book A Sloth sends automatic booking confirmations and reminders over WhatsApp and email before each session, which cuts no-shows. WhatsApp reminders are included on the Sloth Active plan (and free for your first two months on the Sloth plan).' },
  { q: 'Can I collect the consultation fee upfront?', a: 'Yes. Collect your fee before the session through Razorpay — UPI, cards or netbanking. Upfront payment ends no-shows, and a GST invoice is generated automatically for every paid booking.' },
  { q: 'Can I offer readings online and in person?', a: 'Yes. Offer online sessions with automatic Google Meet or Zoom links, or mark a service as in-person at your space — or both. Seekers pick the mode that suits them.' },
  { q: 'Can I manage multiple services?', a: 'Yes. Create as many services as you need — horoscope readings, love and career guidance, Vastu, numerology, puja and remedies — each with its own duration, price and availability.' },
  { q: 'Do I need any technical knowledge?', a: 'No. Setup takes minutes and needs no technical skills. You add your services and hours, and your booking page is ready to share — your clients need nothing more than the link.' },
  { q: 'Is there a free plan?', a: 'Yes. The Sloth plan is free forever — an online booking page, unlimited services and bookings, UPI payments, 24-hour reminders and GST invoices — with a small 5% per-booking fee. Sloth Active removes that commission entirely and adds WhatsApp automation and growth tools.' },
];

const FOOTER_COLS = [
  { title: 'Product', links: [
    { label: 'Features', href: '#why' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Integrations', href: '#integrations' },
    { label: "What's New", to: '/changelog' },
  ] },
  { title: 'For Professionals', links: [
    { label: 'Astrologers', to: '/for/astrologers' },
    { label: 'Doctors', to: '/for/doctors' },
    { label: 'Salons', to: '/for/salon' },
    { label: 'Tutors', to: '/for/tutors' },
    { label: 'More', to: '/solutions' },
  ] },
  { title: 'Resources', links: [
    { label: 'Blog', to: '/blog' },
    { label: 'Help Centre', to: '/help' },
    { label: 'FAQs', href: '#faq' },
    { label: 'How It Works', href: '#how' },
  ] },
  { title: 'Company', links: [
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
  ] },
];

/* ─────────────────────────────  PRIMITIVES  ────────────────────────────── */

function NavLink({ item, className, onClick }) {
  if (item.to) return <Link to={item.to} className={className} onClick={onClick}>{item.label}</Link>;
  return <a href={item.href} className={className} onClick={onClick}>{item.label}</a>;
}

function CtaButton({ to, children, className = '' }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(107,92,231,0.28)] transition-all hover:no-underline hover:brightness-105 ${className}`}
      style={{ background: 'linear-gradient(120deg, var(--as-secondary), var(--as-primary))' }}
    >
      {children}
    </Link>
  );
}

function Eyebrow({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--as-secondary)' }}>
      <Sparkles size={13} /> {children}
    </span>
  );
}

/* Hero product mockup — a themed astrologer booking page (pure CSS/JSX). */
function BookingMock() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_40px_90px_-30px_rgba(47,35,115,0.4)] ring-1 ring-black/[0.06]">
        <div className="flex items-center gap-2 border-b border-black/5 bg-[color:var(--as-lavender)] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--as-line)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--as-line)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--as-line)]" />
          </span>
          <div className="ml-2 flex-1 truncate rounded-full bg-white px-3 py-1 text-[11px] text-neutral-400 ring-1 ring-inset ring-black/5">
            bookasloth.com/shreya-jyotish
          </div>
        </div>
        <div className="p-5">
          <div className="relative">
            <div className="h-14 rounded-[8px]" style={{ background: 'linear-gradient(110deg, var(--as-primary), var(--as-secondary))' }} />
            <div className="absolute -bottom-5 left-3 flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-white text-sm font-bold text-white" style={{ background: 'var(--as-secondary)' }}>
              S
            </div>
          </div>
          <div className="pl-1 pt-6">
            <div className="text-sm font-bold text-[color:var(--as-ink)]">Shreya · Vedic Astrologer</div>
            <span className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: 'var(--as-lavender)', color: 'var(--as-secondary)' }}>
              Jyotish · Numerology
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {[
              { name: 'Kundli Reading', meta: '45 min · Online', price: '₹1,499' },
              { name: 'Love & Relationship', meta: '30 min · Online', price: '₹999' },
            ].map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-[8px] border border-[color:var(--as-line)] bg-white p-3">
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-[color:var(--as-ink)]">{s.name}</div>
                  <div className="mt-0.5 text-[10px] text-neutral-400">{s.meta}</div>
                </div>
                <div className="flex items-center gap-2 pl-2">
                  <span className="text-xs font-bold text-[color:var(--as-ink)]">{s.price}</span>
                  <span className="rounded-[6px] px-2.5 py-1 text-[10px] font-bold text-white" style={{ background: 'var(--as-secondary)' }}>Book</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 pl-0.5 text-[10px] font-medium text-neutral-500">
            <Lock size={12} style={{ color: 'var(--as-secondary)' }} />
            Fee paid securely before the session
          </div>
        </div>
      </div>
      <div className="absolute -right-3 top-16 hidden rounded-2xl bg-white px-3 py-2 shadow-xl ring-1 ring-black/5 sm:block">
        <div className="text-[10px] font-medium text-neutral-400">Fee received</div>
        <div className="text-sm font-bold" style={{ color: 'var(--as-secondary)' }}>₹1,499</div>
      </div>
    </div>
  );
}

/* How-it-works: auto-advancing, clickable step timeline. */
function HowItWorks({ steps }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setActive((a) => (a + 1) % steps.length), 3000);
    return () => clearTimeout(t);
  }, [active, steps.length]);
  return (
    <div className="mt-14 grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
      <div className="relative mx-auto w-full max-w-md lg:mx-0">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--as-secondary) 22%, transparent)' }} />
        <div className="relative z-10 aspect-square">
          <img src={ABOUT_IMG} alt="Book A Sloth for astrologers" loading="lazy" className="absolute inset-0 mx-auto h-full w-full object-contain drop-shadow-[0_24px_32px_rgba(47,35,115,0.16)]" />
        </div>
      </div>
      <div className="relative">
        <span aria-hidden className="absolute bottom-5 left-6 top-5 w-px bg-black/10" />
        <div className="space-y-8">
          {steps.map((s, i) => {
            const on = i === active;
            return (
              <button key={s.title} type="button" onClick={() => setActive(i)} aria-current={on} aria-label={s.title} className="relative flex w-full gap-5 text-left">
                <span className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${on ? 'text-white shadow-[0_8px_20px_-8px_rgba(107,92,231,0.7)]' : 'border-2 border-black/10 bg-white'}`} style={on ? { background: 'var(--as-secondary)' } : { color: 'var(--as-primary)' }}>
                  <s.icon size={20} />
                </span>
                <div className={`pt-1.5 transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-55'}`}>
                  <h3 className="text-lg font-bold text-[color:var(--as-ink)]">{s.title}</h3>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-neutral-500">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Smoothly-animated single-open FAQ accordion. */
function FaqAccordion() {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {FAQ.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="overflow-hidden rounded-[12px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'var(--as-secondary)' : 'var(--as-line)' }}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[color:var(--as-ink)]"
            >
              {f.q}
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'var(--as-lavender)', color: 'var(--as-secondary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
                <Plus size={15} />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                  <p className="px-5 pb-4 text-[14.5px] leading-relaxed text-neutral-500">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────  PAGE  ────────────────────────────── */

export default function Astrologers() {
  useLenis();
  const [menuOpen, setMenuOpen] = useState(false);

  const canonical = `${SITE_URL}/for/astrologers`;
  const seo = {
    title: 'Appointment Booking Software for Astrologers | Book A Sloth',
    description: 'Book A Sloth is appointment booking software for astrologers, tarot readers, numerologists and Vedic consultants in India. Let seekers book readings online — fees collected upfront, WhatsApp reminders, GST invoices, 0% commission. Start free.',
    keywords: 'appointment booking software for astrologers, astrology consultation booking, book astrology reading online, tarot booking software, numerology appointment scheduling, Vedic astrologer booking page India, astrologer scheduling software',
    ogTitle: 'Your astrology practice runs on readings. Let Book A Sloth run the bookings.',
    ogDescription: 'Seekers book readings, pay upfront and get WhatsApp reminders — automatically. The booking page every astrologer in India should already have.',
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Book A Sloth',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Appointment Scheduling Software',
      operatingSystem: 'Web',
      url: canonical,
      description: seo.description,
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'INR', name: `${FREE_PLAN.name} plan` },
        { '@type': 'Offer', price: String(PREMIUM_PLAN.yearly), priceCurrency: 'INR', name: `${PREMIUM_PLAN.name} plan (yearly)` },
      ],
      // No aggregateRating — a testimonial-derived self-rating is exactly the
      // "self-serving review" markup search engines flag. Add only with real data.
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Appointment booking software for astrologers',
      provider: { '@type': 'Organization', name: 'Book A Sloth', url: SITE_URL },
      areaServed: 'IN',
      description: seo.description,
      url: canonical,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'For Astrologers', item: canonical },
      ],
    },
  ];

  const styleVars = {
    '--as-bg': '#FFFEFC',
    '--as-primary': '#2F2373',
    '--as-secondary': '#6B5CE7',
    '--as-gold': '#F5C86B',
    '--as-lavender': '#F3EEFF',
    '--as-line': '#E7DDFB',
    '--as-ink': '#1F1B3A',
    '--as-deep': '#241C4E',
  };

  return (
    <main className="astro-lp overflow-x-clip text-[color:var(--as-ink)]" style={{ ...styleVars, background: 'var(--as-bg)' }}>
      {/* Scoped fonts — ditto of the AstroSathi brief (Playfair headings + Inter body),
          confined to .astro-lp so the global Plus Jakarta/Poppins theme is untouched. */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
        .astro-lp{font-family:'Inter',system-ui,-apple-system,sans-serif;}
        .astro-lp h1,.astro-lp h2,.astro-lp h3,.astro-lp h4{font-family:'Playfair Display',Georgia,serif;letter-spacing:-0.01em;}
      `}</style>

      <Seo
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={canonical}
        robots="index, follow, max-image-preview:large, max-snippet:-1"
        siteName="Book A Sloth"
        locale="en_IN"
        themeColor="#6B5CE7"
        ogTitle={seo.ogTitle}
        ogDescription={seo.ogDescription}
        jsonLd={jsonLd}
      />

      {/* ═══════════════ 1 · NAV ═══════════════ */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 hover:no-underline" aria-label="Book A Sloth — home">
            <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="text-[15px] font-extrabold tracking-tight text-[color:var(--as-ink)]">Book A Sloth</span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <NavLink key={item.label} item={item} className="text-sm font-medium text-neutral-600 transition-colors hover:text-[color:var(--as-ink)] hover:no-underline" />
            ))}
          </nav>
          <div className="hidden items-center gap-4 lg:flex">
            <Link to={LOGIN} className="text-sm font-semibold text-neutral-700 hover:text-[color:var(--as-ink)] hover:no-underline">Login</Link>
            <CtaButton to={START} className="!px-5 !py-2.5">Start for Free <ArrowRight size={15} /></CtaButton>
          </div>
          <button type="button" className="lg:hidden" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-black/5 bg-white lg:hidden">
              <div className="flex flex-col gap-1 px-5 py-4">
                {NAV.map((item) => (
                  <NavLink key={item.label} item={item} onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-medium text-neutral-700 hover:bg-[color:var(--as-lavender)] hover:no-underline" />
                ))}
                <div className="mt-2 flex items-center gap-3 border-t border-black/5 pt-3">
                  <Link to={LOGIN} className="flex-1 rounded-full border-2 border-black/10 py-2.5 text-center text-sm font-semibold text-[color:var(--as-ink)] hover:no-underline">Login</Link>
                  <CtaButton to={START} className="flex-1">Start Free <ArrowRight size={15} /></CtaButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════ 2 · HERO ═══════════════ */}
      <section id="top" className="relative px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14 lg:pb-24" style={{ background: 'linear-gradient(180deg, var(--as-lavender) 0%, #ffffff 100%)' }}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-14 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <Reveal as="div" instant><Eyebrow>For Astrologers &amp; Vedic Consultants</Eyebrow></Reveal>
            <Reveal as="h1" instant delay={0.04} className="mt-4 text-[clamp(1.8rem,7vw,2.9rem)] font-bold leading-[1.08] text-[color:var(--as-ink)] lg:text-[3rem]">
              Simple booking software for{' '}
              <span style={{ color: 'var(--as-secondary)' }}>astrologers</span>{' '}
              of modern India.
            </Reveal>
            <Reveal as="p" instant delay={0.08} className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-500 sm:text-lg lg:mx-0">
              Let seekers book and pay for readings online. Manage your services, availability, payments, reminders and follow-ups from one calm platform built for consultants.
            </Reveal>
            <Reveal instant delay={0.12} className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:gap-5 lg:justify-start">
              <CtaButton to={START} className="w-full sm:w-auto">Create a Free Account <ArrowRight size={16} /></CtaButton>
              <Link to="/demo" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--as-ink)] transition-colors hover:text-[color:var(--as-secondary)] hover:no-underline">
                Book A Demo <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
            <Reveal instant delay={0.16} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
              {HERO_TRUST.map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500">
                  <Check size={14} style={{ color: 'var(--as-secondary)' }} /> {t}
                </span>
              ))}
            </Reveal>
          </div>

          {/* RIGHT — hero illustration + booking mockup */}
          <Reveal instant delay={0.1} className="relative">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--as-secondary) 18%, transparent), transparent 70%)' }} />
            <img src={HERO_IMG} alt="Book A Sloth — booking software for astrologers" loading="eager" width="640" height="640" className="relative z-10 mx-auto w-full max-w-[24rem] drop-shadow-[0_28px_36px_rgba(47,35,115,0.2)]" />
            <div className="absolute -bottom-4 left-0 z-20 hidden sm:block lg:-left-6"><BookingMock /></div>
          </Reveal>
        </div>

        {/* Four benefits strip */}
        <div className="mx-auto mt-16 grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.06}>
              <div className="group flex h-full flex-col rounded-[12px] border border-[color:var(--as-line)] bg-white p-4 transition-colors hover:border-[color:var(--as-secondary)]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-300 group-hover:text-white" style={{ backgroundColor: 'var(--as-lavender)', color: 'var(--as-secondary)' }}>
                    <b.icon size={18} />
                  </span>
                  <h3 className="text-sm font-bold">{b.title}</h3>
                </div>
                <p className="mt-2 text-xs leading-snug text-neutral-500">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 3 · SERVICES ═══════════════ */}
      <section id="services" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--as-lavender)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="div"><Eyebrow>Every Kind of Reading</Eyebrow></Reveal>
            <Reveal as="h2" delay={0.05} className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Built around the way <span style={{ color: 'var(--as-secondary)' }}>consultants work.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-4 text-base text-neutral-500">
              From birth-chart readings to Vastu, numerology and remedies — set up every service you offer, each with its own price, duration and availability.
            </Reveal>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s, i) => (
              <Reveal key={s.label} delay={(i % 4) * 0.05}>
                <Link to={START} className="group flex h-full flex-col rounded-[14px] border border-[color:var(--as-line)] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgba(47,35,115,0.3)] hover:no-underline">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 group-hover:text-white" style={{ backgroundColor: 'var(--as-lavender)', color: 'var(--as-secondary)' }}>
                    <s.icon size={22} />
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold text-[color:var(--as-ink)]">{s.label}</h3>
                  <p className="mt-1 text-[13px] leading-snug text-neutral-500">{s.desc}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4 · HOW IT WORKS ═══════════════ */}
      <section id="how" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="h2" className="text-3xl font-bold leading-tight sm:text-4xl">
              From &ldquo;when are you free?&rdquo; to <span style={{ color: 'var(--as-secondary)' }}>booked in minutes.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              No DMs, no back-and-forth. Your seekers book themselves.
            </Reveal>
          </div>
          <HowItWorks steps={STEPS} />
        </div>
      </section>

      {/* ═══════════════ 5 · INTEGRATIONS ═══════════════ */}
      <section id="integrations" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--as-lavender)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="div"><Eyebrow>Integrations</Eyebrow></Reveal>
            <Reveal as="h2" delay={0.05} className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Works with the tools you already use.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Connect your calendar, video meetings, payments and WhatsApp — Book A Sloth fits your workflow, no rewiring.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 0.06}>
                <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--as-line)] bg-white px-4 py-3.5 shadow-[0_14px_34px_-24px_rgba(47,35,115,0.4)]">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--as-lavender)]">
                    <img src={t.logo} alt="" loading="lazy" className="h-6 w-6 object-contain" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold leading-tight text-[color:var(--as-ink)]">{t.name}</div>
                    <div className="mt-0.5 text-xs leading-snug text-neutral-500">{t.sub}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 6 · CLIENT JOURNEY ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal as="h2" className="text-3xl font-bold leading-tight sm:text-4xl">
            Give every seeker a <span style={{ color: 'var(--as-secondary)' }}>calmer experience.</span>
          </Reveal>
          <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-2xl text-base text-neutral-500">
            From the first booking to the final follow-up, Book A Sloth keeps your sessions organised.
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {JOURNEY.map((j, i) => (
                <div key={j.label} className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-[color:var(--as-line)] bg-white px-4 py-2.5 shadow-[0_6px_20px_-12px_rgba(47,35,115,0.3)]">
                    <j.icon size={15} style={{ color: 'var(--as-secondary)' }} />
                    <span className="text-[13px] font-semibold text-[color:var(--as-ink)]">{j.label}</span>
                  </div>
                  {i < JOURNEY.length - 1 && <ArrowRight size={15} className="text-neutral-300" />}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 7 · ABOUT / WHY (image) ═══════════════ */}
      <section id="why" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--as-lavender)' }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative order-2 lg:order-1">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--as-secondary) 20%, transparent)' }} />
            <img src={ABOUT_IMG} alt="Book A Sloth for astrology practices" loading="lazy" className="relative z-10 mx-auto w-full max-w-md object-contain drop-shadow-[0_24px_40px_rgba(47,35,115,0.18)]" />
          </Reveal>
          <div className="order-1 lg:order-2">
            <Reveal as="div"><Eyebrow>Why Book A Sloth</Eyebrow></Reveal>
            <Reveal as="h2" delay={0.05} className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              More than a booking link. <span style={{ color: 'var(--as-secondary)' }}>A calmer way to practise.</span>
            </Reveal>
            <div className="mt-9 grid gap-5 sm:grid-cols-2">
              {WHY.map((w, i) => (
                <Reveal key={w.title} delay={(i % 2) * 0.08}>
                  <div className="h-full rounded-[16px] border border-[color:var(--as-line)] bg-white p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--as-lavender)', color: 'var(--as-secondary)' }}>
                      <w.icon size={20} />
                    </span>
                    <h3 className="mt-4 text-base font-bold">{w.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{w.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 8 · TESTIMONIALS ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="div"><Eyebrow>Trusted by Consultants</Eyebrow></Reveal>
            <Reveal as="h2" delay={0.05} className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              Your seekers notice when your practice runs smoothly.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 0.08}>
                <figure className="flex h-full flex-col justify-between rounded-[16px] border border-[color:var(--as-line)] bg-white p-7 shadow-[0_8px_30px_rgba(47,35,115,0.05)]">
                  <div>
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((s) => <Star key={s} size={15} style={{ color: 'var(--as-gold)', fill: 'var(--as-gold)' }} />)}
                    </div>
                    <blockquote className="mt-4 text-[15px] font-semibold leading-snug text-[color:var(--as-ink)]">&ldquo;{t.quote}&rdquo;</blockquote>
                  </div>
                  <figcaption className="mt-6 flex items-center gap-3">
                    {t.avatar
                      ? <img src={t.avatar} alt={t.name} loading="lazy" className="h-11 w-11 flex-shrink-0 rounded-full object-cover" />
                      : <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'var(--as-secondary)' }}>{t.name.charAt(0)}</span>}
                    <div>
                      <div className="text-sm font-bold text-[color:var(--as-ink)]">{t.name}</div>
                      <div className="text-xs text-neutral-400">{t.role}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 9 · TRUST STRIP (honest) ═══════════════ */}
      <section className="border-y border-black/5 px-5 py-12 sm:px-8" style={{ background: 'var(--as-deep)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST_STRIP.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <s.icon size={20} className="mx-auto" style={{ color: 'var(--as-gold)' }} />
              <div className="mt-2 text-2xl font-bold text-white sm:text-3xl">{s.value}</div>
              <p className="mx-auto mt-1.5 max-w-[13rem] text-xs leading-snug text-white/60">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 10 · PRICING TEASER ═══════════════ */}
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--as-lavender)' }}>
        <div className="mx-auto max-w-3xl text-center">
          <Reveal as="div"><Eyebrow>Simple Pricing</Eyebrow></Reveal>
          <Reveal as="h2" delay={0.05} className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            Start free. Upgrade to <span style={{ color: 'var(--as-secondary)' }}>0% commission</span> when you are ready.
          </Reveal>
          <Reveal as="p" delay={0.08} className="mx-auto mt-4 max-w-xl text-base text-neutral-500">
            The Sloth plan is free forever with a small 5% per-booking fee. Sloth Active removes commission entirely and adds WhatsApp automation, a client CRM and growth tools — {`₹${PREMIUM_PLAN.yearly.toLocaleString('en-IN')}`}/year (+18% GST).
          </Reveal>
          <Reveal delay={0.14} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaButton to={START}>Start free <ArrowRight size={16} /></CtaButton>
            <Link to="/pricing" className="text-sm font-semibold text-[color:var(--as-ink)] underline-offset-4 hover:underline">See full pricing</Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 11 · FAQ ═══════════════ */}
      <section id="faq" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">Questions, answered.</Reveal>
          <div className="mt-12"><FaqAccordion /></div>
        </div>
      </section>

      {/* ═══════════════ 12 · FINAL CTA ═══════════════ */}
      <section className="px-5 py-24 text-center text-white sm:px-8" style={{ background: 'linear-gradient(160deg, var(--as-primary), var(--as-deep))' }}>
        <div className="mx-auto max-w-2xl">
          <Reveal className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'color-mix(in srgb, var(--as-secondary) 30%, transparent)' }}>
            <Sun size={26} style={{ color: 'var(--as-gold)' }} />
          </Reveal>
          <Reveal as="h2" delay={0.06} className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl">
            Your next seeker is ready to book.
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-lg text-base text-white/70">
            Set up your page in minutes and start taking paid bookings today — no credit card required.
          </Reveal>
          <Reveal delay={0.16} className="mt-8">
            <CtaButton to={START} className="!px-8 !py-4">Create your free page <ArrowRight size={16} /></CtaButton>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 13 · FOOTER ═══════════════ */}
      <footer className="border-t border-black/10 px-5 py-14 sm:px-8" style={{ background: 'var(--as-deep)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <div className="text-lg font-extrabold text-white">Book A Sloth</div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">
                The calm way for astrologers and consultants in India to get booked, paid and reminded.
              </p>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">{col.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.to
                        ? <Link to={l.to} className="text-sm text-white/70 transition-colors hover:text-white hover:no-underline">{l.label}</Link>
                        : <a href={l.href} className="text-sm text-white/70 transition-colors hover:text-white hover:no-underline">{l.label}</a>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
            <p className="text-xs text-white/50">© {new Date().getFullYear()} Book A Sloth · Razorpay-secure payments · GST invoices · Made in India 🇮🇳</p>
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">Made for India&apos;s astrologers</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

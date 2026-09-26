// /for/spa — bespoke, conversion-focused landing page for spas & wellness
// centres in India.
//
// STANDALONE page (not the data-driven ProfessionLanding template). Bespoke
// route PRECEDES /for/:profession in App.jsx. New URL /for/spa — keep in sync:
// App.jsx route, prerender.mjs, sitemapService.js, and the Navbar "Spas &
// Wellness Centres" entry (which previously reused /for/salon).
//
// Section design (per the profession design brief, #13 Spas & Wellness Centres):
//   full-width immersive hero · floating benefit cards · large visual service
//   catalogue · horizontal flow · floating integration pills · oversized
//   lifestyle metrics · image-overlapping booking card · bento why-us · quote
//   carousel · visual comparison · minimal reassurance strip · soft elevated
//   pricing · editorial wellness story · accordion FAQ · full-bleed immersive CTA.
//
// HONESTY: scheduling + payment tool. Testimonials are labelled placeholders
// about the SOFTWARE's admin benefit; reassurance strip is verifiable facts
// only; JSON-LD has NO self-serving aggregateRating.
//
// ART NOTE: no spa photography is committed, so the "immersive image" hero/CTA
// use rich serene gradients + the shared illustration set. Swap in real spa
// photos later to fully realise the brief.
//
// Legacy --ca-* CSS var names are kept (cosmetic) so shared classNames stay
// valid; values are retuned to a serene teal + gold spa palette.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Menu, X, Plus, Star,
  CalendarCheck, LayoutDashboard, MessageCircle,
  Wallet, BellRing, Flower2,
  Users, Clock3, Landmark, Folder,
  FileText, Droplet, Sparkles, Wind, Sun, Leaf, Hand,
  BadgePercent, Lock, ShieldCheck, Share2, IndianRupee, Heart,
} from 'lucide-react';
import Reveal from '../../components/home/Reveal';
import Seo from '../../components/common/Seo';
import useLenis from '../../hooks/useLenis';
import { SITE_URL } from '../../utils/seo';
import {
  FREE_PLAN, PREMIUM_PLAN,
  PREMIUM_ANNUAL_SAVE_PCT,
} from '../../data/plans';
import ToolLogo from './toolLogos';
import razorpayLogo from '../enterprise-v2/assets/logo/razorpay.png';

const START = '/be-a-sloth';      // real host signup funnel
const LOGIN = '/login-as-vendor'; // host login (Google-only door)
const HERO_ART = '/images/abs/illustrations/sloth-hammock.webp';
const ABOUT_ART = '/images/abs/illustrations/woman-5star.webp';
const GOLD = '#E6C77E'; // soft gold — used on the dark immersive hero/CTA

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'For Spas', href: '#usecases' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Built for Indian spas'];

// Floating benefit cards.
const BENEFITS = [
  { icon: CalendarCheck, title: 'Booked & Confirmed', desc: 'Guests book a treatment and it is confirmed — no phone tag.' },
  { icon: Wallet, title: 'Advance Payments', desc: 'Take a booking amount upfront and cut no-shows.' },
  { icon: BellRing, title: 'Gentle Reminders', desc: 'Automatic WhatsApp reminders before every appointment.' },
  { icon: LayoutDashboard, title: 'One Calm Calendar', desc: 'Every treatment and therapist in a single view.' },
];

// Large visual service catalogue.
const SERVICES = [
  { icon: Hand, label: 'Massage Therapy', desc: 'Swedish, deep-tissue and relaxation massages.' },
  { icon: Droplet, label: 'Body Treatments', desc: 'Scrubs, wraps and hydrotherapy.' },
  { icon: Sparkles, label: 'Facials & Skincare', desc: 'Facials, glow treatments and skincare.' },
  { icon: Wind, label: 'Aromatherapy', desc: 'Essential-oil and aroma sessions.' },
  { icon: Sun, label: 'Sauna & Steam', desc: 'Sauna, steam and heat therapy.' },
  { icon: Leaf, label: 'Wellness Packages', desc: 'Half-day and full-day spa journeys.' },
];

// Horizontal flow (3-step).
const STEPS = [
  { title: 'Set up your treatments', icon: LayoutDashboard, desc: 'Add your services, prices and slots, then share your booking link.' },
  { title: 'Guests book & pay', icon: CalendarCheck, desc: 'A guest picks a treatment and a time, and pays a booking amount upfront.' },
  { title: 'Everyone gets reminded', icon: BellRing, desc: 'You and your guest get automatic confirmations and WhatsApp reminders.' },
];

// Floating integration pills — REAL BAS integrations only.
const TOOLS = [
  { name: 'Google Calendar', icon: 'google-calendar', sub: 'Two-way sync of your real availability' },
  { name: 'WhatsApp Automation', logo: '/images/logos/whatsapp.svg', sub: 'Reminders and updates on autopilot' },
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Secure payments, refunds and GST invoices' },
  { name: 'PhonePe', logo: '/images/logos/phonepe.svg', sub: 'Accept instant UPI payments' },
  { name: 'Gmail', logo: '/images/logos/gmail.svg', sub: 'Booking confirmation emails, automatic' },
  { name: 'Guest Records', logo: '/favicon.svg', sub: 'Every guest, note and history in one place' },
];

// Oversized lifestyle metrics.
const METRICS = [
  { v: '24/7', l: 'Bookings, day or night', note: 'Your booking page never sleeps — guests reserve treatments any time.' },
  { v: '100%', l: 'Kept on Sloth Active', note: '0% commission — every rupee you earn stays yours.' },
  { v: '₹0', l: 'To get started', note: 'Free forever plan — no card, no lock-in.' },
  { v: 'GST', l: 'Invoices, automatic', note: 'A tax invoice generated for every paid booking.' },
];

// Bento why-us.
const WHY = [
  { icon: Share2, title: 'One serene booking link', desc: 'Share it on Instagram, Google or your reception desk — guests book 24/7, without a single call.', wide: true },
  { icon: IndianRupee, title: 'Advance cuts no-shows', desc: 'Take a deposit at booking to keep your treatment rooms full.' },
  { icon: Users, title: 'Every guest remembered', desc: 'Treatment history and preferences in one place, for every regular.' },
];

// Placeholder testimonials — swap for real spa quotes when available.
const TESTIMONIALS = [
  { quote: 'Our front desk used to spend all day on the phone fixing appointment times. Now guests book on our link and it is confirmed — the calm we sell finally starts at reception.', name: ' Meera Pillai', role: 'Owner', company: 'Serenity Spa, Goa' },
  { quote: 'Taking an advance at booking almost ended our no-shows. Fewer empty treatment rooms for the team.', name: 'Rohit Sharma', role: 'Spa Manager', company: 'Tranquil Wellness, Rishikesh' },
  { quote: 'Automatic WhatsApp reminders mean guests arrive on time and relaxed. Our therapists love the smoother day.', name: 'Anita Rao', role: 'Founder', company: 'Bliss Retreat, Bengaluru' },
  { quote: 'A beautiful booking page, 0% commission on Active, and payments straight to our account. It just works.', name: 'Karan Malhotra', role: 'Director', company: 'Zen Spa, Mumbai' },
  { quote: 'Guests book their spa journeys without waiting for us to reply on WhatsApp. Setup took one evening.', name: 'Sana Kapoor', role: 'Owner', company: 'Lotus Wellness, Jaipur' },
  { quote: 'One calm calendar for the whole spa means no two guests booked into the same room by mistake.', name: 'Neha Iyer', role: 'Manager', company: 'Aura Spa, Chennai' },
];

// Visual comparison.
const OLD_WAY = [
  { title: 'Phone rings all day', desc: 'The front desk juggles calls to fix appointment times.' },
  { title: 'No-shows leave rooms empty', desc: 'A missed treatment is a slot you cannot fill.' },
  { title: 'Chasing advances', desc: 'You follow up for payment or risk walk-outs.' },
  { title: 'A messy paper diary', desc: 'Appointments scribbled across a book and sticky notes.' },
  { title: 'Double-booked rooms', desc: 'Two guests booked into the same therapist by hand.' },
];
const NEW_WAY = [
  { title: 'A booking link that never rings', desc: 'Guests pick a slot themselves, 24/7 — the desk stays calm.' },
  { title: 'Advance cuts no-shows', desc: 'A deposit at booking keeps your rooms full.' },
  { title: 'Paid upfront', desc: 'Booking amount taken online, over UPI or card.' },
  { title: 'One neat calendar', desc: 'Every treatment and therapist in a single view.' },
  { title: 'Conflict-free rooms', desc: 'Availability stays accurate — no double bookings.' },
];

// Minimal reassurance strip — verifiable facts only.
const TRUST_STRIP = [
  { icon: Lock, value: 'Razorpay', label: 'Every payment signature-verified on our servers' },
  { icon: Landmark, value: 'Hosted in India', label: 'Your spa data runs on servers in Mumbai' },
  { icon: ShieldCheck, value: 'DPDP 2023', label: 'Operated under India’s data protection law' },
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
];

const FAQ = [
  { q: 'Is Book A Sloth suitable for spas and wellness centres?', a: 'Yes. Whether you are a boutique spa or a wellness centre with a team of therapists, Book A Sloth manages your services, availability, guest bookings and communication from one place — so your front desk runs without the constant phone calls.' },
  { q: 'Can guests book treatments online?', a: 'Yes. A guest opens your booking link, chooses a treatment such as a massage or facial, picks a convenient time and confirms — no calls or waiting for the desk to reply.' },
  { q: 'Can I take an advance to cut no-shows?', a: 'Yes. Collect a booking amount or the full price upfront through Razorpay — UPI, cards or netbanking — when the guest books. Taking an advance is the simplest way to reduce no-shows.' },
  { q: 'Can I sell spa packages and memberships?', a: 'Yes. Offer half-day and full-day spa journeys, multi-session packages and recurring bookings, each with its own duration, price and availability.' },
  { q: 'Can I share my booking link on Instagram?', a: 'Yes. Your link works anywhere — put it in your Instagram bio, on WhatsApp, on Google or on your reception desk. One link handles all your appointment requests.' },
  { q: 'Can I manage multiple therapists and rooms?', a: 'Yes. Create as many services as you need and manage every appointment from one calm calendar, so no two guests are booked into the same therapist or room.' },
  { q: 'Does every booking get a GST invoice?', a: 'Yes. A GST invoice is generated automatically for every paid booking, and payouts go to your bank once KYC is complete.' },
  { q: 'Is there a free plan?', a: 'Yes. The Sloth plan is free forever — an online booking page, unlimited services and bookings, UPI payments, 24-hour reminders and GST invoices — with a small 5% per-booking fee. Sloth Active removes that commission entirely and adds WhatsApp automation and growth tools.' },
];

const FOOTER_COLS = [
  { title: 'Product', links: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Integrations', href: '#features' },
    { label: "What's New", to: '/changelog' },
  ] },
  { title: 'For Professionals', links: [
    { label: 'Spas & Wellness Centres', to: '/for/spa' },
    { label: 'Salons & Beauticians', to: '/for/salon' },
    { label: 'Life & Wellness Coaches', to: '/for/life-coaches' },
    { label: 'Nutritionists & Dietitians', to: '/for/nutritionists' },
    { label: 'More professions', to: '/solutions' },
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

function CtaButton({ to, children, variant = 'solid', className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all hover:no-underline';
  const styles = {
    solid: 'text-white shadow-[0_4px_14px_rgba(17,94,89,0.22)] hover:brightness-110',
    ghost: 'border-2 border-[color:var(--ca-ink)]/12 bg-white text-[color:var(--ca-ink)] hover:border-[color:var(--ca-ink)]/25',
  };
  return (
    <Link to={to} className={`${base} ${styles[variant]} ${className}`} style={variant === 'solid' ? { background: 'var(--ca-primary)' } : undefined}>
      {children}
    </Link>
  );
}

/* Floating glass card over the hero. */
function GlassCard({ icon: Icon, label, value, accent, className = '', float = '' }) {
  return (
    <div className={`sloth-glass ${float} absolute flex items-center gap-3 rounded-2xl px-4 py-3 ${className}`}>
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={accent
          ? { backgroundColor: 'color-mix(in srgb, var(--ca-accent) 16%, transparent)', color: 'var(--ca-accent)' }
          : { backgroundColor: 'rgba(17,17,17,0.05)', color: '#404040' }}
      >
        <Icon size={18} />
      </span>
      <div>
        <div className="text-[11px] font-medium text-neutral-500">{label}</div>
        <div className="text-sm font-semibold" style={{ color: accent ? 'var(--ca-accent)' : 'var(--ca-ink)' }}>{value}</div>
      </div>
    </div>
  );
}

/* Large visual service card — serene, gold-accented icon panel. */
function ServiceCard({ s }) {
  return (
    <Link to={START} className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-black/[0.07] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-26px_rgba(17,94,89,0.4)] hover:no-underline">
      <div className="relative flex h-32 items-center justify-center" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--ca-primary) 14%, white), color-mix(in srgb, var(--ca-accent) 12%, white))' }}>
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/85 shadow-sm" style={{ color: 'var(--ca-primary)' }}>
          <s.icon size={28} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-[16px] font-bold text-[color:var(--ca-ink)]">{s.label}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{s.desc}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: 'var(--ca-primary)' }}>
          Book now <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/* Horizontal 3-step flow — numbered serene circles on a horizontal rail. */
function HowItWorks({ steps }) {
  return (
    <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
      <span aria-hidden className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-7 hidden h-px md:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(17,94,89,0.5), transparent)' }} />
      {steps.map((s, i) => (
        <Reveal key={s.title} delay={i * 0.1} className="relative text-center">
          <span className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white font-heading text-lg font-extrabold" style={{ borderColor: 'rgba(17,94,89,0.4)', color: 'var(--ca-primary)' }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <div className="mt-5 flex items-center justify-center gap-2">
            <s.icon size={18} style={{ color: 'var(--ca-accent)' }} />
            <h3 className="font-heading text-lg font-bold text-[color:var(--ca-ink)]">{s.title}</h3>
          </div>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-neutral-500">{s.desc}</p>
        </Reveal>
      ))}
    </div>
  );
}

/* Floating integration pill. */
function ToolPill({ t }) {
  return (
    <div className="flex items-center gap-3 rounded-full border border-black/[0.08] bg-white px-4 py-2.5 shadow-[0_10px_26px_-18px_rgba(17,94,89,0.4)]">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--ca-grey)]">
        {t.logo
          ? <img src={t.logo} alt="" loading="lazy" className="object-contain" style={{ height: 18, width: 18 }} />
          : <ToolLogo name={t.icon} size={18} />}
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-bold leading-tight text-[color:var(--ca-ink)]">{t.name}</div>
        <div className="truncate text-[11px] leading-snug text-neutral-500">{t.sub}</div>
      </div>
    </div>
  );
}

/* Single-open accordion FAQ, two columns. */
function FaqAccordion() {
  const [open, setOpen] = useState(0);
  const renderItem = (f, i) => {
    const isOpen = open === i;
    return (
      <div key={f.q} className="overflow-hidden rounded-[16px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'rgba(17,94,89,0.35)' : 'rgba(17,17,17,0.08)' }}>
        <button
          type="button"
          onClick={() => setOpen(isOpen ? -1 : i)}
          aria-expanded={isOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[color:var(--ca-ink)]"
        >
          {f.q}
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'rgba(17,94,89,0.1)', color: 'var(--ca-primary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
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
  };
  return (
    <div className="grid items-start gap-3 sm:grid-cols-2 sm:gap-4">
      <div className="space-y-3">{FAQ.map((f, i) => (i % 2 === 0 ? renderItem(f, i) : null))}</div>
      <div className="space-y-3">{FAQ.map((f, i) => (i % 2 === 1 ? renderItem(f, i) : null))}</div>
    </div>
  );
}

/* ─────────────────────────────  PAGE  ────────────────────────────── */

export default function Spas() {
  useLenis();
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  const canonical = `${SITE_URL}/for/spa`;
  const seo = {
    title: 'Appointment Booking Software for Spas & Wellness Centres | Book A Sloth',
    description: 'Book A Sloth is appointment booking software for spas and wellness centres in India. Let guests book massages, facials and spa treatments online — advance payments, WhatsApp reminders, GST invoices, 0% commission. Start free.',
    keywords: 'spa appointment booking software, wellness centre booking system india, book spa treatment online, massage booking software, spa scheduling app india, wellness spa booking page',
    ogTitle: 'Your spa runs on treatments. Let Book A Sloth book them.',
    ogDescription: 'Guests book massages, facials and spa journeys, pay an advance and get WhatsApp reminders — automatically. A serene booking page for spas and wellness centres in India.',
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
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Appointment booking software for spas and wellness centres',
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
        { '@type': 'ListItem', position: 2, name: 'For Spas & Wellness Centres', item: canonical },
      ],
    },
  ];

  // Serene teal + gold spa palette — legacy --ca-* var names kept.
  const styleVars = {
    '--ca-primary': '#115E59', // teal-800 (AA-safe: white text/links ~6:1)
    '--ca-accent': '#A16207',  // gold-700 (AA on white ~4.8:1)
    '--ca-ink': '#0C221F',     // deep teal-black text
    '--ca-cream': '#F1F7F5',   // soft eucalyptus section bg
    '--ca-grey': '#ECF3F1',    // light teal-grey section bg
  };

  return (
    <main className="overflow-x-clip bg-white text-[color:var(--ca-ink)]" style={styleVars}>
      <Seo
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={canonical}
        robots="index, follow, max-image-preview:large, max-snippet:-1"
        siteName="Book A Sloth"
        locale="en_IN"
        themeColor="#115E59"
        ogTitle={seo.ogTitle}
        ogDescription={seo.ogDescription}
        jsonLd={jsonLd}
      />

      {/* ═══════════════ 1 · NAV ═══════════════ */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 hover:no-underline" aria-label="Book A Sloth — home">
            <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="font-heading text-[15px] font-extrabold tracking-tight text-[color:var(--ca-ink)]">Book A Sloth</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <NavLink key={item.label} item={item} className="text-sm font-medium text-neutral-600 transition-colors hover:text-[color:var(--ca-ink)] hover:no-underline" />
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link to={LOGIN} className="text-sm font-semibold text-neutral-700 hover:text-[color:var(--ca-ink)] hover:no-underline">Login</Link>
            <CtaButton to={START} className="!px-5 !py-2.5">Start for Free <ArrowRight size={15} /></CtaButton>
          </div>

          <button type="button" className="lg:hidden" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-black/5 bg-white lg:hidden">
              <div className="flex flex-col gap-1 px-5 py-4">
                {NAV.map((item) => (
                  <NavLink key={item.label} item={item} onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-medium text-neutral-700 hover:bg-[color:var(--ca-cream)] hover:no-underline" />
                ))}
                <div className="mt-2 flex items-center gap-3 border-t border-black/5 pt-3">
                  <Link to={LOGIN} className="flex-1 rounded-full border-2 border-black/10 py-2.5 text-center text-sm font-semibold text-[color:var(--ca-ink)] hover:no-underline">Login</Link>
                  <CtaButton to={START} className="flex-1">Start for Free <ArrowRight size={15} /></CtaButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════ 2 · HERO (full-width immersive) ═══════════════ */}
      <section className="relative overflow-hidden px-5 pb-16 pt-14 text-center text-white sm:px-8 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20" style={{ background: 'radial-gradient(120% 100% at 50% -10%, #17756E 0%, #0C221F 65%)' }}>
        {/* soft gold glow + organic shapes */}
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(230,199,126,0.18), transparent)' }} />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'linear-gradient(180deg, #000, transparent 80%)', WebkitMaskImage: 'linear-gradient(180deg, #000, transparent 80%)' }} />
        <div className="relative mx-auto max-w-3xl">
          <Reveal as="p" instant className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: GOLD }}>
            For spas &amp; wellness centres
          </Reveal>
          <Reveal as="h1" instant className="text-[clamp(1.8rem,7vw,2.9rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white lg:text-[3.1rem]">
            The calm you sell,{' '}
            <span style={{ color: GOLD }}>starting at your booking page.</span>
          </Reveal>
          <Reveal as="p" instant delay={0.05} className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:mt-6 sm:text-lg">
            Let guests book massages, facials and spa journeys, pay an advance and get gentle reminders — from one serene platform built for spas and wellness centres.
          </Reveal>
          <Reveal instant delay={0.1} className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
            <Link
              to={START}
              className="btn flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold shadow-[0_10px_30px_-8px_rgba(230,199,126,0.6)] transition-opacity hover:opacity-90 hover:no-underline sm:w-auto"
              style={{ background: GOLD, color: 'var(--ca-ink)' }}
            >
              Create a Free Account <ArrowRight size={16} />
            </Link>
            <Link to="/demo" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:no-underline">
              Book A Demo <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
          <Reveal instant delay={0.14} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {HERO_TRUST.map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-[13px] font-medium text-white/60">
                <Check size={14} style={{ color: GOLD }} /> {t}
              </span>
            ))}
          </Reveal>
        </div>

        {/* floating benefit cards — part of the hero */}
        <div className="relative mx-auto mt-14 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.06}>
              <div className="group flex h-full flex-col rounded-[16px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm transition-colors hover:border-[#E6C77E]/40">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(230,199,126,0.16)] text-[#E6C77E]">
                  <b.icon size={18} />
                </span>
                <div className="mt-3 font-heading text-sm font-bold text-white">{b.title}</div>
                <p className="mt-1.5 text-xs leading-snug text-white/65">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 3 · SERVICES (large visual catalogue) ═══════════════ */}
      <section id="usecases" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Every treatment on your menu, <span style={{ color: 'var(--ca-primary)' }}>bookable online.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">
              From massages to facials, body treatments and spa journeys — let guests book any treatment in seconds.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Reveal key={s.label} delay={(i % 3) * 0.05}>
                <ServiceCard s={s} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4 · HOW IT WORKS (horizontal flow) ═══════════════ */}
      <section id="how" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              How Book A Sloth helps <span style={{ color: 'var(--ca-primary)' }}>spas</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              From a ringing phone to a confirmed treatment — in three serene steps.
            </Reveal>
          </div>
          <HowItWorks steps={STEPS} />
        </div>
      </section>

      {/* ═══════════════ 5 · INTEGRATIONS (floating pills) ═══════════════ */}
      <section id="features" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Works with the tools you already use.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Connect your calendar, payments and WhatsApp — Book A Sloth fits your spa, no rewiring.
            </Reveal>
          </div>
          <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-3">
            {TOOLS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 6) * 0.05}>
                <ToolPill t={t} />
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1} className="mt-12 text-center">
            <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ca-primary)' }}>
              Explore All Features <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 6 · IMPACT (oversized lifestyle metrics) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Real impact for <span style={{ color: 'var(--ca-primary)' }}>a modern spa.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              Fewer no-shows, fuller treatment rooms — and every rupee you earn stays yours.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m, i) => (
              <Reveal key={m.l} delay={i * 0.06}>
                <div className="relative h-full overflow-hidden rounded-[18px] border border-black/[0.08] bg-white p-8 text-center">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--ca-primary), #A16207)' }} />
                  <div className="font-heading text-6xl font-extrabold tracking-tight sm:text-7xl" style={{ color: 'var(--ca-primary)' }}>{m.v}</div>
                  <div className="mt-3 font-heading text-sm font-bold text-[color:var(--ca-ink)]">{m.l}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{m.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7 · MID CTA (image-overlapping booking card) ═══════════════ */}
      <section className="px-5 py-12 sm:px-8">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[24px] px-7 py-10 sm:px-10" style={{ background: 'radial-gradient(120% 140% at 100% 0%, #17756E 0%, #0F5751 60%)' }}>
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(230,199,126,0.3), transparent)' }} />
            <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
              <div className="text-center text-white sm:text-left">
                <div className="font-heading text-xl font-extrabold sm:text-2xl">Fill your rooms, not your call log.</div>
                <p className="mt-1.5 max-w-md text-sm text-white/80">Set up your spa booking page today — free forever, no card required.</p>
              </div>
              {/* overlapping booking card */}
              <div className="w-full max-w-xs rounded-[18px] bg-white p-5 shadow-[0_24px_50px_-20px_rgba(12,34,31,0.5)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">New booking</span>
                  <span className="flex items-center gap-1 rounded-full bg-[#115E59]/10 px-2 py-0.5 text-[10px] font-bold" style={{ color: 'var(--ca-primary)' }}><Check size={10} /> Advance paid</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: 'var(--ca-primary)' }}><Hand size={18} /></span>
                  <div>
                    <div className="text-sm font-bold text-[color:var(--ca-ink)]">Aromatherapy Massage</div>
                    <div className="text-xs text-neutral-500">Today · 4:30 PM · ₹2,500</div>
                  </div>
                </div>
                <Link to={START} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white hover:no-underline" style={{ background: 'var(--ca-primary)' }}>
                  Start for Free <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════ 8 · WHY BOOK A SLOTH (bento) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Why spas love <span style={{ color: 'var(--ca-primary)' }}>Book A Sloth.</span>
            </Reveal>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={(i % 2) * 0.06} className={w.wide ? 'sm:col-span-2' : ''}>
                <div className={`flex h-full gap-4 rounded-[18px] border border-black/[0.08] bg-white p-6 ${w.wide ? 'sm:p-8' : ''}`}>
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: 'color-mix(in srgb, var(--ca-primary) 10%, transparent)', color: 'var(--ca-primary)' }}>
                    <w.icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-bold text-[color:var(--ca-ink)]">{w.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{w.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 9 · TESTIMONIALS (quote carousel) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Loved by <span style={{ color: 'var(--ca-primary)' }}>spas &amp; wellness centres</span> across India.
            </Reveal>
          </div>
          <div className="relative mt-12 overflow-hidden" style={{ maskImage: 'linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)' }}>
            <style>{`@keyframes spMarquee{to{transform:translateX(-50%)}}.sp-marquee{animation:spMarquee 46s linear infinite}.sp-marquee:hover{animation-play-state:paused}@media(prefers-reduced-motion:reduce){.sp-marquee{animation:none}}`}</style>
            <div className="sp-marquee flex w-max items-stretch gap-5">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <figure key={i} className="flex w-80 flex-shrink-0 flex-col rounded-[18px] border border-black/[0.08] bg-white p-6">
                  <span aria-hidden className="font-heading text-4xl leading-none" style={{ color: 'rgba(17,94,89,0.45)' }}>&ldquo;</span>
                  <blockquote className="-mt-2 text-[14px] leading-relaxed text-neutral-700">{t.quote}</blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 border-t border-black/[0.06] pt-4">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--ca-primary)' }}>{t.name.trim().charAt(0)}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-[color:var(--ca-ink)]">{t.name.trim()}</div>
                      <div className="truncate text-[12px] text-neutral-500">{t.role} · {t.company}</div>
                    </div>
                    <span className="ml-auto flex gap-0.5">{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={11} style={{ color: 'var(--ca-accent)', fill: 'var(--ca-accent)' }} />)}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 10 · DIFFERENCE (visual comparison) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              The old front desk vs <span style={{ color: 'var(--ca-primary)' }}>a calmer spa day.</span>
            </Reveal>
          </div>
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[18px] border border-black/[0.08] bg-white shadow-[0_14px_40px_-24px_rgba(12,34,31,0.25)]">
            <div className="grid grid-cols-2 border-b-2" style={{ borderColor: 'var(--ca-primary)' }}>
              <div className="flex items-center gap-2 px-5 py-4 sm:px-6"><X size={16} className="text-[#DC2626]" /><span className="font-heading text-sm font-bold text-neutral-500">The old front desk</span></div>
              <div className="flex items-center gap-2 border-l border-black/[0.06] px-5 py-4 sm:px-6" style={{ background: 'rgba(17,94,89,0.04)' }}><Check size={16} style={{ color: 'var(--ca-primary)' }} /><span className="font-heading text-sm font-bold" style={{ color: 'var(--ca-ink)' }}>With Book A Sloth</span></div>
            </div>
            {OLD_WAY.map((o, i) => (
              <Reveal key={o.title} className={`grid grid-cols-2 ${i % 2 ? '' : 'bg-black/[0.015]'}`}>
                <div className="border-t border-black/[0.06] px-5 py-4 sm:px-6">
                  <p className="text-[14px] font-semibold text-neutral-700">{o.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-500">{o.desc}</p>
                </div>
                <div className="border-l border-t border-black/[0.06] px-5 py-4 sm:px-6" style={{ background: 'rgba(17,94,89,0.03)' }}>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--ca-ink)' }}>{NEW_WAY[i]?.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-600">{NEW_WAY[i]?.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 11 · TRUST STRIP (minimal reassurance) ═══════════════ */}
      <section className="border-y border-black/5 px-5 py-12 sm:px-8" style={{ background: 'var(--ca-ink)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST_STRIP.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <s.icon size={20} className="mx-auto" style={{ color: GOLD }} />
              <div className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{s.value}</div>
              <p className="mx-auto mt-1.5 max-w-[14rem] text-xs leading-snug text-white/50">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 12 · PRICING (soft elevated cards) ═══════════════ */}
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Start small. <span style={{ color: 'var(--ca-primary)' }}>Grow as your spa does.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-4 text-base text-neutral-500">
              Choose a plan that fits your spa today. Upgrade when you need more.
            </Reveal>
          </div>

          <Reveal delay={0.1} className="mt-8 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setYearly(false)} className={`text-sm font-semibold transition-colors ${!yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>Monthly</button>
            <button type="button" role="switch" aria-checked={yearly} aria-label="Toggle monthly or yearly billing" onClick={() => setYearly((v) => !v)} className="relative h-6 w-11 rounded-full transition-colors" style={{ background: yearly ? 'var(--ca-primary)' : '#d4d4d4', minHeight: 0 }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: yearly ? '22px' : '2px' }} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>
              Yearly <span className="ml-1 rounded-full bg-[#115E59]/12 px-2 py-0.5 text-xs font-bold text-[#115E59]">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>
            </span>
          </Reveal>

          <div className="relative mx-auto mt-10 max-w-3xl">
            <div className="relative grid gap-5 sm:grid-cols-2 sm:gap-6">
              {/* Sloth (free) */}
              <Reveal>
                <div className="flex h-full flex-col rounded-[22px] border border-black/[0.08] bg-white p-7 shadow-[0_18px_50px_-30px_rgba(12,34,31,0.35)]">
                  <div className="font-heading text-lg font-bold">{FREE_PLAN.name}</div>
                  <p className="mt-1 text-sm text-neutral-500">Everything you need to get booked.</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="pb-1.5 text-2xl font-bold">₹</span>
                    <span className="font-heading text-5xl font-extrabold tracking-tight">0</span>
                    <span className="pb-2 text-sm text-neutral-500">/month</span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-neutral-500">Free forever · 5% per booking</p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {FREE_PLAN.features.slice(0, 5).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600">
                        <Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ca-accent)' }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <CtaButton to={START} variant="ghost" className="mt-7 w-full">Get Started</CtaButton>
                </div>
              </Reveal>

              {/* Sloth Active (premium) — recommended */}
              <Reveal delay={0.08}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-[22px] border-2 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(16,24,40,0.14)]" style={{ borderColor: 'var(--ca-primary)' }}>
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, var(--ca-primary), #A16207)' }} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="font-heading text-lg font-bold">{PREMIUM_PLAN.name}</div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--ca-ink)]" style={{ background: 'color-mix(in srgb, var(--ca-accent) 20%, transparent)' }}>Recommended</span>
                    </div>
                    {yearly && <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: 'var(--ca-accent)' }}>Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">Keep every rupee. Automate the rest.</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="pb-1.5 text-2xl font-bold" style={{ color: 'var(--ca-primary)' }}>₹</span>
                    <span className="font-heading text-5xl font-extrabold tracking-tight" style={{ color: 'var(--ca-primary)' }}>{yearly ? Math.round(PREMIUM_PLAN.yearly / 12) : PREMIUM_PLAN.monthly}</span>
                    <span className="pb-2 text-sm text-neutral-500">/month</span>
                    {yearly && <span className="pb-2 ml-1 text-sm text-neutral-500 line-through">₹{PREMIUM_PLAN.monthly}</span>}
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-neutral-500">{yearly ? `Billed ₹${PREMIUM_PLAN.yearly.toLocaleString('en-IN')}/year · GST included` : 'Billed monthly · GST included'}</p>
                  <ul className="mt-6 flex flex-col gap-3">
                    <li className="flex items-start gap-2.5 text-sm font-semibold" style={{ color: 'var(--ca-ink)' }}>
                      <Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ca-primary)' }} />
                      <span>Everything in Free</span>
                    </li>
                    {PREMIUM_PLAN.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600">
                        <Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ca-primary)' }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <CtaButton to={START} className="mt-7 w-full">Get Started Now</CtaButton>
                </div>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.12} className="mt-8 flex flex-col items-center gap-2 text-center">
            <span className="flex items-center gap-1.5 text-sm text-neutral-500"><Lock size={14} style={{ color: 'var(--ca-accent)' }} /> Access to all features with no hidden fees</span>
            <Link to="/pricing" className="text-sm font-semibold text-neutral-500 underline-offset-4 hover:text-[color:var(--ca-ink)] hover:underline">
              Compare every feature on the full pricing page
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 13 · ABOUT (editorial wellness story) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:mx-0">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-[42%_58%_47%_53%/50%_45%_55%_50%]" style={{ background: 'linear-gradient(135deg, rgba(17,94,89,0.16), rgba(161,98,7,0.14))' }} />
            <img src={ABOUT_ART} alt="Book A Sloth for spas and wellness centres" loading="lazy" className="relative z-10 mx-auto w-full max-w-[22rem] drop-shadow-[0_24px_32px_rgba(12,34,31,0.16)]" />
          </Reveal>
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Wellness businesses deserve calmer tools.
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-5 text-base leading-relaxed text-neutral-600">
              Book A Sloth was built to make appointment-based businesses easier to run. Instead of a ringing phone, a paper diary and scattered payments, spas can manage their bookings, guests and money from one serene platform.
            </Reveal>
            <Reveal as="p" delay={0.1} className="mt-4 text-[15px] font-medium text-neutral-500">
              Built for Indian professionals. Designed for the way modern spas actually work.
            </Reveal>
            <Reveal delay={0.14} className="mt-8">
              <Link to="/about" className="inline-flex items-center gap-2 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ca-primary)' }}>
                Learn More About Us <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ 14 · FAQ (accordion) ═══════════════ */}
      <section id="faq" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="text-center font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Questions? <span style={{ color: 'var(--ca-primary)' }}>We&apos;ve got answers.</span>
          </Reveal>
          <div className="mt-12"><FaqAccordion /></div>
        </div>
      </section>

      {/* ═══════════════ 15 · FINAL CTA (full-bleed immersive) ═══════════════ */}
      <section className="relative overflow-hidden px-5 py-24 text-center sm:px-8" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #17756E 0%, #0A1D1A 65%)' }}>
        <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-56 w-[42rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(230,199,126,0.2), transparent)' }} />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(circle at 50% 40%, #000, transparent 70%)', WebkitMaskImage: 'radial-gradient(circle at 50% 40%, #000, transparent 70%)' }} />
        <div className="relative mx-auto max-w-2xl">
          <Reveal className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(230,199,126,0.18)' }}>
            <Flower2 size={26} style={{ color: GOLD }} />
          </Reveal>
          <Reveal as="h2" delay={0.06} className="mt-6 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Spend less time on the phone. <span style={{ color: GOLD }}>Spend more time creating calm.</span>
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-lg text-base text-white/70">
            Set up your spa booking page today and give your guests a serene way to book with you.
          </Reveal>
          <Reveal delay={0.14} className="mt-8">
            <Link to={START} className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold shadow-[0_10px_30px_-8px_rgba(230,199,126,0.6)] transition-opacity hover:opacity-90 hover:no-underline" style={{ background: GOLD, color: 'var(--ca-ink)' }}>
              Start for Free <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal as="p" delay={0.18} className="mt-4 text-xs text-white/60">No credit card required</Reveal>
        </div>
      </section>

      {/* ═══════════════ 16 · FOOTER ═══════════════ */}
      <footer className="border-t border-black/5 px-5 py-16 sm:px-8" style={{ background: '#ffffff' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div>
              <div className="font-heading text-lg font-extrabold text-[color:var(--ca-ink)]">Book A Sloth</div>
              <p className="mt-2 max-w-xs text-sm text-neutral-500">The serene way to manage spa bookings.</p>
              <CtaButton to={START} className="mt-5">Start for Free <ArrowRight size={15} /></CtaButton>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="text-xs font-bold uppercase tracking-wide text-neutral-600">{col.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <NavLink item={l} className="text-sm text-neutral-600 transition-colors hover:text-[color:var(--ca-primary)] hover:no-underline" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-black/5 pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-neutral-500">© 2026 Book A Sloth. Razorpay-secure payments · GST invoices · Made in India 🇮🇳</p>
            <p className="text-xs text-neutral-500">Made for India&apos;s spas &amp; wellness centres</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

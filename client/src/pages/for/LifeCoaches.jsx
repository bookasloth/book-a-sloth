// /for/life-coaches — bespoke, conversion-focused landing page for life &
// wellness coaches in India.
//
// STANDALONE page (not the data-driven ProfessionLanding template). Same shared
// infra as its siblings (Seo, Reveal, useLenis, real plan data, /be-a-sloth
// funnel). This bespoke route PRECEDES /for/:profession in App.jsx.
//
// New URL /for/life-coaches — keep in sync: App.jsx route (before
// /for/:profession), prerender.mjs list, sitemapService.js, and the Navbar
// "For professionals" menu (was a /explore placeholder).
//
// Section design (per the profession design brief, #14 Life & Wellness Coaches):
//   centered personal-brand hero · bento benefit cards · editorial service list ·
//   circular how-it-works journey · minimal integration icon row · personal
//   transformation metrics · floating mid CTA · alternating editorial why-us ·
//   large testimonial stories · manual-vs-automated comparison · minimal
//   credibility strip · elegant centered pricing · personal-story about · tabbed
//   FAQ · floating conversion final CTA.
//
// HONESTY (same rules as the sibling pages): pricing mirrors the REAL two-plan
// model from data/plans.js; verifiable trust strip (no fabricated counts);
// labelled placeholder testimonials about the SOFTWARE's admin benefit, not
// coaching outcomes; JSON-LD with NO self-serving aggregateRating.
//
// Legacy --ca-* CSS var names are kept (cosmetic) so shared classNames stay
// valid; values are retuned to a calm teal + warm-orange "wellness" palette.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Menu, X, Plus, Star,
  CalendarCheck, LayoutDashboard, MessageCircle,
  Wallet, BellRing, Heart,
  Users, Clock3, Landmark, Folder,
  FileText, Target, Sparkles, Leaf, Compass, Sunrise,
  BadgePercent, Lock, Zap, Share2, IndianRupee,
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
const HERO_ART = '/images/abs/illustrations/fitness-woman.webp';
const ABOUT_ART = '/images/abs/illustrations/sloth-hammock.webp';
const CORAL = '#FB923C'; // warm bright orange — used only on the dark CTA where contrast is high

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'For Coaches', href: '#usecases' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Built for Indian coaches'];

// Bento benefit cards — one wide feature + supporting tiles.
const BENEFITS = [
  { icon: CalendarCheck, title: 'Booked & Confirmed', desc: 'Clients pick a session and it is confirmed — no DM tag.', wide: true },
  { icon: Wallet, title: 'Paid Upfront', desc: 'Collect your session fee online before you meet.' },
  { icon: BellRing, title: 'Fewer No-Shows', desc: 'Automatic WhatsApp reminders before every session.' },
  { icon: Heart, title: 'A Calmer Practice', desc: 'One place for your clients, sessions and payments.' },
  { icon: BadgePercent, title: 'Keep Every Rupee', desc: '0% commission on Sloth Active — it all stays yours.' },
];

// Editorial service list — the sessions a coach sells.
const SERVICES = [
  { icon: Compass, label: 'Discovery Call', desc: 'A paid intro call to see if you are the right fit.' },
  { icon: Target, label: '1:1 Coaching Session', desc: 'One-on-one sessions, booked and paid in advance.' },
  { icon: Sparkles, label: 'Life & Mindset Coaching', desc: 'Clarity, habits and personal growth work.' },
  { icon: Leaf, label: 'Wellness & Wellbeing', desc: 'Stress, balance and lifestyle sessions.' },
  { icon: Sunrise, label: 'Coaching Packages', desc: 'Multi-session programmes with recurring bookings.' },
  { icon: Users, label: 'Group Sessions & Workshops', desc: 'Run a cohort or a group programme.' },
];

// Circular how-it-works journey.
const STEPS = [
  { title: 'Set up your sessions', icon: LayoutDashboard, desc: 'Add your services, fees and availability in minutes.' },
  { title: 'Share your link', icon: Share2, desc: 'Put it in your bio, DMs or newsletter — one calm link.' },
  { title: 'Clients book & pay', icon: CalendarCheck, desc: 'They pick a time and pay upfront — no back-and-forth.' },
  { title: 'Everyone gets reminded', icon: BellRing, desc: 'Automatic confirmations and reminders before each session.' },
];

// Minimal integration icon row — REAL BAS integrations only.
const TOOLS = [
  { name: 'Google Calendar', icon: 'google-calendar', sub: 'Two-way sync of your real availability' },
  { name: 'Google Meet', logo: '/images/logos/google-meet.svg', sub: 'Auto-add a video link to every session' },
  { name: 'Zoom', logo: '/images/logos/zoom.ico', sub: 'Share meeting links automatically' },
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Online payments, refunds and GST invoices' },
  { name: 'WhatsApp Automation', logo: '/images/logos/whatsapp.svg', sub: 'Reminders and updates on autopilot' },
  { name: 'Gmail', logo: '/images/logos/gmail.svg', sub: 'Booking confirmation emails, automatic' },
];

// Personal transformation metrics.
const METRICS = [
  { v: '24/7', l: 'Bookings, day or night', note: 'Your booking page never sleeps — clients reserve sessions any time.' },
  { v: '100%', l: 'Kept on Sloth Active', note: '0% commission — every rupee you earn stays yours.' },
  { v: '₹0', l: 'To get started', note: 'Free forever plan — no card, no lock-in.' },
  { v: 'GST', l: 'Invoices, automatic', note: 'A tax invoice generated for every paid booking.' },
];

// Placeholder testimonials — swap for real coach quotes when available.
// Large testimonial stories. About the SOFTWARE's admin benefit, not outcomes.
const TESTIMONIALS = [
  { quote: 'I used to lose clients in Instagram DMs trying to find a time. Now they book a paid session from my link and it is confirmed — I just show up and coach. It gave me my mornings back.', name: 'Ananya Menon', role: 'Life Coach', company: 'Bengaluru', featured: true },
  { quote: 'Automatic reminders cut my no-shows to almost nothing. Fewer empty slots, fewer awkward follow-ups.', name: 'Rhea Kapoor', role: 'Wellness Coach', company: 'Mumbai' },
  { quote: 'Taking the session fee upfront over UPI, with a GST invoice each time, made my practice feel like a real business.', name: 'Karan Malhotra', role: 'Mindset Coach', company: 'Delhi' },
  { quote: 'Clients book their own sessions without waiting for me to reply. Setup took one evening.', name: 'Sneha Rao', role: 'Wellbeing Coach', company: 'Pune' },
];

// Before / after — a coach's day without vs with Book A Sloth.
const OLD_WAY = [
  { title: 'DM tag for every session', desc: 'Clients message to find a time; you reply between sessions.' },
  { title: 'No-shows waste your day', desc: 'A missed session is a slot you cannot fill.' },
  { title: 'Chasing session fees', desc: 'You follow up for payment after the session.' },
  { title: 'Clients scattered everywhere', desc: 'Notes across DMs, chats, notebooks and email.' },
  { title: 'Double-booked slots', desc: 'Two clients penciled into the same hour by hand.' },
];
const NEW_WAY = [
  { title: 'One calm booking link', desc: 'Share it in your bio; clients pick a slot, 24/7.' },
  { title: 'Automatic reminders', desc: 'WhatsApp and email reminders cut no-shows.' },
  { title: 'Fees collected upfront', desc: 'Session fee taken at booking, over UPI or card.' },
  { title: 'Every client in one place', desc: 'Sessions, history and notes in a single dashboard.' },
  { title: 'Conflict-free calendar', desc: 'Availability stays accurate — no double bookings.' },
];

// Honest, minimal credibility strip — verifiable facts only.
const TRUST_STRIP = [
  { icon: Lock, value: 'Razorpay', label: 'Every payment signature-verified on our servers' },
  { icon: Landmark, value: 'Hosted in India', label: 'Your practice data runs on servers in Mumbai' },
  { icon: FileText, value: 'DPDP 2023', label: 'Operated under India’s data protection law' },
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
];

const FAQ = [
  { q: 'Is Book A Sloth suitable for life and wellness coaches?', a: 'Yes. Whether you coach one-on-one or run group programmes, Book A Sloth manages your sessions, availability, client bookings and communication from one place — so you can focus on coaching, not coordination.' },
  { q: 'Can clients book coaching sessions online?', a: 'Yes. A client opens your booking link, chooses a session such as a discovery call or a 1:1, picks a convenient time and confirms — no DMs or waiting for a reply.' },
  { q: 'Can I take a paid discovery call?', a: 'Yes. Create a paid intro or discovery call with its own fee and duration. Clients pay upfront through Razorpay when they book, so you only spend time on committed clients.' },
  { q: 'Can I share my booking link in my Instagram bio?', a: 'Yes. Your link works anywhere — put it in your Instagram or LinkedIn bio, your newsletter or your DMs. One link handles all your booking requests.' },
  { q: 'Can I collect session fees online?', a: 'Yes. Collect fees upfront through Razorpay — UPI, cards or netbanking — before the session. A GST invoice is generated automatically for every paid booking.' },
  { q: 'Can I sell coaching packages or run group sessions?', a: 'Yes. Offer multi-session packages, recurring bookings and group sessions or workshops — each with its own duration, fee and availability.' },
  { q: 'Can I run online sessions?', a: 'Yes. Offer online sessions with automatic Google Meet or Zoom links, or mark a service as in-person — or both. The client picks the mode that suits them.' },
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
    { label: 'Life & Wellness Coaches', to: '/for/life-coaches' },
    { label: 'Fitness Trainers', to: '/for/fitness' },
    { label: 'Business Consultants', to: '/for/business-consultant' },
    { label: 'Chartered Accountants', to: '/for/chartered-accountants' },
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
    solid: 'text-white shadow-[0_4px_14px_rgba(15,118,110,0.22)] hover:brightness-110',
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

/* Editorial service list row — number, icon, title, rule-separated. */
function ServiceRow({ s, n }) {
  return (
    <Link to={START} className="group flex items-start gap-5 border-b border-black/[0.08] py-6 hover:no-underline">
      <span className="font-heading text-2xl font-extrabold leading-none tabular-nums" style={{ color: 'rgba(15,118,110,0.28)' }}>{String(n).padStart(2, '0')}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2.5">
          <s.icon size={18} style={{ color: 'var(--ca-accent)' }} />
          <h3 className="font-heading text-[16px] font-bold text-[color:var(--ca-ink)] transition-colors group-hover:text-[color:var(--ca-primary)]">{s.label}</h3>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{s.desc}</p>
      </div>
      <ArrowRight size={16} className="mt-1 shrink-0 text-neutral-300 transition-all group-hover:translate-x-0.5 group-hover:text-[color:var(--ca-primary)]" />
    </Link>
  );
}

/* Circular how-it-works journey — numbered rings on a horizontal rail. */
function HowItWorks({ steps }) {
  return (
    <div className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      <span aria-hidden className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-8 hidden h-px lg:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(15,118,110,0.45), transparent)' }} />
      {steps.map((s, i) => (
        <Reveal key={s.title} delay={i * 0.08} className="relative text-center">
          <span className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white" style={{ borderColor: 'rgba(15,118,110,0.4)', color: 'var(--ca-primary)' }}>
            <s.icon size={24} />
          </span>
          <span className="mx-auto mt-3 flex h-6 w-6 items-center justify-center rounded-full font-heading text-[11px] font-extrabold text-white" style={{ background: 'var(--ca-accent)' }}>{i + 1}</span>
          <h3 className="mt-3 font-heading text-base font-bold text-[color:var(--ca-ink)]">{s.title}</h3>
          <p className="mx-auto mt-1.5 max-w-[15rem] text-sm leading-relaxed text-neutral-500">{s.desc}</p>
        </Reveal>
      ))}
    </div>
  );
}

/* One integration row — logo + label + note. */
function ToolRow({ t }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[14px] border border-black/[0.08] bg-white px-4 py-3.5">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[color:var(--ca-grey)]">
        {t.logo
          ? <img src={t.logo} alt="" loading="lazy" className="h-5 w-5 object-contain" />
          : <ToolLogo name={t.icon} size={20} className="h-5 w-5" />}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold leading-tight text-[color:var(--ca-ink)]">{t.name}</div>
        <div className="mt-0.5 text-xs leading-snug text-neutral-500">{t.sub}</div>
      </div>
    </div>
  );
}

/* Smoothly-animated single-open FAQ accordion, two columns (tabbed feel). */
function FaqAccordion() {
  const [open, setOpen] = useState(0);
  const renderItem = (f, i) => {
    const isOpen = open === i;
    return (
      <div key={f.q} className="overflow-hidden rounded-[14px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'rgba(15,118,110,0.35)' : 'rgba(17,17,17,0.08)' }}>
        <button
          type="button"
          onClick={() => setOpen(isOpen ? -1 : i)}
          aria-expanded={isOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[color:var(--ca-ink)]"
        >
          {f.q}
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'rgba(15,118,110,0.1)', color: 'var(--ca-primary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
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

export default function LifeCoaches() {
  useLenis();
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  const canonical = `${SITE_URL}/for/life-coaches`;
  const seo = {
    title: 'Appointment Booking Software for Life & Wellness Coaches | Book A Sloth',
    description: 'Book A Sloth is appointment scheduling software for life and wellness coaches in India. Let clients book coaching sessions and paid discovery calls online — fees collected upfront, WhatsApp reminders, GST invoices, 0% commission. Start free.',
    keywords: 'appointment booking software for coaches, life coach scheduling software india, book coaching session online, wellness coach booking page, paid discovery call scheduling, coaching appointment software',
    ogTitle: 'Your practice runs on sessions. Let Book A Sloth schedule them.',
    ogDescription: 'Clients book coaching sessions, pay upfront and get WhatsApp reminders — automatically. A calm booking page for life and wellness coaches in India.',
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
      serviceType: 'Appointment booking software for life and wellness coaches',
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
        { '@type': 'ListItem', position: 2, name: 'For Life & Wellness Coaches', item: canonical },
      ],
    },
  ];

  // Calm wellness palette — legacy --ca-* var names kept so shared classNames work.
  const styleVars = {
    '--ca-primary': '#0F766E', // teal-700 (AA-safe: white text/links)
    '--ca-accent': '#C2410C',  // orange-700 (AA on white ~5:1)
    '--ca-ink': '#1C2B2A',     // deep teal-charcoal text
    '--ca-cream': '#F5F7F4',   // warm sage off-white section bg
    '--ca-grey': '#EEF2F0',    // light sage-grey section bg
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
        themeColor="#0F766E"
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

      {/* ═══════════════ 2 · HERO (centered personal-brand) ═══════════════ */}
      <section className="relative overflow-hidden px-5 pb-16 pt-12 text-center sm:px-8 sm:pb-20 sm:pt-16 lg:pb-24" style={{ background: 'linear-gradient(180deg, var(--ca-cream) 0%, #ffffff 100%)' }}>
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-72 w-[46rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(15,118,110,0.12), transparent)' }} />
        <div className="relative mx-auto max-w-3xl">
          <Reveal as="p" instant className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(15,118,110,0.3)', color: 'var(--ca-primary)', background: 'color-mix(in srgb, var(--ca-primary) 8%, transparent)' }}>
            For life &amp; wellness coaches
          </Reveal>
          <Reveal as="h1" instant className="text-[clamp(1.8rem,7vw,2.9rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[color:var(--ca-ink)] lg:text-[3.1rem]">
            A calm way for coaches to{' '}
            <span style={{ color: 'var(--ca-primary)' }}>book &amp; get paid</span>{' '}
            for their sessions.
          </Reveal>
          <Reveal as="p" instant delay={0.05} className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-500 sm:mt-6 sm:text-lg">
            Stop losing clients in your DMs. Let them book sessions, pay upfront and get reminded on their own — from one calm platform built for coaches.
          </Reveal>
          <Reveal instant delay={0.1} className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
            <Link
              to={START}
              className="btn flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(15,118,110,0.25)] transition-opacity hover:opacity-90 hover:no-underline sm:w-auto"
              style={{ background: 'var(--ca-primary)' }}
            >
              Create a Free Account <ArrowRight size={16} />
            </Link>
            <Link to="/demo" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ca-ink)] transition-colors hover:text-[color:var(--ca-primary)] hover:no-underline">
              Book A Demo <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
          <Reveal instant delay={0.14} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {HERO_TRUST.map((t) => (
              <span key={t} className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500">
                <Check size={14} style={{ color: 'var(--ca-accent)' }} /> {t}
              </span>
            ))}
          </Reveal>
        </div>

        {/* centered illustration + floating glass cards */}
        <Reveal instant delay={0.12} className="relative mx-auto mt-12 hidden max-w-md sm:block">
          <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[rgba(15,118,110,0.12)] to-[rgba(194,65,12,0.12)] blur-2xl" />
          <img src={HERO_ART} alt="Book A Sloth — appointment booking for life and wellness coaches" loading="eager" className="relative z-10 mx-auto w-full max-w-[24rem] drop-shadow-[0_28px_40px_rgba(28,43,42,0.18)]" />
          <GlassCard icon={CalendarCheck} label="New booking" value="1:1 Session · 5:00 PM" float="sloth-float" className="top-4 -left-6 hidden lg:flex" />
          <GlassCard icon={Wallet} label="Fee received" value="₹2,000" accent float="sloth-float--mid" className="top-1/2 -right-8 hidden lg:flex" />
          <GlassCard icon={BellRing} label="Reminder" value="Sent · 1h before" float="sloth-float--slow" className="bottom-8 left-0 hidden lg:flex" />
        </Reveal>
      </section>

      {/* ═══════════════ 3 · BENEFITS (bento) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Everything your practice needs, <span style={{ color: 'var(--ca-primary)' }}>in one calm place.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">
              Less time on admin, more time coaching — and every rupee you earn stays yours.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={(i % 3) * 0.06} className={b.wide ? 'sm:col-span-2' : ''}>
                <div className={`group flex h-full flex-col rounded-[18px] border border-black/[0.08] bg-white p-6 transition-colors hover:border-[color:var(--ca-primary)]/25 ${b.wide ? 'sm:p-8' : ''}`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-300" style={{ background: 'color-mix(in srgb, var(--ca-primary) 8%, transparent)', color: 'var(--ca-primary)' }}>
                    <b.icon size={20} />
                  </span>
                  <h3 className={`mt-4 font-heading font-bold text-[color:var(--ca-ink)] ${b.wide ? 'text-lg' : 'text-base'}`}>{b.title}</h3>
                  <p className={`mt-1.5 leading-relaxed text-neutral-500 ${b.wide ? 'text-[15px]' : 'text-sm'}`}>{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4 · SERVICES (editorial list) ═══════════════ */}
      <section id="usecases" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Built around the way <span style={{ color: 'var(--ca-primary)' }}>coaches work.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">
              From discovery calls to 1:1s, packages and group sessions, manage every booking in one place.
            </Reveal>
          </div>
          <div className="mt-10 grid gap-x-14 sm:grid-cols-2">
            {SERVICES.map((s, i) => (
              <Reveal key={s.label} delay={(i % 2) * 0.05}>
                <ServiceRow s={s} n={i + 1} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 5 · HOW IT WORKS (circular journey) ═══════════════ */}
      <section id="how" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              How Book A Sloth helps <span style={{ color: 'var(--ca-primary)' }}>coaches</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              From &ldquo;when are you free?&rdquo; to a confirmed, paid session — in four gentle steps.
            </Reveal>
          </div>
          <HowItWorks steps={STEPS} />
        </div>
      </section>

      {/* ═══════════════ 6 · INTEGRATIONS (minimal icon row) ═══════════════ */}
      <section id="features" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Works with the tools you already use.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Connect your calendar, payments and WhatsApp — Book A Sloth fits your workflow, no rewiring.
            </Reveal>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 0.05}>
                <ToolRow t={t} />
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

      {/* ═══════════════ 7 · IMPACT (personal transformation metrics) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Real impact for <span style={{ color: 'var(--ca-primary)' }}>a modern coaching practice.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              Less admin, more presence — and every rupee you earn stays yours.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m, i) => (
              <Reveal key={m.l} delay={i * 0.06}>
                <div className="relative h-full overflow-hidden rounded-[18px] border border-black/[0.08] bg-white p-7 text-center">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--ca-primary), #C2410C)' }} />
                  <div className="font-heading text-5xl font-extrabold tracking-tight" style={{ color: 'var(--ca-primary)' }}>{m.v}</div>
                  <div className="mt-3 font-heading text-sm font-bold text-[color:var(--ca-ink)]">{m.l}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{m.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 8 · MID CTA (floating booking prompt) ═══════════════ */}
      <section className="px-5 py-12 sm:px-8">
        <Reveal className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-4 rounded-[22px] px-7 py-9 text-center text-white shadow-[0_24px_60px_-30px_rgba(15,118,110,0.6)]" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #14857B 0%, #0F766E 60%)' }}>
            <div className="font-heading text-xl font-extrabold sm:text-2xl">Ready to fill your calendar with paid sessions?</div>
            <p className="max-w-md text-sm text-white/75">Set up your booking page today — free forever, no card required.</p>
            <Link to={START} className="mt-1 inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold shadow-lg transition-opacity hover:opacity-90 hover:no-underline" style={{ background: CORAL, color: '#3A1607' }}>
              Start for Free <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════ 9 · WHY BOOK A SLOTH (alternating editorial) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl space-y-20 lg:space-y-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                A booking page as calm as your practice.
              </Reveal>
              <Reveal as="p" delay={0.06} className="mt-5 text-base leading-relaxed text-neutral-600">
                A clean, branded page tells a client you take your work seriously. They pick a slot, pay upfront and get an automatic confirmation — no chasing, no awkward money conversations after the session.
              </Reveal>
              <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-3 lg:mx-0">
                {['Branded page with your sessions & fees', 'Upfront payment before every session', 'Automatic GST invoices'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ca-accent)' }} /> <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Reveal delay={0.08} className="relative mx-auto w-full max-w-md">
              <div aria-hidden className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0F766E]/10 blur-3xl" />
              <img src={ABOUT_ART} alt="" loading="lazy" className="relative z-10 mx-auto w-full max-w-sm object-contain drop-shadow-[0_24px_40px_rgba(28,43,42,0.16)]" />
            </Reveal>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal delay={0.08} className="relative order-2 mx-auto w-full max-w-md lg:order-1">
              <div aria-hidden className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C2410C]/12 blur-3xl" />
              <img src={HERO_ART} alt="" loading="lazy" className="relative z-10 mx-auto w-full max-w-sm object-contain drop-shadow-[0_24px_40px_rgba(28,43,42,0.16)]" />
            </Reveal>
            <div className="order-1 text-center lg:order-2 lg:text-left">
              <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                Spend your energy on clients, not coordination.
              </Reveal>
              <Reveal as="p" delay={0.06} className="mt-5 text-base leading-relaxed text-neutral-600">
                Reminders go out on their own, your calendar stays conflict-free, and every client&apos;s history sits in one place. The admin that used to drain your day simply disappears.
              </Reveal>
              <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-3 lg:mx-0">
                {['Automatic WhatsApp & email reminders', 'Conflict-free, calendar-synced availability', 'Client notes & session history in one place'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ca-accent)' }} /> <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 10 · TESTIMONIALS (large stories) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Trusted by <span style={{ color: 'var(--ca-primary)' }}>coaches</span> across India.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Hear how coaches book more paid sessions and cut the admin with Book A Sloth.
            </Reveal>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {/* featured large story */}
            {TESTIMONIALS.filter((t) => t.featured).map((t) => (
              <Reveal key={t.name} className="lg:col-span-1 lg:row-span-2">
                <figure className="flex h-full flex-col rounded-[20px] p-8 text-white" style={{ background: 'radial-gradient(120% 120% at 0% 0%, #14857B 0%, #0F766E 65%)' }}>
                  <span aria-hidden className="font-heading text-5xl leading-none" style={{ color: 'rgba(255,255,255,0.5)' }}>&ldquo;</span>
                  <blockquote className="-mt-2 text-[17px] font-medium leading-relaxed">{t.quote}</blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 border-t border-white/15 pt-5">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: CORAL, color: '#3A1607' }}>{t.name.charAt(0)}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{t.name}</div>
                      <div className="truncate text-xs text-white/70">{t.role} · {t.company}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}

            {/* supporting stories */}
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
              {TESTIMONIALS.filter((t) => !t.featured).map((t, i) => (
                <Reveal key={t.name} delay={(i % 2) * 0.06}>
                  <figure className="flex h-full flex-col rounded-[18px] border border-black/[0.08] bg-white p-6">
                    <span aria-hidden className="font-heading text-4xl leading-none" style={{ color: 'rgba(194,65,12,0.5)' }}>&ldquo;</span>
                    <blockquote className="-mt-2 text-[14px] leading-relaxed text-neutral-700">{t.quote}</blockquote>
                    <figcaption className="mt-auto flex items-center gap-3 border-t border-black/[0.06] pt-4">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--ca-primary)' }}>{t.name.charAt(0)}</span>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-[color:var(--ca-ink)]">{t.name}</div>
                        <div className="truncate text-[12px] text-neutral-500">{t.role} · {t.company}</div>
                      </div>
                      <span className="ml-auto flex gap-0.5">{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={11} style={{ color: 'var(--ca-accent)', fill: 'var(--ca-accent)' }} />)}</span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 11 · DIFFERENCE (manual vs automated) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Manual scheduling vs <span style={{ color: 'var(--ca-primary)' }}>a calmer, automated way.</span>
            </Reveal>
          </div>
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[18px] border border-black/[0.08] bg-white shadow-[0_14px_40px_-24px_rgba(28,43,42,0.25)]">
            <div className="grid grid-cols-2 border-b-2" style={{ borderColor: 'var(--ca-primary)' }}>
              <div className="flex items-center gap-2 px-5 py-4 sm:px-6"><X size={16} className="text-[#DC2626]" /><span className="font-heading text-sm font-bold text-neutral-500">Manual scheduling</span></div>
              <div className="flex items-center gap-2 border-l border-black/[0.06] px-5 py-4 sm:px-6" style={{ background: 'rgba(15,118,110,0.04)' }}><Check size={16} style={{ color: 'var(--ca-primary)' }} /><span className="font-heading text-sm font-bold" style={{ color: 'var(--ca-ink)' }}>With Book A Sloth</span></div>
            </div>
            {OLD_WAY.map((o, i) => (
              <Reveal key={o.title} className={`grid grid-cols-2 ${i % 2 ? '' : 'bg-black/[0.015]'}`}>
                <div className="border-t border-black/[0.06] px-5 py-4 sm:px-6">
                  <p className="text-[14px] font-semibold text-neutral-700">{o.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-500">{o.desc}</p>
                </div>
                <div className="border-l border-t border-black/[0.06] px-5 py-4 sm:px-6" style={{ background: 'rgba(15,118,110,0.03)' }}>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--ca-ink)' }}>{NEW_WAY[i]?.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-600">{NEW_WAY[i]?.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 12 · TRUST STRIP (minimal credibility) ═══════════════ */}
      <section className="border-y border-black/5 px-5 py-12 sm:px-8" style={{ background: 'var(--ca-ink)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST_STRIP.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <s.icon size={20} className="mx-auto" style={{ color: CORAL }} />
              <div className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{s.value}</div>
              <p className="mx-auto mt-1.5 max-w-[14rem] text-xs leading-snug text-white/50">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 13 · PRICING (elegant centered) ═══════════════ */}
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Start small. <span style={{ color: 'var(--ca-primary)' }}>Grow as your practice does.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-4 text-base text-neutral-500">
              Choose a plan that fits your practice today. Upgrade when you need more.
            </Reveal>
          </div>

          <Reveal delay={0.1} className="mt-8 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setYearly(false)} className={`text-sm font-semibold transition-colors ${!yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>Monthly</button>
            <button type="button" role="switch" aria-checked={yearly} aria-label="Toggle monthly or yearly billing" onClick={() => setYearly((v) => !v)} className="relative h-6 w-11 rounded-full transition-colors" style={{ background: yearly ? 'var(--ca-primary)' : '#d4d4d4', minHeight: 0 }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: yearly ? '22px' : '2px' }} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>
              Yearly <span className="ml-1 rounded-full bg-[#0F766E]/12 px-2 py-0.5 text-xs font-bold text-[#0F766E]">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>
            </span>
          </Reveal>

          <div className="relative mx-auto mt-10 max-w-3xl">
            <div className="relative grid gap-5 sm:grid-cols-2 sm:gap-6">
              {/* Sloth (free) */}
              <Reveal>
                <div className="flex h-full flex-col rounded-[20px] border border-black/[0.08] bg-white p-7">
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
                <div className="relative flex h-full flex-col overflow-hidden rounded-[20px] border-2 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(16,24,40,0.14)]" style={{ borderColor: 'var(--ca-primary)' }}>
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, var(--ca-primary), #C2410C)' }} />
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

      {/* ═══════════════ 14 · ABOUT (personal story) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:mx-0">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0F766E]/10 blur-3xl" />
            <img src={ABOUT_ART} alt="Book A Sloth mascot" loading="lazy" className="relative z-10 mx-auto w-full max-w-[22rem] drop-shadow-[0_24px_32px_rgba(28,43,42,0.16)]" />
          </Reveal>
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Small practices deserve better tools.
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-5 text-base leading-relaxed text-neutral-600">
              Book A Sloth was built to make appointment-based practices easier to run. Instead of stitching together calendars, DMs, notebooks and payment tools, coaches can manage their client sessions from one calm platform.
            </Reveal>
            <Reveal as="p" delay={0.1} className="mt-4 text-[15px] font-medium text-neutral-500">
              Built for Indian professionals. Designed for the way modern practices actually work.
            </Reveal>
            <Reveal delay={0.14} className="mt-8">
              <Link to="/about" className="inline-flex items-center gap-2 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ca-primary)' }}>
                Learn More About Us <ArrowRight size={16} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ 15 · FAQ (tabbed / two-column) ═══════════════ */}
      <section id="faq" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="text-center font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Questions? <span style={{ color: 'var(--ca-primary)' }}>We&apos;ve got answers.</span>
          </Reveal>
          <div className="mt-12"><FaqAccordion /></div>
        </div>
      </section>

      {/* ═══════════════ 16 · FINAL CTA (floating conversion block) ═══════════════ */}
      <section className="relative px-5 py-24 sm:px-8" style={{ background: 'var(--ca-cream)' }}>
        <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[28px] px-6 py-16 text-center text-white shadow-[0_40px_90px_-40px_rgba(15,118,110,0.7)]" style={{ background: 'radial-gradient(130% 130% at 50% 0%, #14857B 0%, #0B534D 65%)' }}>
          <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-56 w-[42rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(251,146,60,0.2), transparent)' }} />
          <div className="relative mx-auto max-w-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(251,146,60,0.18)' }}>
              <Zap size={26} style={{ color: CORAL }} />
            </div>
            <h2 className="mt-6 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
              Spend less time scheduling. <span style={{ color: CORAL }}>Spend more time coaching.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/70">
              Set up your booking page today and give your clients a calmer way to work with you.
            </p>
            <div className="mt-8">
              <Link to={START} className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold shadow-[0_10px_30px_-8px_rgba(251,146,60,0.6)] transition-opacity hover:opacity-90 hover:no-underline" style={{ background: CORAL, color: '#3A1607' }}>
                Start for Free <ArrowRight size={16} />
              </Link>
            </div>
            <p className="mt-4 text-xs text-white/60">No credit card required</p>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════ 17 · FOOTER ═══════════════ */}
      <footer className="border-t border-black/5 px-5 py-16 sm:px-8" style={{ background: '#ffffff' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div>
              <div className="font-heading text-lg font-extrabold text-[color:var(--ca-ink)]">Book A Sloth</div>
              <p className="mt-2 max-w-xs text-sm text-neutral-500">The calmer way to manage coaching sessions.</p>
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
            <p className="text-xs text-neutral-500">Made for India&apos;s life &amp; wellness coaches</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

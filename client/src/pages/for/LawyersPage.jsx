// /for/lawyers — bespoke, conversion-focused landing page for advocates &
// law firms in India.
//
// STANDALONE page (not the data-driven ProfessionLanding template) — same
// 14-section structure as /for/chartered-accountants, re-skinned to a "legal
// gravitas" look (deep navy + brass/gold, parchment sections). Reuses shared
// infra: Seo, Reveal, useLenis, real plan data, /be-a-sloth funnel, prerender +
// Solutions hub. This bespoke route PRECEDES /for/:profession in App.jsx, so it
// replaces the generic template that previously served /for/lawyers.
//
// HONESTY — the BCI advertising constraint (this page's defining rule):
//   Advocates are bound by Bar Council of India Rules, Ch. II, Sec. IV, Rule 36,
//   which bars advertising and solicitation of work. The same product reality that
//   blocked the CA page's compliance block applies here: hosts are auto-listed
//   publicly (Explore + sitemap + prerender), fees can't be hidden, and the GST
//   invoice is Book A Sloth's, not the advocate's. So this page makes NO
//   "BCI-compliant" claim (it would be false and a real misconduct exposure).
//   Instead it is positioned strictly as PRACTICE SCHEDULING for clients the
//   advocate already works with — no acquisition/solicitation language — and one
//   FAQ item states the BCI position candidly and points advocates to their own
//   Bar Council guidance. The visibility-toggle product task (spawned separately)
//   is what unblocks a genuine private/compliant story later.
//
//   Everything else mirrors the CA page: honest trust strip (real product facts),
//   labelled placeholder testimonials, real two-plan pricing from data/plans.js,
//   JSON-LD with NO self-serving aggregateRating, WCAG-AA contrast, a11y/SEO 100.
//
// The legacy --ca-* CSS var names are kept (cosmetic) so shared classNames stay
// valid; only their values are retuned to the navy/gold palette.
//
// New URL — keep in sync: App.jsx route (before /for/:profession), prerender.mjs
// already lists /for/lawyers, and Solutions.jsx already links it.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Menu, X, Plus, Star,
  CalendarCheck, LayoutDashboard, MessageCircle,
  Wallet, BellRing,
  Users, Clock3, Landmark, Folder,
  FileText, Scale, Gavel, ShieldCheck, Briefcase, Building2,
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
const MASCOT = '/images/lawyer.webp'; // advocate sloth mascot — transparent cutout (107KB webp)
const GOLD = '#C6A15B';           // bright brass — used only on the dark navy hero/CTA where contrast is high

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'For Law Practices', href: '#usecases' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Built for Indian practices'];

const BENEFITS = [
  { icon: CalendarCheck, title: 'Confirmed Consultations', desc: 'Clients book a slot and it is confirmed — no phone tag.' },
  { icon: Wallet, title: 'Fees, Upfront', desc: 'Collect the consultation fee online before the meeting.' },
  { icon: BellRing, title: 'Fewer No-Shows', desc: 'Automatic WhatsApp reminders before every consultation.' },
  { icon: LayoutDashboard, title: 'One Clear Diary', desc: 'Every consultation and client in a single view.' },
];

const USE_CASES = [
  { icon: Scale, label: 'Legal Consultation', desc: 'Advice on your matter.' },
  { icon: FileText, label: 'Document Review', desc: 'Contracts, deeds and drafting.' },
  { icon: Gavel, label: 'Litigation Strategy', desc: 'Case planning and hearings.' },
  { icon: Landmark, label: 'Corporate & Compliance', desc: 'Company law and filings.' },
  { icon: ShieldCheck, label: 'Property & Conveyancing', desc: 'Title, due diligence, registration.' },
  { icon: Users, label: 'Family & Matrimonial', desc: 'Sensitive matters, handled with care.' },
  { icon: Briefcase, label: 'Employment & Labour', desc: 'Advice for workplaces.' },
  { icon: Building2, label: 'Startup & Contracts', desc: 'Founders, agreements and terms.' },
];

const STEPS = [
  { title: 'Set up your consultation types', icon: LayoutDashboard, image: MASCOT, desc: 'Add your services and availability, then share your private booking link with your clients.' },
  { title: 'Clients book & pay', icon: CalendarCheck, image: MASCOT, desc: 'A client picks a service and a time, and pays the fee upfront — no calls, no back-and-forth.' },
  { title: 'Everyone gets reminded', icon: BellRing, image: MASCOT, desc: 'You and your client get automatic confirmations and WhatsApp reminders before the consultation.' },
];
// ponytail: all steps share MASCOT until distinct per-step art is supplied.

// Integration list — REAL BAS integrations only.
const TOOLS_LEFT = [
  { name: 'Google Calendar', icon: 'google-calendar', sub: 'Two-way sync of your real availability' },
  { name: 'WhatsApp Automation', logo: '/images/logos/whatsapp.svg', sub: 'Reminders and updates on autopilot' },
  { name: 'Client Records', logo: '/favicon.svg', sub: 'Every client, note and history in one place' },
];
const TOOLS_RIGHT = [
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Online payments, refunds and GST invoices' },
  { name: 'PhonePe', logo: '/images/logos/phonepe.svg', sub: 'Accept instant UPI payments' },
  { name: 'Gmail', logo: '/images/logos/gmail.svg', sub: 'Booking confirmation emails, automatic' },
];
const TOOLS_ALL = [...TOOLS_LEFT, ...TOOLS_RIGHT];

// Placeholder testimonials — swap for real advocate quotes when available. About
// the SOFTWARE's admin benefit (scheduling/reminders/payments), NOT case outcomes.
const CA_TESTIMONIALS = [
  { tone: 'white', quote: 'My office used to spend the morning on the phone fixing consultation times. Clients now pick a slot on my booking link and it is confirmed — the admin just disappeared.', name: 'Adv. Rohan Malhotra', role: 'Advocate, Delhi' },
  { tone: 'ink', quote: 'Automatic WhatsApp reminders cut our no-shows sharply. Fewer wasted consultation hours across the chamber.', name: 'Adv. Meera Krishnan', role: 'Partner, Chennai' },
  { tone: 'blue', quote: 'Collecting the consultation fee upfront over UPI, with a GST invoice generated automatically, cleaned up our billing.', name: 'Adv. Sameer Joshi', role: 'Advocate, Mumbai' },
  { tone: 'blue', quote: 'Clients book their appointments without waiting for the office to call back. Setup took an evening.', name: 'Adv. Ananya Bose', role: 'Advocate, Kolkata' },
  { tone: 'ink', quote: 'One clear diary for the whole practice means no two clients penciled into the same hour.', name: 'Adv. Vikram Rao', role: 'Managing Partner, Hyderabad' },
  { tone: 'white', quote: 'A calm, professional booking page for consultations, 0% commission on Active, and payments straight to the practice account.', name: 'Adv. Neha Gupta', role: 'Advocate, Chandigarh' },
];

// Before / after — the practice's day without vs with Book A Sloth.
const OLD_WAY = [
  { icon: MessageCircle, title: 'Phone tag for every appointment', desc: 'Clients call the office to fix a time; you call back.' },
  { icon: Clock3, title: 'No-shows waste billable hours', desc: 'A missed consultation is time you cannot bill.' },
  { icon: Wallet, title: 'Chasing consultation fees', desc: 'You follow up for payment after the advice is given.' },
  { icon: Folder, title: 'Client details scattered', desc: 'Matter notes across email, calls and paper files.' },
  { icon: X, title: 'Double-booked slots', desc: 'Two clients penciled into the same hour by hand.' },
];

const NEW_WAY = [
  { icon: Share2, title: 'One private booking link', desc: 'Share it with your clients; they pick a slot, 24/7.' },
  { icon: BellRing, title: 'Automatic reminders', desc: 'WhatsApp and email reminders cut no-shows.' },
  { icon: IndianRupee, title: 'Fees collected upfront', desc: 'Consultation fee taken at booking, over UPI or card.' },
  { icon: LayoutDashboard, title: 'Every client in one place', desc: 'Consultations, history and notes in a single diary.' },
  { icon: CalendarCheck, title: 'Conflict-free diary', desc: 'Availability stays accurate — no double bookings.' },
];

// Honest trust strip — verifiable facts only. Every claim maps to real product
// behaviour: Razorpay signature-verified payments (razorpaySignature.js), prod DB
// in Mumbai (CLAUDE.md), DPDP-based Privacy policy (Privacy.jsx), 0% on Active (plans.js).
const TRUST_STRIP = [
  { icon: Lock, value: 'Razorpay', label: 'Every payment signature-verified on our servers' },
  { icon: Landmark, value: 'Hosted in India', label: 'Your practice data runs on servers in Mumbai' },
  { icon: FileText, value: 'DPDP 2023', label: 'Operated under India’s data protection law' },
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
];

const FAQ = [
  { q: 'Is Book A Sloth suitable for advocates and law firms?', a: 'Yes — for managing consultations with the clients you already work with: an online booking page, upfront fees, automatic reminders and one clear diary. It is a practice-scheduling and payment tool, not an advertising or client-acquisition channel.' },
  { q: 'Does using Book A Sloth comply with Bar Council of India rules?', a: 'Advocates are bound by the Bar Council of India’s rules on advertising and solicitation (Rule 36). Book A Sloth is a scheduling and payment tool — how you use it is your responsibility. We suggest sharing your booking link privately with clients you already represent or who approach you, rather than as public advertising, and following your Bar Council’s guidance. We do not advertise your services on your behalf.' },
  { q: 'Can clients book consultations online?', a: 'Yes. A client opens your booking link, chooses a consultation type, picks a convenient time and confirms — no calls or waiting for the office to reply.' },
  { q: 'Can I share my booking link on WhatsApp?', a: 'Yes. Your link works anywhere you choose to send it — share it privately with your clients over WhatsApp, email or your letterhead. One link handles your appointment requests.' },
  { q: 'Can I collect consultation fees online?', a: 'Yes. Collect the fee upfront through Razorpay — UPI, cards or netbanking — before the consultation. A GST invoice is generated automatically for every paid booking.' },
  { q: 'Can I offer virtual consultations?', a: 'Yes. Offer online consultations or mark a service as in-chambers — or both. The client picks the mode that suits the matter.' },
  { q: 'Is my client information kept private?', a: 'Your production data is hosted in India (Mumbai) and the platform operates under India’s DPDP Act 2023. You control what appears on your booking page and what details a client provides when booking.' },
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
    { label: 'Advocates & Law Firms', to: '/for/lawyers' },
    { label: 'Chartered Accountants', to: '/for/chartered-accountants' },
    { label: 'Consultants', to: '/for/business-consultant' },
    { label: 'Doctors', to: '/for/doctors' },
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
  const base = 'inline-flex items-center justify-center gap-2 rounded-[5px] px-6 py-3.5 text-sm font-semibold transition-all hover:no-underline';
  const styles = {
    solid: 'text-white shadow-[0_4px_14px_rgba(16,24,40,0.16)] hover:brightness-110',
    ghost: 'border-2 border-[color:var(--ca-ink)]/12 bg-white text-[color:var(--ca-ink)] hover:border-[color:var(--ca-ink)]/25',
  };
  return (
    <Link to={to} className={`${base} ${styles[variant]} ${className}`} style={variant === 'solid' ? { background: 'var(--ca-primary)' } : undefined}>
      {children}
    </Link>
  );
}

/* Floating glass card over the hero — mirrors the homepage hero. */
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

/* Practice-area editorial list row — a big faint number, a gold-accented icon +
   title, rule-separated. (Distinct from CA's checkerboard grid and Turf's dark tiles.) */
function UseCaseRow({ u, n }) {
  return (
    <Link to={START} className="group flex items-start gap-5 border-b border-black/[0.08] py-6 hover:no-underline">
      <span className="font-heading text-2xl font-extrabold leading-none tabular-nums" style={{ color: 'rgba(31,58,95,0.28)' }}>{String(n).padStart(2, '0')}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2.5">
          <u.icon size={18} style={{ color: 'var(--ca-accent)' }} />
          <h3 className="font-heading text-[16px] font-bold text-[color:var(--ca-ink)] transition-colors group-hover:text-[color:var(--ca-primary)]">{u.label}</h3>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{u.desc}</p>
      </div>
      <ArrowRight size={16} className="mt-1 shrink-0 text-neutral-300 transition-all group-hover:translate-x-0.5 group-hover:text-[color:var(--ca-primary)]" />
    </Link>
  );
}

/* Lawyers "process" — a formal vertical numbered timeline with a gold rail.
   (Distinct from CA's image + auto-advance and Turf's horizontal playbook.) */
function HowItWorks({ steps }) {
  return (
    <div className="relative mx-auto mt-14 max-w-2xl">
      <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-px" style={{ background: 'linear-gradient(180deg, transparent, rgba(198,161,91,0.6), transparent)' }} />
      <div className="space-y-10">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.1} className="relative flex gap-6">
            <span className="relative z-10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border bg-white font-heading text-lg font-extrabold" style={{ borderColor: 'rgba(198,161,91,0.5)', color: 'var(--ca-primary)' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="pt-2">
              <div className="flex items-center gap-2.5">
                <s.icon size={18} style={{ color: 'var(--ca-accent)' }} />
                <h3 className="font-heading text-lg font-bold text-[color:var(--ca-ink)]">{s.title}</h3>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* Decorative CSS pattern behind a card — grid / dots / rings / stripes, faded from
   one corner so it adds life without touching the text. */
function CardPattern({ variant = 'dots', light = true, corner = 'tr' }) {
  const c = light ? '255,255,255' : '17,17,17';
  const a = light ? 0.16 : 0.05;
  const bg = {
    dots: { backgroundImage: `radial-gradient(rgba(${c},${a}) 1.2px, transparent 1.2px)`, backgroundSize: '16px 16px' },
    grid: { backgroundImage: `linear-gradient(rgba(${c},${a}) 1px, transparent 1px), linear-gradient(90deg, rgba(${c},${a}) 1px, transparent 1px)`, backgroundSize: '22px 22px' },
    rings: { backgroundImage: `repeating-radial-gradient(circle at center, rgba(${c},${a}) 0 1px, transparent 1px 16px)` },
    stripes: { backgroundImage: `repeating-linear-gradient(135deg, rgba(${c},${a}) 0 1.5px, transparent 1.5px 12px)` },
  }[variant];
  const pos = { tr: '85% 15%', br: '86% 85%', bl: '15% 85%', tl: '15% 15%' }[corner];
  const mask = `radial-gradient(circle at ${pos}, #000 0, transparent 60%)`;
  return <div aria-hidden className="pointer-events-none absolute inset-0" style={{ ...bg, maskImage: mask, WebkitMaskImage: mask }} />;
}

/* One integration list row — logo + label + note (understated, rule-separated). */
function ToolRow({ t }) {
  return (
    <div className="flex items-center gap-3.5 border-b border-black/[0.08] py-4">
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

/* Lawyers integrations — an understated, rule-separated two-column list.
   (Distinct from CA's connector diagram and Turf's bold logo grid.) */
function IntegrationHub() {
  return (
    <div className="mx-auto grid max-w-3xl gap-x-12 sm:grid-cols-2">
      {TOOLS_ALL.map((t, i) => (
        <Reveal key={t.name} delay={(i % 2) * 0.05}>
          <ToolRow t={t} />
        </Reveal>
      ))}
    </div>
  );
}

/* Smoothly-animated single-open FAQ accordion, two columns. */
function FaqAccordion() {
  const [open, setOpen] = useState(0);
  const renderItem = (f, i) => {
    const isOpen = open === i;
    return (
      <div key={f.q} className="overflow-hidden rounded-[12px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'rgba(31,58,95,0.35)' : 'rgba(17,17,17,0.08)' }}>
        <button
          type="button"
          onClick={() => setOpen(isOpen ? -1 : i)}
          aria-expanded={isOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[color:var(--ca-ink)]"
        >
          {f.q}
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'rgba(31,58,95,0.1)', color: 'var(--ca-primary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
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

export default function LawyersPage() {
  useLenis();
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  const canonical = `${SITE_URL}/for/lawyers`;
  const seo = {
    title: 'Appointment Booking Software for Advocates & Law Firms | Book A Sloth',
    description: 'Book A Sloth is appointment scheduling software for advocates and law firms in India. Let the clients you work with book consultations online — fees collected upfront, WhatsApp reminders, GST invoices, 0% commission. A practice-scheduling tool, not an advertising channel. Start free.',
    keywords: 'appointment booking software for advocates, law firm scheduling software india, book legal consultation online, lawyer appointment scheduling, advocate practice management, consultation booking for law firms',
    ogTitle: 'Your practice runs on consultations. Let Book A Sloth schedule them.',
    ogDescription: 'Clients book consultations, pay upfront and get WhatsApp reminders — automatically. A calm scheduling page for advocates and law firms in India.',
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
      serviceType: 'Appointment booking software for advocates and law firms',
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
        { '@type': 'ListItem', position: 2, name: 'For Advocates & Law Firms', item: canonical },
      ],
    },
  ];

  // Legal-gravitas palette — legacy --ca-* var names kept so shared classNames work.
  const styleVars = {
    '--ca-primary': '#1F3A5F', // deep navy (AA-safe: white text/links)
    '--ca-accent': '#A16207',  // brass/amber-700 (AA on white ~4.8:1)
    '--ca-ink': '#0F1B2D',     // near-black navy text
    '--ca-cream': '#F7F5EF',   // warm parchment section bg
    '--ca-grey': '#F3F4F6',    // light grey section bg
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
        themeColor="#1F3A5F"
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
                  <Link to={LOGIN} className="flex-1 rounded-[5px] border-2 border-black/10 py-2.5 text-center text-sm font-semibold text-[color:var(--ca-ink)] hover:no-underline">Login</Link>
                  <CtaButton to={START} className="flex-1">Start for Free <ArrowRight size={15} /></CtaButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════ 2 · HERO (legal gravitas) ═══════════════ */}
      <section className="relative overflow-hidden px-5 pb-14 pt-8 text-white sm:px-8 sm:pb-20 sm:pt-12 lg:pb-28 lg:pt-16" style={{ background: 'radial-gradient(120% 90% at 50% -10%, #234069 0%, #0F1B2D 60%)' }}>
        {/* warm brass glow */}
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(198,161,91,0.18), transparent)' }} />
        {/* faint column lines */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 96px)', maskImage: 'linear-gradient(180deg, #000, transparent 82%)', WebkitMaskImage: 'linear-gradient(180deg, #000, transparent 82%)' }} />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* LEFT */}
          <div className="text-center lg:text-left">
            <Reveal as="p" instant className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: GOLD }}>
              For advocates &amp; law firms
            </Reveal>
            <Reveal as="h1" instant className="text-[clamp(1.7rem,7vw,2.7rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.7rem] sm:leading-[1.1] lg:text-[3rem]">
              Simple appointment booking software for{' '}
              <span style={{ color: GOLD }}>advocates &amp; law firms</span>{' '}
              of modern India.
            </Reveal>
            <Reveal as="p" instant delay={0.05} className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/70 sm:mt-7 sm:text-lg lg:mx-0">
              Give the clients you already work with a simpler way to book consultations — no phone tag, confirmed slots, reminders — from one calm platform for your practice.
            </Reveal>
            <Reveal instant delay={0.1} className="mt-6 flex flex-col items-center gap-3 sm:mt-9 sm:flex-row sm:gap-5 lg:justify-start">
              <Link
                to={START}
                className="btn flex w-full items-center justify-center gap-2 rounded-[5px] px-7 py-3.5 text-sm font-semibold shadow-[0_10px_30px_-8px_rgba(198,161,91,0.6)] transition-opacity hover:opacity-90 hover:no-underline sm:w-auto"
                style={{ background: GOLD, color: 'var(--ca-ink)' }}
              >
                Create a Free Account <ArrowRight size={16} />
              </Link>
              <Link to="/demo" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:no-underline" style={{ }}>
                Book A Demo <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
            <Reveal instant delay={0.14} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:mt-9 lg:justify-start">
              {HERO_TRUST.map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-[13px] font-medium text-white/60">
                  <Check size={14} style={{ color: GOLD }} /> {t}
                </span>
              ))}
            </Reveal>
          </div>

          {/* RIGHT — mascot + floating glass cards */}
          <Reveal instant delay={0.1} className="relative hidden lg:block">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-[27rem] w-[27rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[rgba(31,58,95,0.45)] to-[rgba(198,161,91,0.22)] blur-2xl" />
            <img src={MASCOT} alt="Book A Sloth — appointment booking for advocates and law firms" loading="eager" className="relative z-10 mx-auto w-full max-w-[27rem] drop-shadow-[0_28px_46px_rgba(0,0,0,0.5)]" />
            <GlassCard icon={CalendarCheck} label="New consultation" value="Property matter · 4:30 PM" float="sloth-float" className="top-6 -left-4" />
            <GlassCard icon={Wallet} label="Fee received" value="₹3,000" accent float="sloth-float--mid" className="top-1/2 -right-6" />
            <GlassCard icon={BellRing} label="WhatsApp reminder" value="Sent · 1h before" float="sloth-float--slow" className="bottom-10 left-2" />
          </Reveal>
        </div>

        {/* Four benefits — tiles, part of the hero */}
        <div className="relative mx-auto mt-12 grid max-w-7xl gap-3 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.06}>
              <div className="group flex h-full flex-col rounded-[10px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition-colors hover:border-[#C6A15B]/40">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(198,161,91,0.16)] text-[#C6A15B] transition-colors duration-300 group-hover:bg-[#C6A15B] group-hover:text-[#1F2A1B]">
                    <b.icon size={18} />
                  </span>
                  <div className="font-heading text-sm font-bold text-white">{b.title}</div>
                </div>
                <p className="mt-2 text-xs leading-snug text-white/70">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 3 · PRACTICE-AREA USE CASES ═══════════════ */}
      <section id="usecases" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Built around the way <span style={{ color: 'var(--ca-primary)' }}>a legal practice runs.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">
              From consultations to document review and litigation strategy, manage every appointment in one place.
            </Reveal>
          </div>
          <div className="mt-10 grid gap-x-14 sm:grid-cols-2">
            {USE_CASES.map((u, i) => (
              <Reveal key={u.label} delay={(i % 2) * 0.05}>
                <UseCaseRow u={u} n={i + 1} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4 · HOW IT WORKS ═══════════════ */}
      <section id="how" className="px-5 pb-10 pt-20 sm:px-8 lg:pb-14 lg:pt-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              How Book A Sloth helps <span style={{ color: 'var(--ca-primary)' }}>advocates &amp; law firms</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              From &ldquo;when are you free?&rdquo; to a confirmed consultation — no phone tag.
            </Reveal>
          </div>

          <HowItWorks steps={STEPS} />
        </div>
      </section>

      {/* ═══════════════ 5 · INTEGRATIONS HUB ═══════════════ */}
      <section id="features" className="px-5 pb-20 pt-6 sm:px-8 lg:pb-28 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Works with the tools you already use.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Connect your calendar, payments and WhatsApp — Book A Sloth fits your workflow, no rewiring.
            </Reveal>
          </div>
          <div className="mt-12"><IntegrationHub /></div>
          <Reveal delay={0.1} className="mt-14 text-center">
            <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ca-primary)' }}>
              Explore All Features <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 6 · IMPACT (bento) ═══════════════ */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(17,17,17,0.045) 1px, transparent 1px)', backgroundSize: '22px 22px', maskImage: 'radial-gradient(circle at 50% 0%, #000, transparent 72%)', WebkitMaskImage: 'radial-gradient(circle at 50% 0%, #000, transparent 72%)' }} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Real impact for <span style={{ color: 'var(--ca-primary)' }}>a modern law practice.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              Less time on admin, more time on your matters — and every rupee you earn stays yours.
            </Reveal>
          </div>

          {/* 2×2 gold-ruled stat cards */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {[
              { v: '24/7', l: 'Bookings, day or night', note: 'Your booking page never sleeps — clients reserve consultations any time.' },
              { v: '100%', l: 'Kept on Sloth Active', note: '0% commission — every rupee you earn stays yours.' },
              { v: '₹0', l: 'To get started', note: 'Free forever plan — no card, no lock-in.' },
              { v: 'GST', l: 'Invoices, automatic', note: 'A tax invoice generated for every paid booking.' },
            ].map((s, i) => (
              <Reveal key={s.l} delay={i * 0.06}>
                <div className="relative h-full overflow-hidden rounded-[16px] border border-black/[0.08] bg-white p-8">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--ca-primary), #C6A15B)' }} />
                  <div className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl" style={{ color: 'var(--ca-primary)' }}>{s.v}</div>
                  <div className="mt-3 font-heading text-base font-bold text-[color:var(--ca-ink)]">{s.l}</div>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{s.note}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* community CTA — formal navy bar */}
          <Reveal delay={0.1} className="mt-4">
            <a href="https://whatsapp.com/channel/0029Vb8ZyHP6GcG6LRA2K81Y" target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between gap-4 rounded-[16px] p-7 text-white hover:no-underline" style={{ background: 'var(--ca-primary)' }}>
              <div>
                <div className="font-heading text-lg font-extrabold sm:text-xl">Join the community</div>
                <p className="mt-1 text-sm text-white/70">Connect with fellow professionals growing on Book A Sloth.</p>
              </div>
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-1" style={{ background: '#C6A15B', color: 'var(--ca-ink)' }}>
                <ArrowRight size={20} />
              </span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 7 · TESTIMONIALS ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" delay={0.05} className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Trusted by <span style={{ color: 'var(--ca-primary)' }}>advocates &amp; firms</span> across India.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Hear how practices book more consultations and cut the admin with Book A Sloth.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {CA_TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 2) * 0.06}>
                <figure className="relative flex h-full flex-col rounded-[16px] border border-black/[0.08] bg-white p-7">
                  <span aria-hidden className="font-heading text-5xl leading-none" style={{ color: 'rgba(198,161,91,0.55)' }}>&ldquo;</span>
                  <blockquote className="-mt-3 text-[15px] leading-relaxed text-neutral-700">{t.quote}</blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-black/[0.06] pt-5">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'var(--ca-primary)' }}>{t.name.replace('Adv. ', '').charAt(0)}</span>
                    <div>
                      <div className="text-sm font-bold text-[color:var(--ca-ink)]">{t.name}</div>
                      <div className="text-xs text-neutral-500">{t.role}</div>
                    </div>
                    <span className="ml-auto flex gap-0.5">{[0, 1, 2, 3, 4].map((s) => <Star key={s} size={12} style={{ color: '#C6A15B', fill: '#C6A15B' }} />)}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 8 · OLD WAY vs BOOK A SLOTH ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" delay={0.05} className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              The old way vs <span style={{ color: 'var(--ca-primary)' }}>a calmer way to run your practice.</span>
            </Reveal>
          </div>

          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[16px] border border-black/[0.08] bg-white shadow-[0_14px_40px_-24px_rgba(17,17,17,0.25)]">
            {/* header row */}
            <div className="grid grid-cols-2 border-b-2" style={{ borderColor: 'var(--ca-primary)' }}>
              <div className="flex items-center gap-2 px-5 py-4 sm:px-6"><X size={16} className="text-[#DC2626]" /><span className="font-heading text-sm font-bold text-neutral-500">The old way</span></div>
              <div className="flex items-center gap-2 border-l border-black/[0.06] px-5 py-4 sm:px-6" style={{ background: 'rgba(31,58,95,0.04)' }}><Check size={16} style={{ color: 'var(--ca-primary)' }} /><span className="font-heading text-sm font-bold" style={{ color: 'var(--ca-ink)' }}>With Book A Sloth</span></div>
            </div>
            {OLD_WAY.map((o, i) => (
              <Reveal key={o.title} className={`grid grid-cols-2 ${i % 2 ? '' : 'bg-black/[0.015]'}`}>
                <div className="border-t border-black/[0.06] px-5 py-4 sm:px-6">
                  <p className="text-[14px] font-semibold text-neutral-700">{o.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-500">{o.desc}</p>
                </div>
                <div className="border-l border-t border-black/[0.06] px-5 py-4 sm:px-6" style={{ background: 'rgba(31,58,95,0.03)' }}>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--ca-ink)' }}>{NEW_WAY[i]?.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-600">{NEW_WAY[i]?.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 9 · TRUST STRIP (honest, verifiable) ═══════════════ */}
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

      {/* ═══════════════ 10 · PRICING ═══════════════ */}
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" delay={0.05} className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Start small. <span style={{ color: 'var(--ca-primary)' }}>Grow as your practice does.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-4 text-base text-neutral-500">
              Choose a plan that fits your practice today. Upgrade when you need more.
            </Reveal>
          </div>

          {/* billing toggle */}
          <Reveal delay={0.1} className="mt-8 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setYearly(false)} className={`text-sm font-semibold transition-colors ${!yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>Monthly</button>
            <button type="button" role="switch" aria-checked={yearly} aria-label="Toggle monthly or yearly billing" onClick={() => setYearly((v) => !v)} className="relative h-6 w-11 rounded-full transition-colors" style={{ background: yearly ? 'var(--ca-primary)' : '#d4d4d4', minHeight: 0 }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: yearly ? '22px' : '2px' }} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>
              Yearly <span className="ml-1 rounded-full bg-[#1F3A5F]/12 px-2 py-0.5 text-xs font-bold text-[#1F3A5F]">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>
            </span>
          </Reveal>

          <div className="relative mx-auto mt-10 max-w-3xl">
            {/* faint grid backdrop */}
            <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(17,17,17,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.05) 1px, transparent 1px)', backgroundSize: '38px 38px', maskImage: 'radial-gradient(circle at center, black, transparent 78%)', WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 78%)' }} />
            <div className="relative grid gap-5 sm:grid-cols-2 sm:gap-6">
              {/* Sloth (free) */}
              <Reveal>
                <div className="flex h-full flex-col rounded-[18px] border border-black/[0.08] bg-white p-7">
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
                <div className="relative flex h-full flex-col overflow-hidden rounded-[18px] border-2 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(16,24,40,0.14)]" style={{ borderColor: 'var(--ca-primary)' }}>
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, var(--ca-primary), #C6A15B)' }} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="font-heading text-lg font-bold">{PREMIUM_PLAN.name}</div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--ca-ink)]" style={{ background: 'rgba(198,161,91,0.25)' }}>Recommended</span>
                    </div>
                    {yearly && <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-[color:var(--ca-ink)]" style={{ background: '#C6A15B' }}>Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>}
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

      {/* ═══════════════ 11 · ABOUT ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* LEFT — mascot */}
          <Reveal className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:mx-0">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1F3A5F]/15 blur-3xl" />
            <img src={MASCOT} alt="Book A Sloth mascot" loading="lazy" className="relative z-10 mx-auto w-full max-w-[22rem] drop-shadow-[0_24px_32px_rgba(17,17,17,0.16)]" />
          </Reveal>

          {/* RIGHT — text */}
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <Reveal as="h2" delay={0.05} className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Small practices deserve better tools.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-5 text-base leading-relaxed text-neutral-600">
              Book A Sloth was built to make appointment-based practices easier to run. Instead of stitching together calendars, WhatsApp messages, paper diaries and payment tools, professionals can manage their client consultations from one calm platform.
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

      {/* ═══════════════ 12 · FAQ ═══════════════ */}
      <section id="faq" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="text-center font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Questions? <span style={{ color: 'var(--ca-primary)' }}>We&apos;ve got answers.</span>
          </Reveal>
          <div className="mt-12"><FaqAccordion /></div>
        </div>
      </section>

      {/* ═══════════════ 13 · FINAL CTA (legal gravitas) ═══════════════ */}
      <section className="relative overflow-hidden px-5 py-24 text-center sm:px-8" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #234069 0%, #0F1B2D 60%)' }}>
        <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-56 w-[42rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(198,161,91,0.18), transparent)' }} />
        <div className="relative mx-auto max-w-2xl">
          <Reveal className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(198,161,91,0.16)' }}>
            <Zap size={26} style={{ color: GOLD }} />
          </Reveal>
          <Reveal as="h2" delay={0.06} className="mt-6 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Spend less time scheduling. <span style={{ color: GOLD }}>Spend more time on your matters.</span>
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-lg text-base text-white/60">
            Set up your booking page today and give your clients a simpler way to meet with you.
          </Reveal>
          <Reveal delay={0.14} className="mt-8">
            <Link to={START} className="inline-flex items-center justify-center gap-2 rounded-[5px] px-8 py-4 text-sm font-semibold shadow-[0_10px_30px_-8px_rgba(198,161,91,0.6)] transition-opacity hover:opacity-90 hover:no-underline" style={{ background: GOLD, color: 'var(--ca-ink)' }}>
              Start for Free <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal as="p" delay={0.18} className="mt-4 text-xs text-white/60">No credit card required</Reveal>
        </div>
      </section>

      {/* ═══════════════ 14 · FOOTER ═══════════════ */}
      <footer className="border-t border-black/5 px-5 py-16 sm:px-8" style={{ background: '#ffffff' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div>
              <div className="font-heading text-lg font-extrabold text-[color:var(--ca-ink)]">Book A Sloth</div>
              <p className="mt-2 max-w-xs text-sm text-neutral-500">The simpler way to manage consultations.</p>
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
            <p className="text-xs text-neutral-500">Made for India&apos;s advocates &amp; law firms</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

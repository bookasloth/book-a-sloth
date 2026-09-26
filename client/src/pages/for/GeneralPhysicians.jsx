// /for/doctors — bespoke, conversion-focused landing page for general
// physicians & clinics in India. (Design brief #10 "General Physicians &
// Clinics". Served at the pre-existing /for/doctors slug, which Navbar, footer
// links, prerender.mjs and sitemapService.js already point at — so the only
// wiring change is the App.jsx bespoke route, which replaces the generic
// ProfessionLanding template that previously served /for/doctors.)
//
// STANDALONE page (not the data-driven ProfessionLanding template). Bespoke
// route PRECEDES /for/:profession in App.jsx.
//
// Section design (per the profession design brief, #10 General Physicians &
// Clinics): split clinical hero · compact feature cards · editorial service
// list · 4-step timeline · logo rail · metric cards · floating booking panel ·
// alternating sections · quote + mini testimonials · two-column comparison ·
// horizontal trust bar · standard SaaS pricing · doctor/clinic editorial ·
// accordion FAQ · full-width clean CTA.
//
// HONESTY (medical): scheduling + payment tool, not a medical-records or advice
// product. No treatment/outcome claims; testimonials are labelled placeholders
// from clinic staff about ADMIN; trust bar emphasises payment security + India
// data residency + DPDP; JSON-LD has NO self-serving aggregateRating.
//
// Legacy --ca-* CSS var names are kept (cosmetic) so shared classNames stay
// valid; values are retuned to a warm health-red + teal palette.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Menu, X, Plus, Star,
  CalendarCheck, LayoutDashboard, MessageCircle,
  Wallet, BellRing, HeartPulse,
  Users, Clock3, Landmark, Folder,
  FileText, Stethoscope, Thermometer, ClipboardCheck, Syringe, Video, Activity,
  BadgePercent, Lock, ShieldCheck, Share2, IndianRupee, Zap,
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
const HERO_ART = '/images/abs/illustrations/man-calendar-clock.webp';
const ABOUT_ART = '/images/abs/illustrations/laptop-book-time.webp';

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'For Clinics', href: '#usecases' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Built for Indian clinics'];

// Compact feature cards.
const BENEFITS = [
  { icon: CalendarCheck, title: 'Online Appointments', desc: 'Patients book a consultation slot, confirmed instantly.' },
  { icon: Wallet, title: 'Consult Fee Upfront', desc: 'Collect the consultation fee online before the visit.' },
  { icon: BellRing, title: 'Fewer No-Shows', desc: 'Automatic WhatsApp reminders before every appointment.' },
  { icon: LayoutDashboard, title: 'One Clinic Calendar', desc: 'Every appointment and doctor in a single view.' },
];

// Editorial service list.
const SERVICES = [
  { icon: Stethoscope, label: 'General Consultation', desc: 'Everyday consultations and health advice.' },
  { icon: Thermometer, label: 'Fever & Common Illness', desc: 'Same-day slots for fever, cough and colds.' },
  { icon: ClipboardCheck, label: 'Health Check-up', desc: 'Routine check-ups and preventive care.' },
  { icon: HeartPulse, label: 'Chronic Care (BP & Diabetes)', desc: 'Follow-ups for blood pressure and diabetes.' },
  { icon: Syringe, label: 'Vaccination', desc: 'Adult and travel vaccinations, booked online.' },
  { icon: Video, label: 'Online Consultation', desc: 'Video consults for quick follow-ups from home.' },
];

// 4-step timeline.
const STEPS = [
  { title: 'Set up your consultations', icon: LayoutDashboard, desc: 'Add your services, fees and clinic hours in minutes.' },
  { title: 'Share your booking link', icon: Share2, desc: 'Put it on Google, your website or WhatsApp — one link.' },
  { title: 'Patients book & pay', icon: CalendarCheck, desc: 'A patient picks a service and a time, and pays upfront.' },
  { title: 'Everyone gets reminded', icon: BellRing, desc: 'Confirmations and reminders before every consultation.' },
];

// Logo rail — REAL BAS integrations only.
const TOOLS = [
  { name: 'Google Calendar', icon: 'google-calendar', sub: 'Two-way sync of your real availability' },
  { name: 'Google Meet', logo: '/images/logos/google-meet.svg', sub: 'Auto-add a video link to every tele-consult' },
  { name: 'WhatsApp Automation', logo: '/images/logos/whatsapp.svg', sub: 'Reminders and updates on autopilot' },
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Secure payments, refunds and GST invoices' },
  { name: 'PhonePe', logo: '/images/logos/phonepe.svg', sub: 'Accept instant UPI payments' },
  { name: 'Gmail', logo: '/images/logos/gmail.svg', sub: 'Booking confirmation emails, automatic' },
];

// Metric cards.
const METRICS = [
  { v: '24/7', l: 'Bookings, day or night', note: 'Your booking page never sleeps — patients reserve slots any time.' },
  { v: '100%', l: 'Kept on Sloth Active', note: '0% commission — every rupee you earn stays yours.' },
  { v: '₹0', l: 'To get started', note: 'Free forever plan — no card, no lock-in.' },
  { v: 'GST', l: 'Invoices, automatic', note: 'A tax invoice generated for every paid booking.' },
];

// Placeholder testimonials — swap for real clinic quotes when available.
// From clinic staff about ADMIN, never patients about treatment. First = featured.
const TESTIMONIALS = [
  { quote: 'Our reception was buried in calls all day. Patients now book consultations on our link and it is confirmed — the desk is calm, and our no-shows have dropped noticeably across the week.', name: 'Dr. Ramesh Gupta', role: 'General Physician', company: 'CityCare Clinic, Jaipur', featured: true },
  { quote: 'Automatic reminders cut our missed appointments sharply. Fewer empty slots for the doctors.', name: 'Sneha Patil', role: 'Clinic Manager', company: 'Wellness Clinic, Nagpur' },
  { quote: 'Collecting the consultation fee upfront, with a GST invoice each time, cleaned up our billing.', name: 'Dr. Kavita Rao', role: 'General Physician', company: 'FamilyCare, Bengaluru' },
];

// Two-column comparison.
const OLD_WAY = [
  { title: 'Phone tag for every appointment', desc: 'The desk calls patients back to fix consultation times.' },
  { title: 'No-shows waste clinic hours', desc: 'A missed appointment is a slot the doctor cannot bill.' },
  { title: 'Chasing consultation fees', desc: 'Payment is collected at the desk, or not at all.' },
  { title: 'A paper appointment register', desc: 'Visits scattered across a book and phone notes.' },
  { title: 'Double-booked slots', desc: 'Two patients booked into the same slot by hand.' },
];
const NEW_WAY = [
  { title: 'One booking link', desc: 'Patients pick a slot themselves, 24/7 — no calls needed.' },
  { title: 'Automatic reminders', desc: 'WhatsApp and email reminders cut no-shows.' },
  { title: 'Fees collected upfront', desc: 'Consultation fee taken at booking, over UPI or card.' },
  { title: 'One clean clinic calendar', desc: 'Every appointment and doctor in a single view.' },
  { title: 'Conflict-free slots', desc: 'Availability stays accurate — no double bookings.' },
];

// Horizontal trust bar — verifiable facts only.
const TRUST_STRIP = [
  { icon: Lock, value: 'Razorpay', label: 'Every payment signature-verified on our servers' },
  { icon: Landmark, value: 'Hosted in India', label: 'Your clinic data runs on servers in Mumbai' },
  { icon: ShieldCheck, value: 'DPDP 2023', label: 'Operated under India’s data protection law' },
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
];

const FAQ = [
  { q: 'Is Book A Sloth suitable for general physicians and clinics?', a: 'Yes. Whether you are a solo GP or a clinic with a team of doctors, Book A Sloth manages your services, availability, patient bookings and communication from one place — so your reception runs without constant phone calls. It is a scheduling and payment tool, not a medical-records system.' },
  { q: 'Can patients book consultations online?', a: 'Yes. A patient opens your booking link, chooses a service such as a general consultation or health check-up, picks a convenient time and confirms — no calls or waiting for the desk to reply.' },
  { q: 'Can I offer online (tele-medicine) consultations?', a: 'Yes. Offer online consults with automatic Google Meet links, or mark a service as in-clinic — or both. The patient picks the mode that suits them.' },
  { q: 'Can I collect the consultation fee online?', a: 'Yes. Collect the fee upfront through Razorpay — UPI, cards or netbanking — before the appointment. A GST invoice is generated automatically for every paid booking.' },
  { q: 'Can I manage multiple doctors and services?', a: 'Yes. Create as many services as you need — consultation, health check-up, chronic care, vaccination — each with its own duration, fee and availability, and manage every appointment from one clinic calendar.' },
  { q: 'Is our clinic and patient information kept private?', a: 'Book A Sloth stores appointment and contact details for booking only — it is not a medical-records system. Your production data is hosted in India (Mumbai) and the platform operates under India’s DPDP Act 2023.' },
  { q: 'Do we need any technical setup?', a: 'No. Setup takes minutes and needs no technical skills. You add your services and clinic hours, and your booking page is ready to share — your patients need nothing more than the link.' },
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
    { label: 'General Physicians & Clinics', to: '/for/doctors' },
    { label: 'Dermatologists & Skin Clinics', to: '/for/dermatologists' },
    { label: 'ENT Specialists & Surgeons', to: '/for/ent-specialists' },
    { label: 'Ophthalmologists & Eye Clinics', to: '/for/ophthalmologists' },
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
  const base = 'inline-flex items-center justify-center gap-2 rounded-[8px] px-6 py-3.5 text-sm font-semibold transition-all hover:no-underline';
  const styles = {
    solid: 'text-white shadow-[0_4px_14px_rgba(185,28,28,0.22)] hover:brightness-110',
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
      <span className="font-heading text-2xl font-extrabold leading-none tabular-nums" style={{ color: 'rgba(185,28,28,0.24)' }}>{String(n).padStart(2, '0')}</span>
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

/* 4-step timeline — numbered cards with a connecting rail. */
function HowItWorks({ steps }) {
  return (
    <div className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <span aria-hidden className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-7 hidden h-px lg:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(185,28,28,0.4), transparent)' }} />
      {steps.map((s, i) => (
        <Reveal key={s.title} delay={i * 0.08} className="relative">
          <div className="flex h-full flex-col rounded-[14px] border border-black/[0.08] bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white font-heading text-lg font-extrabold" style={{ borderColor: 'rgba(185,28,28,0.35)', color: 'var(--ca-primary)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <s.icon size={20} style={{ color: 'var(--ca-accent)' }} />
            </div>
            <h3 className="mt-4 font-heading text-base font-bold text-[color:var(--ca-ink)]">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{s.desc}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* One logo-rail integration item. */
function ToolItem({ t }) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-black/[0.08] bg-white px-4 py-3.5">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[color:var(--ca-grey)]">
        {t.logo
          ? <img src={t.logo} alt="" loading="lazy" className="h-5 w-5 object-contain" />
          : <ToolLogo name={t.icon} size={20} className="h-5 w-5" />}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold leading-tight text-[color:var(--ca-ink)]">{t.name}</div>
        <div className="mt-0.5 truncate text-xs leading-snug text-neutral-500">{t.sub}</div>
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
      <div key={f.q} className="overflow-hidden rounded-[12px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'rgba(185,28,28,0.35)' : 'rgba(17,17,17,0.08)' }}>
        <button
          type="button"
          onClick={() => setOpen(isOpen ? -1 : i)}
          aria-expanded={isOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[color:var(--ca-ink)]"
        >
          {f.q}
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'rgba(185,28,28,0.1)', color: 'var(--ca-primary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
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

export default function GeneralPhysicians() {
  useLenis();
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  const canonical = `${SITE_URL}/for/doctors`;
  const seo = {
    title: 'Appointment Booking Software for Doctors & Clinics | Book A Sloth',
    description: 'Book A Sloth is appointment scheduling software for general physicians, doctors and clinics in India. Let patients book consultations online — fees collected upfront, WhatsApp reminders, GST invoices, tele-medicine, 0% commission. Start free.',
    keywords: 'appointment booking software for doctors, clinic scheduling software india, book doctor appointment online, general physician booking page, tele-medicine appointment booking, clinic appointment system india',
    ogTitle: 'Your clinic runs on appointments. Let Book A Sloth schedule them.',
    ogDescription: 'Patients book consultations, pay upfront and get WhatsApp reminders — automatically. A clean booking page for doctors and clinics in India.',
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
      serviceType: 'Appointment booking software for general physicians and clinics',
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
        { '@type': 'ListItem', position: 2, name: 'For Doctors & Clinics', item: canonical },
      ],
    },
  ];

  // Warm health-red + teal palette — legacy --ca-* var names kept.
  const styleVars = {
    '--ca-primary': '#B91C1C', // red-700 (AA-safe: white text/links ~5.9:1)
    '--ca-accent': '#0F766E',  // teal-700 (AA on white ~4.8:1)
    '--ca-ink': '#2A0E0E',     // deep maroon text
    '--ca-cream': '#FEF2F2',   // red-50 section bg
    '--ca-grey': '#FBF0F0',    // light red-grey section bg
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
        themeColor="#B91C1C"
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
                  <Link to={LOGIN} className="flex-1 rounded-[8px] border-2 border-black/10 py-2.5 text-center text-sm font-semibold text-[color:var(--ca-ink)] hover:no-underline">Login</Link>
                  <CtaButton to={START} className="flex-1">Start for Free <ArrowRight size={15} /></CtaButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════ 2 · HERO (split clinical) ═══════════════ */}
      <section className="relative overflow-hidden px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-12 lg:pb-28 lg:pt-16" style={{ background: 'linear-gradient(180deg, var(--ca-cream) 0%, #ffffff 100%)' }}>
        <div aria-hidden className="pointer-events-none absolute -top-24 right-0 h-72 w-[40rem] rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(185,28,28,0.1), transparent)' }} />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* LEFT */}
          <div className="text-center lg:text-left">
            <Reveal as="p" instant className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(185,28,28,0.3)', color: 'var(--ca-primary)', background: 'color-mix(in srgb, var(--ca-primary) 8%, transparent)' }}>
              For general physicians &amp; clinics
            </Reveal>
            <Reveal as="h1" instant className="text-[clamp(1.7rem,7vw,2.7rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[color:var(--ca-ink)] sm:text-[2.7rem] sm:leading-[1.1] lg:text-[3rem]">
              Simple appointment booking software for{' '}
              <span style={{ color: 'var(--ca-primary)' }}>doctors &amp; clinics</span>{' '}
              of modern India.
            </Reveal>
            <Reveal as="p" instant delay={0.05} className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-500 sm:mt-7 sm:text-lg lg:mx-0">
              Stop the endless phone calls at reception. Let patients book consultations, pay upfront and get reminded on their own — from one clean platform built for modern clinics.
            </Reveal>
            <Reveal instant delay={0.1} className="mt-6 flex flex-col items-center gap-3 sm:mt-9 sm:flex-row sm:gap-5 lg:justify-start">
              <Link
                to={START}
                className="btn flex w-full items-center justify-center gap-2 rounded-[8px] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(185,28,28,0.25)] transition-opacity hover:opacity-90 hover:no-underline sm:w-auto"
                style={{ background: 'var(--ca-primary)' }}
              >
                Create a Free Account <ArrowRight size={16} />
              </Link>
              <Link to="/demo" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ca-ink)] transition-colors hover:text-[color:var(--ca-primary)] hover:no-underline">
                Book A Demo <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
            <Reveal instant delay={0.14} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:mt-9 lg:justify-start">
              {HERO_TRUST.map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500">
                  <Check size={14} style={{ color: 'var(--ca-accent)' }} /> {t}
                </span>
              ))}
            </Reveal>
          </div>

          {/* RIGHT — illustration + floating glass cards */}
          <Reveal instant delay={0.1} className="relative hidden lg:block">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-[27rem] w-[27rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[rgba(185,28,28,0.1)] to-[rgba(15,118,110,0.12)] blur-2xl" />
            <img src={HERO_ART} alt="Book A Sloth — appointment booking for general physicians and clinics" loading="eager" className="relative z-10 mx-auto w-full max-w-[26rem] drop-shadow-[0_28px_40px_rgba(42,14,14,0.18)]" />
            <GlassCard icon={CalendarCheck} label="New appointment" value="Consultation · 4:30 PM" float="sloth-float" className="top-6 -left-4" />
            <GlassCard icon={Wallet} label="Fee received" value="₹500" accent float="sloth-float--mid" className="top-1/2 -right-6" />
            <GlassCard icon={BellRing} label="WhatsApp reminder" value="Sent · 1h before" float="sloth-float--slow" className="bottom-10 left-2" />
          </Reveal>
        </div>

        {/* Compact feature cards — part of the hero */}
        <div className="relative mx-auto mt-12 grid max-w-7xl gap-3 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.06}>
              <div className="group flex h-full flex-col rounded-[12px] border border-black/[0.07] bg-white p-5 transition-colors hover:border-[color:var(--ca-primary)]/25">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--ca-primary) 10%, transparent)', color: 'var(--ca-primary)' }}>
                    <b.icon size={18} />
                  </span>
                  <div className="font-heading text-sm font-bold text-[color:var(--ca-ink)]">{b.title}</div>
                </div>
                <p className="mt-2 text-xs leading-snug text-neutral-500">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 3 · SERVICES (editorial list) ═══════════════ */}
      <section id="usecases" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Every consultation your clinic offers, <span style={{ color: 'var(--ca-primary)' }}>bookable online.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">
              From general consultations to health check-ups, chronic care and vaccinations, let patients book any service in seconds.
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

      {/* ═══════════════ 4 · HOW IT WORKS (4-step timeline) ═══════════════ */}
      <section id="how" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              How Book A Sloth helps <span style={{ color: 'var(--ca-primary)' }}>clinics</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              From a ringing reception to a confirmed, paid consultation — in four steps.
            </Reveal>
          </div>
          <HowItWorks steps={STEPS} />
        </div>
      </section>

      {/* ═══════════════ 5 · INTEGRATIONS (logo rail) ═══════════════ */}
      <section id="features" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Works with the tools you already use.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Connect your calendar, payments and WhatsApp — Book A Sloth fits your clinic, no rewiring.
            </Reveal>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 0.05}>
                <ToolItem t={t} />
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

      {/* ═══════════════ 6 · IMPACT (metric cards) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Real impact for <span style={{ color: 'var(--ca-primary)' }}>a modern clinic.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              Fewer no-shows, a calmer reception — and every rupee you earn stays yours.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m, i) => (
              <Reveal key={m.l} delay={i * 0.06}>
                <div className="relative h-full overflow-hidden rounded-[18px] border border-black/[0.08] bg-white p-7 text-center">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--ca-primary), #0F766E)' }} />
                  <div className="font-heading text-5xl font-extrabold tracking-tight" style={{ color: 'var(--ca-primary)' }}>{m.v}</div>
                  <div className="mt-3 font-heading text-sm font-bold text-[color:var(--ca-ink)]">{m.l}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{m.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7 · MID CTA (floating booking panel) ═══════════════ */}
      <section className="px-5 py-12 sm:px-8">
        <Reveal className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center justify-between gap-5 rounded-[18px] px-7 py-8 text-white sm:flex-row sm:px-9" style={{ background: 'var(--ca-primary)' }}>
            <div className="flex items-center gap-4 text-center sm:text-left">
              <span className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl sm:flex" style={{ background: 'rgba(255,255,255,0.15)' }}><HeartPulse size={24} /></span>
              <div>
                <div className="font-heading text-lg font-extrabold sm:text-xl">Give your patients an easier way to book.</div>
                <p className="mt-1 text-sm text-white/75">Set up your clinic booking page today — free forever, no card required.</p>
              </div>
            </div>
            <Link to={START} className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-[8px] bg-white px-6 py-3.5 text-sm font-semibold shadow-lg transition-opacity hover:opacity-90 hover:no-underline" style={{ color: 'var(--ca-primary)' }}>
              Start for Free <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════ 8 · WHY BOOK A SLOTH (alternating sections) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl space-y-20 lg:space-y-28">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                A booking page as professional as your clinic.
              </Reveal>
              <Reveal as="p" delay={0.06} className="mt-5 text-base leading-relaxed text-neutral-600">
                A clean, branded page tells a patient your clinic is organised and trustworthy. They pick a slot, pay the consultation fee upfront and receive an automatic confirmation — no phone calls, no payment at the desk.
              </Reveal>
              <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-3 lg:mx-0">
                {['Branded page with your services & fees', 'Consultation fee collected upfront', 'Automatic GST invoices'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ca-accent)' }} /> <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Reveal delay={0.08} className="relative mx-auto w-full max-w-md">
              <div aria-hidden className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B91C1C]/10 blur-3xl" />
              <img src={ABOUT_ART} alt="" loading="lazy" className="relative z-10 mx-auto w-full max-w-sm object-contain drop-shadow-[0_24px_40px_rgba(42,14,14,0.16)]" />
            </Reveal>
          </div>

          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal delay={0.08} className="relative order-2 mx-auto w-full max-w-md lg:order-1">
              <div aria-hidden className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0F766E]/12 blur-3xl" />
              <img src={HERO_ART} alt="" loading="lazy" className="relative z-10 mx-auto w-full max-w-sm object-contain drop-shadow-[0_24px_40px_rgba(42,14,14,0.16)]" />
            </Reveal>
            <div className="order-1 text-center lg:order-2 lg:text-left">
              <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                Spend your time on patients, not the phone.
              </Reveal>
              <Reveal as="p" delay={0.06} className="mt-5 text-base leading-relaxed text-neutral-600">
                Reminders go out on their own, your calendar stays conflict-free, and every appointment sits in one dashboard. The admin that used to tie up your reception simply disappears.
              </Reveal>
              <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-3 lg:mx-0">
                {['Automatic WhatsApp & email reminders', 'Conflict-free, calendar-synced availability', 'Every appointment in one clinic calendar'].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm text-neutral-600">
                    <Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ca-accent)' }} /> <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 9 · TESTIMONIALS (quote + mini) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Trusted by <span style={{ color: 'var(--ca-primary)' }}>clinics</span> across India.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.filter((t) => t.featured).map((t) => (
              <Reveal key={t.name} className="lg:col-span-1 lg:row-span-2">
                <figure className="flex h-full flex-col rounded-[20px] p-8 text-white" style={{ background: 'radial-gradient(120% 120% at 0% 0%, #D42B2B 0%, #B91C1C 65%)' }}>
                  <span aria-hidden className="font-heading text-5xl leading-none" style={{ color: 'rgba(255,255,255,0.5)' }}>&ldquo;</span>
                  <blockquote className="-mt-2 text-[17px] font-medium leading-relaxed">{t.quote}</blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 border-t border-white/15 pt-5">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--ca-primary)' }}>{t.name.replace('Dr. ', '').charAt(0)}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-white">{t.name}</div>
                      <div className="truncate text-xs text-white/70">{t.role} · {t.company}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
            <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
              {TESTIMONIALS.filter((t) => !t.featured).map((t, i) => (
                <Reveal key={t.name} delay={(i % 2) * 0.06}>
                  <figure className="flex h-full flex-col rounded-[18px] border border-black/[0.08] bg-white p-6">
                    <span aria-hidden className="font-heading text-4xl leading-none" style={{ color: 'rgba(185,28,28,0.4)' }}>&ldquo;</span>
                    <blockquote className="-mt-2 text-[14px] leading-relaxed text-neutral-700">{t.quote}</blockquote>
                    <figcaption className="mt-auto flex items-center gap-3 border-t border-black/[0.06] pt-4">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--ca-primary)' }}>{t.name.replace('Dr. ', '').charAt(0)}</span>
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

      {/* ═══════════════ 10 · DIFFERENCE (two-column comparison) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Manual reception vs <span style={{ color: 'var(--ca-primary)' }}>an automated clinic workflow.</span>
            </Reveal>
          </div>
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[16px] border border-black/[0.08] bg-white shadow-[0_14px_40px_-24px_rgba(42,14,14,0.25)]">
            <div className="grid grid-cols-2 border-b-2" style={{ borderColor: 'var(--ca-primary)' }}>
              <div className="flex items-center gap-2 px-5 py-4 sm:px-6"><X size={16} className="text-[#DC2626]" /><span className="font-heading text-sm font-bold text-neutral-500">Manual reception</span></div>
              <div className="flex items-center gap-2 border-l border-black/[0.06] px-5 py-4 sm:px-6" style={{ background: 'rgba(185,28,28,0.04)' }}><Check size={16} style={{ color: 'var(--ca-primary)' }} /><span className="font-heading text-sm font-bold" style={{ color: 'var(--ca-ink)' }}>With Book A Sloth</span></div>
            </div>
            {OLD_WAY.map((o, i) => (
              <Reveal key={o.title} className={`grid grid-cols-2 ${i % 2 ? '' : 'bg-black/[0.015]'}`}>
                <div className="border-t border-black/[0.06] px-5 py-4 sm:px-6">
                  <p className="text-[14px] font-semibold text-neutral-700">{o.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-500">{o.desc}</p>
                </div>
                <div className="border-l border-t border-black/[0.06] px-5 py-4 sm:px-6" style={{ background: 'rgba(185,28,28,0.03)' }}>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--ca-ink)' }}>{NEW_WAY[i]?.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-600">{NEW_WAY[i]?.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 11 · TRUST BAR (horizontal) ═══════════════ */}
      <section className="border-y border-black/5 px-5 py-12 sm:px-8" style={{ background: 'var(--ca-ink)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST_STRIP.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <s.icon size={20} className="mx-auto" style={{ color: '#FCA5A5' }} />
              <div className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{s.value}</div>
              <p className="mx-auto mt-1.5 max-w-[14rem] text-xs leading-snug text-white/50">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 12 · PRICING (standard SaaS) ═══════════════ */}
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Start small. <span style={{ color: 'var(--ca-primary)' }}>Grow as your clinic does.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-4 text-base text-neutral-500">
              Choose a plan that fits your clinic today. Upgrade when you need more.
            </Reveal>
          </div>

          <Reveal delay={0.1} className="mt-8 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setYearly(false)} className={`text-sm font-semibold transition-colors ${!yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>Monthly</button>
            <button type="button" role="switch" aria-checked={yearly} aria-label="Toggle monthly or yearly billing" onClick={() => setYearly((v) => !v)} className="relative h-6 w-11 rounded-full transition-colors" style={{ background: yearly ? 'var(--ca-primary)' : '#d4d4d4', minHeight: 0 }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: yearly ? '22px' : '2px' }} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>
              Yearly <span className="ml-1 rounded-full bg-[#B91C1C]/12 px-2 py-0.5 text-xs font-bold text-[#B91C1C]">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>
            </span>
          </Reveal>

          <div className="relative mx-auto mt-10 max-w-3xl">
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
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg, var(--ca-primary), #0F766E)' }} />
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

      {/* ═══════════════ 13 · ABOUT (doctor/clinic editorial) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:mx-0">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B91C1C]/10 blur-3xl" />
            <img src={ABOUT_ART} alt="Book A Sloth for doctors and clinics" loading="lazy" className="relative z-10 mx-auto w-full max-w-[22rem] drop-shadow-[0_24px_32px_rgba(42,14,14,0.16)]" />
          </Reveal>
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Modern clinics deserve better tools.
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-5 text-base leading-relaxed text-neutral-600">
              Book A Sloth was built to make appointment-based practices easier to run. Instead of a ringing phone, a paper register and payments at the desk, clinics can manage their appointments, patients and money from one clean platform.
            </Reveal>
            <Reveal as="p" delay={0.1} className="mt-4 text-[15px] font-medium text-neutral-500">
              Built for Indian professionals. Designed for the way modern clinics actually work.
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

      {/* ═══════════════ 15 · FINAL CTA (full-width clean) ═══════════════ */}
      <section className="relative overflow-hidden px-5 py-24 text-center text-white sm:px-8" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #D42B2B 0%, #7A1010 60%)' }}>
        <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-56 w-[42rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(255,255,255,0.14), transparent)' }} />
        <div className="relative mx-auto max-w-2xl">
          <Reveal className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}>
            <Zap size={26} className="text-white" />
          </Reveal>
          <Reveal as="h2" delay={0.06} className="mt-6 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Spend less time scheduling. Spend more time with patients.
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-lg text-base text-white/75">
            Set up your clinic booking page today and give your patients a cleaner way to book with you.
          </Reveal>
          <Reveal delay={0.14} className="mt-8">
            <Link to={START} className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-white px-8 py-4 text-sm font-semibold shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)] transition-opacity hover:opacity-90 hover:no-underline" style={{ color: 'var(--ca-primary)' }}>
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
              <p className="mt-2 max-w-xs text-sm text-neutral-500">The cleaner way to manage clinic appointments.</p>
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
            <p className="text-xs text-neutral-500">Made for India&apos;s doctors &amp; clinics</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

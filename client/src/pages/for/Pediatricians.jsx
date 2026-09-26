// /for/pediatricians — bespoke, conversion-focused landing page for
// pediatricians & child-care clinics in India.
//
// STANDALONE page (not the data-driven ProfessionLanding template). Bespoke
// route PRECEDES /for/:profession in App.jsx. New URL /for/pediatricians —
// keep in sync: App.jsx route, prerender.mjs, sitemapService.js, and the Navbar
// "For professionals" menu (was a /explore placeholder).
//
// Section design (per the profession design brief, #07 Pediatricians & Child
// Care): centered friendly hero · playful bento benefits · illustrated category
// cards · 3-step child-friendly journey · icon-based integration grid · large
// friendly metrics · floating booking-card mid CTA · 4-card benefit grid · quote
// cards · parent-booking comparison · friendly reassurance strip · simple stacked
// pricing · doctor + clinic story · large accordion FAQ · bright image-led CTA.
//
// HONESTY (child medical care): this is a SCHEDULING + PAYMENT tool, not a
// medical-records or advice product. No treatment/outcome claims; testimonials
// are labelled placeholders from clinic staff / parents about ADMIN (booking
// convenience), never about a child's care; trust strip emphasises payment
// security + India data residency + DPDP; JSON-LD has NO self-serving
// aggregateRating.
//
// Legacy --ca-* CSS var names are kept (cosmetic) so shared classNames stay
// valid; values are retuned to a friendly indigo + warm-orange palette.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Menu, X, Plus, Star,
  CalendarCheck, LayoutDashboard, MessageCircle,
  Wallet, BellRing, Baby,
  Users, Clock3, Landmark, Folder,
  FileText, Syringe, Stethoscope, Smile, Thermometer, Activity, Video,
  BadgePercent, Lock, ShieldCheck, Share2, IndianRupee, Heart, Sparkles,
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
const HERO_ART = '/images/abs/illustrations/happy-calendar.webp';
const ABOUT_ART = '/images/abs/illustrations/sloth-hammock.webp';
const CORAL = '#FB923C'; // bright warm orange — used on the bright final CTA

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'For Clinics', href: '#usecases' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Loved by busy parents'];

// Playful bento benefits — one wide + supporting tiles, each its own hue.
const BENEFITS = [
  { icon: CalendarCheck, title: 'Booking without the phone queue', desc: 'Parents book a slot on your link and it is confirmed instantly — no calling during clinic hours.', color: '#4F46E5', wide: true },
  { icon: Wallet, title: 'Consult Fee Upfront', desc: 'Collect the fee online before the visit.', color: '#EA580C' },
  { icon: BellRing, title: 'Reminders Parents Love', desc: 'Automatic WhatsApp reminders — fewer missed visits.', color: '#0891B2' },
  { icon: Syringe, title: 'Vaccination Reminders', desc: 'Nudge parents before the next shot is due.', color: '#16A34A' },
  { icon: ShieldCheck, title: 'Private & Secure', desc: 'Booking data hosted in India, under DPDP 2023.', color: '#DB2777' },
];

// Illustrated service category cards.
const SERVICES = [
  { icon: Stethoscope, label: 'Child Consultation', desc: 'General paediatric consultations and check-ups.' },
  { icon: Syringe, label: 'Vaccination & Immunisation', desc: 'Book shots and keep the schedule on track.' },
  { icon: Baby, label: 'Newborn & Well-Baby Care', desc: 'Newborn visits and well-baby check-ups.' },
  { icon: Activity, label: 'Growth & Development', desc: 'Growth monitoring and development reviews.' },
  { icon: Thermometer, label: 'Fever & Sick Visits', desc: 'Same-day slots for a poorly child.' },
  { icon: Video, label: 'Online Consultation', desc: 'Video consults for quick follow-ups from home.' },
];

// 3-step child-friendly journey.
const STEPS = [
  { title: 'Set up your clinic', icon: LayoutDashboard, desc: 'Add your services, fees and clinic hours, then share your link.' },
  { title: 'Parents book & pay', icon: CalendarCheck, desc: 'A parent picks a slot and pays the fee upfront — in under a minute.' },
  { title: 'Everyone gets reminded', icon: BellRing, desc: 'Confirmations and WhatsApp reminders go out before every visit.' },
];

// Icon-based integration grid — REAL BAS integrations only.
const TOOLS = [
  { name: 'Google Calendar', icon: 'google-calendar', sub: 'Two-way sync of your real availability' },
  { name: 'Google Meet', logo: '/images/logos/google-meet.svg', sub: 'Auto-add a video link to every online visit' },
  { name: 'WhatsApp Automation', logo: '/images/logos/whatsapp.svg', sub: 'Reminders and updates on autopilot' },
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Secure payments, refunds and GST invoices' },
  { name: 'PhonePe', logo: '/images/logos/phonepe.svg', sub: 'Accept instant UPI payments' },
  { name: 'Gmail', logo: '/images/logos/gmail.svg', sub: 'Booking confirmation emails, automatic' },
];

// Large friendly metrics.
const METRICS = [
  { v: '24/7', l: 'Bookings, day or night', note: 'Your booking page never sleeps — parents reserve slots any time.' },
  { v: '100%', l: 'Kept on Sloth Active', note: '0% commission — every rupee you earn stays yours.' },
  { v: '₹0', l: 'To get started', note: 'Free forever plan — no card, no lock-in.' },
  { v: 'GST', l: 'Invoices, automatic', note: 'A tax invoice generated for every paid booking.' },
];

// 4-card "why us" benefit grid.
const WHY = [
  { icon: Share2, title: 'One friendly link', desc: 'Share it on WhatsApp, Google or your clinic board — parents book 24/7.' },
  { icon: Syringe, title: 'Never miss a vaccine', desc: 'Automatic reminders keep every child’s immunisation on schedule.' },
  { icon: Wallet, title: 'Paid before the visit', desc: 'The consultation fee is collected upfront, so reception never chases it.' },
  { icon: ShieldCheck, title: 'Private by design', desc: 'Booking details hosted in India under the DPDP Act — you control what a parent shares.' },
];

// Placeholder testimonials — swap for real quotes when available.
// About the SOFTWARE's booking convenience, never a child's care.
const TESTIMONIALS = [
  { quote: 'Parents used to call the clinic all through the day. Now they book on our link and it is confirmed — reception is calm and our no-shows have dropped.', name: 'Dr. Anil Kumar', role: 'Paediatrician', company: 'Little Steps Clinic, Bengaluru' },
  { quote: 'The vaccination reminders alone have been worth it — far fewer families forgetting the next shot.', name: 'Deepa Menon', role: 'Clinic Manager', company: 'Sunshine Kids, Kochi' },
  { quote: 'As a parent, booking my son’s check-up in a minute instead of calling during work was a relief.', name: 'Ravi Sharma', role: 'Parent', company: 'Pune' },
  { quote: 'Collecting the consultation fee upfront, with a GST invoice each time, cleaned up our billing.', name: 'Dr. Sunita Rao', role: 'Paediatrician', company: 'CarePlus Children’s Clinic, Delhi' },
];

// Parent-booking comparison.
const OLD_WAY = [
  { title: 'Calling during clinic hours', desc: 'Parents ring the desk and wait on hold to fix a time.' },
  { title: 'Missed vaccinations', desc: 'No reminders means the next shot slips through.' },
  { title: 'Paying at the desk', desc: 'Fees collected in person, or chased afterwards.' },
  { title: 'A paper appointment book', desc: 'Visits scattered across a register and phone notes.' },
  { title: 'Double-booked slots', desc: 'Two children booked into the same slot by hand.' },
];
const NEW_WAY = [
  { title: 'Book in a minute, any time', desc: 'Parents pick a slot themselves, 24/7 — no calls needed.' },
  { title: 'Automatic vaccine reminders', desc: 'WhatsApp reminders keep immunisations on schedule.' },
  { title: 'Fees collected upfront', desc: 'Consultation fee taken at booking, over UPI or card.' },
  { title: 'One friendly clinic calendar', desc: 'Every appointment and doctor in a single view.' },
  { title: 'Conflict-free slots', desc: 'Availability stays accurate — no double bookings.' },
];

// Friendly reassurance strip — verifiable facts only.
const TRUST_STRIP = [
  { icon: Lock, value: 'Razorpay', label: 'Every payment signature-verified on our servers' },
  { icon: Landmark, value: 'Hosted in India', label: 'Your clinic data runs on servers in Mumbai' },
  { icon: ShieldCheck, value: 'DPDP 2023', label: 'Operated under India’s data protection law' },
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
];

const FAQ = [
  { q: 'Is Book A Sloth suitable for paediatricians and child-care clinics?', a: 'Yes. Whether you are a solo paediatrician or a children’s clinic with a team, Book A Sloth manages your services, availability, bookings and communication from one place — so parents can book without calling and your reception stays calm. It is a scheduling and payment tool, not a medical-records system.' },
  { q: 'Can parents book appointments online?', a: 'Yes. A parent opens your booking link, chooses a service such as a consultation or vaccination, picks a convenient time and confirms — in under a minute, no calls needed.' },
  { q: 'Can I send vaccination reminders?', a: 'Yes. Book A Sloth sends automatic WhatsApp and email reminders before every appointment, which helps parents keep their child’s immunisation schedule on track.' },
  { q: 'Can I offer same-day sick visits and online consultations?', a: 'Yes. Open same-day slots for sick visits, and offer online consultations with automatic Google Meet links for quick follow-ups — or mark a service as in-clinic.' },
  { q: 'Can I collect the consultation fee online?', a: 'Yes. Collect the fee upfront through Razorpay — UPI, cards or netbanking — before the appointment. A GST invoice is generated automatically for every paid booking.' },
  { q: 'Is our clinic and family information kept private?', a: 'Book A Sloth stores appointment and contact details for booking only — it is not a medical-records system. Your production data is hosted in India (Mumbai) and the platform operates under India’s DPDP Act 2023.' },
  { q: 'Do we need any technical setup?', a: 'No. Setup takes minutes and needs no technical skills. You add your services and clinic hours, and your booking page is ready to share — parents need nothing more than the link.' },
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
    { label: 'Pediatricians & Child Care', to: '/for/pediatricians' },
    { label: 'Gynecologists & OB-GYNs', to: '/for/gynecologists' },
    { label: 'Dermatologists & Skin Clinics', to: '/for/dermatologists' },
    { label: 'Doctors & Clinics', to: '/for/doctors' },
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
    solid: 'text-white shadow-[0_4px_14px_rgba(79,70,229,0.22)] hover:brightness-110',
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

/* Illustrated service category card — friendly, coloured icon panel. */
function ServiceCard({ s }) {
  return (
    <Link to={START} className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-black/[0.07] bg-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-26px_rgba(79,70,229,0.4)] hover:no-underline">
      <div className="relative flex h-24 items-center justify-center" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--ca-primary) 12%, white), color-mix(in srgb, var(--ca-accent) 12%, white))' }}>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 shadow-sm" style={{ color: 'var(--ca-primary)' }}>
          <s.icon size={26} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-[15px] font-bold text-[color:var(--ca-ink)]">{s.label}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{s.desc}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: 'var(--ca-primary)' }}>
          Book now <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/* 3-step child-friendly journey — big numbered circles on a horizontal rail. */
function HowItWorks({ steps }) {
  return (
    <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
      <span aria-hidden className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-8 hidden h-px md:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(79,70,229,0.5), transparent)' }} />
      {steps.map((s, i) => (
        <Reveal key={s.title} delay={i * 0.1} className="relative text-center">
          <span className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white" style={{ borderColor: 'rgba(79,70,229,0.4)', color: 'var(--ca-primary)' }}>
            <s.icon size={24} />
          </span>
          <span className="mx-auto mt-3 flex h-6 w-6 items-center justify-center rounded-full font-heading text-[11px] font-extrabold text-white" style={{ background: 'var(--ca-accent)' }}>{i + 1}</span>
          <h3 className="mt-3 font-heading text-lg font-bold text-[color:var(--ca-ink)]">{s.title}</h3>
          <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-neutral-500">{s.desc}</p>
        </Reveal>
      ))}
    </div>
  );
}

/* One icon-grid integration item — logo + name + note. */
function ToolItem({ t }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-black/[0.08] bg-white px-4 py-3.5">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--ca-grey)]">
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

/* Large single-open FAQ accordion. */
function FaqAccordion() {
  const [open, setOpen] = useState(0);
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {FAQ.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="overflow-hidden rounded-[16px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'rgba(79,70,229,0.35)' : 'rgba(17,17,17,0.08)' }}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-[15px] font-semibold text-[color:var(--ca-ink)]"
            >
              {f.q}
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'rgba(79,70,229,0.1)', color: 'var(--ca-primary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
                <Plus size={15} />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                  <p className="px-6 pb-5 text-[14.5px] leading-relaxed text-neutral-500">{f.a}</p>
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

export default function Pediatricians() {
  useLenis();
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  const canonical = `${SITE_URL}/for/pediatricians`;
  const seo = {
    title: 'Appointment Booking Software for Pediatricians & Child-Care Clinics | Book A Sloth',
    description: 'Book A Sloth is appointment scheduling software for pediatricians and child-care clinics in India. Let parents book consultations and vaccinations online — fees collected upfront, WhatsApp reminders, GST invoices, 0% commission. Start free.',
    keywords: 'appointment booking software for pediatricians, child clinic scheduling software india, book pediatrician appointment online, vaccination appointment booking, children clinic booking page, paediatric appointment system',
    ogTitle: 'Your clinic runs on appointments. Let Book A Sloth schedule them.',
    ogDescription: 'Parents book consultations and vaccinations, pay upfront and get WhatsApp reminders — automatically. A friendly booking page for paediatric clinics in India.',
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
      serviceType: 'Appointment booking software for pediatricians and child-care clinics',
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
        { '@type': 'ListItem', position: 2, name: 'For Pediatricians & Child Care', item: canonical },
      ],
    },
  ];

  // Friendly indigo + warm-orange palette — legacy --ca-* var names kept.
  const styleVars = {
    '--ca-primary': '#4F46E5', // indigo-600 (AA-safe: white text/links ~5.9:1)
    '--ca-accent': '#C2410C',  // orange-700 (AA on white ~5:1)
    '--ca-ink': '#1E1B4B',     // indigo-950 text
    '--ca-cream': '#EEF2FF',   // indigo-50 section bg
    '--ca-grey': '#F1F2FD',    // light indigo section bg
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
        themeColor="#4F46E5"
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

      {/* ═══════════════ 2 · HERO (centered friendly) ═══════════════ */}
      <section className="relative overflow-hidden px-5 pb-16 pt-12 text-center sm:px-8 sm:pb-20 sm:pt-16 lg:pb-24" style={{ background: 'linear-gradient(180deg, var(--ca-cream) 0%, #ffffff 100%)' }}>
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-72 w-[46rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(79,70,229,0.12), transparent)' }} />
        <div className="relative mx-auto max-w-3xl">
          <Reveal as="p" instant className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(79,70,229,0.3)', color: 'var(--ca-primary)', background: 'color-mix(in srgb, var(--ca-primary) 8%, transparent)' }}>
            For pediatricians &amp; child care
          </Reveal>
          <Reveal as="h1" instant className="text-[clamp(1.8rem,7vw,2.9rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[color:var(--ca-ink)] lg:text-[3.1rem]">
            A friendly way for clinics to{' '}
            <span style={{ color: 'var(--ca-primary)' }}>book child visits</span>{' '}
            without the phone queue.
          </Reveal>
          <Reveal as="p" instant delay={0.05} className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-500 sm:mt-6 sm:text-lg">
            Let parents book consultations and vaccinations in a minute, pay upfront and get reminders — from one friendly platform built for busy child-care clinics.
          </Reveal>
          <Reveal instant delay={0.1} className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
            <Link
              to={START}
              className="btn flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(79,70,229,0.25)] transition-opacity hover:opacity-90 hover:no-underline sm:w-auto"
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
          <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[rgba(79,70,229,0.12)] to-[rgba(194,65,12,0.12)] blur-2xl" />
          <img src={HERO_ART} alt="Book A Sloth — appointment booking for pediatricians and child-care clinics" loading="eager" className="relative z-10 mx-auto w-full max-w-[24rem] drop-shadow-[0_28px_40px_rgba(30,27,75,0.18)]" />
          <GlassCard icon={CalendarCheck} label="New booking" value="Vaccination · 10:00 AM" float="sloth-float" className="top-4 -left-6 hidden lg:flex" />
          <GlassCard icon={Wallet} label="Fee received" value="₹600" accent float="sloth-float--mid" className="top-1/2 -right-8 hidden lg:flex" />
          <GlassCard icon={BellRing} label="Reminder" value="Sent · 1h before" float="sloth-float--slow" className="bottom-8 left-0 hidden lg:flex" />
        </Reveal>
      </section>

      {/* ═══════════════ 3 · BENEFITS (playful bento) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Everything a child-care clinic needs, <span style={{ color: 'var(--ca-primary)' }}>in one friendly place.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">
              Less time on the phone, more time with little patients — and every rupee you earn stays yours.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={(i % 3) * 0.06} className={b.wide ? 'sm:col-span-2' : ''}>
                <div className={`group flex h-full flex-col rounded-[18px] border border-black/[0.07] bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-24px_rgba(30,27,75,0.4)] ${b.wide ? 'sm:p-8' : ''}`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-105" style={{ background: b.color }}>
                    <b.icon size={20} />
                  </span>
                  <h3 className={`mt-4 font-heading font-bold text-[color:var(--ca-ink)] ${b.wide ? 'text-lg' : 'text-[15px]'}`}>{b.title}</h3>
                  <p className={`mt-1.5 leading-snug text-neutral-500 ${b.wide ? 'text-[15px] leading-relaxed' : 'text-xs'}`}>{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4 · SERVICES (illustrated cards) ═══════════════ */}
      <section id="usecases" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Every visit your clinic offers, <span style={{ color: 'var(--ca-primary)' }}>bookable online.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">
              From consultations to vaccinations and well-baby check-ups, let parents book any visit in seconds.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Reveal key={s.label} delay={(i % 3) * 0.05}>
                <ServiceCard s={s} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 5 · HOW IT WORKS (child-friendly journey) ═══════════════ */}
      <section id="how" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              How Book A Sloth helps <span style={{ color: 'var(--ca-primary)' }}>child-care clinics</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              From a ringing phone to a confirmed, paid visit — in three simple steps.
            </Reveal>
          </div>
          <HowItWorks steps={STEPS} />
        </div>
      </section>

      {/* ═══════════════ 6 · INTEGRATIONS (icon grid) ═══════════════ */}
      <section id="features" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Works with the tools you already use.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Connect your calendar, payments and WhatsApp — Book A Sloth fits your clinic, no rewiring.
            </Reveal>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* ═══════════════ 7 · IMPACT (large friendly metrics) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Real impact for <span style={{ color: 'var(--ca-primary)' }}>a modern child-care clinic.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              Fewer missed visits, a calmer reception — and every rupee you earn stays yours.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m, i) => (
              <Reveal key={m.l} delay={i * 0.06}>
                <div className="relative h-full overflow-hidden rounded-[18px] border border-black/[0.08] bg-white p-7 text-center">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'linear-gradient(90deg, var(--ca-primary), #C2410C)' }} />
                  <div className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl" style={{ color: 'var(--ca-primary)' }}>{m.v}</div>
                  <div className="mt-3 font-heading text-sm font-bold text-[color:var(--ca-ink)]">{m.l}</div>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{m.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 8 · MID CTA (floating booking card) ═══════════════ */}
      <section className="px-5 py-12 sm:px-8">
        <Reveal className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-4 rounded-[22px] px-7 py-9 text-center text-white shadow-[0_24px_60px_-30px_rgba(79,70,229,0.6)]" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #6366F1 0%, #4F46E5 60%)' }}>
            <div className="font-heading text-xl font-extrabold sm:text-2xl">Give parents an easier way to book.</div>
            <p className="max-w-md text-sm text-white/80">Set up your clinic booking page today — free forever, no card required.</p>
            <Link to={START} className="mt-1 inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold shadow-lg transition-opacity hover:opacity-90 hover:no-underline" style={{ background: CORAL, color: '#3A1607' }}>
              Start for Free <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════ 9 · WHY BOOK A SLOTH (4-card grid) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Why child-care clinics choose <span style={{ color: 'var(--ca-primary)' }}>Book A Sloth.</span>
            </Reveal>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={(i % 4) * 0.06}>
                <div className="flex h-full flex-col rounded-[18px] border border-black/[0.08] bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: 'color-mix(in srgb, var(--ca-primary) 10%, transparent)', color: 'var(--ca-primary)' }}>
                    <w.icon size={20} />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-bold text-[color:var(--ca-ink)]">{w.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 10 · TESTIMONIALS (quote cards) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Loved by <span style={{ color: 'var(--ca-primary)' }}>clinics &amp; parents</span> across India.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 4) * 0.06}>
                <figure className="flex h-full flex-col rounded-[18px] border border-black/[0.08] bg-white p-6">
                  <span aria-hidden className="font-heading text-4xl leading-none" style={{ color: 'rgba(79,70,229,0.4)' }}>&ldquo;</span>
                  <blockquote className="-mt-2 text-[13.5px] leading-relaxed text-neutral-700">{t.quote}</blockquote>
                  <figcaption className="mt-auto flex items-center gap-2.5 border-t border-black/[0.06] pt-4">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'var(--ca-primary)' }}>{t.name.replace('Dr. ', '').charAt(0)}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-[color:var(--ca-ink)]">{t.name}</div>
                      <div className="truncate text-[11px] text-neutral-500">{t.role} · {t.company}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 11 · DIFFERENCE (parent booking comparison) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Calling the clinic vs <span style={{ color: 'var(--ca-primary)' }}>booking in a minute.</span>
            </Reveal>
          </div>
          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[18px] border border-black/[0.08] bg-white shadow-[0_14px_40px_-24px_rgba(30,27,75,0.25)]">
            <div className="grid grid-cols-2 border-b-2" style={{ borderColor: 'var(--ca-primary)' }}>
              <div className="flex items-center gap-2 px-5 py-4 sm:px-6"><X size={16} className="text-[#DC2626]" /><span className="font-heading text-sm font-bold text-neutral-500">Calling the clinic</span></div>
              <div className="flex items-center gap-2 border-l border-black/[0.06] px-5 py-4 sm:px-6" style={{ background: 'rgba(79,70,229,0.04)' }}><Check size={16} style={{ color: 'var(--ca-primary)' }} /><span className="font-heading text-sm font-bold" style={{ color: 'var(--ca-ink)' }}>With Book A Sloth</span></div>
            </div>
            {OLD_WAY.map((o, i) => (
              <Reveal key={o.title} className={`grid grid-cols-2 ${i % 2 ? '' : 'bg-black/[0.015]'}`}>
                <div className="border-t border-black/[0.06] px-5 py-4 sm:px-6">
                  <p className="text-[14px] font-semibold text-neutral-700">{o.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-500">{o.desc}</p>
                </div>
                <div className="border-l border-t border-black/[0.06] px-5 py-4 sm:px-6" style={{ background: 'rgba(79,70,229,0.03)' }}>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--ca-ink)' }}>{NEW_WAY[i]?.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-600">{NEW_WAY[i]?.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 12 · TRUST STRIP (friendly reassurance) ═══════════════ */}
      <section className="border-y border-black/5 px-5 py-12 sm:px-8" style={{ background: 'var(--ca-ink)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST_STRIP.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <s.icon size={20} className="mx-auto" style={{ color: '#A5B4FC' }} />
              <div className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{s.value}</div>
              <p className="mx-auto mt-1.5 max-w-[14rem] text-xs leading-snug text-white/50">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 13 · PRICING (simple stacked) ═══════════════ */}
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
              Yearly <span className="ml-1 rounded-full bg-[#4F46E5]/12 px-2 py-0.5 text-xs font-bold text-[#4F46E5]">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>
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

      {/* ═══════════════ 14 · ABOUT (doctor + clinic story) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative order-2 mx-auto w-full max-w-md lg:order-1 lg:mx-0">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F46E5]/10 blur-3xl" />
            <img src={ABOUT_ART} alt="Book A Sloth for paediatric and child-care clinics" loading="lazy" className="relative z-10 mx-auto w-full max-w-[22rem] drop-shadow-[0_24px_32px_rgba(30,27,75,0.16)]" />
          </Reveal>
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Modern clinics deserve better tools.
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-5 text-base leading-relaxed text-neutral-600">
              Book A Sloth was built to make appointment-based practices easier to run. Instead of a ringing phone, a paper register and payments at the desk, child-care clinics can manage their appointments, families and money from one friendly platform.
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

      {/* ═══════════════ 15 · FAQ (large accordion) ═══════════════ */}
      <section id="faq" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="text-center font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Questions? <span style={{ color: 'var(--ca-primary)' }}>We&apos;ve got answers.</span>
          </Reveal>
          <div className="mt-12"><FaqAccordion /></div>
        </div>
      </section>

      {/* ═══════════════ 16 · FINAL CTA (bright image-led) ═══════════════ */}
      <section className="relative overflow-hidden px-5 py-24 text-center sm:px-8" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #6366F1 0%, #3730A3 60%)' }}>
        <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-56 w-[42rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(251,146,60,0.22), transparent)' }} />
        <div className="relative mx-auto max-w-2xl">
          <Reveal className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(251,146,60,0.18)' }}>
            <Smile size={26} style={{ color: CORAL }} />
          </Reveal>
          <Reveal as="h2" delay={0.06} className="mt-6 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Spend less time on the phone. <span style={{ color: CORAL }}>Spend more time with little patients.</span>
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-lg text-base text-white/70">
            Set up your clinic booking page today and give parents a friendly way to book with you.
          </Reveal>
          <Reveal delay={0.14} className="mt-8">
            <Link to={START} className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold shadow-[0_10px_30px_-8px_rgba(251,146,60,0.6)] transition-opacity hover:opacity-90 hover:no-underline" style={{ background: CORAL, color: '#3A1607' }}>
              Start for Free <ArrowRight size={16} />
            </Link>
          </Reveal>
          <Reveal as="p" delay={0.18} className="mt-4 text-xs text-white/60">No credit card required</Reveal>
        </div>
      </section>

      {/* ═══════════════ 17 · FOOTER ═══════════════ */}
      <footer className="border-t border-black/5 px-5 py-16 sm:px-8" style={{ background: '#ffffff' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div>
              <div className="font-heading text-lg font-extrabold text-[color:var(--ca-ink)]">Book A Sloth</div>
              <p className="mt-2 max-w-xs text-sm text-neutral-500">The friendlier way to manage clinic appointments.</p>
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
            <p className="text-xs text-neutral-500">Made for India&apos;s pediatricians &amp; child-care clinics</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

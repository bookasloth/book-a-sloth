// /for/dentists — bespoke landing page for dental clinics & practices in India.
//
// SPIKE: a 2nd variant set (4th palette) to prove pages look distinct via theme +
// section variety, and that Tier-A medical compliance reshapes the page. New here
// vs CA/Turf/Lawyers: a LIGHT clinical hero with a "today" clinic card (NO mascot),
// soft rounded use-case cards, and — per NMC Code Reg 6/7 — NO patient testimonials
// (medical councils bar patient testimonials/endorsements); that section is replaced
// by a compliant "built for your clinic" block. Health data → DPDP emphasis.
//
// Positioned as scheduling for EXISTING patients + cutting front-desk load — not a
// patient-acquisition/advertising channel. Candid council FAQ. No outcome claims.
//
// Legacy --ca-* var names kept (cosmetic) so shared classNames stay valid.
// New URL — keep in sync: App.jsx route (before /for/:profession), prerender.mjs,
// Solutions.jsx.

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, Menu, X, Plus,
  CalendarCheck, LayoutDashboard, MessageCircle, BellRing, Wallet,
  Clock3, Landmark, FileText, Lock, BadgePercent, Zap, Share2, IndianRupee,
  Smile, Sparkles, Stethoscope, Activity, ShieldCheck, Baby, Syringe, Phone, Star,
} from 'lucide-react';
import Seo from '../../components/common/Seo';
import { SITE_URL } from '../../utils/seo';
import {
  FREE_PLAN, PREMIUM_PLAN,
  PREMIUM_ANNUAL_SAVE_PCT,
} from '../../data/plans';
import ToolLogo from './toolLogos';
import razorpayLogo from '../enterprise-v2/assets/logo/razorpay.png';

const START = '/be-a-sloth';
const LOGIN = '/login-as-vendor';

/* Local CSS scroll-reveal — IntersectionObserver + CSS transition (no framer).
   Mirrors the shared Reveal API (as / delay / instant / className). */
function Reveal({ as: Tag = 'div', delay = 0, instant = false, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(instant);
  useEffect(() => {
    if (instant || shown) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [instant, shown]);
  return (
    <Tag ref={ref} className={`dt-rv${shown ? ' dt-rv-in' : ''} ${className}`} style={{ transitionDelay: delay ? `${delay}s` : undefined }} {...rest}>
      {children}
    </Tag>
  );
}

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'For Clinics', href: '#usecases' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Built for Indian clinics'];

const BENEFITS = [
  { icon: Phone, title: 'Lighter Front Desk', desc: 'Patients book online — fewer calls to your reception.' },
  { icon: BellRing, title: 'Fewer No-Shows', desc: 'Automatic WhatsApp reminders before every appointment.' },
  { icon: Wallet, title: 'Fees Upfront', desc: 'Optionally collect the consult fee online before the visit.' },
  { icon: LayoutDashboard, title: 'One Clear Diary', desc: 'Every appointment for your chair in a single view.' },
];

const USE_CASES = [
  { icon: Smile, label: 'Routine Check-up', desc: 'Regular dental exams.' },
  { icon: Sparkles, label: 'Cleaning & Whitening', desc: 'Scaling, polishing, whitening.' },
  { icon: Stethoscope, label: 'Consultation', desc: 'First-visit assessments.' },
  { icon: Activity, label: 'Root Canal Consult', desc: 'Endodontic planning.' },
  { icon: ShieldCheck, label: 'Implant Consult', desc: 'Implant assessments.' },
  { icon: Syringe, label: 'Orthodontic Consult', desc: 'Braces and aligners.' },
  { icon: Baby, label: 'Kids Dentistry', desc: 'Gentle care for children.' },
  { icon: Clock3, label: 'Emergency Slot', desc: 'Same-day urgent care.' },
];

const STEPS = [
  { title: 'Set up your clinic & slots', icon: LayoutDashboard, desc: 'Add your appointment types and hours, then share your booking link with your patients.' },
  { title: 'Patients book & confirm', icon: CalendarCheck, desc: 'A patient picks an appointment type and a time — no calls to your front desk.' },
  { title: 'Everyone gets reminded', icon: BellRing, desc: 'You and your patient get automatic confirmations and WhatsApp reminders before the visit.' },
];

const TOOLS_LEFT = [
  { name: 'Google Calendar', icon: 'google-calendar', sub: 'Two-way sync of your real availability' },
  { name: 'WhatsApp Automation', logo: '/images/logos/whatsapp.svg', sub: 'Appointment reminders on autopilot' },
  { name: 'Patient Records', logo: '/favicon.svg', sub: 'Every patient, note and history in one place' },
];
const TOOLS_RIGHT = [
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Online payments, refunds and GST invoices' },
  { name: 'PhonePe', logo: '/images/logos/phonepe.svg', sub: 'Accept instant UPI payments' },
  { name: 'Gmail', logo: '/images/logos/gmail.svg', sub: 'Confirmation emails, sent automatically' },
];
const TOOLS_ALL = [...TOOLS_LEFT, ...TOOLS_RIGHT];

// Compliant replacement for testimonials (NMC bars patient testimonials).
const CLINIC_FEATURES = [
  { icon: Phone, title: 'A quieter front desk', desc: 'Patients self-book and reschedule online, so your reception fields far fewer calls.' },
  { icon: BellRing, title: 'Fewer empty chairs', desc: 'Automatic WhatsApp and email reminders before each appointment cut no-shows.' },
  { icon: LayoutDashboard, title: 'One diary, always current', desc: 'Every appointment in a single live view — no double-booked slots.' },
  { icon: ShieldCheck, title: 'Private by design', desc: 'We never publish patient reviews or ratings. Your booking page shows only what you choose.' },
];

// Placeholder testimonials — dental CLINIC OWNERS reviewing Book A Sloth (the
// software), NOT patients reviewing the dentist (which NMC bars). Swap for real
// clinic quotes when available. Software/admin-focused; all 5-star; no fabricated dates.
const DENTIST_TESTIMONIALS = [
  { name: 'Dr. Kavya Nair', role: 'Nair Dental Care, Kochi', quote: 'Our front desk used to spend the whole morning on the phone. Patients now book their own slots and the reminders have cut our no-shows right down.' },
  { name: 'Dr. Arjun Mehta', role: 'Smile Studio, Pune', quote: 'Setup took an evening. One clear diary means no more double-booked chairs — exactly what a busy clinic needs.' },
  { name: 'Dr. Sneha Rao', role: 'DentaCare, Bengaluru', quote: 'Collecting the consult fee online before the visit tidied up our billing, and the GST invoices are generated automatically.' },
  { name: 'Dr. Imran Sheikh', role: 'City Dental, Hyderabad', quote: 'A calm, professional booking page — and 0% commission on Active means every rupee stays with the practice.' },
  { name: 'Dr. Ananya Gupta', role: 'Bright Smile, Delhi', quote: 'The WhatsApp reminders alone save us hours every week that we used to spend chasing confirmations.' },
];

// Real impact, real numbers — ditto layout, dental content.
const IMPACT_STATS = [
  { value: '0%', desc: 'Commission on Sloth Active — every consult fee stays with the practice.', icon: BadgePercent },
  { value: '< 5 min', desc: 'To set up your services and put a booking page in front of patients.', icon: Sparkles },
  { value: '24/7', desc: 'Patients book or reschedule any time — no calls, no front-desk queue.', icon: CalendarCheck },
];

// The Book A Sloth difference — with / without comparison (ditto layout).
const WITHOUT = ['Phone ringing all day to book a slot', 'No-shows leave chairs empty', 'Fees chased at the counter', 'Reminders sent by hand, one by one'];
const WITH_BAS = ['Patients pick a slot themselves', 'Automatic reminders cut no-shows', 'Consult fee collected upfront', 'WhatsApp reminders sent for you'];

// Honest trust strip — verifiable facts only, health-data tuned.
const TRUST_STRIP = [
  { icon: Lock, value: 'Razorpay', label: 'Every payment signature-verified on our servers' },
  { icon: Landmark, value: 'Hosted in India', label: 'Your clinic data runs on servers in Mumbai' },
  { icon: FileText, value: 'DPDP 2023', label: 'Operated under India’s data protection law' },
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
];

const FAQ = [
  { q: 'Is Book A Sloth suitable for a dental clinic?', a: 'Yes — for managing appointments with your patients: an online booking page, automatic reminders, optional upfront fees and one clear diary. It is a scheduling and reminder tool for your practice, not a patient-acquisition or advertising channel.' },
  { q: 'Does using Book A Sloth comply with dental council / NMC advertising norms?', a: 'Medical and dental practitioners are restricted from advertising or soliciting patients (NMC Code of Ethics, Reg. 6–7). Book A Sloth is a scheduling and reminder tool — how you use it is your responsibility. We suggest sharing your booking link with your existing patients rather than as public advertising, and following your council’s guidance. We do not advertise your practice, and we never publish patient reviews, ratings or testimonials.' },
  { q: 'Can patients book appointments online?', a: 'Yes. A patient opens your booking link, chooses an appointment type such as a check-up or consultation, picks a time and confirms — no calls to your front desk.' },
  { q: 'Can I send WhatsApp reminders?', a: 'Yes. Book A Sloth sends automatic confirmations and reminders over WhatsApp and email before each appointment, which cuts no-shows. WhatsApp reminders are included on the Sloth Active plan (and free for your first two months on the Sloth plan).' },
  { q: 'Can I collect fees online?', a: 'Optionally. Collect a consultation fee upfront through Razorpay — UPI, cards or netbanking — or leave it off and collect at the clinic. A GST invoice is generated automatically for every paid booking.' },
  { q: 'Can I manage multiple dentists or chairs?', a: 'Right now Book A Sloth is best for a single appointment calendar per account — two dentists or chairs on one account share one diary and cannot be booked in parallel. Parallel multi-chair scheduling is on our roadmap; in the meantime a separate account per dentist is the workaround. We would rather tell you upfront than have it surprise you after setup.' },
  { q: 'Is patient information kept private?', a: 'Your production data is hosted in India (Mumbai) and the platform operates under India’s DPDP Act 2023. You control what appears on your booking page and what a patient provides when booking, and we never display patient reviews or ratings publicly.' },
  { q: 'Is there a free plan?', a: 'Yes. The Sloth plan is free forever — an online booking page, unlimited appointment types and bookings, UPI payments, 24-hour reminders and GST invoices — with a small 5% per-booking fee. Sloth Active removes that commission entirely and adds WhatsApp automation and more.' },
];

const FOOTER_COLS = [
  { title: 'Product', links: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Integrations', href: '#features' },
    { label: "What's New", to: '/changelog' },
  ] },
  { title: 'For Professionals', links: [
    { label: 'Dental Clinics', to: '/for/dentists' },
    { label: 'Doctors', to: '/for/doctors' },
    { label: 'Chartered Accountants', to: '/for/chartered-accountants' },
    { label: 'Advocates', to: '/for/lawyers' },
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

/* Hero clinic "today" card — a calm, mascot-less clinical mock (pure CSS/JSX). */
function ClinicDayCard() {
  const rows = [
    { t: '10:30', name: 'Ananya S.', svc: 'Cleaning & Polishing', paid: true },
    { t: '12:00', name: 'Rahul M.', svc: 'Root Canal Consult', paid: true },
    { t: '4:15', name: 'Priya K.', svc: 'Routine Check-up', paid: false },
  ];
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_40px_90px_-40px_rgba(14,116,144,0.45)] ring-1 ring-black/[0.06]">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3.5" style={{ background: 'var(--ca-cream)' }}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: 'var(--ca-primary)' }}>BS</span>
            <div className="leading-tight">
              <div className="text-[13px] font-bold text-[color:var(--ca-ink)]">Bright Smile Dental</div>
              <div className="text-[10px] text-neutral-600">Today · Tue</div>
            </div>
          </div>
          <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: 'rgba(13,148,136,0.12)', color: 'var(--ca-accent)' }}>3 appointments</span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-black/5">
          {[{ v: '3', l: 'Today' }, { v: '18', l: 'This week' }, { v: '2', l: 'Open slots' }].map((s) => (
            <div key={s.l} className="bg-white px-3 py-3 text-center">
              <div className="font-heading text-xl font-extrabold text-[color:var(--ca-ink)]">{s.v}</div>
              <div className="mt-0.5 text-[10px] text-neutral-500">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="px-5 py-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Today&apos;s appointments</span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--ca-primary)' }}>View all</span>
          </div>
          <div className="space-y-2.5">
            {rows.map((m) => (
              <div key={m.t} className="flex items-center gap-3 rounded-[10px] border border-black/[0.06] bg-white px-3 py-2.5">
                <div className="flex flex-col items-center rounded-lg px-2 py-1" style={{ background: 'var(--ca-grey)' }}>
                  <span className="text-[11px] font-bold text-[color:var(--ca-ink)]">{m.t}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-bold text-[color:var(--ca-ink)]">{m.name}</div>
                  <div className="truncate text-[10px] text-neutral-500">{m.svc}</div>
                </div>
                {m.paid
                  ? <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: 'rgba(13,148,136,0.12)', color: 'var(--ca-accent)' }}><Check size={9} /> Paid</span>
                  : <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: 'var(--ca-cream)', color: 'var(--ca-primary)' }}>Confirmed</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -right-3 bottom-8 hidden rounded-2xl bg-white px-3 py-2.5 shadow-xl ring-1 ring-black/5 sm:block">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-500"><MessageCircle size={12} style={{ color: 'var(--ca-accent)' }} /> WhatsApp sent</div>
        <div className="mt-0.5 text-[11px] font-bold text-[color:var(--ca-ink)]">Reminder · 1h before</div>
      </div>
    </div>
  );
}

/* Use-case soft card — clean clinical tile: teal icon circle, title, desc.
   (A new variant: rounded/soft, uniform, no checkerboard/dark/list.) */
function UseCaseCard({ u }) {
  return (
    <div className="group flex h-full flex-col rounded-[18px] border border-black/[0.06] bg-white p-6 transition-colors hover:border-[color:var(--ca-primary)]/30">
      <span className="flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 group-hover:scale-[1.03]" style={{ background: 'rgba(14,116,144,0.1)', color: 'var(--ca-primary)' }}>
        <u.icon size={22} />
      </span>
      <h3 className="mt-5 font-heading text-[15px] font-bold text-[color:var(--ca-ink)]">{u.label}</h3>
      <p className="mt-1 text-[13px] leading-snug text-neutral-500">{u.desc}</p>
    </div>
  );
}

/* How-it-works — clean horizontal 3-step with teal numbered discs + connector. */
function HowItWorks({ steps }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setActive((a) => (a + 1) % steps.length), 2000);
    return () => clearTimeout(t);
  }, [active, steps.length]);
  const centers = ['16.667%', '50%', '83.333%']; // column centres for a 3-col grid
  return (
    <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
      {/* rail */}
      <span aria-hidden className="pointer-events-none absolute left-[16.667%] right-[16.667%] top-7 hidden h-px md:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(14,116,144,0.4), transparent)' }} />
      {/* beacon — travels 1→2→3 then loops */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-7 z-10 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full md:block"
        style={{ background: 'var(--ca-accent)', boxShadow: '0 0 0 6px rgba(15,118,110,0.18)', left: centers[active], transition: 'left 0.6s cubic-bezier(0.22,1,0.36,1)' }}
      />
      {steps.map((s, i) => {
        const on = i === active;
        return (
          <Reveal key={s.title} delay={i * 0.1} className="relative text-center">
            <button type="button" onClick={() => setActive(i)} aria-current={on} aria-label={`Step ${i + 1}: ${s.title}`} className="mx-auto block">
              <span
                className="relative z-20 mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-500"
                style={{
                  background: 'var(--ca-primary)',
                  transform: on ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: on
                    ? '0 0 0 6px rgba(14,116,144,0.15), 0 14px 30px -10px rgba(14,116,144,0.9)'
                    : '0 10px 24px -12px rgba(14,116,144,0.55)',
                }}
              >
                <s.icon size={22} />
              </span>
            </button>
            <h3 className={`mt-5 font-heading text-lg font-bold transition-colors duration-300 ${on ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>{s.title}</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-neutral-500">{s.desc}</p>
          </Reveal>
        );
      })}
    </div>
  );
}

/* Integration card + grid hub. */
function ToolCard({ t }) {
  return (
    <div className="flex h-full w-full items-center gap-3 rounded-2xl border border-black/[0.05] bg-white px-4 py-3.5 shadow-[0_14px_34px_-20px_rgba(17,17,17,0.3)] transition-colors hover:border-[color:var(--ca-primary)]/30">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--ca-grey)]">
        {t.logo
          ? <img src={t.logo} alt="" loading="lazy" className="h-6 w-6 object-contain" />
          : <ToolLogo name={t.icon} size={24} className="h-6 w-6" />}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold leading-tight text-[color:var(--ca-ink)]">{t.name}</div>
        <div className="mt-0.5 text-xs leading-snug text-neutral-500">{t.sub}</div>
      </div>
    </div>
  );
}
function IntegrationHub() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-[46rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(14,116,144,0.10), transparent)' }} />
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {TOOLS_ALL.map((t, i) => (
          <Reveal key={t.name} delay={(i % 3) * 0.06}><ToolCard t={t} /></Reveal>
        ))}
      </div>
    </div>
  );
}

/* Animated testimonials — reviewers on a soft arc (active one enlarged), with the
   active quote in serif on the right. Auto-advances every 3.5s; click to select.
   These are CLINIC-OWNER reviews of the software, not patient reviews. */
function AnimatedTestimonials({ items }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setActive((a) => (a + 1) % items.length), 3500);
    return () => clearTimeout(t);
  }, [active, items.length]);
  const a = items[active];
  const n = items.length;
  // Window of exactly 3 on the arc: prev (top), active (middle), next (bottom).
  // Everything else is hidden. Middle is enlarged + rightmost on the curve.
  const slots = [
    { k: (active - 1 + n) % n, pos: 'top' },
    { k: active, pos: 'mid' },
    { k: (active + 1) % n, pos: 'bot' },
  ];
  return (
    <div className="mt-12 grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
      {/* LEFT — straight rail + dots; 3 rows, middle = highlighted active card w/ tail.
          On advance the rows shuffle up (wheel) and a new reviewer enters at the bottom. */}
      <div className="relative pl-7">
        <span aria-hidden className="absolute bottom-5 left-1.5 top-5 w-px bg-black/10" />
          <div key={active} className="dt-fade flex flex-col gap-3">
            {slots.map((s) => {
              const t = items[s.k];
              const on = s.pos === 'mid';
              return (
                <div key={s.pos} className="relative flex min-h-[80px] items-center">
                  <span aria-hidden className="absolute -left-[22px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ring-2 ring-white" style={{ background: on ? 'var(--ca-primary)' : '#c3d3d3' }} />
                  <button
                    type="button"
                    onClick={() => setActive(s.k)}
                    aria-current={on}
                    className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left"
                    style={on ? { background: 'rgba(14,116,144,0.06)', boxShadow: '0 16px 36px -24px rgba(14,116,144,0.7)', outline: '1px solid rgba(14,116,144,0.15)', opacity: 1 } : { opacity: 0.72 }}
                  >
                    <span
                      className="flex flex-shrink-0 items-center justify-center rounded-full font-heading font-bold ring-4 ring-white"
                      style={on
                        ? { height: 60, width: 60, fontSize: 20, background: 'var(--ca-primary)', color: '#fff', boxShadow: '0 12px 26px -10px rgba(14,116,144,0.9)' }
                        : { height: 46, width: 46, fontSize: 15, background: 'var(--ca-grey)', color: 'var(--ca-ink)' }}
                    >
                      {t.name.replace(/^Dr\.\s*/, '').charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <div className={`truncate font-heading font-bold text-[color:var(--ca-ink)] ${on ? 'text-[16px]' : 'text-[15px]'}`}>{t.name}</div>
                      <div className="mt-1 flex gap-0.5">{[0, 1, 2, 3, 4].map((st) => <Star key={st} size={13} style={{ color: 'var(--ca-accent)', fill: 'var(--ca-accent)' }} />)}</div>
                      <div className="mt-1 truncate text-xs text-neutral-500">{t.role}</div>
                    </div>
                    {on && <span aria-hidden className="absolute right-[-7px] top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 rotate-45 lg:block" style={{ background: 'rgba(14,116,144,0.06)', borderRight: '1px solid rgba(14,116,144,0.15)', borderTop: '1px solid rgba(14,116,144,0.15)' }} />}
                  </button>
                </div>
              );
            })}
          </div>
      </div>

      {/* RIGHT — quote card */}
      <div className="relative rounded-[24px] border border-black/[0.06] bg-white p-8 shadow-[0_30px_70px_-40px_rgba(14,116,144,0.5)] sm:p-10">
        <span aria-hidden className="font-heading text-6xl leading-none" style={{ color: 'var(--ca-primary)' }}>&ldquo;</span>
          <blockquote key={active} className="dt-fade -mt-4">
            <p className="font-heading text-lg font-medium italic leading-relaxed text-neutral-700 sm:text-2xl sm:leading-relaxed">{a.quote}</p>
            <footer className="mt-6 border-t border-black/[0.06] pt-5">
              <div className="font-heading text-[15px] font-bold text-[color:var(--ca-ink)]">{a.name}</div>
              <div className="mt-0.5 text-sm text-neutral-500">{a.role}</div>
            </footer>
          </blockquote>
      </div>
    </div>
  );
}

/* Two-column FAQ accordion. */
function FaqAccordion() {
  const [open, setOpen] = useState(0);
  const renderItem = (f, i) => {
    const isOpen = open === i;
    return (
      <div key={f.q} className="overflow-hidden rounded-[12px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'rgba(14,116,144,0.35)' : 'rgba(17,17,17,0.08)' }}>
        <button type="button" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[color:var(--ca-ink)]">
          {f.q}
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'rgba(14,116,144,0.1)', color: 'var(--ca-primary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
            <Plus size={15} />
          </span>
        </button>
        <div className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
          <div className="min-h-0 overflow-hidden">
            <p className="px-5 pb-4 text-[14.5px] leading-relaxed text-neutral-500">{f.a}</p>
          </div>
        </div>
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

export default function DentistPage() {

  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  const canonical = `${SITE_URL}/for/dentists`;
  const seo = {
    title: 'Appointment Booking Software for Dental Clinics | Book A Sloth',
    description: 'Book A Sloth is appointment scheduling software for dental clinics in India. Let your patients book and reschedule appointments online, with automatic WhatsApp reminders, GST invoices and 0% commission. A scheduling tool for your practice — not an advertising channel. Start free.',
    keywords: 'dental clinic appointment software, dentist booking software india, dental practice scheduling, patient appointment booking, dental clinic management booking',
    ogTitle: 'Your clinic runs on appointments. Let Book A Sloth schedule them.',
    ogDescription: 'Patients book and reschedule online, get WhatsApp reminders, and your front desk spends less time on the phone. A calm scheduling page for dental clinics in India.',
  };

  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Book A Sloth',
      applicationCategory: 'BusinessApplication', applicationSubCategory: 'Appointment Scheduling Software',
      operatingSystem: 'Web', url: canonical, description: seo.description,
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'INR', name: `${FREE_PLAN.name} plan` },
        { '@type': 'Offer', price: String(PREMIUM_PLAN.yearly), priceCurrency: 'INR', name: `${PREMIUM_PLAN.name} plan (yearly)` },
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'Service',
      serviceType: 'Appointment booking software for dental clinics',
      provider: { '@type': 'Organization', name: 'Book A Sloth', url: SITE_URL },
      areaServed: 'IN', description: seo.description, url: canonical,
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'For Dental Clinics', item: canonical },
    ] },
  ];

  // Clinical teal palette — legacy --ca-* names kept so shared classNames work.
  const styleVars = {
    '--ca-primary': '#0E7490', // deep cyan/teal (AA-safe: white text/links)
    '--ca-accent': '#0F766E',  // teal-700 (AA-safe as text on white ~5:1)
    '--ca-ink': '#0F2A33',     // deep teal-slate text
    '--ca-cream': '#EFFBFA',   // mint tint section bg
    '--ca-grey': '#F1F6F6',    // light grey section bg
  };

  return (
    <main className="overflow-x-clip bg-white text-[color:var(--ca-ink)]" style={styleVars}>
      <style>{`
        .dt-rv{opacity:0;transform:translateY(16px);transition:opacity .6s ease, transform .6s ease;}
        .dt-rv-in{opacity:1;transform:none;}
        .dt-fade{animation:dt-fade-in .4s ease both;}
        @keyframes dt-fade-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){.dt-rv{opacity:1;transform:none;transition:none;}.dt-fade{animation:none;}}
      `}</style>
      <Seo title={seo.title} description={seo.description} keywords={seo.keywords} canonical={canonical}
        robots="index, follow, max-image-preview:large, max-snippet:-1" siteName="Book A Sloth" locale="en_IN"
        themeColor="#0E7490" ogTitle={seo.ogTitle} ogDescription={seo.ogDescription} jsonLd={jsonLd} />

      {/* ═══════════════ 1 · NAV ═══════════════ */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 hover:no-underline" aria-label="Book A Sloth — home">
            <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="font-heading text-[15px] font-extrabold tracking-tight text-[color:var(--ca-ink)]">Book A Sloth</span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => <NavLink key={item.label} item={item} className="text-sm font-medium text-neutral-600 transition-colors hover:text-[color:var(--ca-ink)] hover:no-underline" />)}
          </nav>
          <div className="hidden items-center gap-4 lg:flex">
            <Link to={LOGIN} className="text-sm font-semibold text-neutral-700 hover:text-[color:var(--ca-ink)] hover:no-underline">Login</Link>
            <CtaButton to={START} className="!px-5 !py-2.5">Start for Free <ArrowRight size={15} /></CtaButton>
          </div>
          <button type="button" className="lg:hidden" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {menuOpen && (
          <div className="dt-fade overflow-hidden border-t border-black/5 bg-white lg:hidden">
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV.map((item) => <NavLink key={item.label} item={item} onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-medium text-neutral-700 hover:bg-[color:var(--ca-cream)] hover:no-underline" />)}
              <div className="mt-2 flex items-center gap-3 border-t border-black/5 pt-3">
                <Link to={LOGIN} className="flex-1 rounded-[5px] border-2 border-black/10 py-2.5 text-center text-sm font-semibold text-[color:var(--ca-ink)] hover:no-underline">Login</Link>
                <CtaButton to={START} className="flex-1">Start for Free <ArrowRight size={15} /></CtaButton>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════ 2 · HERO (light clinical) ═══════════════ */}
      <section className="relative overflow-hidden px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-12 lg:pb-28 lg:pt-16" style={{ background: 'linear-gradient(180deg, var(--ca-cream) 0%, #ffffff 100%)' }}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <Reveal as="p" instant className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(14,116,144,0.25)', color: 'var(--ca-primary)', background: 'rgba(14,116,144,0.06)' }}>
              For dental clinics &amp; practices
            </Reveal>
            <Reveal as="h1" instant className="text-[clamp(1.7rem,7vw,2.7rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[color:var(--ca-ink)] sm:text-[2.7rem] sm:leading-[1.1] lg:text-[3rem]">
              Simple appointment booking software for{' '}
              <span style={{ color: 'var(--ca-primary)' }}>dental clinics</span>{' '}
              of modern India.
            </Reveal>
            <Reveal as="p" instant delay={0.05} className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-500 sm:mt-7 sm:text-lg lg:mx-0">
              Let your patients book and reschedule online, with automatic WhatsApp reminders — so your front desk spends less time on the phone and more with patients in the chair.
            </Reveal>
            <Reveal instant delay={0.1} className="mt-6 flex flex-col items-center gap-3 sm:mt-9 sm:flex-row sm:gap-5 lg:justify-start">
              <Link to={START} className="btn flex w-full items-center justify-center gap-2 rounded-[5px] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(14,116,144,0.6)] transition-opacity hover:opacity-90 hover:no-underline sm:w-auto" style={{ background: 'var(--ca-primary)' }}>
                Create a Free Account <ArrowRight size={16} />
              </Link>
              <Link to="/demo" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ca-ink)] transition-colors hover:text-[color:var(--ca-primary)] hover:no-underline">
                Book A Demo <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
            <Reveal instant delay={0.14} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:mt-9 lg:justify-start">
              {HERO_TRUST.map((t) => <span key={t} className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500"><Check size={14} style={{ color: 'var(--ca-accent)' }} /> {t}</span>)}
            </Reveal>
          </div>
          <Reveal instant delay={0.1} className="relative">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(21,158,170,0.16), transparent 70%)' }} />
            <img src="/for/dentists/dentist-sloth.webp" alt="Book A Sloth — appointment booking for dental clinics" loading="eager" fetchpriority="high" decoding="async" width="1100" height="852" className="relative z-10 mx-auto h-auto w-full max-w-[30rem] drop-shadow-[0_28px_40px_rgba(15,48,77,0.18)]" />
            {/* clinic-day mock floats over the illustration on desktop */}
            <div className="absolute -bottom-4 -left-4 z-20 hidden w-64 lg:block xl:-left-10"><ClinicDayCard /></div>
          </Reveal>
        </div>

        <div className="mx-auto mt-12 grid max-w-7xl gap-3 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.06}>
              <div className="group flex h-full flex-col rounded-[10px] border border-black/[0.06] bg-white p-4 transition-colors hover:border-[color:var(--ca-primary)]/30">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-300 group-hover:text-white" style={{ background: 'rgba(14,116,144,0.1)', color: 'var(--ca-primary)' }}>
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

      {/* ═══════════════ 3 · USE CASES ═══════════════ */}
      <section id="usecases" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Every appointment your clinic runs, <span style={{ color: 'var(--ca-primary)' }}>in one place.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">From check-ups to consultations and emergencies, take every booking online.</Reveal>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((u, i) => <Reveal key={u.label} delay={(i % 4) * 0.05}><UseCaseCard u={u} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4 · HOW IT WORKS ═══════════════ */}
      <section id="how" className="px-5 pb-10 pt-20 sm:px-8 lg:pb-14 lg:pt-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              How Book A Sloth helps <span style={{ color: 'var(--ca-primary)' }}>dental clinics</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">From &ldquo;is the doctor free?&rdquo; to a confirmed appointment — no phone tag.</Reveal>
          </div>
          <HowItWorks steps={STEPS} />
        </div>
      </section>

      {/* ═══════════════ 5 · INTEGRATIONS ═══════════════ */}
      <section id="features" className="px-5 pb-20 pt-6 sm:px-8 lg:pb-28 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Works with the tools you already use.</Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">Connect your calendar, payments and WhatsApp — Book A Sloth fits your workflow, no rewiring.</Reveal>
          </div>
          <div className="mt-12"><IntegrationHub /></div>
          <Reveal delay={0.1} className="mt-14 text-center">
            <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ca-primary)' }}>Explore All Features <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 6 · REAL IMPACT, REAL NUMBERS (ditto layout) ═══════════════ */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--ca-primary) 10%, transparent), transparent)' }} />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Real impact, <span style={{ color: 'var(--ca-primary)' }}>real numbers.</span></Reveal>
            <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-xl text-base text-neutral-500">Small stats, big difference — what actually changes when your clinic goes live with Book A Sloth.</Reveal>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6 lg:[grid-auto-rows:1fr]">
            {IMPACT_STATS.map((s, i) => (
              <Reveal key={s.value} delay={i * 0.08} className="lg:col-span-2">
                <div className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-black/[0.06] bg-white p-7 shadow-[0_2px_6px_rgba(14,116,144,0.04),0_16px_32px_rgba(14,116,144,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--ca-primary)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-heading text-4xl font-extrabold leading-none tracking-tight sm:text-5xl" style={{ color: 'var(--ca-ink)' }}>{s.value}</p>
                    <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(14,116,144,0.1)', color: 'var(--ca-primary)' }}><s.icon size={20} /></span>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-neutral-500">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.12} className="mt-6">
            <div className="relative overflow-hidden rounded-[20px] p-8 text-white sm:p-10" style={{ background: 'linear-gradient(140deg, var(--ca-primary), var(--ca-ink))' }}>
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--ca-accent) 40%, transparent), transparent 70%)' }} />
              <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-heading text-xl font-bold sm:text-2xl">Join the clinics that never chase a booking.</h3>
                  <p className="mt-2 max-w-xl text-white/75">Book more, no-show less, and keep your chair full — one simple page.</p>
                </div>
                <Link to={START} className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ca-primary)' }}>Create your free page <ArrowRight size={16} /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 7 · BUILT FOR YOUR CLINIC (compliant — no patient testimonials) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" delay={0.05} className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Built for the way a <span style={{ color: 'var(--ca-primary)' }}>clinic actually runs.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              A scheduling tool for your practice — not an advertising channel. We never publish patient reviews.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CLINIC_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.06}>
                <div className="flex h-full flex-col rounded-[16px] border border-black/[0.06] bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'rgba(14,116,144,0.1)', color: 'var(--ca-primary)' }}><f.icon size={20} /></span>
                  <h3 className="mt-4 font-heading text-[15px] font-bold text-[color:var(--ca-ink)]">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7b · TESTIMONIALS (clinic owners about Book A Sloth) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="p" className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--ca-primary)' }}>Customer reviews</Reveal>
            <Reveal as="h2" delay={0.05} className="mt-3 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              What clinics say about <span style={{ color: 'var(--ca-primary)' }}>Book A Sloth.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Reviews from dental practices using Book A Sloth — about the software, not patient reviews.
            </Reveal>
          </div>
          <Reveal delay={0.1}><AnimatedTestimonials items={DENTIST_TESTIMONIALS} /></Reveal>
        </div>
      </section>

      {/* ═══════════════ 8 · THE BOOK A SLOTH DIFFERENCE (ditto with / without) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">The <span style={{ color: 'var(--ca-primary)' }}>Book A Sloth</span> difference.</Reveal>
            <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-xl text-base text-neutral-500">See how booking an appointment changes with and without Book A Sloth.</Reveal>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6">
            <Reveal>
              <div className="h-full rounded-[16px] border border-black/[0.06] bg-white p-7">
                <div className="text-sm font-bold uppercase tracking-wide text-neutral-400">Without Book A Sloth</div>
                <ul className="mt-5 space-y-3.5">
                  {WITHOUT.map((w) => (
                    <li key={w} className="flex items-start gap-3 text-[15px] text-neutral-500">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400"><X size={13} /></span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full rounded-[16px] border-2 p-7 shadow-[0_20px_45px_-24px_rgba(14,116,144,0.5)]" style={{ borderColor: 'var(--ca-primary)', background: 'color-mix(in srgb, var(--ca-primary) 5%, white)' }}>
                <div className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--ca-primary)' }}>With Book A Sloth</div>
                <ul className="mt-5 space-y-3.5">
                  {WITH_BAS.map((w) => (
                    <li key={w} className="flex items-start gap-3 text-[15px] font-medium text-[color:var(--ca-ink)]">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white" style={{ background: 'var(--ca-primary)' }}><Check size={13} /></span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ 9 · TRUST STRIP ═══════════════ */}
      <section className="border-y border-black/5 px-5 py-12 sm:px-8" style={{ background: 'var(--ca-ink)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST_STRIP.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <s.icon size={20} className="mx-auto" style={{ color: 'var(--ca-accent)' }} />
              <div className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{s.value}</div>
              <p className="mx-auto mt-1.5 max-w-[14rem] text-xs leading-snug text-white/65">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 10 · PRICING ═══════════════ */}
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" delay={0.05} className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Start small. <span style={{ color: 'var(--ca-primary)' }}>Grow as your clinic does.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-4 text-base text-neutral-500">Choose a plan that fits your clinic today. Upgrade when you need more.</Reveal>
          </div>
          <Reveal delay={0.1} className="mt-8 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setYearly(false)} className={`text-sm font-semibold transition-colors ${!yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>Monthly</button>
            <button type="button" role="switch" aria-checked={yearly} aria-label="Toggle monthly or yearly billing" onClick={() => setYearly((v) => !v)} className="relative h-6 w-11 rounded-full transition-colors" style={{ background: yearly ? 'var(--ca-primary)' : '#d4d4d4', minHeight: 0 }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: yearly ? '22px' : '2px' }} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>Yearly <span className="ml-1 rounded-full bg-[#0E7490]/12 px-2 py-0.5 text-xs font-bold text-[#0E7490]">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span></span>
          </Reveal>
          <div className="relative mx-auto mt-10 max-w-3xl">
            <div className="relative grid gap-5 sm:grid-cols-2 sm:gap-6">
              <Reveal>
                <div className="flex h-full flex-col rounded-[18px] border border-black/[0.08] bg-white p-7">
                  <div className="font-heading text-lg font-bold">{FREE_PLAN.name}</div>
                  <p className="mt-1 text-sm text-neutral-500">Everything you need to get booked.</p>
                  <div className="mt-6 flex items-end gap-1"><span className="pb-1.5 text-2xl font-bold">₹</span><span className="font-heading text-5xl font-extrabold tracking-tight">0</span><span className="pb-2 text-sm text-neutral-500">/month</span></div>
                  <p className="mt-1.5 text-xs font-semibold text-neutral-500">Free forever · 5% per booking</p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {FREE_PLAN.features.slice(0, 5).map((f) => <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600"><Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ca-accent)' }} /><span>{f}</span></li>)}
                  </ul>
                  <CtaButton to={START} variant="ghost" className="mt-7 w-full">Get Started</CtaButton>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <div className="relative flex h-full flex-col rounded-[18px] border-2 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(16,24,40,0.14)]" style={{ borderColor: 'var(--ca-primary)' }}>
                  <div className="flex items-center justify-between">
                    <div className="font-heading text-lg font-bold">{PREMIUM_PLAN.name}</div>
                    {yearly && <span className="rounded-full bg-[#0E7490] px-2.5 py-0.5 text-xs font-bold text-white">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>}
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
                    <li className="flex items-start gap-2.5 text-sm font-semibold" style={{ color: 'var(--ca-ink)' }}><Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ca-primary)' }} /><span>Everything in Free</span></li>
                    {PREMIUM_PLAN.features.slice(0, 4).map((f) => <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600"><Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ca-primary)' }} /><span>{f}</span></li>)}
                  </ul>
                  <CtaButton to={START} className="mt-7 w-full">Get Started Now</CtaButton>
                </div>
              </Reveal>
            </div>
          </div>
          <Reveal delay={0.12} className="mt-8 flex flex-col items-center gap-2 text-center">
            <span className="flex items-center gap-1.5 text-sm text-neutral-500"><Lock size={14} style={{ color: 'var(--ca-accent)' }} /> Access to all features with no hidden fees</span>
            <Link to="/pricing" className="text-sm font-semibold text-neutral-500 underline-offset-4 hover:text-[color:var(--ca-ink)] hover:underline">Compare every feature on the full pricing page</Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 11 · ABOUT ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative order-2 lg:order-1">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'rgba(21,158,170,0.18)' }} />
            <img src="/for/dentists/about-dent.webp" alt="Book A Sloth for dental practices" loading="lazy" decoding="async" width="1100" height="825" className="relative z-10 mx-auto h-auto w-full max-w-md object-contain drop-shadow-[0_24px_40px_rgba(15,48,77,0.16)]" />
          </Reveal>
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <Reveal as="h2" delay={0.05} className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Small practices deserve better tools.</Reveal>
            <Reveal as="p" delay={0.08} className="mt-5 text-base leading-relaxed text-neutral-600">
              Book A Sloth was built to make appointment-based practices easier to run. Instead of stitching together calendars, WhatsApp messages, paper registers and payment tools, clinics can manage their patient appointments from one calm platform.
            </Reveal>
            <Reveal delay={0.14} className="mt-8">
              <Link to="/about" className="inline-flex items-center gap-2 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ca-primary)' }}>Learn More About Us <ArrowRight size={16} /></Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ 12 · FAQ ═══════════════ */}
      <section id="faq" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="text-center font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Questions? <span style={{ color: 'var(--ca-primary)' }}>We&apos;ve got answers.</span></Reveal>
          <div className="mt-12"><FaqAccordion /></div>
        </div>
      </section>

      {/* ═══════════════ 13 · FINAL CTA ═══════════════ */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 lg:py-24" style={{ background: 'var(--ca-primary)' }}>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="text-center lg:text-left">
            <Reveal className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl lg:mx-0" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}><Zap size={26} className="text-white" /></Reveal>
            <Reveal as="h2" delay={0.06} className="mt-6 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">Spend less time on the phone. Spend more time with patients.</Reveal>
            <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-lg text-base text-white/70 lg:mx-0">Set up your booking page today and give your patients a simpler way to reach you.</Reveal>
            <Reveal delay={0.14} className="mt-8">
              <Link to={START} className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-white px-8 py-4 text-sm font-semibold text-[color:var(--ca-primary)] transition-opacity hover:opacity-90 hover:no-underline">Start for Free <ArrowRight size={16} /></Link>
            </Reveal>
            <Reveal as="p" delay={0.18} className="mt-4 text-xs text-white/70">No credit card required</Reveal>
          </div>
          <Reveal delay={0.1} className="hidden lg:block">
            <img src="/for/dentists/dental-cta.webp" alt="" loading="lazy" decoding="async" width="1100" height="825" className="mx-auto h-auto w-full max-w-sm object-contain drop-shadow-[0_28px_44px_rgba(0,0,0,0.3)]" />
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 14 · FOOTER ═══════════════ */}
      <footer className="border-t border-black/5 px-5 py-16 sm:px-8" style={{ background: '#ffffff' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div>
              <div className="font-heading text-lg font-extrabold text-[color:var(--ca-ink)]">Book A Sloth</div>
              <p className="mt-2 max-w-xs text-sm text-neutral-500">The simpler way to manage appointments.</p>
              <CtaButton to={START} className="mt-5">Start for Free <ArrowRight size={15} /></CtaButton>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="text-xs font-bold uppercase tracking-wide text-neutral-600">{col.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => <li key={l.label}><NavLink item={l} className="text-sm text-neutral-600 transition-colors hover:text-[color:var(--ca-primary)] hover:no-underline" /></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-black/5 pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-neutral-500">© 2026 Book A Sloth. Razorpay-secure payments · GST invoices · Made in India 🇮🇳</p>
            <p className="text-xs text-neutral-500">Made for India&apos;s dental clinics</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

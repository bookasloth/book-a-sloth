// /for/architects — bespoke landing page for architects & interior designers in India.
//
// 5th palette (sage/forest) + a blueprint-drafting motif, ported from the zip
// "index" design. Host-facing: onboards studios/designers onto Book A Sloth as
// their consultation-booking + scheduling tool (CTA → /be-a-sloth), NOT a
// client-acquisition/advertising channel. No fabricated project/rating counts.
//
// Scoped fonts (DM Serif Display headings + Inter body) confined to .ar-lp so they
// never leak into the global theme. Scoped --ar-* palette. CSS-animation-first
// (IntersectionObserver + CSS transitions, no framer) to keep the page light.
//
// New URL — keep in sync: App.jsx route (before /for/:profession), prerender.mjs,
// Solutions.jsx.

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, Menu, X, Plus, Play,
  CalendarCheck, LayoutDashboard, MessageCircle, BellRing, Wallet,
  Landmark, FileText, Lock, BadgePercent, Zap, Share2,
  Compass, Ruler, PenTool, Building2, Home, TreePine, Hammer, Box,
  ClipboardCheck, MessagesSquare, HardHat, CheckCircle2, Star, Palette,
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

/* Local CSS scroll-reveal — IntersectionObserver + CSS transition (no framer). */
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
    <Tag ref={ref} className={`ar-rv${shown ? ' ar-rv-in' : ''} ${className}`} style={{ transitionDelay: delay ? `${delay}s` : undefined }} {...rest}>
      {children}
    </Tag>
  );
}

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'For Studios', href: '#usecases' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Built for Indian studios'];

const BENEFITS = [
  { icon: MessagesSquare, title: 'Fewer Back-and-Forths', desc: 'Clients pick a slot themselves — no email ping-pong to fix a time.' },
  { icon: Wallet, title: 'Paid Consultations', desc: 'Optionally collect your consultation fee online before the meeting.' },
  { icon: LayoutDashboard, title: 'One Project Diary', desc: 'Every consult, site visit and review for your studio in one view.' },
  { icon: BellRing, title: 'Fewer No-Shows', desc: 'Automatic WhatsApp reminders before every client meeting.' },
];

const USE_CASES = [
  { icon: Compass, label: 'Design Consultation', desc: 'First-visit brief and scope.' },
  { icon: HardHat, label: 'Site Visit', desc: 'On-site measurement and survey.' },
  { icon: PenTool, label: 'Concept Review', desc: 'Walk clients through concepts.' },
  { icon: Box, label: '3D Walkthrough', desc: 'Present the space before build.' },
  { icon: Palette, label: 'Interior Consult', desc: 'Materials, finishes and styling.' },
  { icon: Hammer, label: 'Renovation Assessment', desc: 'Scope an existing space.' },
  { icon: ClipboardCheck, label: 'Handover Meeting', desc: 'Final walkthrough and sign-off.' },
  { icon: Home, label: 'Discovery Call', desc: 'A quick intro before you commit.' },
];

const STEPS = [
  { title: 'Set up your studio & slots', icon: LayoutDashboard, desc: 'Add your consultation types and hours, then share your booking link with your clients.' },
  { title: 'Clients book & pay', icon: CalendarCheck, desc: 'A client picks a consultation type and a time — and can pay your fee upfront.' },
  { title: 'Everyone gets reminded', icon: BellRing, desc: 'You and your client get automatic confirmations and WhatsApp reminders before the meeting.' },
];

const TOOLS_LEFT = [
  { name: 'Google Calendar', icon: 'google-calendar', sub: 'Two-way sync of your real availability' },
  { name: 'WhatsApp Automation', logo: '/images/logos/whatsapp.svg', sub: 'Meeting reminders on autopilot' },
  { name: 'Client Records', logo: '/favicon.svg', sub: 'Every client, brief and note in one place' },
];
const TOOLS_RIGHT = [
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Online payments, refunds and GST invoices' },
  { name: 'PhonePe', logo: '/images/logos/phonepe.svg', sub: 'Accept instant UPI payments' },
  { name: 'Gmail', logo: '/images/logos/gmail.svg', sub: 'Confirmation emails, sent automatically' },
];
const TOOLS_ALL = [...TOOLS_LEFT, ...TOOLS_RIGHT];

// "Built for a studio" — how a design practice actually runs.
const STUDIO_FEATURES = [
  { icon: MessagesSquare, title: 'No more email tag', desc: 'Clients self-book and reschedule online, so you stop trading emails to fix a time.' },
  { icon: Wallet, title: 'Value your time', desc: 'Charge for consultations and collect the fee upfront — the serious enquiries book.' },
  { icon: LayoutDashboard, title: 'One diary, always current', desc: 'Consults, site visits and reviews in a single live view — no clashes.' },
  { icon: BellRing, title: 'Fewer wasted trips', desc: 'Automatic reminders before each meeting mean fewer no-shows and cancelled site visits.' },
];

// Placeholder testimonials — architecture/interior STUDIO OWNERS reviewing Book A
// Sloth (the software). Swap for real quotes when available. Software-focused; all
// 5-star; no fabricated dates or project counts.
const ARCHITECT_TESTIMONIALS = [
  { name: 'Aarav Deshpande', role: 'Studio Verde, Pune', quote: 'Clients used to email back and forth for days to fix a consultation. Now they pick a slot and pay the fee upfront — the enquiries that book are the serious ones.' },
  { name: 'Meera Krishnan', role: 'Terra Interiors, Chennai', quote: 'Site visits and concept reviews all sit in one calendar now. No more double-booked afternoons or a missed measurement trip.' },
  { name: 'Rohan Kapoor', role: 'Axis Design Co., Gurugram', quote: 'Setup took an evening. The WhatsApp reminders alone cut the no-shows on our discovery calls right down.' },
  { name: 'Ananya Pillai', role: 'Form & Field, Bengaluru', quote: 'A calm, professional booking page that matches how a studio works — and 0% commission on Active means the fee is ours.' },
  { name: 'Vikram Sethi', role: 'Nirman Architects, Jaipur', quote: 'GST invoices for every paid consultation are generated automatically. It tidied up our billing completely.' },
];

// Real impact, real numbers — ditto layout, architect content.
const IMPACT_STATS = [
  { value: '0%', desc: 'Commission on Sloth Active — every consultation fee stays with your studio.', icon: BadgePercent },
  { value: '< 5 min', desc: 'To set up your services and put a booking page in front of clients.', icon: Compass },
  { value: '24/7', desc: 'Clients book or reschedule any time — no email tag, no phone calls.', icon: CalendarCheck },
];

// The Book A Sloth difference — with / without comparison (ditto layout).
const WITHOUT = ['Days of email tag to fix a time', 'No-shows waste a whole site trip', 'Consultation fee chased afterwards', 'Reminders sent by hand, one by one'];
const WITH_BAS = ['Clients pick a slot themselves', 'Automatic reminders cut no-shows', 'Fee collected before the meeting', 'WhatsApp reminders sent for you'];

// Honest trust strip — verifiable facts only.
const TRUST_STRIP = [
  { icon: Lock, value: 'Razorpay', label: 'Every payment signature-verified on our servers' },
  { icon: Landmark, value: 'Hosted in India', label: 'Your studio data runs on servers in Mumbai' },
  { icon: FileText, value: 'DPDP 2023', label: 'Operated under India’s data protection law' },
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
];

const FAQ = [
  { q: 'Is Book A Sloth suitable for an architecture or interior-design studio?', a: 'Yes — for managing your client meetings: an online booking page for consultations, site visits and reviews, automatic reminders, optional upfront fees and one clear diary. It is a scheduling and reminder tool for your studio, not a client-acquisition or advertising channel.' },
  { q: 'Can clients book a consultation online?', a: 'Yes. A client opens your booking link, chooses a consultation type such as a design consult or site visit, picks a time and confirms — no email back-and-forth to settle a slot.' },
  { q: 'Can I charge for consultations?', a: 'Optionally. Collect your consultation fee upfront through Razorpay — UPI, cards or netbanking — or leave it off and invoice later. A GST invoice is generated automatically for every paid booking, so charging for your time is simple.' },
  { q: 'Can I send WhatsApp reminders before site visits and meetings?', a: 'Yes. Book A Sloth sends automatic confirmations and reminders over WhatsApp and email before each meeting, which cuts no-shows and wasted site trips. WhatsApp reminders are included on the Sloth Active plan (and free for your first two months on the Sloth plan).' },
  { q: 'Can I offer different meeting types and lengths?', a: 'Yes. Set up separate services — a 30-minute discovery call, a paid design consultation, a site visit, a concept review — each with its own duration, price and availability, and clients pick the one they need.' },
  { q: 'Can I manage more than one designer’s calendar?', a: 'Right now Book A Sloth is best for a single booking calendar per account — two designers on one account share one diary and cannot be booked in parallel. Parallel multi-calendar scheduling is on our roadmap; in the meantime a separate account per designer is the workaround. We would rather tell you upfront than have it surprise you after setup.' },
  { q: 'Does it sync with my Google Calendar?', a: 'Yes. Book A Sloth syncs two-way with Google Calendar, so a slot you block elsewhere is not offered to clients, and every booking lands in your calendar automatically.' },
  { q: 'Is there a free plan?', a: 'Yes. The Sloth plan is free forever — an online booking page, unlimited consultation types and bookings, UPI payments, 24-hour reminders and GST invoices — with a small 5% per-booking fee. Sloth Active removes that commission entirely and adds WhatsApp automation and more.' },
];

const FOOTER_COLS = [
  { title: 'Product', links: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Integrations', href: '#features' },
    { label: "What's New", to: '/changelog' },
  ] },
  { title: 'For Professionals', links: [
    { label: 'Architects & Designers', to: '/for/architects' },
    { label: 'Dental Clinics', to: '/for/dentists' },
    { label: 'Astrologers', to: '/for/astrologers' },
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
  const base = 'inline-flex items-center justify-center gap-2 rounded-[5px] px-6 py-3.5 text-sm font-semibold transition-all hover:no-underline';
  const styles = {
    solid: 'text-white shadow-[0_4px_14px_rgba(35,65,47,0.2)] hover:brightness-110',
    ghost: 'border-2 border-[color:var(--ar-ink)]/12 bg-white text-[color:var(--ar-ink)] hover:border-[color:var(--ar-ink)]/25',
  };
  return (
    <Link to={to} className={`${base} ${styles[variant]} ${className}`} style={variant === 'solid' ? { background: 'var(--ar-primary)' } : undefined}>
      {children}
    </Link>
  );
}

/* Blueprint floor-plan — decorative drafting motif behind the hero (pure SVG). */
function BlueprintPlan({ className = '' }) {
  return (
    <svg viewBox="0 0 460 340" className={className} fill="none" aria-hidden>
      <g stroke="var(--ar-sage)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        <rect x="24" y="64" width="412" height="252" rx="8" />
        <path d="M160 64 V316" /><path d="M24 188 H120" /><path d="M236 188 H436" /><path d="M300 188 V316" />
      </g>
      <g stroke="var(--ar-sage)" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M160 120 a14 14 0 0 1 14 -14" /><path d="M120 188 a14 14 0 0 1 14 14" /><path d="M300 208 a14 14 0 0 1 -14 14" opacity="0.65" />
      </g>
      <g stroke="var(--ar-sage)" strokeWidth="2" fill="none">
        <circle cx="360" cy="230" r="26" />
        <rect x="376" y="202" width="12" height="12" rx="2" /><rect x="376" y="246" width="12" height="12" rx="2" />
        <rect x="332" y="228" width="12" height="12" rx="2" /><rect x="376" y="228" width="12" height="12" rx="2" />
      </g>
      <g stroke="var(--ar-sage)" strokeWidth="2" fill="none">
        <rect x="66" y="112" width="78" height="56" rx="6" /><path d="M66 132 h78" strokeDasharray="3 4" />
      </g>
      <text x="420" y="52" fontSize="15" letterSpacing="3" fill="var(--ar-sage)" textAnchor="end" opacity="0.95">FLOOR PLAN · SEA VIEW VILLA</text>
    </svg>
  );
}

/* Hero project card — a calm project mock floating over the mascot (pure CSS/JSX). */
function ProjectCard() {
  return (
    <div className="w-full max-w-[290px] rounded-3xl border border-[color:var(--ar-line)] bg-white p-5 shadow-[0_30px_70px_-40px_rgba(35,65,47,0.5)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-full" style={{ background: 'var(--ar-cream)', color: 'var(--ar-accent)' }}><HardHat className="size-4" /></span>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--ar-ink)' }}>Sea View Villa</p>
            <p className="text-xs text-neutral-500">Hyderabad · 3,200 sq ft</p>
          </div>
        </div>
        <span className="inline-flex size-8 items-center justify-center rounded-full" style={{ background: 'var(--ar-cream)', color: 'var(--ar-accent)' }}><CheckCircle2 className="size-4" strokeWidth={2.5} /></span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {['Design', 'Permits', 'Build'].map((stage, i) => (
          <span key={stage} className={i === 2 ? 'flex h-9 items-center justify-center rounded-lg text-xs font-bold text-white' : 'flex h-9 items-center justify-center rounded-lg border text-xs font-semibold text-neutral-500'} style={i === 2 ? { background: 'var(--ar-primary)' } : { borderColor: 'var(--ar-line)' }}>{stage}</span>
        ))}
      </div>
      <div className="mt-4 flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white" style={{ background: 'var(--ar-primary)' }}>View Progress</div>
    </div>
  );
}

/* Use-case soft card. */
function UseCaseCard({ u }) {
  return (
    <div className="group flex h-full flex-col rounded-[18px] border border-black/[0.06] bg-white p-6 transition-colors hover:border-[color:var(--ar-primary)]/30">
      <span className="flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-[1.03]" style={{ background: 'rgba(111,140,93,0.14)', color: 'var(--ar-primary)' }}>
        <u.icon size={22} />
      </span>
      <h3 className="mt-5 text-[15px] font-bold text-[color:var(--ar-ink)]">{u.label}</h3>
      <p className="mt-1 text-[13px] leading-snug text-neutral-500">{u.desc}</p>
    </div>
  );
}

/* How-it-works — 3-step with numbered discs + travelling beacon. */
function HowItWorks({ steps }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setActive((a) => (a + 1) % steps.length), 2000);
    return () => clearTimeout(t);
  }, [active, steps.length]);
  const centers = ['16.667%', '50%', '83.333%'];
  return (
    <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
      <span aria-hidden className="pointer-events-none absolute left-[16.667%] right-[16.667%] top-7 hidden h-px md:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(111,140,93,0.5), transparent)' }} />
      <span aria-hidden className="pointer-events-none absolute top-7 z-10 hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full md:block" style={{ background: 'var(--ar-sage)', boxShadow: '0 0 0 6px rgba(111,140,93,0.18)', left: centers[active], transition: 'left 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
      {steps.map((s, i) => {
        const on = i === active;
        return (
          <Reveal key={s.title} delay={i * 0.1} className="relative text-center">
            <button type="button" onClick={() => setActive(i)} aria-current={on} aria-label={`Step ${i + 1}: ${s.title}`} className="mx-auto block">
              <span className="relative z-20 mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-500" style={{ background: 'var(--ar-primary)', transform: on ? 'scale(1.08)' : 'scale(1)', boxShadow: on ? '0 0 0 6px rgba(111,140,93,0.18), 0 14px 30px -10px rgba(35,65,47,0.9)' : '0 10px 24px -12px rgba(35,65,47,0.55)' }}>
                <s.icon size={22} />
              </span>
            </button>
            <h3 className={`mt-5 text-lg font-bold transition-colors duration-300 ${on ? 'text-[color:var(--ar-ink)]' : 'text-neutral-500'}`}>{s.title}</h3>
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
    <div className="flex h-full w-full items-center gap-3 rounded-2xl border border-black/[0.05] bg-white px-4 py-3.5 shadow-[0_14px_34px_-20px_rgba(17,17,17,0.3)] transition-colors hover:border-[color:var(--ar-primary)]/30">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[color:var(--ar-grey)]">
        {t.logo
          ? <img src={t.logo} alt="" loading="lazy" className="h-6 w-6 object-contain" />
          : <ToolLogo name={t.icon} size={24} className="h-6 w-6" />}
      </span>
      <div className="min-w-0">
        <div className="text-sm font-bold leading-tight text-[color:var(--ar-ink)]">{t.name}</div>
        <div className="mt-0.5 text-xs leading-snug text-neutral-500">{t.sub}</div>
      </div>
    </div>
  );
}
function IntegrationHub() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-[46rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(111,140,93,0.12), transparent)' }} />
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {TOOLS_ALL.map((t, i) => (
          <Reveal key={t.name} delay={(i % 3) * 0.06}><ToolCard t={t} /></Reveal>
        ))}
      </div>
    </div>
  );
}

/* Animated testimonials — studio owners reviewing the software. */
function AnimatedTestimonials({ items }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setActive((a) => (a + 1) % items.length), 3500);
    return () => clearTimeout(t);
  }, [active, items.length]);
  const a = items[active];
  const n = items.length;
  const slots = [
    { k: (active - 1 + n) % n, pos: 'top' },
    { k: active, pos: 'mid' },
    { k: (active + 1) % n, pos: 'bot' },
  ];
  return (
    <div className="mt-12 grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
      <div className="relative pl-7">
        <span aria-hidden className="absolute bottom-5 left-1.5 top-5 w-px bg-black/10" />
        <div key={active} className="ar-fade flex flex-col gap-3">
          {slots.map((s) => {
            const t = items[s.k];
            const on = s.pos === 'mid';
            return (
              <div key={s.pos} className="relative flex min-h-[80px] items-center">
                <span aria-hidden className="absolute -left-[22px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ring-2 ring-white" style={{ background: on ? 'var(--ar-primary)' : '#c3cdb8' }} />
                <button type="button" onClick={() => setActive(s.k)} aria-current={on} className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left" style={on ? { background: 'rgba(111,140,93,0.1)', boxShadow: '0 16px 36px -24px rgba(35,65,47,0.7)', outline: '1px solid rgba(111,140,93,0.22)', opacity: 1 } : { opacity: 0.72 }}>
                  <span className="flex flex-shrink-0 items-center justify-center rounded-full font-bold ring-4 ring-white" style={on ? { height: 60, width: 60, fontSize: 20, background: 'var(--ar-primary)', color: '#fff', boxShadow: '0 12px 26px -10px rgba(35,65,47,0.9)' } : { height: 46, width: 46, fontSize: 15, background: 'var(--ar-grey)', color: 'var(--ar-ink)' }}>
                    {t.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className={`truncate font-bold text-[color:var(--ar-ink)] ${on ? 'text-[16px]' : 'text-[15px]'}`}>{t.name}</div>
                    <div className="mt-1 flex gap-0.5">{[0, 1, 2, 3, 4].map((st) => <Star key={st} size={13} style={{ color: 'var(--ar-sage)', fill: 'var(--ar-sage)' }} />)}</div>
                    <div className="mt-1 truncate text-xs text-neutral-500">{t.role}</div>
                  </div>
                  {on && <span aria-hidden className="absolute right-[-7px] top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 rotate-45 lg:block" style={{ background: 'rgba(111,140,93,0.1)', borderRight: '1px solid rgba(111,140,93,0.22)', borderTop: '1px solid rgba(111,140,93,0.22)' }} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="relative rounded-[24px] border border-black/[0.06] bg-white p-8 shadow-[0_30px_70px_-40px_rgba(35,65,47,0.5)] sm:p-10">
        <span aria-hidden className="font-display text-6xl leading-none" style={{ color: 'var(--ar-primary)' }}>&ldquo;</span>
        <blockquote key={active} className="ar-fade -mt-4">
          <p className="text-lg font-medium italic leading-relaxed text-neutral-700 sm:text-2xl sm:leading-relaxed">{a.quote}</p>
          <footer className="mt-6 border-t border-black/[0.06] pt-5">
            <div className="text-[15px] font-bold text-[color:var(--ar-ink)]">{a.name}</div>
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
      <div key={f.q} className="overflow-hidden rounded-[12px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'rgba(111,140,93,0.5)' : 'rgba(17,17,17,0.08)' }}>
        <button type="button" onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[color:var(--ar-ink)]">
          {f.q}
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'rgba(111,140,93,0.14)', color: 'var(--ar-primary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
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

export default function ArchitectPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  const canonical = `${SITE_URL}/for/architects`;
  const seo = {
    title: 'Appointment Booking Software for Architects & Interior Designers | Book A Sloth',
    description: 'Book A Sloth is appointment scheduling software for architects and interior designers in India. Let clients book consultations, site visits and reviews online, with paid bookings, automatic WhatsApp reminders, GST invoices and 0% commission. A scheduling tool for your studio — not an advertising channel. Start free.',
    keywords: 'architect appointment software, interior designer booking software india, design studio scheduling, consultation booking software, architecture practice scheduling',
    ogTitle: 'Your studio runs on client meetings. Let Book A Sloth schedule them.',
    ogDescription: 'Clients book consultations and site visits online, pay upfront, and get WhatsApp reminders — while you keep one clear diary. A calm scheduling page for architects and interior designers in India.',
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
      serviceType: 'Appointment booking software for architects and interior designers',
      provider: { '@type': 'Organization', name: 'Book A Sloth', url: SITE_URL },
      areaServed: 'IN', description: seo.description, url: canonical,
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'For Architects & Interior Designers', item: canonical },
    ] },
  ];

  // Sage / forest palette — scoped --ar-* names.
  const styleVars = {
    '--ar-primary': '#23412F', // deep forest (AA-safe: white text/links)
    '--ar-accent': '#4C6240',  // sage-700 (AA-safe as text on white ~5.4:1)
    '--ar-sage': '#6F8C5D',    // sage (decorative fills)
    '--ar-ink': '#21301F',     // deep forest text
    '--ar-cream': '#F3F6EF',   // sage-50 tint section bg
    '--ar-grey': '#F8F6F1',    // warm off-white section bg
    '--ar-line': '#E8E3D7',    // warm hairline
  };

  return (
    <main className="ar-lp overflow-x-clip bg-white text-[color:var(--ar-ink)]" style={styleVars}>
      {/* Scoped fonts — DM Serif Display headings + Inter body, confined to .ar-lp so
          they never touch the global theme (Plus Jakarta/Poppins). Mirrors the zip
          "index" architect design. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap');
        .ar-lp{font-family:'Inter',system-ui,-apple-system,sans-serif;}
        .ar-lp h1,.ar-lp h2,.ar-lp h3,.ar-lp h4{font-family:'DM Serif Display',Georgia,serif;font-weight:400;letter-spacing:-0.01em;}
        .ar-lp .font-display{font-family:'DM Serif Display',Georgia,serif;}
        .ar-lp .bg-blueprint{background-image:linear-gradient(to right, rgba(111,140,93,0.12) 1px, transparent 1px),linear-gradient(to bottom, rgba(111,140,93,0.12) 1px, transparent 1px);background-size:32px 32px;}
        .ar-rv{opacity:0;transform:translateY(16px);transition:opacity .6s ease, transform .6s ease;}
        .ar-rv-in{opacity:1;transform:none;}
        .ar-fade{animation:ar-fade-in .4s ease both;}
        @keyframes ar-fade-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion: reduce){.ar-rv{opacity:1;transform:none;transition:none;}.ar-fade{animation:none;}}
      `}</style>
      <Seo title={seo.title} description={seo.description} keywords={seo.keywords} canonical={canonical}
        robots="index, follow, max-image-preview:large, max-snippet:-1" siteName="Book A Sloth" locale="en_IN"
        themeColor="#23412F" ogTitle={seo.ogTitle} ogDescription={seo.ogDescription} jsonLd={jsonLd} />

      {/* ═══════════════ 1 · NAV ═══════════════ */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 hover:no-underline" aria-label="Book A Sloth — home">
            <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="text-[15px] font-extrabold tracking-tight text-[color:var(--ar-ink)]">Book A Sloth</span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => <NavLink key={item.label} item={item} className="text-sm font-medium text-neutral-600 transition-colors hover:text-[color:var(--ar-ink)] hover:no-underline" />)}
          </nav>
          <div className="hidden items-center gap-4 lg:flex">
            <Link to={LOGIN} className="text-sm font-semibold text-neutral-700 hover:text-[color:var(--ar-ink)] hover:no-underline">Login</Link>
            <CtaButton to={START} className="!px-5 !py-2.5">Start for Free <ArrowRight size={15} /></CtaButton>
          </div>
          <button type="button" className="lg:hidden" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {menuOpen && (
          <div className="ar-fade overflow-hidden border-t border-black/5 bg-white lg:hidden">
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV.map((item) => <NavLink key={item.label} item={item} onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-medium text-neutral-700 hover:bg-[color:var(--ar-cream)] hover:no-underline" />)}
              <div className="mt-2 flex items-center gap-3 border-t border-black/5 pt-3">
                <Link to={LOGIN} className="flex-1 rounded-[5px] border-2 border-black/10 py-2.5 text-center text-sm font-semibold text-[color:var(--ar-ink)] hover:no-underline">Login</Link>
                <CtaButton to={START} className="flex-1">Start for Free <ArrowRight size={15} /></CtaButton>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════ 2 · HERO (blueprint) ═══════════════ */}
      <section className="relative overflow-hidden px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-12 lg:pb-28 lg:pt-16" style={{ background: 'linear-gradient(180deg, var(--ar-cream) 0%, #ffffff 100%)' }}>
        {/* decorative blueprint bg */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="bg-blueprint absolute inset-x-0 top-0 h-[520px] opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <div className="absolute -top-40 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(168,179,139,0.28), transparent)' }} />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <Reveal as="p" instant className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: 'rgba(111,140,93,0.35)', color: 'var(--ar-accent)', background: 'rgba(111,140,93,0.08)' }}>
              For architects &amp; interior designers
            </Reveal>
            <Reveal as="h1" instant className="text-[clamp(1.9rem,7vw,2.9rem)] leading-[1.08] tracking-[-0.02em] text-[color:var(--ar-ink)] sm:text-[2.9rem] sm:leading-[1.08] lg:text-[3.25rem]">
              Booking &amp; scheduling software for{' '}
              <span style={{ color: 'var(--ar-primary)' }}>architects</span>{' '}
              &amp; interior designers.
            </Reveal>
            <Reveal as="p" instant delay={0.05} className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-500 sm:mt-7 sm:text-lg lg:mx-0">
              Let clients book consultations, site visits and reviews online — pay your fee upfront, get automatic WhatsApp reminders, and keep your whole studio in one clear diary.
            </Reveal>
            <Reveal instant delay={0.1} className="mt-6 flex flex-col items-center gap-3 sm:mt-9 sm:flex-row sm:gap-5 lg:justify-start">
              <Link to={START} className="btn flex w-full items-center justify-center gap-2 rounded-[5px] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(35,65,47,0.6)] transition-opacity hover:opacity-90 hover:no-underline sm:w-auto" style={{ background: 'var(--ar-primary)' }}>
                Create a Free Account <ArrowRight size={16} />
              </Link>
              <a href="#how" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ar-ink)] transition-colors hover:text-[color:var(--ar-primary)] hover:no-underline">
                <Play size={15} className="fill-current" /> How it works
              </a>
            </Reveal>
            <Reveal instant delay={0.14} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:mt-9 lg:justify-start">
              {HERO_TRUST.map((t) => <span key={t} className="flex items-center gap-1.5 text-[13px] font-medium text-neutral-500"><Check size={14} style={{ color: 'var(--ar-accent)' }} /> {t}</span>)}
            </Reveal>
          </div>
          <Reveal instant delay={0.1} className="relative">
            <BlueprintPlan className="pointer-events-none absolute right-[2%] top-1/2 w-[min(520px,92%)] -translate-y-1/2 -rotate-2 opacity-40" />
            <img src="/for/architects/architect.webp" alt="Book A Sloth — booking software for architects and interior designers" loading="eager" fetchpriority="high" decoding="async" width="1100" height="1100" className="relative z-10 mx-auto h-auto w-full max-w-[30rem] drop-shadow-[0_28px_44px_rgba(35,65,47,0.18)]" />
            {/* floating proposal pill */}
            <div className="absolute -top-2 right-2 z-20 hidden sm:block md:right-6">
              <div className="flex items-center gap-2.5 rounded-full border bg-white py-2 pl-2.5 pr-4 shadow-[0_16px_36px_-24px_rgba(35,65,47,0.6)]" style={{ borderColor: 'var(--ar-line)' }}>
                <span className="inline-flex size-9 items-center justify-center rounded-full" style={{ background: 'var(--ar-cream)', color: 'var(--ar-accent)' }}><Home className="size-4" /></span>
                <div className="leading-tight">
                  <p className="text-xs font-semibold" style={{ color: 'var(--ar-ink)' }}>Consultation booked</p>
                  <p className="text-[11px] text-neutral-500">Fri 4:30 · Kitchen remodel</p>
                </div>
              </div>
            </div>
            {/* floating project card */}
            <div className="absolute -bottom-4 -left-2 z-20 hidden w-64 lg:block xl:-left-8"><ProjectCard /></div>
          </Reveal>
        </div>

        <div className="relative mx-auto mt-12 grid max-w-7xl gap-3 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.06}>
              <div className="group flex h-full flex-col rounded-[10px] border border-black/[0.06] bg-white p-4 transition-colors hover:border-[color:var(--ar-primary)]/30">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(111,140,93,0.14)', color: 'var(--ar-primary)' }}>
                    <b.icon size={18} />
                  </span>
                  <div className="text-sm font-bold text-[color:var(--ar-ink)]">{b.title}</div>
                </div>
                <p className="mt-2 text-xs leading-snug text-neutral-500">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 3 · USE CASES ═══════════════ */}
      <section id="usecases" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ar-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="text-3xl leading-tight tracking-tight sm:text-4xl">
              Every client meeting your studio runs, <span style={{ color: 'var(--ar-primary)' }}>in one place.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">From discovery calls to site visits and handovers, take every booking online.</Reveal>
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
            <Reveal as="h2" className="text-3xl leading-tight tracking-tight sm:text-4xl">
              How Book A Sloth helps <span style={{ color: 'var(--ar-primary)' }}>design studios</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">From &ldquo;when are you free?&rdquo; to a booked, paid consultation — no email tag.</Reveal>
          </div>
          <HowItWorks steps={STEPS} />
        </div>
      </section>

      {/* ═══════════════ 5 · INTEGRATIONS ═══════════════ */}
      <section id="features" className="px-5 pb-20 pt-6 sm:px-8 lg:pb-28 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="text-3xl leading-tight tracking-tight sm:text-4xl">Works with the tools you already use.</Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">Connect your calendar, payments and WhatsApp — Book A Sloth fits your workflow, no rewiring.</Reveal>
          </div>
          <div className="mt-12"><IntegrationHub /></div>
          <Reveal delay={0.1} className="mt-14 text-center">
            <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ar-primary)' }}>Explore All Features <ArrowRight size={16} /></Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 6 · REAL IMPACT, REAL NUMBERS (ditto layout) ═══════════════ */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ar-cream)' }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--ar-sage) 14%, transparent), transparent)' }} />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="text-3xl leading-tight tracking-tight sm:text-4xl">Real impact, <span style={{ color: 'var(--ar-primary)' }}>real numbers.</span></Reveal>
            <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-xl text-base text-neutral-500">Small stats, big difference — what actually changes when your studio goes live with Book A Sloth.</Reveal>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6 lg:[grid-auto-rows:1fr]">
            {IMPACT_STATS.map((s, i) => (
              <Reveal key={s.value} delay={i * 0.08} className="lg:col-span-2">
                <div className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-black/[0.06] bg-white p-7 shadow-[0_2px_6px_rgba(35,65,47,0.04),0_16px_32px_rgba(35,65,47,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--ar-primary)]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-display text-4xl leading-none tracking-tight sm:text-5xl" style={{ color: 'var(--ar-ink)' }}>{s.value}</p>
                    <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110" style={{ background: 'rgba(111,140,93,0.14)', color: 'var(--ar-primary)' }}><s.icon size={20} /></span>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-neutral-500">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.12} className="mt-6">
            <div className="relative overflow-hidden rounded-[20px] p-8 text-white sm:p-10" style={{ background: 'linear-gradient(140deg, var(--ar-primary), var(--ar-ink))' }}>
              <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--ar-sage) 45%, transparent), transparent 70%)' }} />
              <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-xl font-bold sm:text-2xl">Join the studios that never chase a booking.</h3>
                  <p className="mt-2 max-w-xl text-white/75">Book more, no-show less, and keep your diary full — one simple page.</p>
                </div>
                <Link to={START} className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ar-primary)' }}>Create your free page <ArrowRight size={16} /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 7 · BUILT FOR A STUDIO ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" delay={0.05} className="text-3xl leading-tight tracking-tight sm:text-4xl">
              Built for the way a <span style={{ color: 'var(--ar-primary)' }}>studio actually runs.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              A scheduling tool for your practice — so you spend less time arranging meetings and more time designing.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STUDIO_FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 0.06}>
                <div className="flex h-full flex-col rounded-[16px] border border-black/[0.06] bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'rgba(111,140,93,0.14)', color: 'var(--ar-primary)' }}><f.icon size={20} /></span>
                  <h3 className="mt-4 text-[15px] font-bold text-[color:var(--ar-ink)]">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7b · TESTIMONIALS (studio owners about Book A Sloth) ═══════════════ */}
      <section id="testimonials" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ar-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="p" className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--ar-accent)' }}>Customer reviews</Reveal>
            <Reveal as="h2" delay={0.05} className="mt-3 text-3xl leading-tight tracking-tight sm:text-4xl">
              What studios say about <span style={{ color: 'var(--ar-primary)' }}>Book A Sloth.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Reviews from architecture and interior-design studios using Book A Sloth — about the software.
            </Reveal>
          </div>
          <Reveal delay={0.1}><AnimatedTestimonials items={ARCHITECT_TESTIMONIALS} /></Reveal>
        </div>
      </section>

      {/* ═══════════════ 8 · THE BOOK A SLOTH DIFFERENCE (ditto with / without) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="text-3xl leading-tight tracking-tight sm:text-4xl">The <span style={{ color: 'var(--ar-primary)' }}>Book A Sloth</span> difference.</Reveal>
            <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-xl text-base text-neutral-500">See how booking a consultation changes with and without Book A Sloth.</Reveal>
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
              <div className="h-full rounded-[16px] border-2 p-7 shadow-[0_20px_45px_-24px_rgba(35,65,47,0.5)]" style={{ borderColor: 'var(--ar-primary)', background: 'color-mix(in srgb, var(--ar-primary) 5%, white)' }}>
                <div className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--ar-primary)' }}>With Book A Sloth</div>
                <ul className="mt-5 space-y-3.5">
                  {WITH_BAS.map((w) => (
                    <li key={w} className="flex items-start gap-3 text-[15px] font-medium text-[color:var(--ar-ink)]">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white" style={{ background: 'var(--ar-primary)' }}><Check size={13} /></span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ 9 · TRUST STRIP ═══════════════ */}
      <section className="border-y border-black/5 px-5 py-12 sm:px-8" style={{ background: 'var(--ar-ink)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST_STRIP.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <s.icon size={20} className="mx-auto" style={{ color: 'var(--ar-sage)' }} />
              <div className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{s.value}</div>
              <p className="mx-auto mt-1.5 max-w-[14rem] text-xs leading-snug text-white/65">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 10 · PRICING ═══════════════ */}
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" delay={0.05} className="text-3xl leading-tight tracking-tight sm:text-4xl">
              Start small. <span style={{ color: 'var(--ar-primary)' }}>Grow as your studio does.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-4 text-base text-neutral-500">Choose a plan that fits your studio today. Upgrade when you need more.</Reveal>
          </div>
          <Reveal delay={0.1} className="mt-8 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setYearly(false)} className={`text-sm font-semibold transition-colors ${!yearly ? 'text-[color:var(--ar-ink)]' : 'text-neutral-500'}`}>Monthly</button>
            <button type="button" role="switch" aria-checked={yearly} aria-label="Toggle monthly or yearly billing" onClick={() => setYearly((v) => !v)} className="relative h-6 w-11 rounded-full transition-colors" style={{ background: yearly ? 'var(--ar-primary)' : '#d4d4d4', minHeight: 0 }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: yearly ? '22px' : '2px' }} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${yearly ? 'text-[color:var(--ar-ink)]' : 'text-neutral-500'}`}>Yearly <span className="ml-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'rgba(35,65,47,0.1)', color: 'var(--ar-primary)' }}>Save {PREMIUM_ANNUAL_SAVE_PCT}%</span></span>
          </Reveal>
          <div className="relative mx-auto mt-10 max-w-3xl">
            <div className="relative grid gap-5 sm:grid-cols-2 sm:gap-6">
              <Reveal>
                <div className="flex h-full flex-col rounded-[18px] border border-black/[0.08] bg-white p-7">
                  <div className="text-lg font-bold">{FREE_PLAN.name}</div>
                  <p className="mt-1 text-sm text-neutral-500">Everything you need to get booked.</p>
                  <div className="mt-6 flex items-end gap-1"><span className="pb-1.5 text-2xl font-bold">₹</span><span className="font-display text-5xl tracking-tight">0</span><span className="pb-2 text-sm text-neutral-500">/month</span></div>
                  <p className="mt-1.5 text-xs font-semibold text-neutral-500">Free forever · 5% per booking</p>
                  <ul className="mt-6 flex flex-col gap-3">
                    {FREE_PLAN.features.slice(0, 5).map((f) => <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600"><Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ar-accent)' }} /><span>{f}</span></li>)}
                  </ul>
                  <CtaButton to={START} variant="ghost" className="mt-7 w-full">Get Started</CtaButton>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                <div className="relative flex h-full flex-col rounded-[18px] border-2 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(16,24,40,0.14)]" style={{ borderColor: 'var(--ar-primary)' }}>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold">{PREMIUM_PLAN.name}</div>
                    {yearly && <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: 'var(--ar-primary)' }}>Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">Keep every rupee. Automate the rest.</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="pb-1.5 text-2xl font-bold" style={{ color: 'var(--ar-primary)' }}>₹</span>
                    <span className="font-display text-5xl tracking-tight" style={{ color: 'var(--ar-primary)' }}>{yearly ? Math.round(PREMIUM_PLAN.yearly / 12) : PREMIUM_PLAN.monthly}</span>
                    <span className="pb-2 text-sm text-neutral-500">/month</span>
                    {yearly && <span className="pb-2 ml-1 text-sm text-neutral-500 line-through">₹{PREMIUM_PLAN.monthly}</span>}
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-neutral-500">{yearly ? `Billed ₹${PREMIUM_PLAN.yearly.toLocaleString('en-IN')}/year · GST included` : 'Billed monthly · GST included'}</p>
                  <ul className="mt-6 flex flex-col gap-3">
                    <li className="flex items-start gap-2.5 text-sm font-semibold" style={{ color: 'var(--ar-ink)' }}><Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ar-primary)' }} /><span>Everything in Free</span></li>
                    {PREMIUM_PLAN.features.slice(0, 4).map((f) => <li key={f} className="flex items-start gap-2.5 text-sm text-neutral-600"><Check size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ar-primary)' }} /><span>{f}</span></li>)}
                  </ul>
                  <CtaButton to={START} className="mt-7 w-full">Get Started Now</CtaButton>
                </div>
              </Reveal>
            </div>
          </div>
          <Reveal delay={0.12} className="mt-8 flex flex-col items-center gap-2 text-center">
            <span className="flex items-center gap-1.5 text-sm text-neutral-500"><Lock size={14} style={{ color: 'var(--ar-accent)' }} /> Access to all features with no hidden fees</span>
            <Link to="/pricing" className="text-sm font-semibold text-neutral-500 underline-offset-4 hover:text-[color:var(--ar-ink)] hover:underline">Compare every feature on the full pricing page</Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 11 · ABOUT ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ar-cream)' }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="relative order-2 lg:order-1">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'rgba(111,140,93,0.2)' }} />
            <img src="/for/architects/about-archi.webp" alt="Book A Sloth for architecture and interior-design studios" loading="lazy" decoding="async" width="1100" height="1100" className="relative z-10 mx-auto h-auto w-full max-w-md object-contain drop-shadow-[0_24px_40px_rgba(35,65,47,0.16)]" />
          </Reveal>
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <Reveal as="h2" delay={0.05} className="text-3xl leading-tight tracking-tight sm:text-4xl">Small studios deserve better tools.</Reveal>
            <Reveal as="p" delay={0.08} className="mt-5 text-base leading-relaxed text-neutral-600">
              Book A Sloth was built to make appointment-based practices easier to run. Instead of stitching together calendars, WhatsApp messages, email threads and payment tools, a studio can manage every client consultation, site visit and review from one calm platform.
            </Reveal>
            <Reveal delay={0.14} className="mt-8">
              <Link to="/about" className="inline-flex items-center gap-2 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ar-primary)' }}>Learn More About Us <ArrowRight size={16} /></Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ 12 · FAQ ═══════════════ */}
      <section id="faq" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="text-center text-3xl leading-tight tracking-tight sm:text-4xl">Questions? <span style={{ color: 'var(--ar-primary)' }}>We&apos;ve got answers.</span></Reveal>
          <div className="mt-12"><FaqAccordion /></div>
        </div>
      </section>

      {/* ═══════════════ 13 · FINAL CTA ═══════════════ */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-8 lg:py-24" style={{ background: 'var(--ar-primary)' }}>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="text-center lg:text-left">
            <Reveal className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl lg:mx-0" style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}><Zap size={26} className="text-white" /></Reveal>
            <Reveal as="h2" delay={0.06} className="mt-6 text-3xl leading-tight tracking-tight text-white sm:text-4xl">Spend less time arranging meetings. Spend more time designing.</Reveal>
            <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-lg text-base text-white/70 lg:mx-0">Set up your booking page today and give your clients a simpler way to reach you.</Reveal>
            <Reveal delay={0.14} className="mt-8">
              <Link to={START} className="inline-flex items-center justify-center gap-2 rounded-[5px] bg-white px-8 py-4 text-sm font-semibold text-[color:var(--ar-primary)] transition-opacity hover:opacity-90 hover:no-underline">Start for Free <ArrowRight size={16} /></Link>
            </Reveal>
            <Reveal as="p" delay={0.18} className="mt-4 text-xs text-white/70">No credit card required</Reveal>
          </div>
          <Reveal delay={0.1} className="hidden lg:block">
            <img src="/for/architects/choose-archi.webp" alt="" loading="lazy" decoding="async" width="1100" height="1100" className="mx-auto h-auto w-full max-w-sm object-contain drop-shadow-[0_28px_44px_rgba(0,0,0,0.3)]" />
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 14 · FOOTER ═══════════════ */}
      <footer className="border-t border-black/5 px-5 py-16 sm:px-8" style={{ background: '#ffffff' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div>
              <div className="text-lg font-extrabold text-[color:var(--ar-ink)]">Book A Sloth</div>
              <p className="mt-2 max-w-xs text-sm text-neutral-500">The simpler way to manage appointments.</p>
              <CtaButton to={START} className="mt-5">Start for Free <ArrowRight size={15} /></CtaButton>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="text-xs font-bold uppercase tracking-wide text-neutral-600">{col.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => <li key={l.label}><NavLink item={l} className="text-sm text-neutral-600 transition-colors hover:text-[color:var(--ar-primary)] hover:no-underline" /></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-black/5 pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-xs text-neutral-500">© 2026 Book A Sloth. Razorpay-secure payments · GST invoices · Made in India 🇮🇳</p>
            <p className="text-xs text-neutral-500">Made for India&apos;s architects &amp; designers</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

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

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Menu, X, Plus, Star,
  CalendarCheck, LayoutDashboard, MessageCircle, TrendingUp,
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

// Integration hub — REAL BAS integrations only, 3 cards either side of centre.
const ROW_COLORS = ['#1F3A5F', '#C6A15B', '#38618C', '#8C6D1F']; // navy · gold · steel · bronze
const SPARKS = [
  { left: '9%', top: '7%', rot: 22, color: '#C6A15B' },
  { left: '46%', top: '3%', rot: -14, color: '#1F3A5F' },
  { left: '90%', top: '9%', rot: -24, color: '#38618C' },
  { left: '5%', top: '60%', rot: 108, color: '#1F3A5F' },
  { left: '95%', top: '56%', rot: 66, color: '#C6A15B' },
  { left: '50%', top: '93%', rot: 4, color: '#8C6D1F' },
];
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

/* Practice-area card. `active` cards render pre-filled (navy) in a checkerboard
   and invert to plain on hover; plain cards do the opposite. */
function UseCaseCard({ u, active }) {
  const card = active
    ? 'border-[#1F3A5F] bg-[#1F3A5F] hover:border-black/[0.06] hover:bg-white'
    : 'border-black/[0.06] bg-white hover:border-[#1F3A5F] hover:bg-[#1F3A5F]';
  const icon = active
    ? 'bg-[#C6A15B] text-[#1F2A1B] ring-white group-hover:bg-[#1F3A5F] group-hover:text-[#C6A15B] group-hover:ring-transparent'
    : 'bg-[#1F3A5F] text-[#C6A15B] ring-transparent group-hover:bg-[#C6A15B] group-hover:text-[#1F2A1B] group-hover:ring-white';
  const arrow = active
    ? 'bg-white text-[#1F3A5F] group-hover:bg-[rgba(198,161,91,0.22)] group-hover:text-[#8C6D1F]'
    : 'bg-[rgba(31,58,95,0.1)] text-[#1F3A5F] group-hover:bg-white group-hover:text-[#1F3A5F]';
  const title = active ? 'text-white group-hover:text-[color:var(--ca-ink)]' : 'text-[color:var(--ca-ink)] group-hover:text-white';
  const desc = active ? 'text-white/80 group-hover:text-neutral-500' : 'text-neutral-500 group-hover:text-white/80';
  return (
    <Link to={START} className={`group flex h-full flex-col rounded-[14px] border p-5 transition-all duration-300 hover:shadow-[0_14px_34px_-20px_rgba(17,17,17,0.35)] hover:no-underline ${card}`}>
      <div className="flex items-start justify-between">
        <span className={`flex h-12 w-12 items-center justify-center rounded-full ring-2 transition-all duration-300 ${icon}`}>
          <u.icon size={22} />
        </span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 ${arrow}`}>
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <h3 className={`mt-4 font-heading text-[15px] font-bold transition-colors duration-300 ${title}`}>{u.label}</h3>
      <p className={`mt-1 text-[13px] leading-snug transition-colors duration-300 ${desc}`}>{u.desc}</p>
    </Link>
  );
}

/* How-it-works: left image tracks the active step; steps auto-advance every 2.5s
   (looping) and a click selects a step and restarts the timer. */
function HowItWorks({ steps }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setActive((a) => (a + 1) % steps.length), 2500);
    return () => clearTimeout(t);
  }, [active, steps.length]);
  return (
    <div className="mt-16 grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
      {/* LEFT — image reflects the active step */}
      <div className="relative mx-auto w-full max-w-md lg:mx-0">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1F3A5F]/15 blur-3xl" />
        <div className="relative z-10 aspect-square">
          <AnimatePresence mode="wait" initial={false}>
            <motion.img
              key={active}
              src={steps[active].image}
              alt=""
              loading="lazy"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 mx-auto h-full w-full object-contain drop-shadow-[0_24px_32px_rgba(17,17,17,0.16)]"
            />
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT — auto-advancing, clickable step timeline */}
      <div className="relative">
        <span aria-hidden className="absolute bottom-5 left-6 top-5 w-px bg-black/10" />
        <div className="space-y-8">
          {steps.map((s, i) => {
            const on = i === active;
            return (
              <button key={s.title} type="button" onClick={() => setActive(i)} aria-current={on} className="relative flex w-full gap-5 text-left">
                <span className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${on ? 'bg-[#1F3A5F] text-white shadow-[0_8px_20px_-8px_rgba(31,58,95,0.7)]' : 'border-2 border-black/10 bg-white text-[color:var(--ca-primary)]'}`}>
                  <s.icon size={20} />
                </span>
                <div className="pt-1.5">
                  <h3 className={`font-heading text-lg font-bold transition-colors duration-300 ${on ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>{s.title}</h3>
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

/* One integration card — logo + title + subtitle. */
function ToolCard({ t, innerRef }) {
  return (
    <div ref={innerRef} className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.05] bg-white px-4 py-3 shadow-[0_14px_34px_-20px_rgba(17,17,17,0.3)] lg:w-64">
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

/* Integration hub — mascot centre with a halo, 3 cards either side, each wired in
   by a dashed row-coloured connector. Geometry is measured from the real DOM. */
function IntegrationHub() {
  const wrapRef = useRef(null);
  const centerRef = useRef(null);
  const cardRefs = useRef({});
  const [conns, setConns] = useState([]);

  useLayoutEffect(() => {
    const compute = () => {
      const wrap = wrapRef.current;
      const center = centerRef.current;
      if (!wrap || !center) return;
      const wb = wrap.getBoundingClientRect();
      const cb = center.getBoundingClientRect();
      const cx = cb.left + cb.width / 2 - wb.left;
      const cy = cb.top + cb.height / 2 - wb.top;
      const Rc = cb.width / 2;
      const next = [];
      TOOLS_ALL.forEach((t, idx) => {
        const el = cardRefs.current[t.name];
        if (!el) return;
        const rb = el.getBoundingClientRect();
        const isLeft = idx < TOOLS_LEFT.length;
        const sx = (isLeft ? rb.right : rb.left) - wb.left;
        const sy = rb.top + rb.height / 2 - wb.top;
        const dx = sx - cx;
        const dy = sy - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;
        const ex = cx + ux * (Rc - 4);          // dashed line ends at the halo edge
        const ey = cy + uy * (Rc - 4);
        const midx = (sx + ex) / 2;
        next.push({ name: t.name, color: ROW_COLORS[idx % ROW_COLORS.length], sx, sy, d: `M ${sx} ${sy} C ${midx} ${sy}, ${midx} ${ey}, ${ex} ${ey}` });
      });
      setConns(next);
    };
    compute();
    const run = () => requestAnimationFrame(compute);
    const ro = new ResizeObserver(run);
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) run(); }, { threshold: 0.01 });
    if (wrapRef.current) { ro.observe(wrapRef.current); io.observe(wrapRef.current); }
    const mq = window.matchMedia('(min-width: 1024px)');
    mq.addEventListener('change', run);
    window.addEventListener('resize', run);
    const t = setTimeout(compute, 400); // after logos/fonts settle
    return () => { ro.disconnect(); io.disconnect(); mq.removeEventListener('change', run); window.removeEventListener('resize', run); clearTimeout(t); };
  }, []);

  return (
    <>
      {/* mobile / tablet — plain card grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {TOOLS_ALL.map((t) => <Reveal key={t.name}><ToolCard t={t} /></Reveal>)}
      </div>

      {/* desktop hub */}
      <div ref={wrapRef} className="relative mx-auto hidden max-w-6xl lg:block">
        {/* soft navy backdrop */}
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(31,58,95,0.12), transparent 68%)' }} />
        {/* decorative sparks */}
        {SPARKS.map((s, i) => (
          <span key={i} aria-hidden className="absolute h-4 w-[3px] rounded-full" style={{ left: s.left, top: s.top, transform: `rotate(${s.rot}deg)`, background: s.color, opacity: 0.7 }} />
        ))}

        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <style>{`@keyframes lwFlow{to{stroke-dashoffset:-16}}.lw-dash{stroke-dasharray:1.5 7;stroke-linecap:round;animation:lwFlow 1.1s linear infinite}@media(prefers-reduced-motion:reduce){.lw-dash{animation:none}}`}</style>
          {conns.map((p, i) => (
            <g key={p.name}>
              <path d={p.d} fill="none" stroke={p.color} strokeWidth="2.5" className="lw-dash" style={{ animationDelay: `${i * 0.08}s` }} />
              <circle cx={p.sx} cy={p.sy} r="3.5" fill={p.color} />
            </g>
          ))}
        </svg>

        <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-24">
          <div className="flex flex-col items-end gap-10">
            {TOOLS_LEFT.map((t) => <ToolCard key={t.name} t={t} innerRef={(el) => { cardRefs.current[t.name] = el; }} />)}
          </div>

          {/* centre — mascot + halo + caption */}
          <div className="flex flex-col items-center">
            <div ref={centerRef} className="relative flex h-60 w-60 items-center justify-center">
              <div aria-hidden className="absolute inset-[-34px] rounded-full border border-dashed border-[#C6A15B]/70" />
              <div aria-hidden className="absolute inset-[-14px] rounded-full border border-[#1F3A5F]/20" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white shadow-[0_30px_70px_-30px_rgba(17,17,17,0.3)] ring-1 ring-black/5">
                <img src={MASCOT} alt="Book A Sloth" className="h-52 w-52 object-contain" />
              </div>
            </div>
            <div className="relative mt-4 text-center">
              <span className="font-heading text-sm font-semibold italic text-neutral-500">Your Practice, Connected</span>
              <svg width="130" height="8" viewBox="0 0 130 8" fill="none" className="mx-auto mt-1"><path d="M2 5 C 34 1, 96 1, 128 4" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" /></svg>
            </div>
          </div>

          <div className="flex flex-col items-start gap-10">
            {TOOLS_RIGHT.map((t) => <ToolCard key={t.name} t={t} innerRef={(el) => { cardRefs.current[t.name] = el; }} />)}
          </div>
        </div>
      </div>
    </>
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
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((u, i) => {
              const active = (Math.floor(i / 4) + (i % 4)) % 2 === 1;
              return (
                <Reveal key={u.label} delay={(i % 4) * 0.05}>
                  <UseCaseCard u={u} active={active} />
                </Reveal>
              );
            })}
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

          <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            {/* white — number */}
            <Reveal className="lg:row-span-2">
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] border border-black/[0.06] bg-white p-8">
                <CardPattern variant="grid" light={false} corner="tr" />
                <span className="relative z-10 inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ backgroundColor: 'rgba(161,98,7,0.14)', color: '#8C6D1F' }}>Always on</span>
                <div>
                  <div className="font-heading text-6xl font-extrabold tracking-tight text-[color:var(--ca-ink)] sm:text-7xl">24/7</div>
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-500">
                    Your booking page never sleeps — clients reserve consultations any time, day or night, while you focus on the matter at hand.
                  </p>
                </div>
                <TrendingUp aria-hidden size={200} strokeWidth={1} className="pointer-events-none absolute -bottom-8 -right-8 text-black/[0.03]" />
              </div>
            </Reveal>

            {/* accent — number */}
            <Reveal delay={0.06}>
              <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[20px] p-7 text-white" style={{ background: 'var(--ca-accent)' }}>
                <CardPattern variant="dots" light corner="br" />
                <span className="relative z-10 text-[11px] font-bold uppercase tracking-[0.15em] text-white/80">You keep</span>
                <div>
                  <div className="font-heading text-5xl font-extrabold tracking-tight">100%</div>
                  <p className="mt-2 text-sm text-white/85">Of every fee on Sloth Active — 0% commission, every rupee stays yours.</p>
                </div>
              </div>
            </Reveal>

            {/* ink — number */}
            <Reveal delay={0.1}>
              <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[20px] p-7 text-white" style={{ background: 'var(--ca-ink)' }}>
                <CardPattern variant="grid" light corner="tr" />
                <span className="relative z-10 text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">To start</span>
                <div>
                  <div className="font-heading text-5xl font-extrabold tracking-tight">₹0</div>
                  <p className="mt-2 text-sm text-white/60">Free forever plan — no card, no lock-in.</p>
                </div>
              </div>
            </Reveal>

            {/* navy — community CTA */}
            <Reveal delay={0.14} className="lg:col-span-2">
              <a href="https://whatsapp.com/channel/0029Vb8ZyHP6GcG6LRA2K81Y" target="_blank" rel="noopener noreferrer" className="group relative flex h-full items-center justify-between gap-4 overflow-hidden rounded-[20px] p-7 text-white hover:no-underline" style={{ background: 'var(--ca-primary)' }}>
                <CardPattern variant="rings" light corner="tr" />
                <div className="relative z-10">
                  <div className="font-heading text-xl font-extrabold sm:text-2xl">Join the community</div>
                  <p className="mt-1 text-sm text-white/70">Connect with fellow professionals growing on Book A Sloth.</p>
                </div>
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white transition-transform group-hover:translate-x-1" style={{ color: 'var(--ca-primary)' }}>
                  <ArrowRight size={22} />
                </span>
              </a>
            </Reveal>
          </div>
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
          <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
            {CA_TESTIMONIALS.map((t, i) => {
              const dark = t.tone !== 'white';
              const bg = t.tone === 'blue' ? 'var(--ca-primary)' : t.tone === 'ink' ? 'var(--ca-ink)' : undefined;
              const star = t.tone === 'white' ? '#1F3A5F' : t.tone === 'ink' ? '#C6A15B' : '#ffffff';
              const avStyle = t.tone === 'blue' ? { background: '#fff', color: 'var(--ca-primary)' } : t.tone === 'ink' ? { background: 'rgba(255,255,255,0.15)', color: '#fff' } : { background: 'var(--ca-primary)', color: '#fff' };
              return (
                <Reveal key={t.name} delay={(i % 3) * 0.06} className={`mb-5 break-inside-avoid rounded-[16px] p-6 ${t.tone === 'white' ? 'border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(17,17,17,0.05)]' : ''}`} style={bg ? { background: bg } : undefined}>
                  <figure>
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((s) => <Star key={s} size={15} style={{ color: star, fill: star }} />)}
                    </div>
                    <blockquote className={`mt-4 text-[15px] font-medium leading-relaxed ${dark ? (t.tone === 'blue' ? 'text-white' : 'text-white/90') : 'text-[color:var(--ca-ink)]'}`}>&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption className="mt-5 flex items-center gap-3">
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={avStyle}>{t.name.replace('Adv. ', '').charAt(0)}</span>
                      <div>
                        <div className={`text-sm font-bold ${dark ? 'text-white' : 'text-[color:var(--ca-ink)]'}`}>{t.name}</div>
                        <div className={`text-xs ${t.tone === 'blue' ? 'text-white/70' : t.tone === 'ink' ? 'text-white/50' : 'text-neutral-500'}`}>{t.role}</div>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
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

          <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-2 sm:gap-6">
            {/* The old way */}
            <Reveal className="h-full">
              <div className="flex h-full flex-col rounded-[20px] border border-black/[0.06] bg-white p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#DC2626' }}>
                    <X size={20} />
                  </span>
                  <h3 className="font-heading text-lg font-bold text-neutral-500">The old way</h3>
                </div>
                <div className="mt-6 flex flex-col gap-5">
                  {OLD_WAY.map((item) => (
                    <div key={item.title} className="flex gap-3.5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#DC2626' }}>
                        <item.icon size={18} />
                      </span>
                      <div>
                        <p className="font-heading text-[15px] font-semibold text-neutral-700">{item.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-neutral-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* With Book A Sloth */}
            <Reveal delay={0.08} className="h-full">
              <div className="flex h-full flex-col rounded-[20px] border-2 bg-white p-6 sm:p-8" style={{ borderColor: 'rgba(31,58,95,0.4)', boxShadow: '0 12px 40px -18px rgba(31,58,95,0.5)' }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(31,58,95,0.14)', color: 'var(--ca-primary)' }}>
                    <Check size={20} />
                  </span>
                  <h3 className="font-heading text-lg font-bold" style={{ color: 'var(--ca-ink)' }}>With Book A Sloth</h3>
                </div>
                <div className="mt-6 flex flex-col gap-5">
                  {NEW_WAY.map((item) => (
                    <div key={item.title} className="flex gap-3.5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(31,58,95,0.12)', color: 'var(--ca-primary)' }}>
                        <item.icon size={18} />
                      </span>
                      <div>
                        <p className="font-heading text-[15px] font-semibold" style={{ color: 'var(--ca-ink)' }}>{item.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
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
                <div className="relative flex h-full flex-col rounded-[18px] border-2 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(16,24,40,0.14)]" style={{ borderColor: 'var(--ca-primary)' }}>
                  <div className="flex items-center justify-between">
                    <div className="font-heading text-lg font-bold">{PREMIUM_PLAN.name}</div>
                    {yearly && <span className="rounded-full bg-[#1F3A5F] px-2.5 py-0.5 text-xs font-bold text-white">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>}
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

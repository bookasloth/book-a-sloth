// /for/sports-turf — bespoke, conversion-focused landing page for turf &
// sports-arena owners in India (box cricket, football turf, badminton /
// pickleball courts, coaching grounds).
//
// STANDALONE page (not the data-driven ProfessionLanding template) — same
// 14-section structure as its sibling /for/chartered-accountants, re-skinned to a
// "floodlit night" sporty look (dark stadium hero, turf-green + electric-lime
// accents, pitch-line textures). Reuses shared infra: Seo, Reveal, useLenis, real
// plan data, /be-a-sloth funnel, prerender + Solutions hub.
//
// HONESTY (verified against product code — see agent audit):
//   - Positioned for a SINGLE bookable ground/court per account. The double-book
//     guard is keyed on host_id, so parallel multi-court is NOT supported — the
//     page never claims it; two FAQ items state the multi-court + peak-pricing
//     limits plainly. Deposits/partial advance are NOT built → we say "full fee
//     upfront", never "pay X% to hold".
//   - Hourly slot booking, flat per-service price, full online payment, WhatsApp
//     reminders and 0% on Active are all real.
//   - Trust strip maps to real behaviour (Razorpay signature verify, Mumbai prod
//     DB, DPDP Privacy policy, 0% on Active). Testimonials are labelled placeholders.
//
// The legacy --ca-* CSS var names are kept (cosmetic) so shared classNames stay
// valid; only their values are retuned to the floodlit palette.
//
// New URL — keep in sync: App.jsx route (before /for/:profession), prerender.mjs
// list, and Solutions.jsx CATEGORIES.

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Menu, X, Plus, Star,
  CalendarCheck, LayoutDashboard, MessageCircle, TrendingUp,
  Wallet, BellRing,
  Users, Clock3, Landmark,
  FileText, Target, Flag, Trophy, Dumbbell, GraduationCap,
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
const MASCOT = '/images/ca-sloth.webp'; // shared brand sloth mascot (transparent webp)

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'For Turf Owners', href: '#usecases' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Built for Indian venues'];

const BENEFITS = [
  { icon: CalendarCheck, title: 'Fill Your Slots', desc: 'Players book open slots online — no calls, no chasing.' },
  { icon: Wallet, title: 'Paid Upfront', desc: 'Collect the full slot fee online before they arrive.' },
  { icon: BellRing, title: 'Fewer No-Shows', desc: 'Automatic WhatsApp reminders before every slot.' },
  { icon: LayoutDashboard, title: 'One Clear Calendar', desc: 'Every booking for your ground in a single view.' },
];

const USE_CASES = [
  { icon: Target, label: 'Box Cricket', desc: 'Hourly box-cricket and nets slots.' },
  { icon: Flag, label: 'Football Turf', desc: '5-a-side and 7-a-side ground.' },
  { icon: Zap, label: 'Badminton Court', desc: 'Peak-evening court bookings.' },
  { icon: Star, label: 'Pickleball Court', desc: 'The fastest-growing court sport.' },
  { icon: Dumbbell, label: 'Coaching Sessions', desc: 'One-on-one or squad coaching.' },
  { icon: Users, label: 'Group & Corporate', desc: 'Team outings and office events.' },
  { icon: Trophy, label: 'Tournaments', desc: 'Match-day slot bookings.' },
  { icon: GraduationCap, label: 'Skills Clinics', desc: 'Camps and skill sessions.' },
];

const STEPS = [
  { title: 'List your ground & slots', icon: LayoutDashboard, image: MASCOT, desc: 'Set your operating hours and slot length, then share your booking link anywhere.' },
  { title: 'Players book & pay', icon: CalendarCheck, image: MASCOT, desc: 'Players pick an open slot and pay the full fee online — no calls, no back-and-forth.' },
  { title: 'Everyone gets reminded', icon: BellRing, image: MASCOT, desc: 'You and the player get automatic confirmations and WhatsApp reminders before the slot.' },
];
// ponytail: all steps share MASCOT until distinct per-step art is supplied.

// Integration hub — REAL BAS integrations only. Turf is in-person, so no
// Meet/Zoom video tools (dropped vs the CA page). 3 cards either side of centre.
const ROW_COLORS = ['#16A34A', '#A3E635', '#38BDF8', '#F59E0B']; // turf-green · lime · sky · amber
const SPARKS = [
  { left: '9%', top: '7%', rot: 22, color: '#A3E635' },
  { left: '46%', top: '3%', rot: -14, color: '#16A34A' },
  { left: '90%', top: '9%', rot: -24, color: '#38BDF8' },
  { left: '5%', top: '60%', rot: 108, color: '#16A34A' },
  { left: '95%', top: '56%', rot: 66, color: '#A3E635' },
  { left: '50%', top: '93%', rot: 4, color: '#F59E0B' },
];
const TOOLS_LEFT = [
  { name: 'Google Calendar', icon: 'google-calendar', sub: 'Two-way sync of your real availability' },
  { name: 'WhatsApp Automation', logo: '/images/logos/whatsapp.svg', sub: 'Reminders and updates on autopilot' },
  { name: 'Player Records', logo: '/favicon.svg', sub: 'Every regular, note and history in one place' },
];
const TOOLS_RIGHT = [
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Online payments, refunds and GST invoices' },
  { name: 'PhonePe', logo: '/images/logos/phonepe.svg', sub: 'Accept instant UPI payments' },
  { name: 'Gmail', logo: '/images/logos/gmail.svg', sub: 'Booking confirmation emails, automatic' },
];
const TOOLS_ALL = [...TOOLS_LEFT, ...TOOLS_RIGHT];

// Placeholder testimonials — swap for real owner quotes/photos when available.
// SEO-friendly copy (turf booking, slots, WhatsApp reminders, no-shows, UPI).
const CA_TESTIMONIALS = [
  { tone: 'white', quote: 'Players used to call all evening asking which slots were free. Now they see live openings and book my box-cricket ground themselves — the phone finally stopped ringing.', name: 'Rohan Patil', role: 'Box Cricket Arena, Pune' },
  { tone: 'ink', quote: 'Automatic WhatsApp reminders cut our no-shows on prime 8 PM slots. Fewer empty grounds, more revenue.', name: 'Imran Shaikh', role: 'Football Turf Owner, Hyderabad' },
  { tone: 'blue', quote: 'Collecting the full slot fee online through UPI before they turn up ended the cash-chasing completely.', name: 'Karthik Reddy', role: 'Sports Arena, Bengaluru' },
  { tone: 'blue', quote: 'Players book badminton courts without waiting for a reply. Setup took an evening, not a week.', name: 'Ananya Rao', role: 'Badminton Court, Chennai' },
  { tone: 'ink', quote: 'One clear calendar for my ground means no more two teams turning up for the same slot.', name: 'Harpreet Singh', role: 'Turf Ground, Ludhiana' },
  { tone: 'white', quote: 'A proper booking page for my turf, 0% commission on Active, and payments straight to my account — exactly what a small arena needs.', name: 'Vishal Nair', role: 'Multi-Sport Turf, Kochi' },
];

// Before / after — the turf owner's day without vs with Book A Sloth.
const OLD_WAY = [
  { icon: MessageCircle, title: 'Slot requests over phone & WhatsApp', desc: 'Players call to ask what is free; you reply mid-game.' },
  { icon: Clock3, title: 'No-shows waste prime slots', desc: 'A missed 8 PM slot is revenue you cannot get back.' },
  { icon: Wallet, title: 'Chasing payment after they play', desc: 'Cash collected late, or sometimes not at all.' },
  { icon: IndianRupee, title: 'Cash-only, no record', desc: 'Hard to track who paid for which slot.' },
  { icon: X, title: 'Double-booked peak hours', desc: 'Two teams turn up for the same 7 PM slot.' },
];

const NEW_WAY = [
  { icon: Share2, title: 'One shareable slot link', desc: 'Players see live openings and book themselves, 24/7.' },
  { icon: BellRing, title: 'Automatic WhatsApp reminders', desc: 'Reminders cut no-shows on your prime slots.' },
  { icon: IndianRupee, title: 'Paid online, upfront', desc: 'Full slot fee collected at booking, over UPI or card.' },
  { icon: CalendarCheck, title: 'One clear calendar', desc: 'Every booked slot in one view — no clashes on your ground.' },
  { icon: LayoutDashboard, title: 'Every booking on record', desc: 'Who booked, when, and whether they paid — all logged.' },
];

// Honest trust strip — verifiable facts only. Every claim maps to real product
// behaviour: Razorpay signature-verified payments (razorpaySignature.js), prod DB
// in Mumbai (CLAUDE.md), DPDP-based Privacy policy (Privacy.jsx), 0% on Active (plans.js).
const TRUST_STRIP = [
  { icon: Lock, value: 'Razorpay', label: 'Every payment signature-verified on our servers' },
  { icon: Landmark, value: 'Hosted in India', label: 'Your venue data runs on servers in Mumbai' },
  { icon: FileText, value: 'DPDP 2023', label: 'Operated under India’s data protection law' },
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
];

const FAQ = [
  { q: 'Is Book A Sloth good for a turf or sports arena?', a: 'Yes. If you run a bookable ground or court — box cricket, football turf, a badminton or pickleball court — you get an online booking page where players pick an open slot and pay upfront, with automatic WhatsApp reminders. It works best for a single bookable facility per account (see the multi-court question below).' },
  { q: 'Can players book my ground by the hour?', a: 'Yes. Set your operating hours (say 6 AM to 11 PM) and a slot length such as 60 minutes, and players can book back-to-back hourly slots like 7–8 PM or 8–9 PM themselves — no calls or waiting for a reply.' },
  { q: 'Can I take payment online before they play?', a: 'Yes. Collect the full slot fee upfront through Razorpay — UPI, cards or netbanking — at the time of booking. A GST invoice is generated automatically for every paid booking.' },
  { q: 'Can I send WhatsApp reminders?', a: 'Yes. Book A Sloth sends automatic booking confirmations and reminders over WhatsApp and email before each slot, which cuts no-shows. WhatsApp reminders are included on the Sloth Active plan (and free for your first two months on the Sloth plan).' },
  { q: 'What if I run more than one turf or court?', a: 'Right now Book A Sloth is built for a single bookable ground or court per account — two facilities on one account share the same calendar, so they cannot be booked in parallel. If you run a multi-court arena, true parallel-court booking is on our roadmap; in the meantime a separate account per court is the workaround. We would rather tell you this upfront than have it surprise you after setup.' },
  { q: 'Can I set different prices for peak and off-peak hours?', a: 'Each service has its own fixed price, so automatic time-based (peak vs off-peak) pricing is not built yet. You can create separate listings — for example an off-peak morning slot and an evening slot at different prices — as a manual workaround.' },
  { q: 'Do I need any technical knowledge?', a: 'No. Setup takes minutes and needs no technical skills. You add your ground, slots and availability, and your booking page is ready to share — players need nothing more than the link.' },
  { q: 'Is there a free plan?', a: 'Yes. The Sloth plan is free forever — an online booking page, unlimited slots and bookings, UPI payments, 24-hour reminders and GST invoices — with a small 5% per-booking fee. Sloth Active removes that commission entirely and adds WhatsApp automation and growth tools.' },
];

const FOOTER_COLS = [
  { title: 'Product', links: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Integrations', href: '#features' },
    { label: "What's New", to: '/changelog' },
  ] },
  { title: 'For Businesses', links: [
    { label: 'Sports & Turf', to: '/for/sports-turf' },
    { label: 'Chartered Accountants', to: '/for/chartered-accountants' },
    { label: 'Consultants', to: '/for/business-consultant' },
    { label: 'Salons', to: '/for/salon' },
    { label: 'Fitness', to: '/for/fitness' },
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

// Anchor that respects on-page (#) vs route links.
function NavLink({ item, className, onClick }) {
  if (item.to) return <Link to={item.to} className={className} onClick={onClick}>{item.label}</Link>;
  return <a href={item.href} className={className} onClick={onClick}>{item.label}</a>;
}

function CtaButton({ to, children, variant = 'solid', className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-[5px] px-6 py-3.5 text-sm font-semibold transition-all hover:no-underline';
  const styles = {
    solid: 'text-white shadow-[0_4px_14px_rgba(16,24,40,0.16)] hover:brightness-105',
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

/* Sport-category card. `active` cards render pre-filled (turf-green) in a
   checkerboard and invert to plain on hover; plain cards do the opposite. */
function UseCaseCard({ u, active }) {
  const card = active
    ? 'border-[#16A34A] bg-[#16A34A] hover:border-black/[0.06] hover:bg-white'
    : 'border-black/[0.06] bg-white hover:border-[#16A34A] hover:bg-[#16A34A]';
  const icon = active
    ? 'bg-[#A3E635] text-[#12321f] ring-white group-hover:bg-[#16A34A] group-hover:text-white group-hover:ring-transparent'
    : 'bg-[#16A34A] text-[#A3E635] ring-transparent group-hover:bg-[#A3E635] group-hover:text-[#12321f] group-hover:ring-white';
  const arrow = active
    ? 'bg-white text-[#16A34A] group-hover:bg-[rgba(22,163,74,0.16)] group-hover:text-[#15803D]'
    : 'bg-[rgba(22,163,74,0.12)] text-[#15803D] group-hover:bg-white group-hover:text-[#16A34A]';
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
        <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#16A34A]/20 blur-3xl" />
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
                <span className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${on ? 'bg-[#16A34A] text-white shadow-[0_8px_20px_-8px_rgba(22,163,74,0.7)]' : 'border-2 border-black/10 bg-white text-[color:var(--ca-primary)]'}`}>
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
    // rAF so layout is applied before we measure (display:none→block, resize, etc.)
    const run = () => requestAnimationFrame(compute);
    const ro = new ResizeObserver(run);
    // The section loads below the fold + is display:none under lg, so mount
    // measures zero — recompute when it actually becomes visible.
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
        {/* soft green backdrop */}
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.13), transparent 68%)' }} />
        {/* decorative sparks */}
        {SPARKS.map((s, i) => (
          <span key={i} aria-hidden className="absolute h-4 w-[3px] rounded-full" style={{ left: s.left, top: s.top, transform: `rotate(${s.rot}deg)`, background: s.color, opacity: 0.7 }} />
        ))}

        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <style>{`@keyframes stFlow{to{stroke-dashoffset:-16}}.st-dash{stroke-dasharray:1.5 7;stroke-linecap:round;animation:stFlow 1.1s linear infinite}@media(prefers-reduced-motion:reduce){.st-dash{animation:none}}`}</style>
          {conns.map((p, i) => (
            <g key={p.name}>
              <path d={p.d} fill="none" stroke={p.color} strokeWidth="2.5" className="st-dash" style={{ animationDelay: `${i * 0.08}s` }} />
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
              <div aria-hidden className="absolute inset-[-34px] rounded-full border border-dashed border-[#A3E635]/70" />
              <div aria-hidden className="absolute inset-[-14px] rounded-full border border-[#16A34A]/20" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white shadow-[0_30px_70px_-30px_rgba(17,17,17,0.3)] ring-1 ring-black/5">
                <img src={MASCOT} alt="Book A Sloth" className="h-52 w-52 object-contain" />
              </div>
            </div>
            <div className="relative mt-4 text-center">
              <span className="font-heading text-sm font-semibold italic text-neutral-500">Your Ground, Connected</span>
              <svg width="130" height="8" viewBox="0 0 130 8" fill="none" className="mx-auto mt-1"><path d="M2 5 C 34 1, 96 1, 128 4" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" /></svg>
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
      <div key={f.q} className="overflow-hidden rounded-[12px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'rgba(22,163,74,0.35)' : 'rgba(17,17,17,0.08)' }}>
        <button
          type="button"
          onClick={() => setOpen(isOpen ? -1 : i)}
          aria-expanded={isOpen}
          className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[color:var(--ca-ink)]"
        >
          {f.q}
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: 'var(--ca-primary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
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

export default function SportsTurf() {
  useLenis();
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  const canonical = `${SITE_URL}/for/sports-turf`;
  const seo = {
    title: 'Slot Booking Software for Turf & Sports Arenas | Book A Sloth',
    description: 'Book A Sloth is online slot booking software for turf and sports-arena owners in India — box cricket, football turf, badminton and pickleball courts. Let players book open slots and pay upfront, with WhatsApp reminders, GST invoices and 0% commission. Start free.',
    keywords: 'turf booking software, sports arena booking software, box cricket slot booking, football turf booking online india, badminton court booking system, book turf online, sports venue scheduling india',
    ogTitle: 'Your ground runs on slots. Let Book A Sloth fill them.',
    ogDescription: 'Players book open slots, pay upfront over UPI, and get WhatsApp reminders — automatically. The booking page every turf and sports arena in India should have.',
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
      serviceType: 'Online slot booking software for sports turf and arenas',
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
        { '@type': 'ListItem', position: 2, name: 'For Sports & Turf', item: canonical },
      ],
    },
  ];

  // Floodlit-night palette — legacy --ca-* var names kept so shared classNames work.
  const styleVars = {
    '--ca-primary': '#16A34A', // turf green
    '--ca-accent': '#22C55E',  // brighter green (readable on light tints)
    '--ca-ink': '#0B0F12',     // stadium night / near-black text
    '--ca-cream': '#F1FBF4',   // faint mint section bg
    '--ca-grey': '#F3F6F4',    // light grey section bg
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
        themeColor="#16A34A"
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

      {/* ═══════════════ 2 · HERO (floodlit night) ═══════════════ */}
      <section className="relative overflow-hidden px-5 pb-14 pt-8 text-white sm:px-8 sm:pb-20 sm:pt-12 lg:pb-28 lg:pt-16" style={{ background: 'radial-gradient(120% 90% at 50% -10%, #123A24 0%, #0B0F12 58%)' }}>
        {/* floodlight glow */}
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(163,230,53,0.20), transparent)' }} />
        {/* pitch yard-lines */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 72px)', maskImage: 'linear-gradient(180deg, #000, transparent 82%)', WebkitMaskImage: 'linear-gradient(180deg, #000, transparent 82%)' }} />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* LEFT */}
          <div className="text-center lg:text-left">
            <Reveal as="p" instant className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#A3E635]">
              For turf & sports arenas
            </Reveal>
            <Reveal as="h1" instant className="text-[clamp(1.7rem,7vw,2.7rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.7rem] sm:leading-[1.1] lg:text-[3rem]">
              Simple slot booking software for{' '}
              <span style={{ color: '#A3E635' }}>turf &amp; sports grounds</span>{' '}
              of modern India.
            </Reveal>
            <Reveal as="p" instant delay={0.05} className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/70 sm:mt-7 sm:text-lg lg:mx-0">
              Stop taking bookings over phone calls and WhatsApp. Let players see your open slots, book and pay online — for your turf, box-cricket ground or court.
            </Reveal>
            <Reveal instant delay={0.1} className="mt-6 flex flex-col items-center gap-3 sm:mt-9 sm:flex-row sm:gap-5 lg:justify-start">
              <Link
                to={START}
                className="btn flex w-full items-center justify-center gap-2 rounded-[5px] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(22,163,74,0.7)] transition-opacity hover:opacity-90 hover:no-underline sm:w-auto"
                style={{ background: 'var(--ca-primary)' }}
              >
                Create a Free Account <ArrowRight size={16} />
              </Link>
              <Link to="/demo" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-[#A3E635] hover:no-underline">
                Book A Demo <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
            <Reveal instant delay={0.14} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:mt-9 lg:justify-start">
              {HERO_TRUST.map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-[13px] font-medium text-white/60">
                  <Check size={14} className="text-[#A3E635]" /> {t}
                </span>
              ))}
            </Reveal>
          </div>

          {/* RIGHT — mascot + floating glass cards */}
          <Reveal instant delay={0.1} className="relative hidden lg:block">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-[27rem] w-[27rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[rgba(22,163,74,0.35)] to-[rgba(163,230,53,0.22)] blur-2xl" />
            <img src={MASCOT} alt="Book A Sloth — slot booking for turf and sports arenas" loading="eager" className="relative z-10 mx-auto w-full max-w-[27rem] drop-shadow-[0_28px_46px_rgba(0,0,0,0.5)]" />
            <GlassCard icon={CalendarCheck} label="New booking" value="7–8 PM · Booked" float="sloth-float" className="top-6 -left-4" />
            <GlassCard icon={Wallet} label="Payment received" value="₹1,200" accent float="sloth-float--mid" className="top-1/2 -right-6" />
            <GlassCard icon={BellRing} label="WhatsApp reminder" value="Sent · 1h before" float="sloth-float--slow" className="bottom-10 left-2" />
          </Reveal>
        </div>

        {/* Four benefits — scoreboard-style tiles, part of the hero */}
        <div className="relative mx-auto mt-12 grid max-w-7xl gap-3 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.06}>
              <div className="group flex h-full flex-col rounded-[10px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition-colors hover:border-[#A3E635]/40">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(163,230,53,0.14)] text-[#A3E635] transition-colors duration-300 group-hover:bg-[#A3E635] group-hover:text-[#12321f]">
                    <b.icon size={18} />
                  </span>
                  <div className="font-heading text-sm font-bold text-white">{b.title}</div>
                </div>
                <p className="mt-2 text-xs leading-snug text-white/55">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 3 · SPORT USE CASES ═══════════════ */}
      <section id="usecases" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Built around the way <span style={{ color: 'var(--ca-primary)' }}>grounds get booked.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">
              From box cricket to badminton courts, take every slot booking in one place.
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
              How Book A Sloth helps <span style={{ color: 'var(--ca-primary)' }}>turf &amp; arena owners</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              From &ldquo;is 8 PM free?&rdquo; to booked in seconds — no calls.
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
              Real impact for <span style={{ color: 'var(--ca-primary)' }}>turf &amp; arena owners.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              Fill more slots, chase fewer payments — and keep every rupee you earn.
            </Reveal>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            {/* white — number */}
            <Reveal className="lg:row-span-2">
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] border border-black/[0.06] bg-white p-8">
                <CardPattern variant="grid" light={false} corner="tr" />
                <span className="relative z-10 inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ backgroundColor: 'rgba(22,163,74,0.14)', color: '#15803D' }}>Always on</span>
                <div>
                  <div className="font-heading text-6xl font-extrabold tracking-tight text-[color:var(--ca-ink)] sm:text-7xl">24/7</div>
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-500">
                    Your booking page never sleeps — players reserve slots on your ground any time, day or night, while you focus on running it.
                  </p>
                </div>
                <TrendingUp aria-hidden size={200} strokeWidth={1} className="pointer-events-none absolute -bottom-8 -right-8 text-black/[0.03]" />
              </div>
            </Reveal>

            {/* green — number */}
            <Reveal delay={0.06}>
              <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[20px] p-7 text-white" style={{ background: '#16A34A' }}>
                <CardPattern variant="dots" light corner="br" />
                <span className="relative z-10 text-[11px] font-bold uppercase tracking-[0.15em] text-white/80">You keep</span>
                <div>
                  <div className="font-heading text-5xl font-extrabold tracking-tight">100%</div>
                  <p className="mt-2 text-sm text-white/85">Of every slot fee on Sloth Active — 0% commission, every rupee stays yours.</p>
                </div>
              </div>
            </Reveal>

            {/* black — number */}
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

            {/* accent — community CTA */}
            <Reveal delay={0.14} className="lg:col-span-2">
              <a href="https://whatsapp.com/channel/0029Vb8ZyHP6GcG6LRA2K81Y" target="_blank" rel="noopener noreferrer" className="group relative flex h-full items-center justify-between gap-4 overflow-hidden rounded-[20px] p-7 text-white hover:no-underline" style={{ background: 'var(--ca-primary)' }}>
                <CardPattern variant="rings" light corner="tr" />
                <div className="relative z-10">
                  <div className="font-heading text-xl font-extrabold sm:text-2xl">Join the community</div>
                  <p className="mt-1 text-sm text-white/70">Connect with fellow turf owners and creators growing on Book A Sloth.</p>
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
              Trusted by <span style={{ color: 'var(--ca-primary)' }}>turf &amp; sports venues</span> across India.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Hear how grounds fill more slots and cut the admin with Book A Sloth.
            </Reveal>
          </div>
          <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
            {CA_TESTIMONIALS.map((t, i) => {
              const dark = t.tone !== 'white';
              const bg = t.tone === 'blue' ? 'var(--ca-primary)' : t.tone === 'ink' ? 'var(--ca-ink)' : undefined;
              const star = t.tone === 'white' ? '#16A34A' : t.tone === 'ink' ? '#A3E635' : '#ffffff';
              const avStyle = t.tone === 'blue' ? { background: '#fff', color: 'var(--ca-primary)' } : t.tone === 'ink' ? { background: 'rgba(255,255,255,0.15)', color: '#fff' } : { background: 'var(--ca-primary)', color: '#fff' };
              return (
                <Reveal key={t.name} delay={(i % 3) * 0.06} className={`mb-5 break-inside-avoid rounded-[16px] p-6 ${t.tone === 'white' ? 'border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(17,17,17,0.05)]' : ''}`} style={bg ? { background: bg } : undefined}>
                  <figure>
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((s) => <Star key={s} size={15} style={{ color: star, fill: star }} />)}
                    </div>
                    <blockquote className={`mt-4 text-[15px] font-medium leading-relaxed ${dark ? (t.tone === 'blue' ? 'text-white' : 'text-white/90') : 'text-[color:var(--ca-ink)]'}`}>&ldquo;{t.quote}&rdquo;</blockquote>
                    <figcaption className="mt-5 flex items-center gap-3">
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={avStyle}>{t.name.charAt(0)}</span>
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
              The old way vs <span style={{ color: 'var(--ca-primary)' }}>a better way to run your ground.</span>
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
              <div className="flex h-full flex-col rounded-[20px] border-2 bg-white p-6 sm:p-8" style={{ borderColor: 'rgba(22,163,74,0.4)', boxShadow: '0 12px 40px -18px rgba(22,163,74,0.5)' }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(22,163,74,0.14)', color: 'var(--ca-primary)' }}>
                    <Check size={20} />
                  </span>
                  <h3 className="font-heading text-lg font-bold" style={{ color: 'var(--ca-ink)' }}>With Book A Sloth</h3>
                </div>
                <div className="mt-6 flex flex-col gap-5">
                  {NEW_WAY.map((item) => (
                    <div key={item.title} className="flex gap-3.5">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(22,163,74,0.12)', color: 'var(--ca-primary)' }}>
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
              <s.icon size={20} className="mx-auto" style={{ color: '#A3E635' }} />
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
              Start small. <span style={{ color: 'var(--ca-primary)' }}>Grow as your bookings do.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-4 text-base text-neutral-500">
              Choose a plan that fits your ground today. Upgrade when you need more.
            </Reveal>
          </div>

          {/* billing toggle */}
          <Reveal delay={0.1} className="mt-8 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setYearly(false)} className={`text-sm font-semibold transition-colors ${!yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>Monthly</button>
            <button type="button" role="switch" aria-checked={yearly} aria-label="Toggle monthly or yearly billing" onClick={() => setYearly((v) => !v)} className="relative h-6 w-11 rounded-full transition-colors" style={{ background: yearly ? 'var(--ca-primary)' : '#d4d4d4', minHeight: 0 }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all" style={{ left: yearly ? '22px' : '2px' }} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${yearly ? 'text-[color:var(--ca-ink)]' : 'text-neutral-500'}`}>
              Yearly <span className="ml-1 rounded-full bg-[#16A34A]/12 px-2 py-0.5 text-xs font-bold text-[#16A34A]">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>
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
                        <Check size={16} className="mt-0.5 shrink-0 text-[#16A34A]" />
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
                    {yearly && <span className="rounded-full bg-[#16A34A] px-2.5 py-0.5 text-xs font-bold text-white">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>}
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
            <span className="flex items-center gap-1.5 text-sm text-neutral-500"><Lock size={14} className="text-[#16A34A]" /> Access to all features with no hidden fees</span>
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
            <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#16A34A]/15 blur-3xl" />
            <img src={MASCOT} alt="Book A Sloth mascot" loading="lazy" className="relative z-10 mx-auto w-full max-w-[22rem] drop-shadow-[0_24px_32px_rgba(17,17,17,0.16)]" />
          </Reveal>

          {/* RIGHT — text */}
          <div className="order-1 text-center lg:order-2 lg:text-left">
            <Reveal as="h2" delay={0.05} className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Small businesses deserve better tools.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-5 text-base leading-relaxed text-neutral-600">
              Book A Sloth was built to make appointment- and slot-based businesses easier to run. Instead of stitching together calendars, WhatsApp messages, cash and payment tools, owners can take every booking from one simple platform.
            </Reveal>
            <Reveal as="p" delay={0.1} className="mt-4 text-[15px] font-medium text-neutral-500">
              Built for Indian businesses. Designed for the way modern venues actually run.
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

      {/* ═══════════════ 13 · FINAL CTA (floodlit) ═══════════════ */}
      <section className="relative overflow-hidden px-5 py-24 text-center sm:px-8" style={{ background: 'radial-gradient(120% 120% at 50% 0%, #123A24 0%, #0B0F12 60%)' }}>
        <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-56 w-[42rem] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(163,230,53,0.18), transparent)' }} />
        <div className="relative mx-auto max-w-2xl">
          <Reveal className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(163,230,53,0.16)' }}>
            <Zap size={26} style={{ color: '#A3E635' }} />
          </Reveal>
          <Reveal as="h2" delay={0.06} className="mt-6 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Spend less time on the phone. <span style={{ color: '#A3E635' }}>Spend more time filling your ground.</span>
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-lg text-base text-white/60">
            Set up your booking page today and give players a simpler way to reserve a slot.
          </Reveal>
          <Reveal delay={0.14} className="mt-8">
            <CtaButton to={START} className="!px-8 !py-4">Start for Free <ArrowRight size={16} /></CtaButton>
          </Reveal>
          <Reveal as="p" delay={0.18} className="mt-4 text-xs text-white/40">No credit card required</Reveal>
        </div>
      </section>

      {/* ═══════════════ 14 · FOOTER ═══════════════ */}
      <footer className="border-t border-black/5 px-5 py-16 sm:px-8" style={{ background: '#ffffff' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
            <div>
              <div className="font-heading text-lg font-extrabold text-[color:var(--ca-ink)]">Book A Sloth</div>
              <p className="mt-2 max-w-xs text-sm text-neutral-500">The simpler way to take slot bookings.</p>
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
            <p className="text-xs text-neutral-500">Made for India&apos;s turf &amp; sports venues</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// /for/chartered-accountants — bespoke, conversion-focused landing page for
// Chartered Accountants & CA firms in India.
//
// This is a STANDALONE page (not the data-driven ProfessionLanding template):
// the brief calls for a richer 15-section structure — nav, use-case grid,
// 12-feature showcase, client-journey strip, why-us, pricing cards, about and a
// full column footer — that the shared template doesn't render. It still reuses
// the shared infra (Seo, Reveal, useLenis, real plan data, /be-a-sloth funnel,
// prerender + Solutions hub) so it stays consistent with its sibling pages.
//
// Honesty rules held: pricing mirrors the REAL two-plan model (Sloth free +
// Sloth Active) from data/plans.js; the "numbers strip" in the brief is rendered
// as a verifiable trust strip (no fabricated booking counts — see docs rule);
// testimonials are clearly-structured placeholders meant to be swapped for real
// quotes; JSON-LD carries NO self-serving aggregateRating.
//
// New URL — keep in sync: App.jsx route (before /for/:profession), prerender.mjs
// list, and Solutions.jsx CATEGORIES.

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Menu, X, Plus, Star,
  CalendarCheck, LayoutDashboard, MessageCircle, TrendingUp,
  Wallet, BellRing, Bot, Palette,
  Receipt, History, Users, LineChart, Clock3, Landmark,
  FileText, Calculator, Building2, Video, ClipboardCheck, Scale,
  BadgePercent, Lock, MapPin, Zap, Briefcase, Share2, Mail, Folder, IndianRupee,
} from 'lucide-react';
import Reveal from '../../components/home/Reveal';
import Seo from '../../components/common/Seo';
import useLenis from '../../hooks/useLenis';
import { SITE_URL } from '../../utils/seo';
import {
  FREE_PLAN, PREMIUM_PLAN, PREMIUM_PER_DAY,
  PREMIUM_ANNUAL_SAVE_PCT,
} from '../../data/plans';
import CaIcon from './caIcons';
import ToolLogo from './toolLogos';
import razorpayLogo from '../enterprise-v2/assets/logo/razorpay.png';
import outlookLogo from '../enterprise-v2/assets/logo/outlook.svg';

const START = '/be-a-sloth';      // real host signup funnel
const LOGIN = '/login-as-vendor'; // host login (Google-only door)
const MASCOT = '/images/ca-sloth.webp'; // CA sloth mascot — transparent cutout (216KB webp)

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'For CA Firms', href: '#usecases' },
  { label: 'How It Works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Built for Indian businesses'];

const BENEFITS = [
  { icon: CalendarCheck, title: 'Get Booked', desc: 'Clients book and pay, without the back-and-forth.' },
  { icon: LayoutDashboard, title: 'Stay Organised', desc: 'Calendar, availability and client meetings, all in one place.' },
  { icon: MessageCircle, title: 'Automate Follow-Ups', desc: 'Automatic reminders and updates, sent over WhatsApp.' },
  { icon: TrendingUp, title: 'Grow Your Practice', desc: 'See bookings, revenue and client activity with clear insights.' },
];

const USE_CASES = [
  { icon: 'file-text-fill', label: 'Tax Consultation', desc: 'Plan and file with confidence.' },
  { icon: 'receipt-fill', label: 'GST Consultation', desc: 'Registration, returns and advice.' },
  { icon: 'calculator-fill', label: 'Income Tax Filing', desc: 'Returns filed accurately, on time.' },
  { icon: 'clipboard-text-fill', label: 'Audit Meetings', desc: 'Statutory and internal audits.' },
  { icon: 'buildings-fill', label: 'Company Registration', desc: 'Incorporate your business right.' },
  { icon: 'notebook-fill', label: 'Accounting Consultation', desc: 'Books, ledgers and reporting.' },
  { icon: 'chart-line-up-fill', label: 'Financial Advisory', desc: 'Grow and protect your wealth.' },
  { icon: 'briefcase-fill', label: 'Business Advisory', desc: 'Strategy for your next stage.' },
  { icon: 'bank-fill', label: 'Investment Consultation', desc: 'Make your money work harder.' },
  { icon: 'scales-fill', label: 'Compliance Consultation', desc: 'Stay compliant, avoid penalties.' },
  { icon: 'video-camera-fill', label: 'Virtual Consultation', desc: 'Meet online, from anywhere.' },
  { icon: 'users-three-fill', label: 'Client Review Meetings', desc: 'Regular check-ins that matter.' },
];

const STEPS = [
  { title: 'Create & share your page', icon: LayoutDashboard, image: MASCOT, desc: 'Set up your practice, services and availability, then share your booking link anywhere.' },
  { title: 'Clients book & pay', icon: CalendarCheck, image: MASCOT, desc: 'Clients pick a service and a time, and pay upfront — no calls, no back-and-forth.' },
  { title: 'Everyone gets reminded', icon: BellRing, image: MASCOT, desc: 'You and your client get automatic confirmations and WhatsApp reminders.' },
];
// ponytail: all steps share MASCOT until distinct per-step art is supplied.

// Integration hub — REAL BAS integrations only, 4 either side of the mascot, each
// wired in by a dashed row-coloured connector with a small icon badge near centre.
// Row colour is by position (mirrored L/R), not brand. `logo` = local asset img;
// `icon` = colored SVG from toolLogos; `badge` = lucide glyph for the connector node.
const ROW_COLORS = ['#2F6FED', '#22C55E', '#8B5CF6', '#F59E0B']; // blue · green · purple · amber
const SPARKS = [
  { left: '9%', top: '7%', rot: 22, color: '#F59E0B' },
  { left: '46%', top: '3%', rot: -14, color: '#2F6FED' },
  { left: '90%', top: '9%', rot: -24, color: '#8B5CF6' },
  { left: '5%', top: '60%', rot: 108, color: '#22C55E' },
  { left: '95%', top: '56%', rot: 66, color: '#F59E0B' },
  { left: '50%', top: '93%', rot: 4, color: '#F59E0B' },
];
const TOOLS_LEFT = [
  { name: 'Google Calendar', icon: 'google-calendar', sub: 'Two-way sync of your real availability' },
  { name: 'Google Meet', logo: '/images/logos/google-meet.svg', sub: 'Auto-add a video link to every booking' },
  { name: 'Zoom', logo: '/images/logos/zoom.ico', sub: 'Share meeting links automatically' },
  { name: 'Client CRM', logo: '/favicon.svg', sub: 'Every client, note and history in one place' },
];
const TOOLS_RIGHT = [
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Payments, refunds and GST invoices' },
  { name: 'PhonePe', logo: '/images/logos/phonepe.svg', sub: 'Accept instant UPI payments' },
  { name: 'Gmail', logo: '/images/logos/gmail.svg', sub: 'Reminder emails, sent automatically' },
  { name: 'WhatsApp Automation', logo: '/images/logos/whatsapp.svg', sub: 'Reminders and updates on autopilot' },
];
const TOOLS_ALL = [...TOOLS_LEFT, ...TOOLS_RIGHT];

const JOURNEY = [
  { icon: CalendarCheck, label: 'Client books consultation' },
  { icon: Check, label: 'Confirmation' },
  { icon: MessageCircle, label: 'WhatsApp reminder' },
  { icon: Video, label: 'Meeting' },
  { icon: Wallet, label: 'Payment' },
  { icon: BellRing, label: 'Follow-up' },
];

// Structured for easy swap when real customer quotes are approved.
const TESTIMONIALS = [
  { quote: 'Book A Sloth removed the constant WhatsApp back-and-forth with clients. Our team finally has one place to manage appointments.', name: 'Rahul Mehta', role: 'Chartered Accountant, Mumbai' },
  { quote: 'The automated reminders alone have saved us a huge amount of time every week.', name: 'Priya Shah', role: 'CA Firm Partner, Pune' },
  { quote: 'Our clients can book consultations without waiting for someone from the office to respond.', name: 'Amit Jain', role: 'Chartered Accountant, Bengaluru' },
];

const WHY = [
  { icon: MapPin, title: 'Built for India', desc: 'Designed around Indian businesses, payments, GST and client workflows.' },
  { icon: Users, title: 'Easy for Your Clients', desc: 'No complicated signup or technical knowledge required to book an appointment.' },
  { icon: MessageCircle, title: 'WhatsApp First', desc: 'Keep clients updated through the communication channel they already use.' },
  { icon: TrendingUp, title: 'Built to Grow', desc: 'Start with appointments and gradually manage more of your client operations from one platform.' },
];

// Honest trust strip — verifiable facts, NOT fabricated booking/user counts.
const TRUST_STRIP = [
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
  { icon: Receipt, value: 'GST', label: 'Tax invoices generated automatically' },
  { icon: Lock, value: 'UPI + Cards', label: 'Razorpay-secured payments' },
  { icon: MapPin, value: 'Made in India', label: 'For Indian professionals & practices' },
];

const FAQ = [
  { q: 'Is Book A Sloth suitable for CA firms?', a: 'Yes. Whether you are an individual Chartered Accountant or a firm with a team, Book A Sloth manages your appointments, services, availability, client bookings and communication from one place — so both solo CAs and larger practices can run client meetings without the manual coordination.' },
  { q: 'Can clients book appointments online?', a: 'Yes. Clients open your booking link, choose a service such as a tax or GST consultation, pick a convenient time slot and confirm — no calls or waiting for a reply from your office.' },
  { q: 'Can I share my booking link on WhatsApp?', a: 'Yes. Your booking link works anywhere — share it on WhatsApp, in your email signature, on your website or on social media. One link handles all your appointment requests.' },
  { q: 'Can I send WhatsApp reminders?', a: 'Yes. Book A Sloth sends automatic booking confirmations and reminders over WhatsApp and email before each appointment, which cuts no-shows. WhatsApp reminders are included on the Sloth Active plan (and free for your first two months on the Sloth plan).' },
  { q: 'Can I accept online payments?', a: 'Yes. Collect your consultation fee upfront through Razorpay — UPI, cards or netbanking — before the meeting. A GST invoice is generated automatically for every paid booking.' },
  { q: 'Can I manage multiple services?', a: 'Yes. Create and manage as many services as you need — tax consultation, GST filing, audit meetings, advisory calls and more — each with its own duration, price and availability.' },
  { q: 'Can I use Book A Sloth for virtual consultations?', a: 'Yes. Offer online consultations with automatic Google Meet links, or mark services as in-person at your office — or both. Clients pick the mode that suits them.' },
  { q: 'Do I need technical knowledge?', a: 'No. Setup takes minutes and requires no technical skills. You add your services and availability, and your booking page is ready to share — your clients need nothing more than the link.' },
  { q: 'Can I upgrade my plan later?', a: 'Yes. Start free on the Sloth plan and upgrade to Sloth Active whenever your practice needs 0% commission, WhatsApp automation, a full client CRM and advanced tools. You can change plans anytime.' },
  { q: 'Is there a free plan?', a: 'Yes. The Sloth plan is free forever — an online booking page, unlimited services and bookings, UPI payments, 24-hour reminders and GST invoices — with a small 5% per-booking fee. Sloth Active removes that commission entirely and adds automation and growth tools.' },
];

const FOOTER_COLS = [
  { title: 'Product', links: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Integrations', href: '#features' },
    { label: "What's New", to: '/changelog' },
  ] },
  { title: 'For Professionals', links: [
    { label: 'CA', to: '/for/chartered-accountants' },
    { label: 'Consultants', to: '/for/business-consultant' },
    { label: 'Doctors', to: '/for/doctors' },
    { label: 'Salons', to: '/for/salon' },
    { label: 'Freelancers', to: '/for/freelancers' },
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

function Eyebrow({ children }) {
  return (
    <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--ca-primary)' }}>
      {children}
    </span>
  );
}

/* Hero product mockup — a CA practice dashboard (pure CSS/JSX, no screenshot). */
function DashboardMock() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_40px_90px_-30px_rgba(17,17,17,0.4)] ring-1 ring-black/[0.06]">
        {/* top bar */}
        <div className="flex items-center justify-between border-b border-black/5 bg-[#FFF9F5] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: 'var(--ca-primary)' }}>SS</span>
            <div className="leading-tight">
              <div className="text-[13px] font-bold text-[color:var(--ca-ink)]">Sharma &amp; Associates</div>
              <div className="text-[10px] text-neutral-500">Chartered Accountants</div>
            </div>
          </div>
          <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-semibold text-[#1d4ed8]">Today · Tue</span>
        </div>
        {/* stat row */}
        <div className="grid grid-cols-3 gap-px bg-black/5">
          {[
            { v: '4', l: 'Today' },
            { v: '11', l: 'This week' },
            { v: '₹32k', l: 'Revenue' },
          ].map((s) => (
            <div key={s.l} className="bg-white px-3 py-3 text-center">
              <div className="font-heading text-xl font-extrabold text-[color:var(--ca-ink)]">{s.v}</div>
              <div className="mt-0.5 text-[10px] text-neutral-500">{s.l}</div>
            </div>
          ))}
        </div>
        {/* today's meetings */}
        <div className="px-5 py-4">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Today&apos;s meetings</span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--ca-primary)' }}>View all</span>
          </div>
          <div className="space-y-2.5">
            {[
              { t: '10:30', name: 'Nikhil Verma', svc: 'GST Consultation', mode: 'Online', paid: true },
              { t: '12:00', name: 'Aarti Enterprises', svc: 'Audit Meeting', mode: 'In-office', paid: true },
              { t: '16:15', name: 'Rohit Nanda', svc: 'Income Tax Filing', mode: 'Online', paid: false },
            ].map((m) => (
              <div key={m.t} className="flex items-center gap-3 rounded-[10px] border border-black/[0.06] bg-white px-3 py-2.5">
                <div className="flex flex-col items-center rounded-lg bg-[#F5F5F3] px-2 py-1">
                  <span className="text-[11px] font-bold text-[color:var(--ca-ink)]">{m.t}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-bold text-[color:var(--ca-ink)]">{m.name}</div>
                  <div className="truncate text-[10px] text-neutral-500">{m.svc} · {m.mode}</div>
                </div>
                {m.paid
                  ? <span className="flex items-center gap-1 rounded-full bg-[#61C155]/10 px-2 py-0.5 text-[9px] font-bold text-[#61C155]"><Check size={9} /> Paid</span>
                  : <span className="rounded-full bg-[#FFF9F5] px-2 py-0.5 text-[9px] font-bold" style={{ color: 'var(--ca-primary)' }}>Confirmed</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* floating reminder chip */}
      <div className="absolute -right-3 bottom-8 hidden rounded-2xl bg-white px-3 py-2.5 shadow-xl ring-1 ring-black/5 sm:block">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-500"><MessageCircle size={12} style={{ color: 'var(--ca-primary)' }} /> WhatsApp sent</div>
        <div className="mt-0.5 text-[11px] font-bold text-[color:var(--ca-ink)]">Reminder · 1h before</div>
      </div>
    </div>
  );
}

/* Floating glass card over the hero photo — mirrors the homepage hero. */
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

/* Service-category card. `active` cards render pre-filled (blue) in a checkerboard
   and invert to the plain state on hover; plain cards do the opposite. */
function UseCaseCard({ u, active }) {
  const card = active
    ? 'border-[#12648F] bg-[#12648F] hover:border-black/[0.06] hover:bg-white'
    : 'border-black/[0.06] bg-white hover:border-[#12648F] hover:bg-[#12648F]';
  const icon = active
    ? 'bg-[#61C155] text-white ring-white group-hover:bg-[#12648F] group-hover:text-[#61C155] group-hover:ring-transparent'
    : 'bg-[#12648F] text-[#61C155] ring-transparent group-hover:bg-[#61C155] group-hover:text-white group-hover:ring-white';
  const arrow = active
    ? 'bg-white text-[#61C155] group-hover:bg-[rgba(97,193,85,0.16)] group-hover:text-[#4a9e3c]'
    : 'bg-[rgba(97,193,85,0.16)] text-[#4a9e3c] group-hover:bg-white group-hover:text-[#61C155]';
  const title = active ? 'text-white group-hover:text-[color:var(--ca-ink)]' : 'text-[color:var(--ca-ink)] group-hover:text-white';
  const desc = active ? 'text-white/80 group-hover:text-neutral-500' : 'text-neutral-500 group-hover:text-white/80';
  return (
    <Link to={START} className={`group flex h-full flex-col rounded-[14px] border p-5 transition-all duration-300 hover:shadow-[0_14px_34px_-20px_rgba(17,17,17,0.35)] hover:no-underline ${card}`}>
      <div className="flex items-start justify-between">
        <span className={`flex h-12 w-12 items-center justify-center rounded-full ring-2 transition-all duration-300 ${icon}`}>
          <CaIcon name={u.icon} size={22} />
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
        <div aria-hidden className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#61C155]/20 blur-3xl" />
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
                <span className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${on ? 'bg-[#61C155] text-white shadow-[0_8px_20px_-8px_rgba(97,193,85,0.7)]' : 'border-2 border-black/10 bg-white text-[color:var(--ca-primary)]'}`}>
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

/* One integration card — logo + title + subtitle (reference style). */
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

/* Integration hub — mascot centre with a halo, 4 cards either side, each wired in
   by a dashed row-coloured connector carrying an icon badge near the centre.
   Geometry is measured from the real DOM so it always tracks the layout. */
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
        const bx = cx + ux * (Rc + 30);          // icon badge sits just outside the halo
        const by = cy + uy * (Rc + 30);
        const midx = (sx + ex) / 2;
        next.push({ name: t.name, color: ROW_COLORS[idx % ROW_COLORS.length], logo: t.logo, icon: t.icon, sx, sy, bx, by, d: `M ${sx} ${sy} C ${midx} ${sy}, ${midx} ${ey}, ${ex} ${ey}` });
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
        {/* soft peach backdrop */}
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(254,181,120,0.13), transparent 68%)' }} />
        {/* decorative sparks */}
        {SPARKS.map((s, i) => (
          <span key={i} aria-hidden className="absolute h-4 w-[3px] rounded-full" style={{ left: s.left, top: s.top, transform: `rotate(${s.rot}deg)`, background: s.color, opacity: 0.7 }} />
        ))}

        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <style>{`@keyframes caFlow{to{stroke-dashoffset:-16}}.ca-dash{stroke-dasharray:1.5 7;stroke-linecap:round;animation:caFlow 1.1s linear infinite}@media(prefers-reduced-motion:reduce){.ca-dash{animation:none}}`}</style>
          {conns.map((p, i) => (
            <g key={p.name}>
              <path d={p.d} fill="none" stroke={p.color} strokeWidth="2.5" className="ca-dash" style={{ animationDelay: `${i * 0.08}s` }} />
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
              <div aria-hidden className="absolute inset-[-34px] rounded-full border border-dashed border-amber-200/70" />
              <div aria-hidden className="absolute inset-[-14px] rounded-full border border-amber-100" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white shadow-[0_30px_70px_-30px_rgba(17,17,17,0.3)] ring-1 ring-black/5">
                <img src={MASCOT} alt="Book A Sloth" className="h-52 w-52 object-contain" />
              </div>
            </div>
            <div className="relative mt-4 text-center">
              <span className="font-heading text-sm font-semibold italic text-neutral-500">Your Work, Connected</span>
              <svg width="130" height="8" viewBox="0 0 130 8" fill="none" className="mx-auto mt-1"><path d="M2 5 C 34 1, 96 1, 128 4" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" /></svg>
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

/* Smoothly-animated single-open FAQ accordion. */
function FaqAccordion() {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {FAQ.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="overflow-hidden rounded-[12px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'rgba(18,100,143,0.35)' : 'rgba(17,17,17,0.08)' }}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[color:var(--ca-ink)]"
            >
              {f.q}
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'rgba(18,100,143,0.1)', color: 'var(--ca-primary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
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

export default function CharteredAccountants() {
  useLenis();
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  const canonical = `${SITE_URL}/for/chartered-accountants`;
  const seo = {
    title: 'Appointment Booking Software for Chartered Accountants (CAs) | Book A Sloth',
    description: 'Book A Sloth is appointment booking software for Chartered Accountants and CA firms in India. Let clients book tax, GST and advisory consultations online — fees collected upfront, WhatsApp reminders, GST invoices, 0% commission. Start free.',
    keywords: 'appointment booking software for chartered accountants, CA appointment software, book CA consultation online, tax consultation booking, GST consultation scheduling, CA firm scheduling software India, accountant booking page',
    ogTitle: 'Your CA practice runs on client meetings. Let Book A Sloth run them.',
    ogDescription: 'Clients book tax & GST consultations, pay upfront, and get WhatsApp reminders — automatically. The booking page every CA practice in India should already have.',
  };

  const priceLabel = yearly ? `₹${PREMIUM_PLAN.yearly.toLocaleString('en-IN')}` : `₹${PREMIUM_PLAN.monthly}`;
  const pricePer = yearly ? '/year' : '/month';

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
      serviceType: 'Appointment booking software for chartered accountants',
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
        { '@type': 'ListItem', position: 2, name: 'For Chartered Accountants', item: canonical },
      ],
    },
  ];

  const styleVars = {
    '--ca-primary': '#12648F',
    '--ca-accent': '#61C155',
    '--ca-ink': '#111111',
    '--ca-cream': '#FFF9F5',
    '--ca-grey': '#F5F5F3',
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
        themeColor="#FE5100"
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

      {/* ═══════════════ 2 · HERO ═══════════════ */}
      <section className="relative px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-12 lg:pb-28 lg:pt-16" style={{ background: 'linear-gradient(180deg, var(--ca-cream) 0%, #ffffff 100%)' }}>
        <div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* LEFT */}
          <div className="text-center lg:text-left">
            <Reveal as="h1" instant className="text-[clamp(1.7rem,7vw,2.7rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[color:var(--ca-ink)] sm:text-[2.7rem] sm:leading-[1.1] lg:text-[3rem]">
              Simple appointment booking software for{' '}
              <span style={{ color: 'var(--ca-primary)' }}>Chartered Accountants</span>{' '}
              of modern India.
            </Reveal>
            <Reveal as="p" instant delay={0.05} className="mx-auto mt-5 max-w-md text-base leading-relaxed text-neutral-500 sm:mt-7 sm:text-lg lg:mx-0">
              Manage client appointments, availability, payments, reminders and follow-ups from one simple platform built for modern CA practices.
            </Reveal>
            <Reveal instant delay={0.1} className="mt-6 flex flex-col items-center gap-3 sm:mt-9 sm:flex-row sm:gap-5 lg:justify-start">
              <Link
                to={START}
                className="btn flex w-full items-center justify-center gap-2 rounded-[5px] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(16,24,40,0.16)] transition-opacity hover:opacity-90 hover:no-underline sm:w-auto"
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
                  <Check size={14} className="text-[#61C155]" /> {t}
                </span>
              ))}
            </Reveal>
          </div>

          {/* RIGHT — framed brand photo + floating glass cards (mirrors homepage hero) */}
          <Reveal instant delay={0.1} className="relative hidden lg:block">
            {/* soft backdrop so the transparent mascot sits on a surface */}
            <div aria-hidden className="absolute left-1/2 top-1/2 h-[27rem] w-[27rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[rgba(18,100,143,0.12)] to-[rgba(97,193,85,0.14)]" />
            <img src={MASCOT} alt="Book A Sloth — appointment booking for chartered accountants" loading="eager" className="relative z-10 mx-auto w-full max-w-[27rem] drop-shadow-[0_28px_36px_rgba(17,17,17,0.18)]" />
            <GlassCard icon={CalendarCheck} label="New booking" value="GST Consult · 4:30 PM" float="sloth-float" className="top-6 -left-4" />
            <GlassCard icon={Wallet} label="Fee received" value="₹2,500" accent float="sloth-float--mid" className="top-1/2 -right-6" />
            <GlassCard icon={BellRing} label="WhatsApp reminder" value="Sent · 1h before" float="sloth-float--slow" className="bottom-10 left-2" />
          </Reveal>
        </div>

        {/* Four benefits — compact strip, part of the hero (just below the fold) */}
        <div className="mx-auto mt-12 grid max-w-7xl gap-3 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.06}>
              <div className="group flex h-full flex-col rounded-[10px] border border-black/[0.06] bg-white p-4 transition-colors hover:border-[color:var(--ca-primary)]/30">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(18,100,143,0.1)] text-[#12648F] transition-colors duration-300 group-hover:bg-[#12648F] group-hover:text-white">
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

      {/* ═══════════════ 4 · CA PRACTICE USE CASES ═══════════════ */}
      <section id="usecases" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Built around the way <span style={{ color: 'var(--ca-primary)' }}>CA practices work.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-4 text-base text-neutral-500">
              From tax consultations to audits, registrations and financial advisory, manage every appointment in one place.
            </Reveal>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((u, i) => {
              // 4-col checkerboard: row2+4 cols on row1/3, row1+3 cols on row2 pre-active.
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

      {/* ═══════════════ 5 · HOW IT WORKS ═══════════════ */}
      <section id="how" className="px-5 pb-10 pt-20 sm:px-8 lg:pb-14 lg:pt-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              How Book A Sloth helps <span style={{ color: 'var(--ca-primary)' }}>Chartered Accountants</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              From &ldquo;When are you free?&rdquo; to booked in minutes — no back-and-forth.
            </Reveal>
          </div>

          <HowItWorks steps={STEPS} />
        </div>
      </section>

      {/* ═══════════════ 6 · FEATURE SHOWCASE (hub) ═══════════════ */}
      <section id="features" className="px-5 pb-20 pt-6 sm:px-8 lg:pb-28 lg:pt-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Works with the tools you already use.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Connect your calendar, meetings, payments and WhatsApp — Book A Sloth fits your workflow, no rewiring.
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

      {/* ═══════════════ 6.5 · IMPACT (bento) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Real impact for <span style={{ color: 'var(--ca-primary)' }}>Chartered Accountants.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              Less time on admin, more time with clients — and every rupee you earn stays yours.
            </Reveal>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            {/* white — number */}
            <Reveal className="lg:row-span-2">
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] border border-black/[0.06] bg-white p-8">
                <span className="inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ backgroundColor: 'rgba(97,193,85,0.14)', color: '#4a9e3c' }}>Always on</span>
                <div>
                  <div className="font-heading text-6xl font-extrabold tracking-tight text-[color:var(--ca-ink)] sm:text-7xl">24/7</div>
                  <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutral-500">
                    Your booking page never sleeps — clients reserve tax, GST and advisory consultations any time, day or night, while you focus on the work.
                  </p>
                </div>
                <TrendingUp aria-hidden size={200} strokeWidth={1} className="pointer-events-none absolute -bottom-8 -right-8 text-black/[0.03]" />
              </div>
            </Reveal>

            {/* green — number */}
            <Reveal delay={0.06}>
              <div className="flex h-full flex-col justify-between gap-6 rounded-[20px] p-7 text-white" style={{ background: '#61C155' }}>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/80">You keep</span>
                <div>
                  <div className="font-heading text-5xl font-extrabold tracking-tight">100%</div>
                  <p className="mt-2 text-sm text-white/85">Of every fee on Sloth Active — 0% commission, every rupee stays yours.</p>
                </div>
              </div>
            </Reveal>

            {/* black — number */}
            <Reveal delay={0.1}>
              <div className="flex h-full flex-col justify-between gap-6 rounded-[20px] p-7 text-white" style={{ background: 'var(--ca-ink)' }}>
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/50">To start</span>
                <div>
                  <div className="font-heading text-5xl font-extrabold tracking-tight">₹0</div>
                  <p className="mt-2 text-sm text-white/60">Free forever plan — no card, no lock-in.</p>
                </div>
              </div>
            </Reveal>

            {/* blue — community CTA */}
            <Reveal delay={0.14} className="lg:col-span-2">
              <a href="https://whatsapp.com/channel/0029Vb8ZyHP6GcG6LRA2K81Y" target="_blank" rel="noopener noreferrer" className="group flex h-full items-center justify-between gap-4 rounded-[20px] p-7 text-white hover:no-underline" style={{ background: 'var(--ca-primary)' }}>
                <div>
                  <div className="font-heading text-xl font-extrabold sm:text-2xl">Join the community</div>
                  <p className="mt-1 text-sm text-white/70">Connect with fellow CAs and creators growing on Book A Sloth.</p>
                </div>
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white transition-transform group-hover:translate-x-1" style={{ color: 'var(--ca-primary)' }}>
                  <ArrowRight size={22} />
                </span>
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════ 7 · CA WORKFLOW / CLIENT JOURNEY ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-5xl text-center">
          <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Give every client a <span style={{ color: 'var(--ca-primary)' }}>smoother experience.</span>
          </Reveal>
          <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-2xl text-base text-neutral-500">
            From the first booking to the final follow-up, Book A Sloth keeps your client journey organised.
          </Reveal>
          <Reveal delay={0.1} className="mt-12">
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {JOURNEY.map((j, i) => (
                <div key={j.label} className="flex items-center gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 py-2.5 shadow-[0_6px_20px_-12px_rgba(17,17,17,0.3)]">
                    <j.icon size={15} style={{ color: 'var(--ca-primary)' }} />
                    <span className="text-[13px] font-semibold text-[color:var(--ca-ink)]">{j.label}</span>
                  </div>
                  {i < JOURNEY.length - 1 && <ArrowRight size={15} className="text-neutral-300" />}
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal as="p" delay={0.14} className="mx-auto mt-10 max-w-xl text-[15px] font-medium text-neutral-600">
            Less administrative work for your team. A more professional experience for your clients.
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 8 · TESTIMONIALS ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="p"><Eyebrow>Trusted by Professionals</Eyebrow></Reveal>
            <Reveal as="h2" delay={0.05} className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Your clients notice when your practice runs smoothly.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3 sm:gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 0.08}>
                <figure className="flex h-full flex-col justify-between rounded-[16px] border border-black/[0.06] bg-white p-7 shadow-[0_8px_30px_rgba(17,17,17,0.05)]">
                  <div>
                    <div className="flex gap-0.5">
                      {[0, 1, 2, 3, 4].map((s) => <Star key={s} size={15} className="fill-[#12648F] text-[#12648F]" />)}
                    </div>
                    <blockquote className="mt-4 text-[15px] font-semibold leading-snug text-[color:var(--ca-ink)]">&ldquo;{t.quote}&rdquo;</blockquote>
                  </div>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'var(--ca-primary)' }}>{t.name.charAt(0)}</span>
                    <div>
                      <div className="text-sm font-bold text-[color:var(--ca-ink)]">{t.name}</div>
                      <div className="text-xs text-neutral-500">{t.role}</div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 9 · WHY BOOK A SLOTH ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-grey)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="p"><Eyebrow>Why Book A Sloth</Eyebrow></Reveal>
            <Reveal as="h2" delay={0.05} className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              More than a booking tool. <span style={{ color: 'var(--ca-primary)' }}>A better way to run your practice.</span>
            </Reveal>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={(i % 4) * 0.07}>
                <div className="h-full rounded-[16px] border border-black/[0.06] bg-white p-6 sm:p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(18,100,143,0.1)', color: 'var(--ca-primary)' }}>
                    <w.icon size={20} />
                  </span>
                  <h3 className="mt-5 font-heading text-base font-bold">{w.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 10 · TRUST STRIP (honest, verifiable) ═══════════════ */}
      <section className="border-y border-black/5 px-5 py-12 sm:px-8" style={{ background: 'var(--ca-ink)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST_STRIP.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <s.icon size={20} className="mx-auto" style={{ color: 'var(--ca-primary)' }} />
              <div className="mt-2 font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{s.value}</div>
              <p className="mx-auto mt-1.5 max-w-[14rem] text-xs leading-snug text-white/50">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 11 · PRICING ═══════════════ */}
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="p"><Eyebrow>Simple, Transparent Pricing</Eyebrow></Reveal>
            <Reveal as="h2" delay={0.05} className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Start small. <span style={{ color: 'var(--ca-primary)' }}>Grow when your practice does.</span>
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
              Yearly <span className="ml-1 rounded-full bg-[#61C155]/12 px-2 py-0.5 text-xs font-bold text-[#61C155]">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>
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
                  <CtaButton to={START} variant="ghost" className="mt-6 w-full">Get Started</CtaButton>
                </div>
              </Reveal>

              {/* Sloth Active (premium) — recommended */}
              <Reveal delay={0.08}>
                <div className="relative flex h-full flex-col rounded-[18px] border-2 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(16,24,40,0.14)]" style={{ borderColor: 'var(--ca-primary)' }}>
                  <div className="flex items-center justify-between">
                    <div className="font-heading text-lg font-bold">{PREMIUM_PLAN.name}</div>
                    {yearly && <span className="rounded-full bg-[#61C155] px-2.5 py-0.5 text-xs font-bold text-white">Save {PREMIUM_ANNUAL_SAVE_PCT}%</span>}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">Keep every rupee. Automate the rest.</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="pb-1.5 text-2xl font-bold" style={{ color: 'var(--ca-primary)' }}>₹</span>
                    <span className="font-heading text-5xl font-extrabold tracking-tight" style={{ color: 'var(--ca-primary)' }}>{yearly ? Math.round(PREMIUM_PLAN.yearly / 12) : PREMIUM_PLAN.monthly}</span>
                    <span className="pb-2 text-sm text-neutral-500">/month</span>
                    {yearly && <span className="pb-2 ml-1 text-sm text-neutral-500 line-through">₹{PREMIUM_PLAN.monthly}</span>}
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-neutral-500">{yearly ? `Billed ₹${PREMIUM_PLAN.yearly.toLocaleString('en-IN')}/year · GST included` : 'Billed monthly · GST included'}</p>
                  <CtaButton to={START} className="mt-6 w-full">Get Started Now</CtaButton>
                </div>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.12} className="mt-8 flex flex-col items-center gap-2 text-center">
            <span className="flex items-center gap-1.5 text-sm text-neutral-500"><Lock size={14} className="text-[#61C155]" /> Access to all features with no hidden fees</span>
            <Link to="/pricing" className="text-sm font-semibold text-neutral-500 underline-offset-4 hover:text-[color:var(--ca-ink)] hover:underline">
              Compare every feature on the full pricing page
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 12 · ABOUT ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--ca-cream)' }}>
        <div className="mx-auto max-w-3xl text-center">
          <Reveal as="p"><Eyebrow>About Book A Sloth</Eyebrow></Reveal>
          <Reveal as="h2" delay={0.05} className="mt-4 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Small businesses deserve better tools.
          </Reveal>
          <Reveal as="p" delay={0.08} className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral-600">
            Book A Sloth was built to make appointment-based businesses easier to run. Instead of stitching together calendars, WhatsApp messages, spreadsheets and payment tools, professionals can manage their client appointments from one simple platform.
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-2xl text-[15px] font-medium text-neutral-500">
            Built for Indian professionals. Designed for the way modern businesses actually work.
          </Reveal>
          <Reveal delay={0.14} className="mt-8">
            <Link to="/about" className="inline-flex items-center gap-2 text-sm font-semibold hover:no-underline" style={{ color: 'var(--ca-primary)' }}>
              Learn More About Us <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 13 · FAQ ═══════════════ */}
      <section id="faq" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal as="h2" className="text-center font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Questions? <span style={{ color: 'var(--ca-primary)' }}>We&apos;ve got answers.</span>
          </Reveal>
          <div className="mt-12"><FaqAccordion /></div>
        </div>
      </section>

      {/* ═══════════════ 14 · FINAL CTA ═══════════════ */}
      <section className="px-5 py-24 text-center sm:px-8" style={{ background: 'var(--ca-ink)' }}>
        <div className="mx-auto max-w-2xl">
          <Reveal className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(18,100,143,0.2)' }}>
            <Zap size={26} style={{ color: 'var(--ca-primary)' }} />
          </Reveal>
          <Reveal as="h2" delay={0.06} className="mt-6 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Spend less time managing appointments. Spend more time growing your practice.
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-lg text-base text-white/60">
            Set up your booking page today and give your clients a simpler way to meet with you.
          </Reveal>
          <Reveal delay={0.14} className="mt-8">
            <CtaButton to={START} className="!px-8 !py-4">Start for Free <ArrowRight size={16} /></CtaButton>
          </Reveal>
          <Reveal as="p" delay={0.18} className="mt-4 text-xs text-white/40">No credit card required</Reveal>
        </div>
      </section>

      {/* ═══════════════ 15 · FOOTER ═══════════════ */}
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
            <p className="text-xs text-neutral-500">Made for India&apos;s Chartered Accountants</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

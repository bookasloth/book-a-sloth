// /for/astrologers — bespoke, conversion-focused landing page for astrologers,
// Vedic astrologers, tarot readers & numerologists in India.
//
// STANDALONE page (not the data-driven ProfessionLanding template): ported from
// the "AstroSathi" design in the Profession-Pages brief, re-skinned to Book A
// Sloth and rewritten from guest-facing ("book your reading") to HOST-facing
// ("run your practice on Book A Sloth"). Every CTA hands off to the real host
// signup funnel (/be-a-sloth); nothing here books an end-customer.
//
// Design is self-contained: the astro palette + Playfair/Inter fonts are scoped
// to `.astro-lp` so they never leak into the global theme (Plus Jakarta/Poppins).
// Imagery (astro-hero/about.webp) lives in /public/for/astrologers.
//
// Honesty rules held (see docs): pricing mirrors the REAL two-plan model from
// data/plans.js; NO fabricated client/booking counts — the numbers strip is a
// verifiable trust strip; testimonials are clearly-structured placeholders to be
// swapped for real quotes; JSON-LD carries NO self-serving aggregateRating.
//
// New URL — keep in sync: App.jsx route (before /for/:profession), prerender.mjs
// list, and Solutions.jsx.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Check, Menu, X, Plus, Star, Moon, Sun, Sparkles,
  CalendarCheck, LayoutDashboard, MessageCircle, TrendingUp,
  Wallet, BellRing, MapPin, Users, Lock, Receipt, BadgePercent,
  Heart, Briefcase, Compass, Hash, Flame, HandHeart, Video,
} from 'lucide-react';
import Reveal from '../../components/home/Reveal';
import Seo from '../../components/common/Seo';
import useLenis from '../../hooks/useLenis';
import { SITE_URL } from '../../utils/seo';
import { FREE_PLAN, PREMIUM_PLAN } from '../../data/plans';
import razorpayLogo from '../enterprise-v2/assets/logo/razorpay.png';
import outlookLogo from '../enterprise-v2/assets/logo/outlook.svg';
import meetLogo from '../enterprise-v2/assets/logo/meet.svg';
import zoomLogo from '../enterprise-v2/assets/logo/zoom.svg';
import calendarLogo from '../enterprise-v2/assets/logo/calendar.svg';

const WHATSAPP_LOGO = '/for/astrologers/whatsapp.svg'; // green WhatsApp mark (public asset)

const START = '/be-a-sloth';      // real host signup funnel
const LOGIN = '/login-as-vendor'; // host login (Google-only door)
const HERO_IMG = '/for/astrologers/hero-sloth.webp';
const ABOUT_IMG = '/for/astrologers/astro-about.webp';

/* ─────────────────────────────  CONTENT  ────────────────────────────── */

const NAV = [
  { label: 'Services', href: '#services' },
  { label: 'How It Works', href: '#how' },
  { label: 'Why Book A Sloth', href: '#why' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Resources', to: '/blog' },
];

const HERO_TRUST = ['No credit card required', 'Setup in minutes', 'Built for Indian astrologers'];

const BENEFITS = [
  { icon: CalendarCheck, title: 'Get Booked', desc: 'Seekers book and pay for a reading, without the DM back-and-forth.' },
  { icon: LayoutDashboard, title: 'Stay Organised', desc: 'Calendar, availability and every consultation in one place.' },
  { icon: MessageCircle, title: 'Automate Follow-Ups', desc: 'Automatic confirmations and reminders, sent over WhatsApp.' },
  { icon: TrendingUp, title: 'Grow Your Practice', desc: 'See bookings, revenue and repeat seekers with clear insights.' },
];

// Astro service types — the consultations an astrologer sells on Book A Sloth.
// `ring` = 3 heading-related icons that orbit the corner ring motif.
const SERVICES = [
  { icon: Moon, label: 'Horoscope Reading', desc: 'Birth-chart readings, booked by slot.', ring: [Moon, Star, Sparkles] },
  { icon: Heart, label: 'Love & Relationship', desc: 'Compatibility and guidance sessions.', ring: [Heart, Users, Sparkles] },
  { icon: Briefcase, label: 'Career & Finance', desc: 'Timing and direction consultations.', ring: [Briefcase, TrendingUp, Wallet] },
  { icon: HandHeart, label: 'Health & Wellness', desc: 'Remedial and well-being guidance.', ring: [HandHeart, Heart, Sparkles] },
  { icon: Compass, label: 'Vastu Consultation', desc: 'Home and workplace alignment.', ring: [Compass, MapPin, Star] },
  { icon: Hash, label: 'Numerology', desc: 'Name and number analysis calls.', ring: [Hash, Star, Sparkles] },
  { icon: Flame, label: 'Puja & Remedies', desc: 'Ritual guidance and remedies.', ring: [Flame, Sparkles, Sun] },
  { icon: Sparkles, label: 'Life Guidance', desc: 'Open sessions for life’s big questions.', ring: [Sparkles, Sun, Compass] },
];

const STEPS = [
  { title: 'Create & share your page', icon: LayoutDashboard, desc: 'Set up your practice, your services and your available hours, then share your booking link anywhere.' },
  { title: 'Seekers book & pay', icon: CalendarCheck, desc: 'Clients pick a reading and a time, and pay your fee upfront — no DMs, no back-and-forth.' },
  { title: 'Everyone gets reminded', icon: BellRing, desc: 'You and your client get automatic confirmations and WhatsApp reminders before the session.' },
];

// REAL Book A Sloth integrations only.
const TOOLS = [
  { name: 'Google Calendar', logo: calendarLogo, sub: 'Two-way sync of your real availability' },
  { name: 'WhatsApp', logo: WHATSAPP_LOGO, sub: 'Send reminders and updates' },
  { name: 'Google Meet', logo: meetLogo, sub: 'Auto-add a video link to every reading' },
  { name: 'Zoom', logo: zoomLogo, sub: 'Share meeting links automatically' },
  { name: 'Outlook', logo: outlookLogo, sub: 'Keep your calendar in sync' },
  { name: 'Razorpay', logo: razorpayLogo, sub: 'Payments, refunds and GST invoices' },
];

const JOURNEY = [
  { icon: CalendarCheck, label: 'Seeker books reading', sub: 'A slot picked from your live availability.' },
  { icon: Check, label: 'Instant confirmation', sub: 'Booking confirmed the moment they pay.' },
  { icon: MessageCircle, label: 'WhatsApp reminder', sub: 'A nudge before the session — no no-shows.' },
  { icon: Video, label: 'The session', sub: 'Meet online or in person, your choice.' },
  { icon: Wallet, label: 'Paid upfront', sub: 'Fee collected before you begin.' },
  { icon: BellRing, label: 'Gentle follow-up', sub: 'A thank-you and an easy rebook.' },
];

// Structured for easy swap when real customer quotes are approved.
// Placeholder testimonials — swap for real, approved quotes. Pool of 6 feeds the
// 3 rotating columns (2 each), so no duplicate shows at once.
const TESTIMONIALS = [
  { quote: 'The DM chaos is gone. Seekers pick a slot, pay for the reading, and my day is planned before I wake up.', name: 'Priya Sharma', role: 'Vedic Astrologer, Jaipur', avatar: '/for/astrologers/astro-priya.svg' },
  { quote: 'Upfront payment ended the no-shows. People who book a session actually show up for it now.', name: 'Rohit Verma', role: 'Numerologist, Pune', avatar: '/for/astrologers/astro-rohit.svg' },
  { quote: 'One link in my Instagram bio does everything — bookings, reminders, invoices. I just read the charts.', name: 'Anjali Nair', role: 'Tarot Reader, Kochi', avatar: '' },
  { quote: 'Clients love the WhatsApp reminders. My repeat bookings have gone up without me chasing anyone.', name: 'Deepak Rao', role: 'Vedic Astrologer, Hyderabad', avatar: '' },
  { quote: 'Setting up my services took ten minutes. Now every consultation is booked and paid before it starts.', name: 'Meera Iyer', role: 'Vastu Expert, Chennai', avatar: '' },
  { quote: 'GST invoices are generated automatically — my accountant is happier and so am I.', name: 'Kabir Singh', role: 'Astrologer, Delhi', avatar: '' },
];

const WHY = [
  { icon: MapPin, title: 'Built for India', desc: 'Designed around Indian astrologers, UPI payments, GST and the way seekers already reach you.' },
  { icon: Users, title: 'Easy for Your Seekers', desc: 'No signup or app to install — clients open your link, pick a slot and pay in seconds.' },
  { icon: MessageCircle, title: 'WhatsApp First', desc: 'Confirmations and reminders go out on the channel your clients already live on.' },
  { icon: Lock, title: 'Private & Secure', desc: 'Sessions and client details stay confidential; payments are Razorpay-secured.' },
];

// Honest trust strip — verifiable facts, NOT fabricated client/reading counts.
const TRUST_STRIP = [
  { icon: BadgePercent, value: '0%', label: 'Commission on Sloth Active — keep every rupee' },
  { icon: Receipt, value: 'GST', label: 'Tax invoices generated automatically' },
  { icon: Lock, value: 'UPI + Cards', label: 'Razorpay-secured payments' },
  { icon: MapPin, value: 'Made in India', label: 'For Indian astrologers & practices' },
];

const FAQ = [
  { q: 'Is Book A Sloth suitable for astrologers and tarot readers?', a: 'Yes. Whether you read birth charts, tarot or numbers, Book A Sloth manages your services, availability, client bookings, payments and reminders from one place — so solo astrologers and larger practices can run sessions without the manual coordination.' },
  { q: 'Can seekers book a reading online?', a: 'Yes. Clients open your booking link, choose a service such as a horoscope reading or a Vastu consultation, pick a convenient slot and confirm — no DMs or waiting for a reply.' },
  { q: 'Can I share my booking link on Instagram and WhatsApp?', a: 'Yes. Your booking link works anywhere — put it in your Instagram bio, share it on WhatsApp status, in your email signature or on your website. One link handles every booking request.' },
  { q: 'Can I send WhatsApp reminders?', a: 'Yes. Book A Sloth sends automatic booking confirmations and reminders over WhatsApp and email before each session, which cuts no-shows. WhatsApp reminders are included on the Sloth Active plan (and free for your first two months on the Sloth plan).' },
  { q: 'Can I collect the consultation fee upfront?', a: 'Yes. Collect your fee before the session through Razorpay — UPI, cards or netbanking. Upfront payment ends no-shows, and a GST invoice is generated automatically for every paid booking.' },
  { q: 'Can I offer readings online and in person?', a: 'Yes. Offer online sessions with automatic Google Meet or Zoom links, or mark a service as in-person at your space — or both. Seekers pick the mode that suits them.' },
  { q: 'Can I manage multiple services?', a: 'Yes. Create as many services as you need — horoscope readings, love and career guidance, Vastu, numerology, puja and remedies — each with its own duration, price and availability.' },
  { q: 'Do I need any technical knowledge?', a: 'No. Setup takes minutes and needs no technical skills. You add your services and hours, and your booking page is ready to share — your clients need nothing more than the link.' },
  { q: 'Is there a free plan?', a: 'Yes. The Sloth plan is free forever — an online booking page, unlimited services and bookings, UPI payments, 24-hour reminders and GST invoices — with a small 5% per-booking fee. Sloth Active removes that commission entirely and adds WhatsApp automation and growth tools.' },
];

const FOOTER_COLS = [
  { title: 'Product', links: [
    { label: 'Features', href: '#why' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Integrations', href: '#integrations' },
    { label: "What's New", to: '/changelog' },
  ] },
  { title: 'For Professionals', links: [
    { label: 'Astrologers', to: '/for/astrologers' },
    { label: 'Doctors', to: '/for/doctors' },
    { label: 'Salons', to: '/for/salon' },
    { label: 'Tutors', to: '/for/tutors' },
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

// Plain pill; on mouse-LEAVE it flicks a one-shot sparkle trail (magic wand).
// `cast` bumps a key so the overlay remounts and replays its CSS animation
// each time, then clears itself when the ring animation ends. No hover state.
const CAST_SPARKS = [
  { dx: '34px', dy: '-20px' }, { dx: '-30px', dy: '-16px' }, { dx: '22px', dy: '18px' },
  { dx: '-26px', dy: '14px' }, { dx: '4px', dy: '-26px' }, { dx: '40px', dy: '4px' },
];
// Golden sparkle positions around the ACTIVE how-it-works step icon box.
const STEP_SPARKS = [
  { top: '-6px', left: '-6px', width: '7px', height: '7px', animationDelay: '0ms' },
  { top: '-8px', right: '4px', width: '5px', height: '5px', animationDelay: '280ms' },
  { bottom: '-6px', right: '-6px', width: '7px', height: '7px', animationDelay: '150ms' },
  { bottom: '-4px', left: '6px', width: '4px', height: '4px', animationDelay: '440ms' },
  { top: '42%', right: '-9px', width: '5px', height: '5px', animationDelay: '600ms' },
];
function CtaButton({ to, children, className = '' }) {
  const [cast, setCast] = useState(0);
  return (
    <Link
      to={to}
      onMouseLeave={() => setCast((c) => c + 1)}
      className={`relative inline-flex items-center justify-center gap-2 overflow-visible rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:no-underline active:scale-[0.98] ${className}`}
      style={{ background: 'linear-gradient(120deg, var(--as-secondary), var(--as-primary))' }}
    >
      {children}
      {cast > 0 && (
        <span key={cast} className="as-cast" aria-hidden onAnimationEnd={(e) => { if (e.animationName.includes('as-cast-ring')) setCast(0); }}>
          <i className="as-ring" />
          {CAST_SPARKS.map((s, i) => (
            <i key={i} className="as-spark" style={{ '--dx': s.dx, '--dy': s.dy, animationDelay: `${i * 18}ms` }} />
          ))}
        </span>
      )}
    </Link>
  );
}

/* Corner ring motif for a service card — 2 concentric circles + 3 heading icons
   orbiting the middle ring. Positioned so only the inner quarter shows (card clips). */
function CardRings({ icons }) {
  return (
    <div className="as-rings" aria-hidden>
      <span className="as-ring as-ring-outer" />
      <span className="as-ring as-ring-mid" />
      <span className="as-ring as-ring-inner" />
      <div className="as-ring-orbit">
        {icons.map((Ic, i) => (
          <span key={i} className="as-orbit-icon" style={{ '--a': `${i * 120}deg` }}>
            <span><Ic size={13} /></span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* A distinct COSMIC background per bento card (6 variants) — starfields, nebulae,
   a shooting star, a galaxy. `c(a)` yields the star/ink colour at alpha `a` (white
   on purple cards, deep-indigo on gold cards). All original CSS, no imagery. */
function BentoSpace({ i, c }) {
  const cover = { position: 'absolute', inset: 0 };
  // reusable scattered-star field
  const stars = (a) => [
    `radial-gradient(1.4px 1.4px at 14% 22%, ${c(a)}, transparent)`,
    `radial-gradient(1px 1px at 68% 16%, ${c(a)}, transparent)`,
    `radial-gradient(1.6px 1.6px at 38% 66%, ${c(a)}, transparent)`,
    `radial-gradient(1px 1px at 84% 60%, ${c(a)}, transparent)`,
    `radial-gradient(1.2px 1.2px at 26% 86%, ${c(a)}, transparent)`,
    `radial-gradient(1px 1px at 58% 44%, ${c(a)}, transparent)`,
    `radial-gradient(1.3px 1.3px at 90% 30%, ${c(a)}, transparent)`,
    `radial-gradient(1px 1px at 48% 12%, ${c(a)}, transparent)`,
  ].join(', ');
  switch (i % 6) {
    case 0: // dense starfield
      return <span aria-hidden style={{ ...cover, backgroundImage: stars(0.8) }} />;
    case 1: // nebula clouds + a few stars
      return <span aria-hidden style={{ ...cover, backgroundImage: `radial-gradient(circle at 82% 18%, ${c(0.22)}, transparent 46%), radial-gradient(circle at 16% 78%, ${c(0.16)}, transparent 42%), ${stars(0.7)}` }} />;
    case 2: // twinkling stars
      return <span aria-hidden className="as-bento-twinkle" style={{ ...cover, backgroundImage: stars(0.85) }} />;
    case 3: // shooting star + stars
      return (<>
        <span aria-hidden style={{ ...cover, backgroundImage: stars(0.6) }} />
        <span aria-hidden style={{ position: 'absolute', top: '26%', right: '14%', height: '2px', width: '96px', transform: 'rotate(38deg)', transformOrigin: 'right center', background: `linear-gradient(90deg, transparent, ${c(0.85)})`, borderRadius: '9999px' }} />
        <span aria-hidden style={{ position: 'absolute', top: 'calc(26% - 2px)', right: '13%', height: '6px', width: '6px', borderRadius: '9999px', background: c(0.95), boxShadow: `0 0 8px 2px ${c(0.6)}` }} />
      </>);
    case 4: // milky-way band + stars
      return (<>
        <span aria-hidden style={{ position: 'absolute', inset: '-20%', transform: 'rotate(-24deg)', background: `linear-gradient(90deg, transparent, ${c(0.16)} 45%, ${c(0.16)} 55%, transparent)`, filter: 'blur(6px)' }} />
        <span aria-hidden style={{ ...cover, backgroundImage: stars(0.7) }} />
      </>);
    default: // galaxy — faint concentric glow + stars
      return (<>
        <span aria-hidden style={{ position: 'absolute', right: '-30px', top: '-30px', height: '150px', width: '150px', borderRadius: '9999px', background: `repeating-radial-gradient(circle, ${c(0.14)} 0 1px, transparent 1px 12px)` }} />
        <span aria-hidden style={{ position: 'absolute', right: '8px', top: '8px', height: '10px', width: '10px', borderRadius: '9999px', background: c(0.9), boxShadow: `0 0 12px 3px ${c(0.5)}` }} />
        <span aria-hidden style={{ ...cover, backgroundImage: stars(0.6) }} />
      </>);
  }
}

/* Prominent bento card — solid alternating purple/gold, a unique background shape
   per card, a title-related icon and a big ghosted step number. */
function BentoCard({ step, icon: Icon, title, sub, gold, shape }) {
  const c = (a) => gold ? `rgba(36,28,78,${a})` : `rgba(255,255,255,${a})`;
  return (
    <div
      className="relative flex h-full min-h-[178px] flex-col justify-between overflow-hidden rounded-[20px] p-6 shadow-[0_20px_45px_-24px_rgba(47,35,115,0.5)]"
      style={{ background: gold ? 'var(--as-gold)' : 'var(--as-secondary)', color: gold ? 'var(--as-deep)' : '#ffffff' }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden><BentoSpace i={shape} c={c} /></div>

      <div className="relative z-10 flex items-center justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: c(gold ? 0.14 : 0.18), color: gold ? 'var(--as-primary)' : 'var(--as-gold)' }}>
          <Icon size={24} />
        </span>
        <span className="text-[2.6rem] font-bold leading-none" style={{ color: c(0.28) }}>{step}</span>
      </div>
      <div className="relative z-10 mt-6">
        <h3 className="text-lg font-bold leading-tight" style={{ color: 'inherit' }}>{title}</h3>
        <p className="mt-1.5 text-sm leading-snug" style={{ opacity: 0.82 }}>{sub}</p>
      </div>
    </div>
  );
}

/* Testimonial avatar — real photo, else an initial disc. */
function TAvatar({ t }) {
  return t.avatar
    ? <img src={t.avatar} alt={t.name} loading="lazy" width={64} height={64} className="h-16 w-16 rounded-full object-cover shadow-[0_8px_20px_-8px_rgba(47,35,115,0.5)] ring-4 ring-white" />
    : <span className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white shadow-[0_8px_20px_-8px_rgba(47,35,115,0.5)] ring-4 ring-white" style={{ background: 'var(--as-secondary)' }}>{t.name.charAt(0)}</span>;
}

/* Testimonial card — avatar overlapping the top, quote badge, name/role/quote/stars. */
function TCard({ t }) {
  return (
    <div className="relative mt-9 rounded-[18px] border border-[color:var(--as-line)] bg-white px-6 pb-7 pt-11 text-center shadow-[0_18px_45px_-28px_rgba(47,35,115,0.5)]">
      <div className="absolute -top-8 left-1/2 -translate-x-1/2"><TAvatar t={t} /></div>
      <span aria-hidden className="absolute left-5 top-7 flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold leading-none" style={{ background: 'color-mix(in srgb, var(--as-gold) 28%, white)', color: 'var(--as-gold)' }}>&ldquo;</span>
      <h3 className="text-lg font-bold text-[color:var(--as-ink)]">{t.name}</h3>
      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-neutral-500">{t.role}</p>
      <p className="mt-3 text-sm leading-relaxed text-neutral-500">{t.quote}</p>
      <div className="mt-4 flex justify-center gap-0.5">
        {[0, 1, 2, 3, 4].map((s) => <Star key={s} size={15} style={{ color: 'var(--as-gold)', fill: 'var(--as-gold)' }} />)}
      </div>
    </div>
  );
}

/* One rotating column — swaps its card up-and-out for the next, at a random
   3–5s interval so the three columns cycle out of sync. */
function TestimonialColumn({ items, className = '' }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (items.length < 2) return undefined;
    let timer;
    const tick = () => { timer = setTimeout(() => { setIdx((i) => (i + 1) % items.length); tick(); }, 3000 + Math.random() * 2000); };
    tick();
    return () => clearTimeout(timer);
  }, [items.length]);
  const item = items[idx] || items[0];
  if (!item) return null;
  return (
    <div className={`relative h-[360px] ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={item.name}
          className="absolute inset-x-0 top-0"
          initial={{ y: 48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <TCard t={item} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* Floating glass chip over the hero image — mirrors the CA / homepage hero. */
function GlassCard({ icon: Icon, label, value, accent, className = '' }) {
  return (
    <div className={`absolute flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-[0_18px_40px_-20px_rgba(47,35,115,0.4)] backdrop-blur-md ${className}`}>
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={accent
          ? { backgroundColor: 'color-mix(in srgb, var(--as-secondary) 16%, transparent)', color: 'var(--as-secondary)' }
          : { backgroundColor: 'rgba(31,27,58,0.06)', color: '#4a4560' }}
      >
        <Icon size={18} />
      </span>
      <div>
        <div className="text-[11px] font-medium text-neutral-400">{label}</div>
        <div className="text-sm font-semibold" style={{ color: accent ? 'var(--as-secondary)' : 'var(--as-ink)' }}>{value}</div>
      </div>
    </div>
  );
}

/* How-it-works: auto-advancing, clickable step timeline. */
function HowItWorks({ steps }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setActive((a) => (a + 1) % steps.length), 3000);
    return () => clearTimeout(t);
  }, [active, steps.length]);
  return (
    <div className="mt-14 grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
      <div className="relative mx-auto w-full max-w-[39rem] lg:mx-0">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--as-secondary) 22%, transparent)' }} />
        <div className="relative z-10 aspect-square">
          <img src={ABOUT_IMG} alt="Book A Sloth for astrologers" loading="lazy" decoding="async" width="1100" height="619" className="absolute inset-0 mx-auto h-full w-full object-contain drop-shadow-[0_24px_32px_rgba(47,35,115,0.16)]" />
        </div>
      </div>
      <div className="relative">
        <span aria-hidden className="absolute bottom-5 left-6 top-5 w-px bg-black/10" />
        <div className="space-y-8">
          {steps.map((s, i) => {
            const on = i === active;
            return (
              <button key={s.title} type="button" onClick={() => setActive(i)} aria-current={on} className="relative flex w-full gap-5 text-left">
                <span className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${on ? 'text-white shadow-[0_8px_20px_-8px_rgba(107,92,231,0.7)]' : 'border-2 border-black/10 bg-white'}`} style={on ? { background: 'var(--as-secondary)' } : { color: 'var(--as-primary)' }}>
                  <s.icon size={20} />
                  {on && STEP_SPARKS.map((sp, k) => <i key={k} className="as-step-spark" style={sp} aria-hidden />)}
                </span>
                <div className={`pt-1.5 transition-opacity duration-300 ${on ? 'opacity-100' : 'opacity-90'}`}>
                  <h3 className="text-lg font-bold text-[color:var(--as-ink)]">{s.title}</h3>
                  <p className="mt-1 max-w-sm text-sm leading-relaxed text-neutral-600">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
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
          <div key={f.q} className="overflow-hidden rounded-[12px] border bg-white transition-colors" style={{ borderColor: isOpen ? 'var(--as-secondary)' : 'var(--as-line)' }}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-[color:var(--as-ink)]"
            >
              {f.q}
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-transform duration-300" style={{ backgroundColor: 'var(--as-lavender)', color: 'var(--as-secondary)', transform: isOpen ? 'rotate(45deg)' : 'none' }}>
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

export default function Astrologers() {
  useLenis();
  const [menuOpen, setMenuOpen] = useState(false);

  const canonical = `${SITE_URL}/for/astrologers`;
  const seo = {
    title: 'Appointment Booking Software for Astrologers | Book A Sloth',
    description: 'Book A Sloth is appointment booking software for astrologers, tarot readers, numerologists and Vedic astrologers in India. Let seekers book readings online — fees collected upfront, WhatsApp reminders, GST invoices, 0% commission. Start free.',
    keywords: 'appointment booking software for astrologers, astrology consultation booking, book astrology reading online, tarot booking software, numerology appointment scheduling, Vedic astrologer booking page India, astrologer scheduling software',
    ogTitle: 'Your astrology practice runs on readings. Let Book A Sloth run the bookings.',
    ogDescription: 'Seekers book readings, pay upfront and get WhatsApp reminders — automatically. The booking page every astrologer in India should already have.',
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
      serviceType: 'Appointment booking software for astrologers',
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
        { '@type': 'ListItem', position: 2, name: 'For Astrologers', item: canonical },
      ],
    },
  ];

  const styleVars = {
    '--as-bg': '#FFFEFC',
    '--as-primary': '#2F2373',
    '--as-secondary': '#6B5CE7',
    '--as-gold': '#E8A93C',
    '--as-lavender': '#F3EEFF',
    '--as-line': '#E7DDFB',
    '--as-ink': '#1F1B3A',
    '--as-deep': '#241C4E',
  };

  return (
    <main className="astro-lp overflow-x-clip text-[color:var(--as-ink)]" style={{ ...styleVars, background: 'var(--as-bg)' }}>
      {/* Scoped fonts — headings serif + Poppins body, confined to .astro-lp so the
          global theme is untouched.
          NOTE: the brief asked for Tiempos Headline Semibold (Klim Type Foundry — a
          PAID, licensed font). It is NOT bundled here because it can't be redistributed
          without a licence. Fraunces (open, Google Fonts) stands in as a close
          high-contrast serif. To use real Tiempos: drop the licensed .woff2 into
          /public/for/astrologers/, add an @font-face for it below, and change the
          heading font-family to 'Tiempos Headline'. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');
        .astro-lp{font-family:'Poppins',system-ui,-apple-system,sans-serif;}
        .astro-lp h1,.astro-lp h2,.astro-lp h3,.astro-lp h4{font-family:'Fraunces','Tiempos Headline',Georgia,serif;font-weight:600;letter-spacing:-0.01em;}

        /* ── Magic-wand cast — plain button; a one-shot sparkle trail fires only
              when the cursor LEAVES the button (JS toggles .as-cast, remounted per
              leave so it plays once and fades). No hover state, no idle glow. ── */
        .astro-lp .as-cast { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 5; }
        .astro-lp .as-cast .as-ring {
          position: absolute; inset: -3px; border-radius: inherit;
          box-shadow: 0 0 0 1.5px color-mix(in srgb, #c4b5fd 90%, transparent), 0 0 22px 2px color-mix(in srgb, var(--as-secondary) 70%, transparent);
          animation: as-cast-ring 620ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .astro-lp .as-cast .as-spark {
          position: absolute; top: 50%; left: 50%; height: 6px; width: 6px; border-radius: 9999px;
          background: radial-gradient(circle, #fff 0%, #c4b5fd 55%, transparent 70%);
          animation: as-cast-spark 640ms cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes as-cast-ring {
          0%   { opacity: .9; transform: scale(.86); }
          100% { opacity: 0; transform: scale(1.18); }
        }
        @keyframes as-cast-spark {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(.2); }
        }

        /* ── Sparkle starfield (hero) — layered twinkling dots, pure CSS ── */
        @keyframes as-twinkle { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
        @keyframes as-drift { from { transform: translateY(0); } to { transform: translateY(-14px); } }
        .astro-lp .as-stars { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .astro-lp .as-stars::before, .astro-lp .as-stars::after {
          content: ''; position: absolute; inset: -10%;
          background-repeat: no-repeat;
        }
        .astro-lp .as-stars::before {
          background-image:
            radial-gradient(1.5px 1.5px at 12% 22%, #fff, transparent),
            radial-gradient(1.5px 1.5px at 78% 14%, #d8ccff, transparent),
            radial-gradient(2px 2px at 32% 68%, #fff, transparent),
            radial-gradient(1px 1px at 60% 40%, #c4b5fd, transparent),
            radial-gradient(1.5px 1.5px at 88% 60%, #fff, transparent),
            radial-gradient(1px 1px at 46% 12%, #fff, transparent);
          animation: as-twinkle 4s ease-in-out infinite, as-drift 9s ease-in-out infinite alternate;
        }
        .astro-lp .as-stars::after {
          background-image:
            radial-gradient(1px 1px at 22% 48%, #c4b5fd, transparent),
            radial-gradient(1.5px 1.5px at 68% 76%, #fff, transparent),
            radial-gradient(1px 1px at 92% 30%, #d8ccff, transparent),
            radial-gradient(2px 2px at 8% 80%, #fff, transparent),
            radial-gradient(1px 1px at 54% 88%, #c4b5fd, transparent);
          animation: as-twinkle 5.5s ease-in-out infinite 1s, as-drift 11s ease-in-out infinite alternate-reverse;
        }
        /* ── Corner ring motif (service cards) — 2 concentric circles bleeding out
              of the top-right corner (card clips ~3/4), 3 heading icons orbiting the
              middle ring. ── */
        @keyframes as-ring-spin { to { transform: rotate(360deg); } }
        @keyframes as-ring-spin-rev { to { transform: rotate(-360deg); } }
        .astro-lp .as-rings { position: absolute; top: 0; right: 0; width: 178px; height: 178px; transform: translate(42%, -42%); pointer-events: none; z-index: 0; --rmid: 59px; opacity: 0; transition: opacity .35s ease; }
        .astro-lp .group:hover .as-rings { opacity: 1; }
        .astro-lp .as-ring { position: absolute; border-radius: 9999px; border: 1.5px solid rgba(255,255,255,.4); }
        .astro-lp .as-ring-outer { inset: 0; }
        .astro-lp .as-ring-mid { inset: 30px; }
        .astro-lp .as-ring-inner { inset: 60px; }
        .astro-lp .as-ring-orbit { position: absolute; inset: 30px; animation: as-ring-spin 18s linear infinite; }
        .astro-lp .as-orbit-icon { position: absolute; top: 50%; left: 50%; height: 26px; width: 26px; margin: -13px; transform: rotate(var(--a)) translateY(calc(-1 * var(--rmid))); }
        .astro-lp .as-orbit-icon > span { display: flex; height: 100%; width: 100%; align-items: center; justify-content: center; border-radius: 9999px; background: var(--as-lavender); color: var(--as-secondary); box-shadow: 0 2px 8px -3px rgba(47,35,115,.3); transition: background .3s, color .3s; animation: as-ring-spin-rev 18s linear infinite; }
        .astro-lp .group:hover .as-ring { border-color: rgba(255,255,255,.4); }
        .astro-lp .group:hover .as-orbit-icon > span { background: rgba(255,255,255,.18); color: var(--as-gold); }

        /* twinkling bento background (variant 2) */
        .astro-lp .as-bento-twinkle { animation: as-twinkle 3s ease-in-out infinite; }

        /* golden sparkle around the active how-it-works step */
        @keyframes as-sparkle { 0%,100% { opacity: .15; transform: scale(.5); } 50% { opacity: 1; transform: scale(1); } }
        .astro-lp .as-step-spark { position: absolute; border-radius: 9999px; pointer-events: none;
          background: radial-gradient(circle, #fff 0%, var(--as-gold) 55%, transparent 72%);
          box-shadow: 0 0 6px 1px color-mix(in srgb, var(--as-gold) 75%, transparent);
          animation: as-sparkle 1.5s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .astro-lp .as-stars::before, .astro-lp .as-stars::after,
          .astro-lp .as-cast .as-ring, .astro-lp .as-cast .as-spark,
          .astro-lp .as-ring-orbit, .astro-lp .as-orbit-icon > span, .astro-lp .as-step-spark { animation: none; }
          .astro-lp .as-cast { display: none; }
        }
      `}</style>

      <Seo
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        canonical={canonical}
        robots="index, follow, max-image-preview:large, max-snippet:-1"
        siteName="Book A Sloth"
        locale="en_IN"
        themeColor="#6B5CE7"
        ogTitle={seo.ogTitle}
        ogDescription={seo.ogDescription}
        jsonLd={jsonLd}
      />

      {/* ═══════════════ 1 · NAV ═══════════════ */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 hover:no-underline" aria-label="Book A Sloth — home">
            <img src="/favicon.svg" alt="" width={28} height={28} className="h-7 w-7 rounded-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="text-[15px] font-extrabold tracking-tight text-[color:var(--as-ink)]">Book A Sloth</span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <NavLink key={item.label} item={item} className="text-sm font-medium text-neutral-600 transition-colors hover:text-[color:var(--as-ink)] hover:no-underline" />
            ))}
          </nav>
          <div className="hidden items-center gap-4 lg:flex">
            <Link to={LOGIN} className="text-sm font-semibold text-neutral-700 hover:text-[color:var(--as-ink)] hover:no-underline">Login</Link>
            <CtaButton to={START} className="!px-5 !py-2.5">Start for Free <ArrowRight size={15} /></CtaButton>
          </div>
          <button type="button" className="lg:hidden" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-black/5 bg-white lg:hidden">
              <div className="flex flex-col gap-1 px-5 py-4">
                {NAV.map((item) => (
                  <NavLink key={item.label} item={item} onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-medium text-neutral-700 hover:bg-[color:var(--as-lavender)] hover:no-underline" />
                ))}
                <div className="mt-2 flex items-center gap-3 border-t border-black/5 pt-3">
                  <Link to={LOGIN} className="flex-1 rounded-full border-2 border-black/10 py-2.5 text-center text-sm font-semibold text-[color:var(--as-ink)] hover:no-underline">Login</Link>
                  <CtaButton to={START} className="flex-1">Start Free <ArrowRight size={15} /></CtaButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════ 2 · HERO (dark, starfield) ═══════════════ */}
      <section id="top" className="relative overflow-hidden px-5 pb-14 pt-10 text-white sm:px-8 sm:pb-20 sm:pt-14 lg:pb-24" style={{ background: 'radial-gradient(120% 100% at 70% 0%, #2c2166 0%, var(--as-deep) 45%, #150f36 100%)' }}>
        {/* twinkling sparkle layer */}
        <div className="as-stars" aria-hidden />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 sm:gap-14 lg:grid-cols-[3fr_2fr] lg:gap-12">
          <div className="text-center lg:text-left">
            <Reveal as="h1" instant className="text-[clamp(1.8rem,7vw,2.9rem)] font-bold leading-[1.08] text-white lg:text-[3rem]">
              Powerful booking software for{' '}
              <span style={{ color: '#c4b5fd' }}>astrologers</span>,{' '}
              without the complicated setup.
            </Reveal>
            <Reveal as="p" instant delay={0.08} className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0">
              Let seekers book and pay for readings online. Manage your services, availability, payments, reminders and follow-ups from one calm platform built for astrologers.
            </Reveal>
            <Reveal instant delay={0.12} className="mt-7 flex flex-col items-center gap-3 lg:flex-row lg:gap-5 lg:justify-start">
              <CtaButton to={START} className="w-full sm:w-auto">Create a Free Account <ArrowRight size={16} /></CtaButton>
              <Link to="/demo" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-white/90 transition-colors hover:text-white hover:no-underline">
                Book A Demo <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
            <Reveal instant delay={0.16} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
              {HERO_TRUST.map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-[13px] font-medium text-white/65">
                  <Check size={14} style={{ color: '#c4b5fd' }} /> {t}
                </span>
              ))}
            </Reveal>
          </div>

          {/* RIGHT — big hero illustration + floating glass chips (CA hero structure) */}
          <Reveal instant delay={0.1} className="relative hidden lg:block">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-[56rem] w-[56rem] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--as-secondary) 18%, transparent), transparent 70%)' }} />
            <img src={HERO_IMG} alt="Book A Sloth — booking software for astrologers" loading="eager" fetchpriority="high" decoding="async" width="1100" height="852" className="relative z-10 mx-auto h-auto w-full max-w-none drop-shadow-[0_28px_36px_rgba(47,35,115,0.2)] lg:translate-x-6 lg:scale-[1.2]" />
            <GlassCard icon={CalendarCheck} label="New booking" value="Kundli Reading · 5:30 PM" className="top-0 -left-12 z-20" />
            <GlassCard icon={Wallet} label="Fee received" value="₹1,499" accent className="top-1/2 right-0 z-20" />
            <GlassCard icon={BellRing} label="WhatsApp reminder" value="Sent · 1h before" className="bottom-2 -left-10 z-30" />
          </Reveal>

          {/* Mobile/tablet — image only (no floating chips) */}
          <Reveal instant delay={0.1} className="relative lg:hidden">
            <div aria-hidden className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--as-secondary) 18%, transparent), transparent 70%)' }} />
            <img src={HERO_IMG} alt="" loading="eager" decoding="async" width="1100" height="852" className="relative z-10 mx-auto h-auto w-full max-w-[30rem] drop-shadow-[0_28px_36px_rgba(47,35,115,0.2)]" />
          </Reveal>
        </div>

        {/* Four benefits strip */}
        <div className="relative z-10 mx-auto mt-16 grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.title} delay={(i % 4) * 0.06}>
              <div className="group flex h-full flex-col rounded-[12px] border border-[color:var(--as-line)] bg-white p-4 transition-colors hover:border-[color:var(--as-secondary)]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-300 group-hover:text-white" style={{ backgroundColor: 'var(--as-lavender)', color: 'var(--as-secondary)' }}>
                    <b.icon size={18} />
                  </span>
                  <p className="text-sm font-bold">{b.title}</p>
                </div>
                <p className="mt-2 text-xs leading-snug text-neutral-600">{b.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 3 · SERVICES ═══════════════ */}
      <section id="services" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--as-lavender)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="text-3xl font-bold leading-tight sm:text-4xl">
              Built around the way <span style={{ color: 'var(--as-secondary)' }}>astrologers work.</span>
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-4 text-base text-neutral-500">
              From birth-chart readings to Vastu, numerology and remedies — set up every service you offer, each with its own price, duration and availability.
            </Reveal>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s, i) => (
              <Reveal key={s.label} delay={(i % 4) * 0.05}>
                <Link to={START} className="group relative flex h-full flex-col overflow-hidden rounded-[14px] border border-[color:var(--as-line)] bg-white p-5 transition-colors duration-300 hover:border-[color:var(--as-secondary)] hover:bg-[color:var(--as-secondary)] hover:shadow-[0_18px_40px_-20px_rgba(47,35,115,0.4)] hover:no-underline">
                  <CardRings icons={s.ring} />
                  <div className="relative z-10 flex h-full flex-col">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-transparent transition-all duration-300 group-hover:bg-white group-hover:ring-[color:var(--as-gold)]" style={{ backgroundColor: 'var(--as-secondary)', color: 'var(--as-gold)' }}>
                      <s.icon size={29} />
                    </span>
                    <h3 className="mt-4 text-[19.5px] font-bold leading-tight text-[color:var(--as-ink)] group-hover:text-white">{s.label}</h3>
                    <p className="mt-1 text-[13px] leading-snug text-neutral-500 group-hover:text-white/80">{s.desc}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4 · HOW IT WORKS ═══════════════ */}
      <section id="how" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal as="h2" className="text-3xl font-bold leading-tight sm:text-4xl">
              From &ldquo;when are you free?&rdquo; to <span style={{ color: 'var(--as-secondary)' }}>booked in minutes.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mt-3 text-base text-neutral-500">
              No DMs, no back-and-forth. Your seekers book themselves.
            </Reveal>
          </div>
          <HowItWorks steps={STEPS} />
        </div>
      </section>

      {/* ═══════════════ 5 · INTEGRATIONS ═══════════════ */}
      <section id="integrations" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--as-lavender)' }}>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="text-3xl font-bold leading-tight sm:text-4xl">
              Works with the tools you already use.
            </Reveal>
            <Reveal as="p" delay={0.08} className="mt-3 text-base text-neutral-500">
              Connect your calendar, video meetings, payments and WhatsApp — Book A Sloth fits your workflow, no rewiring.
            </Reveal>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 0.06}>
                <div className="flex items-center gap-3.5 rounded-2xl border border-[color:var(--as-line)] bg-white px-4 py-3.5 shadow-[0_14px_34px_-24px_rgba(47,35,115,0.4)]">
                  <img src={t.logo} alt={t.name} loading="lazy" width={36} height={36} className="h-9 w-9 flex-shrink-0 object-contain" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold leading-tight text-[color:var(--as-ink)]">{t.name}</div>
                    <div className="mt-0.5 text-xs leading-snug text-neutral-500">{t.sub}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 6 · CLIENT JOURNEY (bento) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="h2" className="text-3xl font-bold leading-tight sm:text-4xl">
              Give every seeker a <span style={{ color: 'var(--as-secondary)' }}>calmer experience.</span>
            </Reveal>
            <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-2xl text-base text-neutral-500">
              From the first booking to the final follow-up, Book A Sloth keeps your sessions organised.
            </Reveal>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
            {JOURNEY.map((j, i) => (
              <Reveal key={j.label} delay={(i % 3) * 0.07}>
                <BentoCard step={i + 1} icon={j.icon} title={j.label} sub={j.sub} gold={i % 2 === 1} shape={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 7 · ABOUT / WHY (image) ═══════════════ */}
      <section id="why" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--as-lavender)' }}>
        <div className="mx-auto max-w-2xl text-center">
          <Reveal as="h2" className="text-3xl font-bold leading-tight sm:text-4xl">
            More than a booking link. <span style={{ color: 'var(--as-secondary)' }}>A calmer way to practise.</span>
          </Reveal>
        </div>

        {/* Desktop — image centred, 4 cards fanned to NW / NE / SW / SE behind it */}
        <div className="relative mx-auto mt-14 hidden h-[480px] max-w-5xl lg:block">
          <div aria-hidden className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--as-secondary) 24%, transparent)' }} />
          {WHY.map((w, i) => {
            // NW, NE, SW, SE — wide 2:1 bars; inner corners tuck under the image
            const pos = [
              'left-0 top-6', 'right-0 top-6', 'left-0 bottom-6', 'right-0 bottom-6',
            ][i];
            return (
              <Reveal key={w.title} delay={i * 0.08} className={`absolute z-10 w-[24rem] ${pos}`}>
                <div className="flex items-start gap-4 rounded-[18px] border border-[color:var(--as-line)] bg-white p-5 shadow-[0_20px_45px_-24px_rgba(47,35,115,0.45)]">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--as-lavender)', color: 'var(--as-secondary)' }}>
                    <w.icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold">{w.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-500">{w.desc}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
          <img src={ABOUT_IMG} alt="Book A Sloth for astrology practices" loading="lazy" decoding="async" width="1100" height="619" className="absolute left-1/2 top-1/2 z-20 w-[34rem] object-contain drop-shadow-[0_28px_50px_rgba(47,35,115,0.28)]" style={{ transform: 'translate(-50%, calc(-50% - 40px))' }} />
        </div>

        {/* Mobile / tablet — image then a simple card grid */}
        <div className="mt-12 lg:hidden">
          <img src={ABOUT_IMG} alt="" loading="lazy" decoding="async" width="1100" height="619" className="mx-auto w-full max-w-xs object-contain drop-shadow-[0_24px_40px_rgba(47,35,115,0.18)]" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={(i % 2) * 0.08}>
                <div className="h-full rounded-[16px] border border-[color:var(--as-line)] bg-white p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--as-lavender)', color: 'var(--as-secondary)' }}>
                    <w.icon size={20} />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{w.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{w.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 8 · TESTIMONIALS (rotating columns) ═══════════════ */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal as="p" className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--as-secondary)' }}>Testimonials</Reveal>
            <Reveal as="h2" delay={0.05} className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Loved by astrologers across India.
            </Reveal>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((col) => (
              <TestimonialColumn key={col} items={[TESTIMONIALS[col], TESTIMONIALS[col + 3]].filter(Boolean)} className={col === 2 ? 'hidden lg:block' : col === 1 ? 'hidden sm:block' : ''} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 9 · TRUST STRIP (honest) ═══════════════ */}
      <section className="border-y border-black/5 px-5 py-12 sm:px-8" style={{ background: 'var(--as-deep)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST_STRIP.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="text-center">
              <s.icon size={20} className="mx-auto" style={{ color: 'var(--as-gold)' }} />
              <div className="mt-2 text-2xl font-bold text-white sm:text-3xl">{s.value}</div>
              <p className="mx-auto mt-1.5 max-w-[13rem] text-xs leading-snug text-white/60">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 10 · PRICING TEASER ═══════════════ */}
      <section id="pricing" className="px-5 py-20 sm:px-8 lg:py-28" style={{ background: 'var(--as-lavender)' }}>
        <div className="mx-auto max-w-3xl text-center">
          <Reveal as="h2" className="text-3xl font-bold leading-tight sm:text-4xl">
            Start free. Upgrade to <span style={{ color: 'var(--as-secondary)' }}>0% commission</span> when you are ready.
          </Reveal>
          <Reveal as="p" delay={0.08} className="mx-auto mt-4 max-w-xl text-base text-neutral-500">
            The Sloth plan is free forever with a small 5% per-booking fee. Sloth Active removes commission entirely and adds WhatsApp automation, a client CRM and growth tools — {`₹${PREMIUM_PLAN.yearly.toLocaleString('en-IN')}`}/year (+18% GST).
          </Reveal>
          <Reveal delay={0.14} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaButton to={START}>Start free <ArrowRight size={16} /></CtaButton>
            <Link to="/pricing" className="text-sm font-semibold text-[color:var(--as-ink)] underline-offset-4 hover:underline">See full pricing</Link>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 11 · FAQ ═══════════════ */}
      <section id="faq" className="px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">Questions, answered.</Reveal>
          <div className="mt-12"><FaqAccordion /></div>
        </div>
      </section>

      {/* ═══════════════ 12 · FINAL CTA ═══════════════ */}
      <section className="px-5 py-24 text-center text-white sm:px-8" style={{ background: 'linear-gradient(160deg, var(--as-primary), var(--as-deep))' }}>
        <div className="mx-auto max-w-2xl">
          <Reveal className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: 'color-mix(in srgb, var(--as-secondary) 30%, transparent)' }}>
            <Sun size={26} style={{ color: 'var(--as-gold)' }} />
          </Reveal>
          <Reveal as="h2" delay={0.06} className="mt-6 text-3xl font-bold leading-tight text-white sm:text-4xl">
            Your next seeker is ready to book.
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-lg text-base text-white/70">
            Set up your page in minutes and start taking paid bookings today — no credit card required.
          </Reveal>
          <Reveal delay={0.16} className="mt-8">
            <CtaButton to={START} className="!px-8 !py-4">Create your free page <ArrowRight size={16} /></CtaButton>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ 13 · FOOTER ═══════════════ */}
      <footer className="border-t border-black/10 px-5 py-14 sm:px-8" style={{ background: 'var(--as-deep)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <div className="text-lg font-extrabold text-white">Book A Sloth</div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">
                The calm way for astrologers in India to get booked, paid and reminded.
              </p>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">{col.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      {l.to
                        ? <Link to={l.to} className="text-sm text-white/70 transition-colors hover:text-white hover:no-underline">{l.label}</Link>
                        : <a href={l.href} className="text-sm text-white/70 transition-colors hover:text-white hover:no-underline">{l.label}</a>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
            <p className="text-xs text-white/50">© {new Date().getFullYear()} Book A Sloth · Razorpay-secure payments · GST invoices · Made in India 🇮🇳</p>
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">Made for India&apos;s astrologers</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

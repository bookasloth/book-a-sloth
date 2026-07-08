// /features/:slug — data-driven feature marketing page template.
//
// One component, ten pages: the visual variety comes entirely from
// `feature.layout.hero` / `feature.layout.sections` (see featureData.js) picking
// which of the 6 hero layouts / 4 section layouts to render, plus the page's own
// `accent` / `accentLight` / `darkBg` piped in as CSS custom properties
// (--fp-accent / --fp-accent-light / --fp-dark). Same skeleton, different skin —
// mirrors the pattern already used by /for/:profession (ProfessionLanding.jsx).
//
// All CTAs hand off to the real host signup funnel (/be-a-sloth).

import { useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Star, ChevronDown } from 'lucide-react';
import Reveal from '../../components/home/Reveal';
import Seo from '../../components/common/Seo';
import { SITE_URL } from '../../utils/seo';
import { getFeature } from './featureData';

const ROUTE = '/be-a-sloth';
// Full brand palette, cycled for variety inside multi-item grids (card borders,
// bento dots) so a page never reads as one-color-only even though `accent` leads.
const PALETTE = ['#FE5100', '#FF4D93', '#4AB765', '#FFCC1C', '#269CEF'];

// ponytail: one static testimonial reused across all feature pages — featureData
// has no per-feature quote field. Add one there if a page ever needs a distinct voice.
const TESTIMONIAL = {
  quote: 'Book A Sloth replaced three tools and the follow-up emails I used to send by hand. My clients book, pay, and show up — I just do the work.',
  name: 'Ananya Rao',
  role: 'Independent Consultant',
};

/* ════════════════════════════ Header / Footer ════════════════════════════ */

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-5 py-3.5 sm:justify-between sm:px-8">
        <Link to="/" className="flex items-center gap-2 hover:no-underline" aria-label="Book A Sloth — home">
          <img src="/favicon.svg" alt="" className="h-7 w-7 rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="font-heading text-[15px] font-bold tracking-tight text-ink">Book A Sloth</span>
        </Link>
        <Link
          to={ROUTE}
          className="hidden items-center gap-1.5 rounded px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:no-underline sm:inline-flex"
          style={{ background: '#FE5100' }}
        >
          Get Started Free <ArrowRight size={15} />
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-primary px-5 py-10 text-center text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="font-heading text-lg font-bold">Book A Sloth</div>
        <p className="mt-2 text-sm text-white/85">Book A Sloth © 2026 · Made in India 🇮🇳</p>
      </div>
    </footer>
  );
}

/* Shared CTA button — always brand orange, per spec. */
function CtaButton({ children = 'Get Started Free', className = '' }) {
  return (
    <Link
      to={ROUTE}
      className={`inline-flex items-center justify-center gap-2 rounded px-7 py-4 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:no-underline ${className}`}
      style={{ background: '#FE5100' }}
    >
      {children} <ArrowRight size={16} />
    </Link>
  );
}

/* ════════════════════════════ Hero variants (6) ════════════════════════════ */

// 1. split — 50/50, text one side + accent blob, image rotated with shadow.
function HeroSplit({ feature }) {
  const { title, tagline, description, heroImage, layout } = feature;
  const reverse = !!layout?.heroReverse;
  return (
    <section className="relative overflow-hidden bg-white px-5 py-16 sm:px-8 sm:py-24">
      <div className={`mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
        <div className="relative">
          <span aria-hidden className="absolute -left-12 -top-12 -z-10 h-72 w-72 rounded-[50%] blur-3xl" style={{ background: 'var(--fp-accent-light)' }} />
          <Reveal as="p" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--fp-accent)]">{tagline}</Reveal>
          <Reveal as="h1" delay={0.05} className="mt-5 font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">{title}</Reveal>
          <Reveal as="p" delay={0.1} className="mt-6 max-w-lg text-base leading-relaxed text-neutral-500 sm:text-lg">{description}</Reveal>
          <Reveal delay={0.16} className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <CtaButton />
            <span className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Check size={13} className="text-[color:var(--fp-accent)]" /> No credit card needed
            </span>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <img
            src={heroImage}
            alt={title}
            className="w-full rounded-[24px] object-cover shadow-2xl"
            style={{ transform: `rotate(${reverse ? '2.5deg' : '-2.5deg'})` }}
          />
        </Reveal>
      </div>
    </section>
  );
}

// 2. overlap — full-width dark hero, browser-frame mockup overlapping ~80px into next section.
function HeroOverlap({ feature }) {
  const { title, tagline, description, heroImage, darkBg } = feature;
  return (
    <section className="relative pb-8 pt-20 text-center sm:pt-28" style={{ background: darkBg }}>
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <Reveal as="p" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--fp-accent)]">{tagline}</Reveal>
        <Reveal as="h1" delay={0.05} className="mt-5 font-heading text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-6xl">{title}</Reveal>
        <Reveal as="p" delay={0.1} className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/70">{description}</Reveal>
        <Reveal delay={0.16} className="mt-8 flex justify-center">
          <CtaButton />
        </Reveal>
      </div>
      <Reveal delay={0.22} className="relative z-10 mx-auto -mb-20 mt-16 max-w-4xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-[10px] bg-white shadow-[0_50px_100px_-30px_rgba(0,0,0,0.6)] ring-1 ring-black/10" style={{ borderTop: '4px solid var(--fp-accent)' }}>
          <div className="flex items-center gap-1.5 border-b border-black/5 bg-neutral-50 px-4 py-2.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          </div>
          <img src={heroImage} alt={title} className="aspect-[16/10] w-full object-cover" />
        </div>
      </Reveal>
    </section>
  );
}

// 3. diagonal — clip-path split, dark text panel over a light image panel.
function HeroDiagonal({ feature }) {
  const { title, tagline, description, heroImage, darkBg } = feature;
  return (
    <section className="relative isolate overflow-hidden bg-[#F2F2F2]">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[70%] sm:w-[58%]"
        style={{ background: darkBg, clipPath: 'polygon(0 0, 100% 0, 68% 100%, 0 100%)' }}
      />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-10">
        <div className="flex flex-col justify-center text-white lg:max-w-md">
          <Reveal as="p" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--fp-accent)]">{tagline}</Reveal>
          <Reveal as="h1" delay={0.05} className="mt-5 font-heading text-4xl font-extrabold leading-tight sm:text-5xl">{title}</Reveal>
          <span aria-hidden className="mt-6 block h-1 w-16 rounded-full bg-[color:var(--fp-accent)]" />
          <Reveal as="p" delay={0.1} className="mt-6 text-base leading-relaxed text-white/70">{description}</Reveal>
          <Reveal delay={0.16} className="mt-8">
            <CtaButton />
          </Reveal>
        </div>
        <Reveal delay={0.14} className="flex items-center justify-center lg:justify-end">
          <img src={heroImage} alt={title} className="aspect-[4/3] w-full max-w-lg rounded-[4px] object-cover shadow-2xl" />
        </Reveal>
      </div>
    </section>
  );
}

// 4. centered — oversized headline (last word accented), image card with floating pills.
function HeroCentered({ feature }) {
  const { title, tagline, description, heroImage } = feature;
  const words = title.split(' ');
  const last = words.pop();
  return (
    <section className="relative overflow-hidden bg-white px-5 py-20 text-center sm:px-8 sm:py-28">
      <Reveal as="p" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--fp-accent)]">{tagline}</Reveal>
      <Reveal as="h1" delay={0.05} className="mx-auto mt-5 max-w-4xl font-heading text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
        {words.join(' ')} <span className="text-[color:var(--fp-accent)]">{last}</span>
      </Reveal>
      <Reveal as="p" delay={0.1} className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-neutral-500 sm:text-lg">{description}</Reveal>
      <Reveal delay={0.16} className="mt-8 flex justify-center">
        <CtaButton />
      </Reveal>
      <Reveal delay={0.24} className="relative mx-auto mt-16 max-w-4xl">
        <img src={heroImage} alt={title} className="w-full rounded-[20px] object-cover shadow-2xl" />
        <span className="absolute -left-4 top-8 hidden rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg sm:block" style={{ background: 'var(--fp-accent)' }}>No-code setup</span>
        <span className="absolute -right-4 bottom-16 hidden rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg sm:block" style={{ background: '#FF4D93' }}>Payments built-in</span>
        <span className="absolute -bottom-4 left-1/3 hidden rounded-full px-4 py-2 text-xs font-bold text-white shadow-lg sm:block" style={{ background: '#269CEF' }}>Live in minutes</span>
      </Reveal>
    </section>
  );
}

// 5. editorial — magazine asymmetric split, huge type left, tall image bleeding off top right.
function HeroEditorial({ feature }) {
  const { title, tagline, description, heroImage } = feature;
  return (
    <section className="relative bg-white px-5 pb-16 pt-20 sm:px-8 sm:pt-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-3">
          <Reveal as="p" className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--fp-accent)]">{tagline}</Reveal>
          <span aria-hidden className="mt-4 block h-1 w-20 rounded-full bg-[color:var(--fp-accent)]" />
          <Reveal as="h1" delay={0.05} className="mt-6 font-heading text-6xl font-extrabold leading-[0.98] tracking-tight text-ink sm:text-7xl lg:text-8xl">{title}</Reveal>
          <Reveal as="p" delay={0.12} className="mt-8 max-w-lg text-base leading-relaxed text-neutral-500 sm:text-lg">{description}</Reveal>
          <Reveal delay={0.18} className="mt-8">
            <CtaButton />
          </Reveal>
        </div>
        <Reveal delay={0.1} className="lg:col-span-2">
          <img src={heroImage} alt={title} className="-mt-10 aspect-[3/4] w-full rounded-[4px] object-cover shadow-2xl sm:-mt-16 lg:-mt-24" />
        </Reveal>
      </div>
    </section>
  );
}

// 6. gradient — mesh gradient (accent + darkBg), white centered text, phone mockup with glow.
function HeroGradient({ feature }) {
  const { title, tagline, description, heroImage } = feature;
  return (
    <section
      className="relative overflow-hidden px-5 pb-24 pt-20 text-center sm:px-8 sm:pt-28"
      style={{
        background: [
          'radial-gradient(120% 100% at 15% 0%, color-mix(in srgb, var(--fp-accent) 55%, transparent), transparent 60%)',
          'radial-gradient(120% 100% at 85% 100%, color-mix(in srgb, var(--fp-accent) 35%, transparent), transparent 55%)',
          'var(--fp-dark)',
        ].join(', '),
      }}
    >
      <Reveal as="p" className="text-xs font-semibold uppercase tracking-[0.24em] text-white/80">{tagline}</Reveal>
      <Reveal as="h1" delay={0.05} className="mx-auto mt-5 max-w-3xl font-heading text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-6xl">{title}</Reveal>
      <Reveal as="p" delay={0.1} className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/75">{description}</Reveal>
      <Reveal delay={0.16} className="mt-8 flex justify-center">
        <CtaButton />
      </Reveal>
      <Reveal delay={0.26} className="relative mx-auto mt-16 max-w-[280px]">
        <span aria-hidden className="absolute inset-x-6 -bottom-6 h-16 rounded-full opacity-60 blur-2xl" style={{ background: 'var(--fp-accent)' }} />
        <div className="relative rounded-[36px] border-[6px] border-black bg-black p-2 shadow-2xl">
          <img src={heroImage} alt={title} className="aspect-[9/18] w-full rounded-[26px] object-cover" />
        </div>
      </Reveal>
    </section>
  );
}

const HERO_VARIANTS = {
  split: HeroSplit,
  overlap: HeroOverlap,
  diagonal: HeroDiagonal,
  centered: HeroCentered,
  editorial: HeroEditorial,
  gradient: HeroGradient,
};

/* ════════════════════════════ Stats bar ════════════════════════════ */

function StatsBar({ stats }) {
  if (!stats?.length) return null;
  return (
    <section className="border-y border-black/5 bg-white px-5 py-12 sm:px-8">
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-6 text-center">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <div className="font-heading text-3xl font-extrabold tracking-tight text-[color:var(--fp-accent)] sm:text-4xl">{s.value}</div>
            <p className="mx-auto mt-1.5 max-w-[10rem] text-xs leading-snug text-neutral-500 sm:text-sm">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════ Feature section variants (4) ════════════════════════════ */

// 1. zigzag — alternating image/text rows, alternating background tint.
function SectionZigzag({ feature }) {
  return (
    <section>
      {(feature.features || []).map((f, i) => {
        const reverse = i % 2 === 1;
        return (
          <div key={f.title} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]'}>
            <div className="mx-auto px-5 py-16 sm:px-8 sm:py-20">
              <div className={`mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16 ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                <Reveal>
                  <img src={f.image} alt={f.title} loading="lazy" className="aspect-[4/3] w-full rounded-[4px] object-cover shadow-lg" />
                </Reveal>
                <Reveal delay={0.08}>
                  <h3 className="font-heading text-2xl font-bold text-[color:var(--fp-accent)] sm:text-3xl">{f.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-neutral-600">{f.description}</p>
                </Reveal>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

// 2. cards — 3-col grid, 16:10 image, accent-cycled top border, hover lift.
function SectionCards({ feature }) {
  return (
    <section className="bg-white px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(feature.features || []).map((f, i) => (
            <Reveal
              key={f.title}
              delay={(i % 3) * 0.08}
              className="group overflow-hidden rounded-[4px] border border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-20px_rgba(0,0,0,0.2)]"
              style={{ borderTop: `4px solid ${PALETTE[i % PALETTE.length]}` }}
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img src={f.image} alt={f.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <h3 className="font-heading text-lg font-bold text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// 3. bento — first item spans 2x2, rest single cells, image overlay text + accent dots.
function SectionBento({ feature }) {
  const items = feature.features || [];
  return (
    <section className="bg-[#F2F2F2] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid auto-rows-[220px] grid-cols-1 gap-4 sm:auto-rows-[240px] sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 0.06}
              className={`group relative overflow-hidden rounded-[4px] ${i === 0 ? 'sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2' : ''}`}
            >
              <img src={f.image} alt={f.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span aria-hidden className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-heading text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/80">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// 4. showcase — full-bleed stacked images, alternating text alignment, numbered badge.
function SectionShowcase({ feature }) {
  const align = ['items-start text-left', 'items-center text-center', 'items-end text-right'];
  return (
    <section>
      {(feature.features || []).map((f, i) => (
        <div key={f.title} className="relative h-[70vh] min-h-[420px] w-full overflow-hidden">
          <img src={f.image} alt={f.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-0 bg-black/45" />
          <div className={`relative z-10 flex h-full flex-col justify-center px-6 sm:px-16 ${align[i % align.length]}`}>
            <Reveal className="max-w-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-full font-heading text-sm font-bold text-white" style={{ background: 'var(--fp-accent)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 font-heading text-3xl font-bold text-white sm:text-4xl">{f.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-white/80">{f.description}</p>
            </Reveal>
          </div>
        </div>
      ))}
    </section>
  );
}

const SECTION_VARIANTS = {
  zigzag: SectionZigzag,
  cards: SectionCards,
  bento: SectionBento,
  showcase: SectionShowcase,
};

/* ════════════════════════════ Competitor / testimonial / FAQ / CTA ════════════════════════════ */

function CompetitorStrip({ competitors }) {
  if (!competitors?.length) return null;
  return (
    <section className="bg-[#F2F2F2] px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <Reveal as="p" className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-400">Switching from</Reveal>
        <div className="mt-8 space-y-4">
          {competitors.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.06} className="flex items-center justify-center gap-3 text-base font-medium text-ink sm:text-lg">
              <span aria-hidden className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: c.color }} />
              Everything <span className="font-bold">{c.name}</span> does, plus payments in ₹.
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="bg-white px-5 py-20 sm:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <div className="flex justify-center gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
        </div>
        <blockquote className="mt-5 font-heading text-xl font-semibold leading-snug text-ink sm:text-2xl">
          &ldquo;{TESTIMONIAL.quote}&rdquo;
        </blockquote>
        <p className="mt-4 text-sm font-medium text-neutral-500">{TESTIMONIAL.name} · {TESTIMONIAL.role}</p>
      </Reveal>
    </section>
  );
}

/* Single-open, smoothly-animated FAQ accordion — accent left border on open row. */
function FaqAccordion({ faq }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-3">
      {faq.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={f.q}
            className="overflow-hidden rounded-[4px] border bg-white transition-colors"
            style={{ borderColor: isOpen ? 'var(--fp-accent)' : 'rgba(0,0,0,0.08)', borderLeftWidth: isOpen ? '4px' : '1px' }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink"
            >
              {f.q}
              <ChevronDown
                size={18}
                className="flex-shrink-0 transition-transform duration-300"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'none', color: isOpen ? 'var(--fp-accent)' : '#a3a3a3' }}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-500">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function CtaSection({ cta, darkBg }) {
  return (
    <section className="relative overflow-hidden px-5 py-24 text-center sm:px-8" style={{ background: darkBg }}>
      <span aria-hidden className="absolute -left-16 -top-16 h-56 w-56 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--fp-accent)' }} />
      <span aria-hidden className="absolute -bottom-20 -right-10 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: '#FF4D93' }} />
      <div className="relative z-10 mx-auto max-w-2xl">
        <Reveal as="h2" className="font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">{cta.headline}</Reveal>
        <Reveal as="p" delay={0.08} className="mx-auto mt-4 max-w-lg text-base text-white/70">{cta.subline}</Reveal>
        <Reveal delay={0.16} className="mt-8 flex justify-center">
          <CtaButton />
        </Reveal>
      </div>
    </section>
  );
}

/* ════════════════════════════ Page ════════════════════════════ */

export default function FeaturePage() {
  const { slug } = useParams();
  const feature = getFeature(slug);

  const canonical = feature ? `${SITE_URL}/features/${feature.slug}` : null;
  const jsonLd = useMemo(() => {
    if (!feature?.faq?.length) return undefined;
    return [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: feature.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    }];
  }, [feature]);

  if (!feature) return <Navigate to="/404" replace />;

  const HeroComponent = HERO_VARIANTS[feature.layout?.hero] || HeroSplit;
  const SectionComponent = SECTION_VARIANTS[feature.layout?.sections] || SectionZigzag;

  const styleVars = {
    '--fp-accent': feature.accent,
    '--fp-accent-light': feature.accentLight,
    '--fp-dark': feature.darkBg,
  };

  return (
    <div id="feature-page" className="overflow-x-clip bg-white font-sans text-ink" style={styleVars}>
      <Seo
        title={feature.seo?.title || feature.title}
        description={feature.seo?.description || feature.description}
        canonical={canonical}
        robots="index, follow, max-image-preview:large, max-snippet:-1"
        siteName="Book A Sloth"
        locale="en_IN"
        themeColor={feature.accent}
        ogTitle={feature.seo?.title || feature.title}
        ogDescription={feature.seo?.description || feature.description}
        image={feature.heroImage}
        jsonLd={jsonLd}
      />

      <Header />
      <HeroComponent feature={feature} />
      <StatsBar stats={feature.stats} />
      <SectionComponent feature={feature} />
      <CompetitorStrip competitors={feature.competitors} />
      <Testimonial />

      <section className="bg-[#F2F2F2] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Reveal as="h2" className="text-center font-heading text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Questions, answered.
          </Reveal>
          <div className="mt-10">
            <FaqAccordion faq={feature.faq || []} />
          </div>
        </div>
      </section>

      <CtaSection cta={feature.cta || {}} darkBg={feature.darkBg} />
      <Footer />
    </div>
  );
}

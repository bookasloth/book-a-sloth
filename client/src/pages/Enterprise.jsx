// /enterprise — Book A Sloth Enterprise marketing landing page.
//
// Data-driven composition (config in enterprise/enterpriseData.js). Mirrors the
// section rhythm + card recipe from pages/for/ProfessionLanding.jsx, themed with
// --ent-* custom properties instead of --lp-*. Unlike /for/:profession, this
// route keeps the GLOBAL Navbar + Footer (not in App.jsx's hideNavbar list) —
// so this file owns only the 15 content sections, no page-local header/footer.
//
// Palette is intentionally narrow: neutral ink/tint/muted + orange ONLY on CTAs
// (see CLAUDE.md UI Rules — "do not invent colors"). --ent-bg/--ent-line are
// added here (beyond the 4 vars named in the brief) because EnterpriseFaq.jsx
// already references them via color-mix()/var() and nothing else in the app
// defines them — required for the reused accordion to render correctly.
import { useEffect, useRef } from 'react';
import {
  Users, MapPin, Puzzle, Headset, Server, Workflow, ShieldCheck, Rocket, Check, ArrowRight,
} from 'lucide-react';
import Reveal from '../components/home/Reveal';
import Seo from '../components/common/Seo';
import { ogCard } from '../config/ogImages';
import { analytics, EVENTS } from '../services/analytics';
import EnterpriseFaq from './enterprise/EnterpriseFaq';
import EnterpriseLeadForm from './enterprise/EnterpriseLeadForm';
import { ENT_SEO, buildEnterpriseJsonLd } from './enterprise/enterpriseSeo';
import {
  HERO, TRUST_CARDS, PROBLEMS, FEATURE_CATEGORIES, WORKFLOW_STEPS, INDUSTRIES,
  SERVICES, INTEGRATIONS, DEPLOYMENTS, CUSTOMIZATIONS, WHY_CARDS, IMPLEMENTATION_STEPS, FAQ,
} from './enterprise/enterpriseData';

// TRUST_CARDS.icon is a string key (data files stay framework-agnostic) —
// resolve to the actual lucide component here.
const TRUST_ICONS = { Users, MapPin, Puzzle, Headset, Server, Workflow, ShieldCheck, Rocket };

const STYLE_VARS = {
  '--ent-ink': '#1a1a1a',
  '--ent-cta': '#c23d00',
  '--ent-tint': '#faf9f6',
  '--ent-muted': '#6b7280',
  '--ent-bg': '#ffffff',
  '--ent-line': 'rgba(26,26,26,0.08)',
};

const CARD = 'rounded-[6px] border border-black/5 bg-white p-6 shadow-[0_8px_30px_rgba(26,26,26,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_-18px_rgba(26,26,26,0.16)]';

function scrollToForm() {
  document.getElementById('enterprise-lead')?.scrollIntoView({ behavior: 'smooth' });
}

/* Hero product mockup — branches/staff/calendar, pure CSS tiles, no image. */
function EnterpriseMock() {
  const branches = [
    { name: 'Downtown Branch', staff: 12 },
    { name: 'North Branch', staff: 8 },
    { name: 'Mall Branch', staff: 15 },
  ];
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-[12px] border border-black/10 bg-white shadow-[0_40px_90px_-30px_rgba(26,26,26,0.25)]">
      <div className="flex items-center gap-2 border-b border-black/5 bg-neutral-50 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
        </span>
        <div className="ml-2 flex-1 truncate rounded-full bg-white px-3 py-1 text-[11px] text-neutral-400 ring-1 ring-inset ring-black/5">
          your-org.bookasloth.com
        </div>
      </div>
      <div className="p-5">
        <div className="space-y-2.5">
          {branches.map((b) => (
            <div key={b.name} className="flex items-center justify-between rounded-[8px] border border-neutral-100 bg-white p-3">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin size={14} className="flex-shrink-0" style={{ color: 'var(--ent-cta)' }} />
                <span className="truncate text-xs font-semibold text-[color:var(--ent-ink)]">{b.name}</span>
              </div>
              <span className="flex-shrink-0 text-[10px] font-medium text-[color:var(--ent-muted)]">{b.staff} staff</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1" aria-hidden="true">
          {Array.from({ length: 21 }).map((_, i) => (
            <span
              key={i}
              className="aspect-square rounded-[3px]"
              style={{ background: i % 5 === 0 ? 'var(--ent-cta)' : 'rgba(26,26,26,0.06)' }}
            />
          ))}
        </div>
        <p className="mt-3 text-[10px] font-medium text-[color:var(--ent-muted)]">Calendar synced across all locations</p>
      </div>
    </div>
  );
}

/* Vertical connected timeline — shared shape for Workflow + Implementation. */
function Timeline({ items, render }) {
  return (
    <ol className="relative border-l-2 pl-2" style={{ borderColor: 'var(--ent-line)' }}>
      {items.map((item, i) => (
        <Reveal as="li" key={i} delay={Math.min(i * 0.04, 0.4)} className="relative mb-8 ml-8 last:mb-0">
          <span
            className="absolute -left-4 top-0 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: 'var(--ent-cta)' }}
          >
            {i + 1}
          </span>
          {render(item)}
        </Reveal>
      ))}
    </ol>
  );
}

export default function Enterprise() {
  // Scroll-depth: fire once per threshold, guarded by a Set so re-renders
  // (or scrolling back up/down past the same point) never double-count.
  const seenDepths = useRef(new Set());

  useEffect(() => {
    const THRESHOLDS = [25, 50, 75, 100];
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
      THRESHOLDS.forEach((depth) => {
        if (pct >= depth && !seenDepths.current.has(depth)) {
          seenDepths.current.add(depth);
          analytics.track(EVENTS.ENTERPRISE_SCROLL_DEPTH, { depth });
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleHeroCta = () => {
    scrollToForm();
    analytics.track(EVENTS.ENTERPRISE_HERO_CTA);
    analytics.track(EVENTS.ENTERPRISE_SALES_CTA);
  };
  const handleSalesCta = () => {
    scrollToForm();
    analytics.track(EVENTS.ENTERPRISE_SALES_CTA);
  };
  const handleDemoCta = () => {
    scrollToForm();
    analytics.track(EVENTS.ENTERPRISE_DEMO_CTA);
  };

  return (
    <main className="overflow-x-clip bg-white text-[color:var(--ent-ink)]" style={STYLE_VARS}>
      <Seo
        title={ENT_SEO.title}
        description={ENT_SEO.description}
        image={ogCard('enterprise')}
        canonical={ENT_SEO.canonical}
        keywords={ENT_SEO.keywords}
        ogTitle={ENT_SEO.ogTitle}
        ogDescription={ENT_SEO.ogDescription}
        robots="index,follow"
        jsonLd={buildEnterpriseJsonLd()}
      />

      {/* 1. HERO */}
      <section className="px-5 py-16 sm:px-8 sm:py-24" style={{ background: 'var(--ent-tint)' }}>
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <Reveal as="h1" className="text-[clamp(2rem,5.4vw,3.4rem)] font-bold leading-[1.1] tracking-[-0.02em] text-[color:var(--ent-ink)]">
              {HERO.h1}
            </Reveal>
            <Reveal as="p" delay={0.08} className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[color:var(--ent-muted)] sm:text-lg lg:mx-0">
              {HERO.sub}
            </Reveal>
            <Reveal delay={0.16} className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={handleHeroCta}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-7 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 sm:w-auto"
                style={{ background: 'var(--ent-cta)' }}
              >
                {HERO.primary} <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={handleDemoCta}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-black/10 px-7 py-4 text-sm font-semibold text-[color:var(--ent-ink)] transition-all hover:-translate-y-0.5 sm:w-auto"
              >
                {HERO.secondary}
              </button>
            </Reveal>
          </div>
          <Reveal delay={0.12} className="mx-auto w-full max-w-md lg:max-w-none">
            <EnterpriseMock />
          </Reveal>
        </div>
      </section>

      {/* 2. TRUST CARDS */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            Enterprise-grade, from day one.
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TRUST_CARDS.map((t, i) => {
              const Icon = TRUST_ICONS[t.icon];
              return (
                <Reveal key={t.title} delay={Math.min(i * 0.05, 0.3)} className={`${CARD} flex flex-col items-center gap-3 text-center`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--ent-cta) 12%, transparent)', color: 'var(--ent-cta)' }}>
                    {Icon && <Icon size={20} />}
                  </span>
                  <span className="text-sm font-semibold">{t.title}</span>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. PROBLEM */}
      <section className="px-5 py-16 sm:px-8" style={{ background: 'var(--ent-tint)' }}>
        <div className="mx-auto max-w-4xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            {PROBLEMS.heading}
          </Reveal>
          <div className="mt-10 space-y-3">
            {PROBLEMS.points.map((point, i) => (
              <Reveal key={point} delay={Math.min(i * 0.05, 0.3)} className="flex items-start gap-3 rounded-[6px] border border-black/5 bg-white p-4">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: 'var(--ent-cta)' }} />
                <p className="text-sm leading-relaxed text-[color:var(--ent-ink)]">{point}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2} as="p" className="mx-auto mt-10 max-w-xl text-center text-lg font-semibold" style={{ color: 'var(--ent-cta)' }}>
            {PROBLEMS.transition}
          </Reveal>
        </div>
      </section>

      {/* 4. FEATURES */}
      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            Everything your organization needs.
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CATEGORIES.map((cat, i) => (
              <Reveal key={cat.key} delay={Math.min((i % 3) * 0.08, 0.24)} className={`${CARD} flex h-full flex-col`}>
                <h3 className="text-base font-bold">{cat.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--ent-muted)]">{cat.description}</p>
                <ul className="mt-4 space-y-2">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] leading-snug text-[color:var(--ent-ink)]">
                      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--ent-cta)' }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW TIMELINE */}
      <section className="px-5 py-16 sm:px-8 lg:py-24" style={{ background: 'var(--ent-tint)' }}>
        <div className="mx-auto max-w-2xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            One booking, every step accounted for.
          </Reveal>
          <div className="mt-12">
            <Timeline items={WORKFLOW_STEPS} render={(step) => <span className="block pt-1.5 text-sm font-semibold">{step}</span>} />
          </div>
        </div>
      </section>

      {/* 6. INDUSTRIES */}
      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            Built for how your industry runs.
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((ind, i) => (
              <Reveal key={ind.name} delay={Math.min((i % 4) * 0.06, 0.24)} className={`${CARD} flex h-full flex-col`}>
                <h3 className="text-base font-bold">{ind.name}</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--ent-muted)]">{ind.challenge}</p>
                <div className="mt-3 flex items-start gap-2 border-t border-dashed border-neutral-200 pt-3">
                  <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--ent-cta)' }} />
                  <p className="text-[13px] leading-relaxed text-[color:var(--ent-ink)]">{ind.solution}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SERVICES */}
      <section className="px-5 py-16 sm:px-8" style={{ background: 'var(--ent-tint)' }}>
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            Support beyond software.
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SERVICES.map((s) => (
              <div key={s} className="rounded-[6px] border border-black/5 bg-white px-3 py-3.5 text-center text-[13px] font-semibold shadow-[0_8px_30px_rgba(26,26,26,0.03)]">
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. INTEGRATIONS */}
      <section className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            Works with what you already use.
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {INTEGRATIONS.map((s) => (
              <div key={s} className="rounded-[6px] border border-dashed border-black/10 bg-white px-3 py-3.5 text-center text-[13px] font-semibold text-[color:var(--ent-muted)]">
                {s}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. DEPLOYMENT */}
      <section className="px-5 py-16 sm:px-8 lg:py-24" style={{ background: 'var(--ent-tint)' }}>
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            Deploy the way that fits your organization.
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DEPLOYMENTS.map((d, i) => (
              <Reveal key={d.name} delay={Math.min(i * 0.07, 0.28)} className={`${CARD} relative flex h-full flex-col`}>
                {d.badge && (
                  <span
                    className="absolute right-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--ent-cta) 14%, transparent)', color: 'var(--ent-cta)' }}
                  >
                    {d.badge}
                  </span>
                )}
                <h3 className="pr-16 text-base font-bold">{d.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--ent-muted)]">{d.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CUSTOMIZATIONS */}
      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            Configured around your workflow.
          </Reveal>
          <div className="mt-12">
            <EnterpriseFaq items={CUSTOMIZATIONS} idPrefix="cust" />
          </div>
        </div>
      </section>

      {/* 11. WHY */}
      <section className="px-5 py-16 sm:px-8 lg:py-24" style={{ background: 'var(--ent-tint)' }}>
        <div className="mx-auto max-w-6xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            Why organizations choose Book A Sloth Enterprise.
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CARDS.map((w, i) => (
              <Reveal key={w.title} delay={Math.min((i % 4) * 0.06, 0.24)} className={`${CARD} h-full`}>
                <h3 className="text-base font-bold">{w.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ent-muted)]">{w.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 12. IMPLEMENTATION TIMELINE */}
      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            From discovery to launch.
          </Reveal>
          <div className="mt-12">
            <Timeline
              items={IMPLEMENTATION_STEPS}
              render={(s) => (
                <>
                  <span className="block pt-1.5 text-sm font-bold">{s.step}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-[color:var(--ent-muted)]">{s.detail}</span>
                </>
              )}
            />
          </div>
        </div>
      </section>

      {/* 13. FAQ */}
      <section className="px-5 py-16 sm:px-8 lg:py-24" style={{ background: 'var(--ent-tint)' }}>
        <div className="mx-auto max-w-3xl">
          <Reveal as="h2" className="text-center text-3xl font-bold leading-tight sm:text-4xl">
            Questions, answered.
          </Reveal>
          <div className="mt-12">
            <EnterpriseFaq items={FAQ} idPrefix="faq" trackOpen />
          </div>
        </div>
      </section>

      {/* 14. LEAD FORM */}
      <section id="enterprise-lead" className="px-5 py-16 sm:px-8 lg:py-24">
        <Reveal className="mx-auto flex max-w-lg justify-center">
          <EnterpriseLeadForm />
        </Reveal>
      </section>

      {/* 15. FINAL CTA */}
      <section className="px-5 py-20 text-center sm:px-8" style={{ background: 'var(--ent-tint)' }}>
        <div className="mx-auto max-w-2xl">
          <Reveal as="h2" className="text-3xl font-bold leading-tight sm:text-4xl">
            Let&rsquo;s build your booking infrastructure.
          </Reveal>
          <Reveal as="p" delay={0.06} className="mx-auto mt-4 max-w-lg text-base text-[color:var(--ent-muted)]">
            Tell us about your organization and we&rsquo;ll get back with a scoped plan.
          </Reveal>
          <Reveal delay={0.12} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSalesCta}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] px-7 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 sm:w-auto"
              style={{ background: 'var(--ent-cta)' }}
            >
              {HERO.primary} <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleDemoCta}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-black/10 px-7 py-4 text-sm font-semibold text-[color:var(--ent-ink)] transition-all hover:-translate-y-0.5 sm:w-auto"
            >
              {HERO.secondary}
            </button>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

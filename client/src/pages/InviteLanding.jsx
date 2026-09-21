// client/src/pages/InviteLanding.jsx
// ONE shared VIP landing for every /invite/:slug (marketing gimmick + lead-source
// attribution). ponytail: purpose-built trimmed page reusing Home's data/components
// rather than forking the 2189-line Home.jsx. Iterate here if per-slug design proves out.
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInviteConfig, recordInviteVisit, getVendorGoogleUrl } from '../services/api';
import { STATS, Odometer } from './Home';
import { FREE_PLAN, PAID_PLANS } from '../data/plans';
import useFeeOnly from '../hooks/useFeeOnly';
import { TESTIMONIALS } from '../data/testimonials';
import HowItWorks from '../components/home/HowItWorks';
import Reveal from '../components/home/Reveal';
import Seo from '../components/common/Seo';
import { ogCard } from '../config/ogImages';

// First-touch: bas_invite is the durable single source of truth. If it already
// exists, change NOTHING (neither store) — mirrors the referral bas_ref rule so
// localStorage and the UTM stash can never diverge on source.
function stashFirstTouch(slug) {
  try {
    if (localStorage.getItem('bas_invite')) return;
    localStorage.setItem('bas_invite', slug.slice(0, 40));
    const cur = JSON.parse(sessionStorage.getItem('bas_utm') || '{}');
    if (!Object.keys(cur).length) {
      sessionStorage.setItem('bas_utm', JSON.stringify({ utm_source: `invite/${slug}`, utm_medium: 'invite' }));
    }
  } catch { /* non-fatal */ }
}

export default function InviteLanding() {
  const { slug } = useParams();
  const nav = useNavigate();
  const feeOnly = useFeeOnly();
  const [label, setLabel] = useState(null);

  useEffect(() => {
    let alive = true;
    getInviteConfig(slug)
      .then(({ data }) => {
        if (!alive) return;
        if (!data || data.active === false) { nav('/', { replace: true }); return; }
        setLabel(data.label || 'friend');
        stashFirstTouch(slug);
        recordInviteVisit(slug).catch(() => {});
      })
      .catch(() => { if (alive) nav('/', { replace: true }); });
    return () => { alive = false; };
  }, [slug, nav]);

  async function startGoogle() {
    try {
      const invite = localStorage.getItem('bas_invite') || slug;
      const { data } = await getVendorGoogleUrl('signup', invite);
      if (data?.url) window.location.href = data.url;
    } catch { /* error surfaces on the auth page */ }
  }

  if (!label) return null; // brief blank while validating (or redirecting)

  const top3 = STATS.slice(0, 3);
  const plans = feeOnly ? [...PAID_PLANS] : [FREE_PLAN, ...PAID_PLANS];

  return (
    <div className="min-h-screen bg-white text-ink">
      <Seo title="You're invited — Book A Sloth" description="Your personal invitation to Book A Sloth." image={ogCard('invite', 'png')} robots="noindex" />

      {/* Hero — dynamic greeting */}
      <section className="mx-auto max-w-3xl px-6 pt-20 pb-14 text-center">
        <Reveal as="p" className="mb-3 text-sm font-medium uppercase tracking-widest text-primary">
          You're invited 🦥
        </Reveal>
        <Reveal as="h1" className="font-heading text-[clamp(2rem,7vw,3.4rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
          Welcome, {label}
        </Reveal>
        <Reveal as="p" delay={0.1} className="mx-auto mt-5 max-w-md text-lg text-neutral-500">
          One calm link for your bookings, payments and reminders. Set up in minutes.
        </Reveal>
        <Reveal delay={0.16} className="mt-8">
          <button onClick={startGoogle}
            className="rounded-xl border-4 border-ink bg-primary px-7 py-3.5 font-semibold text-white transition hover:brightness-105">
            Get started with Google
          </button>
          <p className="mt-3 text-xs text-neutral-500">
            By continuing you agree to our{' '}
            <Link to="/terms" className="underline">Terms</Link> and{' '}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </Reveal>
      </section>

      {/* Numbers — top 3 from Home STATS */}
      <section className="bg-ink py-14 text-white">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 text-center sm:grid-cols-3">
          {top3.map((s) => (
            <div key={s.label}>
              <Odometer value={s.value} className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl" />
              <p className="mt-2 text-sm text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Book A Sloth */}
      <HowItWorks />

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-center font-heading text-3xl font-semibold">Simple pricing</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className="rounded-xl border-4 border-ink p-6">
              <h3 className="font-heading text-xl font-semibold">{p.name}</h3>
              <p className="mt-2 text-2xl font-bold">₹{p.monthly}<span className="text-sm font-normal text-neutral-500">/mo</span></p>
              <p className="mt-1 text-sm text-neutral-500">{p.tagline}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-neutral-50 py-16">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-6 sm:grid-cols-2">
          {TESTIMONIALS.slice(0, 4).map((t, i) => (
            <figure key={i} className="rounded-xl border-4 border-ink bg-white p-5">
              <blockquote className="text-sm text-neutral-700">“{t.quote}”</blockquote>
              <figcaption className="mt-3 text-xs font-medium text-neutral-500">— {t.name}{t.role ? `, ${t.role}` : ''}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Minimal footer — bottom strip only */}
      <footer className="border-t-4 border-ink py-6 text-center text-xs text-neutral-500">
        © Book A Sloth · <Link to="/privacy" className="underline">Privacy</Link> · <Link to="/terms" className="underline">Terms</Link>
      </footer>
    </div>
  );
}

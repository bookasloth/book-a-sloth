/**
 * Opening.jsx — "The Opening" ceremony. Route: /opening (no app chrome — full-stage).
 *
 * Flow: intro (curtains + ribbon + countdown) → cut → curtains sweep + confetti
 * → name capture → their stone drops → reward CTA (register, 18% off yearly).
 * Window is server-authoritative (GET /status): pending shows a countdown to the
 * opening, closed shows the sealed wall. Reduced-motion degrades gracefully.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Seo from '../components/common/Seo';
import Stone from '../components/opening/Stone';
import RibbonCut from '../components/opening/RibbonCut';
import ConfettiStorm from '../components/opening/ConfettiStorm';
import { getOpeningStatus, placeStone } from '../services/opening';
import '../styles/opening.css';

const pad = (n) => String(n).padStart(2, '0');

function Countdown({ to, prefix }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, new Date(to).getTime() - now);
  const h = Math.floor(ms / 3.6e6);
  const m = Math.floor((ms % 3.6e6) / 6e4);
  const s = Math.floor((ms % 6e4) / 1000);
  return (
    <p className="mt-6 font-heading text-lg tracking-widest text-[#ffd76a]">
      {prefix} {pad(h)}h {pad(m)}m {pad(s)}s
    </p>
  );
}

export default function Opening() {
  const [status, setStatus] = useState(null);      // null=loading
  const [phase, setPhase] = useState('intro');      // intro | reveal | capture | placed | reward
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [stone, setStone] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getOpeningStatus().then(setStatus).catch(() => setStatus({ state: 'error' })); }, []);

  const curtainOpen = phase !== 'intro';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) { setError('Please enter your name.'); return; }
    setSubmitting(true);
    try {
      const { opener } = await placeStone(name.trim(), message.trim());
      setStone(opener);
      setPhase('placed');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not place your stone. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- gated states -------------------------------------------------------
  if (!status) {
    return <div className="opening-stage grid place-items-center"><Loader2 className="animate-spin text-white/70" /></div>;
  }
  if (status.state === 'pending') {
    return (
      <main className="opening-stage grid place-items-center px-6 text-center">
        <Seo title="The Opening — Book A Sloth" description="The doors open soon. Be there to cut the ribbon." />
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-[#ffd76a]">The Opening</p>
          <h1 className="mt-4 font-heading text-3xl font-extrabold sm:text-5xl">The doors haven’t opened yet.</h1>
          <p className="mx-auto mt-4 max-w-md text-white/70">Come back to cut the ribbon and put your name in stone — forever.</p>
          <Countdown to={status.opens_at} prefix="Opens in" />
        </div>
      </main>
    );
  }
  if (status.state === 'closed' || status.state === 'error') {
    return (
      <main className="opening-stage grid place-items-center px-6 text-center">
        <Seo title="The Opening — Book A Sloth" description="The doors are open. Meet the people who opened them." />
        <div>
          <h1 className="font-heading text-3xl font-extrabold sm:text-5xl">The doors are open. 🦥</h1>
          <p className="mx-auto mt-4 max-w-md text-white/70">The ribbon’s been cut and the wall is sealed — but the people who opened it live on.</p>
          <Link to="/inaugurators" className="mt-8 inline-flex items-center gap-2 rounded bg-primary-cta px-6 py-3 font-semibold text-white">
            See the Inaugurators <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  // ---- the ceremony (open) ------------------------------------------------
  return (
    <main className="opening-stage grid place-items-center px-6">
      <Seo title="The Opening — Book A Sloth" description="Cut the ribbon. Open Book A Sloth. Put your name in stone, forever." />

      {/* Curtains + valance overlay */}
      <div className={`opening-curtain ${curtainOpen ? 'opening-curtain--open' : ''}`} aria-hidden="true">
        <div className="opening-curtain__panel opening-curtain__panel--l" />
        <div className="opening-curtain__panel opening-curtain__panel--r" />
      </div>
      <div className={`opening-valance ${curtainOpen ? 'opening-curtain--open' : ''}`} aria-hidden="true" />

      {phase === 'reveal' && <ConfettiStorm />}

      {/* Stage content sits above the curtain only when it's the intro; after
          cut the curtain lifts and content is revealed underneath. */}
      <div className="relative z-30 w-full max-w-xl text-center">
        {phase === 'intro' && (
          <>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#ffd76a]">
              {status.count?.toLocaleString('en-IN') || 0} have opened the doors
            </p>
            <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight sm:text-5xl">
              Book A Sloth isn’t open yet.<br />Someone has to open it.<br />
              <span className="text-primary">Today, that’s you.</span>
            </h1>
            <div className="mt-10">
              <RibbonCut onCut={() => { setPhase('reveal'); setTimeout(() => setPhase('capture'), 1400); }} />
            </div>
            {status.closes_at && <Countdown to={status.closes_at} prefix="Doors close in" />}
          </>
        )}

        {phase === 'reveal' && (
          <h1 className="font-heading text-4xl font-extrabold sm:text-6xl">You opened Book A Sloth.</h1>
        )}

        {phase === 'capture' && (
          <div className="rounded-xl bg-white/95 p-6 text-ink shadow-2xl sm:p-8">
            <h2 className="font-heading text-2xl font-extrabold">You opened the doors. 🎉</h2>
            <p className="mt-2 text-sm text-muted">Put your name on the wall — forever.</p>
            <form onSubmit={submit} className="mt-5 space-y-3 text-left">
              <input
                value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus
                placeholder="Your name" aria-label="Your name"
                className="w-full rounded border-2 border-ink/10 px-3 py-2.5 outline-none focus:border-primary"
              />
              <input
                value={message} onChange={(e) => setMessage(e.target.value)} maxLength={80}
                placeholder="Leave a message (optional)" aria-label="A message on your stone"
                className="w-full rounded border-2 border-ink/10 px-3 py-2.5 outline-none focus:border-primary"
              />
              {/* phase-2 affordance — WhatsApp verify, coming soon */}
              <div className="flex items-center gap-2 rounded bg-sand px-3 py-2 text-xs text-muted">
                <span className="inline-block h-2 w-2 rounded-full bg-c-emerald/50" />
                Verify your number on WhatsApp for a ✓ badge — <span className="font-semibold">coming soon</span>
              </div>
              {error && <p className="text-sm text-primary">{error}</p>}
              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={submitting}
                  className="inline-flex items-center gap-2 rounded bg-primary-cta px-5 py-2.5 font-semibold text-white disabled:opacity-60">
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                  Place my stone
                </button>
                <button type="button" onClick={() => setPhase('reward')} className="text-sm font-medium text-muted underline">
                  Skip
                </button>
              </div>
            </form>
          </div>
        )}

        {phase === 'placed' && stone && (
          <div className="rounded-xl bg-white/95 p-8 text-ink shadow-2xl">
            <h2 className="font-heading text-2xl font-extrabold">Your stone is set. 🪨</h2>
            <div className="mx-auto my-6 w-28"><Stone name={stone.name} message={stone.message} shade={stone.shade} shape={stone.shape} /></div>
            <p className="text-sm text-muted">It’s on the wall now — forever.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button onClick={() => setPhase('reward')} className="rounded bg-primary-cta px-5 py-2.5 font-semibold text-white">Continue</button>
              <Link to="/inaugurators" className="rounded border-2 border-ink/15 px-5 py-2.5 font-semibold text-ink">See the wall</Link>
            </div>
          </div>
        )}

        {phase === 'reward' && (
          <div className="rounded-xl bg-white/95 p-8 text-ink shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">A gift for opening the doors</p>
            <h2 className="mt-3 font-heading text-2xl font-extrabold sm:text-3xl">Open a business on it too.</h2>
            <p className="mx-auto mt-3 max-w-md text-muted">
              Register today and save <strong className="text-ink">18% on any yearly plan.</strong> Your booking page, live in minutes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/be-a-sloth" className="inline-flex items-center gap-2 rounded bg-primary-cta px-6 py-3 font-semibold text-white">
                Register &amp; save 18% <ArrowRight size={18} />
              </Link>
              <Link to="/inaugurators" className="rounded border-2 border-ink/15 px-6 py-3 font-semibold text-ink">Maybe later</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

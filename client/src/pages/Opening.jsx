/**
 * Opening.jsx — "The Opening" ceremony. Route: /opening (full-stage, no chrome).
 *
 * The dramatic moment lives on our ink section (homepage stats band), not a velvet
 * stage. Flow: intro (logo + ribbon + countdown) → cut → confetti (6s: 3s steady,
 * 3s taper) with a "You opened the doors" reveal → at the 3s mark the capture card
 * opens (name only) → their stone drops → reward CTA (register, 18% off yearly).
 *
 * Window is server-authoritative (GET /status): pending shows a countdown, closed
 * shows the sealed wall. Reduced-motion collapses the timings but keeps the flow.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MousePointerClick, Clock, User, ArrowRight, Gift, Percent, ShieldCheck, Loader2 } from 'lucide-react';
import Seo from '../components/common/Seo';
import Stone from '../components/opening/Stone';
import RibbonCut from '../components/opening/RibbonCut';
import ConfettiStorm from '../components/opening/ConfettiStorm';
import { getOpeningStatus, placeStone } from '../services/opening';
import '../styles/opening.css';

const REDUCED = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');

function Countdown({ to, prefix }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, new Date(to).getTime() - now);
  const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4), s = Math.floor((ms % 6e4) / 1000);
  return (
    <span className="op-fade mt-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[.08] px-5 py-2.5">
      <Clock size={16} className="text-secondary" />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">{prefix}</span>
      <b className="font-heading text-xl tabular-nums">{pad(h)}h {pad(m)}m {pad(s)}s</b>
    </span>
  );
}

const LogoTile = ({ size = 64, img = 38 }) => (
  <div className="mx-auto grid place-items-center rounded-2xl bg-white shadow-[0_4px_14px_rgba(16,24,40,.18)]"
       style={{ width: size, height: size }}>
    <img src="/sloth.png" alt="Book A Sloth" width={img} height={img} style={{ width: img, height: img }} />
  </div>
);

export default function Opening() {
  const [status, setStatus] = useState(null);
  const [phase, setPhase] = useState('intro');   // intro | reveal | capture | placed | reward
  const [name, setName] = useState('');
  const [stone, setStone] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getOpeningStatus().then(setStatus).catch(() => setStatus({ state: 'error' })); }, []);

  const onCut = () => {
    setPhase('reveal');
    // modal opens on the 3rd second (confetti keeps running to 6s behind it)
    const delay = REDUCED() ? 700 : 3000;
    setTimeout(() => setPhase('capture'), delay);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) { setError('Please enter your name.'); return; }
    setSubmitting(true);
    try {
      const { opener } = await placeStone(name.trim(), '');
      setStone(opener);
      setPhase('placed');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not place your stone. Try again.');
    } finally { setSubmitting(false); }
  };

  if (!status) return <div className="op-stage"><Loader2 className="animate-spin text-white/70" /></div>;

  if (status.state === 'pending') {
    return (
      <main className="op-stage text-center">
        <Seo title="The Opening — Book A Sloth" description="The doors open soon. Be there to cut the ribbon." />
        <div className="op-rise">
          <LogoTile />
          <p className="mt-5 font-heading text-xs font-bold uppercase tracking-[.2em] text-primary">The grand opening</p>
          <h1 className="mt-3 font-heading text-3xl font-extrabold text-white sm:text-5xl">The doors haven’t opened yet.</h1>
          <p className="mx-auto mt-4 max-w-md text-white/70">Come back to cut the ribbon and put your name in stone — forever.</p>
          <Countdown to={status.opens_at} prefix="Opens in" />
        </div>
      </main>
    );
  }

  if (status.state === 'closed' || status.state === 'error') {
    return (
      <main className="op-stage text-center">
        <Seo title="The Opening — Book A Sloth" description="The doors are open. Meet the people who opened them." />
        <div className="op-rise">
          <LogoTile />
          <h1 className="mt-6 font-heading text-3xl font-extrabold text-white sm:text-5xl">The doors are open.</h1>
          <p className="mx-auto mt-4 max-w-md text-white/70">The ribbon’s been cut and the wall is sealed — but the people who opened it live on.</p>
          <Link to="/inaugurators" className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary-cta px-6 py-3 font-heading font-bold text-white">
            See the Inaugurators <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="op-stage">
      <Seo title="The Opening — Book A Sloth" description="Cut the ribbon. Open Book A Sloth. Put your name in stone, forever." />
      {(phase === 'reveal' || phase === 'capture') && <ConfettiStorm />}

      <div className="relative z-10 w-full max-w-xl text-center">
        {phase === 'intro' && (
          <div className="op-rise">
            <LogoTile />
            <p className="mt-4 inline-flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-[.16em] text-primary">
              <Sparkles size={15} /> {status.count?.toLocaleString('en-IN') || 0} have opened the doors
            </p>
            <h1 className="mt-4 font-heading text-3xl font-extrabold leading-[1.08] text-white sm:text-5xl">
              Book A Sloth isn’t open yet.<br />Someone has to open it.<br /><span className="text-primary">Today, that’s you.</span>
            </h1>
            <div className="mt-9"><RibbonCut onCut={onCut} /></div>
            <p className="mt-5 inline-flex items-center gap-2 text-sm text-white/75">
              <MousePointerClick size={16} className="text-secondary" />
              Drag the scissors across the ribbon to open the doors
            </p>
            {status.closes_at && <div><Countdown to={status.closes_at} prefix="Doors close in" /></div>}
          </div>
        )}

        {phase === 'reveal' && (
          <h1 className="op-pop font-heading text-4xl font-extrabold text-white sm:text-6xl">You opened the doors.</h1>
        )}

        {phase === 'capture' && (
          <div className="op-pop mx-auto w-full max-w-md rounded-[20px] border border-black/5 bg-white p-7 text-left text-ink shadow-[0_22px_45px_-18px_rgba(26,26,26,.55)]">
            <LogoTile size={52} img={30} />
            <h2 className="mt-4 flex items-center justify-center gap-2 text-center font-heading text-2xl font-extrabold">
              You <span className="text-primary">opened the doors.</span> <Sparkles size={22} className="text-secondary" />
            </h2>
            <p className="mt-1 text-center text-sm text-muted">Put your name on the wall — <b className="text-primary">forever.</b></p>
            <form onSubmit={submit} className="mt-5">
              <label className="flex items-center gap-2.5 rounded-xl border border-primary px-4 py-3 shadow-[0_0_0_3px_#FFE9DD]">
                <User size={18} className="text-primary" />
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus
                       placeholder="Your name" aria-label="Your name"
                       className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
              </label>
              {error && <p className="mt-2 text-sm text-primary">{error}</p>}
              <div className="mt-5 flex items-center gap-4">
                <button type="submit" disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-md bg-primary-cta px-6 py-3 font-heading font-bold text-white disabled:opacity-60">
                  {submitting && <Loader2 size={18} className="animate-spin" />} Place my stone
                </button>
                <button type="button" onClick={() => setPhase('reward')} className="text-sm font-semibold text-muted underline">Skip for now</button>
              </div>
            </form>
          </div>
        )}

        {phase === 'placed' && stone && (
          <div className="op-pop mx-auto w-full max-w-md rounded-[20px] border border-black/5 bg-white p-8 text-ink shadow-[0_22px_45px_-18px_rgba(26,26,26,.55)]">
            <h2 className="font-heading text-2xl font-extrabold">Your stone is set.</h2>
            <div className="mx-auto my-6 w-32"><Stone name={stone.name} shade={stone.shade} shape={stone.shape} /></div>
            <p className="text-sm text-muted">It’s on the wall now — forever.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => setPhase('reward')} className="rounded-md bg-primary-cta px-6 py-3 font-heading font-bold text-white">Continue</button>
              <Link to="/inaugurators" className="rounded-md border border-black/10 px-6 py-3 font-heading font-bold text-ink">See the wall</Link>
            </div>
          </div>
        )}

        {phase === 'reward' && (
          <div className="op-pop mx-auto w-full max-w-lg rounded-[20px] border border-black/5 bg-white p-8 text-ink shadow-[0_22px_45px_-18px_rgba(26,26,26,.55)]">
            <LogoTile size={48} img={28} />
            <p className="mt-4 inline-flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-[.14em] text-primary">
              <Gift size={15} /> A gift for opening the doors
            </p>
            <h2 className="mt-3 font-heading text-2xl font-extrabold sm:text-3xl">Open a business on it <span className="text-primary">too.</span></h2>
            <p className="mx-auto mt-3 max-w-md text-muted">Register today and save <b className="text-ink">18% on any yearly plan.</b> Your booking page, live in minutes.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/be-a-sloth" className="inline-flex items-center gap-2 rounded-md bg-primary-cta px-6 py-3 font-heading font-bold text-white">
                Register &amp; save 18% <ArrowRight size={18} />
              </Link>
              <Link to="/inaugurators" className="rounded-md border border-black/10 px-6 py-3 font-heading font-bold text-ink">Maybe later</Link>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3 text-left">
              {[[Percent, 'Save 18%', 'on yearly plans'], [Clock, 'Live in minutes', 'no setup headaches'], [ShieldCheck, 'Cancel anytime', 'no lock-ins']].map(([Ic, t, d]) => (
                <div key={t} className="flex items-center gap-2.5 rounded-xl border border-black/5 bg-white px-4 py-2.5 shadow-[0_4px_14px_rgba(16,24,40,.08)]">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Ic size={16} /></span>
                  <span><b className="block font-heading text-[13px] font-bold">{t}</b><small className="text-[11px] text-muted">{d}</small></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

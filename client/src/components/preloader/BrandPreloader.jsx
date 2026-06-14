import { useState, useEffect, useMemo, useCallback } from 'react';
import usePreloader from './usePreloader';
import { ensureGreetingFonts } from './fontLoader';
import { resolveGreetings } from './greetings';
import './preloader.css';

// ───────────────────────────────────────────────────────────────────────────
// <BrandPreloader> — universal branded welcome overlay.
//
// Renders as a fixed full-screen overlay ABOVE the real page (which mounts
// underneath), so there is zero layout shift and assets load behind it. Self-
// manages timing via usePreloader; fades out and unmounts when content is ready.
//
//   <BrandPreloader variant="homepage" ready={assetsReady} />
//   <BrandPreloader variant="profile"  ready={!loading} profileName={name} accentColor={tc} />
// ───────────────────────────────────────────────────────────────────────────

const TOTAL_MS = 2500; // fixed total on-screen duration
const CYCLE_MS = 520;  // greeting swap cadence

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function BrandPreloader({
  variant = 'homepage',
  ready = false,
  profileName = null,
  accentColor = '#fe5100',
  minDuration,
  maxDuration = 3000,
  onDone,
}) {
  const reduce = useMemo(prefersReducedMotion, []);

  // Fixed 2.5s experience: greet → brand → exit always sum to TOTAL_MS,
  // regardless of how fast the page loads (content loads behind the overlay).
  const brandMs = reduce ? 420 : 520;
  const exitMs = reduce ? 300 : 520;
  const greetMs = minDuration ?? Math.max(0, TOTAL_MS - brandMs - exitMs);

  const [skipped, setSkipped] = useState(false);
  const phase = usePreloader({
    ready: true, // duration is fixed; readiness no longer gates exit
    minDuration: skipped ? 0 : greetMs,
    maxDuration: skipped ? 0 : greetMs,
    brandDuration: brandMs,
    exitDuration: exitMs,
    onDone,
  });

  // Inject greeting Noto subsets once (only ever on pages using the preloader).
  useEffect(() => { ensureGreetingFonts(); }, []);

  // Greeting cycling — only while greeting.
  const greetings = useMemo(() => resolveGreetings({ variant }), [variant]);
  const [gi, setGi] = useState(0);
  useEffect(() => {
    if (phase !== 'greet') return undefined;
    const id = setInterval(() => setGi((i) => (i + 1) % greetings.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [phase, greetings.length]);

  // Body scroll lock + aria-busy while the overlay is up.
  useEffect(() => {
    if (phase === 'hidden') return undefined;
    const root = document.getElementById('root');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root?.setAttribute('aria-busy', 'true');
    return () => {
      document.body.style.overflow = prev;
      root?.removeAttribute('aria-busy');
    };
  }, [phase]);

  // ESC = skip for power users.
  const onKey = useCallback((e) => { if (e.key === 'Escape') setSkipped(true); }, []);
  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  if (phase === 'hidden') return null;

  const g = greetings[gi % greetings.length] || greetings[0];
  const showBrand = phase === 'brand' || phase === 'exit';

  const srMessage =
    variant === 'profile'
      ? `Loading ${profileName || 'profile'} on Book A Sloth`
      : 'Welcome to Book A Sloth';

  return (
    <div
      className="pl-overlay"
      data-phase={phase}
      data-variant={variant}
      style={{ '--pl-accent': accentColor }}
      role="status"
      aria-live="polite"
      aria-label={srMessage}
    >
      <p className="pl-sr">{srMessage}</p>

      <div className="pl-stack">
        {!showBrand ? (
          // Cycling greeting. key remount retriggers the enter animation.
          <p
            key={gi}
            className="pl-greet"
            aria-hidden="true"
            lang={g.lang}
            style={g.font ? { fontFamily: `'${g.font}', 'Poppins', sans-serif` } : undefined}
          >
            {g.text}
          </p>
        ) : variant === 'profile' && profileName ? (
          // Profile: personal handoff.
          <div className="pl-brand" aria-hidden="true">
            <p className="pl-brand__sub">You’re visiting</p>
            <h2 className="pl-brand__word">
              <span className="pl-brand__name">{profileName}</span>
            </h2>
            <span className="pl-brand__dot" />
          </div>
        ) : (
          // Homepage / fallback: brand lockup.
          <div className="pl-brand" aria-hidden="true">
            <span className="pl-brand__mark">🦥</span>
            <h2 className="pl-brand__word">Book A Sloth</h2>
            <span className="pl-brand__dot" />
          </div>
        )}
      </div>

      <div className="pl-progress" aria-hidden="true">
        <span className="pl-progress__bar" />
      </div>
    </div>
  );
}

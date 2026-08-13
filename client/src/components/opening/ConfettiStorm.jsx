/**
 * ConfettiStorm.jsx — the celebration. Fires a real, sustained confetti storm
 * (canvas-confetti) on mount. Skips entirely under prefers-reduced-motion.
 *
 * Brand colours: sloth orange + gold + greens. Not a polite sprinkle — layered
 * bursts + a ~2.5s side-cannon fall so it reads as a celebration, not a toast.
 */
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

const COLORS = ['#FE5100', '#f59e0b', '#059669', '#ffd166', '#ffffff'];

export default function ConfettiStorm() {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const fire = (opts) => confetti({ colors: COLORS, disableForReducedMotion: true, ...opts });

    // opening bang
    fire({ particleCount: 160, spread: 90, startVelocity: 55, origin: { y: 0.6 } });
    fire({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 } });
    fire({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 } });

    // sustained fall
    const end = Date.now() + 2500;
    let raf;
    const rain = () => {
      fire({ particleCount: 6, angle: 60, spread: 60, startVelocity: 45, origin: { x: 0, y: 0.4 } });
      fire({ particleCount: 6, angle: 120, spread: 60, startVelocity: 45, origin: { x: 1, y: 0.4 } });
      if (Date.now() < end) raf = requestAnimationFrame(rain);
    };
    rain();

    return () => { cancelAnimationFrame(raf); confetti.reset(); };
  }, []);

  return null;
}

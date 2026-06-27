// useInViewport — lightweight IntersectionObserver hook for lazy-mounting
// offscreen content. Returns [ref, hasEntered]; hasEntered latches true the first
// time the element nears the viewport and never flips back (once-only).
//
// Generalises the manual observer pattern used in Home.jsx so any public page can
// progressively load below-the-fold sections WITHOUT pulling in framer-motion
// (use framer-motion's useInView when you actually want motion).
//
//   const [ref, shown] = useInViewport();
//   <div ref={ref}>{shown && <HeavyThing />}</div>
import { useEffect, useRef, useState } from 'react';

export default function useInViewport({ rootMargin = '200px', threshold = 0 } = {}) {
  const ref = useRef(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasEntered) return;

    // No IntersectionObserver (very old browsers / SSR) → render immediately.
    if (typeof IntersectionObserver === 'undefined') {
      setHasEntered(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHasEntered(true);
          obs.disconnect();
        }
      },
      { rootMargin, threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasEntered, rootMargin, threshold]);

  return [ref, hasEntered];
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getOnboardingStatus } from '../../services/api';

// Maps stepCompleted → the segment the host should be on next.
// Redesigned 4-screen flow (PR 2 of the host-onboarding redesign):
//   1 = Google identity done       → claim slug
//   2 = slug claimed               → persona (was /about in the 6-step flow)
//   3 = persona saved              → preview (about + WhatsApp on one screen)
//   4 = legacy: category-in-flight → preview (roll forward — legacy /about
//                                     hosts still hit persona, which bumps to 3)
//   5 = details saved              → plan
// stepCompleted >= 6 => onboarding complete → dashboard (handled below).
const RESUME = { 1: 'claim', 2: 'category', 3: 'preview', 4: 'preview', 5: 'plan' };

/**
 * Server-truth resume guard for onboarding steps.
 *
 * - If the host is already complete, redirects to /dashboard.
 * - If the host is on the wrong step, redirects to the correct segment.
 * - Returns `ready=true` once the correct step is confirmed (or on error, so
 *   the page can still render gracefully rather than blocking forever).
 *
 * Usage: const ready = useOnboardingGuard();
 * Render a loading state until ready is true.
 */
export default function useOnboardingGuard() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getOnboardingStatus()
      .then(({ data }) => {
        if (!alive) return;
        if (data?.isComplete) {
          navigate('/dashboard', { replace: true });
          return;
        }
        const done = data?.stepCompleted || 1;
        const target = done >= 6 ? null : RESUME[done];
        // Escape hatch: /category/all is the fallback search UI; treat it as
        // still "on category" so the guard doesn't bounce the host back out.
        const path = window.location.pathname.replace(/\/$/, '');
        let here = path.split('/').pop();
        if (target === 'category' && /\/category\/all$/.test(path)) here = 'category';
        if (target && target !== here) {
          navigate(`/vendor-register/${data.slug || slug}/${target}`, { replace: true });
          return;
        }
        setReady(true);
      })
      .catch(() => setReady(true)); // on error, let the page render
    return () => { alive = false; };
  }, [navigate, slug]);

  return ready;
}

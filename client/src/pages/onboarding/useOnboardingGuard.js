import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getOnboardingStatus } from '../../services/api';

// Maps stepCompleted → the segment the host should be on next.
// stepCompleted=1 means Google identity done, host should be on claim.
// stepCompleted=2 means slug claimed, host should be on about. Etc.
const RESUME = { 1: 'claim', 2: 'about', 3: 'category', 4: 'whatsapp', 5: 'plan' };

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
        const here = window.location.pathname.split('/').pop();
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

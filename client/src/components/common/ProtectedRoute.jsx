import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (loading || !user) {
      setStatusLoading(false);
      return;
    }

    // For vendor users, check onboarding status
    if (user.role === 'host') {
      // Import here to avoid circular deps
      import('../../services/api')
        .then(({ getOnboardingStatus }) => {
          getOnboardingStatus()
            .then(({ data }) => {
              setOnboardingStatus(data);
            })
            .catch(() => {
              // If no onboarding status, assume it's not started
              setOnboardingStatus({ isComplete: true });
            })
            .finally(() => setStatusLoading(false));
        });
    } else {
      setStatusLoading(false);
    }
  }, [user, loading]);

  if (loading || statusLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!user) {
    // Preserve the intended destination so login can return the user there
    // (e.g. the booking-completed email -> /review/:id while logged out).
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${next}`} replace />;
  }

  // A host is forced into onboarding ONLY if they have an in-progress, slug-based
  // onboarding session that isn't finished. Legacy/existing hosts (no onboarding
  // slug — they never used the new flow) are treated as complete and reach the
  // dashboard normally, instead of being trapped in the verify flow forever.
  //
  // RESUME map: stepCompleted → next segment (explicit, no off-by-one)
  //   1 = Google identity done  → claim slug
  //   2 = slug claimed          → about you
  //   3 = about done            → category
  //   4 = category done         → whatsapp
  //   5 = whatsapp done         → plan
  //   6 = complete              → no redirect (isComplete should be true)
  const RESUME = { 1: 'claim', 2: 'about', 3: 'category', 4: 'whatsapp', 5: 'plan' };

  if (user.role === 'host' && onboardingStatus && !onboardingStatus.isComplete && onboardingStatus.slug) {
    const done = onboardingStatus.stepCompleted || 1;
    if (done < 6) {
      return <Navigate to={`/vendor-register/${onboardingStatus.slug}/${RESUME[done]}`} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

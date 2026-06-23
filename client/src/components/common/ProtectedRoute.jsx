import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
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
    return <Navigate to="/login" replace />;
  }

  // A host is forced into onboarding ONLY if they have an in-progress, slug-based
  // onboarding session that isn't finished. Legacy/existing hosts (no onboarding
  // slug — they never used the new flow) are treated as complete and reach the
  // dashboard normally, instead of being trapped in the verify flow forever.
  if (user.role === 'host' && onboardingStatus && !onboardingStatus.isComplete && onboardingStatus.slug) {
    const steps = [
      '/vendor-register',
      '/vendor-register/:slug/verify',
      '/vendor-register/:slug/password',
      '/vendor-register/:slug/type',
      '/vendor-register/:slug/category',
      '/vendor-register/:slug/booking-type',
      '/vendor-register/:slug/work-hours',
      '/vendor-register/:slug/whatsapp',
      '/vendor-register/:slug/profile',
      '/vendor-register/:slug/first-service',
      '/vendor-register/:slug/plans',
      '/vendor-register/:slug/explore',
    ];

    const nextStep = steps[onboardingStatus.stepCompleted] || steps[0];
    const slug = onboardingStatus.slug;
    const url = nextStep.replace(':slug', slug);

    return <Navigate to={url} replace />;
  }

  return children;
};

export default ProtectedRoute;

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Calendar, Loader2 } from 'lucide-react';
import { updateOnboardingStep } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProgressBar from './ProgressBar';

const CalendarStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, connectGoogleCalendar } = useAuth();
  const [loading, setLoading] = useState(false);

  // Vendors who signed up via Google already have their calendar connected —
  // mark the step done and move on without showing any UI.
  useEffect(() => {
    if (!user?.google_calendar_connected) return;
    updateOnboardingStep({ slug, step: 6, data: { calendar_connected: true } })
      .catch(() => {})
      .finally(() => navigate(`/vendor-register/${slug}/profile`, { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.google_calendar_connected]);

  // Check if user selected offline_only in previous step and skip
  const handleSkip = async () => {
    setLoading(true);
    try {
      await updateOnboardingStep({
        slug,
        step: 6,
        data: { calendar_connected: false, calendar_skipped: true },
      });
      toast.success('Skipped calendar step');
      navigate(`/vendor-register/${slug}/profile`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to skip');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    // Fetch the consent URL with the auth header attached (the endpoint is
    // protected — a bare browser navigation 401'd here before).
    setLoading(true);
    try {
      await connectGoogleCalendar();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not open Google');
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar current={6} total={10} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-md p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Connect Google Calendar</h1>
          <p className="text-gray-500 text-sm mb-6">
            We'll automatically create Google Meet links for all your bookings.
          </p>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="btn btn--outline w-full flex items-center justify-center gap-2 bg-white text-primary py-2.5 text-sm font-medium hover:bg-primary-light transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                Opening Google&hellip;
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" strokeWidth={2.5} />
                Connect Google Calendar
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs mb-2">or</p>
            <button
              onClick={handleSkip}
              disabled={loading}
              className="text-primary text-sm font-medium hover:underline"
            >
              Skip for now
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Why connect?</strong> You can always connect later in your settings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CalendarStep;

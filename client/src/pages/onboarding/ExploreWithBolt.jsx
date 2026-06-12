import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PartyPopper, CalendarClock, ArrowRight, Check } from 'lucide-react';
import { markOnboardingComplete } from '../../services/api';
import ProgressBar from './ProgressBar';

// Public booking page of the Book A Sloth team (demo).
const DEMO_BOOKING_PATH = '/sndatarkar';

const ExploreWithBolt = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleActionComplete = async (action) => {
    setLoading(true);
    try {
      await markOnboardingComplete();
      toast.success('Onboarding complete!');

      if (action === 'demo') {
        navigate(DEMO_BOOKING_PATH);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar current={10} total={10} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-md p-5 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
            <PartyPopper className="h-7 w-7 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Welcome to Book A Sloth!</h1>
          <p className="text-gray-600 text-sm mb-8">
            Your onboarding is complete. You're all set to accept bookings and grow your business.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleActionComplete('demo')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded font-medium hover:bg-primary-dark disabled:opacity-50 transition"
            >
              <CalendarClock className="h-5 w-5" strokeWidth={2} />
              Book a Demo with the Book a Sloth Team
            </button>

            <button
              onClick={() => handleActionComplete('dashboard')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary py-3 rounded font-medium hover:bg-primary-light disabled:opacity-50 transition"
            >
              Go to My Dashboard
              <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What's next?</h3>
            <ul className="text-sm text-blue-800 space-y-1.5">
              {['Add more services in your dashboard', 'Set your availability schedule',
                'Customize your profile theme color', 'Share your public profile with clients'].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={3} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExploreWithBolt;

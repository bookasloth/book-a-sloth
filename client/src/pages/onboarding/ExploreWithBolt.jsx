import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PartyPopper, ArrowRight, Check, Copy } from 'lucide-react';
import { markOnboardingComplete } from '../../services/api';
import { fireCelebration } from '../../utils/celebration';
import useOnboardingGuard from './useOnboardingGuard';
import ProgressBar from './ProgressBar';

const ExploreWithBolt = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const ready = useOnboardingGuard();
  const [loading, setLoading] = useState(false);
  const firedRef = useRef(false);

  // Fire once on mount. Doubles the delight moment even if the host followed
  // a paid path where PlansStep already fired: canvas-confetti dedupes fine,
  // and the second burst reads as "and you're live!" not spam.
  useEffect(() => {
    if (ready && !firedRef.current) {
      firedRef.current = true;
      fireCelebration();
    }
  }, [ready]);

  const publicUrl = `${window.location.origin}/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Link copied — share it anywhere.');
    } catch {
      toast.error('Could not copy — long-press the URL to copy manually.');
    }
  };

  const handleGoDashboard = async () => {
    setLoading(true);
    try {
      await markOnboardingComplete();
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <>
        <ProgressBar current={4} total={4} />
        <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <ProgressBar current={4} total={4} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-lg p-6 sm:p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
            <PartyPopper className="h-8 w-8 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">You're live!</h1>
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            Your booking page is public. Share the link and start taking bookings.
          </p>

          {/* Shareable URL card */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center gap-2">
            <span className="flex-1 text-left text-sm font-mono text-gray-700 truncate">
              {publicUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary transition"
            >
              <Copy className="w-3.5 h-3.5" strokeWidth={2.5} />
              Copy
            </button>
          </div>

          <button
            onClick={handleGoDashboard}
            disabled={loading}
            className="btn w-full flex items-center justify-center gap-2 bg-primary text-white py-3 font-medium hover:bg-primary-dark disabled:opacity-50 transition"
          >
            Go to my dashboard
            <ArrowRight className="h-5 w-5" strokeWidth={2} />
          </button>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What's next?</h3>
            <ul className="text-sm text-blue-800 space-y-1.5">
              {[
                'Add more services in your dashboard',
                'Set your availability schedule',
                'Customize your profile theme color',
                'Share your public profile with clients',
              ].map((t) => (
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

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkSlugAvailable } from '../../services/api';
import { analytics, EVENTS } from '../../services/analytics';
import ProgressBar from './ProgressBar';

const SlugClaim = () => {
  const [slug, setSlug] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);
  const requestSeq = useRef(0); // guards against out-of-order responses

  // Vendor opened onboarding — top of the host-acquisition funnel.
  useEffect(() => { analytics.track(EVENTS.SIGNUP_STARTED, {}); }, []);

  const checkSlug = useCallback(async (value) => {
    // Validate slug format before hitting the server.
    const isValid = /^[a-z0-9-]+$/.test(value) && value.length >= 3;
    if (!isValid) {
      setChecking(false);
      setAvailable(false);
      return;
    }

    const seq = ++requestSeq.current;
    setChecking(true);
    try {
      const { data } = await checkSlugAvailable(value);
      if (seq === requestSeq.current) setAvailable(data.available); // ignore stale responses
    } catch (error) {
      if (seq === requestSeq.current) setAvailable(false);
    } finally {
      if (seq === requestSeq.current) setChecking(false);
    }
  }, []);

  // Debounce: update the field immediately (never blocks typing), then check
  // availability 400ms after the user stops typing — one request, not one per key.
  const handleChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(value);
    setAvailable(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value) { setChecking(false); return; }
    setChecking(true);
    debounceRef.current = setTimeout(() => checkSlug(value), 400);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleClaim = () => {
    if (!slug || !available) {
      toast.error('Please choose an available slug');
      return;
    }

    // Save slug to session and navigate to verify
    sessionStorage.setItem('onboarding_slug', slug);
    navigate(`/vendor-register/${slug}/verify`);
  };

  return (
    <>
      <ProgressBar current={0} total={11} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-md p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Claim your URL</h1>
          <p className="text-gray-500 text-sm mb-6">
            Choose your unique Book A Sloth URL. This is where guests will book you.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Your URL</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm text-gray-500 font-medium">
                bookasloth.com/
              </span>
              <input
                type="text"
                className="fb-input pl-[160px] pr-10"
                placeholder="yourslug"
                value={slug}
                onChange={handleChange}
                autoFocus
              />
              {checking && (
                <div className="absolute right-3">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!checking && available !== null && (
                <div className="absolute right-3">
                  {available ? (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            {slug && available === false && (
              <p className="text-red-500 text-sm mt-2">This slug is not available. Try another.</p>
            )}
            {slug && available && (
              <p className="text-green-500 text-sm mt-2">✓ This slug is available!</p>
            )}
          </div>

          <button
            onClick={handleClaim}
            disabled={!available || checking}
            className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Claim & Continue
          </button>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> You can change this later in your profile settings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SlugClaim;

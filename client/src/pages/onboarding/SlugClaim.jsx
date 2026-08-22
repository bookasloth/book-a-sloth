import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { checkOnboardingSlug, claimOnboardingSlug } from '../../services/api';
import { analytics, EVENTS } from '../../services/analytics';
import ProgressBar from './ProgressBar';
import useOnboardingGuard from './useOnboardingGuard';

/**
 * SlugClaim — Step 1 of the Google-first onboarding flow.
 *
 * Route: /vendor-register/:slug/claim
 * Guard: useOnboardingGuard() checks server state and redirects if the host
 *        is on the wrong step or already complete.
 * Pre-fill: the :slug URL param is the auto-username assigned after Google
 *           OAuth, so the host sees a sensible default immediately.
 *
 * HARD RULE: ≤100vh, no page scroll.
 */
const SlugClaim = () => {
  const { slug: urlSlug } = useParams();
  const navigate = useNavigate();
  const ready = useOnboardingGuard();

  const [slug, setSlug] = useState(urlSlug || '');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [unavailableReason, setUnavailableReason] = useState(null); // 'taken'|'reserved'|'invalid'|'blocked'|null
  const [tooShort, setTooShort] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const debounceRef = useRef(null);
  const requestSeq = useRef(0);

  // Track top-of-slug-step entry
  useEffect(() => { analytics.track(EVENTS.SIGNUP_STARTED, {}); }, []);

  // On mount (and if urlSlug changes after a redirect), check availability of
  // the pre-filled slug so the host sees immediate feedback without typing.
  useEffect(() => {
    if (urlSlug) {
      setSlug(urlSlug);
      triggerCheck(urlSlug);
    }
    // triggerCheck is stable (doesn't need the dep); urlSlug is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSlug]);

  const checkSlug = useCallback(async (value) => {
    const len = value.length;
    if (len < 3) {
      setChecking(false);
      setAvailable(false);
      setUnavailableReason(null);
      setTooShort(len > 0 && len < 3);
      return;
    }
    setTooShort(false);

    const isValid = /^[a-z0-9-]+$/.test(value);
    if (!isValid) {
      setChecking(false);
      setAvailable(false);
      setUnavailableReason('invalid');
      return;
    }

    const seq = ++requestSeq.current;
    setChecking(true);
    try {
      const { data } = await checkOnboardingSlug(value);
      if (seq === requestSeq.current) {
        setAvailable(data.available);
        setUnavailableReason(data.available ? null : (data.reason || 'taken'));
      }
    } catch {
      if (seq === requestSeq.current) {
        // A network/500 blip is NOT "taken" — don't block with a wrong reason.
        setAvailable(false);
        setUnavailableReason('error');
      }
    } finally {
      if (seq === requestSeq.current) setChecking(false);
    }
  }, []);

  const triggerCheck = (value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value) { setChecking(false); setAvailable(null); setTooShort(false); return; }
    setChecking(true);
    setAvailable(null);
    debounceRef.current = setTimeout(() => checkSlug(value), 350);
  };

  const handleChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
    setSlug(value);
    triggerCheck(value);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleClaim = async () => {
    if (!slug || !available) {
      toast.error('Please choose an available URL');
      return;
    }
    setClaiming(true);
    try {
      await claimOnboardingSlug(slug);
      navigate(`/vendor-register/${slug}/category`);
    } catch (err) {
      // Server sends { message }, not { error } — read message first (audit P2-10)
      // so the real reason ("Slug already taken") surfaces instead of a generic axios string.
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Could not claim this slug. Try another.';
      toast.error(msg);
      setAvailable(false);
    } finally {
      setClaiming(false);
    }
  };

  // Minimal loading state while guard runs server check
  if (!ready) {
    return (
      <div className="app-container flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canContinue = available && !checking && !claiming;

  return (
    <>
      <ProgressBar current={1} total={4} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-6 sm:py-10">
        <div className="page-card w-full max-w-md p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Claim your URL</h1>
          <p className="text-gray-500 text-sm mb-6">
            This is where guests will book you. You can change it later.
          </p>

          <div className="mb-6">
            <label htmlFor="slug-input" className="block text-sm font-medium mb-2">
              Your URL
            </label>

            {/* Responsive flex row — no hardcoded px padding */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition">
              <span
                className="flex-shrink-0 px-3 py-2.5 bg-gray-50 border-r border-gray-300 text-sm text-gray-500 font-medium select-none whitespace-nowrap"
                aria-hidden="true"
              >
                bookasloth.com/
              </span>
              <div className="relative flex-1 flex items-center">
                <input
                  id="slug-input"
                  type="text"
                  className="w-full px-3 py-2.5 text-sm bg-white focus:outline-none"
                  placeholder="yourslug"
                  value={slug}
                  onChange={handleChange}
                  maxLength={30}
                  autoFocus
                  aria-describedby="slug-hint"
                />
                {/* Availability indicator */}
                <div className="absolute right-2 flex-shrink-0">
                  {checking && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {!checking && available === true && (
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Available">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {!checking && available === false && slug && (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-label="Not available">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Feedback messages — only one shows at a time */}
            <div id="slug-hint" className="mt-2 min-h-[1.25rem]">
              {slug && tooShort && (
                <p className="text-amber-600 text-sm">Minimum 3 characters.</p>
              )}
              {slug && !tooShort && available === false && !checking && unavailableReason === 'reserved' && (
                <p className="text-red-500 text-sm">This URL is reserved and cannot be used.</p>
              )}
              {slug && !tooShort && available === false && !checking && unavailableReason === 'invalid' && (
                <p className="text-red-500 text-sm">Only lowercase letters, numbers, and hyphens are allowed.</p>
              )}
              {slug && !tooShort && available === false && !checking && unavailableReason === 'blocked' && (
                <p className="text-red-500 text-sm">This URL isn&apos;t available. Try another.</p>
              )}
              {slug && !tooShort && available === false && !checking && unavailableReason === 'error' && (
                <p className="text-amber-600 text-sm">Couldn&apos;t check that URL right now. Check your connection and try again.</p>
              )}
              {slug && !tooShort && available === false && !checking && (!unavailableReason || unavailableReason === 'taken') && (
                <p className="text-red-500 text-sm">This URL is taken. Try another.</p>
              )}
              {slug && available === true && (
                <p className="text-green-600 text-sm">This URL is available.</p>
              )}
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={!canContinue}
            className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {claiming ? 'Claiming…' : 'Continue'}
          </button>

          <button
            onClick={() => navigate('/vendor-register')}
            className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 py-1.5 transition"
          >
            ← Back
          </button>
        </div>
      </div>
    </>
  );
};

export default SlugClaim;

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PartyPopper, ArrowRight, Copy, Loader2, Rocket } from 'lucide-react';
import {
  markOnboardingComplete,
  svcCreate,
  hostGetCategories,
  listServiceCategories,
} from '../../services/api';
import { analytics } from '../../services/analytics';
import { EVENTS } from '../../services/analytics/events';
import { useAuth } from '../../context/AuthContext';
import { fireCelebration } from '../../utils/celebration';
import useOnboardingGuard from './useOnboardingGuard';
import OnboardingStepper from './OnboardingStepper';

// First-service durations — the common set; host refines everything else in the
// dashboard. Kept tiny on purpose: this screen exists to get ONE bookable
// service live, not to be the full ServiceForm.
const DURATIONS = [15, 30, 45, 60];

const ExploreWithBolt = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const ready = useOnboardingGuard();
  const { user } = useAuth() || {};
  const firedRef = useRef(false);

  // Interim fee-only mode: paid listings are disabled (mirrors ServiceForm).
  // Fail-safe true — server forces ₹0 regardless.
  const feeOnly = user?.fee_only_mode ?? true;

  // First-service mini-form state.
  const [title, setTitle]         = useState('');
  const [price, setPrice]         = useState('');
  const [duration, setDuration]   = useState(30);
  const [svcCats, setSvcCats]     = useState([]);   // [{ slug, name }]
  const [category, setCategory]   = useState('');
  const [publishing, setPublishing] = useState(false);
  const [skipping, setSkipping]   = useState(false);

  // Fire celebration + complete onboarding once on mount. Completing HERE (not
  // only on a button) means closing the tab still flips onboarding_completed —
  // markComplete is idempotent, so publishing/skip re-calling it is harmless.
  useEffect(() => {
    if (ready && !firedRef.current) {
      firedRef.current = true;
      fireCelebration();
      markOnboardingComplete().catch((error) => {
        const msg = error.response?.data?.message || '';
        if (/categor/i.test(msg)) navigate(`/vendor-register/${slug}/category`);
      });
    }
  }, [ready]);

  // Load the host's profession service-categories (same source as ServiceForm).
  // Empty list → profession has no sub-categories; the dropdown hides and the
  // service is created without one (server treats category as optional then).
  useEffect(() => {
    let alive = true;
    hostGetCategories()
      .then((h) => listServiceCategories(h.data?.primary_category || undefined).catch(() => ({ data: { categories: [] } })))
      .then((sc) => {
        if (!alive) return;
        const list = sc.data?.categories || [];
        setSvcCats(list);
        setCategory((c) => c || list[0]?.slug || '');
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const publicUrl = `${window.location.origin}/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Link copied — share it anywhere.');
    } catch {
      toast.error('Could not copy — long-press the URL to copy manually.');
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) { toast.error('Give your service a title.'); return; }
    if (svcCats.length && !category) { toast.error('Pick a category for your service.'); return; }
    setPublishing(true);
    try {
      // First service defaults to ONLINE so the host never hits the in-person
      // venue map-link requirement mid-onboarding. They can switch it to
      // in-person (and add the venue) later from the dashboard.
      await svcCreate({
        title:             title.trim(),
        short_description: title.trim(), // seed; host can refine in the dashboard
        description:       title.trim(),
        service_type:      'online',
        meeting_mode:      'online',
        price:             feeOnly ? 0 : (parseFloat(price) || 0),
        duration,
        category:          category || null,
      });
      // Activation funnel: pairs with the server's service_published. Firing the
      // client counterpart with source:onboarding makes the
      // onboarding_completed → first-service drop-off directly measurable.
      analytics.track(EVENTS.SERVICE_PUBLISHED, { source: 'onboarding' });
      await markOnboardingComplete();
      toast.success('Service published — your page can take bookings now.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not publish — try again.');
      setPublishing(false);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      await markOnboardingComplete();
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to complete';
      toast.error(msg);
      if (/categor/i.test(msg)) navigate(`/vendor-register/${slug}/category`);
      setSkipping(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OnboardingStepper current={4} />
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const busy = publishing || skipping;

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingStepper current={4} />

      <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-14">
        {/* Celebration header */}
        <div className="text-center">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light ring-8 ring-primary-light/40">
            <PartyPopper className="h-8 w-8 text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            You&apos;re <span className="text-primary">live!</span>
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
            One last thing — add your first service so guests can actually book you.
          </p>
        </div>

        {/* First-service mini-form — the money moment */}
        <div className="mt-6 rounded-2xl border-2 border-primary/20 bg-primary-light/30 p-5 text-left sm:p-6">
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-semibold text-gray-800">
              Service title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="e.g. 1:1 Strategy Call"
              className="fb-input w-full"
              maxLength={60}
              autoFocus
            />
          </div>

          {svcCats.length > 0 && (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold text-gray-800">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="fb-input w-full"
              >
                {svcCats.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-800">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="fb-input w-full"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} min</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-800">Price</label>
              {feeOnly ? (
                <div className="fb-input flex w-full items-center text-sm text-gray-500">Free</div>
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1999"
                    className="fb-input w-full pl-7"
                  />
                </div>
              )}
            </div>
          </div>
          {feeOnly && (
            <p className="mt-2.5 text-xs text-gray-500">
              Guests pay only Book A Sloth&rsquo;s booking fee — you can add paid pricing later.
            </p>
          )}

          <button
            onClick={handlePublish}
            disabled={busy}
            className="btn-primary mt-5 w-full gap-2 py-3 disabled:opacity-50"
          >
            {publishing ? (
              <><Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} /> Publishing…</>
            ) : (
              <><Rocket className="h-5 w-5" strokeWidth={2} /> Publish service &amp; finish</>
            )}
          </button>
        </div>

        {/* Shareable URL card */}
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3">
          <span className="min-w-0 flex-1 truncate text-left font-mono text-sm text-gray-600">{publicUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2.5} /> Copy
          </button>
        </div>

        {/* Escape hatch — never trap the host */}
        <button
          onClick={handleSkip}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-1 text-sm text-gray-500 transition hover:text-gray-800 disabled:opacity-50"
        >
          {skipping ? 'Finishing…' : 'Skip for now — I’ll add a service later'}
          {!skipping && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
};

export default ExploreWithBolt;

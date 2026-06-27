import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { getPublicPlans, activateFreePlan, advanceToLive, createSubscription, syncSubscription, getMe } from '../../services/api';
import { planLabel } from '../../utils/themeUtils';
import useOnboardingGuard from './useOnboardingGuard';
import ProgressBar from './ProgressBar';
import loadRazorpay from '../../utils/loadRazorpay';

const GST_RATE = 0.18; // display only — server is authoritative
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Concise feature list straight from the DB plan record (mirrors UpgradePlan).
const featureLines = (plan) => {
  const L = plan.limits || {};
  const lim = (v, label) => (v === -1 ? `Unlimited ${label}` : `${v ?? 0} ${label}`);
  const lines = [
    lim(L.services, 'services'),
    L.bookings_per_year === -1 ? 'Unlimited bookings' : `${(L.bookings_per_year ?? 0).toLocaleString('en-IN')} bookings / year`,
    Number(plan.commission_percentage) > 0 ? `${Number(plan.commission_percentage)}% commission` : '0% commission',
  ];
  if (plan.features?.advanced_reports) lines.push('Advanced analytics');
  if (plan.support_type) lines.push(`${plan.support_type.replace(/_/g, ' ')} support`);
  return lines;
};

const PlansStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const ready = useOnboardingGuard();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cadence, setCadence] = useState('annual'); // 'monthly' | 'annual'
  const [busy, setBusy] = useState(null);            // plan slug | 'free' | null
  const [me, setMe] = useState(null);               // fresh profile for Razorpay prefill

  useEffect(() => {
    getPublicPlans()
      .then((r) => setPlans(r.data || []))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
    // Fetch fresh profile so the Razorpay prefill has name/email even after Google signup.
    getMe()
      .then((r) => setMe(r.data))
      .catch(() => { /* non-fatal — prefill will be empty */ });
  }, []);

  const priceFor = (plan, c) => (c === 'monthly' ? Number(plan.monthly_price) || 0 : Number(plan.annual_price) || 0);
  const isPaid = (plan) => priceFor(plan, 'monthly') > 0 || priceFor(plan, 'annual') > 0;

  const goNext = () => navigate(`/vendor-register/${slug}/live`);

  // Free plan: activate immediately via the new onboarding endpoint, then navigate to /live.
  const chooseFree = async () => {
    setBusy('free');
    try {
      await activateFreePlan();
      toast.success('Starter plan activated');
      goNext();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to activate plan');
      setBusy(null);
    }
  };

  // Paid plan: open an auto-renewing Razorpay subscription (monthly or annual).
  const choosePaid = async (plan) => {
    const price = priceFor(plan, cadence);
    if (!(price > 0)) { toast.error(`No ${cadence} price for this plan.`); return; }
    const loaded = await loadRazorpay();
    if (!loaded) return toast.error('Payment gateway failed to load');

    setBusy(plan.slug);
    try {
      const { data: sub } = await createSubscription({ plan: plan.slug, cadence });

      // Use fresh profile for prefill (me fetched on mount); fall back to localStorage.
      const prefillData = me
        ? { name: me.name, email: me.email, contact: me.phone }
        : (() => {
            try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return { name: u.name, email: u.email }; }
            catch { return {}; }
          })();

      // A plan counts as active ONLY when getMe SUCCEEDS and returns a non-free
      // slug. Returns true once activated+advanced+navigated, false otherwise.
      // Never advances or navigates on a getMe error or a still-free/unset plan —
      // that was the bug: a transient getMe failure used to show a false
      // "activated!" toast and navigate optimistically before the plan was live.
      const FREE_SLUGS = ['explorer', 'starter', '', null, undefined];
      const tryFinalize = async () => {
        try { await syncSubscription(); } catch { /* webhook will finalize shortly */ }
        let freshMe;
        try {
          ({ data: freshMe } = await getMe());
        } catch {
          return false; // getMe failed → cannot confirm → do NOT advance/navigate
        }
        if (FREE_SLUGS.includes(freshMe?.plan)) return false; // webhook lag — still free/unset
        // Confirmed active: advance the onboarding step FIRST, then toast, then
        // navigate (awaiting advance before the toast also fixes a toast-ordering nit).
        await advanceToLive();
        toast.success(`${planLabel(plan.slug, plan.name)} active — renews ${cadence}.`);
        goNext();
        return true;
      };

      const options = {
        key: sub.key,
        subscription_id: sub.subscription_id,
        name: 'Book A Sloth',
        description: `${planLabel(plan.slug, plan.name)} — ${cadence} (auto-renews)`,
        handler: async () => {
          // First attempt right after payment.
          if (await tryFinalize()) return;
          // ONE short auto-retry to smooth the common brief webhook lag. The delay
          // is skipped under test so the timer never hangs the suite.
          if (import.meta.env?.MODE !== 'test') {
            await new Promise((r) => setTimeout(r, 2000));
          }
          if (await tryFinalize()) return;
          // Still not active: payment is captured but the plan isn't live yet. Do
          // NOT advance or navigate. The createVendorSubscription idempotency guard
          // makes the re-click safe — it re-syncs the existing mandate instead of
          // double-charging, and once active the re-click advances to /live.
          toast.success('Payment received — finalizing your plan. Tap the plan again in a moment to continue.');
          setBusy(null);
        },
        modal: {
          ondismiss: () => {
            setBusy(null);
            toast('Checkout closed — you can pick a plan when you\'re ready.');
          },
        },
        prefill: prefillData,
        theme: { color: '#FE5100' },
      };
      new window.Razorpay(options).open();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start subscription');
      setBusy(null);
    }
  };

  if (!ready) {
    return (
      <>
        <ProgressBar current={5} total={6} />
        <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <ProgressBar current={5} total={6} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-4xl p-5 sm:p-8">
          <button
            onClick={() => navigate(`/vendor-register/${slug}/whatsapp`)}
            className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Choose your plan</h1>
          <p className="text-gray-500 text-sm mb-6">
            Paid plans auto-renew. Cancel anytime — you keep access until the period ends.
          </p>

          {/* Cadence toggle */}
          <div className="flex items-center justify-center gap-2 mb-7">
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              {['monthly', 'annual'].map((c) => (
                <button key={c} type="button" onClick={() => setCadence(c)}
                  className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-colors ${cadence === c ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                  {c === 'monthly' ? 'Monthly' : 'Annual'}
                  {c === 'annual' && <span className="ml-1.5 text-[10px] text-emerald-600 font-bold">save more</span>}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-sm text-gray-400 py-10">Loading plans…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const paid = isPaid(plan);
                const price = priceFor(plan, cadence);
                const cadenceAvailable = price > 0;
                const popular = plan.slug === 'creator';
                const isBusy = busy === plan.slug || (!paid && busy === 'free');
                return (
                  <div key={plan.slug} className={`relative p-6 rounded-lg border-2 flex flex-col ${popular ? 'border-primary' : 'border-gray-200'}`}>
                    {popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                      </div>
                    )}

                    <h3 className="text-lg font-bold mb-2">{planLabel(plan.slug, plan.name)}</h3>
                    {!paid ? (
                      <p className="text-2xl font-bold text-primary mb-1">Free</p>
                    ) : cadenceAvailable ? (
                      <>
                        <p className="text-2xl font-bold text-primary mb-0.5">
                          {inr(price)}<span className="text-sm font-normal text-gray-500">/{cadence === 'monthly' ? 'mo' : 'yr'}</span>
                        </p>
                        <p className="text-[11px] text-gray-500 mb-1">+ 18% GST · {inr(Math.round(price * (1 + GST_RATE)))} billed</p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-gray-400 py-2 mb-1">Annual billing only</p>
                    )}

                    <ul className="space-y-2 mt-4 flex-1">
                      {featureLines(plan).map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={3} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button type="button"
                      onClick={() => (paid ? choosePaid(plan) : chooseFree())}
                      disabled={busy !== null || (paid && !cadenceAvailable)}
                      className="btn w-full mt-6 bg-primary text-white py-2.5 text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition">
                      {isBusy ? 'Processing…'
                        : !paid ? 'Get started'
                        : !cadenceAvailable ? 'Annual only'
                        : `Choose ${planLabel(plan.slug, plan.name)}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlansStep;

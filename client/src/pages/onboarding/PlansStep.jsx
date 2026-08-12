import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, ChevronDown, Rocket, Loader2 } from 'lucide-react';
import { getPublicPlans, activateFreePlan, advanceToLive, createSubscription, syncSubscription, getMe } from '../../services/api';
import { planLabel } from '../../utils/themeUtils';
import { fireCelebration } from '../../utils/celebration';
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

const priceFor = (plan, c) => (c === 'monthly' ? Number(plan.monthly_price) || 0 : Number(plan.annual_price) || 0);
const isPaidPlan = (plan) => priceFor(plan, 'monthly') > 0 || priceFor(plan, 'annual') > 0;

const PlansStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const ready = useOnboardingGuard();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cadence, setCadence] = useState('annual');
  const [busy, setBusy] = useState(null);            // plan slug | 'free' | null
  const [me, setMe] = useState(null);
  const [showPaid, setShowPaid] = useState(false);   // drawer for paid plans
  // Cache created subscriptions per plan+cadence. On a retry (webhook lag),
  // reuse the existing subscription instead of minting a second one.
  const subCacheRef = useRef({});

  useEffect(() => {
    getPublicPlans()
      .then((r) => setPlans(r.data || []))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
    getMe()
      .then((r) => setMe(r.data))
      .catch(() => {});
  }, []);

  const freePlan = plans.find((p) => !isPaidPlan(p)) || null;
  const paidPlans = plans.filter(isPaidPlan);

  const goNext = () => navigate(`/vendor-register/${slug}/live`);

  // Free plan: activate, fire celebration, navigate. The /live screen fires
  // a second, larger burst on mount — this one is the "your click did
  // something" acknowledgement so the transition doesn't feel silent.
  const chooseFree = async () => {
    setBusy('free');
    try {
      await activateFreePlan();
      fireCelebration();
      toast.success('You\'re live!');
      goNext();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to activate plan');
      setBusy(null);
    }
  };

  // Paid plan: Razorpay flow. Logic intact from the previous version — only
  // the UI wrapper around it changed. See the header of this handler for the
  // (deliberately unchanged) confirmation dance around webhook lag.
  const choosePaid = async (plan) => {
    const price = priceFor(plan, cadence);
    if (!(price > 0)) { toast.error(`No ${cadence} price for this plan.`); return; }
    const loaded = await loadRazorpay();
    if (!loaded) return toast.error('Payment gateway failed to load');

    setBusy(plan.slug);
    try {
      // Reuse an already-created subscription for this plan+cadence if the host
      // is retrying after a webhook-lag "tap again" — prevents double subscriptions.
      const cacheKey = `${plan.slug}:${cadence}`;
      let sub = subCacheRef.current[cacheKey];
      if (!sub) {
        ({ data: sub } = await createSubscription({ plan: plan.slug, cadence }));
        subCacheRef.current[cacheKey] = sub;
      }
      const prefillData = me
        ? { name: me.name, email: me.email, contact: me.phone }
        : (() => {
            try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return { name: u.name, email: u.email }; }
            catch { return {}; }
          })();

      const FREE_SLUGS = ['explorer', 'starter', '', null, undefined];
      const tryFinalize = async () => {
        try { await syncSubscription(); } catch { /* webhook will finalize */ }
        let freshMe;
        try { ({ data: freshMe } = await getMe()); } catch { return false; }
        if (FREE_SLUGS.includes(freshMe?.plan)) return false;
        await advanceToLive();
        fireCelebration();
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
          if (await tryFinalize()) return;
          if (import.meta.env?.MODE !== 'test') {
            await new Promise((r) => setTimeout(r, 2000));
          }
          if (await tryFinalize()) return;
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
        <ProgressBar current={4} total={4} />
        <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  const freeLines = freePlan ? featureLines(freePlan) : [];

  return (
    <>
      <ProgressBar current={4} total={4} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-start sm:items-center justify-center py-8 sm:py-12">
        <div className="w-full max-w-2xl px-4">
          <button
            onClick={() => navigate(`/vendor-register/${slug}/preview`)}
            className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block"
          >
            ← Back
          </button>

          {/* Hero — publish moment */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Rocket className="h-7 w-7 text-primary" strokeWidth={2} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">You're one click from live</h1>
            <p className="text-gray-500 text-sm">
              Publish on Starter for free. Upgrade whenever you're ready.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-sm text-gray-400 py-10">Loading plans…</p>
          ) : (
            <>
              {/* Primary CTA card — Starter */}
              <div className="relative rounded-2xl border-2 border-primary bg-primary-light/60 p-6 sm:p-7 shadow-sm">
                <div className="absolute -top-3 left-6">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">Recommended</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      {freePlan ? planLabel(freePlan.slug, freePlan.name) : 'Starter'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">Free forever · no credit card</p>
                  </div>
                  <button
                    type="button"
                    onClick={chooseFree}
                    disabled={busy !== null}
                    className="btn bg-primary text-white py-3 px-6 text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {busy === 'free' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                        Publishing…
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" strokeWidth={2.5} />
                        Publish free
                      </>
                    )}
                  </button>
                </div>

                {freeLines.length > 0 && (
                  <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {freeLines.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={3} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Paid drawer trigger */}
              {paidPlans.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setShowPaid((v) => !v)}
                    aria-expanded={showPaid}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary transition"
                  >
                    {showPaid ? 'Hide paid plans' : 'See Host+ and Studio plans'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showPaid ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {/* Paid plans drawer */}
              {showPaid && paidPlans.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-center gap-2 mb-5">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paidPlans.map((plan) => {
                      const price = priceFor(plan, cadence);
                      const cadenceAvailable = price > 0;
                      const isBusy = busy === plan.slug;
                      return (
                        <div key={plan.slug} className="p-5 rounded-xl border border-gray-200 flex flex-col bg-white">
                          <h3 className="text-base font-bold mb-1.5">{planLabel(plan.slug, plan.name)}</h3>
                          {cadenceAvailable ? (
                            <>
                              <p className="text-xl font-bold text-primary mb-0.5">
                                {inr(price)}<span className="text-sm font-normal text-gray-500">/{cadence === 'monthly' ? 'mo' : 'yr'}</span>
                              </p>
                              <p className="text-[11px] text-gray-500 mb-1">+ 18% GST · {inr(Math.round(price * (1 + GST_RATE)))} billed</p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold text-gray-400 py-2 mb-1">Annual billing only</p>
                          )}

                          <ul className="space-y-1.5 mt-3 flex-1">
                            {featureLines(plan).slice(0, 5).map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" strokeWidth={3} />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>

                          <button type="button"
                            onClick={() => choosePaid(plan)}
                            disabled={busy !== null || !cadenceAvailable}
                            className="btn w-full mt-4 border border-primary text-primary py-2 text-sm font-semibold hover:bg-primary hover:text-white disabled:opacity-50 transition">
                            {isBusy ? 'Processing…'
                              : !cadenceAvailable ? 'Annual only'
                              : `Choose ${planLabel(plan.slug, plan.name)}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-center text-xs text-gray-400">
                    Paid plans auto-renew. Cancel anytime — you keep access until the period ends.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PlansStep;

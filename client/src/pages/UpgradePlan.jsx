import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getPublicPlans, createSubscription, syncSubscription, cancelSubscription } from "../services/api";
import toast from "react-hot-toast";
import BackButton from "../components/common/BackButton";

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const GST_RATE = 0.18; // display only — server is authoritative
const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// `explorer` is the legacy alias for the free tier (real slug: `starter`).
const LEGACY_PLAN_ALIASES = { explorer: "starter" };

// Build a concise, accurate feature list straight from the DB plan record.
const featureLines = (plan) => {
  const L = plan.limits || {};
  const lim = (v, label) => (v === -1 ? `Unlimited ${label}` : `${v ?? 0} ${label}`);
  const lines = [
    lim(L.services, "services"),
    L.bookings_per_year === -1 ? "Unlimited bookings" : `${(L.bookings_per_year ?? 0).toLocaleString("en-IN")} bookings / year`,
    lim(L.digital_products, "digital products"),
    Number(plan.commission_percentage) > 0 ? `${Number(plan.commission_percentage)}% commission` : "0% commission",
  ];
  const cals = plan.integrations?.calendar_apps || [];
  if (cals.length) lines.push(`Calendars: ${cals.map((c) => c.replace(/_/g, " ")).join(", ")}`);
  if (plan.features?.advanced_reports) lines.push("Advanced analytics");
  if (plan.support_type) lines.push(`${plan.support_type.replace(/_/g, " ")} support`);
  return lines;
};

const Check = () => (
  <svg className="w-4 h-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const UpgradePlan = () => {
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cadence, setCadence] = useState("annual"); // 'monthly' | 'annual'
  const [paying, setPaying] = useState(null);        // plan slug
  const [cancelling, setCancelling] = useState(false);

  const rawPlan = (user?.plan || "starter").toLowerCase();
  const currentPlan = LEGACY_PLAN_ALIASES[rawPlan] || rawPlan;
  // Current tier rank, used to tell upgrades from downgrades. Falls back to 0
  // when the current plan isn't in the public list (e.g. an archived/admin tier)
  // — every paid plan then reads as a higher tier, never a bogus "downgrade".
  const myOrder = plans.find((p) => p.slug === currentPlan)?.sort_order ?? 0;

  useEffect(() => {
    getPublicPlans()
      .then((r) => setPlans(r.data || []))
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoading(false));
  }, []);

  const priceFor = (plan, c) => (c === "monthly" ? Number(plan.monthly_price) || 0 : Number(plan.annual_price) || 0);
  const isPaid = (plan) => priceFor(plan, "monthly") > 0 || priceFor(plan, "annual") > 0;

  const handleUpgrade = useCallback(async (plan) => {
    const price = priceFor(plan, cadence);
    if (!(price > 0)) {
      toast.error(`No ${cadence} price for this plan.`);
      return;
    }
    const loaded = await loadRazorpay();
    if (!loaded) return toast.error("Payment gateway failed to load");

    setPaying(plan.slug);
    try {
      const { data: sub } = await createSubscription({ plan: plan.slug, cadence });
      if (sub.free_days > 0) {
        toast.success(`${sub.free_days} free day${sub.free_days === 1 ? "" : "s"} credited from your current plan${sub.forfeited > 0 ? ` (${inr(sub.forfeited)} excess forfeited)` : ""}.`, { duration: 6000 });
      }
      const options = {
        key: sub.key,
        subscription_id: sub.subscription_id,
        name: "Book A Sloth",
        description: `${plan.name} — ${cadence} (auto-renews)`,
        handler: async () => {
          try {
            const { data } = await syncSubscription();
            if (data?.profile) {
              updateUser({
                plan: data.profile.plan,
                plan_expires_at: data.profile.plan_expires_at,
                billing_cadence: data.profile.billing_cadence,
                subscription_status: data.profile.subscription_status,
              });
            }
            toast.success(`🎉 ${plan.name} active — renews ${cadence}.`);
          } catch {
            toast.success("Mandate set up. Activation may take a moment — refresh shortly.");
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#4f46e5" },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start subscription");
    } finally {
      setPaying(null);
    }
  }, [cadence, user, updateUser]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel auto-renew? You keep access until the end of the current period.")) return;
    setCancelling(true);
    try {
      const { data } = await cancelSubscription();
      updateUser({ subscription_status: "cancelled" });
      toast.success(data.message || "Subscription cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancel failed");
    } finally {
      setCancelling(false);
    }
  };

  const expiry = user?.plan_expires_at ? new Date(user.plan_expires_at) : null;
  const daysLeft = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : 0;
  const status = user?.subscription_status;
  // Only show the manage panel for a REAL auto-renew mandate. Legacy one-time
  // annual vendors are 'active' but have no mandate — they re-subscribe via the
  // plan cards below (which migrates them onto auto-renew rails).
  const hasActiveSub = user?.has_payment_mandate && (status === "active" || status === "cancelled") && currentPlan !== "starter";

  return (
    <div className="w-full max-w-5xl">
      <BackButton />
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Upgrade Your Plan</h1>
        <p className="text-sm text-gray-400">
          You're on the <span className="font-semibold capitalize text-gray-700">{currentPlan}</span> plan
          {expiry && daysLeft > 0 && ` · renews in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
          {expiry && daysLeft <= 0 && <span className="text-red-500"> · expired</span>}
          {user?.billing_cadence && ` · ${user.billing_cadence}`}
        </p>
      </div>

      {/* Manage current subscription */}
      {hasActiveSub && (
        <div className="mb-6 fb-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            {status === "cancelled" ? (
              <>Auto-renew is <strong className="text-amber-600">off</strong>. Access ends {expiry ? expiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "at period end"}.</>
            ) : (
              <>Auto-renew is <strong className="text-emerald-600">on</strong> ({user?.billing_cadence}). Next charge {expiry ? expiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}.</>
            )}
          </div>
          {status === "active" && (
            <button onClick={handleCancel} disabled={cancelling}
              className="btn btn--outline text-sm font-semibold text-red-600 hover:bg-red-50 px-4 py-2 disabled:opacity-50">
              {cancelling ? "Cancelling…" : "Cancel auto-renew"}
            </button>
          )}
        </div>
      )}

      {/* Cadence toggle */}
      <div className="flex items-center justify-center gap-2 mb-7">
        <div className="inline-flex bg-gray-100 rounded-full p-1">
          {["monthly", "annual"].map((c) => (
            <button key={c} onClick={() => setCadence(c)}
              className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-colors ${cadence === c ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
              {c === "monthly" ? "Monthly" : "Annual"}
              {c === "annual" && <span className="ml-1.5 text-[10px] text-emerald-600 font-bold">save more</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-400 py-10">Loading plans…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isCurrentTier = currentPlan === plan.slug;
            // "Current Plan" only when tier AND cadence match — otherwise the
            // vendor can switch cadence on their current tier.
            const isCurrentExact = isCurrentTier && (!user?.billing_cadence || user.billing_cadence === cadence);
            const paid = isPaid(plan);
            const price = priceFor(plan, cadence);
            const cadenceAvailable = price > 0;
            const annualEquivOfMonthly = (Number(plan.monthly_price) || 0) * 12;
            const savings = annualEquivOfMonthly > 0 && Number(plan.annual_price) > 0
              ? annualEquivOfMonthly - Number(plan.annual_price) : 0;

            return (
              <div key={plan.slug} className={`rounded-2xl border-2 p-6 flex flex-col relative bg-white ${isCurrentTier ? "border-primary ring-2 ring-primary/20" : "border-gray-200"}`}>
                <div className="mb-4">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-primary/10 text-primary">{plan.name}</span>
                  <div className="mt-3">
                    {!paid ? (
                      <p className="text-3xl font-bold">Free</p>
                    ) : cadenceAvailable ? (
                      <>
                        <p className="text-3xl font-bold">
                          {inr(price)}
                          <span className="text-sm font-normal ml-1 text-gray-400">/ {cadence === "monthly" ? "month" : "year"}</span>
                        </p>
                        <p className="text-[11px] mt-1 text-gray-500">
                          + 18% GST · {inr(Math.round(price * (1 + GST_RATE)))} billed
                        </p>
                        {cadence === "annual" && savings > 0 && (
                          <p className="text-[11px] mt-0.5 text-emerald-600 font-semibold">Save {inr(savings)}/yr vs monthly</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-gray-400 py-2">Annual billing only</p>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {featureLines(plan).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check /> {f}</li>
                  ))}
                </ul>

                {isCurrentExact ? (
                  <div className="text-center py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-500">Current Plan</div>
                ) : !paid ? (
                  <div className="text-center py-2.5 rounded-xl text-sm text-gray-400 border border-gray-200">Default (free)</div>
                ) : (
                  <button onClick={() => handleUpgrade(plan)} disabled={paying === plan.slug || !cadenceAvailable}
                    className="btn py-2.5 text-sm font-semibold bg-primary text-white hover:bg-primary-dark disabled:opacity-50">
                    {paying === plan.slug ? "Opening payment…"
                      : !cadenceAvailable ? "Annual billing only"
                      : isCurrentTier ? `Switch to ${cadence}`
                      : (plan.sort_order ?? 0) < myOrder ? `Downgrade to ${plan.name}`
                      : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 fb-card p-4 text-sm text-gray-500 text-center">
        Plans auto-renew {cadence}. Cancel anytime — you keep access until the period ends. GST charged on top. · Powered by Razorpay.
      </div>
    </div>
  );
};

export default UpgradePlan;

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getPublicPlans, createSubscription, syncSubscription, cancelSubscription } from "../services/api";
import toast from "react-hot-toast";
import BackButton from "../components/common/BackButton";
import { PageHeader, Card, Button, cn } from "../components/dashboard/ui";
import { planLabel } from "../utils/themeUtils";
import loadRazorpay from "../utils/loadRazorpay";

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
  <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        description: `${planLabel(plan.slug, plan.name)} — ${cadence} (auto-renews)`,
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
            toast.success(`🎉 ${planLabel(plan.slug, plan.name)} active — renews ${cadence}.`);
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
    <div className="mx-auto max-w-5xl">
      <BackButton />
      <PageHeader
        title="Upgrade Your Plan"
        subtitle={
          <>
            You're on the <span className="font-semibold text-gray-700">{planLabel(currentPlan, currentPlan)}</span> plan
            {expiry && daysLeft > 0 && ` · renews in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
            {expiry && daysLeft <= 0 && <span className="text-red-500"> · expired</span>}
            {user?.billing_cadence && ` · ${user.billing_cadence}`}
          </>
        }
      />

      {/* Manage current subscription */}
      {hasActiveSub && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            {status === "cancelled" ? (
              <>Auto-renew is <strong className="text-amber-600">off</strong>. Access ends {expiry ? expiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "at period end"}.</>
            ) : (
              <>Auto-renew is <strong className="text-emerald-600">on</strong> ({user?.billing_cadence}). Next charge {expiry ? expiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}.</>
            )}
          </div>
          {status === "active" && (
            <Button variant="danger-outline" size="sm" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel auto-renew"}
            </Button>
          )}
        </Card>
      )}

      {/* Cadence toggle */}
      <div className="mb-7 flex items-center justify-center gap-2">
        <div className="inline-flex rounded-full bg-gray-100 p-1">
          {["monthly", "annual"].map((c) => (
            <button key={c} onClick={() => setCadence(c)}
              className={cn("rounded-full px-5 py-1.5 text-sm font-semibold transition-colors", cadence === c ? "bg-white text-gray-900 shadow" : "text-gray-500")}>
              {c === "monthly" ? "Monthly" : "Annual"}
              {c === "annual" && <span className="ml-1.5 text-[10px] font-bold text-emerald-600">save more</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading plans…</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
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
              <div key={plan.slug} className={cn("relative flex flex-col rounded-2xl border-2 bg-white p-6 dash-elev-1", isCurrentTier ? "border-primary ring-2 ring-primary/20" : "border-gray-200")}>
                <div className="mb-4">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{planLabel(plan.slug, plan.name)}</span>
                  <div className="mt-3">
                    {!paid ? (
                      <p className="text-3xl font-bold">Free</p>
                    ) : cadenceAvailable ? (
                      <>
                        <p className="text-3xl font-bold">
                          {inr(price)}
                          <span className="ml-1 text-sm font-normal text-gray-400">/ {cadence === "monthly" ? "month" : "year"}</span>
                        </p>
                        <p className="mt-1 text-[11px] text-gray-500">+ 18% GST · {inr(Math.round(price * (1 + GST_RATE)))} billed</p>
                        {cadence === "annual" && savings > 0 && (
                          <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">Save {inr(savings)}/yr vs monthly</p>
                        )}
                      </>
                    ) : (
                      <p className="py-2 text-sm font-semibold text-gray-400">Annual billing only</p>
                    )}
                  </div>
                </div>

                <ul className="mb-6 flex-1 space-y-2">
                  {featureLines(plan).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check /> {f}</li>
                  ))}
                </ul>

                {isCurrentExact ? (
                  <div className="rounded-xl bg-gray-100 py-2.5 text-center text-sm font-medium text-gray-500">Current Plan</div>
                ) : !paid ? (
                  <div className="rounded-xl border border-gray-200 py-2.5 text-center text-sm text-gray-400">Default plan</div>
                ) : (
                  <Button full onClick={() => handleUpgrade(plan)} disabled={paying === plan.slug || !cadenceAvailable}>
                    {paying === plan.slug ? "Opening payment…"
                      : !cadenceAvailable ? "Annual billing only"
                      : isCurrentTier ? `Switch to ${cadence}`
                      : (plan.sort_order ?? 0) < myOrder ? `Downgrade to ${planLabel(plan.slug, plan.name)}`
                      : `Upgrade to ${planLabel(plan.slug, plan.name)}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Card className="mt-8 text-center text-sm text-gray-500">
        Plans auto-renew {cadence}. Cancel anytime — you keep access until the period ends. GST charged on top. · Powered by Razorpay.
      </Card>
    </div>
  );
};

export default UpgradePlan;

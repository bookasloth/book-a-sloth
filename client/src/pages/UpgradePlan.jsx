import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { subscribePlan, verifySubscription } from "../services/api";
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

const PLAN_FEATURES = {
  explorer: {
    name: "Explorer",
    price: 0,
    period: "Free forever",
    color: "border-gray-200 bg-white",
    badge: "bg-gray-100 text-gray-600",
    features: [
      "3 active services",
      "20 bookings / month",
      "Google Meet auto-link",
      "Public profile page",
      "Basic analytics",
    ],
    locked: [
      "Digital products",
      "Zoom integration",
      "Advanced analytics",
      "Priority support",
    ],
  },
  creator: {
    name: "Creator",
    price: 999,
    period: "/ month",
    color: "border-primary ring-2 ring-primary/20 bg-white",
    badge: "bg-primary/10 text-primary",
    features: [
      "15 active services",
      "Unlimited bookings",
      "5 digital products",
      "Google Meet & Zoom",
      "Standard analytics",
      "Email support",
    ],
    locked: ["Custom profile domain", "Priority support", "Unlimited products"],
  },
  professional: {
    name: "Professional",
    price: 3650,
    period: "/ month",
    color: "border-gray-800 bg-gray-900 text-white",
    badge: "bg-amber-400/20 text-amber-400",
    features: [
      "Unlimited services",
      "Unlimited bookings",
      "Unlimited digital products",
      "All meeting integrations",
      "Advanced analytics",
      "Priority support",
      "Custom profile domain",
    ],
    locked: [],
  },
};

const Check = ({ white }) => (
  <svg
    className={`w-4 h-4 flex-shrink-0 ${white ? "text-green-400" : "text-green-500"}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      d="M5 13l4 4L19 7"
    />
  </svg>
);
const Lock = () => (
  <svg
    className="w-4 h-4 flex-shrink-0 text-gray-300"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const UpgradePlan = () => {
  const { user, updateUser } = useAuth();
  const [paying, setPaying] = useState(null); // 'creator' | 'professional'

  const currentPlan = user?.plan || "explorer";

  const handleUpgrade = async (targetPlan) => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error("Payment gateway failed to load");
      return;
    }

    setPaying(targetPlan);
    try {
      const { data: order } = await subscribePlan({ plan: targetPlan });
      const planInfo = PLAN_FEATURES[targetPlan];

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Book A Sloth",
        description: `${planInfo.name} Plan — 30 days`,
        order_id: order.razorpay_order_id,
        handler: async (response) => {
          try {
            const { data } = await verifySubscription({
              plan: targetPlan,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            updateUser({
              plan: targetPlan,
              plan_expires_at: data.profile.plan_expires_at,
            });
            toast.success(`🎉 Welcome to the ${planInfo.name} plan!`);
          } catch {
            toast.error("Plan activation failed. Contact support.");
          }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#4f46e5" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPaying(null);
    }
  };

  const planExpiry = user?.plan_expires_at
    ? new Date(user.plan_expires_at)
    : null;
  const daysLeft = planExpiry
    ? Math.ceil((planExpiry - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="w-full max-w-5xl">
      <BackButton />
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
          Upgrade Your Plan
        </h1>
        <p className="text-sm text-gray-400">
          You're on the{" "}
          <span className="font-semibold capitalize text-gray-700">
            {currentPlan}
          </span>{" "}
          plan
          {planExpiry && daysLeft > 0 && ` · ${daysLeft} days remaining`}
          {planExpiry && daysLeft <= 0 && (
            <span className="text-red-500"> · Expired</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {Object.entries(PLAN_FEATURES).map(([key, plan]) => {
          const isCurrent = currentPlan === key;
          const isPro = key === "professional";
          return (
            <div
              key={key}
              className={`rounded-2xl border-2 p-6 flex flex-col relative ${plan.color}`}
            >
              {key === "creator" && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              <div className="mb-4">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${plan.badge}`}
                >
                  {plan.name}
                </span>
                <div className="mt-3">
                  {plan.price === 0 ? (
                    <p
                      className={`text-3xl font-bold ${isPro ? "text-white" : ""}`}
                    >
                      Free
                    </p>
                  ) : (
                    <p
                      className={`text-3xl font-bold ${isPro ? "text-white" : ""}`}
                    >
                      ₹{plan.price.toLocaleString("en-IN")}
                      <span
                        className={`text-sm font-normal ml-1 ${isPro ? "text-gray-400" : "text-gray-400"}`}
                      >
                        {plan.period}
                      </span>
                    </p>
                  )}
                  {plan.price > 0 && (
                    <p className={`text-[11px] mt-1 ${isPro ? "text-gray-400" : "text-gray-500"}`}>
                      + 18% GST · ₹{Math.round(plan.price * 1.18).toLocaleString("en-IN")} billed
                    </p>
                  )}
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-center gap-2 text-sm ${isPro ? "text-gray-300" : "text-gray-600"}`}
                  >
                    <Check white={isPro} /> {f}
                  </li>
                ))}
                {plan.locked.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-gray-400 line-through"
                  >
                    <Lock /> {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div
                  className={`text-center py-2.5 rounded-xl text-sm font-medium ${isPro ? "bg-white/10 text-white" : "bg-gray-100 text-gray-500"}`}
                >
                  Current Plan
                </div>
              ) : key === "explorer" ? (
                <div className="text-center py-2.5 rounded-xl text-sm text-gray-400 border border-gray-200">
                  Default (free)
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={paying === key}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                    isPro
                      ? "bg-amber-400 text-gray-900 hover:bg-amber-300"
                      : "bg-primary text-white hover:bg-primary-dark"
                  }`}
                >
                  {paying === key
                    ? "Opening payment..."
                    : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 fb-card p-4 text-sm text-gray-500 text-center">
        All plans are billed monthly. Cancel anytime. No hidden charges. ·
        Powered by Razorpay.
      </div>
    </div>
  );
};

export default UpgradePlan;

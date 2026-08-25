import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, User, Star, Gift, Briefcase, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { isHost } from "../../utils/roleRoutes";
import toast from "react-hot-toast";

// Guest-space shell (/user/*). Gives the traveler side its own consistent home:
// a persistent tab bar across Bookings / Profile / Reviews / Rewards, so the four
// pages read as one app instead of four disconnected screens. Deliberately lighter
// than the host DashboardLayout (no sidebar, airy container) — consumer feel.
//
// Quiet door: a single subtle "start hosting" link at the bottom, shown only to
// pure guests. It mirrors the navbar's startHosting flow (becomeHost → onboarding),
// keeping the host-acquisition path discoverable for motivated users without ever
// shouting that a "host side" exists.

const TABS = [
  { to: "/user/my-bookings", label: "Bookings", icon: CalendarDays },
  { to: "/user/profile", label: "Profile", icon: User },
  { to: "/user/reviews", label: "Reviews", icon: Star },
  { to: "/user/loyalty", label: "Rewards", icon: Gift },
  { to: "/user/chat", label: "Chat", icon: MessageCircle },
];

const GuestLayout = () => {
  const { user, becomeHost } = useAuth();
  const navigate = useNavigate();
  const canHost = isHost(user);

  // Add hosting to the CURRENT account, then enter the existing onboarding.
  // Mirrors Navbar.startHosting so both doors behave identically.
  const startHosting = async () => {
    try {
      const updated = await becomeHost();
      const slug = updated?.onboarding_slug || updated?.username;
      if (updated?.onboarding_completed || !slug) navigate("/dashboard");
      else navigate(`/vendor-register/${slug}/claim`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not start hosting");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f7f5ef" }}>
      {/* Tab bar — sits under the global navbar, scrolls with the page. */}
      <div className="border-b border-black/5 bg-[#f7f5ef]">
        <div className="app-container max-w-2xl">
          <nav className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Your account">
            {TABS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                role="tab"
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 whitespace-nowrap px-3.5 py-3 text-sm font-medium transition-colors ${
                    isActive ? "text-[#FE5100]" : "text-gray-500 hover:text-gray-800"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} />
                    {label}
                    {isActive && (
                      <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#FE5100]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Active page */}
      <main className="app-container max-w-2xl py-7 flex-1">
        <Outlet />
      </main>

      {/* Quiet door — pure guests only. Subtle by design. */}
      {!canHost && (
        <div className="app-container max-w-2xl pb-10">
          <div className="border-t border-black/5 pt-5">
            <button
              type="button"
              onClick={startHosting}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#FE5100] transition-colors"
            >
              <Briefcase size={13} />
              Want to offer your own sessions? Start hosting →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestLayout;

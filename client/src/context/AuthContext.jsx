import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePostHog } from '@posthog/react';
import { analytics } from '../services/analytics';
import { registerVendor, registerUser, loginUser, loginUnified as apiLoginUnified, loginWithPhone as apiLoginWithPhone, verifyOtpLogin as apiVerifyOtpLogin, setUserPassword, getGoogleAuthUrl, getVendorGoogleUrl, getMe, becomeHost as apiBecomeHost } from '../services/api';
import supabase from '../services/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Active dashboard mode for dual-capability accounts (Hosting vs Traveling).
  // Persisted so a host returns to the space they last used. First load with no
  // saved pref: hosts default to 'hosting' (so existing hosts aren't dropped into
  // guest space), everyone else 'traveling'. (Unified identity — Phase 1/2.)
  const [mode, setModeState] = useState(() => {
    const saved = localStorage.getItem('bas_active_mode');
    if (saved) return saved;
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      return u?.is_host ? 'hosting' : 'traveling';
    } catch { return 'traveling'; }
  });
  const setMode = (m) => { setModeState(m); localStorage.setItem('bas_active_mode', m); };
  const posthog = usePostHog();
  const wasIdentified = useRef(false);

  // Link PostHog events to the known user. One central watcher covers every
  // login path (password, phone, OTP, Google, register) plus refresh-rehydrate.
  // reset() fires ONLY on the logout transition (identified -> null), never for
  // a plain anonymous visitor — otherwise the anon distinct_id would churn on
  // every page load and break anonymous funnels. distinct_id MUST match what the
  // backend will send later (posthog-node) so events join on one person.
  useEffect(() => {
    if (!posthog) return;
    const id = user?.id || user?._id;
    if (id) {
      posthog.identify(String(id), {
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
      });
      // Fan the same identity to the gated adapters (GA4 user_id, Clarity tags).
      // PostHog is skipped inside analytics.identify — it's owned by the line above.
      analytics.identify(String(id), { name: user.name, role: user.role, plan: user.plan });
      wasIdentified.current = true;
    } else if (wasIdentified.current) {
      posthog.reset();
      wasIdentified.current = false;
    }
  }, [posthog, user?.id, user?._id]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { setLoading(false); return; }

    const parsed = JSON.parse(stored);
    setUser(parsed); // set immediately so routes don't flash to login

    // Refresh from server if we have a token — keeps plan, profile fields, username up to date
    if (parsed?.token) {
      getMe()
        .then(({ data: fresh }) => {
          const merged = { ...parsed, ...fresh };
          localStorage.setItem('user', JSON.stringify(merged));
          setUser(merged);
        })
        .catch(() => { /* token expired or server down — keep cached data */ })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('user');
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data } = await loginUser({ email, password });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Unified login door (Phase B): one field accepts email OR phone. Throws on
  // 401/409 (caller inspects err.response to branch to OTP / "set password").
  const loginUnified = async (identifier, password) => {
    const { data } = await apiLoginUnified({ identifier, password });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Phone-primary user login. Throws on 401/404/409 (caller inspects
  // err.response to branch to OTP / "set password").
  const loginWithPhone = async (phone, password) => {
    const { data } = await apiLoginWithPhone({ phone, password });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Phone OTP login. The server returns a fully serialized profile WITH session
  // tokens, so we can persist it directly (no /me round-trip needed).
  const loginWithOtp = async (phone, otp) => {
    const { data } = await apiVerifyOtpLogin({ phone, otp });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  // Set a real password for the logged-in user (flips password_set server-side).
  const setPassword = async (password) => {
    await setUserPassword({ password });
    updateUser({ password_set: true });
  };

  const registerAsVendor = async (name, email, password) => {
    const { data } = await registerVendor({ name, email, password });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const registerAsUser = async (name, email, password) => {
    const { data } = await registerUser({ name, email, password });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const connectGoogleCalendar = async () => {
    const { data } = await getGoogleAuthUrl();
    window.location.href = data.url;
  };

  // Vendor Google auth: signup/login with one consent screen (identity +
  // calendar). The callback lands on /auth/google/done with session tokens.
  const startVendorGoogleAuth = async (intent = 'login') => {
    const { data } = await getVendorGoogleUrl(intent);
    window.location.href = data.url;
  };

  // Adopt a session minted server-side (Google vendor auth): store tokens,
  // hydrate the profile via /auth/me, persist the merged shape.
  const adoptSession = async ({ token, refresh_token }) => {
    localStorage.setItem('user', JSON.stringify({ token, refresh_token }));
    const { data: fresh } = await getMe();
    const merged = { ...fresh, token, refresh_token };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
    return merged;
  };

  // Unified identity: add hosting capability to the CURRENT account, flip to
  // hosting mode, and return the updated profile (with onboarding seed) so the
  // caller can route into the existing onboarding steps.
  const becomeHost = async () => {
    const { data } = await apiBecomeHost();
    updateUser(data);
    setMode('hosting');
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, loginUnified,
      mode, setMode,
      loginWithPhone, loginWithOtp, setPassword,
      registerAsVendor, registerAsUser,
      connectGoogleCalendar,
      startVendorGoogleAuth, adoptSession,
      becomeHost,
      logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

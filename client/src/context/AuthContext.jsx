import { createContext, useContext, useState, useEffect } from 'react';
import { registerVendor, registerUser, loginUser, getGoogleAuthUrl, getVendorGoogleUrl, getMe } from '../services/api';
import supabase from '../services/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      user, loading, login,
      registerAsVendor, registerAsUser,
      connectGoogleCalendar,
      startVendorGoogleAuth, adoptSession,
      logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

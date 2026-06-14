import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLoginUser } from "../services/api";
import toast from "react-hot-toast";

// SECURITY: Single-step isolated admin login.
// Sends username (or email) + password to the isolated /admin-auth/login
// endpoint. Staff live in the separate admin_users credential store — NO
// connection to Supabase Auth or the vendor/user login flow. On success the
// server returns an isolated admin session token (with the role's permissions)
// stored under the 'bas_admin' key — it never overwrites the 'user' session.

const AdminLogin = () => {
  const [form,    setForm]    = useState({ identifier: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier.trim() || !form.password) {
      toast.error("Enter username and password");
      return;
    }
    setLoading(true);
    try {
      const { data } = await adminLoginUser({ identifier: form.identifier.trim(), password: form.password });
      // Store isolated admin session — 'bas_admin' key, never 'user'.
      localStorage.setItem("bas_admin", JSON.stringify(data));
      toast.success("Access granted");
      navigate("/super-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "#FE5100" }}>
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">Super Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Book A Sloth · Restricted access</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-identifier" className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
              <input
                id="admin-identifier"
                type="text"
                required
                autoComplete="username"
                autoFocus
                placeholder="username"
                className="fb-input bg-gray-800 text-white border-gray-700 placeholder-gray-600"
                value={form.identifier}
                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                className="fb-input bg-gray-800 text-white border-gray-700"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn w-full py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-50 mt-2"
              style={{ background: "#FE5100" }}
            >
              {loading ? "Verifying…" : "Grant Access"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">Unauthorised access is prohibited and logged.</p>
      </div>
    </div>
  );
};

export default AdminLogin;

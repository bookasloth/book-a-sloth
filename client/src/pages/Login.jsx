import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success("Welcome back!");
      // BUG-18 fixed: guests go to their bookings page, hosts/admins to dashboard
      navigate(data.role === "host" || data.role === "superadmin" ? "/dashboard" : "/my-bookings");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
      <div className="page-card w-full max-w-md p-5 sm:p-8">
        <h1 className="text-2xl font-bold mb-2">Login</h1>
        <p className="mb-6 text-sm text-gray-500">
          Welcome back to your booking workspace.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="fb-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              className="fb-input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-5 text-center space-y-1">
          <p className="text-sm text-gray-500">
            Booking a service? No account needed — just verify your mobile
            number during checkout.
          </p>
          <p className="text-sm text-gray-500">
            Want to offer services?{" "}
            <Link to="/be-a-sloth" className="text-primary hover:underline">
              Become a sloth
            </Link>{" "}
            ·{" "}
            <Link to="/login-as-vendor" className="text-primary hover:underline">
              Vendor login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

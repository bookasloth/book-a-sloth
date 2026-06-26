import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendOtp } from "../services/api";
import toast from "react-hot-toast";

// Unified login door (Phase B). One identifier field accepts EITHER an email OR
// a mobile number; password is the fast path; OTP (phone only) is the bootstrap
// that lets a user set a password or sign in when they haven't yet. "Continue
// with Google" covers Google-native (host) accounts — and upgrades an existing
// customer to a host in-flow. Unified identity = one account books AND hosts.
const isPhone = (v) => /^\+?[\d\s\-()]{8,17}$/.test(v.trim());
const isEmail = (v) => v.includes("@");

// Google callback failures redirect here with ?error=… (the old /login-as-vendor
// target now renders this same page).
const ERROR_COPY = {
  invalid_state: "That sign-in link expired. Please try again.",
  customer_email: "We couldn't sign you in with that Google account. Please try again.",
  create_failed: "We could not create your account. Please try again.",
  auth_failed: "Google sign-in failed. Please try again.",
  no_email: "Google did not share an email address. Check your account permissions.",
};

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0012 1 11 11 0 002.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

const Login = () => {
  const { loginUnified, loginWithOtp, setPassword, startVendorGoogleAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Honour ?redirect= only for internal single-slash paths (avoid open-redirects).
  const rawRedirect = searchParams.get("redirect") || "";
  const redirectTo = /^\/(?!\/)/.test(rawRedirect) ? rawRedirect : "/user/my-bookings";

  const [step, setStep] = useState("id"); // 'id' | 'otp' | 'setpw'
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword_] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Surface a Google-callback error (this page is also the /login-as-vendor target).
  useEffect(() => {
    const err = searchParams.get("error");
    if (err) toast.error(ERROR_COPY[err] || "Sign-in failed. Please try again.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A host lands in the dashboard; everyone else goes to the requested page.
  const finish = (data) => {
    toast.success("Welcome back!");
    navigate(data?.is_host ? "/dashboard" : redirectTo);
  };

  // Send an OTP to the phone identifier and move to the verify step. OTP login is
  // phone-only (email OTP is for booking, not sign-in).
  const goToOtp = async () => {
    if (busy) return; // guard against double-send
    setBusy(true);
    try {
      await sendOtp({ phone: identifier });
      setStep("otp");
      toast.success("Code sent on WhatsApp & email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send code");
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    const value = identifier.trim();
    if (!isEmail(value) && !isPhone(value))
      return toast.error("Enter your email or mobile number");
    setBusy(true);
    try {
      const data = await loginUnified(value, password);
      finish(data);
    } catch (err) {
      const status = err.response?.status;
      const phone = !isEmail(value) && isPhone(value);
      if (status === 409 && err.response?.data?.needsPassword) {
        toast("Let's set your password — sending a code", { icon: "🔑" });
        await goToOtp();
      } else if (status === 401 && phone) {
        // Unknown number → bootstrap via OTP (verify number, then set a password).
        toast("New here? Verify your number to continue", { icon: "👋" });
        await goToOtp();
      } else {
        toast.error(err.response?.data?.message || "Login failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    setBusy(true);
    try {
      const data = await loginWithOtp(identifier, otp);
      if (!data.password_set) {
        setStep("setpw"); // already logged in; offer to set a password
      } else {
        finish(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid code");
    } finally {
      setBusy(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    try {
      await setPassword(newPw);
      toast.success("Password set — use it to log in next time");
      navigate(redirectTo);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not set password");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleBusy(true);
    try {
      await startVendorGoogleAuth("login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not start Google sign-in");
      setGoogleBusy(false);
    }
  };

  const otpEligible = isPhone(identifier) && !isEmail(identifier);

  return (
    <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
      <div className="page-card w-full max-w-md p-5 sm:p-8">
        {/* STEP: identifier + password */}
        {step === "id" && (
          <>
            <h1 className="text-2xl font-bold mb-2">Log in</h1>
            <p className="mb-6 text-sm text-gray-500">
              Use your email or mobile number — one account for booking and hosting.
            </p>

            <button
              onClick={handleGoogle}
              disabled={googleBusy}
              className="btn btn--outline w-full flex items-center justify-center gap-3 hover:border-gray-300 bg-white py-3 text-sm font-semibold transition disabled:opacity-50"
            >
              <GoogleIcon />
              {googleBusy ? "Opening Google…" : "Continue with Google"}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
              <span className="h-px flex-1 bg-gray-200" /> or <span className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email or mobile number</label>
                <input
                  type="text"
                  required
                  placeholder="you@email.com or +91 98765 43210"
                  className="fb-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Your password"
                  className="fb-input"
                  value={password}
                  onChange={(e) => setPassword_(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={busy || !identifier || !password}
                className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {busy ? "Logging in..." : "Log in"}
              </button>
            </form>

            {otpEligible && (
              <button
                onClick={goToOtp}
                disabled={busy}
                className="mt-3 w-full text-sm text-primary hover:underline disabled:opacity-50"
              >
                Log in with a one-time code instead
              </button>
            )}

            <p className="mt-5 text-center text-sm text-gray-500">
              New here?{" "}
              <Link to="/be-a-sloth" className="text-primary hover:underline">Become a sloth</Link>
            </p>
          </>
        )}

        {/* STEP: OTP (phone) */}
        {step === "otp" && (
          <>
            <button onClick={() => setStep("id")} className="text-sm text-gray-400 hover:text-gray-600 mb-4">← Back</button>
            <h1 className="text-2xl font-bold mb-2">Enter your code</h1>
            <p className="mb-6 text-sm text-gray-500">
              We sent a 6-digit code to <strong>{identifier}</strong> on WhatsApp & email.
            </p>
            <form onSubmit={handleOtpLogin} className="space-y-4">
              <input
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="fb-input text-center tracking-[0.5em] text-lg"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {busy ? "Verifying..." : "Verify & log in"}
              </button>
            </form>
            <button onClick={goToOtp} disabled={busy} className="mt-3 w-full text-sm text-primary hover:underline disabled:opacity-50">
              Resend code
            </button>
          </>
        )}

        {/* STEP: set password (post-login, skippable) */}
        {step === "setpw" && (
          <>
            <h1 className="text-2xl font-bold mb-2">Set a password</h1>
            <p className="mb-6 text-sm text-gray-500">
              Set a password to log in faster next time — or skip and keep using one-time codes.
            </p>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <input
                type="password"
                placeholder="At least 8 characters"
                className="fb-input"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
              <button
                type="submit"
                disabled={busy || newPw.length < 8}
                className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save password"}
              </button>
            </form>
            <button onClick={() => navigate(redirectTo)} disabled={busy} className="mt-3 w-full text-sm text-gray-500 hover:underline disabled:opacity-50">
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;

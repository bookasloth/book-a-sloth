import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendOtp } from "../services/api";
import toast from "react-hot-toast";

// User login is phone-primary. Password is the fast path; OTP is the bootstrap
// that lets a user set a password (or log in when they haven't yet). Vendors log
// in with email at /login-as-vendor.
const isPhoneValid = (p) => /^\+?[\d\s\-()]{8,17}$/.test(p.trim());

const Login = () => {
  const { loginWithPhone, loginWithOtp, setPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState("phone"); // 'phone' | 'otp' | 'setpw'
  const [phone, setPhone] = useState("");
  const [password, setPassword_] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

  const finish = () => {
    toast.success("Welcome back!");
    navigate("/my-bookings");
  };

  // Send the OTP and move to the verify step (shared by the "OTP instead" button
  // and the auto-fallback when a password isn't set / account is new).
  const goToOtp = async () => {
    setBusy(true);
    try {
      await sendOtp({ phone });
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
    if (!isPhoneValid(phone)) return toast.error("Enter a valid mobile number");
    setBusy(true);
    try {
      await loginWithPhone(phone, password);
      finish();
    } catch (err) {
      const status = err.response?.status;
      if (status === 409 && err.response?.data?.needsPassword) {
        toast("Let's set your password — sending a code", { icon: "🔑" });
        await goToOtp();
      } else if (status === 404) {
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
      const data = await loginWithOtp(phone, otp);
      if (!data.password_set) {
        setStep("setpw"); // already logged in; offer to set a password
      } else {
        finish();
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
      finish();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not set password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
      <div className="page-card w-full max-w-md p-5 sm:p-8">
        {/* STEP: phone + password */}
        {step === "phone" && (
          <>
            <h1 className="text-2xl font-bold mb-2">Log in</h1>
            <p className="mb-6 text-sm text-gray-500">
              Use your mobile number to access your bookings.
            </p>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mobile number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  className="fb-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                disabled={busy || !phone || !password}
                className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
              >
                {busy ? "Logging in..." : "Log in"}
              </button>
            </form>
            <button
              onClick={() => isPhoneValid(phone) ? goToOtp() : toast.error("Enter your mobile number first")}
              disabled={busy}
              className="mt-3 w-full text-sm text-primary hover:underline disabled:opacity-50"
            >
              Log in with a one-time code instead
            </button>
            <p className="mt-5 text-center text-sm text-gray-500">
              Want to offer services?{" "}
              <Link to="/be-a-sloth" className="text-primary hover:underline">Become a sloth</Link>
              {" · "}
              <Link to="/login-as-vendor" className="text-primary hover:underline">Vendor login</Link>
            </p>
          </>
        )}

        {/* STEP: OTP */}
        {step === "otp" && (
          <>
            <button onClick={() => setStep("phone")} className="text-sm text-gray-400 hover:text-gray-600 mb-4">← Back</button>
            <h1 className="text-2xl font-bold mb-2">Enter your code</h1>
            <p className="mb-6 text-sm text-gray-500">
              We sent a 6-digit code to <strong>{phone}</strong> on WhatsApp & email.
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
            <button onClick={finish} disabled={busy} className="mt-3 w-full text-sm text-gray-500 hover:underline disabled:opacity-50">
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;

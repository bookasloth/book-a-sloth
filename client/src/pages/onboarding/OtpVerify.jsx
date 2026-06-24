import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
// removed in onboarding reshape — sendOnboardingOtp, verifyOnboardingOtp deleted server-side
// eslint-disable-next-line no-unused-vars
const sendOnboardingOtp = () => Promise.reject(new Error('removed in onboarding reshape'));
// eslint-disable-next-line no-unused-vars
const verifyOnboardingOtp = () => Promise.reject(new Error('removed in onboarding reshape'));
import ProgressBar from './ProgressBar';

const OtpVerify = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [formValid, setFormValid] = useState(false);

  // OTP state
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);

  // Validate form
  useEffect(() => {
    const isValid = name && email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && phone && /^[0-9+\-\s()]{10,}$/.test(phone);
    setFormValid(isValid);
  }, [name, email, phone]);

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formValid) return;

    setLoading(true);
    try {
      await sendOnboardingOtp({
        slug,
        email: email.toLowerCase().trim(),
        phone,
        name,
      });
      setStep('otp');
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 60000); // 60s resend cooldown
      toast.success('OTPs sent to email and WhatsApp');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTPs');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (channel) => {
    const otp = channel === 'email' ? emailOtp : phoneOtp;
    if (!otp || otp.length !== 6) {
      toast.error(`Please enter a 6-digit ${channel} OTP`);
      return;
    }

    setLoading(true);
    try {
      await verifyOnboardingOtp({
        slug,
        channel,
        otp,
      });
      if (channel === 'email') {
        setEmailVerified(true);
        toast.success('Email verified');
      } else {
        setPhoneVerified(true);
        toast.success('WhatsApp verified');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `${channel} verification failed`);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      await sendOnboardingOtp({
        slug,
        email: email.toLowerCase().trim(),
        phone,
        name,
      });
      setResendDisabled(true);
      setTimeout(() => setResendDisabled(false), 60000);
      toast.success('OTPs resent');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTPs');
    } finally {
      setResendLoading(false);
    }
  };

  const handleNext = () => {
    if (!emailVerified) {
      toast.error('Please verify your email');
      return;
    }
    // Phone is optional
    sessionStorage.setItem('onboarding_data', JSON.stringify({
      slug,
      name,
      email,
      phone,
    }));
    navigate(`/vendor-register/${slug}/password`);
  };

  return (
    <>
      <ProgressBar current={1} total={11} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-2xl p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Verify your details</h1>
          <p className="text-gray-500 text-sm mb-6">
            We'll send verification codes to your email and WhatsApp.
          </p>

          {step === 'form' ? (
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  className="fb-input"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="fb-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  className="fb-input"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-\s()]/g, ''))}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!formValid || loading}
                className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
              >
                {loading ? 'Sending OTPs...' : 'Send Verification Codes'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Email OTP */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Email OTP</label>
                  {emailVerified && <span className="text-green-600 text-sm font-medium">✓ Verified</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="fb-input flex-1"
                    placeholder="000000"
                    maxLength="6"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={emailVerified}
                  />
                  <button
                    onClick={() => handleVerifyOtp('email')}
                    disabled={emailVerified || loading || emailOtp.length !== 6}
                    className="btn bg-primary text-white px-4 py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {/* Phone OTP */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">WhatsApp OTP</label>
                  {phoneVerified ? (
                    <span className="text-green-600 text-sm font-medium">✓ Verified</span>
                  ) : (
                    <span className="text-gray-500 text-sm">Optional</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="fb-input flex-1"
                    placeholder="000000"
                    maxLength="6"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={phoneVerified}
                  />
                  <button
                    onClick={() => handleVerifyOtp('phone')}
                    disabled={phoneVerified || loading || phoneOtp.length !== 6}
                    className="btn bg-gray-300 text-gray-700 px-4 py-2.5 text-sm font-medium hover:bg-gray-400 disabled:opacity-50 transition"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {/* Resend & Continue */}
              <div className="flex gap-2">
                <button
                  onClick={handleResendOtp}
                  disabled={resendDisabled || resendLoading}
                  className="text-primary text-sm font-medium hover:underline disabled:opacity-50"
                >
                  {resendLoading ? 'Resending...' : 'Resend OTPs'}
                </button>
              </div>

              <button
                onClick={handleNext}
                disabled={!emailVerified}
                className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
              >
                Next: Set Password
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OtpVerify;

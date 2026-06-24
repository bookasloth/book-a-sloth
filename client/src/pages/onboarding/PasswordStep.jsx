import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
// removed in onboarding reshape — createVendorAccount deleted server-side
// eslint-disable-next-line no-unused-vars
const createVendorAccount = () => Promise.reject(new Error('removed in onboarding reshape'));
import ProgressBar from './ProgressBar';

const PasswordStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Get onboarding data from session
  const onboardingData = JSON.parse(sessionStorage.getItem('onboarding_data') || '{}');

  // Calculate password strength
  useEffect(() => {
    let points = 0;
    if (password.length >= 8) points++;
    if (password.length >= 12) points++;
    if (/[a-z]/.test(password)) points++;
    if (/[A-Z]/.test(password)) points++;
    if (/[0-9]/.test(password)) points++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) points++;
    setStrength(points);
  }, [password]);

  const validateForm = () => {
    const newErrors = {};
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) newErrors.confirm = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data } = await createVendorAccount({
        slug,
        email: onboardingData.email,
        password,
        name: onboardingData.name,
      });

      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(data));
      updateUser(data);

      toast.success('Account created! Welcome!');
      // Navigate to next step (vendor type)
      navigate(`/vendor-register/${slug}/type`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthLabel = () => {
    if (strength < 2) return { text: 'Weak', color: 'text-red-600' };
    if (strength < 4) return { text: 'Fair', color: 'text-yellow-600' };
    if (strength < 6) return { text: 'Good', color: 'text-blue-600' };
    return { text: 'Strong', color: 'text-green-600' };
  };

  const strengthLabel = getStrengthLabel();

  return (
    <>
      <ProgressBar current={2} total={11} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-md p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-gray-500 text-sm mb-6">
            Set a strong password to secure your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`fb-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-1">
                    {Array(6).fill(0).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 w-1 rounded-full ${
                          i < strength ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${strengthLabel.color}`}>
                    {strengthLabel.text}
                  </span>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`fb-input ${errors.confirm ? 'border-red-500' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
            >
              {loading ? 'Creating account...' : 'Create Account & Continue'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Password tips:</strong> Use at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PasswordStep;

import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ERROR_COPY = {
  invalid_state: 'That sign-in link expired. Please try again.',
  customer_email: 'This Google account belongs to a customer profile. Vendors need a separate email.',
  create_failed: 'We could not create your account. Please try again.',
  auth_failed: 'Google sign-in failed. Please try again.',
  no_email: 'Google did not share an email address. Check your account permissions.',
};

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0012 1 11 11 0 002.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

// /login-as-vendor — Google-only vendor login. Existing vendors who signed up
// with email/password before the Google migration can still use /login.
const VendorLogin = () => {
  const { startVendorGoogleAuth, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) { navigate('/dashboard', { replace: true }); return; }
    const err = searchParams.get('error');
    if (err) toast.error(ERROR_COPY[err] || 'Sign-in failed. Please try again.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await startVendorGoogleAuth('login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start Google sign-in');
      setLoading(false);
    }
  };

  return (
    <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
      <div className="page-card w-full max-w-md p-5 sm:p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Vendor Login</h1>
        <p className="text-sm text-gray-500 mb-8">
          Sign in with the Google account you used to become a sloth.
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 bg-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
        >
          <GoogleIcon />
          {loading ? 'Opening Google…' : 'Sign in with Google'}
        </button>

        <p className="mt-8 text-sm text-gray-500">
          New here?{' '}
          <Link to="/be-a-sloth" className="text-primary hover:underline">Become a sloth</Link>
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Signed up with email and password before?{' '}
          <Link to="/login" className="hover:underline">Use the classic login</Link>
        </p>
      </div>
    </div>
  );
};

export default VendorLogin;

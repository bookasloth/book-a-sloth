import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/>
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0012 1 11 11 0 002.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

// /be-a-sloth — vendor signup. Google-only: one consent screen grants identity
// + calendar access, the account is created automatically in the callback.
const BeASloth = () => {
  const { startVendorGoogleAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await startVendorGoogleAuth('signup');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start Google sign-up');
      setLoading(false);
    }
  };

  return (
    <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
      <div className="page-card w-full max-w-md p-5 sm:p-8 text-center">
        <div className="text-4xl mb-3">🦥</div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Be a Sloth</h1>
        <p className="text-sm text-gray-500 mb-8">
          Publish your services, share your booking page and get paid —
          calendar and Google Meet links set up automatically.
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="btn btn--outline w-full flex items-center justify-center gap-3 bg-white py-3 text-sm font-semibold transition disabled:opacity-50"
        >
          <GoogleIcon />
          {loading ? 'Opening Google…' : 'Continue with Google'}
        </button>

        <ul className="mt-6 text-left text-xs text-gray-500 space-y-2">
          <li>✓ No password to remember — your Google account is your login</li>
          <li>✓ Calendar connected instantly — busy times never get booked</li>
          <li>✓ Google Meet links created for every online booking</li>
        </ul>

        <p className="mt-8 text-sm text-gray-500">
          Already a sloth?{' '}
          <Link to="/login-as-vendor" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default BeASloth;

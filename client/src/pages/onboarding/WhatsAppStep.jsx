import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updateOnboardingStep } from '../../services/api';
import ProgressBar from './ProgressBar';
import WhatsAppVerify from '../../components/whatsapp/WhatsAppVerify';

const WhatsAppStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const goNext = () => navigate(`/vendor-register/${slug}/profile`);

  const handleVerified = async () => {
    try {
      await updateOnboardingStep({ slug, step: 7, data: {} });
      toast.success('WhatsApp verified!');
    } catch { /* number already saved by verify-otp; advance regardless */ }
    goNext();
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await updateOnboardingStep({ slug, step: 7, data: { whatsapp_skipped: true } });
      goNext();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to skip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar current={7} total={11} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-md p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Get Booking Updates on WhatsApp</h1>
          <p className="text-gray-500 text-sm mb-6">
            Add your WhatsApp number to receive booking updates and notifications.
          </p>

          <WhatsAppVerify onVerified={handleVerified} />

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs mb-2">or</p>
            <button onClick={handleSkip} disabled={loading} className="text-primary text-sm font-medium hover:underline disabled:opacity-50">
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WhatsAppStep;

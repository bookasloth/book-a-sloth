import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Building2, Monitor, MapPin, Repeat } from 'lucide-react';
import { updateOnboardingStep } from '../../services/api';
import useOnboardingGuard from './useOnboardingGuard';
import ProgressBar from './ProgressBar';

const HOST_TYPES = [
  {
    id: 'individual',
    label: 'Individual',
    description: "I'm a solo creator or freelancer",
    Icon: User,
  },
  {
    id: 'organisation',
    label: 'Organisation',
    description: 'I run a business with a team',
    Icon: Building2,
  },
];

const BOOKING_TYPES = [
  {
    id: 'online_only',
    label: 'Online Only',
    description: 'Meetings via Google Meet, Zoom, or similar',
    Icon: Monitor,
  },
  {
    id: 'offline_only',
    label: 'In-Person Only',
    description: "Meetings at your location or client's place",
    Icon: MapPin,
  },
  {
    id: 'both',
    label: 'Both Online & In-Person',
    description: 'Offer both options to your clients',
    Icon: Repeat,
  },
];

const AboutYouStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const ready = useOnboardingGuard();

  const [vendorType, setVendorType] = useState(null);
  const [bookingType, setBookingType] = useState(null);
  const [saving, setSaving] = useState(false);

  const canContinue = vendorType && bookingType;

  const handleContinue = async () => {
    if (!canContinue) return;
    setSaving(true);
    try {
      await updateOnboardingStep({
        slug,
        step: 3,
        data: { vendor_type: vendorType, booking_type: bookingType },
      });
      navigate(`/vendor-register/${slug}/category`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save — please try again');
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <>
        <ProgressBar current={2} total={6} />
        <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <ProgressBar current={2} total={6} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-6 sm:py-8">
        <div className="page-card w-full max-w-md p-5 sm:p-8">
          {/* Back */}
          <button
            onClick={() => navigate(`/vendor-register/${slug}/claim`)}
            className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-bold mb-1">Tell us about you</h1>
          <p className="text-gray-500 text-sm mb-5">
            This helps us personalize your experience.
          </p>

          {/* Host type group */}
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Host type
          </p>
          <div className="space-y-2 mb-5">
            {HOST_TYPES.map(({ id, label, description, Icon }) => (
              <button
                key={id}
                onClick={() => setVendorType(id)}
                className={`w-full p-3 rounded border-2 transition text-left ${
                  vendorType === id
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className="w-5 h-5 text-primary shrink-0"
                    fill="currentColor"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Booking type group */}
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            How do you meet clients?
          </p>
          <div className="space-y-2 mb-6">
            {BOOKING_TYPES.map(({ id, label, description, Icon }) => (
              <button
                key={id}
                onClick={() => setBookingType(id)}
                className={`w-full p-3 rounded border-2 transition text-left ${
                  bookingType === id
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-primary shrink-0" strokeWidth={2} />
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={!canContinue || saving}
            className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>
    </>
  );
};

export default AboutYouStep;

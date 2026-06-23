import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Monitor, MapPin, Repeat } from 'lucide-react';
import { updateOnboardingStep } from '../../services/api';
import ProgressBar from './ProgressBar';

const BookingTypeStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const types = [
    {
      id: 'online_only',
      label: 'Online Only',
      description: 'Meetings via Google Meet, Zoom, or similar',
      Icon: Monitor,
    },
    {
      id: 'offline_only',
      label: 'In-Person Only',
      description: 'Meetings at your location or client\'s place',
      Icon: MapPin,
    },
    {
      id: 'both',
      label: 'Both Online & In-Person',
      description: 'Offer both options to your clients',
      Icon: Repeat,
    },
  ];

  // Optimistic: advance instantly, persist in the background.
  const handleSelect = (typeId) => {
    setSelected(typeId);
    updateOnboardingStep({ slug, step: 5, data: { booking_type: typeId } }).catch((error) => {
      toast.error(error.response?.data?.message || 'Could not save booking type');
    });
    navigate(`/vendor-register/${slug}/work-hours`);
  };

  return (
    <>
      <ProgressBar current={5} total={11} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-md p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">How do you meet clients?</h1>
          <p className="text-gray-500 text-sm mb-6">
            Choose your preferred booking mode.
          </p>

          <div className="space-y-3">
            {types.map(({ id, label, description, Icon }) => (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={`w-full p-4 rounded border-2 transition text-left ${
                  selected === id
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-primary'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-6 h-6 text-primary shrink-0" strokeWidth={2} />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingTypeStep;

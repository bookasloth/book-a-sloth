import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Building2 } from 'lucide-react';
import { updateOnboardingStep } from '../../services/api';
import ProgressBar from './ProgressBar';

const VendorTypeStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const types = [
    {
      id: 'individual',
      label: 'Individual',
      description: 'I\'m a solo creator or freelancer',
      Icon: User,
    },
    {
      id: 'organisation',
      label: 'Organisation',
      description: 'I run a business with a team',
      Icon: Building2,
    },
  ];

  // Optimistic: advance instantly, persist in the background. Backend round-trip
  // latency no longer blocks the UI (root cause of perceived step slowness).
  const handleSelect = (typeId) => {
    setSelected(typeId);
    updateOnboardingStep({ slug, step: 3, data: { type: typeId } }).catch((error) => {
      toast.error(error.response?.data?.message || 'Could not save vendor type');
    });
    navigate(`/vendor-register/${slug}/category`);
  };

  return (
    <>
      <ProgressBar current={3} total={11} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-md p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">What best describes you?</h1>
          <p className="text-gray-500 text-sm mb-6">
            This helps us personalize your experience.
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
                  <Icon className="w-6 h-6 text-primary shrink-0" fill="currentColor" strokeWidth={1.5} />
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

export default VendorTypeStep;

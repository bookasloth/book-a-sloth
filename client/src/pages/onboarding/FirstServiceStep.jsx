import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createService, updateOnboardingStep } from '../../services/api';
import ProgressBar from './ProgressBar';

const FirstServiceStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('');
  const [type, setType] = useState('online');
  const [loading, setLoading] = useState(false);

  const priceNum = price === '' ? NaN : Number(price);
  const priceValid = Number.isFinite(priceNum) && priceNum >= 0 && priceNum <= 10000;
  const isValid = title && description && duration && priceValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !duration) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!priceValid) {
      toast.error('Enter a price between ₹0 and ₹10,000');
      return;
    }

    setLoading(true);
    try {
      // Create service
      const serviceSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
      await createService({
        title,
        short_description: description,
        service_type: type,
        duration: parseInt(duration),
        price: parseFloat(price),
        slug: serviceSlug,
      });

      // Update onboarding step
      await updateOnboardingStep({
        slug,
        step: 8,
        data: { first_service_created: true },
      });

      toast.success('Service created!');
      navigate(`/vendor-register/${slug}/plans`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar current={8} total={10} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-2xl p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Add your first service</h1>
          <p className="text-gray-500 text-sm mb-6">
            Create your first service listing. You can add more later.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Service Title *</label>
              <input
                type="text"
                className="fb-input"
                placeholder="e.g., Career Coaching Session"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Short Description *</label>
              <textarea
                className="fb-input resize-none"
                placeholder="Brief description (max 140 chars)"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 140))}
                rows="2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{description.length}/140 characters</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select className="fb-input" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="online">Online</option>
                  <option value="offline">In-Person</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes) *</label>
                <input
                  type="number"
                  className="fb-input"
                  placeholder="60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min="15"
                  max="480"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price (₹) *</label>
              <input
                type="number"
                inputMode="numeric"
                className="fb-input"
                placeholder="Enter any amount from 0 to 10,000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                max="10000"
                step="1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Set any price between ₹0 (free) and ₹10,000.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !isValid}
              className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
            >
              {loading ? 'Creating service...' : 'Create Service & Continue'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default FirstServiceStep;

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { createRazorpayOrder, verifyOnboardingPayment } from '../../services/api';
import ProgressBar from './ProgressBar';

const PlansStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('creator');
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'explorer',
      name: 'Explorer',
      price: '₹0',
      popular: false,
      features: [
        '1 service listing',
        'Basic profile',
        'Email support',
        '5% commission',
        'Up to 20 bookings/month',
      ],
    },
    {
      id: 'creator',
      name: 'Creator',
      price: '₹999',
      period: '/year',
      popular: true,
      features: [
        '5 service listings',
        'Custom profile theme',
        'Priority support',
        '0% commission',
        'Unlimited bookings',
        'Google Meet integration',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '₹3,650',
      period: '/year',
      popular: false,
      features: [
        'Unlimited service listings',
        'Premium profile page',
        '24/7 phone support',
        '0% commission',
        'Unlimited bookings',
        'Advanced analytics',
        'API access',
      ],
    },
  ];

  const handleProceed = async () => {
    setLoading(true);

    try {
      // If free plan, just activate it
      if (selected === 'explorer') {
        await createRazorpayOrder({ plan: 'explorer' });
        navigate(`/vendor-register/${slug}/explore`);
        return;
      }

      // Razorpay checkout script must be loaded (see index.html).
      if (typeof window.Razorpay !== 'function') {
        toast.error('Payment library failed to load. Refresh the page and try again.');
        return;
      }

      // Create Razorpay order
      const { data: orderData } = await createRazorpayOrder({
        plan: selected,
      });

      // Open Razorpay checkout. amount is in paise; server returns rupees.
      const options = {
        key: orderData.key,
        order_id: orderData.orderId,
        amount: Math.round(orderData.amount * 100),
        currency: 'INR',
        name: 'Book A Sloth',
        description: `${selected.charAt(0).toUpperCase() + selected.slice(1)} plan`,
        handler: async (response) => {
          try {
            await verifyOnboardingPayment({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              plan: selected,
            });

            toast.success('Payment successful!');
            navigate(`/vendor-register/${slug}/explore`);
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).name : '',
          email: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : '',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar current={9} total={10} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-4xl p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Choose your plan</h1>
          <p className="text-gray-500 text-sm mb-8">
            Upgrade anytime. Cancel free plan anytime with no penalties.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`relative p-6 rounded-lg border-2 transition text-left ${
                  selected === plan.id
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-primary'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                <p className="text-2xl font-bold text-primary mb-1">
                  {plan.price}
                  {plan.period && <span className="text-sm text-gray-600">{plan.period}</span>}
                </p>

                <ul className="space-y-2 mt-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" strokeWidth={3} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          <button
            onClick={handleProceed}
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
          >
            {loading ? 'Processing...' : `Proceed with ${selected.charAt(0).toUpperCase() + selected.slice(1)} Plan`}
          </button>
        </div>
      </div>
    </>
  );
};

export default PlansStep;

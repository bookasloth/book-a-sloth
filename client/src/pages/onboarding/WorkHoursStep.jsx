import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Clock } from 'lucide-react';
import { setAvailability, updateOnboardingStep } from '../../services/api';
import ProgressBar from './ProgressBar';

// Replaces the old "Connect Google Calendar" step. Google-auth vendors already
// have their calendar connected at signup (full calendar scope + Meet links), so
// this slot now collects the host's work days + hours and seeds their availability.
const DAYS = [
  { key: 'monday',    label: 'Mon' },
  { key: 'tuesday',   label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday',  label: 'Thu' },
  { key: 'friday',    label: 'Fri' },
  { key: 'saturday',  label: 'Sat' },
  { key: 'sunday',    label: 'Sun' },
];
// Default: Mon–Sat working, Sunday off.
const DEFAULT_DAYS = {
  monday: true, tuesday: true, wednesday: true, thursday: true,
  friday: true, saturday: true, sunday: false,
};

const WorkHoursStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('19:00');
  const [loading, setLoading] = useState(false);

  const toggleDay = (key) => setDays((d) => ({ ...d, [key]: !d[key] }));
  const selectedCount = Object.values(days).filter(Boolean).length;

  const handleContinue = async () => {
    if (selectedCount === 0) {
      toast.error('Pick at least one work day');
      return;
    }
    if (start >= end) {
      toast.error('End time must be after start time');
      return;
    }
    setLoading(true);
    try {
      const weekly_schedule = DAYS.reduce((acc, { key }) => {
        acc[key] = days[key] ? [{ start, end }] : [];
        return acc;
      }, {});
      await setAvailability({
        weekly_schedule,
        timezone: 'Asia/Kolkata',
        buffer_minutes: 0,
        blocked_dates: [],
      });
      await updateOnboardingStep({ slug, step: 6, data: { work_hours_set: true } }).catch(() => {});
      navigate(`/vendor-register/${slug}/whatsapp`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save work hours');
      setLoading(false);
    }
  };

  return (
    <>
      <ProgressBar current={6} total={11} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-md p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Set your work hours</h1>
          <p className="text-gray-500 text-sm mb-6">
            When can guests book you? You can fine-tune per-day hours anytime in your dashboard.
          </p>

          {/* Work days */}
          <label className="block text-sm font-medium mb-2">Work days</label>
          <div className="flex flex-wrap gap-2 mb-6">
            {DAYS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleDay(key)}
                aria-pressed={days[key]}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  days[key]
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Hours */}
          <label className="block text-sm font-medium mb-2">Hours</label>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-6">
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="fb-input"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="fb-input"
            />
          </div>

          <button
            onClick={handleContinue}
            disabled={loading}
            className="btn w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                Saving&hellip;
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" strokeWidth={2.5} />
                Continue
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">
            Applies {start}&ndash;{end} to {selectedCount} day{selectedCount === 1 ? '' : 's'}.
          </p>
        </div>
      </div>
    </>
  );
};

export default WorkHoursStep;

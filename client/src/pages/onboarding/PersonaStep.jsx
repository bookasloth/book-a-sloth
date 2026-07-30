import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Sparkles, Briefcase, Camera, Code2, Palette, HeartHandshake, ArrowRight, Loader2,
} from 'lucide-react';
import { updateOnboardingStep } from '../../services/api';
import useOnboardingGuard from './useOnboardingGuard';
import ProgressBar from './ProgressBar';

// Persona → real category slug (verified live in `categories` table).
// "Something else" routes to the full search UI (CategoryStep) as fallback.
const PERSONAS = [
  { id: 'coach',      slug: 'life-coach',           label: 'Coach',       tag: 'Life · Career · Fitness',      Icon: Sparkles },
  { id: 'consultant', slug: 'business-consultant',  label: 'Consultant',  tag: 'Business · Strategy · Advice', Icon: Briefcase },
  { id: 'creator',    slug: 'content-creator',      label: 'Creator',     tag: 'Content · Media · Community',  Icon: Camera },
  { id: 'engineer',   slug: 'software-engineer',    label: 'Engineer',    tag: 'Software · Product · Data',    Icon: Code2 },
  { id: 'designer',   slug: 'visual-designer',      label: 'Designer',    tag: 'Visual · Fashion · UX',        Icon: Palette },
  { id: 'therapist',  slug: 'psychologist',         label: 'Therapist',   tag: 'Mind · Body · Wellness',       Icon: HeartHandshake },
];

const PersonaStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const ready = useOnboardingGuard();

  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const selected = PERSONAS.find((p) => p.id === selectedId) || null;

  const handleContinue = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateOnboardingStep({
        slug,
        step: 4,
        data: { primary_category: selected.slug, categories: [selected.slug] },
      });
      navigate(`/vendor-register/${slug}/whatsapp`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save — please try again');
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <>
        <ProgressBar current={3} total={6} />
        <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <ProgressBar current={3} total={6} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-start sm:items-center justify-center py-6 sm:py-10">
        <div className="w-full max-w-3xl px-4">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              How would you describe what you do?
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Pick the closest fit — you can fine-tune later.
            </p>
          </div>

          {/* Persona cards */}
          <div
            role="radiogroup"
            aria-label="Choose your persona"
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6"
          >
            {PERSONAS.map(({ id, label, tag, Icon }) => {
              const isSel = selectedId === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={isSel}
                  onClick={() => setSelectedId(id)}
                  className={`relative flex flex-col items-center text-center p-4 sm:p-5 rounded-xl border-2 transition-all bg-white hover:-translate-y-0.5 ${
                    isSel
                      ? 'border-primary bg-primary-light shadow-md'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 transition ${
                      isSel ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                    aria-hidden="true"
                  >
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
                  </div>
                  <p className={`font-semibold text-sm sm:text-base leading-tight ${isSel ? 'text-primary' : 'text-gray-900'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{tag}</p>
                </button>
              );
            })}
          </div>

          {/* Continue */}
          <button
            onClick={handleContinue}
            disabled={!selected || saving}
            className="btn w-full sm:w-auto sm:min-w-[240px] sm:mx-auto sm:flex sm:items-center sm:justify-center bg-primary text-white py-2.5 sm:py-3 px-6 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                Saving…
              </span>
            ) : (
              'Continue'
            )}
          </button>

          {/* Escape hatch */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate(`/vendor-register/${slug}/category/all`)}
              className="text-sm text-gray-500 hover:text-primary inline-flex items-center gap-1 transition"
            >
              None of these fit — see all categories
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PersonaStep;

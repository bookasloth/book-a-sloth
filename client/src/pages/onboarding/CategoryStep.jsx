import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Check, Plus, Loader2 } from 'lucide-react';
import { getCategories, suggestCategory, updateOnboardingStep } from '../../services/api';
import ProgressBar from './ProgressBar';

// Fallback list if the API is unreachable — keeps onboarding usable offline.
const FALLBACK = [
  { slug: 'coaching', label: 'Coaching & Mentoring' },
  { slug: 'consulting', label: 'Consulting' },
  { slug: 'tutoring', label: 'Tutoring & Education' },
  { slug: 'wellness', label: 'Wellness & Fitness' },
  { slug: 'music', label: 'Music Lessons' },
  { slug: 'photography', label: 'Photography' },
  { slug: 'design', label: 'Design Services' },
  { slug: 'writing', label: 'Writing & Content' },
  { slug: 'tech', label: 'Tech & Programming' },
  { slug: 'beauty', label: 'Beauty & Styling' },
  { slug: 'other', label: 'Other' },
];

const CategoryStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [fetching, setFetching] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data?.length ? data : FALLBACK))
      .catch(() => setCategories(FALLBACK))
      .finally(() => setFetching(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.label.toLowerCase().includes(q));
  }, [categories, query]);

  const toggle = (slugId) =>
    setSelected((prev) =>
      prev.includes(slugId) ? prev.filter((c) => c !== slugId) : [...prev, slugId]
    );

  const handleAddCustom = async () => {
    const label = customName.trim();
    if (label.length < 2) {
      toast.error('Enter a category name (min 2 characters)');
      return;
    }
    setAdding(true);
    try {
      const { data } = await suggestCategory(label);
      // Add to the visible list (if not already there) and select it.
      setCategories((prev) =>
        prev.some((c) => c.slug === data.slug) ? prev : [...prev, data]
      );
      setSelected((prev) => (prev.includes(data.slug) ? prev : [...prev, data.slug]));
      setCustomName('');
      setQuery('');
      if (data.status === 'pending') {
        toast.success('Sent for admin approval. You can keep going.');
      } else {
        toast.success('Category added');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add category');
    } finally {
      setAdding(false);
    }
  };

  const handleNext = () => {
    if (selected.length === 0) {
      toast.error('Please select at least one category');
      return;
    }
    setSaving(true);
    // Optimistic: persist in background, advance immediately.
    updateOnboardingStep({ slug, step: 4, data: { categories: selected } }).catch((error) => {
      toast.error(error.response?.data?.message || 'Could not save categories');
    });
    navigate(`/vendor-register/${slug}/booking-type`);
  };

  return (
    <>
      <ProgressBar current={4} total={11} />
      <div className="app-container flex min-h-[calc(100vh-72px)] items-center justify-center py-8 sm:py-12">
        <div className="page-card w-full max-w-2xl p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Choose your professions</h1>
          <p className="text-gray-500 text-sm mb-5">
            Select one or more categories that describe your services.
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2.5} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories"
              className="fb-input pl-9"
            />
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-5">
              {filtered.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => toggle(cat.slug)}
                  className={`flex items-center gap-2 p-3 rounded border-2 transition text-sm font-medium text-left ${
                    selected.includes(cat.slug)
                      ? 'border-primary bg-primary-light text-primary'
                      : 'border-gray-200 hover:border-primary text-gray-700'
                  }`}
                >
                  {selected.includes(cat.slug) && (
                    <Check className="w-4 h-4 shrink-0" strokeWidth={3} />
                  )}
                  <span>{cat.label}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-2 text-sm text-gray-400 py-4 text-center">
                  No category matches "{query}". Add it below.
                </p>
              )}
            </div>
          )}

          {/* Add custom category */}
          <div className="mb-6 rounded border border-dashed border-gray-300 p-3">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Can't find yours? Add a custom category (admin approval required)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                placeholder="e.g., Voice Coaching"
                className="fb-input flex-1"
              />
              <button
                onClick={handleAddCustom}
                disabled={adding}
                className="btn flex items-center gap-1.5 bg-gray-900 text-white px-3 text-sm font-medium hover:bg-black disabled:opacity-50 transition shrink-0"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                ) : (
                  <Plus className="w-4 h-4" strokeWidth={3} />
                )}
                Add
              </button>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={saving || selected.length === 0}
            className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </>
  );
};

export default CategoryStep;

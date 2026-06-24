import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Check, X, Plus, Loader2 } from 'lucide-react';
import { getCategories, suggestCategory, updateOnboardingStep } from '../../services/api';
import useOnboardingGuard from './useOnboardingGuard';
import ProgressBar from './ProgressBar';

// Fallback if the API is unreachable — keeps onboarding usable offline.
const FALLBACK = [
  { slug: 'life-coach',        label: 'Life Coach',        group_label: 'Coaching & Consulting' },
  { slug: 'career-coach',      label: 'Career Coach',      group_label: 'Coaching & Consulting' },
  { slug: 'software-engineer', label: 'Software Engineer', group_label: 'Technology & Product' },
  { slug: 'psychologist',      label: 'Psychologist',      group_label: 'Health & Wellness' },
  { slug: 'language-tutor',    label: 'Language Tutor',    group_label: 'Education' },
  { slug: 'financial-advisor', label: 'Financial Advisor', group_label: 'Business Services' },
];

const CategoryStep = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const ready = useOnboardingGuard();
  const searchRef = useRef(null);

  const [categories, setCategories]   = useState([]);
  const [selected, setSelected]       = useState(null);   // slug string | null
  const [selectedLabel, setSelectedLabel] = useState(''); // display name for the chip
  const [isPending, setIsPending]     = useState(false);  // true when selected is a pending suggestion
  const [query, setQuery]             = useState('');
  const [fetching, setFetching]       = useState(true);
  const [adding, setAdding]           = useState(false);
  const [saving, setSaving]           = useState(false);

  // Load category list once
  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data?.length ? data : FALLBACK))
      .catch(() => setCategories(FALLBACK))
      .finally(() => setFetching(false));
  }, []);

  // Autofocus search when ready
  useEffect(() => {
    if (ready && !fetching && searchRef.current) {
      searchRef.current.focus();
    }
  }, [ready, fetching]);

  // Live-filtered list (case-insensitive substring)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.label.toLowerCase().includes(q));
  }, [categories, query]);

  // Whether the typed query has an exact match (case-insensitive)
  const hasExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return true; // nothing typed — don't show Add row
    return categories.some((c) => c.label.toLowerCase() === q);
  }, [categories, query]);

  const showAddRow = query.trim().length >= 2 && !hasExactMatch;

  // Select a category by slug + label; clear pending badge
  const selectCategory = (catSlug, catLabel, pending = false) => {
    setSelected(catSlug);
    setSelectedLabel(catLabel);
    setIsPending(pending);
    setQuery('');
  };

  const clearSelection = () => {
    setSelected(null);
    setSelectedLabel('');
    setIsPending(false);
    if (searchRef.current) searchRef.current.focus();
  };

  // Add custom category via API, then auto-select it
  const handleAddCustom = async () => {
    const label = query.trim();
    if (label.length < 2) { toast.error('Enter at least 2 characters to add a category'); return; }
    setAdding(true);
    try {
      const { data } = await suggestCategory(label);
      // Add to local list if not already present
      setCategories((prev) =>
        prev.some((c) => c.slug === data.slug) ? prev : [...prev, { ...data, group_label: 'Custom' }]
      );
      selectCategory(data.slug, data.label, data.status === 'pending');
      toast.success(data.status === 'pending' ? 'Category submitted for review.' : 'Category added.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add category');
    } finally {
      setAdding(false);
    }
  };

  const handleNext = async () => {
    if (!selected) { toast.error('Please pick your primary category'); return; }
    setSaving(true);
    try {
      await updateOnboardingStep({ slug, step: 4, data: { primary_category: selected, categories: [selected] } });
      navigate(`/vendor-register/${slug}/whatsapp`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save category');
      setSaving(false);
    }
  };

  // ── Loading guard ───────────────────────────────────────────────────────
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

  // ── Main layout: fixed viewport, no page scroll ─────────────────────────
  // The outer wrapper is 100dvh minus the ProgressBar (≈56px). We use flex
  // column so: header (title+search) is auto-height, list fills remaining
  // space with overflow-y-auto, footer (Continue) is auto-height. This
  // ensures the page never grows beyond the viewport.
  return (
    <>
      <ProgressBar current={3} total={6} />

      {/* Full-viewport column; no page-level scroll */}
      <div
        className="app-container flex flex-col"
        style={{ height: 'calc(100dvh - 56px)' }}
      >
        <div className="flex flex-col h-full max-w-md mx-auto w-full px-4 py-4 sm:py-6">

          {/* ── Fixed header area ── */}
          <div className="shrink-0">
            <button
              onClick={() => navigate(`/vendor-register/${slug}/about`)}
              className="text-sm text-gray-500 hover:text-gray-800 mb-3 inline-block"
            >
              ← Back
            </button>

            <h1 className="text-2xl font-bold mb-1">What do you do?</h1>
            <p className="text-gray-500 text-sm mb-4">
              Pick the category that fits you. Add your own if it's not listed.
            </p>

            {/* Search box */}
            <div className="relative mb-3">
              <Search
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                strokeWidth={2.5}
              />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && showAddRow && !adding) handleAddCustom();
                }}
                placeholder="Search categories"
                autoComplete="off"
                className="fb-input pl-9 w-full"
              />
            </div>

            {/* Selected chip */}
            {selected && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-primary-light border border-primary text-primary text-sm font-medium rounded-full px-3 py-1 leading-none">
                  <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                  {selectedLabel}
                  {isPending && (
                    <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-primary/60 bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">
                      pending review
                    </span>
                  )}
                  <button
                    onClick={clearSelection}
                    aria-label={`Remove ${selectedLabel}`}
                    className="ml-0.5 text-primary/70 hover:text-primary transition"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* ── Scrollable matches list ── */}
          <div className="flex-1 overflow-y-auto min-h-0 rounded border border-gray-200 bg-white">
            {fetching ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
              </div>
            ) : (
              <>
                {/* Category rows */}
                {filtered.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => selectCategory(cat.slug, cat.label)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-b border-gray-100 last:border-b-0 transition ${
                      selected === cat.slug
                        ? 'bg-primary-light text-primary font-semibold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {selected === cat.slug ? (
                      <Check className="w-4 h-4 shrink-0 text-primary" strokeWidth={3} />
                    ) : (
                      <span className="w-4 h-4 shrink-0" />
                    )}
                    <span>{cat.label}</span>
                  </button>
                ))}

                {/* "Add <query>" row — shown only when query has no exact match */}
                {showAddRow && (
                  <button
                    onClick={!adding ? handleAddCustom : undefined}
                    disabled={adding}
                    data-testid="add-custom-row"
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-b border-gray-100 last:border-b-0 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium transition disabled:opacity-60"
                  >
                    {adding ? (
                      <Loader2 className="w-4 h-4 shrink-0 animate-spin" strokeWidth={2.5} />
                    ) : (
                      <Plus className="w-4 h-4 shrink-0" strokeWidth={3} />
                    )}
                    <span>Add &ldquo;{query.trim()}&rdquo;</span>
                  </button>
                )}

                {/* Empty state — no matches and not showing Add row */}
                {filtered.length === 0 && !showAddRow && (
                  <p className="text-sm text-gray-400 py-8 text-center px-4">
                    No categories match your search.
                  </p>
                )}
              </>
            )}
          </div>

          {/* ── Pinned footer ── */}
          <div className="shrink-0 pt-3">
            <button
              onClick={handleNext}
              disabled={saving || !selected}
              className="btn w-full bg-primary text-white py-2.5 text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition"
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
          </div>

        </div>
      </div>
    </>
  );
};

export default CategoryStep;

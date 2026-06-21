// client/src/components/services/ServiceCategoryPicker.jsx
// One category per service, drawn from the host's own categories.
// 1 category  → auto-assigned, shown as a read-only chip.
// 2+ (Pro)    → required single-select chips.
export default function ServiceCategoryPicker({ categories = [], value, onChange }) {
  if (!categories.length) return null;

  if (categories.length === 1) {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border border-primary bg-primary/5 text-primary">
          {categories[0].label}
        </span>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Category <span className="text-red-500">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => onChange(c.slug)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
              value === c.slug
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

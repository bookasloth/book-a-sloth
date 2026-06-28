// client/src/components/services/ServiceCategoryPicker.jsx
// Single-select service category, drawn from the ACTIVE service categories for
// the host's primary profession (service_categories WHERE primary_category = …).
// categories: [{ id, name, slug }]  ·  value: slug  ·  onChange(slug)
export default function ServiceCategoryPicker({ categories = [], value, onChange }) {
  // No service categories defined for this profession → nothing to pick.
  if (!categories.length) return null;

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
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}

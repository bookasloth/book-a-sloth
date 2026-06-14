/**
 * CategoryFilter.jsx
 * Horizontal scrollable category chips for the Explore page.
 * Props:
 *   categories  — [{ id, label, slug, icon_url? }]
 *   selected    — currently selected slug ('' = All)
 *   onChange    — fn(slug)
 */
export default function CategoryFilter({ categories = [], selected = '', onChange }) {
  const all = [{ id: '__all__', label: 'All', slug: '' }, ...categories];

  return (
    <div className="relative">
      {/* Fade edges on scroll */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-12
                      bg-gradient-to-l from-[#FFF8EE] to-transparent z-10" />

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {all.map((cat) => {
          const active = cat.slug === selected;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.slug)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[4px]
                          text-[13px] font-semibold border-2 border-[#1E1E1E]
                          transition-all duration-100
                          ${active
                            ? 'bg-[#FE5100] text-white shadow-[2px_2px_0_#1E1E1E]'
                            : 'bg-white text-[#1E1E1E] hover:bg-[#FFF8EE] shadow-[2px_2px_0_#1E1E1E] hover:shadow-[3px_3px_0_#1E1E1E]'
                          }`}
            >
              {cat.icon_url && (
                <img src={cat.icon_url} alt="" className="w-4 h-4 object-contain" />
              )}
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

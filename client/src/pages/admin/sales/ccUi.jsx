// Small Cold Calling building blocks on the admin tokens (adm-*), so they follow
// the admin light/dark theme. dashboard/ui's Tabs/SegmentedControl are host-side
// (fixed gray palette) and don't theme in admin.

/** options: [{ value, label, count? }] */
export function Chips({ options, value, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-1 p-1 rounded-xl adm-chip">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={on} onClick={() => onChange(o.value)}
            className={`!min-h-0 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors ${on ? 'adm-card adm-t1 shadow-sm' : 'adm-t3 hover:adm-t1'}`}>
            {o.label}{o.count != null && <span className="ml-1 adm-t3 font-medium">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** tabs: [{ value, label }] */
export function TabBar({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-5 border-b adm-border">
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <button key={t.value} type="button" role="tab" aria-selected={on} onClick={() => onChange(t.value)}
            className={`!min-h-0 -mb-px py-2.5 text-[13.5px] font-semibold border-b-2 transition-colors ${on ? 'border-[#FE5100] text-[#FE5100]' : 'border-transparent adm-t3 hover:adm-t1'}`}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className="text-[15px] font-bold adm-t1" style={{ fontFamily: "'Plus Jakarta Sans',Poppins,sans-serif" }}>{children}</h2>
      {right}
    </div>
  );
}

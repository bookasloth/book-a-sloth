import HostBackground from '../backgrounds/HostBackground';
import { getBackground } from '../backgrounds/registry';

// Title-case a raw key as a fallback when the registry has no entry yet.
// 'galaxy' → 'Galaxy', 'dot-grid' → 'Dot Grid'.
const titleCase = (k) =>
  String(k)
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export default function BackgroundPicker({ color, enabled = [], value, onChange }) {
  const options = [
    { key: null, label: 'None' },
    ...enabled.map((e) => ({ ...e, label: getBackground(e.key)?.label || titleCase(e.key) })),
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {options.map((o) => {
        const selected = value === o.key || (o.key === null && !value);
        return (
          <button
            type="button"
            key={o.key || 'none'}
            onClick={() => onChange(o.key)}
            className={`relative h-28 rounded-xl overflow-hidden border-2 transition ${selected ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-gray-300'}`}>
            {o.key ? (
              <HostBackground typeKey={o.key} color={color} params={o.params} />
            ) : (
              <span className="absolute inset-0 grid place-items-center text-gray-300 text-2xl" aria-hidden>&times;</span>
            )}
            <span className="absolute bottom-1 left-2 text-xs font-semibold text-gray-700 bg-white/70 px-1.5 rounded">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

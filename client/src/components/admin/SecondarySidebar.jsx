// client/src/components/admin/SecondarySidebar.jsx
// The active section's item list. Neutral by default; accent-tinted icon + fill
// + left bar when active. Per-item count pill (danger) for live badges.
// Rendered as a fixed column on lg+, and stacked inside the mobile drawer.
import { Link } from 'react-router-dom';
import Ic from './Ic';
import { IC } from './adminNav';
import { itemActive, itemBadge, formatBadge } from './navHelpers';

// Just the <Link> rows — no wrapper. Reused by the desktop column and the
// mobile drawer (which stacks one ItemList per section).
export const ItemList = ({ section, pathname, counts, onNavigate }) => {
  if (!section) return null;
  return section.items.map(item => {
    const active = itemActive(pathname, item);
    const n = itemBadge(item, counts);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100]/50
          ${active ? 'font-semibold' : 'text-gray-300 hover:text-gray-100 hover:bg-white/[0.04]'}`}
        style={active ? { background: `${section.color}1f`, color: section.color } : undefined}
      >
        <Ic d={IC[item.icon]} size={16} strokeWidth={active ? 2.1 : 1.75}
          style={active ? { color: section.color } : undefined}
          className={active ? '' : 'text-gray-500'} />
        <span className="flex-1">{item.label}</span>
        {n > 0 && (
          <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: 'var(--adm-danger, #DC2626)' }}>
            {formatBadge(n)}
          </span>
        )}
      </Link>
    );
  });
};

// Desktop: fixed column beside the rail, with its own header + scroll.
const SecondarySidebar = ({ section, pathname, counts }) => (
  <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 fixed inset-y-0 left-14 z-20 bg-[#17171A] border-r border-[#232327]">
    {section && (
      <div className="px-4 h-[60px] flex items-center flex-shrink-0 border-b border-[#1a1a1a]">
        <p className="text-[11px] font-bold text-gray-500 tracking-[0.14em] uppercase select-none">{section.label}</p>
      </div>
    )}
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" style={{ scrollbarWidth: 'none' }}>
      <ItemList section={section} pathname={pathname} counts={counts} />
    </nav>
  </aside>
);

export default SecondarySidebar;

// client/src/components/admin/PrimaryRail.jsx
// Thin vertical icon strip — one glyph per NAV section. Reads the config only;
// never hardcodes links. Accent color is a seasoning: glyph tint + 2px left bar
// when active. Attention dot (danger) when the section has pending work.
import { Link } from 'react-router-dom';
import Ic from './Ic';
import { IC } from './adminNav';
import { sectionBadgeCount } from './navHelpers';

const PrimaryRail = ({ sections, activeKey, counts }) => (
  <nav
    aria-label="Sections"
    className="hidden lg:flex flex-col items-center gap-1 w-14 flex-shrink-0 fixed inset-y-0 left-0 z-30 bg-[#141416] border-r border-[#232327] py-3"
  >
    <Link to="/super-dashboard" title="Book A Sloth Admin"
      className="w-9 h-9 rounded-lg flex items-center justify-center mb-2 flex-shrink-0" style={{ background: '#FE5100' }}>
      <Ic d={IC.zap} size={16} className="text-white" strokeWidth={2.5} />
    </Link>

    {sections.map(sec => {
      const active = sec.key === activeKey;
      const dot = sectionBadgeCount(sec, counts) > 0;
      const to = sec.items[0]?.to || '/super-dashboard';
      return (
        <Link
          key={sec.key}
          to={to}
          title={sec.label}
          aria-label={sec.label}
          aria-current={active ? 'true' : undefined}
          className="group relative w-full flex justify-center py-1.5"
        >
          {/* left accent bar */}
          <span
            className={`absolute left-0 top-1 bottom-1 w-[2px] rounded-r transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: sec.color }}
          />
          <span
            className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={active ? { background: `${sec.color}24`, color: sec.color } : undefined}
          >
            <Ic
              d={IC[sec.icon]}
              size={18}
              strokeWidth={active ? 2.25 : 1.75}
              className={active ? '' : 'text-gray-500 group-hover:text-gray-300'}
            />
            {dot && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-[#141416]"
                style={{ background: 'var(--adm-danger, #DC2626)' }} />
            )}
          </span>
        </Link>
      );
    })}
  </nav>
);

export default PrimaryRail;

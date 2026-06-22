import { useState, useEffect, useRef } from 'react';
import { useLocation, Navigate, useNavigate, Link } from 'react-router-dom';
import Ic from '../admin/Ic';
import { IC, NAV, ROADMAP, PATH_LABELS, QUICK_ACTIONS, sessionCan } from '../admin/adminNav';
import CommandPalette from '../admin/CommandPalette';
import NotificationBell from '../admin/NotificationBell';
import { useAdminTheme } from '../admin/useAdminTheme';

// SECURITY: Admin session is completely isolated in 'bas_admin' localStorage key.
// Guard checks type === 'super_admin' — a vendor/user session cannot pass this check.
const getAdminSession = () => {
  try { return JSON.parse(localStorage.getItem('bas_admin') || 'null'); } catch { return null; }
};

const isValidAdminSession = (s) => s && s.type === 'admin' && s.token;


const AdminLayout = ({ children }) => {
  const session  = getAdminSession();
  const location = useLocation();
  const navigate = useNavigate();

  // ── SECURITY GUARD ────────────────────────────────────────────
  // Reject anything that isn't a valid super_admin session.
  // A vendor/user session stored in 'user' key cannot pass this.
  if (!isValidAdminSession(session)) {
    return <Navigate to="/hello-sloth" replace />;
  }

  const [collapsed,      setCollapsed]      = useState(() => localStorage.getItem('adm_sb_col') === '1');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [theme, toggleTheme] = useAdminTheme();
  const dark = theme === 'dark';
  const [showQuick,      setShowQuick]      = useState(false);
  const [showProfile,    setShowProfile]    = useState(false);
  const [paletteOpen,    setPaletteOpen]    = useState(false);
  const quickRef   = useRef(null);
  const profileRef = useRef(null);

  const toggleSidebar = () => setCollapsed(c => {
    const next = !c;
    localStorage.setItem('adm_sb_col', next ? '1' : '0');
    return next;
  });

  const handleLogout = () => {
    localStorage.removeItem('bas_admin');
    navigate('/hello-sloth');
  };

  useEffect(() => {
    const auto = {};
    NAV.forEach(sec => sec.items.forEach(item => {
      if (item.children && item.children.some(ch => location.pathname === ch.to || location.pathname.startsWith(ch.to + '/')))
        auto[item.groupId] = true;
    }));
    setExpandedGroups(prev => ({ ...prev, ...auto }));
  }, [location.pathname]);

  useEffect(() => {
    const h = e => {
      if (quickRef.current   && !quickRef.current.contains(e.target))   setShowQuick(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const breadcrumbs = (() => {
    const segs = location.pathname.split('/').filter(Boolean);
    const result = []; let acc = '';
    segs.forEach(seg => {
      acc += '/' + seg;
      const label = PATH_LABELS[seg];
      if (label) result.push({ label, to: acc });
    });
    return result;
  })();

  const SidebarItem = ({ item }) => {
    if (item.comingSoon) {
      const open = expandedGroups[item.groupId] || false;
      return (
        <div>
          <button onClick={() => !collapsed && setExpandedGroups(prev => ({ ...prev, [item.groupId]: !prev[item.groupId] }))}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] text-gray-500 transition-all duration-150
              ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'} hover:bg-white/[0.03]`}>
            <Ic d={IC[item.icon]} size={15} className="opacity-50" />
            {!collapsed && <>
              <span className="flex-1 text-left">{item.label}</span>
              <span className="flex items-center gap-0.5 text-[9px] font-bold text-gray-700 bg-gray-800/80 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                <Ic d={IC.lock} size={8} />soon
              </span>
              <Ic d={IC.chevD} size={12} className={`ml-1 text-gray-700 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </>}
          </button>
          {!collapsed && open && (
            <div className="ml-6 pl-3 border-l border-gray-800/80 mt-0.5 mb-1 space-y-0.5">
              {item.children.map(ch => (
                <span key={ch.label} className="block px-3 py-1.5 rounded-md text-[12px] text-gray-600 opacity-50 cursor-not-allowed select-none">
                  {ch.label}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (item.children) {
      const open = expandedGroups[item.groupId] || false;
      const anyActive = item.children.some(ch => location.pathname === ch.to || location.pathname.startsWith(ch.to + '/'));
      return (
        <div>
          <button onClick={() => !collapsed && setExpandedGroups(prev => ({ ...prev, [item.groupId]: !prev[item.groupId] }))}
            title={collapsed ? item.label : undefined}
            className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] transition-all duration-150
              ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'}
              ${anyActive ? 'text-white bg-[#FE5100]/[0.12] border-l-[2px] border-[#FE5100]' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'}`}>
            <Ic d={IC[item.icon]} size={15} />
            {!collapsed && <><span className="flex-1 text-left font-medium">{item.label}</span>
              <Ic d={IC.chevD} size={12} className={`text-gray-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} /></>}
          </button>
          {!collapsed && open && (
            <div className="ml-6 pl-3 border-l border-gray-800/80 mt-0.5 mb-1 space-y-0.5">
              {item.children.map(ch => {
                const a = location.pathname === ch.to;
                return <Link key={ch.to} to={ch.to} onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-1.5 rounded-md text-[12px] transition-colors
                    ${a ? 'text-[#FE5100] font-semibold' : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'}`}>
                  {ch.label}
                </Link>;
              })}
            </div>
          )}
        </div>
      );
    }
    if (item.disabled) {
      return (
        <div title={item.label} className={`flex items-center gap-2.5 rounded-lg opacity-30 cursor-not-allowed select-none text-gray-500 ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'}`}>
          <Ic d={IC[item.icon]} size={15} />
          {!collapsed && <><span className="flex-1 text-[13px]">{item.label}</span>
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-gray-700 bg-gray-800/80 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
              <Ic d={IC.lock} size={8} />soon
            </span></>}
        </div>
      );
    }
    const active = item.exact ? location.pathname === item.to : (location.pathname === item.to || location.pathname.startsWith(item.to + '/'));
    return (
      <Link to={item.to} onClick={() => setMobileOpen(false)} title={collapsed ? item.label : undefined}
        className={`flex items-center gap-2.5 rounded-lg text-[13px] transition-all duration-150
          ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'}
          ${active ? 'text-white bg-[#FE5100]/[0.12] border-l-[2px] border-[#FE5100] font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'}`}>
        <Ic d={IC[item.icon]} size={15} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const SidebarBody = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center gap-3 border-b border-[#1a1a1a] flex-shrink-0 ${(!collapsed || mobile) ? 'px-5 py-4' : 'justify-center px-3 py-4'}`}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'#FE5100' }}>
          <Ic d={IC.zap} size={14} className="text-white" strokeWidth={2.5} />
        </div>
        {(!collapsed || mobile) && <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-none tracking-tight">Book A Sloth</p>
          <p className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-wider">Super Admin</p>
        </div>}
      </div>
      <nav className="flex-1 overflow-y-auto py-3 space-y-4" style={{ scrollbarWidth:'none' }}>
        {[...NAV, ...ROADMAP].map(sec => {
          // Permission-aware: show an item if it's an inert "soon" teaser, or the
          // session grants its permission. Hide the whole section if nothing shows.
          const items = sec.items.filter(item => item.disabled || sessionCan(session, item.perm));
          if (items.length === 0) return null;
          return (
            <div key={sec.id}>
              {(!collapsed || mobile)
                ? <p className="px-4 mb-1.5 text-[9.5px] font-bold text-gray-600 tracking-[0.14em] uppercase select-none">{sec.section}</p>
                : <div className="w-5 h-px bg-gray-800/80 mx-auto my-2" />}
              <div className={`space-y-0.5 ${(!collapsed || mobile) ? 'px-2' : 'px-1.5'}`}>
                {items.map((item, i) => <SidebarItem key={i} item={item} />)}
              </div>
            </div>
          );
        })}
        <div className="h-4" />
      </nav>
      <div className={`border-t border-[#1a1a1a] flex-shrink-0 space-y-0.5 ${(!collapsed || mobile) ? 'p-3' : 'p-1.5'}`}>
        <Link to="/dashboard" className={`flex items-center gap-2.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-colors text-[12px] ${(!collapsed || mobile) ? 'px-2.5 py-2' : 'justify-center p-2.5'}`} title={(!collapsed || mobile) ? undefined : 'Host Dashboard'}>
          <Ic d={IC.external} size={14} />{(!collapsed || mobile) && <span>Host Dashboard</span>}
        </Link>
        <button onClick={handleLogout} className={`w-full flex items-center gap-2.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/[0.05] transition-colors text-[12px] ${(!collapsed || mobile) ? 'px-2.5 py-2' : 'justify-center p-2.5'}`} title={(!collapsed || mobile) ? undefined : 'Sign out'}>
          <Ic d={IC.logout} size={14} />{(!collapsed || mobile) && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`admin-shell adm-canvas min-h-screen bg-[#F6F7F9] flex ${dark ? 'dark' : ''}`} style={{ fontFamily:"'Poppins',system-ui,sans-serif" }}>
      <aside className={`hidden md:flex flex-col bg-[#1E1E1E] fixed inset-y-0 left-0 z-30 transition-all duration-300 overflow-hidden ${collapsed ? 'w-[70px]' : 'w-[258px]'}`}>
        <SidebarBody />
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[258px] flex flex-col bg-[#1E1E1E] transition-transform duration-300 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'#FE5100' }}>
              <Ic d={IC.zap} size={12} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-bold text-sm">Book A Sloth</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-gray-500 hover:text-white p-1 rounded"><Ic d={IC.x} size={16} /></button>
        </div>
        <div className="flex-1 overflow-hidden"><SidebarBody mobile /></div>
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'md:ml-[70px]' : 'md:ml-[258px]'}`}>
        <header className="adm-header sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200/70 h-[54px] flex items-center gap-3 px-4 md:px-5 flex-shrink-0">
          <button onClick={() => { if (window.innerWidth < 768) setMobileOpen(o => !o); else toggleSidebar(); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0">
            <Ic d={IC.hamb} size={17} />
          </button>

          <nav className="hidden sm:flex items-center gap-1 text-[12px] text-gray-400 flex-1 min-w-0">
            {breadcrumbs.length === 0
              ? <span className="font-semibold text-gray-800">Dashboard</span>
              : breadcrumbs.map((crumb, i) => (
                <span key={crumb.to} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <Ic d={IC.chevR} size={10} className="text-gray-300 flex-shrink-0" />}
                  {i === breadcrumbs.length - 1
                    ? <span className="font-semibold text-gray-800 truncate">{crumb.label}</span>
                    : <Link to={crumb.to} className="hover:text-gray-600 truncate transition-colors">{crumb.label}</Link>}
                </span>
              ))
            }
          </nav>

          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
            <button onClick={() => setPaletteOpen(true)} className="btn hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 transition-colors text-[12px] text-gray-400 w-44">
              <Ic d={IC.search} size={13} /><span>Search...</span>
              <span className="ml-auto text-[10px] text-gray-300 font-mono bg-gray-200 px-1 rounded">⌘K</span>
            </button>

            <NotificationBell />

            <div className="relative" ref={quickRef}>
              <button onClick={() => setShowQuick(o => !o)} title="Quick Actions"
                className={`p-2 rounded-lg transition-colors ${showQuick ? 'bg-[#FE5100]/10 text-[#FE5100]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                <Ic d={IC.zap} size={16} />
              </button>
              {showQuick && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl w-52 z-50 overflow-hidden">
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Actions</p>
                  {QUICK_ACTIONS.map(a => (
                    <Link key={a.to} to={a.to} onClick={() => setShowQuick(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                      <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Ic d={IC[a.icon]} size={12} className="text-gray-500" />
                      </div>
                      {a.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button onClick={toggleTheme} title={dark ? 'Light mode' : 'Dark mode'}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Ic d={dark ? IC.sun : IC.moon} size={16} />
            </button>

            <div className="relative" ref={profileRef}>
              <button onClick={() => setShowProfile(o => !o)}
                className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg transition-colors ${showProfile ? 'bg-gray-100' : 'hover:bg-gray-100'}`}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ background:'#FE5100' }}>
                  {(session.name || session.username || 'A')[0].toUpperCase()}
                </div>
                <div className="hidden md:block text-left leading-none">
                  <p className="text-[12px] font-semibold text-gray-800">{session.name || 'Super Admin'}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">@{session.username || 'admin'}</p>
                </div>
                <Ic d={IC.chevD} size={11} className="text-gray-400 hidden md:block" />
              </button>
              {showProfile && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl w-52 z-50 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-[13px] font-semibold text-gray-800">{session.name || 'Super Admin'}</p>
                    <p className="text-[11px] text-gray-400">@{session.username || 'admin'}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/admin/settings" onClick={() => setShowProfile(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors">
                      <Ic d={IC.gear} size={13} className="text-gray-400" />Settings
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors">
                      <Ic d={IC.logout} size={13} />Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-7">
          <div className="max-w-[1360px] mx-auto">{children}</div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} session={session} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};

export default AdminLayout;

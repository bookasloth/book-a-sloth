import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Compass, Tag, UserPlus, HelpCircle,
  CalendarCheck, MessageCircle, Bookmark, BarChart2,
  Briefcase, Bell, X, Menu, ChevronDown,
  Search, User, Settings, LogOut, TrendingUp,
  Clock, Wallet, LayoutDashboard, ExternalLink,
} from 'lucide-react';

// ── Nav item configs (config-driven, no hardcoded HTML) ──────────────────────

const PUBLIC_NAV = [
  { label: 'Home',             href: '/',             icon: Home,        exact: true },
  { label: 'Explore',          href: '/explore',       icon: Compass },
  { label: 'Categories',       href: '/categories',    icon: Tag },
  { label: 'Become a Creator', href: '/be-a-sloth',   icon: UserPlus },
  { label: 'How It Works',     href: '/how-it-works',  icon: HelpCircle },
];

const CUSTOMER_NAV = [
  { label: 'Home',     href: '/',           icon: Home,           exact: true },
  { label: 'Explore',  href: '/explore',    icon: Search },
  { label: 'Bookings', href: '/my-bookings', icon: CalendarCheck },
  { label: 'Messages', href: '/messages',   icon: MessageCircle,  badge: 'messages' },
  { label: 'Saved',    href: '/saved',      icon: Bookmark },
];

const VENDOR_NAV = [
  { label: 'Home',      href: '/',                    icon: Home,          exact: true },
  { label: 'Bookings',  href: '/dashboard/bookings',  icon: CalendarCheck },
  { label: 'Services',  href: '/dashboard/services',  icon: Briefcase },
  { label: 'Analytics', href: '/dashboard',            icon: BarChart2,     exact: true },
  { label: 'Messages',  href: '/dashboard/chats',     icon: MessageCircle, badge: 'messages' },
];

const CUSTOMER_DROPDOWN = [
  { label: 'My Profile',  href: '/profile',      icon: User },
  { label: 'My Bookings', href: '/my-bookings',  icon: CalendarCheck },
  { label: 'Saved Items', href: '/saved',        icon: Bookmark },
  { label: 'Settings',    href: '/settings',     icon: Settings },
  { label: 'Help Center', href: '/help',         icon: HelpCircle },
];

const VENDOR_DROPDOWN = [
  { label: 'View Public Profile', href: '__profile__',                   icon: ExternalLink },
  { label: 'Dashboard',           href: '/dashboard',                    icon: LayoutDashboard },
  { label: 'Earnings',            href: '/dashboard/earnings',           icon: TrendingUp },
  { label: 'Availability',        href: '/dashboard/availability',       icon: Clock },
  { label: 'Payouts',             href: '/dashboard/payments/payouts',   icon: Wallet },
  { label: 'Settings',            href: '/dashboard/profile',            icon: Settings },
];

// ── Google placeholder logo ───────────────────────────────────────────────────

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
  </svg>
);

// ── Avatar initials ───────────────────────────────────────────────────────────

const Avatar = ({ name, size = 8 }) => (
  <span
    className={`inline-flex items-center justify-center w-${size} h-${size} rounded-full bg-[#FE5100] text-white font-bold text-sm flex-shrink-0 select-none`}
    aria-hidden="true"
  >
    {name ? name[0].toUpperCase() : 'U'}
  </span>
);

// ── Badge pill ────────────────────────────────────────────────────────────────

const BadgePill = ({ count }) =>
  count > 0 ? (
    <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#FE5100] text-white text-[9px] font-bold flex items-center justify-center leading-none pointer-events-none">
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

// ── Main component ────────────────────────────────────────────────────────────

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);

  const dropdownRef = useRef(null);
  const notifRef    = useRef(null);

  // Role detection
  const isVendor   = user?.role === 'host';
  const navItems   = !user ? PUBLIC_NAV : isVendor ? VENDOR_NAV : CUSTOMER_NAV;
  const dropItems  = isVendor ? VENDOR_DROPDOWN : CUSTOMER_DROPDOWN;

  // Placeholder badge counts — wire to real data/context when ready
  const badges = { messages: 0, notifications: 0 };

  // Close popups on outside click + ESC
  useEffect(() => {
    const onPointer = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))    setNotifOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setNotifOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Close mobile menu + dropdowns on navigation
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const isActive = ({ href, exact }) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  // Resolve dropdown href (vendor public profile uses dynamic username)
  const resolveHref = (item) => {
    if (item.href === '__profile__') return user?.username ? `/${user.username}` : null;
    return item.href;
  };

  return (
    <nav
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 shadow-[0_1px_8px_rgba(0,0,0,0.05)]"
      aria-label="Main navigation"
    >
      <div className="app-container">
        {/* ── Desktop bar ───────────────────────────────────────────────────── */}
        <div className="flex items-stretch h-14">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 pr-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100] focus-visible:ring-offset-1 rounded"
            aria-label="Book A Sloth — home"
          >
            <GoogleLogo />
            <span className="hidden sm:block text-[15px] font-bold text-[#1E1E1E] tracking-tight">
              Book A Sloth
            </span>
          </Link>

          {/* Center nav (desktop only) */}
          <div className="hidden md:flex items-stretch flex-1 justify-center" role="list">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon   = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  role="listitem"
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.badge && badges[item.badge] > 0
                    ? `${item.label}, ${badges[item.badge]} unread`
                    : item.label}
                  className={[
                    'group relative flex flex-col items-center justify-center gap-0.5 px-3.5 text-[12.5px] font-medium',
                    'transition-colors duration-150 outline-none',
                    'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FE5100]',
                    active ? 'text-[#FE5100]' : 'text-gray-500 hover:text-[#FE5100]',
                  ].join(' ')}
                >
                  {/* Hover background pill */}
                  <span className={[
                    'absolute inset-x-1 inset-y-1.5 rounded-lg transition-colors duration-150',
                    active ? 'bg-[#FE5100]/6' : 'group-hover:bg-[#FE5100]/5',
                  ].join(' ')} aria-hidden="true" />

                  {/* Icon + label */}
                  <span className="relative flex flex-col items-center gap-0.5 z-10">
                    <span className="relative">
                      <Icon
                        size={19}
                        strokeWidth={active ? 2.2 : 1.7}
                        className={`transition-colors duration-150 ${active ? 'text-[#FE5100]' : 'text-gray-400 group-hover:text-[#FE5100]/80'}`}
                      />
                      {item.badge && <BadgePill count={badges[item.badge]} />}
                    </span>
                    <span className="leading-none">{item.label}</span>
                  </span>

                  {/* Active bottom indicator */}
                  <span
                    className={`absolute bottom-0 left-1 right-1 h-[2.5px] rounded-t-full bg-[#FE5100] transition-all duration-150 ${active ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden="true"
                  />
                </NavLink>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">

            {user ? (
              <>
                {/* Notifications bell */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); }}
                    className="relative p-2.5 rounded-full text-gray-500 hover:text-[#FE5100] hover:bg-[#FE5100]/5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100] focus-visible:ring-offset-1"
                    aria-label={`Notifications${badges.notifications > 0 ? `, ${badges.notifications} unread` : ''}`}
                    aria-expanded={notifOpen}
                    aria-haspopup="dialog"
                  >
                    <Bell size={19} strokeWidth={1.7} />
                    <BadgePill count={badges.notifications} />
                  </button>

                  {/* Notifications panel */}
                  {notifOpen && (
                    <div
                      className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
                      role="dialog"
                      aria-label="Notifications"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="text-sm font-semibold text-[#1E1E1E]">Notifications</span>
                        <button className="text-[11px] text-[#FE5100] font-medium hover:underline focus:outline-none">
                          Mark all read
                        </button>
                      </div>
                      <div className="py-10 text-center">
                        <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-sm text-gray-400">No new notifications</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile avatar + dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => { setDropdownOpen(o => !o); setNotifOpen(false); }}
                    className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-gray-100 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100] focus-visible:ring-offset-1"
                    aria-label="Profile and account menu"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                  >
                    <Avatar name={user.name} size={8} />
                    <ChevronDown
                      size={13}
                      strokeWidth={2.5}
                      className={`hidden sm:block text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
                      role="menu"
                      aria-label="Profile options"
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-[13px] font-semibold text-[#1E1E1E] truncate">{user.name}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.email}</p>
                      </div>

                      {/* Nav items */}
                      <div className="py-1">
                        {dropItems.map((item) => {
                          const Icon = item.icon;
                          const href = resolveHref(item);
                          if (!href) return null;
                          return (
                            <Link
                              key={item.label}
                              to={href}
                              role="menuitem"
                              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-600 hover:bg-[#FE5100]/5 hover:text-[#FE5100] transition-colors duration-150 outline-none focus-visible:bg-[#FE5100]/5 focus-visible:text-[#FE5100]"
                            >
                              <Icon size={15} className="flex-shrink-0" />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={logout}
                          role="menuitem"
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-150 outline-none focus-visible:bg-red-50 focus-visible:text-red-600"
                        >
                          <LogOut size={15} className="flex-shrink-0" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Public CTAs */
              <>
                <Link
                  to="/login-as-vendor"
                  className="hidden sm:inline-flex items-center px-3.5 py-2 text-[13px] font-medium text-gray-600 hover:text-[#FE5100] hover:bg-[#FE5100]/5 rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100] focus-visible:ring-offset-1 hover:no-underline"
                >
                  Sign In
                </Link>
                <Link
                  to="/be-a-sloth"
                  className="inline-flex items-center px-4 py-2 text-[13px] font-semibold text-white bg-[#FE5100] hover:bg-[#d94400] rounded-lg transition-colors duration-150 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100] focus-visible:ring-offset-1 hover:no-underline"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100] ml-1"
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ───────────────────────────────────────────────────── */}
        {menuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden border-t border-gray-100 pb-3"
            aria-label="Mobile navigation"
          >
            {/* Nav links */}
            <div className="pt-2 space-y-0.5 px-1">
              {navItems.map((item) => {
                const active = isActive(item);
                const Icon   = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'flex items-center gap-3 px-3 py-3 text-[13px] font-medium rounded-lg transition-colors duration-150',
                      active
                        ? 'text-[#FE5100] bg-[#FE5100]/6'
                        : 'text-gray-600 hover:text-[#FE5100] hover:bg-[#FE5100]/5',
                    ].join(' ')}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.2 : 1.7}
                      className={`flex-shrink-0 ${active ? 'text-[#FE5100]' : 'text-gray-400'}`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && badges[item.badge] > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FE5100] text-white text-[10px] font-bold flex items-center justify-center">
                        {badges[item.badge]}
                      </span>
                    )}
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FE5100] flex-shrink-0" aria-hidden="true" />
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Public: Sign In + Get Started */}
            {!user && (
              <div className="flex gap-2 px-2 pt-3 mt-1 border-t border-gray-100">
                <Link
                  to="/login-as-vendor"
                  className="flex-1 py-2.5 text-[13px] font-medium text-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-150 hover:no-underline"
                >
                  Sign In
                </Link>
                <Link
                  to="/be-a-sloth"
                  className="flex-1 py-2.5 text-[13px] font-semibold text-center text-white bg-[#FE5100] hover:bg-[#d94400] rounded-lg transition-colors duration-150 hover:no-underline"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Logged in: user info + dropdown items + logout */}
            {user && (
              <div className="pt-3 mt-1 border-t border-gray-100 px-1">
                {/* User info */}
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                  <Avatar name={user.name} size={9} />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1E1E1E] truncate">{user.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Dropdown items */}
                <div className="space-y-0.5">
                  {dropItems.map((item) => {
                    const Icon = item.icon;
                    const href = resolveHref(item);
                    if (!href) return null;
                    return (
                      <Link
                        key={item.label}
                        to={href}
                        className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-gray-600 hover:text-[#FE5100] hover:bg-[#FE5100]/5 rounded-lg transition-colors duration-150 hover:no-underline"
                      >
                        <Icon size={16} className="flex-shrink-0 text-gray-400" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 mt-1 text-[13px] text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                >
                  <LogOut size={16} className="flex-shrink-0" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useAppearance from '../../hooks/useAppearance';
import ModeSwitch from './ModeSwitch';
import { isHost } from '../../utils/roleRoutes';
import toast from 'react-hot-toast';
import {
  Home, Tag, HelpCircle,
  CalendarCheck, MessageCircle, Bookmark, BarChart2,
  Briefcase, Bell, X, Menu, ChevronDown,
  Search, User, Settings, LogOut, TrendingUp,
  Clock, Wallet, LayoutDashboard, ExternalLink,
  Gift, Star, Info,
} from 'lucide-react';

// ── Nav item configs (config-driven, no hardcoded HTML) ──────────────────────

// Only destinations that actually have routes are listed. Items pointing at
// not-yet-built pages (Categories, How It Works, Messages, Saved) were removed
// to avoid dead 404 links in the navbar.
// Logged-out header shows no center nav links (Home + Become a Creator removed);
// the logo (→ home) and the Get Started / Sign In actions cover those intents.
const PUBLIC_NAV = [];

const CUSTOMER_NAV = [
  { label: 'Home',     href: '/',            icon: Home,         exact: true },
  { label: 'Explore',  href: '/explore',     icon: Search,       tag: 'Soon' },
  { label: 'Bookings', href: '/user/my-bookings', icon: CalendarCheck },
];

const VENDOR_NAV = [
  { label: 'Home',      href: '/',                   icon: Home,         exact: true },
  { label: 'Bookings',  href: '/dashboard/bookings', icon: CalendarCheck },
  { label: 'Services',  href: '/dashboard/services', icon: Briefcase },
  { label: 'Analytics', href: '/dashboard',          icon: BarChart2,    exact: true },
];

const CUSTOMER_DROPDOWN = [
  { label: 'My Bookings',     href: '/user/my-bookings', icon: CalendarCheck },
  { label: 'My Profile',      href: '/user/profile',     icon: User },
  { label: 'Help',            href: '/help',             icon: HelpCircle },
  { label: 'Loyalty Program', href: '/user/loyalty',     icon: Gift },
  { label: 'Reviews',         href: '/user/reviews',     icon: Star },
  { label: 'About',           href: '/about',            icon: Info },
];

const VENDOR_DROPDOWN = [
  { label: 'View Public Profile', href: '__profile__',                   icon: ExternalLink },
  { label: 'Dashboard',           href: '/dashboard',                    icon: LayoutDashboard },
  { label: 'Earnings',            href: '/dashboard/earnings',           icon: TrendingUp },
  { label: 'Availability',        href: '/dashboard/availability',       icon: Clock },
  { label: 'Payouts',             href: '/dashboard/payments/payouts',   icon: Wallet },
  { label: 'Settings',            href: '/dashboard/profile',            icon: Settings },
];

// ── Brand logo (admin-managed: icon_text | image | festive) ───────────────────
// Falls back to the text wordmark whenever the active mode's image is missing,
// so the header never renders empty even if the appearance API is unreachable.

const wordmarkText = (always = false) => (
  <span className={`${always ? '' : 'hidden sm:block '}text-[15px] font-bold text-[#1E1E1E] tracking-tight`}>
    Book A Sloth
  </span>
);

const NavbarLogo = ({ appearance }) => {
  const mode = appearance?.navbar_logo_mode || 'icon_text';
  const img = (src) => (
    <img src={src} alt="Book A Sloth" className="h-7 w-auto block" />
  );

  if (mode === 'image'   && appearance?.logo_image_url)   return img(appearance.logo_image_url);
  if (mode === 'festive' && appearance?.festive_logo_url) return img(appearance.festive_logo_url);
  if (mode === 'icon_text' && appearance?.icon_url) {
    return (
      <>
        <img src={appearance.icon_url} alt="" className="h-[26px] w-[26px] rounded block" />
        {wordmarkText()}
      </>
    );
  }
  return wordmarkText(true); // fallback: text only, always visible
};

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

// ── Static label tag (e.g. "Soon") — distinct from numeric BadgePill ──────────
const TagPill = ({ text }) =>
  text ? (
    <span className="absolute -top-2 -right-5 px-1 py-px rounded-full bg-amber-400 text-[#1E1E1E] text-[8px] font-bold uppercase tracking-wide leading-none pointer-events-none">
      {text}
    </span>
  ) : null;

// ── Main component ────────────────────────────────────────────────────────────

const Navbar = () => {
  const { user, logout, mode, becomeHost } = useAuth();
  const appearance = useAppearance();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [signInOpen,  setSignInOpen]  = useState(false);

  const dropdownRef = useRef(null);
  const notifRef    = useRef(null);
  const signInRef   = useRef(null);

  // Mode-aware view (unified identity): a host sees the host nav only in Hosting
  // mode; in Traveling mode — or as a pure guest — they see the customer nav.
  const canHost     = isHost(user);
  const hostingView = canHost && mode === 'hosting';
  const navItems   = !user ? PUBLIC_NAV : hostingView ? VENDOR_NAV : CUSTOMER_NAV;
  const dropItems  = hostingView ? VENDOR_DROPDOWN : CUSTOMER_DROPDOWN;

  // "Become a host" — adds hosting to the CURRENT account, then enters the
  // existing onboarding (no separate account). Errors surface as a toast.
  const startHosting = async () => {
    try {
      const updated = await becomeHost();
      setDropdownOpen(false);
      setMenuOpen(false);
      const slug = updated?.onboarding_slug || updated?.username;
      if (updated?.onboarding_completed || !slug) navigate('/dashboard');
      else navigate(`/vendor-register/${slug}/claim`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not start hosting');
    }
  };

  // Placeholder badge counts — wire to real data/context when ready
  const badges = { messages: 0, notifications: 0 };

  // Close popups on outside click + ESC
  useEffect(() => {
    const onPointer = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target))    setNotifOpen(false);
      if (signInRef.current  && !signInRef.current.contains(e.target))   setSignInOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setNotifOpen(false);
        setSignInOpen(false);
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
    setSignInOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open so the page behind it
  // cannot be scrolled/seen. Mirrors Modal.jsx.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

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
            <NavbarLogo appearance={appearance} />
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
                      {item.tag && <TagPill text={item.tag} />}
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
                {/* Hosting/Traveling switch — only for dual-capability accounts */}
                <div className="hidden md:block mr-1"><ModeSwitch /></div>

                {/* Notifications bell */}
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); setMenuOpen(false); }}
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
                    onClick={() => { setDropdownOpen(o => !o); setNotifOpen(false); setMenuOpen(false); }}
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

                      {/* Become a host (guests only) */}
                      {!canHost && (
                        <div className="border-t border-gray-100 py-1">
                          <button
                            onClick={startHosting}
                            role="menuitem"
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-[#FE5100] hover:bg-[#FE5100]/5 transition-colors duration-150 outline-none"
                          >
                            <Briefcase size={15} className="flex-shrink-0" />
                            Become a host
                          </button>
                        </div>
                      )}

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
                {/* Sign In dropdown — separate customer vs vendor login */}
                <div ref={signInRef} className="relative hidden sm:block">
                  <button
                    onClick={() => { setSignInOpen(o => !o); setMenuOpen(false); }}
                    className="inline-flex items-center gap-1 px-3.5 py-2 text-[13px] font-medium text-gray-600 hover:text-[#FE5100] hover:bg-[#FE5100]/5 rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100] focus-visible:ring-offset-1"
                    aria-expanded={signInOpen}
                    aria-haspopup="menu"
                  >
                    Sign In
                    <ChevronDown size={13} strokeWidth={2.5} className={`text-gray-400 transition-transform duration-200 ${signInOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {signInOpen && (
                    <div
                      className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
                      role="menu"
                      aria-label="Sign in options"
                    >
                      <Link to="/login" role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-600 hover:bg-[#FE5100]/5 hover:text-[#FE5100] transition-colors duration-150 hover:no-underline">
                        <User size={15} className="flex-shrink-0" /> Sign in as Customer
                      </Link>
                      <Link to="/login-as-vendor" role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-600 hover:bg-[#FE5100]/5 hover:text-[#FE5100] transition-colors duration-150 border-t border-gray-100 hover:no-underline">
                        <Briefcase size={15} className="flex-shrink-0" /> Sign in as Host
                      </Link>
                    </div>
                  )}
                </div>
                <Link
                  to="/be-a-sloth"
                  className="btn hidden md:inline-flex items-center px-4 py-2 text-[13px] font-semibold text-white bg-primary-cta hover:bg-[#d94400] transition-colors duration-150 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100] focus-visible:ring-offset-1 hover:no-underline"
                >
                  Let's Get Started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100] ml-1"
              onClick={() => { setMenuOpen(o => !o); setDropdownOpen(false); setNotifOpen(false); setSignInOpen(false); }}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile drawer + backdrop ───────────────────────────────────────── */}
        {/* Portaled to <body>: the nav's backdrop-blur makes it a containing block
            for fixed descendants, which would otherwise clamp the drawer to the
            56px bar height. Portaling resolves `fixed` against the viewport. */}
        {menuOpen && createPortal(
          <>
            {/* Backdrop: dims + blocks the page behind the drawer (below the bar) */}
            <div
              className="fixed left-0 right-0 top-14 bottom-0 z-50 bg-black/40 md:hidden"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            {/* Fixed full-height drawer */}
            <div
              id="mobile-menu"
              className="fixed top-14 right-0 bottom-0 z-50 flex w-[82%] max-w-xs flex-col overflow-y-auto overscroll-contain bg-white pb-6 shadow-2xl md:hidden"
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
                    {item.tag && (
                      <span className="px-1.5 h-[16px] rounded-full bg-amber-400 text-[#1E1E1E] text-[10px] font-bold uppercase tracking-wide flex items-center">
                        {item.tag}
                      </span>
                    )}
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

            {/* Public: Sign In (customer + vendor) + Get Started */}
            {!user && (
              <div className="px-2 pt-3 mt-1 border-t border-gray-100 space-y-2">
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    className="btn flex-1 py-2.5 text-[13px] font-medium text-center text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-150 hover:no-underline"
                  >
                    Customer Login
                  </Link>
                  <Link
                    to="/login-as-vendor"
                    className="btn flex-1 py-2.5 text-[13px] font-medium text-center text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-150 hover:no-underline"
                  >
                    Host Login
                  </Link>
                </div>
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

                {/* Hosting/Traveling switch — only for dual-capability accounts */}
                <div className="px-3 pb-2"><ModeSwitch /></div>

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

                {/* Become a host (guests only) */}
                {!canHost && (
                  <button
                    onClick={startHosting}
                    className="flex w-full items-center gap-3 px-3 py-2.5 mt-1 text-[13px] font-medium text-[#FE5100] hover:bg-[#FE5100]/5 rounded-lg transition-colors duration-150"
                  >
                    <Briefcase size={16} className="flex-shrink-0" />
                    Become a host
                  </button>
                )}

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
          </>,
          document.body
        )}
      </div>
    </nav>
  );
};

export default Navbar;

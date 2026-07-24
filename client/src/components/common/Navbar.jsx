import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useAppearance from '../../hooks/useAppearance';
import UseCasesMegaMenu from './UseCasesMegaMenu';
import { USE_CASES_CONFIG } from './useCasesConfig';
import { isHost, routeRole } from '../../utils/roleRoutes';
import { getNotifications, markAllNotificationsRead, markNotificationRead, getGuestBookings } from '../../services/api';
import { getPlanBorderLabel, normalizePlan } from '../../utils/themeUtils';
import {
  Home, Tag, HelpCircle,
  CalendarCheck, MessageCircle, Bookmark, BarChart2,
  Briefcase, Bell, X, Menu, ChevronDown, ChevronRight,
  Search, User, Settings, LogOut, TrendingUp,
  Clock, Wallet, LayoutDashboard, ExternalLink,
  Gift, Star, Info, Compass, Cpu, HeartPulse,
  GraduationCap, Sparkles, Mail, Award, Layers, Headset,
} from 'lucide-react';

// ── Nav item configs (config-driven, no hardcoded HTML) ──────────────────────

// Help lives as its own top-level header link (high-intent), so it is
// deliberately absent from More to avoid a duplicate entry.
const MORE_MENU = [
  { label: 'How It Works', href: '/#how-it-works', icon: Sparkles },
  { label: 'FAQ',          href: '/#faq',          icon: MessageCircle },
  { label: 'Contact',      href: '/contact',       icon: Mail },
  { label: 'Careers',      href: '/careers',       icon: Briefcase },
  { label: 'About',        href: '/about',         icon: Info },
];

// Slim guest profile menu (logged-in guests). The navbar carries nothing but the
// profile dropdown — these are the only two destinations a guest needs.
const GUEST_MENU = [
  { label: 'All Bookings', href: '/user/my-bookings', icon: CalendarCheck },
  { label: 'Review',       href: '/user/reviews',     icon: Star },
];

// Slim host profile menu (logged-in hosts). A single flat list — the dashboard
// sidebar/bottom-bar owns full navigation, so the navbar only carries the few
// high-frequency host shortcuts. `__profile__` resolves to the public username
// route; `external: true` opens in a new tab. Account Manager → Bolt's BAS page.
const VENDOR_MENU = [
  { label: 'Upcoming Bookings',     href: '/dashboard/bookings',     icon: CalendarCheck },
  { label: 'Availability',          href: '/dashboard/availability', icon: Clock },
  { label: 'View Public Profile',   href: '__profile__',             icon: ExternalLink, external: true },
  { label: 'Talk to Account Manager', href: '/bolt958',              icon: Headset,      external: true },
  { label: 'Settings',              href: '/dashboard/profile',      icon: Settings },
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
        <img src={appearance.icon_url} alt="" width={26} height={26} decoding="async"
             className="h-[26px] w-[26px] rounded block" />
        {wordmarkText()}
      </>
    );
  }
  return wordmarkText(true); // fallback: text only, always visible
};

// ── Photo avatar (host) — real profile photo with initials fallback ──────────
// Literal size classes (never interpolated) so Tailwind's JIT emits them.
const PhotoAvatar = ({ user, className = 'h-11 w-11' }) =>
  user?.profile_image ? (
    <img
      src={user.profile_image}
      alt={user?.name || 'Profile'}
      className={`${className} rounded-full object-cover flex-shrink-0`}
    />
  ) : (
    <span
      className={`${className} inline-flex items-center justify-center rounded-full bg-[#FE5100] text-white font-bold flex-shrink-0 select-none`}
      aria-hidden="true"
    >
      {user?.name ? user.name[0].toUpperCase() : 'U'}
    </span>
  );

// ── Sloth avatar (guest) — always the brand mark, never initials/photo ───────
// Guests have no profile image; the spec calls for the Sloth mark every time.
// Uses the admin-managed icon, falling back to the bundled favicon (also Sloth).
// The fallback is favicon-96x96.png, not favicon.svg — the SVG is a 126 KiB
// traced export, far heavier than the raster for a 44px avatar.
const SlothAvatar = ({ appearance, className = 'h-11 w-11' }) => (
  <img
    src={appearance?.icon_url || '/favicon-96x96.png'}
    alt="Book A Sloth"
    className={`${className} rounded-full object-contain bg-[#FE5100]/10 p-1 flex-shrink-0`}
  />
);

// ── Profile dropdown pieces (shared desktop + mobile) ────────────────────────
const VendorProfileHeader = ({ user }) => (
  <div className="flex items-center gap-3">
    <PhotoAvatar user={user} />
    <div className="min-w-0 flex-1">
      <p className="text-[14px] font-semibold text-[#1E1E1E] truncate">{user?.name || 'Host'}</p>
      {user?.username && <p className="text-[12px] text-gray-400 truncate">@{user.username}</p>}
    </div>
  </div>
);

// Guest header: Sloth mark + "Hello," + the name from their most recent booking.
const GuestProfileHeader = ({ appearance, name }) => (
  <div className="flex items-center gap-3">
    <SlothAvatar appearance={appearance} />
    <div className="min-w-0 flex-1">
      <p className="text-[12px] text-gray-400 leading-tight">Hello,</p>
      <p className="text-[14px] font-semibold text-[#1E1E1E] truncate">{name || 'there'}</p>
    </div>
  </div>
);

const MembershipButton = ({ user, onClick }) => (
  <Link
    to="/dashboard/upgrade"
    onClick={onClick}
    className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-[#FE5100]/10 px-3 py-2 text-[12.5px] font-semibold text-[#FE5100] transition-colors hover:bg-[#FE5100]/15 hover:no-underline"
  >
    <Sparkles size={14} className="flex-shrink-0" />
    You are a {getPlanBorderLabel(normalizePlan(user?.plan))} Member
  </Link>
);

// Flat profile-menu renderer (host VENDOR_MENU or guest GUEST_MENU). Handles the
// `__profile__` username token and `external` (new-tab) links.
const MenuLinks = ({ items, user, onNavigate }) =>
  items.map((item) => {
    const Icon = item.icon;
    const href = item.href === '__profile__'
      ? (user?.username ? `/${user.username}` : '/dashboard/profile')
      : item.href;
    const cls =
      'flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-600 hover:bg-[#FE5100]/5 hover:text-[#FE5100] transition-colors duration-150 hover:no-underline outline-none focus-visible:bg-[#FE5100]/5 focus-visible:text-[#FE5100]';
    return item.external ? (
      <a key={item.label} href={href} target="_blank" rel="noreferrer" role="menuitem" onClick={onNavigate} className={cls}>
        <Icon size={15} className="flex-shrink-0 text-gray-400" /> {item.label}
      </a>
    ) : (
      <Link key={item.label} to={href} role="menuitem" onClick={onNavigate} className={cls}>
        <Icon size={15} className="flex-shrink-0 text-gray-400" /> {item.label}
      </Link>
    );
  });

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

// ── Self-contained header dropdown (Use Cases / More) ────────────────────────
// Owns its open state + outside-click/ESC/route-change close, so the public
// center nav can host several independent menus without shared wiring.
const NavDropdown = ({ label, icon: Icon, wide = false, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <div ref={ref} className="relative flex items-stretch">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          'group relative flex items-center gap-1 px-3.5 text-[12.5px] font-medium transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FE5100]',
          open ? 'text-[#FE5100]' : 'text-gray-500 hover:text-[#FE5100]',
        ].join(' ')}
      >
        {Icon && <Icon size={16} className={open ? 'text-[#FE5100]' : 'text-gray-400 group-hover:text-[#FE5100]/80'} />}
        {label}
        <ChevronDown size={13} strokeWidth={2.5} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className={`absolute left-0 top-full mt-0 ${wide ? 'w-[32rem]' : 'w-56'} bg-white rounded-xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden`}
          role="menu"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// ── Public center nav (logged-out): Use Cases mega + Pricing + More ──────────
const PublicCenterNav = () => (
  <>
    <UseCasesMegaMenu />

    <Link to="/pricing" className="flex items-center px-3.5 text-[12.5px] font-medium text-gray-500 transition-colors hover:text-[#FE5100] hover:no-underline">
      Pricing
    </Link>

    <Link to="/help" className="flex items-center px-3.5 text-[12.5px] font-medium text-gray-500 transition-colors hover:text-[#FE5100] hover:no-underline">
      Help
    </Link>

    <NavDropdown label="More">
      <div className="py-1">
        {MORE_MENU.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.label} to={m.href} role="menuitem" className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-600 transition-colors hover:bg-[#FE5100]/5 hover:text-[#FE5100] hover:no-underline">
              <Icon size={15} className="flex-shrink-0 text-gray-400" /> {m.label}
            </Link>
          );
        })}
      </div>
    </NavDropdown>
  </>
);

// ── Main component ────────────────────────────────────────────────────────────

const Navbar = () => {
  const { user, logout, mode, setMode } = useAuth();
  const appearance = useAppearance();
  const location = useLocation();

  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [signInOpen,  setSignInOpen]  = useState(false);
  const [notifs,      setNotifs]      = useState([]);
  const [unread,      setUnread]      = useState(0);
  const [guestName,   setGuestName]   = useState('');

  const dropdownRef = useRef(null);
  const notifRef    = useRef(null);
  const signInRef   = useRef(null);

  // Mode-aware view (unified identity): a host sees the host nav only in Hosting
  // mode; in Traveling mode — or as a pure guest — they see the guest nav.
  const canHost     = isHost(user);
  const hostingView = canHost && mode === 'hosting';
  // Logged-in users get a deliberately empty center nav — the profile dropdown is
  // the only navbar surface (hosts navigate via the dashboard; guests only need
  // bookings/reviews). Logged-out users render PublicCenterNav.
  const navItems     = [];

  // Notification feed — role-filtered (host vs guest), loaded on mount and on panel open
  const notifRole = hostingView ? 'host' : 'guest';
  const loadNotifs = useCallback(() => {
    if (!user) return;
    getNotifications(notifRole)
      .then(({ data }) => { setNotifs(data.notifications || []); setUnread(data.unreadCount || 0); })
      .catch(() => {});
  }, [user, notifRole]);
  useEffect(() => { loadNotifs(); }, [loadNotifs]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (notifOpen) loadNotifs(); }, [notifOpen]);

  // Guest greeting name — sourced from the guest's most recent booking (guests
  // often have no profile name). Falls back to the account name. Hosts skip this.
  useEffect(() => {
    if (!user || hostingView) return;
    getGuestBookings()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        const latest = [...list].sort(
          (a, b) => new Date(b.created_at || b.scheduled_at) - new Date(a.created_at || a.scheduled_at),
        )[0];
        setGuestName(latest?.guest_name || user.name || '');
      })
      .catch(() => setGuestName(user.name || ''));
  }, [user, hostingView]);


  const badges = { messages: 0, notifications: unread };

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

  // Keep active role in sync with the route. Browser back/forward changes the
  // URL but not the persisted mode, which previously left the toggle + profile
  // menu showing Hosting on a Traveling page. Only snaps for dual-capability
  // accounts and only on role-specific paths (neutral paths leave mode as-is).
  useEffect(() => {
    if (!canHost) return;
    const role = routeRole(location.pathname);
    if (role && role !== mode) setMode(role);
  }, [location.pathname, canHost, mode, setMode]);

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
          <div className="hidden md:flex items-stretch flex-1 justify-center">
            {!user ? <PublicCenterNav /> : navItems.map((item) => {
              const active = isActive(item);
              const Icon   = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
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

            {/* Search — always-on creator discovery entry point → /search */}
            <Link
              to="/search"
              aria-label="Search creators"
              className="p-2.5 rounded-full text-gray-500 hover:text-[#FE5100] hover:bg-[#FE5100]/5 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#FE5100] focus-visible:ring-offset-1 hover:no-underline"
            >
              <Search size={19} strokeWidth={1.7} />
            </Link>

            {user ? (
              <>
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
                      className="absolute right-0 top-full mt-1.5 w-[calc(100vw-1.5rem)] max-w-[20rem] sm:w-80 bg-white rounded-xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
                      role="dialog"
                      aria-label="Notifications"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="text-sm font-semibold text-[#1E1E1E]">Notifications</span>
                        <button
                          className="text-[11px] text-[#FE5100] font-medium hover:underline focus:outline-none"
                          onClick={() => markAllNotificationsRead(notifRole).then(loadNotifs).catch(() => {})}
                        >
                          Mark all read
                        </button>
                      </div>
                      {notifs.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                          <p className="text-sm text-gray-400">No new notifications</p>
                        </div>
                      ) : (
                        <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                          {notifs.map((n) => (
                            <li key={n.id}>
                              <Link
                                to={n.link || '#'}
                                onClick={() => {
                                  if (!n.read_at) setUnread((u) => Math.max(0, u - 1));
                                  setNotifs((list) => list.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
                                  markNotificationRead(n.id).catch(() => {});
                                  setNotifOpen(false);
                                }}
                                className={`block px-4 py-3 hover:bg-gray-50 hover:no-underline ${n.read_at ? '' : 'bg-[#FE5100]/4'}`}
                              >
                                <p className="text-sm font-medium text-[#1E1E1E]">{n.title}</p>
                                {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
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
                    {hostingView
                      ? <PhotoAvatar user={user} className="h-8 w-8 text-sm" />
                      : <SlothAvatar appearance={appearance} className="h-8 w-8" />}
                    <ChevronDown
                      size={13}
                      strokeWidth={2.5}
                      className={`hidden sm:block text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div
                      className={`absolute right-0 top-full mt-1.5 ${hostingView ? 'w-72' : 'w-64'} bg-white rounded-xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-50 overflow-hidden`}
                      role="menu"
                      aria-label="Profile options"
                    >
                      {hostingView ? (
                        <>
                          {/* Host header: photo + name + @username + membership */}
                          <div className="px-4 py-3.5 border-b border-gray-100">
                            <VendorProfileHeader user={user} />
                            <MembershipButton user={user} onClick={() => setDropdownOpen(false)} />
                          </div>
                          <div className="py-1">
                            <MenuLinks items={VENDOR_MENU} user={user} onNavigate={() => setDropdownOpen(false)} />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Guest header: Sloth mark + "Hello," + last-booking name */}
                          <div className="px-4 py-3.5 border-b border-gray-100">
                            <GuestProfileHeader appearance={appearance} name={guestName} />
                          </div>
                          <div className="py-1">
                            <MenuLinks items={GUEST_MENU} user={user} onNavigate={() => setDropdownOpen(false)} />
                          </div>
                        </>
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

            {/* Public (mobile): Home / Pricing / Use Cases / More, then the CTA.
                Industry + info collapsed so the drawer stays short. */}
            {!user && (
              <div className="px-2 pt-2 space-y-1.5">
                <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-[#FE5100]/5 hover:text-[#FE5100] hover:no-underline">
                  <Home size={16} className="flex-shrink-0 text-gray-400" /> Home
                </Link>

                <Link to="/pricing" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-[#FE5100]/5 hover:text-[#FE5100] hover:no-underline">
                  <Tag size={16} className="flex-shrink-0 text-gray-400" /> Pricing
                </Link>

                <Link to="/help" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-[#FE5100]/5 hover:text-[#FE5100] hover:no-underline">
                  <HelpCircle size={16} className="flex-shrink-0 text-gray-400" /> Help
                </Link>

                {/* Explore (browse by industry) — collapsed by default */}
                <details className="group rounded-lg">
                  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-[#FE5100]/5 [&::-webkit-details-marker]:hidden">
                    <Compass size={16} className="flex-shrink-0 text-gray-400" />
                    <span className="flex-1">Explore</span>
                    <ChevronDown size={15} className="text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-0.5 pl-1 pt-0.5">
                    {USE_CASES_CONFIG.map((u) => {
                      const Icon = u.icon;
                      return (
                        <Link key={u.label} to={u.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-gray-600 hover:bg-[#FE5100]/5 hover:text-[#FE5100] hover:no-underline">
                          <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${u.iconBg} ${u.iconColor}`}>
                            <Icon size={13} />
                          </span>
                          {u.label}
                        </Link>
                      );
                    })}
                  </div>
                </details>

                {/* More — collapsed by default */}
                <details className="group rounded-lg">
                  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-[#FE5100]/5 [&::-webkit-details-marker]:hidden">
                    <Layers size={16} className="flex-shrink-0 text-gray-400" />
                    <span className="flex-1">More</span>
                    <ChevronDown size={15} className="text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-0.5 pl-1 pt-0.5">
                    {MORE_MENU.map((m) => {
                      const Icon = m.icon;
                      return (
                        <Link key={m.label} to={m.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-gray-600 hover:bg-[#FE5100]/5 hover:text-[#FE5100] hover:no-underline">
                          <Icon size={15} className="flex-shrink-0 text-gray-400" /> {m.label}
                        </Link>
                      );
                    })}
                  </div>
                </details>

                {/* Primary conversion CTA — last in the sequence */}
                <Link
                  to="/be-a-sloth"
                  className="btn mt-1 block w-full rounded-lg bg-primary-cta py-2.5 text-center text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#d94400] hover:no-underline"
                >
                  Let's Get Started
                </Link>
              </div>
            )}

            {/* Logged in: user info + dropdown items + logout */}
            {user && (
              <div className="pt-3 mt-1 border-t border-gray-100 px-1">
                {hostingView ? (
                  <>
                    {/* Host: photo + name + @username + membership */}
                    <div className="px-3 py-2 mb-1">
                      <VendorProfileHeader user={user} />
                      <MembershipButton user={user} onClick={() => setMenuOpen(false)} />
                    </div>
                    <div className="space-y-0.5">
                      <MenuLinks items={VENDOR_MENU} user={user} onNavigate={() => setMenuOpen(false)} />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Guest: Sloth mark + "Hello," + last-booking name */}
                    <div className="px-3 py-2 mb-1">
                      <GuestProfileHeader appearance={appearance} name={guestName} />
                    </div>
                    <div className="space-y-0.5">
                      <MenuLinks items={GUEST_MENU} user={user} onNavigate={() => setMenuOpen(false)} />
                    </div>
                  </>
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

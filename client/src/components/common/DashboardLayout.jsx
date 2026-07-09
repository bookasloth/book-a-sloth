import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Clock, LayoutGrid, Package, LineChart,
  Banknote, Receipt, User, Menu, X,
  ExternalLink, LogOut, Lock, Wallet, ShieldCheck,
  Bell, LifeBuoy, Headset, ChevronDown, Sparkles, Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useIsMobile from '../../hooks/useIsMobile';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/api';
import FeatureGate from './FeatureGate';
import { normalizePlan } from '../../utils/themeUtils';
import { cn } from '../dashboard/ui/cn';
import { PageTransition } from '../dashboard/ui/PageTransition';
import '../dashboard/ui/tokens.css';

// Grouped by host mental model. Routes are byte-identical to before — only the
// grouping, labels and entry points changed.
const NAV_GROUPS = [
  {
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
      { to: '/dashboard/bookings', label: 'Bookings', icon: CalendarDays },
      { to: '/dashboard/availability', label: 'Availability', icon: Clock },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/dashboard/services', label: 'Services', icon: LayoutGrid, matchPrefix: '/dashboard/service' },
      { to: '/dashboard/products', label: 'Products', icon: Package, locked: 'supreme' },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/dashboard/earnings', label: 'Earnings', icon: LineChart },
      { to: '/dashboard/payments/payouts', label: 'Payouts', icon: Banknote },
      { to: '/dashboard/payments/transactions', label: 'Transactions', icon: Receipt },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/dashboard/profile', label: 'Profile', icon: User },
      { to: '/dashboard/kyc', label: 'Verification', icon: ShieldCheck, matchPrefix: '/dashboard/kyc' },
    ],
  },
];

// Mobile bottom bar — 5 mental-model tabs. Catalog -> Services, Money -> Earnings.
const MOBILE_TABS = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/dashboard/services', label: 'Catalog', icon: LayoutGrid, matchPrefix: ['/dashboard/service', '/dashboard/products'] },
  { to: '/dashboard/earnings', label: 'Money', icon: Wallet, matchPrefix: ['/dashboard/earnings', '/dashboard/payments'] },
];

// "More" sheet — everything not on the bottom bar.
const MORE_LINKS = [
  { to: '/dashboard/availability', label: 'Availability', icon: Clock },
  { to: '/dashboard/products', label: 'Products', icon: Package, locked: 'supreme' },
  { to: '/dashboard/payments/payouts', label: 'Payouts', icon: Banknote },
  { to: '/dashboard/payments/transactions', label: 'Transactions', icon: Receipt },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

// Keyed by canonical plan slug (see normalizePlan) — legacy aliases like
// `explorer`/`free`/`pro` are collapsed before lookup, so a Studio host on the
// `pro` slug no longer falls through to the Starter badge.
const PLAN_STYLES = {
  starter: { label: 'Starter', bg: 'bg-gray-100', text: 'text-gray-600' },
  creator: { label: 'Host+', bg: 'bg-primary/10', text: 'text-primary' },
  professional: { label: 'Studio', bg: 'bg-amber-100', text: 'text-amber-700' },
  supreme: { label: 'Supreme', bg: 'bg-violet-100', text: 'text-violet-700' },
};

const startsWithAny = (pathname, prefix) =>
  (Array.isArray(prefix) ? prefix : [prefix]).some((p) => pathname === p || pathname.startsWith(p));

const isActive = (item, pathname) =>
  item.exact ? pathname === item.to : startsWithAny(pathname, item.matchPrefix || item.to);

/** Sidebar item — icon-only on the md rail, icon + label on lg. */
const SidebarItem = ({ item, pathname, plan }) => {
  const active = isActive(item, pathname);
  // item.locked holds the canonical plan slug required to unlock; anyone below
  // it sees the lock. (Products is Supreme-only for now.)
  const locked = item.locked && plan !== item.locked;
  const Icon = item.icon;
  const node = (
    <NavLink
      to={locked ? '#' : item.to}
      onClick={locked ? (e) => e.preventDefault() : undefined}
      title={item.label}
      className={cn(
        'relative mx-2 flex h-10 items-center gap-3 rounded-md px-0 transition-colors lg:mx-3 lg:px-3',
        'justify-center lg:justify-start',
        active
          ? 'bg-primary/10 font-medium text-primary'
          : locked
          ? 'cursor-default text-gray-300'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
      <span className="hidden flex-1 truncate lg:inline">{item.label}</span>
      {locked && <Lock className="hidden h-3.5 w-3.5 text-gray-300 lg:block" />}
    </NavLink>
  );
  return item.flag ? <FeatureGate flag={item.flag}>{node}</FeatureGate> : node;
};

const SheetLink = ({ item, plan, onNavigate }) => {
  const locked = item.locked && plan !== item.locked;
  const Icon = item.icon;
  const node = (
    <NavLink
      to={locked ? '#' : item.to}
      onClick={locked ? (e) => e.preventDefault() : onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-3 text-sm',
        locked ? 'cursor-default text-gray-300' : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
      <span className="flex-1">{item.label}</span>
      {locked && <Lock className="h-4 w-4 text-gray-300" />}
    </NavLink>
  );
  return item.flag ? <FeatureGate flag={item.flag}>{node}</FeatureGate> : node;
};

// Humanize a category slug ("career-coaching" -> "Career Coaching"). Falls back
// to a plain role label so the profile block always has a subtitle.
const humanizeCategory = (raw) => {
  const v = (raw || '').toString().trim();
  if (!v) return 'Host';
  return v.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// Shared row style for the profile-menu links.
const MENU_ROW =
  'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50';

// Lock body scroll while a mobile sheet is open (no-op when inactive).
const useBodyScrollLock = (active) => {
  useEffect(() => {
    if (!active) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
};

// One popup surface, two shapes: an anchored dropdown on desktop, an app-style
// bottom sheet on mobile (portaled to body so the topbar's backdrop-blur — which
// would otherwise become the containing block for `fixed` — can't trap it).
const MenuSurface = ({ open, onClose, isMobile, title, align = 'right', width = 'w-72', role = 'menu', children }) => {
  if (!open) return null;
  if (isMobile) {
    return createPortal(
      <div className="md:hidden">
        <div className="fixed inset-0 z-[60] bg-black/40" onClick={onClose} aria-hidden="true" />
        <div
          className="fixed inset-x-0 bottom-0 z-[60] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-gray-100 bg-white pb-[max(1rem,env(safe-area-inset-bottom))] dash-elev-3"
          role={role}
          aria-label={title}
        >
          <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-gray-200" aria-hidden="true" />
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <span className="text-base font-semibold text-gray-900">{title}</span>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </div>,
      document.body,
    );
  }
  return (
    <div
      className={cn(
        'absolute top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
        align === 'right' ? 'right-0' : 'left-0',
        width,
      )}
      role={role}
      aria-label={title}
    >
      {children}
    </div>
  );
};

/** Sloth Support — leftmost topbar action. Routes to the Help centre. */
const SupportButton = () => (
  <Link
    to="/help"
    title="Sloth Support"
    aria-label="Sloth Support"
    className="grid h-9 w-9 place-items-center rounded-full text-gray-500 transition-colors hover:bg-primary/5 hover:text-primary"
  >
    <LifeBuoy className="h-[19px] w-[19px]" strokeWidth={1.7} />
  </Link>
);

/** Notification bell. Anchored panel on desktop, bottom sheet on mobile. */
const NotifBell = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const isMobile = useIsMobile();

  const load = () => {
    getNotifications('host')
      .then(({ data }) => { setNotifs(data.notifications || []); setUnread(data.unreadCount || 0); })
      .catch(() => {});
  };
  useEffect(() => { load(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) load(); }, [open]);

  // ESC closes on any size; outside-click only matters for the desktop dropdown
  // (the mobile sheet is portaled and closes via its backdrop / close button).
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (isMobile) return undefined;
    const onPointer = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [isMobile]);
  useBodyScrollLock(open && isMobile);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-full text-gray-500 transition-colors hover:bg-primary/5 hover:text-primary"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-[19px] w-[19px]" strokeWidth={1.7} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <MenuSurface open={open} onClose={() => setOpen(false)} isMobile={isMobile} title="Notifications" width="w-80" role="dialog">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 md:py-3">
          {!isMobile && <span className="text-sm font-semibold text-gray-900">Notifications</span>}
          <button
            type="button"
            className="ml-auto text-xs font-medium text-primary hover:underline"
            onClick={() => markAllNotificationsRead('host').then(load).catch(() => {})}
          >
            Mark all read
          </button>
        </div>
        {notifs.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="mx-auto mb-2 h-7 w-7 text-gray-200" />
            <p className="text-sm text-gray-400">No new notifications</p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto md:max-h-80">
            {notifs.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => { markNotificationRead(n.id).then(load).catch(() => {}); }}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 border-b border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50',
                    !n.read_at && 'bg-primary/5',
                  )}
                >
                  <span className="text-sm font-medium text-gray-800">{n.title || n.message}</span>
                  {n.title && n.message && <span className="text-xs text-gray-500">{n.message}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </MenuSurface>
    </div>
  );
};

/** Profile avatar — anchored menu on desktop, bottom sheet on mobile. */
const ProfileMenu = ({ user, plan, planStyle, initial, logout }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const category = humanizeCategory(user?.category || user?.primary_category);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (isMobile) return undefined;
    const onPointer = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [isMobile]);
  useBodyScrollLock(open && isMobile);

  const Avatar = ({ size }) =>
    user?.profile_image ? (
      <img src={user.profile_image} alt={user?.name || 'Profile'} className={cn('shrink-0 rounded-full object-cover', size)} />
    ) : (
      <div className={cn('grid shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary', size)}>
        {initial}
      </div>
    );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full p-0.5 transition-colors hover:bg-gray-100"
        aria-label="Profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar size="h-9 w-9 text-sm" />
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      <MenuSurface open={open} onClose={() => setOpen(false)} isMobile={isMobile} title="Account" width="w-72">
        {/* Top block: photo + name + @username */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
          <Avatar size="h-12 w-12 text-base" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900">{user?.name || 'Host'}</p>
            <p className="truncate text-xs text-gray-500">{user?.username ? `@${user.username}` : category}</p>
          </div>
        </div>

        {/* Membership button */}
        <div className="px-4 py-3">
          <Link
            to="/dashboard/upgrade"
            onClick={() => setOpen(false)}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2} />
            You are a {planStyle.label} Member
          </Link>
        </div>

        {/* Host shortcuts */}
        <div className="border-t border-gray-100 py-1.5">
          <NavLink to="/dashboard/bookings" onClick={() => setOpen(false)} className={MENU_ROW}>
            <CalendarDays className="h-4 w-4 shrink-0" strokeWidth={1.7} />
            <span className="flex-1">Upcoming Bookings</span>
          </NavLink>
          <NavLink to="/dashboard/availability" onClick={() => setOpen(false)} className={MENU_ROW}>
            <Clock className="h-4 w-4 shrink-0" strokeWidth={1.7} />
            <span className="flex-1">Availability</span>
          </NavLink>
          {user?.username && (
            <a
              href={`/${user.username}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className={MENU_ROW}
            >
              <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              <span className="flex-1">View Public Profile</span>
            </a>
          )}
          <a
            href="/bolt958"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className={MENU_ROW}
          >
            <Headset className="h-4 w-4 shrink-0" strokeWidth={1.7} />
            <span className="flex-1">Talk to Account Manager</span>
          </a>
          <NavLink to="/dashboard/profile" onClick={() => setOpen(false)} className={MENU_ROW}>
            <Settings className="h-4 w-4 shrink-0" strokeWidth={1.7} />
            <span className="flex-1">Settings</span>
          </NavLink>
        </div>

        {/* Logout */}
        <div className="border-t border-gray-100 py-1.5">
          <button
            type="button"
            onClick={() => { setOpen(false); logout?.(); }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.7} />
            <span className="flex-1">Logout</span>
          </button>
        </div>
      </MenuSurface>
    </div>
  );
};

/** Sticky dashboard topbar. Right-to-left: Profile, Notifications, Support. */
const DashTopbar = ({ user, plan, planStyle, initial, logout }) => (
  <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center border-b border-gray-200/80 bg-white/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur sm:px-6 md:px-8">
    <div className="ml-auto flex items-center gap-1">
      <SupportButton />
      <NotifBell />
      <ProfileMenu user={user} plan={plan} planStyle={planStyle} initial={initial} logout={logout} />
    </div>
  </header>
);

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { pathname } = location;

  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => { setMoreOpen(false); }, [pathname]);
  useEffect(() => {
    if (!moreOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [moreOpen]);

  const plan = normalizePlan(user?.plan);
  const planStyle = PLAN_STYLES[plan] || PLAN_STYLES.starter;
  const initial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="dash flex min-h-screen overflow-x-hidden bg-[#f7f5ef]">
      {/* Sidebar: md = 64px icon rail, lg = 256px full. Fixed to the viewport
          (out of the page flow) so it's pinned top-to-bottom on the left and
          never scrolls with the page. Main content is offset by its width. */}
      <aside className="hidden flex-col border-r border-gray-200/80 bg-white/95 shadow-sm md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-16 lg:w-64">
        {/* Brand — identity (avatar/name/plan) now lives in the topbar profile menu. */}
        <Link
          to="/dashboard"
          title="Book A Sloth"
          className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-100 px-3 lg:px-5"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-base font-black text-primary">B</span>
          <span className="hidden text-sm font-extrabold tracking-tight text-gray-900 lg:inline">Book A Sloth</span>
        </Link>

        {/* Nav groups */}
        <nav className="dash-noscrollbar flex-1 overflow-y-auto py-2">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label || gi} className="mb-1">
              {group.label && (
                <>
                  <p className="hidden px-5 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 lg:block">{group.label}</p>
                  <div className="mx-3 my-2 border-t border-gray-100 lg:hidden" />
                </>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarItem key={item.to} item={item} pathname={pathname} plan={plan} />
                ))}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 gap-1 border-t border-gray-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        {MOBILE_TABS.map((item) => {
          const active = isActive(item, pathname);
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-gray-400',
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.8} />
              {item.label}
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-label="More"
          aria-expanded={moreOpen}
          className={cn(
            'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium transition-colors',
            moreOpen ? 'bg-primary/10 text-primary' : 'text-gray-400',
          )}
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
          More
        </button>
      </nav>

      {/* Mobile "More" sheet — portaled to body so fixed positioning is immune to
          transformed/filtered ancestors. */}
      {createPortal(
        moreOpen ? (
          <div className="md:hidden">
            <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMoreOpen(false)} aria-hidden="true" />
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-gray-100 bg-white pb-[max(1rem,env(safe-area-inset-bottom))] dash-elev-3">
              <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-3">
                <span className="text-base font-semibold text-gray-900">More</span>
                <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Nav overflow only — account actions (View public page, Logout,
                  Super Admin) live in the topbar profile sheet, not here. */}
              <div className="p-2">
                {MORE_LINKS.map((item) => (
                  <SheetLink key={item.to} item={item} plan={plan} onNavigate={() => setMoreOpen(false)} />
                ))}
              </div>
            </div>
          </div>
        ) : null,
        document.body,
      )}

      {/* Main — offset by the fixed sidebar width on md+ (it's out of flow). */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto md:ml-16 lg:ml-64">
        {/* Sticky topbar — right-to-left: Profile, Notifications, Support. */}
        <DashTopbar user={user} plan={plan} planStyle={planStyle} initial={initial} logout={logout} />
        <div className="px-4 py-6 pb-28 sm:px-6 md:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-6xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

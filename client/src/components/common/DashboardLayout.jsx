import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Clock, LayoutGrid, Package, LineChart,
  Banknote, Receipt, User, Menu, X,
  ExternalLink, ShieldCheck, LogOut, Lock, Wallet, Sparkles, Gem, Crown,
  Bell, LifeBuoy, Gift, Code2, Award, Headset, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../../services/api';
import FeatureGate from './FeatureGate';
import { normalizePlan } from '../../utils/themeUtils';
import { cn } from '../dashboard/ui/cn';
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

// Plan-aware copy for the bottom-of-sidebar premium section. Each tier gets its
// own headline, value prop and call-to-action; the renew state overrides these
// when a paid plan is lapsing. Class strings are full literals so Tailwind keeps
// them. (free=starter, Host+=creator, Studio=professional, Supreme=supreme.)
const PLAN_CARD = {
  starter: {
    title: 'Upgrade to Host+',
    blurb: 'Lower fees, digital products & more.',
    cta: 'Upgrade — 20% off',
    card: 'from-primary/10 to-transparent ring-primary/20',
    iconCls: 'text-primary',
    ctaCls: 'bg-primary text-white hover:bg-primary/90',
    Icon: Sparkles,
  },
  creator: {
    title: 'Host+ active',
    blurb: 'Manage billing, invoices & perks.',
    cta: 'Manage plan',
    card: 'from-primary/10 to-transparent ring-primary/15',
    iconCls: 'text-primary',
    ctaCls: 'bg-white text-primary ring-1 ring-primary/20 hover:bg-primary/5',
    Icon: Gem,
  },
  professional: {
    title: 'Studio plan',
    blurb: 'Every pro feature is switched on.',
    cta: 'Manage plan',
    card: 'from-amber-100 to-transparent ring-amber-200',
    iconCls: 'text-amber-600',
    ctaCls: 'bg-white text-amber-700 ring-1 ring-amber-200 hover:bg-amber-50',
    Icon: Crown,
  },
  supreme: {
    title: 'Supreme access',
    blurb: 'God-tier — every feature unlocked.',
    cta: 'Manage plan',
    card: 'from-violet-100 to-transparent ring-violet-200',
    iconCls: 'text-violet-600',
    ctaCls: 'bg-white text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50',
    Icon: Crown,
  },
};

/** Premium section pinned at the bottom of the sidebar — dynamic per plan. */
const PremiumCard = ({ plan, daysLeft, expired, expireSoon, onNavigate }) => {
  const cfg = PLAN_CARD[plan] || PLAN_CARD.starter;
  const renew = (expireSoon || expired) && plan !== 'starter';
  const Icon = renew ? Clock : cfg.Icon;
  const title = renew ? (expired ? 'Plan expired' : 'Plan expiring soon') : cfg.title;
  const blurb = renew
    ? expired
      ? 'Renew to keep your features.'
      : `Expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`
    : cfg.blurb;
  const cta = renew ? 'Renew now' : cfg.cta;
  const card = renew ? 'from-amber-50 to-transparent ring-amber-200' : cfg.card;
  const iconCls = renew ? 'text-amber-600' : cfg.iconCls;
  const ctaCls = renew ? 'bg-amber-600 text-white hover:bg-amber-700' : cfg.ctaCls;

  return (
    <Link
      to="/dashboard/upgrade"
      onClick={onNavigate}
      className={cn('block rounded-xl bg-gradient-to-br p-3 ring-1 transition-shadow hover:shadow-sm', card)}
    >
      <div className="flex items-center gap-2">
        <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/80', iconCls)}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-bold text-gray-900">{title}</p>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-gray-500">{blurb}</p>
      <span className={cn('mt-2.5 flex h-8 items-center justify-center rounded-lg text-[11px] font-semibold transition-colors', ctaCls)}>
        {cta}
      </span>
    </Link>
  );
};

// Humanize a category slug ("career-coaching" -> "Career Coaching"). Falls back
// to a plain role label so the profile block always has a subtitle.
const humanizeCategory = (raw) => {
  const v = (raw || '').toString().trim();
  if (!v) return 'Host';
  return v.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// Reverse-hover buttons for the profile dropdown: each one morphs into the
// other's look on hover. Ghost = outline that fills; Primary = filled that hollows.
const REVERSE_GHOST =
  'border border-primary text-primary bg-transparent hover:bg-primary hover:text-white';
const REVERSE_PRIMARY =
  'border border-primary bg-primary text-white hover:bg-transparent hover:text-primary';

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

/** Notification bell + dropdown panel. Host-scoped feed, loaded on mount/open. */
const NotifBell = () => {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = () => {
    getNotifications('host')
      .then(({ data }) => { setNotifs(data.notifications || []); setUnread(data.unreadCount || 0); })
      .catch(() => {});
  };
  useEffect(() => { load(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) load(); }, [open]);

  useEffect(() => {
    const onPointer = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

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

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[calc(100vw-1.5rem)] max-w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:w-80"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">Notifications</span>
            <button
              type="button"
              className="text-[11px] font-medium text-primary hover:underline"
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
            <ul className="max-h-80 overflow-y-auto">
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
        </div>
      )}
    </div>
  );
};

/** Profile avatar + dropdown — rightmost topbar action. */
const ProfileMenu = ({ user, plan, planStyle, initial }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const category = humanizeCategory(user?.category || user?.primary_category);
  const isPaid = plan === 'professional' || plan === 'supreme';

  useEffect(() => {
    const onPointer = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const Avatar = ({ size }) =>
    user?.profile_image ? (
      <img src={user.profile_image} alt={user?.name || 'Profile'} className={cn('shrink-0 rounded-full object-cover', size)} />
    ) : (
      <div className={cn('grid shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary', size)}>
        {initial}
      </div>
    );

  const inactive = [
    { label: 'Refer a Friend', icon: Gift },
    { label: 'Add BaS to Website', icon: Code2 },
    { label: 'Badges', icon: Award },
    { label: 'Talk to Account Manager', icon: Headset },
  ];

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

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
          role="menu"
        >
          {/* Top block: avatar + name + category */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
            <Avatar size="h-12 w-12 text-base" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">{user?.name || 'Host'}</p>
              <p className="truncate text-xs text-gray-500">{category}</p>
              <span className={cn('mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', planStyle.bg, planStyle.text)}>
                {isPaid && '★ '}{planStyle.label}
              </span>
            </div>
          </div>

          {/* Primary actions — reverse-hover buttons */}
          <div className="grid gap-2 px-4 py-3">
            <Link
              to={user?.username ? `/${user.username}` : '/dashboard/profile'}
              onClick={() => setOpen(false)}
              className={cn('flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors', REVERSE_GHOST)}
            >
              View Profile
            </Link>
            <Link
              to="/dashboard/upgrade"
              onClick={() => setOpen(false)}
              className={cn('flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors', REVERSE_PRIMARY)}
            >
              Upgrade Plan
            </Link>
          </div>

          {/* Inactive / coming-soon */}
          <div className="border-t border-gray-100 py-1.5">
            {inactive.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                disabled
                title="Coming soon"
                className="flex w-full cursor-not-allowed items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300"
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                <span className="flex-1">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/** Sticky dashboard topbar. Right-to-left: Profile, Notifications, Support. */
const DashTopbar = ({ user, plan, planStyle, initial }) => (
  <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-gray-200/80 bg-white/95 px-4 backdrop-blur sm:px-6 md:px-8">
    <div className="ml-auto flex items-center gap-1">
      <SupportButton />
      <NotifBell />
      <ProfileMenu user={user} plan={plan} planStyle={planStyle} initial={initial} />
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
  const planExpiry = user?.plan_expires_at ? new Date(user.plan_expires_at) : null;
  const daysLeft = planExpiry ? Math.ceil((planExpiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const expireSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const expired = daysLeft !== null && daysLeft <= 0;
  const showRenew = (expireSoon || expired) && plan !== 'starter';
  const initial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="dash flex min-h-screen overflow-x-hidden bg-[#f7f5ef]">
      {/* Sidebar: md = 64px icon rail, lg = 256px full. Sticky + full viewport
          height so the premium card, View-public and Logout stay pinned to the
          bottom no matter how tall the page content is. */}
      <aside className="hidden flex-shrink-0 flex-col border-r border-gray-200/80 bg-white/95 shadow-sm md:sticky md:top-0 md:flex md:h-screen md:w-16 lg:w-64">
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

        {/* Footer — pinned to the bottom of the sticky sidebar. Premium section
            first, then View-public + Logout stay as the bottom-most actions. */}
        <div className="shrink-0 space-y-1.5 border-t border-gray-100 px-2 pb-4 pt-2 lg:px-3">
          {/* Premium plan section — plan-aware. Full card on lg; compact pill on the md rail. */}
          <div className="hidden lg:block">
            <PremiumCard plan={plan} daysLeft={daysLeft} expired={expired} expireSoon={expireSoon} />
          </div>
          <Link
            to="/dashboard/upgrade"
            title={showRenew ? 'Renew plan' : plan === 'starter' ? 'Upgrade plan' : 'Manage plan'}
            className={cn(
              'flex h-9 items-center justify-center rounded-md transition-colors lg:hidden',
              showRenew ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-primary/10 text-primary hover:bg-primary/15',
            )}
          >
            {showRenew ? <Clock className="h-4 w-4" /> : plan === 'starter' ? <Sparkles className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
          </Link>
          {user?.username && (
            <a
              href={`/${user.username}`}
              target="_blank"
              rel="noreferrer"
              title="View public page"
              className="flex h-9 items-center justify-center gap-2 rounded-md px-0 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary lg:justify-start lg:px-3"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">View public page</span>
            </a>
          )}
          {user?.role === 'superadmin' && (
            <NavLink
              to="/admin"
              title="Super Admin"
              className="flex h-9 items-center justify-center gap-2 rounded-md px-0 text-xs font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-500 lg:justify-start lg:px-3"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">Super Admin</span>
            </NavLink>
          )}
          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md px-0 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 lg:justify-start lg:px-3"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
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
              <div className="p-2">
                {/* Premium plan section — also surfaced for mobile/touch users. */}
                <div className="px-1 pb-2">
                  <PremiumCard plan={plan} daysLeft={daysLeft} expired={expired} expireSoon={expireSoon} onNavigate={() => setMoreOpen(false)} />
                </div>
                {MORE_LINKS.map((item) => (
                  <SheetLink key={item.to} item={item} plan={plan} onNavigate={() => setMoreOpen(false)} />
                ))}
                <div className="my-1 border-t border-gray-100" />
                {user?.username && (
                  <a
                    href={`/${user.username}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                    <span className="flex-1">View public page</span>
                  </a>
                )}
                {user?.role === 'superadmin' && (
                  <NavLink
                    to="/admin"
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-500 hover:bg-red-50"
                  >
                    <ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                    <span className="flex-1">Super Admin</span>
                  </NavLink>
                )}
                <button
                  type="button"
                  onClick={() => { setMoreOpen(false); logout(); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-500 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                  <span className="flex-1 text-left">Logout</span>
                </button>
              </div>
            </div>
          </div>
        ) : null,
        document.body,
      )}

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Sticky topbar — right-to-left: Profile, Notifications, Support. */}
        <DashTopbar user={user} plan={plan} planStyle={planStyle} initial={initial} />
        <div className="px-4 py-6 pb-28 sm:px-6 md:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

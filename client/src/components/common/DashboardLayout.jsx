import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Clock, LayoutGrid, Package, LineChart,
  Banknote, Receipt, User, Menu, X,
  ExternalLink, ShieldCheck, LogOut, Lock, Wallet, Sparkles, Gem, Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import FeatureGate from './FeatureGate';
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
      { to: '/dashboard/products', label: 'Products', icon: Package, locked: 'creator' },
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
  { to: '/dashboard/products', label: 'Products', icon: Package, locked: 'creator' },
  { to: '/dashboard/payments/payouts', label: 'Payouts', icon: Banknote },
  { to: '/dashboard/payments/transactions', label: 'Transactions', icon: Receipt },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
];

const PLAN_STYLES = {
  explorer: { label: 'Starter', bg: 'bg-gray-100', text: 'text-gray-600' },
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
  const locked = item.locked && plan === 'explorer';
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
  const locked = item.locked && plan === 'explorer';
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
// them. (free=explorer, Host+=creator, Studio=professional, Supreme=supreme.)
const PLAN_CARD = {
  explorer: {
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
  const cfg = PLAN_CARD[plan] || PLAN_CARD.explorer;
  const renew = (expireSoon || expired) && plan !== 'explorer';
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

  const plan = user?.plan || 'explorer';
  const planStyle = PLAN_STYLES[plan] || PLAN_STYLES.explorer;
  const planExpiry = user?.plan_expires_at ? new Date(user.plan_expires_at) : null;
  const daysLeft = planExpiry ? Math.ceil((planExpiry - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const expireSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const expired = daysLeft !== null && daysLeft <= 0;
  const showRenew = (expireSoon || expired) && plan !== 'explorer';
  const initial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="dash flex min-h-screen overflow-x-hidden bg-[#f7f5ef]">
      {/* Sidebar: md = 64px icon rail, lg = 256px full. Sticky + full viewport
          height so the premium card, View-public and Logout stay pinned to the
          bottom no matter how tall the page content is. */}
      <aside className="hidden flex-shrink-0 flex-col border-r border-gray-200/80 bg-white/95 shadow-sm md:sticky md:top-0 md:flex md:h-screen md:w-16 lg:w-64">
        {/* Identity: avatar + name + plan badge */}
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-3 py-4 lg:px-5">
          {user?.profile_image ? (
            <img
              src={user.profile_image}
              alt={user?.name || 'Profile'}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {initial}
            </div>
          )}
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-sm font-bold text-gray-900">{user?.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', planStyle.bg, planStyle.text)}>
                {(plan === 'professional' || plan === 'supreme') && '★ '}{planStyle.label}
              </span>
              {expireSoon || expired ? (
                <span className={cn('text-[10px] font-medium', expired ? 'text-red-500' : 'text-amber-600')}>
                  {expired ? 'Expired' : `${daysLeft}d left`}
                </span>
              ) : plan === 'explorer' ? (
                <Link to="/dashboard/upgrade" className="text-[10px] font-medium text-primary hover:underline">Upgrade</Link>
              ) : null}
            </div>
          </div>
        </div>

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
            title={showRenew ? 'Renew plan' : plan === 'explorer' ? 'Upgrade plan' : 'Manage plan'}
            className={cn(
              'flex h-9 items-center justify-center rounded-md transition-colors lg:hidden',
              showRenew ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-primary/10 text-primary hover:bg-primary/15',
            )}
          >
            {showRenew ? <Clock className="h-4 w-4" /> : plan === 'explorer' ? <Sparkles className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
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
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 pb-28 sm:px-6 md:px-8 md:pb-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;

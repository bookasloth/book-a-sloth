import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Clock, LayoutGrid, Package, LineChart,
  Banknote, Receipt, User, Menu, X,
  ExternalLink, ShieldCheck, LogOut, Lock, ArrowUpRight, Wallet,
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
      {/* Sidebar: md = 64px icon rail, lg = 256px full */}
      <aside className="hidden flex-shrink-0 flex-col border-r border-gray-200/80 bg-white/95 shadow-sm md:flex md:w-16 lg:w-64">
        {/* User header */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-3 py-4 lg:px-5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initial}
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-bold text-gray-900">{user?.name}</p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>

        {/* Plan badge (full only) */}
        <div className="hidden items-center justify-between px-5 py-2.5 lg:flex">
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', planStyle.bg, planStyle.text)}>
            {plan === 'professional' && '★ '}{planStyle.label}
          </span>
          {expireSoon || expired ? (
            <span className={cn('text-[10px] font-medium', expired ? 'text-red-500' : 'text-amber-600')}>
              {expired ? 'Expired' : `${daysLeft}d left`}
            </span>
          ) : plan === 'explorer' ? (
            <Link to="/dashboard/upgrade" className="text-[10px] font-medium text-primary hover:underline">Upgrade</Link>
          ) : null}
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

        {/* Footer */}
        <div className="space-y-1 border-t border-gray-100 px-2 pb-4 pt-2 lg:px-3">
          {plan === 'explorer' && (
            <Link
              to="/dashboard/upgrade"
              title="Upgrade Plan"
              className="flex h-9 items-center justify-center gap-2 rounded-md bg-primary/10 px-0 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 lg:justify-start lg:px-3"
            >
              <ArrowUpRight className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">Upgrade Plan</span>
            </Link>
          )}
          {showRenew && (
            <Link
              to="/dashboard/upgrade"
              title="Renew Plan"
              className="flex h-9 items-center justify-center gap-2 rounded-md bg-amber-50 px-0 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 lg:justify-start lg:px-3"
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">Renew Plan</span>
            </Link>
          )}
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

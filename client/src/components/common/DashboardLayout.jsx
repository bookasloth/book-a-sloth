import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FeatureGate from './FeatureGate';

// Tabs already shown in the mobile bottom nav — excluded from the "More" sheet.
const MOBILE_BOTTOM_TOS = [
  '/dashboard', '/dashboard/bookings', '/dashboard/services',
  '/dashboard/payments/payouts', '/dashboard/profile',
];

const NAV_ITEMS = [
  { to:'/dashboard',                label:'Overview',      icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1', exact:true },
  { to:'/dashboard/bookings',       label:'Bookings',      icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to:'/dashboard/services',       label:'Services',      icon:'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to:'/dashboard/payments/payouts',    label:'Payments',  icon:'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', matchPrefix:'/dashboard/payments' },
  { to:'/dashboard/availability',   label:'Availability',  icon:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to:'/dashboard/products',       label:'Products',      icon:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', locked:'creator' },
  { to:'/dashboard/earnings',       label:'Earnings',      icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  // Bookings the host MADE on other creators (unified account). Distinct from
  // 'Bookings' above, which is bookings RECEIVED on the host's own services.
  { to:'/dashboard/my-bookings',    label:'My Bookings',   icon:'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
  { to:'/dashboard/profile',        label:'Profile',       icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to:'/dashboard/feedback',       label:'Feedback',      icon:'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z' },
];

const BOTTOM_ITEMS = [
  { to:'/dashboard/calendar',  label:'Calendar',  icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', soon:true },
  { to:'/dashboard/chats',     label:'Chats',     icon:'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', soon:true },
  { to:'/dashboard/reviews',   label:'Reviews',   icon:'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', soon:true },
  { to:'/dashboard/tickets',   label:'Tickets',   icon:'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z', soon:true },
];

const PLAN_STYLES = {
  explorer:     { label:'Explorer',     bg:'bg-gray-100',   text:'text-gray-600' },
  creator:      { label:'Creator',      bg:'bg-primary/10', text:'text-primary' },
  professional: { label:'Professional', bg:'bg-amber-100',  text:'text-amber-700' },
};

const NavItem = ({ item, location, plan }) => {
  const matchTo    = item.matchPrefix || item.to;
  const active     = item.exact ? location.pathname === item.to : location.pathname.startsWith(matchTo);
  const isLocked   = item.locked && plan === 'explorer';

  return (
    <NavLink key={item.to} to={isLocked ? '#' : item.to}
      onClick={isLocked ? e=>e.preventDefault() : undefined}
      className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
        active     ? 'text-primary bg-primary/5 border-r-2 border-primary font-medium'
        : isLocked ? 'text-gray-300 cursor-default'
                   : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}>
      <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
      </svg>
      <span className="flex-1">{item.label}</span>
      {isLocked && <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>}
    </NavLink>
  );
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Mobile "More" sheet — holds everything not on the 5-tab bottom bar (incl. Logout).
  const [moreOpen, setMoreOpen] = useState(false);
  const moreNav = NAV_ITEMS.filter((i) => !MOBILE_BOTTOM_TOS.includes(i.to));

  // Close the sheet on navigation + lock body scroll while it is open.
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [moreOpen]);

  const plan      = user?.plan || 'explorer';
  const planStyle = PLAN_STYLES[plan] || PLAN_STYLES.explorer;
  const planExpiry   = user?.plan_expires_at ? new Date(user.plan_expires_at) : null;
  const daysLeft     = planExpiry ? Math.ceil((planExpiry - new Date()) / (1000*60*60*24)) : null;
  const expireSoon   = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const expired      = daysLeft !== null && daysLeft <= 0;

  const isPaymentsActive = location.pathname.startsWith('/dashboard/payments');

  return (
    <div className="min-h-screen bg-[#f7f5ef] flex overflow-x-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-shrink-0 bg-white/95 border-r border-gray-200/80 flex-col shadow-sm">
        {/* User header */}
        <div className="px-6 py-5 border-b">
          <p className="font-bold text-sm truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          <div className="flex items-center justify-between mt-2">
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold ${planStyle.bg} ${planStyle.text}`}>
              {plan === 'professional' && '* '}{planStyle.label}
            </span>
            {plan === 'explorer' && (
              <Link to="/dashboard/upgrade" className="text-[10px] text-primary hover:underline font-medium">Upgrade</Link>
            )}
          </div>
          {(expireSoon||expired) && (
            <p className={`text-[10px] mt-1 ${expired?'text-red-500':'text-amber-600'}`}>
              {expired ? 'Plan expired' : `Expires in ${daysLeft}d`}
            </p>
          )}
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map(item=><NavItem key={item.to} item={item} location={location} plan={plan}/>)}

          {/* Payments sub-nav (shown when active) */}
          {isPaymentsActive && (
            <div className="ml-8 mt-1 mb-1 border-l border-gray-200 pl-3 space-y-0.5">
              {[
                { to:'/dashboard/payments/payouts',       label:'Payouts' },
                { to:'/dashboard/payments/transactions',  label:'Transactions' },
              ].map(sub=>{
                const a = location.pathname === sub.to;
                return (
                  <NavLink key={sub.to} to={sub.to}
                    className={`block px-2 py-1.5 rounded-lg text-xs transition-colors ${a?'text-primary font-semibold bg-primary/5':'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                    {sub.label}
                  </NavLink>
                );
              })}
            </div>
          )}

          <div className="my-2 mx-6 border-t border-gray-100"/>

          {/* Coming soon items */}
          {BOTTOM_ITEMS.map(item=>(
            <div key={item.to} className="flex items-center gap-3 px-6 py-2.5 text-sm text-gray-300 cursor-default">
              <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
              </svg>
              <span className="flex-1">{item.label}</span>
              <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Soon</span>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 space-y-2 border-t border-gray-100">
          {plan === 'explorer' && (
            <Link to="/dashboard/upgrade"
              className="btn flex items-center gap-2 px-3 py-2 bg-primary/5 text-xs text-primary font-medium hover:bg-primary/10 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              Upgrade Plan
            </Link>
          )}
          {(expireSoon||expired) && plan !== 'explorer' && (
            <Link to="/dashboard/upgrade"
              className="btn flex items-center gap-2 px-3 py-2 bg-amber-50 text-xs text-amber-700 font-medium hover:bg-amber-100 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Renew Plan
            </Link>
          )}
          {user?.username && (
            <a href={`/${user.username}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-primary px-1 py-1 rounded transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              View public page
            </a>
          )}
          {user?.role === 'superadmin' && (
            <NavLink to="/admin" className="flex items-center gap-2 text-xs text-red-400 hover:text-red-500 font-medium px-1 py-1 rounded transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              Super Admin
            </NavLink>
          )}
          <button onClick={logout}
            className="flex w-full items-center gap-2 text-xs text-gray-400 hover:text-red-500 px-1 py-1 rounded transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 border-t border-gray-200 z-40 grid grid-cols-5 gap-1 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        {/* Overview, Bookings, Services, Payments (index 3), Profile — 5 distinct tabs.
            slice(0,4) already includes Payments, so append Profile (not a 2nd Payments). */}
        {[...NAV_ITEMS.slice(0,4), NAV_ITEMS.find(i=>i.to==='/dashboard/profile')].map((item)=>{
          const mp = item.matchPrefix||item.to;
          const active = item.exact ? location.pathname===item.to : location.pathname.startsWith(mp);
          return (
            <NavLink key={item.to} to={item.to}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium ${active?'bg-primary/10 text-primary':'text-gray-400'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
              </svg>
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {/* Mobile "More" menu — bottom-right burger holding hidden options + Logout.
          Portaled to <body> so fixed positioning is immune to any filtered or
          transformed ancestor (same reason as the Navbar drawer). */}
      {createPortal(
        <>
      <button
        type="button"
        onClick={() => setMoreOpen((o) => !o)}
        aria-label={moreOpen ? 'Close menu' : 'Open more menu'}
        aria-expanded={moreOpen}
        className="md:hidden fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-95"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={moreOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {moreOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMoreOpen(false)} aria-hidden="true" />
          <div className="md:hidden fixed bottom-36 left-4 right-4 z-50 max-h-[60vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl">
            {moreNav.map((item) => {
              const locked = item.locked && plan === 'explorer';
              return (
                <NavLink
                  key={item.to}
                  to={locked ? '#' : item.to}
                  onClick={locked ? (e) => e.preventDefault() : () => setMoreOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${locked ? 'cursor-default text-gray-300' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <span className="flex-1">{item.label}</span>
                  {locked && (
                    <svg className="h-3.5 w-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  )}
                </NavLink>
              );
            })}

            <div className="my-1 border-t border-gray-100" />

            {user?.username && (
              <a
                href={`/${user.username}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                View public page
              </a>
            )}

            {plan === 'explorer' && (
              <Link to="/dashboard/upgrade" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-primary hover:bg-primary/5">
                <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                Upgrade Plan
              </Link>
            )}

            {user?.role === 'superadmin' && (
              <NavLink to="/admin" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-red-50">
                <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                Super Admin
              </NavLink>
            )}

            <button
              onClick={() => { setMoreOpen(false); logout(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-500 hover:bg-red-50"
            >
              <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              Logout
            </button>
          </div>
        </>
      )}
        </>,
        document.body
      )}

      {/* Main */}
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 pb-28 sm:px-6 md:px-8 md:pb-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
        <FeatureGate flag="vendor_feedback">
          <Link to="/dashboard/feedback"
            title="Feedback" aria-label="Send feedback"
            className="hidden md:flex fixed bottom-6 right-6 z-40 h-11 w-11 items-center justify-center bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>
          </Link>
        </FeatureGate>
      </main>
    </div>
  );
};

export default DashboardLayout;

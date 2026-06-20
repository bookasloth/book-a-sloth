import { useState, useEffect, useRef } from 'react';
import { useLocation, Navigate, useNavigate, Link } from 'react-router-dom';

// SECURITY: Admin session is completely isolated in 'bas_admin' localStorage key.
// Guard checks type === 'super_admin' — a vendor/user session cannot pass this check.
const getAdminSession = () => {
  try { return JSON.parse(localStorage.getItem('bas_admin') || 'null'); } catch { return null; }
};

const isValidAdminSession = (s) => s && s.type === 'admin' && s.token;

// Permission check against the session's embedded permission array.
// Super admin carries ['*'] and passes everything.
const sessionCan = (session, perm) => {
  const perms = session?.permissions || [];
  if (perms.includes('*')) return true;
  if (!perm) return true;
  return perms.includes(perm);
};

// ── Inline SVG renderer ───────────────────────────────────────
const Ic = ({ d, size = 18, className = '', strokeWidth = 1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    className={`flex-shrink-0 ${className}`}>
    {(Array.isArray(d) ? d : [d]).map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const IC = {
  grid:      'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
  trendUp:   ['M23 6l-9.5 9.5-5-5L1 18','M17 6h6v6'],
  users:     ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8'],
  building:  ['M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z','M9 22V12h6v10'],
  calendar:  'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  clock:     ['M12 2a10 10 0 100 20A10 10 0 0012 2z','M12 7v5l4 2'],
  calCheck:  ['M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z','M9 14l2 2 4-4'],
  layers:    ['M12 2L2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5'],
  package:   ['M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z','M3.27 6.96L12 12.01l8.73-5.05','M12 22.08V12'],
  card:      ['M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z','M1 10h22'],
  userCheck: ['M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2','M9 11a4 4 0 100-8 4 4 0 000 8','M16 11l2 2 4-4'],
  shieldOk:  ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z','M9 12l2 2 4-4'],
  dollar:    ['M12 1v22','M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6'],
  wallet:    ['M21 12V7H5a2 2 0 010-4h14v4','M21 12v5H5a2 2 0 010-4h16z','M21 12H3'],
  refresh:   ['M1 4v6h6','M23 20v-6h-6','M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15'],
  tag:       ['M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z','M7 7h.01'],
  file:      ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z','M14 2v6h6','M16 13H8','M16 17H8','M10 9H8'],
  news:      ['M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z','M8 10h8','M8 14h4'],
  mail:      ['M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z','M22 6l-10 7L2 6'],
  help:      ['M12 22a10 10 0 100-20 10 10 0 000 20z','M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3','M12 17h.01'],
  star:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  photo:     ['M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z','M8.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z','M3 15l5-5 3 3 2-2 5 5'],
  chat:      'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
  alert:     ['M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z','M12 9v4','M12 17h.01'],
  msgSq:     'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
  palette:   ['M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z'],
  menu3:     ['M4 6h16','M4 12h8','M4 18h16'],
  layout2:   ['M3 3h7v7H3z','M14 3h7v7h-7z','M14 14h7v7h-7z','M3 14h7v7H3z'],
  gear:      ['M12 15a3 3 0 100-6 3 3 0 000 6z','M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z'],
  lock:      ['M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z','M8 11V7a4 4 0 118 0v4'],
  chevD:     'M19 9l-7 7-7-7',
  chevR:     'M9 18l6-6-6-6',
  bell:      ['M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z','M13.73 21a2 2 0 01-3.46 0'],
  search:    'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  sun:       ['M12 7a5 5 0 100 10A5 5 0 0012 7z','M12 1v2','M12 21v2','M4.22 4.22l1.42 1.42','M18.36 18.36l1.42 1.42','M1 12h2','M21 12h2','M4.22 19.78l1.42-1.42','M18.36 5.64l1.42-1.42'],
  moon:      'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  logout:    ['M17 16l4-4m0 0l-4-4m4 4H7','M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4'],
  zap:       'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  globe:     ['M12 2a10 10 0 100 20A10 10 0 0012 2z','M2 12h20','M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20'],
  send:      ['M22 2L11 13','M22 2l-7 20-4-9-9-4 20-7z'],
  phone:     ['M5 1h14a2 2 0 012 2v18a2 2 0 01-2 2H5a2 2 0 01-2-2V3a2 2 0 012-2z','M12 18h.01'],
  users2:    ['M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2','M23 21v-2a4 4 0 00-3-3.87','M16 3.13a4 4 0 010 7.75','M9 7a4 4 0 100 8 4 4 0 000-8z'],
  radio:     ['M1.42 9a16 16 0 0121.16 0','M5 12.55a11 11 0 0114.08 0','M10.54 17.09a5.5 5.5 0 012.92 0','M12 20h.01'],
  key:       ['M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4'],
  bars:      ['M18 20V10','M12 20V4','M6 20v-6'],
  activity:  'M22 12h-4l-3 9L9 3l-3 9H2',
  link2:     ['M15 7h3a5 5 0 010 10h-3m-6 0H6A5 5 0 016 7h3','M8 12h8'],
  external:  ['M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6','M15 3h6v6','M10 14L21 3'],
  hamb:      ['M4 6h16','M4 12h16','M4 18h16'],
  x:         ['M18 6L6 18','M6 6l12 12'],
  affiliate: ['M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71','M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71'],
};

const PATH_LABELS = {
  'super-dashboard':'Dashboard', revenue:'Revenue', pending:'Pending Actions',
  admin:null, bookings:'Bookings', users:'Users', services:'Services',
  settings:'General Settings', payment:'Payment Settings', plans:'Subscription Plans', addons:'Addons',
  providers:'Providers', active:'Active', suspended:'Suspended',
  kyc:'KYC', approved:'Approved', rejected:'Rejected',
  finance:'Finance', transactions:'Transactions', payouts:'Payouts', earnings:'Provider Earnings', refunds:'Refunds',
  content:'Content', pages:'Pages', blogs:'Blogs', newsletter:'Newsletter',
  faq:'FAQ', testimonials:'Testimonials',
  support:'Support', tickets:'Tickets', disputes:'Disputes', reviews:'Reviews', feedback:'Vendor Feedback',
  platform:'Platform', appearance:'Appearance', menu:'Menu Builder',
  footer:'Footer Builder', communication:'Communication', campaigns:'Campaigns', notifications:'Notification Settings', badges:'Badges',
  confirmed:'Confirmed', completed:'Completed', cancelled:'Cancelled', disputed:'Disputed',
  categories:'Categories', featured:'Featured',
  staff:'Staff & Roles', system:'System', audit:'Audit Logs',
  features:'Feature Status',
};

const NAV = [
  { id:'dashboard', section:'DASHBOARD', items:[
    { label:'Operations Center', icon:'grid',     to:'/super-dashboard', exact:true, perm:'ops.view' },
    { label:'Revenue',         icon:'trendUp',  to:'/super-dashboard/revenue', perm:'analytics.view' },
    { label:'Marketing Insights', icon:'trendUp', to:'/super-dashboard/insights', perm:'analytics.view' },
    { label:'Users',           icon:'users',    to:'/super-dashboard/users', perm:'users.view' },
    { label:'Providers',       icon:'building', to:'/super-dashboard/providers', perm:'professionals.view' },
    { label:'Bookings',        icon:'calendar', to:'/super-dashboard/bookings', perm:'bookings.view' },
    { label:'Pending Actions', icon:'clock',    to:'/super-dashboard/pending', perm:'ops.view' },
  ]},
  { id:'operations', section:'OPERATIONS', items:[
    { label:'Bookings', icon:'calCheck', groupId:'op-bookings', perm:'bookings.view', children:[
      { label:'All',       to:'/admin/bookings' },
      { label:'Confirmed', to:'/admin/bookings/confirmed' },
      { label:'Completed', to:'/admin/bookings/completed' },
      { label:'Cancelled', to:'/admin/bookings/cancelled' },
      { label:'Disputed',  to:'/admin/bookings/disputed' },
    ]},
    { label:'Services', icon:'layers', groupId:'op-services', perm:'services.view', children:[
      { label:'All Services', to:'/admin/services' },
      { label:'Categories',   to:'/admin/services/categories' },
      { label:'Featured',     to:'/admin/services/featured' },
    ]},
    { label:'Addons',             icon:'package', to:'/admin/addons', perm:'plans.manage' },
    { label:'Badges',             icon:'star',    to:'/admin/badges', perm:'badges.manage' },
    { label:'Subscription Plans', icon:'card',    to:'/admin/plans', perm:'plans.view' },
    { label:'Professions',        icon:'layers',  to:'/admin/professions', perm:'settings.manage' },
    { label:'Explore Page',        icon:'search',  to:'/admin/explore',      perm:'settings.manage' },
  ]},
  { id:'people', section:'PEOPLE', items:[
    { label:'Providers', icon:'userCheck', groupId:'ppl-providers', perm:'professionals.view', children:[
      { label:'Active',    to:'/admin/providers/active' },
      { label:'Pending',   to:'/admin/providers/pending' },
      { label:'Suspended', to:'/admin/providers/suspended' },
    ]},
    { label:'Users',  icon:'users',    to:'/admin/users', perm:'users.view' },
    { label:'KYC',    icon:'shieldOk', groupId:'ppl-kyc', perm:'kyc.view', children:[
      { label:'Pending',  to:'/admin/kyc/pending' },
      { label:'Approved', to:'/admin/kyc/approved' },
      { label:'Rejected', to:'/admin/kyc/rejected' },
    ]},
    { label:'Staff & Roles', icon:'users2', to:'/admin/staff', perm:'staff.manage' },
  ]},
  { id:'finance', section:'FINANCE', items:[
    { label:'Dashboard',         icon:'trendUp', to:'/admin/finance', exact:true, perm:'finance.view' },
    { label:'Journal',   icon:'file',    to:'/admin/finance/journal', perm:'finance.view' },
    { label:'Ledger',    icon:'layers',  to:'/admin/finance/ledger',  perm:'finance.view' },
    { label:'Transactions',      icon:'dollar',  to:'/admin/finance/transactions', perm:'finance.view' },
    { label:'Payouts',           icon:'wallet',  to:'/admin/finance/payouts', perm:'payouts.view' },
    { label:'Refunds',           icon:'refresh', to:'/admin/finance/refunds', perm:'finance.refund' },
    { label:'Coupons',           icon:'tag',     disabled:true },
  ]},
  { id:'content', section:'CONTENT', items:[
    { label:'Pages',         icon:'file',   to:'/admin/content/pages', perm:'cms.manage' },
    { label:'Blogs',         icon:'news',   to:'/admin/content/blogs', perm:'cms.manage' },
    { label:'Newsletter',    icon:'mail',   to:'/admin/content/newsletter', perm:'cms.manage' },
    { label:'FAQ',           icon:'help',   to:'/admin/content/faq', perm:'cms.manage' },
    { label:'Testimonials',  icon:'star',   to:'/admin/content/testimonials', perm:'cms.manage' },
    { label:'Media Library', icon:'photo',  disabled:true },
  ]},
  { id:'support', section:'SUPPORT', items:[
    { label:'Tickets',            icon:'chat',  to:'/admin/support/tickets', perm:'support.view' },
    { label:'Disputes',           icon:'alert', to:'/admin/support/disputes', perm:'disputes.view' },
    { label:'Reviews Moderation', icon:'msgSq', to:'/admin/support/reviews', perm:'reviews.moderate' },
    { label:'Vendor Feedback',    icon:'msgSq', to:'/admin/feedback', perm:'feedback.view' },
  ]},
  { id:'platform', section:'PLATFORM', items:[
    { label:'Appearance',       icon:'palette', to:'/admin/platform/appearance', perm:'branding.manage' },
    { label:'Menu Builder',     icon:'menu3',   to:'/admin/platform/menu', perm:'cms.manage' },
    { label:'Footer Builder',   icon:'layout2', to:'/admin/platform/footer', perm:'cms.manage' },
    { label:'Communication',    icon:'mail',    to:'/admin/platform/communication', perm:'email.manage' },
    { label:'Campaigns',        icon:'mail',    to:'/admin/campaigns', perm:'campaigns.view' },
    { label:'Notification Settings', icon:'bell', to:'/admin/notifications', perm:'notifications.view' },
    { label:'Payment Settings', icon:'card',    to:'/admin/settings/payment', perm:'settings.manage' },
    { label:'General Settings', icon:'gear',    to:'/admin/settings', perm:'settings.manage' },
  ]},
  { id:'security', section:'SECURITY', items:[
    { label:'Audit Logs',          icon:'activity',  to:'/admin/system/audit', perm:'audit.view' },
    { label:'Roles & Permissions', icon:'shieldOk', to:'/admin/staff', perm:'staff.manage' },
    { label:'API Keys',            icon:'key',       disabled:true },
  ]},
  { id:'control', section:'PLATFORM CONTROL', items:[
    { label:'Feature Status', icon:'zap', to:'/admin/features', perm:'settings.manage' },
  ]},
  { id:'future', section:'FUTURE MODULES', items:[
    { label:'Affiliates',           icon:'affiliate', disabled:true },
    { label:'CRM',                  icon:'users2',    disabled:true },
    { label:'Push Notifications',   icon:'send',      disabled:true },
    { label:'Marketing Automation', icon:'radio',     disabled:true },
    { label:'Revenue Analytics',    icon:'bars',      disabled:true },
    { label:'AI Assistant',         icon:'zap',       disabled:true },
    { label:'Webhooks',             icon:'globe',     disabled:true },
    { label:'Mobile App Controls',  icon:'phone',     disabled:true },
  ]},
];

const QUICK_ACTIONS = [
  { label:'Add Provider',    icon:'userCheck', to:'/admin/providers/pending' },
  { label:'Create Blog',     icon:'news',      to:'/admin/content/blogs' },
  { label:'Create Page',     icon:'file',      to:'/admin/content/pages' },
  { label:'Send Newsletter', icon:'mail',      to:'/admin/content/newsletter' },
  { label:'View Bookings',   icon:'calCheck',  to:'/admin/bookings' },
];

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
  const [darkMode,       setDarkMode]       = useState(false);
  const [showQuick,      setShowQuick]      = useState(false);
  const [showProfile,    setShowProfile]    = useState(false);
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
        {NAV.map(sec => {
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
        <Link to="/dashboard" className={`flex items-center gap-2.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-colors text-[12px] ${(!collapsed || mobile) ? 'px-2.5 py-2' : 'justify-center p-2.5'}`} title={(!collapsed || mobile) ? undefined : 'Vendor Dashboard'}>
          <Ic d={IC.external} size={14} />{(!collapsed || mobile) && <span>Vendor Dashboard</span>}
        </Link>
        <button onClick={handleLogout} className={`w-full flex items-center gap-2.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/[0.05] transition-colors text-[12px] ${(!collapsed || mobile) ? 'px-2.5 py-2' : 'justify-center p-2.5'}`} title={(!collapsed || mobile) ? undefined : 'Sign out'}>
          <Ic d={IC.logout} size={14} />{(!collapsed || mobile) && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-shell min-h-screen bg-[#F6F7F9] flex" style={{ fontFamily:"'Poppins',system-ui,sans-serif" }}>
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
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200/70 h-[54px] flex items-center gap-3 px-4 md:px-5 flex-shrink-0">
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
            <button className="btn hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 transition-colors text-[12px] text-gray-400 w-44">
              <Ic d={IC.search} size={13} /><span>Search...</span>
              <span className="ml-auto text-[10px] text-gray-300 font-mono bg-gray-200 px-1 rounded">⌘K</span>
            </button>

            <button className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Ic d={IC.bell} size={16} />
              <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-[#FE5100] ring-2 ring-white" />
            </button>

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

            <button onClick={() => setDarkMode(d => !d)} title={darkMode ? 'Light mode' : 'Dark mode'}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Ic d={darkMode ? IC.sun : IC.moon} size={16} />
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
    </div>
  );
};

export default AdminLayout;

// client/src/components/admin/adminNav.js
// Pure nav data + helpers for the admin shell. No JSX, no React — unit-testable.

import { DEPT_LINKS, DEPT_META } from './deptRegistry';

export const IC = {
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
  rupee:     ['M6 3h12','M6 8h12','M6 13h3','M9 13c6.667 0 6.667-10 0-10','M6 13l8.5 8'],
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
  ban:       ['M12 2a10 10 0 100 20A10 10 0 0012 2z','M5.64 5.64l12.72 12.72'],
  plus:      'M12 5v14M5 12h14',
  trash:     ['M3 6h18','M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2','M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6','M10 11v6','M14 11v6'],
  pencil:    'M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z',
  checkCircle: ['M22 11.08V12a10 10 0 11-5.93-9.14','M22 4L12 14.01l-3-3'],
  bookmark:  ['M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z','M9 10l2 2 4-4'],
  badgeCheck: ['M3.85 8.62a4 4 0 014.78-4.77 4 4 0 016.74 0 4 4 0 014.78 4.78 4 4 0 010 6.74 4 4 0 01-4.77 4.78 4 4 0 01-6.75 0 4 4 0 01-4.78-4.77 4 4 0 010-6.76z','M9 12l2 2 4-4'],
  check:     'M20 6L9 17l-5-5',
  trendDn:   ['M23 18l-9.5-9.5-5 5L1 6','M17 18h6v-6'],
  eye:       ['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z','M12 9a3 3 0 100 6 3 3 0 000-6z'],
  arrow:     'M5 12h14m-7-7l7 7-7 7',
};

export const PATH_LABELS = {
  'super-dashboard':'Dashboard', revenue:'Revenue', pending:'Pending Actions',
  admin:null, bookings:'Bookings', users:'Users', services:'Services',
  settings:'General Settings', payment:'Payment Settings', plans:'Subscription Plans', addons:'Addons',
  providers:'Hosts', active:'Active', suspended:'Suspended',
  professions:'Professions', explore:'Explore Page', insights:'Marketing Insights',
  kyc:'KYC', approved:'Approved', rejected:'Rejected',
  finance:'Finance', journal:'Journal', ledger:'Ledger', transactions:'Transactions', payouts:'Payouts', earnings:'Host Earnings', refunds:'Refunds',
  content:'Content', pages:'Pages', blogs:'Blogs', newsletter:'Newsletter',
  faq:'FAQ', testimonials:'Testimonials',
  support:'Support', tickets:'Tickets', disputes:'Disputes', reviews:'Reviews', feedback:'Host Feedback',
  platform:'Platform', appearance:'Appearance', menu:'Menu Builder',
  footer:'Footer Builder', communication:'Communication', campaigns:'Campaigns', notifications:'Notification Settings', badges:'Badges',
  confirmed:'Confirmed', completed:'Completed', cancelled:'Cancelled', disputed:'Disputed',
  categories:'Categories', featured:'Featured',
  staff:'Staff & Roles', system:'System', audit:'Audit Logs', reserved:'Reserved Slugs',
  features:'Feature Status',
  sales:'Sales', leads:'Leads', pipeline:'Pipeline', 'follow-ups':'Follow-ups', templates:'Templates',
  security:'Security', 'blocked-ips':'Blocked IPs',
  dept:'Department', cxo:'CXO', marketing:'Marketing', operation:'Operation', engineering:'Engineering', 'sloth-house':'Sloth House',
};

export const NAV = [
  // Main Dashboard section removed from the sidebar (2026-07-03). Operations
  // Center / Revenue / Marketing Insights / Pending Actions now live only as
  // inactive "parked" cards on the Sloth House hub (see deptRegistry.js).
  // Routes still exist; nothing here links to them anymore.
  { id:'operations', section:'Important', items:[
    { label:'Bookings', icon:'calCheck', to:'/admin/bookings', perm:'bookings.view' },
    { label:'Services', icon:'layers', to:'/admin/services', perm:'services.view' },
    { label:'Hosts',    icon:'userCheck', to:'/admin/providers', perm:'professionals.view' },
    { label:'Professions',        icon:'layers',  to:'/admin/professions', perm:'settings.manage' },
    // Subscription Plans moved out — now reachable via Finance & Marketing dept cards.
  ]},
  // Sales CRM command center — leads pipeline + outbound (leads.* gated).
  { id:'sales', section:'SALES', items:[
    { label:'Leads',      icon:'users2',    to:'/admin/sales/leads', perm:'leads.view' },
    { label:'Pipeline',   icon:'layout2',   to:'/admin/sales/pipeline', perm:'leads.view' },
    { label:'Follow-ups', icon:'clock',     to:'/admin/sales/follow-ups', perm:'leads.view' },
    { label:'Templates',  icon:'msgSq',     to:'/admin/sales/templates', perm:'leads.view' },
  ]},
  // Org departments — placeholder shells served by AdminDepartment (/admin/dept/:dept).
  // Mirrors DEPARTMENTS map in pages/admin/AdminDepartment.jsx.
  { id:'department', section:'DEPARTMENT', items:[
    { label:'CXO',         icon:'badgeCheck', to:'/admin/dept/cxo' },
    { label:'Support',     icon:'help',       to:'/admin/dept/support' },
    { label:'Marketing',   icon:'bars',       to:'/admin/dept/marketing' },
    { label:'Finance',     icon:'rupee',      to:'/admin/dept/finance' },
    { label:'Operation',   icon:'grid',       to:'/admin/dept/operation' },
    { label:'Engineering', icon:'gear',       to:'/admin/dept/engineering' },
    { label:'Sloth House', icon:'building',   to:'/admin/dept/sloth-house' },
  ]},
  /* ── HIDDEN FROM SIDEBAR (2026-07-03) ───────────────────────────────────────
     Every destination below now lives on its relevant department hub page
     (see deptRegistry.js), so these sections are commented out to keep the
     sidebar to Main Dashboard + Important + Departments. Routes still work;
     uncomment any section to restore it to the sidebar.
  { id:'people', section:'PEOPLE', items:[
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
    { label:'Media Library', icon:'photo',  disabled:true },
  ]},
  { id:'support', section:'SUPPORT', items:[
    { label:'Reviews Moderation', icon:'msgSq', to:'/admin/support/reviews', perm:'reviews.moderate' },
    { label:'Host Feedback',    icon:'msgSq', to:'/admin/feedback', perm:'feedback.view' },
    { label:'Bolt Support',     icon:'chat',  to:'/admin/support/bolt', perm:'support.view' },
  ]},
  { id:'platform', section:'PLATFORM', items:[
    { label:'Appearance',       icon:'palette', to:'/admin/platform/appearance', perm:'branding.manage' },
    { label:'Communication',    icon:'mail',    to:'/admin/platform/communication', perm:'email.manage' },
    { label:'Campaigns',        icon:'mail',    to:'/admin/campaigns', perm:'campaigns.view' },
    { label:'Notification Settings', icon:'bell', to:'/admin/notifications', perm:'notifications.view' },
    { label:'Payment Settings', icon:'card',    to:'/admin/settings/payment', perm:'settings.manage' },
    { label:'General Settings', icon:'gear',    to:'/admin/settings', perm:'settings.manage' },
  ]},
  { id:'system', section:'SYSTEM', items:[
    { label:'Audit Logs',     icon:'activity', to:'/admin/system/audit', perm:'audit.view' },
    { label:'Reserved Slugs', icon:'lock',     to:'/admin/system/reserved', perm:'settings.manage' },
    { label:'Blocked IPs',    icon:'ban',      to:'/admin/security/blocked-ips', perm:'settings.manage' },
    { label:'Feature Status', icon:'zap',      to:'/admin/features', perm:'settings.manage' },
    { label:'API Keys',       icon:'key',      disabled:true },
  ]},
  // Holding bucket for links pulled out of the sections above during cleanup.
  // When asked to "take link to others", move the item's object here so the
  // sidebar shrinks and re-arrangement stays organised. Empty = section hidden
  // (SidebarBody drops sections whose visible item count is 0).
  { id:'other', section:'OTHER', items:[
    { label:'Addons',             icon:'package', to:'/admin/addons', perm:'plans.manage' },
    { label:'Badges',             icon:'star',    to:'/admin/badges', perm:'badges.manage' },
    { label:'Explore Page',       icon:'search',  to:'/admin/explore', perm:'settings.manage' },
    { label:'KYC',    icon:'shieldOk', groupId:'ppl-kyc', perm:'kyc.view', children:[
      { label:'Overview', to:'/admin/kyc' },
      { label:'Pending',  to:'/admin/kyc/pending' },
      { label:'Verified', to:'/admin/kyc/approved' },
      { label:'Rejected', to:'/admin/kyc/rejected' },
    ]},
    { label:'Pages',              icon:'file',    to:'/admin/content/pages', perm:'cms.manage' },
    { label:'Blogs',              icon:'news',    to:'/admin/content/blogs', perm:'cms.manage' },
    { label:'Newsletter',         icon:'mail',    to:'/admin/content/newsletter', perm:'cms.manage' },
    { label:'FAQ',                icon:'help',    to:'/admin/content/faq', perm:'cms.manage' },
    { label:'Testimonials',       icon:'star',    to:'/admin/content/testimonials', perm:'cms.manage' },
    { label:'Tickets',            icon:'chat',    to:'/admin/support/tickets', perm:'support.view' },
    { label:'Disputes',           icon:'alert',   to:'/admin/support/disputes', perm:'disputes.view' },
    { label:'Menu Builder',       icon:'menu3',   to:'/admin/platform/menu', perm:'cms.manage' },
    { label:'Footer Builder',     icon:'layout2', to:'/admin/platform/footer', perm:'cms.manage' },
  ]},
  ─────────────────────────────────────────────────────────────────────────── */
];

export const QUICK_ACTIONS = [
  { label:'Add Host',        icon:'userCheck', to:'/admin/providers/pending' },
  { label:'Create Blog',     icon:'news',      to:'/admin/content/blogs' },
  { label:'Create Page',     icon:'file',      to:'/admin/content/pages' },
  { label:'Send Newsletter', icon:'mail',      to:'/admin/content/newsletter' },
  { label:'View Bookings',   icon:'calCheck',  to:'/admin/bookings' },
];

// Replaces the old flat `FUTURE MODULES` section. Coming-soon parents (comingSoon: true)
// that expand to inert children — pure roadmap teasers, nothing navigates.
export const ROADMAP = [
  { id: 'roadmap', section: 'ROADMAP', items: [
    { comingSoon: true, groupId: 'cs-roadmap', label: 'Coming Soon', icon: 'zap', children: [
      { label: 'CRM' }, { label: 'Marketing Automation' }, { label: 'Affiliates' },
      { label: 'Revenue Analytics' }, { label: 'Integrations' }, { label: 'AI Assistant' },
      { label: 'Mobile App' },
    ]},
  ]},
];

// Permission check against the session's embedded permission array.
export const sessionCan = (session, perm) => {
  const perms = session?.permissions || [];
  if (perms.includes('*')) return true;
  if (!perm) return true;
  return perms.includes(perm);
};

// Flatten NAV into a list of navigable destinations for the command palette.
// Excludes disabled leaves and coming-soon groups; honours permissions.
export const flattenDestinations = (nav, session) => {
  const out = [];
  nav.forEach(sec => {
    sec.items.forEach(item => {
      if (item.disabled || item.comingSoon) return;
      if (!sessionCan(session, item.perm)) return;
      if (item.children) {
        item.children.forEach(ch => {
          if (ch.to) out.push({ label: `${item.label} · ${ch.label}`, to: ch.to, section: sec.section });
        });
      } else if (item.to) {
        out.push({ label: item.label, to: item.to, section: sec.section });
      }
    });
  });
  return out;
};

// Full destination list for the command palette. The sidebar (NAV) was slimmed
// to Important + Departments on 2026-07-03, which stripped ~40 pages out of
// flattenDestinations(). The palette must still find every page by title, so we
// merge the visible NAV destinations with every navigable card in DEPT_LINKS
// (the single source of truth behind the department hubs). Deduped by path.
export const flattenAllDestinations = (nav, session) => {
  const byPath = new Map();
  const add = (dest) => { if (dest?.to && !byPath.has(dest.to)) byPath.set(dest.to, dest); };

  // Visible sidebar destinations first (keeps Important + department hub pages).
  flattenDestinations(nav, session).forEach(add);

  // Every real page tagged into a department hub. DEPT_LINKS has no perm field —
  // route guards enforce access on navigation, same as the hub pages themselves.
  DEPT_LINKS.forEach(link => {
    if (!link.to) return; // skip inactive / coming-soon cards
    const dept = link.depts?.[0];
    add({ label: link.label, to: link.to, section: (DEPT_META[dept]?.label || 'Pages').toUpperCase() });
  });

  return Array.from(byPath.values());
};

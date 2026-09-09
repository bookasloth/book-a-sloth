// client/src/components/admin/adminNav.js
// Pure nav data + helpers for the admin shell. No JSX, no React — unit-testable.
//
// SINGLE SOURCE OF TRUTH for admin navigation. The primary rail, secondary
// sidebar, breadcrumbs, and command palette ALL read `NAV` — never hardcode a
// link in a component. Each section is one primary-rail icon; its `items` are
// the secondary-sidebar list. Ordered by operator priority (frequency × urgency),
// not alphabetically. See docs/admin-nav-plan.md.

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
  providers:'Hosts', active:'Active', suspended:'Suspended', host360:'Host 360°', guest360:'Guest 360°',
  referrals:'Refer & Earn', 'invite-links':'Invite Links',
  professions:'Professions', explore:'Explore Page', insights:'Marketing Insights',
  kyc:'KYC', approved:'Approved', rejected:'Rejected',
  finance:'Finance', journal:'Journal', ledger:'Ledger', transactions:'Transactions', payouts:'Payouts', earnings:'Host Earnings', refunds:'Refunds',
  gst:'GST', invoices:'Invoices', issues:'Action Center', reconciliation:'Reconciliation', itc:'ITC', returns:'Returns', exports:'CA Exports',
  seo:'SEO', profiles:'Profiles', fixes:'Fixes', 'search-console':'Search Console',
  content:'Content', pages:'Pages', blogs:'Blogs', newsletter:'Newsletter',
  faq:'FAQ', testimonials:'Testimonials',
  support:'Support', tickets:'Tickets', disputes:'Disputes', reviews:'Reviews', feedback:'Host Feedback',
  chat:'Support Inbox', bolt:'Bolt Support',
  platform:'Platform', appearance:'Appearance', menu:'Menu Builder',
  footer:'Footer Builder', communication:'Communication', campaigns:'Campaigns', notifications:'Notification Settings', badges:'Badges',
  confirmed:'Confirmed', completed:'Completed', cancelled:'Cancelled', disputed:'Disputed',
  categories:'Categories', featured:'Featured',
  staff:'Staff & Roles', system:'System', audit:'Audit Logs', reserved:'Reserved Slugs',
  features:'Feature Status',
  sales:'Sales', leads:'Leads', pipeline:'Pipeline', 'follow-ups':'Follow-ups', reports:'Reports', templates:'Templates',
  desk:'Desk', sequences:'Sequences',
  security:'Security', 'blocked-ips':'Blocked IPs',
  dept:'Department', cxo:'CXO', marketing:'Marketing', operation:'Operation', engineering:'Engineering', 'sloth-house':'Sloth House',
};

// ── SECTIONS ──────────────────────────────────────────────────────────────
// key    — stable id, used for active-rail state + last-visited memory.
// label  — secondary-sidebar header + rail tooltip.
// icon   — IC key for the primary rail (distinct silhouette per section).
// color  — accent hex (from the c-* token palette, tailwind.config.js). Used as
//          a seasoning only: glyph tint + 2px active bar, never a full fill.
//          Rose/danger (#DC2626) is reserved for badge dots and is NOT used here.
// items  — secondary-sidebar list, priority-ordered within the section.
//          badge — an ops-summary key (opsAdminController.js) whose live count
//                  renders as a pill; the section dot sums its items' badges.
//          exact — highlight only on an exact path match (for index routes that
//                  are a prefix of their siblings).
export const NAV = [
  { key:'overview', label:'Overview', icon:'grid', color:'#2563eb', items:[
    { label:'Dashboard',          icon:'grid',      to:'/super-dashboard', exact:true, perm:'ops.view' },
    { label:'Revenue',            icon:'trendUp',   to:'/super-dashboard/revenue', perm:'analytics.view' },
    { label:'Pending Actions',    icon:'clock',     to:'/super-dashboard/pending', perm:'ops.view' },
    { label:'Marketing Insights', icon:'bars',      to:'/super-dashboard/insights', perm:'analytics.view' },
    { label:'Feature Status',     icon:'zap',       to:'/admin/features', perm:'settings.manage' },
  ]},
  { key:'operations', label:'Operations', icon:'calCheck', color:'#0891b2', items:[
    { label:'Bookings',           icon:'calCheck',  to:'/admin/bookings', perm:'bookings.view', badge:'stale_unpaid_bookings' },
    { label:'Services',           icon:'layers',    to:'/admin/services', perm:'services.view' },
    { label:'Service Categories', icon:'layers',    to:'/admin/services/categories', perm:'services.view' },
    { label:'Professions',        icon:'layers',    to:'/admin/professions', perm:'settings.manage' },
    // Explore Page merchandising is deferred — its backing tables (v2.9_explore.sql)
    // are not applied in prod, so every module returns "Failed to load". Hidden from
    // nav until the Explore foundation ships; the /admin/explore route still exists
    // in App.jsx for when it does.
    // { label:'Explore Page',       icon:'search',    to:'/admin/explore', perm:'settings.manage' },
    { label:'Addons',             icon:'package',   to:'/admin/addons', perm:'plans.manage' },
  ]},
  { key:'people', label:'People', icon:'userCheck', color:'#059669', items:[
    { label:'Hosts',              icon:'userCheck', to:'/admin/providers', perm:'professionals.view', badge:'pending_verifications' },
    { label:'KYC',                icon:'shieldOk',  to:'/admin/kyc', perm:'kyc.view' },
    { label:'Host 360°',          icon:'badgeCheck',to:'/admin/host360', perm:'professionals.view' },
    { label:'Guest 360°',         icon:'userCheck', to:'/admin/guest360', perm:'users.view' },
    { label:'Staff & Roles',      icon:'users2',    to:'/admin/staff', perm:'staff.manage' },
  ]},
  { key:'support', label:'Support & Moderation', icon:'chat', color:'#db2777', items:[
    { label:'Support Inbox',      icon:'msgSq',     to:'/admin/support/chat', perm:'support.view' },
    { label:'Tickets',            icon:'chat',      to:'/admin/support/tickets', perm:'support.view' },
    { label:'Disputes',           icon:'alert',     to:'/admin/support/disputes', perm:'disputes.view' },
    { label:'Reviews',            icon:'msgSq',     to:'/admin/support/reviews', perm:'reviews.moderate', badge:'pending_reviews' },
    { label:'Host Feedback',      icon:'msgSq',     to:'/admin/feedback', perm:'feedback.view' },
    { label:'Bolt Support',       icon:'chat',      to:'/admin/support/bolt', perm:'support.view' },
    { label:'Support Insights',   icon:'bars',      to:'/admin/support/insights', perm:'support.view' },
  ]},
  { key:'sales', label:'Sales / CRM', icon:'affiliate', color:'#f59e0b', items:[
    { label:'Leads',              icon:'users2',    to:'/admin/sales/leads', perm:'leads.view' },
    { label:'Pipeline',           icon:'layout2',   to:'/admin/sales/pipeline', perm:'leads.view' },
    { label:'Follow-ups',         icon:'clock',     to:'/admin/sales/follow-ups', perm:'leads.view' },
    { label:'Desk',               icon:'grid',      to:'/admin/sales/desk', perm:'leads.view' },
    { label:'Sequences',          icon:'send',      to:'/admin/sales/sequences', perm:'leads.view' },
    { label:'Templates',          icon:'msgSq',     to:'/admin/sales/templates', perm:'leads.view' },
    { label:'Reports',            icon:'layout2',   to:'/admin/sales/reports', perm:'leads.view' },
  ]},
  { key:'revenue', label:'Revenue', icon:'rupee', color:'#7c3aed', items:[
    { label:'Payouts',            icon:'wallet',    to:'/admin/finance/payouts', perm:'payouts.view', badge:'pending_payouts' },
    { label:'Refunds',            icon:'refresh',   to:'/admin/finance/refunds', perm:'finance.refund' },
    { label:'Transactions',       icon:'dollar',    to:'/admin/finance/transactions', perm:'finance.view' },
    { label:'Finance Dashboard',  icon:'trendUp',   to:'/admin/finance', exact:true, perm:'finance.view' },
    { label:'Ledger',             icon:'layers',    to:'/admin/finance/ledger', perm:'finance.view' },
    { label:'Journal',            icon:'file',      to:'/admin/finance/journal', perm:'finance.view' },
    { label:'Subscription Plans', icon:'card',      to:'/admin/plans', perm:'plans.view' },
    { label:'Refer & Earn',       icon:'affiliate', to:'/admin/referrals', perm:'referrals.view' },
    { label:'Invite Links',       icon:'link2',     to:'/admin/invite-links', perm:'referrals.view' },
  ]},
  { key:'gst', label:'GST', icon:'rupee', color:'#0ea5e9', items:[
    { label:'Overview',           icon:'trendUp',   to:'/admin/gst', exact:true, perm:'gst.view' },
    { label:'Action Center',      icon:'alert',     to:'/admin/gst/issues', perm:'gst.view' },
    { label:'Transactions',       icon:'dollar',    to:'/admin/gst/transactions', perm:'gst.view' },
    { label:'Invoices',           icon:'file',      to:'/admin/gst/invoices', perm:'gst.view' },
    { label:'Reconciliation',     icon:'refresh',   to:'/admin/gst/reconciliation', perm:'gst.reconcile' },
    { label:'ITC',                icon:'layers',    to:'/admin/gst/itc', perm:'gst.view' },
    { label:'Returns',            icon:'calCheck',  to:'/admin/gst/returns', perm:'gst.view' },
    { label:'Reports',            icon:'layout2',   to:'/admin/gst/reports', perm:'gst.view' },
    { label:'CA Exports',         icon:'package',   to:'/admin/gst/exports', perm:'gst.view' },
    { label:'Settings',           icon:'gear',      to:'/admin/gst/settings', perm:'gst.view' },
  ]},
  { key:'seo', label:'SEO & GEO', icon:'search', color:'#16a34a', items:[
    { label:'Dashboard',          icon:'grid',      to:'/admin/seo', exact:true, perm:'seo.manage' },
    { label:'Services',           icon:'layers',    to:'/admin/seo/services', perm:'seo.manage' },
    { label:'Profiles',           icon:'users',     to:'/admin/seo/profiles', perm:'seo.manage' },
    { label:'Blog',               icon:'news',      to:'/admin/seo/blogs', perm:'seo.manage' },
    { label:'Pages',              icon:'file',      to:'/admin/seo/pages', perm:'seo.manage' },
    { label:'Issues',             icon:'alert',     to:'/admin/seo/issues', perm:'seo.manage' },
    { label:'Fixes',              icon:'checkCircle', to:'/admin/seo/fixes', perm:'seo.manage' },
    { label:'Search Console',     icon:'search',    to:'/admin/seo/search-console', perm:'seo.manage' },
  ]},
  { key:'growth', label:'Growth', icon:'bars', color:'#FE5100', items:[
    { label:'Campaigns',          icon:'mail',      to:'/admin/campaigns', perm:'campaigns.view' },
    { label:'Communication',      icon:'mail',      to:'/admin/platform/communication', perm:'email.manage', badge:'failed_emails' },
    { label:'Notifications',      icon:'bell',      to:'/admin/notifications', perm:'notifications.view', badge:'failed_notifications' },
    { label:'Badges',             icon:'star',      to:'/admin/badges', perm:'badges.manage' },
    { label:'Appearance',         icon:'palette',   to:'/admin/platform/appearance', perm:'branding.manage' },
    { label:'Pages',              icon:'file',      to:'/admin/content/pages', perm:'cms.manage' },
    { label:'Blogs',              icon:'news',      to:'/admin/content/blogs', perm:'cms.manage' },
    { label:'Newsletter',         icon:'mail',      to:'/admin/content/newsletter', perm:'cms.manage' },
    { label:'FAQ',                icon:'help',      to:'/admin/content/faq', perm:'cms.manage' },
    { label:'Testimonials',       icon:'star',      to:'/admin/content/testimonials', perm:'cms.manage' },
    { label:'Menu Builder',       icon:'menu3',     to:'/admin/platform/menu', perm:'cms.manage' },
    { label:'Footer Builder',     icon:'layout2',   to:'/admin/platform/footer', perm:'cms.manage' },
  ]},
  { key:'system', label:'System', icon:'gear', color:'#6b7280', items:[
    { label:'General Settings',   icon:'gear',      to:'/admin/settings', exact:true, perm:'settings.manage' },
    { label:'Payment Settings',   icon:'card',      to:'/admin/settings/payment', perm:'settings.manage' },
    { label:'Audit Logs',         icon:'activity',  to:'/admin/system/audit', perm:'audit.view' },
    { label:'Blocked IPs',        icon:'ban',       to:'/admin/security/blocked-ips', perm:'settings.manage' },
    { label:'Reserved Slugs',     icon:'lock',      to:'/admin/system/reserved', perm:'settings.manage' },
  ]},
];

export const QUICK_ACTIONS = [
  { label:'Add Host',        icon:'userCheck', to:'/admin/providers/pending' },
  { label:'Create Blog',     icon:'news',      to:'/admin/content/blogs' },
  { label:'Create Page',     icon:'file',      to:'/admin/content/pages' },
  { label:'Send Newsletter', icon:'mail',      to:'/admin/content/newsletter' },
  { label:'View Bookings',   icon:'calCheck',  to:'/admin/bookings' },
];

// Permission check against the session's embedded permission array.
export const sessionCan = (session, perm) => {
  const perms = session?.permissions || [];
  if (perms.includes('*')) return true;
  if (!perm) return true;
  return perms.includes(perm);
};

// Flatten NAV into a list of navigable destinations for the command palette.
// Honours permissions and dedupes by path. NAV is now the single source of
// truth for every admin page, so this covers the whole console on its own.
export const flattenDestinations = (nav, session) => {
  const byPath = new Map();
  nav.forEach(sec => {
    sec.items.forEach(item => {
      if (!item.to) return;
      if (!sessionCan(session, item.perm)) return;
      if (!byPath.has(item.to)) byPath.set(item.to, { label: item.label, to: item.to, section: sec.label });
    });
  });
  return Array.from(byPath.values());
};

// Back-compat alias: NAV holds every page now, so "all destinations" == the
// permission-filtered flatten. Kept so CommandPalette's import is stable.
export const flattenAllDestinations = flattenDestinations;

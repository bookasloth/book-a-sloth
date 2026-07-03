// client/src/components/admin/deptRegistry.js
// Single source of truth for the department hub pages.
//
// DEPT_META  — the 7 departments (6 org + Sloth House catch-all).
// DEPT_LINKS — every navigable admin destination as a card, tagged to 1+
//              departments by context. A link may live in several departments.
//              Anything that fits no org department is tagged 'sloth-house'.
//
// AdminDepartment.jsx renders, per department, a 5-col grid of the cards whose
// `depts` array includes that department's slug. Descriptions are kept < 60 chars.

export const DEPT_ORDER = ['cxo', 'support', 'marketing', 'finance', 'operation', 'engineering', 'sloth-house'];

export const DEPT_META = {
  cxo:           { label: 'CXO',         icon: 'badgeCheck', blurb: 'Executive KPIs, cross-team health, and leadership rollups.' },
  support:       { label: 'Support',     icon: 'help',       blurb: 'Ticket queues, disputes, and customer-facing operations.' },
  marketing:     { label: 'Marketing',   icon: 'bars',       blurb: 'Campaigns, content, funnels, and acquisition metrics.' },
  finance:       { label: 'Finance',     icon: 'rupee',      blurb: 'Ledger, payouts, refunds, and financial reporting.' },
  operation:     { label: 'Operation',   icon: 'grid',       blurb: 'Bookings, hosts, services, and day-to-day throughput.' },
  engineering:   { label: 'Engineering', icon: 'gear',       blurb: 'Platform config, security, audit, and technical health.' },
  'sloth-house': { label: 'Sloth House', icon: 'building',   blurb: 'Cross-cutting and internal tools that fit no single team.' },
};

export const DEPT_LINKS = [
  // Dashboard
  { label: 'Operations Center',  icon: 'grid',    to: '/super-dashboard',            desc: 'Live ops overview & platform health',   depts: ['cxo', 'operation'] },
  { label: 'Revenue',            icon: 'trendUp', to: '/super-dashboard/revenue',    desc: 'GMV, LTV, and revenue breakdown',        depts: ['cxo', 'finance'] },
  { label: 'Marketing Insights', icon: 'bars',    to: '/super-dashboard/insights',   desc: 'Traffic, funnels & campaign performance', depts: ['marketing', 'cxo'] },
  { label: 'Pending Actions',    icon: 'clock',   to: '/super-dashboard/pending',    desc: 'Items awaiting admin decision',          depts: ['operation', 'cxo'] },

  // Operations
  { label: 'Bookings',           icon: 'calCheck', to: '/admin/bookings',   desc: 'All guest bookings across the platform', depts: ['operation', 'support'] },
  { label: 'Services',           icon: 'layers',   to: '/admin/services',   desc: 'Every host service and listing',         depts: ['operation', 'marketing'] },
  { label: 'Hosts',              icon: 'userCheck',to: '/admin/providers',  desc: 'Manage hosts and their status',          depts: ['operation', 'support'] },
  { label: 'Subscription Plans', icon: 'card',     to: '/admin/plans',      desc: 'Plan tiers, pricing, and limits',        depts: ['finance', 'marketing'] },
  { label: 'Professions',        icon: 'layers',   to: '/admin/professions',desc: 'Profession taxonomy and categories',     depts: ['operation', 'marketing'] },
  { label: 'Addons',             icon: 'package',  to: '/admin/addons',     desc: 'Paid add-ons and upsells',               depts: ['finance', 'operation'] },
  { label: 'Badges',             icon: 'star',     to: '/admin/badges',     desc: 'Host trust and achievement badges',      depts: ['marketing', 'operation'] },

  // People
  { label: 'KYC',           icon: 'shieldOk', to: '/admin/kyc/pending', desc: 'Verify host identity documents',      depts: ['support', 'operation'] },
  { label: 'Staff & Roles', icon: 'users2',   to: '/admin/staff',       desc: 'Admin accounts and permission roles', depts: ['cxo', 'engineering'] },

  // Finance
  { label: 'Finance Dashboard', icon: 'trendUp', to: '/admin/finance',              desc: 'Financial overview and KPIs',      depts: ['finance', 'cxo'] },
  { label: 'Journal',           icon: 'file',    to: '/admin/finance/journal',      desc: 'Double-entry accounting journal',  depts: ['finance'] },
  { label: 'Ledger',            icon: 'layers',  to: '/admin/finance/ledger',       desc: 'Account balances and ledger',      depts: ['finance'] },
  { label: 'Transactions',      icon: 'dollar',  to: '/admin/finance/transactions', desc: 'All payment transactions',         depts: ['finance'] },
  { label: 'Payouts',           icon: 'wallet',  to: '/admin/finance/payouts',      desc: 'Host earnings and payout runs',    depts: ['finance', 'operation'] },
  { label: 'Refunds',           icon: 'refresh', to: '/admin/finance/refunds',      desc: 'Process and track refunds',        depts: ['finance', 'support'] },

  // Content
  { label: 'Pages',        icon: 'file', to: '/admin/content/pages',        desc: 'CMS pages and static content',      depts: ['marketing'] },
  { label: 'Blogs',        icon: 'news', to: '/admin/content/blogs',        desc: 'Blog posts and articles',           depts: ['marketing'] },
  { label: 'Newsletter',   icon: 'mail', to: '/admin/content/newsletter',   desc: 'Email newsletters to subscribers',  depts: ['marketing'] },
  { label: 'FAQ',          icon: 'help', to: '/admin/content/faq',          desc: 'Help centre questions & answers',   depts: ['support', 'marketing'] },
  { label: 'Testimonials', icon: 'star', to: '/admin/content/testimonials', desc: 'Customer testimonials on site',     depts: ['marketing'] },

  // Support
  { label: 'Reviews Moderation', icon: 'msgSq', to: '/admin/support/reviews',  desc: 'Approve or reject user reviews',   depts: ['support', 'marketing'] },
  { label: 'Tickets',            icon: 'chat',  to: '/admin/support/tickets',  desc: 'Customer support ticket queue',    depts: ['support'] },
  { label: 'Disputes',           icon: 'alert', to: '/admin/support/disputes', desc: 'Booking and payment disputes',     depts: ['support', 'finance'] },
  { label: 'Host Feedback',      icon: 'msgSq', to: '/admin/feedback',         desc: 'Feedback submitted by hosts',      depts: ['support', 'cxo'] },

  // Platform / Marketing tooling
  { label: 'Appearance',          icon: 'palette', to: '/admin/platform/appearance',    desc: 'Branding, themes, and visuals',       depts: ['marketing', 'engineering'] },
  { label: 'Menu Builder',        icon: 'menu3',   to: '/admin/platform/menu',          desc: 'Configure the site navigation menu',  depts: ['marketing', 'engineering'] },
  { label: 'Footer Builder',      icon: 'layout2', to: '/admin/platform/footer',        desc: 'Configure the site footer',           depts: ['marketing', 'engineering'] },
  { label: 'Communication',       icon: 'mail',    to: '/admin/platform/communication', desc: 'Email & message template settings',   depts: ['marketing', 'support'] },
  { label: 'Campaigns',           icon: 'mail',    to: '/admin/campaigns',              desc: 'Marketing campaigns and blasts',      depts: ['marketing'] },
  { label: 'Notification Settings',icon: 'bell',   to: '/admin/notifications',          desc: 'Platform notification controls',      depts: ['marketing', 'engineering'] },
  { label: 'Explore Page',        icon: 'search',  to: '/admin/explore',                desc: 'Curate the public explore page',      depts: ['marketing'] },

  // System / Engineering
  { label: 'Payment Settings', icon: 'card',     to: '/admin/settings/payment',    desc: 'Razorpay and payment gateway config', depts: ['finance', 'engineering'] },
  { label: 'General Settings', icon: 'gear',     to: '/admin/settings',            desc: 'Global platform settings',            depts: ['engineering', 'sloth-house'] },
  { label: 'Audit Logs',       icon: 'activity', to: '/admin/system/audit',        desc: 'Who did what, when — action trail',   depts: ['engineering', 'cxo'] },
  { label: 'Reserved Slugs',   icon: 'lock',     to: '/admin/system/reserved',     desc: 'Protected URL slugs and namespaces',  depts: ['engineering', 'sloth-house'] },
  { label: 'Blocked IPs',      icon: 'ban',      to: '/admin/security/blocked-ips',desc: 'IP blocklist and abuse controls',     depts: ['engineering', 'support'] },
  { label: 'Feature Status',   icon: 'zap',      to: '/admin/features',            desc: 'Feature flags and kill-switches',     depts: ['engineering', 'cxo'] },
];

// All cards tagged to a given department slug, in registry order.
export const linksForDept = (slug) => DEPT_LINKS.filter((l) => l.depts.includes(slug));

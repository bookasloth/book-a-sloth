// L1 — route-derived + future-namespace reservations. This is the version-
// controlled enforcement AUTHORITY for platform names: a row here can never be
// deleted by a runtime DB write (unlike L2 / reserved_slugs). A CI test
// (client/src/__tests__/routeManifestSync) asserts every app route's first path
// segment appears here, so the list can never silently drift behind the router.
//
// Grouped by category for auditability and so the admin UI can render "why is
// this reserved". Everything is normalized through the same slug normalizer used
// at every write point, so comparisons are apples-to-apples.
const { normalizeSlug } = require('../utils/slugNormalize');

// Every first path-segment the app owns today (client App.jsx + server root routes).
const ROUTES = [
  'login', 'logout', 'signin', 'signup', 'register', 'forgot-password', 'reset-password',
  'help', 'about', 'privacy', 'terms', 'refund', 'unsubscribe', 'support', 'explore',
  'be-a-sloth', 'login-as-vendor', 'vendor', 'vendor-register', 'auth',
  'hello-sloth', 'super-dashboard', 'admin', 'dashboard', 'user', 'review', 'lp',
  'my-bookings', 'profile', 'reviews', 'loyalty', 'settings', 'search',
  'sitemap', 'robots', 'health', 'manifest', 'favicon', 'get-in-touch',
];

// Infrastructure / technical reserved handles.
const INFRA = [
  'api', 'www', 'cdn', 'static', 'assets', 'public', 'media', 'files', 'img', 'images',
  'download', 'downloads', 'webhook', 'webhooks', 'oauth', 'sso', 'saml', 'callback',
  'well-known', 'healthz', 'ping', 'status', 'metrics', 'debug', 'internal', 'system', 'root',
];

// Future product / marketing namespaces — reserved now so the business can
// launch them later without being blocked by a user-claimed slug.
const FUTURE = [
  'docs', 'doc', 'blog', 'blogs', 'pricing', 'plans', 'plan', 'features', 'feature',
  'changelog', 'roadmap', 'security', 'legal', 'cookies', 'careers', 'jobs', 'press',
  'newsroom', 'contact', 'faq', 'guides', 'guide', 'tutorials', 'tutorial', 'resources',
  'learn', 'academy', 'courses', 'partners', 'affiliates', 'developers', 'developer',
  'api-docs', 'enterprise', 'teams', 'team', 'org', 'orgs', 'organization', 'organizations',
  'workspace', 'workspaces', 'community', 'communities', 'marketplace', 'store', 'shop', 'market',
];

// Auth / account / commerce / booking nouns.
const ACCOUNT = [
  'account', 'accounts', 'billing', 'invoice', 'invoices', 'checkout', 'cart', 'verify',
  'confirm', 'activate', 'welcome', 'onboarding', 'get-started', 'start', 'join', 'invite',
  'refer', 'referral', 'book', 'booking', 'bookings', 'schedule', 'appointment', 'appointments',
  'slot', 'slots', 'availability', 'service', 'services', 'product', 'products', 'order', 'orders',
  'payment', 'payments', 'pay', 'subscribe', 'subscription', 'subscriptions', 'upgrade',
  'redeem', 'gift', 'promo', 'coupon', 'deals', 'offers', 'notifications', 'campaigns', 'badges',
  'categories', 'category', 'feedback',
];

// Brand / role / safety / impersonation-prevention.
const BRAND = [
  'bookasloth', 'book-a-sloth', 'sloth', 'slothofficial', 'official', 'verified', 'staff',
  'moderator', 'mod', 'administrator', 'superadmin', 'team-sloth', 'no-reply', 'noreply',
  'postmaster', 'abuse', 'hostmaster', 'mail', 'email', 'hosts', 'host', 'users', 'vendors',
  'home', 'index', 'me', 'guest', 'app', 'apps', 'web', 'go',
];

// Single / very-short handles — premium landgrab guard (also reserved at L1).
const SHORT = ['a', 'i', 'u', 's', 'p', 'c', 'e', 'r', 'o', 'x', 'm'];

// Literal hazards that must never be a slug.
const HAZARD = ['null', 'undefined', 'true', 'false', 'nan', 'none', 'nil', 'void'];

// Branded error / status pages — each has its own /<code> route on the client
// (config/errorCatalog.js), plus offline + maintenance. Reserved so a user can
// never claim "/404" and shadow an error page. Includes the common non-routed
// codes too, future-proofing new error pages (brief: "reserve any future error
// routes").
const STATUS = [
  '400', '401', '402', '403', '404', '405', '406', '408', '409', '410',
  '411', '412', '413', '414', '415', '418', '422', '423', '425', '426',
  '429', '431', '451',
  '500', '501', '502', '503', '504', '505', '507', '508', '511',
  'offline', 'maintenance', 'waitlist',
];

const CATEGORIES = { ROUTES, INFRA, FUTURE, ACCOUNT, BRAND, SHORT, HAZARD, STATUS };

// Normalized set of every L1 reserved name.
const RESERVED_SET = new Set(
  Object.values(CATEGORIES).flat().map(normalizeSlug),
);

// True if a NORMALIZED slug exactly matches an L1 reserved name. (Exact match is
// sufficient for route protection: user slugs are single path segments, so
// "/admin-tips" never collides with "/admin" or "/admin/x". Prefix/namespace
// reservation is an opt-in L2 concern, not an L1 one.)
function isStaticReserved(norm) {
  return RESERVED_SET.has(norm);
}

module.exports = { RESERVED_SET, isStaticReserved, CATEGORIES };

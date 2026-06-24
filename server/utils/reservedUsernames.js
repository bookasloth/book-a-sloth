// Reserved usernames — MANDATORY guard because public profiles are served at the
// ROOT path (`/:slug`), sharing the namespace with real app routes. A username
// that matches a route would shadow it. Keep this in sync with the first path
// segment of every top-level route in client/src/App.jsx, plus API/infra words.
//
// Used by BOTH the auto-generator (server/utils/usernameGenerator.js) and the
// change endpoint (server/controllers/usernameController.js).

const RESERVED = new Set([
  // App routes (first segment)
  'login', 'logout', 'signin', 'signup', 'register', 'forgot-password',
  'reset-password', 'help', 'about', 'privacy', 'terms', 'refund', 'unsubscribe',
  'vendor', 'vendors', 'be-a-sloth', 'login-as-vendor', 'vendor-register',
  'auth', 'hello-sloth', 'dashboard', 'super-dashboard', 'admin', 'explore',
  'my-bookings', 'profile', 'review', 'reviews', 'loyalty', 'settings', 'search', 'lp',
  // Infra / API / common reserved handles
  'api', 'u', 'user', 'users', 'host', 'hosts', 'static', 'assets', 'public',
  'cdn', 'img', 'images', 'media', 'files', 'download', 'downloads', 'webhook',
  'webhooks', 'app', 'www', 'mail', 'email', 'support', 'contact', 'pricing',
  'plans', 'plan', 'upgrade', 'billing', 'payment', 'payments', 'checkout',
  'book', 'booking', 'bookings', 'service', 'services', 'product', 'products',
  'category', 'categories', 'notifications', 'campaigns', 'badges', 'home',
  'index', 'null', 'undefined', 'true', 'false', 'me', 'guest',
]);

// Case-insensitive check on the full slug.
function isReserved(slug) {
  if (!slug) return true;
  return RESERVED.has(String(slug).toLowerCase().trim());
}

module.exports = { isReserved, RESERVED };

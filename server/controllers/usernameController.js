const usernameService = require('../services/usernameService');
const { isReserved } = require('../utils/reservedUsernames');
const { safeError } = require('../utils/httpError');
const { bustSitemapCache } = require('../utils/sitemapCache');

// Strict format: lowercase letters/digits in hyphen-separated groups, 3–30 chars.
const USERNAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateFormat(slug) {
  if (!slug || slug.length < 3 || slug.length > 30) {
    return 'Username must be 3–30 characters.';
  }
  if (!USERNAME_RE.test(slug)) {
    return 'Use only lowercase letters, numbers, and single hyphens.';
  }
  if (isReserved(slug)) {
    return 'That username is reserved.';
  }
  return null;
}

// GET /api/username/check/:slug  (auth) — live availability while typing.
const checkUsername = async (req, res) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase().trim();
    const formatError = validateFormat(slug);
    if (formatError) return res.json({ available: false, reason: formatError });
    const taken = await usernameService.usernameExists(slug);
    return res.json({ available: !taken, reason: taken ? 'That username is taken.' : null });
  } catch (error) {
    safeError(res, error);
  }
};

// GET /api/username/resolve/:slug  (public) — used by the Vercel edge redirect.
// Returns the canonical (current) username and whether the requested slug is it.
const resolveUsername = async (req, res) => {
  try {
    const result = await usernameService.resolve(req.params.slug);
    if (!result) return res.status(404).json({ found: false });
    return res.json({
      found: true,
      current: result.currentUsername,
      isCurrent: result.isCurrent,
    });
  } catch (error) {
    safeError(res, error);
  }
};

// PUT /api/host/username  (auth) — gated, rate-limited username change.
const changeUsername = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Authentication required.' });

    const slug = String(req.body?.username || '').toLowerCase().trim();
    const formatError = validateFormat(slug);
    if (formatError) return res.status(400).json({ message: formatError });

    const result = await usernameService.changeUsername(req.user.id, slug);
    if (result.ok) {
      bustSitemapCache(); // host + all their service URLs moved to the new username
      return res.json({ success: true, username: result.username });
    }

    const REASONS = {
      whatsapp_unverified: [403, 'Verify your WhatsApp number before changing your username.'],
      taken: [409, 'That username is taken.'],
      limit_reached: [429, 'You can change your username at most twice per year.'],
      too_soon: [429, result.next_eligible
        ? `You can change again on ${new Date(result.next_eligible).toLocaleDateString('en-IN')}.`
        : 'You changed your username too recently. Try again later.'],
      error: [500, 'Could not change your username. Try again.'],
    };
    const [code, message] = REASONS[result.reason] || [400, 'Could not change your username.'];
    return res.status(code).json({ message, reason: result.reason, next_eligible: result.next_eligible || null });
  } catch (error) {
    safeError(res, error);
  }
};

module.exports = { checkUsername, resolveUsername, changeUsername };

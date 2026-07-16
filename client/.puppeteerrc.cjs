const { join } = require('path');

/**
 * Keep puppeteer's Chrome download inside the project directory.
 *
 * Vercel runs install and build as separate steps and does not carry
 * /vercel/.cache (puppeteer's default) across them. Chrome downloaded at install
 * time was therefore gone by build time, so scripts/prerender.mjs failed with
 * "Could not find Chrome ... cache path ... /vercel/.cache/puppeteer" on every
 * deploy, and — because it exits 0 by design — the build went green having
 * prerendered nothing. Prod served the raw SPA shell to crawlers for weeks.
 *
 * The project directory does survive between the two steps, so pinning the cache
 * here is what makes the prerender actually run in CI.
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};

/**
 * Email provider abstraction (PRD §18).
 *
 * Every provider implements one method:
 *   sendEmail({ to, subject, html, fromName, fromEmail }) → { success, id?, response?, error? }
 *
 * Business logic never imports a provider directly — it goes through the
 * Communication Engine, which selects the provider from email_settings.provider.
 * Swapping SMTP → Resend → SES is a settings change, no code change.
 */

'use strict';

const smtpProvider = require('./smtpProvider');
const resendProvider = require('./resendProvider');
const sesProvider = require('./sesProvider');
const { isPlaceholderEmail } = require('../placeholderEmail');

const PROVIDERS = {
  smtp: smtpProvider,
  resend: resendProvider,
  ses: sesProvider,
};

/**
 * Resolve a provider by name (default SMTP), wrapped with the universal
 * placeholder-recipient guard: a phone-only user's synthetic
 * p<phone>@users.bookasloth.app address can't receive mail, so we short-circuit to
 * a benign no-op success (never call the real provider → no bounce) for EVERY email
 * path — CRM, transactional and campaign alike — from this one chokepoint. Success
 * (not an error) so inline callers that throw on failure aren't broken.
 */
function getProvider(name) {
  const provider = PROVIDERS[(name || 'smtp').toLowerCase()] || smtpProvider;
  return {
    ...provider,
    sendEmail: async (opts = {}) => {
      const to = Array.isArray(opts.to) ? opts.to[0] : opts.to;
      if (isPlaceholderEmail(to)) return { success: true, skipped: true, id: null, reason: 'placeholder_recipient' };
      return provider.sendEmail(opts);
    },
  };
}

module.exports = { getProvider, PROVIDERS };

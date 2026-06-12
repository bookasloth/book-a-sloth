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

const PROVIDERS = {
  smtp: smtpProvider,
  resend: resendProvider,
  ses: sesProvider,
};

/** Resolve a provider by name, defaulting to SMTP. */
function getProvider(name) {
  return PROVIDERS[(name || 'smtp').toLowerCase()] || smtpProvider;
}

module.exports = { getProvider, PROVIDERS };

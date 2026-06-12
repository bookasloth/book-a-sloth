/**
 * placeholderResolver.js — resolve {{snake_case}} placeholders in templates.
 *
 * Pure and dependency-free so it is trivially testable. Global placeholders
 * (current_year, support_email, website, etc.) are merged from settings and
 * always available; per-send data overrides them. Unknown placeholders resolve
 * to '' so raw {{tokens}} never leak into a delivered email.
 */

'use strict';

const PLACEHOLDER_RE = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

/** Build the global placeholder context from email settings + a user object. */
function buildGlobals(settings = {}, user = {}) {
  const websiteUrl = settings.website_url || 'https://bookasloth.in';
  const name = user.name || user.user_name || '';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return {
    current_year: String(new Date().getFullYear()),
    support_email: settings.support_email || 'support@bookasloth.in',
    website_url: websiteUrl,
    brand_color: settings.brand_color || '#FE5100',
    dashboard_url: `${websiteUrl}/dashboard`,
    profile_url: user.username ? `${websiteUrl}/${user.username}` : websiteUrl,
    user_name: name,
    first_name: parts[0] || 'there',
    last_name: parts.slice(1).join(' ') || '',
    email: user.email || '',
  };
}

/**
 * Replace placeholders in a string using a context object.
 * @returns {{ text, missing }} text with substitutions; missing = unresolved keys
 */
function resolveString(input, context = {}) {
  const missing = [];
  if (input == null) return { text: '', missing };
  const text = String(input).replace(PLACEHOLDER_RE, (_m, key) => {
    const k = key.toLowerCase();
    if (context[k] != null && context[k] !== '') return String(context[k]);
    if (k in context) return String(context[k] ?? '');
    missing.push(k);
    return '';
  });
  return { text, missing };
}

/**
 * Resolve subject, body and CTA url for a template against a merged context.
 * @param {object} template  { subject, html_content, cta_url, cta_label }
 * @param {object} data      per-send placeholder values
 * @param {object} globals   global placeholders (from buildGlobals)
 * @returns {{ subject, html, ctaUrl, ctaLabel, missing }}
 */
function resolveTemplate(template, data = {}, globals = {}) {
  const context = { ...globals, ...data };
  const subject = resolveString(template.subject, context);
  const html = resolveString(template.html_content, context);
  const ctaUrl = resolveString(template.cta_url, context);
  const missing = [...new Set([...subject.missing, ...html.missing, ...ctaUrl.missing])];
  return {
    subject: subject.text,
    html: html.text,
    ctaUrl: ctaUrl.text,
    ctaLabel: template.cta_label || '',
    missing,
  };
}

module.exports = { buildGlobals, resolveString, resolveTemplate, PLACEHOLDER_RE };

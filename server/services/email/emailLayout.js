/**
 * emailLayout.js — the ONE standard email shell.
 *
 * Structure: HEADER (logo + category chip) → BODY → optional CTA → FOOTER
 * (logo, link row, company address, email reason, copyright).
 *
 * Design tokens are defined as constants and interpolated into inline styles.
 * Email clients do not support CSS custom properties, so values are inlined.
 * Table-based layout for Outlook / Gmail / Apple Mail / dark-mode compatibility.
 * Max width: 600px.
 *
 * Footer link URLs discovered from app router (App.jsx):
 *   /dashboard           ✓ exists — Manage Account
 *   /dashboard/profile   ✓ exists — Preferences
 *   /help                TODO — Help Center page not yet built
 *   /privacy             TODO — Privacy Policy page not yet built
 *   /terms               TODO — Terms of Service page not yet built
 *   /unsubscribe         TODO — Unsubscribe endpoint not yet built
 */

'use strict';

const esc = (s) => String(s == null ? '' : s).replace(/"/g, '&quot;');

// Brand design tokens
const D = {
  primary:  '#FE5100',
  dark:     '#202124',
  muted:    '#5f6368',
  border:   '#edf0f2',
  bg:       '#f3f5f7',
  chipBg:   '#FFF4EE',  // light tint of brand primary
  white:    '#ffffff',
  subtext:  '#6b7280',
  note:     '#9ca3af',
  font:     "'Poppins','Plus Jakarta Sans',Arial,sans-serif",
};

/** Derive footer page URLs from the configured website base. */
function buildFooterUrls(websiteUrl) {
  return {
    help:        `${websiteUrl}/help`,              // TODO: /help not yet built
    privacy:     `${websiteUrl}/privacy`,           // TODO: /privacy not yet built
    terms:       `${websiteUrl}/terms`,             // TODO: /terms not yet built
    account:     `${websiteUrl}/dashboard`,         // ✓ /dashboard exists
    preferences: `${websiteUrl}/dashboard/profile`, // ✓ /dashboard/profile exists
    unsubscribe: `${websiteUrl}/unsubscribe`,       // TODO: /unsubscribe not yet built
  };
}

/**
 * Render a complete email HTML document.
 *
 * @param {object}  opts
 * @param {string}  opts.bodyHtml        resolved template body (no layout chrome)
 * @param {string}  [opts.previewText]   inbox preheader
 * @param {string}  [opts.ctaLabel]      button text (button omitted if blank)
 * @param {string}  [opts.ctaUrl]        button URL
 * @param {string}  [opts.emailCategory] right-side header chip, e.g. "Security Check"
 * @param {string}  [opts.emailReason]   footer legal copy
 * @param {object}  opts.settings        email_settings row from DB
 * @returns {string} full HTML document
 */
function renderLayout({
  bodyHtml      = '',
  previewText   = '',
  ctaLabel      = '',
  ctaUrl        = '',
  emailCategory = '',
  emailReason   = '',
  settings      = {},
}) {
  const brand    = settings.brand_color   || D.primary;
  const website  = settings.website_url   || 'https://bookasloth.in';
  const support  = settings.support_email || 'support@bookasloth.in';
  const fromName = settings.from_name     || 'Book A Sloth';
  const logo     = settings.logo_url      || '';
  const year     = new Date().getFullYear();
  const urls     = buildFooterUrls(website);

  // ── Header: logo (left)
  const headerLogo = logo
    ? `<img src="${esc(logo)}" alt="${esc(fromName)}" height="32" style="display:block;border:0;height:32px;">`
    : `<span style="font-size:18px;font-weight:800;letter-spacing:-0.01em;color:${esc(brand)};font-family:${D.font};">${esc(fromName)}</span>`;

  // ── Header: category chip (right), visible only when a value is present
  const categoryCell = emailCategory
    ? `<td style="vertical-align:middle;text-align:right;white-space:nowrap;padding-left:12px;">
         <span style="display:inline-block;padding:5px 14px;font-size:11px;font-weight:700;letter-spacing:0.04em;color:${esc(brand)};background:${D.chipBg};border-radius:100px;font-family:${D.font};">${esc(emailCategory)}</span>
       </td>`
    : '';

  // ── CTA button
  const cta = ctaLabel && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 4px;">
         <tr><td style="border-radius:8px;background:${esc(brand)};">
           <a href="${esc(ctaUrl)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;font-family:${D.font};">${esc(ctaLabel)}</a>
         </td></tr>
       </table>`
    : '';

  // ── Footer: logo (slightly smaller than header logo)
  const footerLogo = logo
    ? `<img src="${esc(logo)}" alt="${esc(fromName)}" height="26" style="display:block;border:0;height:26px;">`
    : `<span style="font-size:15px;font-weight:800;letter-spacing:-0.01em;color:${D.dark};font-family:${D.font};">${esc(fromName)}</span>`;

  // ── Footer link row
  const lk = (href, label) =>
    `<a href="${esc(href)}" style="color:${D.muted};text-decoration:none;font-size:12px;font-family:${D.font};">${label}</a>`;
  const dot = `<span style="color:${D.note};margin:0 5px;">&middot;</span>`;
  const footerLinks = [
    lk(urls.help,        'Help Center'),
    lk(urls.privacy,     'Privacy Policy'),
    lk(urls.terms,       'Terms of Service'),
    lk(urls.account,     'Manage Account'),
    lk(urls.preferences, 'Preferences'),
    lk(urls.unsubscribe, 'Unsubscribe'),
  ].join(dot);

  // ── Optional custom HTML injected from email_settings.footer_html
  const customFooter = settings.footer_html
    ? `<div style="margin-bottom:14px;">${settings.footer_html}</div>`
    : '';

  // ── Legal / reason copy (why this email was sent)
  const reasonEl = emailReason
    ? `<p style="margin:14px 0 0;font-size:11px;line-height:1.65;color:${D.note};font-family:${D.font};">${esc(emailReason)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${esc(fromName)}</title>
</head>
<body style="margin:0;padding:0;background:${D.bg};font-family:${D.font};">

  <!-- Inbox preheader (hidden) -->
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;font-size:1px;">${esc(previewText)}</span>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${D.bg};padding:28px 12px;">
    <tr><td align="center">

      <!-- Email card: 600px max, rounded, shadow -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:${D.white};border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,0.07);">

        <!-- ══ HEADER ══════════════════════════════════════════════ -->
        <tr>
          <td style="padding:20px 32px;border-bottom:1px solid ${D.border};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">${headerLogo}</td>
                ${categoryCell}
              </tr>
            </table>
          </td>
        </tr>

        <!-- ══ BODY + CTA ══════════════════════════════════════════ -->
        <tr>
          <td style="padding:32px 32px 18px;">
            ${bodyHtml}
            ${cta}
          </td>
        </tr>

        <!-- ══ FOOTER ══════════════════════════════════════════════ -->
        <tr>
          <td style="padding:24px 32px 28px;border-top:1px solid ${D.border};background:${D.bg};">

            <!-- Footer logo -->
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
              <tr><td>${footerLogo}</td></tr>
            </table>

            ${customFooter}

            <!-- Link row -->
            <p style="margin:0 0 18px;font-size:12px;line-height:2.2;font-family:${D.font};">${footerLinks}</p>

            <!-- Company address -->
            <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:${D.dark};font-family:${D.font};">Timewheel Internet (P) Ltd</p>
            <p style="margin:0 0 2px;font-size:12px;line-height:1.6;color:${D.muted};font-family:${D.font};">2nd Floor, Eureka Coworking, Mate Square, Nagpur 440030</p>
            <p style="margin:0;font-size:12px;color:${D.muted};font-family:${D.font};"><a href="mailto:${esc(support)}" style="color:${D.muted};text-decoration:none;">${esc(support)}</a></p>

            <!-- Email reason / legal copy -->
            ${reasonEl}

            <!-- Copyright -->
            <p style="margin:14px 0 0;font-size:11px;color:${D.note};font-family:${D.font};">© ${year} ${esc(fromName)}. All rights reserved.</p>

          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}

module.exports = { renderLayout };

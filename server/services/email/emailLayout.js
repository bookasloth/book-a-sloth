/**
 * emailLayout.js — the ONE standard email shell (PRD §8).
 *
 * Every email = HEADER (logo) + BODY (template) + optional CTA button + FOOTER
 * (company info, support email, website). No template carries its own
 * header/footer. 600px max width, mobile-first, dark-mode-friendly colors.
 */

'use strict';

const esc = (s) => String(s == null ? '' : s).replace(/"/g, '&quot;');

/**
 * @param {object} opts
 * @param {string} opts.bodyHtml      resolved template body
 * @param {string} [opts.previewText] inbox preview (hidden preheader)
 * @param {string} [opts.ctaLabel]    button text (omit button if empty)
 * @param {string} [opts.ctaUrl]      button link
 * @param {object} opts.settings      email_settings row
 * @returns {string} full HTML document
 */
function renderLayout({ bodyHtml = '', previewText = '', ctaLabel = '', ctaUrl = '', settings = {} }) {
  const brand = settings.brand_color || '#FE5100';
  const supportEmail = settings.support_email || 'support@bookasloth.in';
  const website = settings.website_url || 'https://bookasloth.in';
  const fromName = settings.from_name || 'Book A Sloth';
  const logo = settings.logo_url;
  const year = new Date().getFullYear();

  const header = logo
    ? `<img src="${esc(logo)}" alt="${esc(fromName)}" height="34" style="display:block;border:0;height:34px;">`
    : `<span style="font-size:20px;font-weight:800;letter-spacing:-.01em;color:${esc(brand)};">${esc(fromName)}</span>`;

  const cta = (ctaLabel && ctaUrl)
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;"><tr><td style="border-radius:12px;background:${esc(brand)};">
         <a href="${esc(ctaUrl)}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">${esc(ctaLabel)}</a>
       </td></tr></table>`
    : '';

  const footerExtra = settings.footer_html || '';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${esc(fromName)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Plus Jakarta Sans','Poppins',Arial,sans-serif;">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${esc(previewText)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:28px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.06);">
      <tr><td style="padding:22px 32px;border-bottom:1px solid #f1f5f9;">${header}</td></tr>
      <tr><td style="padding:30px 32px 8px;">${bodyHtml}${cta}</td></tr>
      <tr><td style="padding:22px 32px 28px;border-top:1px solid #f1f5f9;color:#9ca3af;font-size:12px;line-height:1.6;">
        ${footerExtra ? `<div style="margin:0 0 10px;">${footerExtra}</div>` : ''}
        <div style="font-weight:700;color:#6b7280;">${esc(fromName)}</div>
        <div>Calm booking for busy creators.</div>
        <div style="margin-top:8px;">
          <a href="mailto:${esc(supportEmail)}" style="color:#9ca3af;text-decoration:underline;">${esc(supportEmail)}</a>
          &nbsp;·&nbsp;
          <a href="${esc(website)}" style="color:#9ca3af;text-decoration:underline;">${esc(website.replace(/^https?:\/\//, ''))}</a>
        </div>
        <div style="margin-top:8px;">© ${year} ${esc(fromName)}. All rights reserved.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

module.exports = { renderLayout };

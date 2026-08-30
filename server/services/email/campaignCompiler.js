/**
 * campaignCompiler.js — compile the admin composer's block model into email-safe
 * body HTML (table-based, inline CSS, 600px shell-friendly).
 *
 * The output is the CHROME-LESS body only — the same slot a template's
 * html_content fills. communicationEngine wraps it in the recipient shell
 * (header, footer, unsubscribe) at send time, so the unsubscribe token stays
 * per-recipient correct. Live preview wraps it with a dummy token.
 *
 * Block text is escaped (defence in depth — authored by admins, but never
 * trusted into raw HTML). {{tokens}} survive escaping and are resolved per
 * recipient by placeholderResolver later. Phase 1 has no raw-HTML block.
 *
 * Supported blocks: heading · text · image · button · divider · spacer · section.
 */

'use strict';

// Design tokens mirror emailLayout.js so composed mail matches transactional mail.
const D = {
  dark:  '#202124',
  muted: '#5f6368',
  border:'#edf0f2',
  font:  "'Poppins','Plus Jakarta Sans',Arial,sans-serif",
};
const DEFAULT_BRAND = '#FE5100';

/** Escape text for HTML body/attribute insertion. Leaves {{tokens}} intact. */
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const ALIGN = (a) => (['left', 'center', 'right'].includes(a) ? a : 'left');

/** Preserve author line breaks inside a text block. */
const nl2br = (s) => esc(s).replace(/\r?\n/g, '<br>');

function heading({ text = '', level = 2, align = 'left' }) {
  const size = level === 1 ? 28 : level === 3 ? 18 : 22;
  return `<tr><td style="padding:8px 0;text-align:${ALIGN(align)};font-family:${D.font};">
    <span style="font-size:${size}px;line-height:1.3;font-weight:700;color:${D.dark};">${nl2br(text)}</span>
  </td></tr>`;
}

function text({ text: t = '', align = 'left' }) {
  return `<tr><td style="padding:8px 0;text-align:${ALIGN(align)};font-size:15px;line-height:1.7;color:${D.muted};font-family:${D.font};">${nl2br(t)}</td></tr>`;
}

function image({ src = '', href = '', alt = '', width = 600 }) {
  if (!src) return '';
  const w = Math.max(40, Math.min(600, parseInt(width, 10) || 600));
  const img = `<img src="${esc(src)}" alt="${esc(alt)}" width="${w}" style="display:block;border:0;max-width:100%;width:${w}px;height:auto;margin:0 auto;">`;
  const inner = href ? `<a href="${esc(href)}" style="text-decoration:none;">${img}</a>` : img;
  return `<tr><td style="padding:10px 0;text-align:center;">${inner}</td></tr>`;
}

function button({ label = '', href = '', align = 'left', brand = DEFAULT_BRAND }) {
  if (!label || !href) return '';
  return `<tr><td style="padding:12px 0;text-align:${ALIGN(align)};">
    <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
      <tr><td style="border-radius:1px;background:${esc(brand)};">
        <a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:${D.font};">${esc(label)}</a>
      </td></tr>
    </table>
  </td></tr>`;
}

function divider() {
  return `<tr><td style="padding:14px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${D.border};font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>`;
}

function spacer({ size = 16 }) {
  const h = Math.max(4, Math.min(80, parseInt(size, 10) || 16));
  return `<tr><td style="height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</td></tr>`;
}

function section({ background = '', blocks = [], brand = DEFAULT_BRAND }) {
  const inner = renderRows(blocks, brand);
  const bg = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(background) ? background : 'transparent';
  return `<tr><td style="padding:6px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-radius:1px;">
      <tr><td style="padding:${bg === 'transparent' ? '0' : '20px 24px'};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${inner}</table>
      </td></tr>
    </table>
  </td></tr>`;
}

const RENDERERS = { heading, text, image, button, divider, spacer, section };

/** Render an array of blocks to `<tr>…` rows. Unknown block types are skipped. */
function renderRows(blocks, brand) {
  return (Array.isArray(blocks) ? blocks : [])
    .map((b) => {
      const fn = b && RENDERERS[b.type];
      if (!fn) return '';
      return fn({ ...b, brand });
    })
    .join('\n');
}

/**
 * Compile a composer design → chrome-less body HTML.
 * @param {object} design  { blocks: [...], brandColor?: '#rrggbb' }
 * @returns {{ bodyHtml: string }}
 */
function compile(design = {}) {
  const brand = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(design.brandColor) ? design.brandColor : DEFAULT_BRAND;
  const rows = renderRows(design.blocks, brand);
  const bodyHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
  return { bodyHtml };
}

module.exports = { compile };

// ── self-check ──────────────────────────────────────────────────────────────
if (require.main === module) {
  const assert = require('assert');
  const { bodyHtml } = compile({
    brandColor: '#123456',
    blocks: [
      { type: 'heading', text: 'Hi {{first_name}}', level: 1 },
      { type: 'text', text: 'Line one\nLine two <script>' },
      { type: 'image', src: 'https://x/y.png', alt: 'a' },
      { type: 'button', label: 'Go', href: 'https://x' },
      { type: 'divider' },
      { type: 'spacer', size: 24 },
      { type: 'section', background: '#eef', blocks: [{ type: 'text', text: 'nested' }] },
      { type: 'bogus', text: 'skip me' },
    ],
  });
  assert(bodyHtml.includes('{{first_name}}'), 'tokens survive escaping');
  assert(bodyHtml.includes('&lt;script&gt;'), 'author html is escaped');
  assert(bodyHtml.includes('Line one<br>Line two'), 'newlines → <br>');
  assert(bodyHtml.includes('#123456'), 'brand color applied to button');
  assert(bodyHtml.includes('nested'), 'section children render');
  assert(!bogusRendered(bodyHtml), 'unknown block skipped');
  function bogusRendered(h) { return h.includes('skip me'); }
  console.log('campaignCompiler self-check OK');
}

/**
 * emailComponents.js — accent-aware hero-block helpers for email bodies.
 *
 * Each helper returns an Outlook-safe HTML string (nested tables, solid hex,
 * 1px radius, PNG-only imagery). Helpers that take a `theme` read accent/tint/text
 * from emailThemes so a template body never hardcodes a color. User-supplied
 * values are HTML-escaped here; {{placeholders}} pass through untouched and are
 * resolved later by placeholderResolver.
 */

'use strict';

const FONT = "'Poppins','Plus Jakarta Sans',Arial,sans-serif";

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Semantic status-tag tones — fixed, independent of the email accent.
const TONES = {
  paid:      { bg: '#fff4ed', fg: '#b8410f' },
  online:    { bg: '#f1f3f4', fg: '#5f6368' },
  offline:   { bg: '#f1f3f4', fg: '#5f6368' },
  confirmed: { bg: '#e8fff1', fg: '#056800' },
  completed: { bg: '#e8fff1', fg: '#056800' },
  cancelled: { bg: '#fdeceb', fg: '#a32d2d' },
  pending:   { bg: '#fdf2dd', fg: '#854f0b' },
};

/** Row of semantic status tags. tags: [{label, tone}]. Empty input → ''. */
function statusTags(tags = []) {
  const cells = (tags || []).filter((t) => t && t.label).map((t) => {
    const tone = TONES[String(t.tone || '').toLowerCase()] || TONES.online;
    return `<td style="padding-right:6px;"><span style="display:inline-block;border-radius:1px;padding:5px 10px;font-size:12px;font-weight:600;background:${tone.bg};color:${tone.fg};font-family:${FONT};">${esc(t.label)}</span></td>`;
  }).join('');
  return cells ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px 0 0;"><tr>${cells}</tr></table>` : '';
}

/** Big letter-spaced code on a tinted block. Empty when no code. */
function otpBox(theme, code) {
  if (!code) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;"><tr><td align="center" style="background:${theme.tint};border-radius:1px;padding:20px;">
    <span style="font-size:34px;font-weight:700;letter-spacing:8px;color:${theme.text};font-family:${FONT};">${esc(code)}</span>
  </td></tr></table>`;
}

/** Solid accent date square + service/time. */
function heroDate(theme, { day, mon, year, title, time, sub } = {}) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border:1px solid #edf0f2;border-radius:1px;"><tr>
    <td width="84" valign="middle" style="background:${theme.accent};color:#ffffff;text-align:center;padding:16px 6px;">
      <div style="font-size:30px;font-weight:700;line-height:1;font-family:${FONT};">${esc(day)}</div>
      <div style="font-size:12px;letter-spacing:1px;font-family:${FONT};">${esc(mon)} ${esc(year)}</div>
    </td>
    <td valign="middle" style="padding:14px 16px;">
      <div style="font-size:16px;font-weight:600;color:#202124;font-family:${FONT};">${esc(title)}</div>
      <div style="font-size:13px;color:#5f6368;padding-top:3px;font-family:${FONT};">${esc(time)}${sub ? ' &middot; ' + esc(sub) : ''}</div>
    </td>
  </tr></table>`;
}

/** Highlighted money strip (e.g. host earnings). */
function amountRow(theme, label, value) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 0;background:${theme.tint};border-radius:1px;"><tr>
    <td style="padding:12px 14px;font-size:13px;color:${theme.text};font-family:${FONT};">${esc(label)}</td>
    <td align="right" style="padding:12px 14px;font-size:18px;font-weight:700;color:${theme.accent};font-family:${FONT};">${esc(value)}</td>
  </tr></table>`;
}

/** Accent-bordered key/value detail card. rows: [[label, value], ...]. */
function infoCard(theme, rows = []) {
  const body = (rows || []).filter(Boolean).map(([k, v]) =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;width:140px;font-family:${FONT};">${esc(k)}</td><td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600;font-family:${FONT};">${esc(v)}</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border-left:3px solid ${theme.accent};background:#f9fafb;"><tr><td style="padding:12px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table></td></tr></table>`;
}

/** "Your session starts / soon" tinted strip. */
function countdown(theme, { lead, big } = {}) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;background:${theme.tint};border-radius:1px;"><tr><td align="center" style="padding:18px;">
    <div style="font-size:13px;color:${theme.text};font-family:${FONT};">${esc(lead)}</div>
    <div style="font-size:22px;font-weight:700;color:${theme.accent};padding-top:3px;font-family:${FONT};">${esc(big)}</div>
  </td></tr></table>`;
}

/** Full-width accent-tint banner with optional sub-line. */
function banner(theme, { title, sub } = {}) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;background:${theme.tint};border-radius:1px;"><tr><td style="padding:14px 16px;">
    <div style="font-size:15px;font-weight:600;color:${theme.text};font-family:${FONT};">${esc(title)}</div>
    ${sub ? `<div style="font-size:13px;color:${theme.text};padding-top:3px;font-family:${FONT};">${esc(sub)}</div>` : ''}
  </td></tr></table>`;
}

/** Celebratory medallion hero (achievement, milestone, birthday, welcome). */
function celebration(theme, { iconUrl, title } = {}) {
  const medal = iconUrl ? `<img src="${esc(iconUrl)}" width="40" height="40" alt="" style="display:block;margin:0 auto 8px;border:0;">` : '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;background:${theme.tint};border-radius:1px;"><tr><td align="center" style="padding:20px;">
    ${medal}<div style="font-size:17px;font-weight:600;color:${theme.text};font-family:${FONT};">${esc(title)}</div>
  </td></tr></table>`;
}

module.exports = { statusTags, otpBox, heroDate, amountRow, infoCard, countdown, banner, celebration, TONES, FONT };

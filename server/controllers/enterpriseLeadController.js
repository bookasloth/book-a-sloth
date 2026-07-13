/**
 * enterpriseLeadController.js — public "Enterprise" lead form → DB row + email to support.
 * Mounted at POST /api/enterprise-lead. No auth; rate-limited at the route.
 */
'use strict';

const sendEmail = require('../utils/sendEmail');
const { supabaseAdmin } = require('../config/supabase');

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'bolt@bookasloth.in';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
           .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const cap = (s = '', n) => String(s).slice(0, n);

function validateLead(b = {}) {
  if (!b.orgName || !String(b.orgName).trim()) return { ok: false, error: 'Organization name is required.' };
  if (!b.email || !EMAIL_RE.test(String(b.email).trim())) return { ok: false, error: 'A valid business email is required.' };
  if (!b.phone || !String(b.phone).trim()) return { ok: false, error: 'Phone number is required.' };
  return { ok: true };
}

const ROWS = [
  ['Organization', 'orgName'], ['Website', 'website'], ['Industry', 'industry'],
  ['Team size', 'teamSize'], ['Locations', 'locations'], ['Est. monthly bookings', 'monthlyBookings'],
  ['Current software', 'currentSoftware'], ['Required integrations', 'integrations'],
  ['Phone', 'phone'], ['Business email', 'email'], ['Additional requirements', 'requirements'],
];

function buildLeadEmail(b = {}) {
  const rows = ROWS.map(([label, key]) =>
    `<tr><td style="padding:6px 12px;color:#6b7280">${esc(label)}</td>` +
    `<td style="padding:6px 12px;color:#1a1a1a">${esc(b[key] || '—')}</td></tr>`).join('');
  return `<h2>New Enterprise Lead</h2><table style="border-collapse:collapse">${rows}</table>`;
}

async function submitEnterpriseLead(req, res) {
  const b = req.body || {};
  if (b.company_hp) return res.status(201).json({ ok: true }); // honeypot: silently drop
  const v = validateLead(b);
  if (!v.ok) return res.status(400).json({ error: v.error });

  const lead = {
    org_name: cap(b.orgName, 200), website: cap(b.website, 300), industry: cap(b.industry, 120),
    team_size: cap(b.teamSize, 60), locations: cap(b.locations, 60), monthly_bookings: cap(b.monthlyBookings, 60),
    current_software: cap(b.currentSoftware, 200), integrations: cap(b.integrations, 500),
    phone: cap(b.phone, 40), email: cap(b.email, 200), requirements: cap(b.requirements, 5000),
    source: 'enterprise_page',
  };

  // Fail-soft: insert + email are independent; a failure in one does not block the other.
  // But if BOTH fail the lead is lost entirely — surface that as a 500 so the client retries.
  let insertOk = false;
  let mailOk = false;
  try {
    const { error: insErr } = await supabaseAdmin.from('enterprise_leads').insert(lead);
    insertOk = !insErr;
    if (insErr) console.error('[enterprise-lead] insert failed:', insErr.message);
  } catch (e) { console.error('[enterprise-lead] insert failed:', e.message); }

  try {
    await sendEmail({ to: SUPPORT_EMAIL, subject: `[Enterprise] ${cap(b.orgName, 200)}`, html: buildLeadEmail(b) });
    mailOk = true;
  } catch (e) { console.error('[enterprise-lead] email failed:', e.message); }

  if (!insertOk && !mailOk) {
    return res.status(500).json({ error: 'Could not submit your request. Please try again.' });
  }
  return res.status(201).json({ ok: true });
}

module.exports = { submitEnterpriseLead, validateLead, buildLeadEmail };

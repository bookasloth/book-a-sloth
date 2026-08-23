// Shared labels/tones for the Sales CRM screens. One source so the pipeline,
// table, and detail badges never drift.
export const FUNNEL = ['new', 'contacted', 'replied', 'qualified', 'demo_scheduled', 'trial', 'activated', 'paid'];
export const ALL_STATUSES = [...FUNNEL, 'lost', 'do_not_contact'];

// Display labels — DB enum stays unchanged; we only relabel for the CRM UI
// (replied→Responded, paid→Won) so the 203 live leads never need a migration.
export const STATUS_LABEL = {
  new: 'New', contacted: 'Contacted', replied: 'Responded', qualified: 'Qualified',
  demo_scheduled: 'Demo', trial: 'Trial', activated: 'Activated', paid: 'Won',
  lost: 'Lost', do_not_contact: 'Do Not Contact',
};

export const STATUS_TONE = {
  new: 'neutral', contacted: 'info', replied: 'info', qualified: 'warn',
  demo_scheduled: 'warn', trial: 'warn', activated: 'ok', paid: 'ok',
  lost: 'danger', do_not_contact: 'danger',
};

export const SOURCES = [
  'instagram', 'facebook', 'google', 'linkedin', 'website', 'referral',
  'whatsapp', 'cold_outreach', 'event', 'manual', 'import', 'host_signup', 'guest_booking',
];

// Smart views — one-click filter presets. `filter` merges into the list query.
export const SMART_VIEWS = [
  { key: 'all', label: 'All', filter: {} },
  { key: 'new', label: 'New', filter: { status: 'new' } },
  { key: 'needs_followup', label: 'Needs follow-up', filter: { followup: 'today' } },
  { key: 'overdue', label: 'Overdue', filter: { followup: 'overdue' } },
  { key: 'contacted', label: 'No response', filter: { status: 'contacted' } },
  { key: 'qualified', label: 'Qualified', filter: { status: 'qualified' } },
  { key: 'won', label: 'Won', filter: { status: 'paid' } },
  { key: 'value', label: 'Has value', filter: { hasValue: true } },
];

export const rupees = (paise) => `₹${((Number(paise) || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Rule-based lead score (0–100) from the signals we actually have — no fake
// intelligence. Behavioural signals (opens/clicks) get added once provider
// webhooks land (Phase 4).
export function leadScore(lead) {
  if (!lead) return { score: 0, temp: 'cold' };
  const STAGE = { new: 5, contacted: 20, replied: 45, qualified: 60, demo_scheduled: 70, trial: 78, activated: 88, paid: 95, lost: 0, do_not_contact: 0 };
  let s = STAGE[lead.status] ?? 10;
  if (lead.phone) s += 8;
  if (lead.email) s += 4;
  if (Number(lead.revenue_paise) > 0) s += 12;
  if (['referral', 'website'].includes(lead.source)) s += 5;
  const last = lead.last_activity_at || lead.last_contacted_at;
  if (last) { const days = (Date.now() - new Date(last)) / 864e5; if (days < 3) s += 10; else if (days < 7) s += 5; else if (days > 30) s -= 10; }
  s = Math.max(0, Math.min(100, Math.round(s)));
  return { score: s, temp: s >= 70 ? 'hot' : s >= 40 ? 'warm' : 'cold' };
}

export const relTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

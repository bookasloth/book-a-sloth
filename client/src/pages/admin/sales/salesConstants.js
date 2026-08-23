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

export const relTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

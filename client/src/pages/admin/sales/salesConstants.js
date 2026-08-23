// Shared labels/tones for the Sales CRM screens. One source so the pipeline,
// table, and detail badges never drift.
export const FUNNEL = ['new', 'contacted', 'replied', 'qualified', 'demo_scheduled', 'trial', 'activated', 'paid'];
export const ALL_STATUSES = [...FUNNEL, 'lost', 'do_not_contact'];

export const STATUS_LABEL = {
  new: 'New', contacted: 'Contacted', replied: 'Replied', qualified: 'Qualified',
  demo_scheduled: 'Demo', trial: 'Trial', activated: 'Activated', paid: 'Paid',
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

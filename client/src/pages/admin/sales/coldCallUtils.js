// Pure helpers for the Cold Calling tab (no React, no API).

export const FIELD_OPTIONS = ['', 'day', 'priority', 'business', 'name', 'category', 'locality', 'city', 'phone', 'whatsapp', 'email', 'fit', 'website', 'pitch'];

// Header (lower-cased, letters only) → field.
const HEADERS = {
  day: 'day', priority: 'priority', business: 'business', businessname: 'business', company: 'business',
  name: 'name', contact: 'name', contactname: 'name', owner: 'name',
  category: 'category', profession: 'category', type: 'category',
  locality: 'locality', area: 'locality', city: 'city',
  phone: 'phone', mobile: 'phone', mobileno: 'phone', phonenumber: 'phone', contactnumber: 'phone',
  whatsapp: 'whatsapp', email: 'email', fit: 'fit', score: 'fit', website: 'website',
  talkingpoint: 'pitch', pitch: 'pitch',
};

export const guessFields = (header = []) =>
  header.map((h) => HEADERS[String(h).toLowerCase().replace(/[^a-z]/g, '')] || null);

export function mapRows(grid = [], fields = []) {
  return grid.slice(1).map((cells) => {
    const r = {};
    fields.forEach((f, i) => { const v = String(cells[i] ?? '').trim(); if (f && v) r[f] = v; });
    return r;
  }).filter((r) => r.phone);
}

export const OUTCOMES = [
  { key: 'interested', label: 'Interested', hotkey: '1', template: 'cold_call_interested', tone: 'ok' },
  { key: 'details', label: 'Wants details', hotkey: '2', template: 'cold_call_details', tone: 'info' },
  { key: 'callback', label: 'Busy — call back', hotkey: '3', template: 'cold_call_callback', tone: 'info' },
  { key: 'not_now', label: 'Not now', hotkey: '4', template: 'cold_call_nurture', tone: 'neutral' },
  { key: 'not_interested', label: 'Not interested', hotkey: '5', template: null, tone: 'danger' },
  { key: 'no_answer', label: 'No answer', hotkey: '6', template: null, tone: 'warn' },
  { key: 'wrong_number', label: 'Wrong number', hotkey: '7', template: null, tone: 'danger' },
];

export const OBJECTIONS = [
  { q: 'We already use Practo / another app', a: 'Keep it. This is your own booking page with your name on it, which you share on WhatsApp, Instagram and Google. Clients book and pay online from your link. Many use both.' },
  { q: 'What does it cost? / Too expensive', a: "It's free to start, and you only pay if you upgrade. I'll send you the pricing link right now." },
  { q: 'Just send me the details', a: "Sure, I'll WhatsApp and email them now. When's a good time for a 2-minute call to answer questions?" },
  { q: 'Patients just call us, we don\'t need it', a: "That's the point: every call you miss during a procedure is a lost booking. The page takes bookings 24×7 and sends reminders, so fewer no-shows." },
  { q: "I'm busy right now", a: "No problem. When's better, later today or tomorrow? Two minutes is enough." },
];

// Messages for skipped/failed follow-ups (server reasons → plain words).
export const REASON_LABEL = {
  pending_aisensy: 'WhatsApp template not approved in AiSensy yet',
  template_inactive: 'template is turned off',
  no_template: 'no template set up',
  sends_disabled: 'CRM sends are switched off',
  do_not_contact: 'lead is do-not-contact',
  invalid_phone: 'no valid WhatsApp number',
  invalid_email: 'no valid email',
  placeholder_email: 'placeholder email',
  email_unsubscribed: 'they unsubscribed from email',
  email_suppressed: 'email bounced before',
  whatsapp_suppressed: 'they opted out of WhatsApp',
};

// Toast for one channel's follow-up result. `queued` with a reason = provider failed, retry pending.
export function sendResultMessage(channel, r = {}) {
  const ch = channel === 'email' ? 'Email' : 'WhatsApp';
  if (r.status === 'sent') return { kind: 'success', text: `${ch} sent` };
  if (r.status === 'already_sent') return { kind: 'info', text: `${ch} already sent earlier today` };
  if (r.status === 'queued' && !r.reason) return { kind: 'success', text: `${ch} queued` };
  if (r.status === 'queued') return { kind: 'error', text: `${ch} not sent yet (retrying): ${REASON_LABEL[r.reason] || r.reason}` };
  return { kind: 'error', text: `${ch} not sent: ${REASON_LABEL[r.reason] || r.reason || r.status}` };
}

export function callbackPresets(now = new Date()) {
  const at = (days, hour) => { const x = new Date(now); x.setDate(x.getDate() + days); x.setHours(hour, 0, 0, 0); return x; };
  const toMon = ((8 - now.getDay()) % 7) || 7;
  return [
    { label: 'In 1 hr', at: new Date(now.getTime() + 60 * 60 * 1000) },
    { label: 'Today 5pm', at: at(0, 17) },
    { label: 'Tomorrow 11am', at: at(1, 11) },
    { label: 'Mon 11am', at: at(toMon, 11) },
  ].filter((p) => p.at > now);
}

const span = (mins) => (mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`);
export function countdown(dueAt, now = new Date()) {
  const mins = Math.round((new Date(dueAt) - now) / 60000);
  return mins >= 0 ? `due in ${span(mins)}` : `overdue ${span(-mins)}`;
}

export function formatPhone(p) {
  const d = String(p || '').replace(/\D/g, '').slice(-10);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : String(p || '');
}

export const fmtTimer = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export const isTypingTarget = (el) =>
  !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || !!el.isContentEditable);

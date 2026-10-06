// Pure helpers for the Cold Calling tab (no React, no API).

export const FIELD_OPTIONS = ['', 'day', 'priority', 'business', 'name', 'category', 'locality', 'city', 'phone', 'whatsapp', 'email', 'fit', 'website', 'pitch', 'rating', 'reviews', 'address', 'maps_url'];

// Header (lower-cased, letters only) → field.
const HEADERS = {
  day: 'day', priority: 'priority', business: 'business', businessname: 'business', company: 'business',
  name: 'name', contact: 'name', contactname: 'name', owner: 'name',
  category: 'category', profession: 'category', type: 'category',
  locality: 'locality', area: 'locality', city: 'city',
  phone: 'phone', mobile: 'phone', mobileno: 'phone', phonenumber: 'phone', contactnumber: 'phone',
  whatsapp: 'whatsapp', email: 'email', fit: 'fit', score: 'fit', website: 'website',
  talkingpoint: 'pitch', pitch: 'pitch',
  rating: 'rating', reviewcount: 'reviews', reviews: 'reviews', address: 'address', mapsurl: 'maps_url', maps: 'maps_url',
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

// `message` = the follow-up set the window pre-picks after this outcome (null = no window).
export const OUTCOMES = [
  { key: 'interested', label: 'Interested', hotkey: '1', message: 'cold_call_interested', tone: 'ok' },
  { key: 'details', label: 'Wants details', hotkey: '2', message: 'cold_call_details', tone: 'info' },
  { key: 'callback', label: 'Busy — call back', hotkey: '3', message: 'cold_call_callback', tone: 'warn' },
  { key: 'not_now', label: 'Not now', hotkey: '4', message: 'cold_call_nurture', tone: 'neutral' },
  { key: 'not_interested', label: 'Not interested', hotkey: '5', message: null, tone: 'danger' },
  { key: 'no_answer', label: 'No answer', hotkey: '6', message: 'cold_call_missed', tone: 'neutral' },
  { key: 'wrong_number', label: 'Wrong number', hotkey: '7', message: null, tone: 'danger' },
];
export const outcomeLabel = (k) => OUTCOMES.find((o) => o.key === k)?.label || k || '';
export const outcomeTone = (k) => OUTCOMES.find((o) => o.key === k)?.tone || 'neutral';

// The message sets the follow-up window offers (crm_templates.category).
export const MESSAGE_SETS = [
  { category: 'cold_call_interested', label: 'Interested' },
  { category: 'cold_call_details', label: 'Wants details' },
  { category: 'cold_call_callback', label: 'Call back' },
  { category: 'cold_call_nurture', label: 'Not now' },
  { category: 'cold_call_missed', label: 'Missed call' },
  { category: 'cold_call_setup_help', label: 'Setup help' },
];

// Which set to open after saving. A missed call only gets a message on the FIRST
// miss — retries 2 and 3 stay silent so a lead isn't messaged every day.
export function messageFor(outcome, coldCall = {}) {
  const o = OUTCOMES.find((x) => x.key === outcome);
  if (!o?.message) return null;
  if (outcome === 'no_answer' && (coldCall.no_answers || 0) > 1) return null;
  return o.message;
}

// Plain-text preview of a template for the follow-up window (never renders template
// HTML — links show as "label (url)"). WhatsApp uses {{1}}/{{2}}, email named tokens.
export function previewText(body, { business = '', callbackTime = '' } = {}) {
  return String(body || '')
    .replace(/\{\{\s*(1|business_name)\s*\}\}/g, business || 'there')
    .replace(/\{\{\s*(2|callback_time)\s*\}\}/g, callbackTime || '[callback time]')
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<li>/gi, '• ')
    .replace(/<\/(p|li|ul)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Only ever link out to http(s) — imported Maps/website values are untrusted.
export const safeUrl = (u) => {
  const s = String(u || '').trim();
  if (!s) return null;
  const withProto = /^https?:\/\//i.test(s) ? s : (/^[\w-]+(\.[\w-]+)+(\/|$)/i.test(s) ? `https://${s}` : null);
  if (!withProto) return null;
  try { const x = new URL(withProto); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; }
};

const APPOINTMENT = /dent|clinic|salon|spa|physio|make-?up|parlou?r|doctor|skin|hair|gym|fitness|coach|tutor|turf|court|studio|therap|yoga|ayur|derm|eye|nail|beauty/i;
// "Why good fit" lines from data we actually hold — never invented.
export function fitReasons(lead = {}) {
  const cc = lead.attributes?.cold_call || {};
  const out = [];
  const rating = parseFloat(cc.rating);
  const reviews = parseInt(cc.reviews, 10);
  if (rating >= 4 && reviews >= 10) out.push(`${rating}★ with ${reviews} Google reviews`);
  if (APPOINTMENT.test(lead.profession || '')) out.push('Appointment-based business');
  out.push(lead.website ? 'Has a website: add a "Book now" link to it' : 'No website: the booking page can be their web page');
  if (/^p?1$/i.test(String(cc.priority || ''))) out.push('Top priority (P1)');
  return out;
}

// Today's plan in calling order: callbacks due → retries → new → later callbacks.
// Each pending item carries why it's on today's list.
export function pendingPlan(queue) {
  if (!queue) return [];
  const seen = new Set();
  const add = (items, kind) => (items || [])
    .filter((i) => i?.lead && !seen.has(i.lead.id) && seen.add(i.lead.id))
    .map((i) => ({ ...i, kind }));
  return [
    ...add(queue.callbacksDue, 'callback'),
    ...add(queue.retries, 'retry'),
    ...add(queue.fresh, 'new'),
    ...add(queue.upcoming, 'later'),
  ];
}

// The lead to open after `currentId`: the next pending one, else the first.
export function nextLeadId(plan, currentId) {
  const idx = plan.findIndex((p) => p.lead.id === currentId);
  const after = plan.slice(idx + 1).find((p) => p.lead.id !== currentId);
  return after?.lead.id || plan.find((p) => p.lead.id !== currentId)?.lead.id || null;
}

export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '');

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

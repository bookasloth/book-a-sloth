'use strict';
/**
 * coldCallRules.js — pure rules for the admin Cold Calling tab (no I/O).
 *
 * Phone parsing for scraped calling lists, the outcome → next-step table, and
 * the call-queue order (callbacks due → retries due → fresh by Day/Priority).
 * Calling state lives in leads.attributes.cold_call; callbacks are open
 * lead_follow_ups rows titled "Callback: …".
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const IST_MS = 330 * 60 * 1000;            // UTC+5:30
const DUE_SOON_MS = 15 * 60 * 1000;        // a callback within 15 min is "due"
const MAX_NO_ANSWER = 3;                   // 3rd no-answer → unreachable, leaves the queue
const CALLBACK_PREFIX = 'Callback:';
const NOT_CONNECTED = new Set(['no_answer', 'wrong_number']);

const OUTCOMES = {
  interested:     { template: 'cold_call_interested', status: 'qualified', close: true },
  details:        { template: 'cold_call_details',    status: 'contacted', retryDays: 3 },
  callback:       { template: 'cold_call_callback',   status: 'contacted', needsCallbackAt: true },
  not_now:        { template: 'cold_call_nurture',    status: 'contacted', retryDays: 30 },
  not_interested: { template: null, dnc: true, close: true },
  no_answer:      { template: null, retryDays: 1 },
  wrong_number:   { template: null, close: true, tag: 'wrong-number' },
};

// '08888705552' | '+91 88887 05552' | '918888705552' | '8888705552' → '8888705552'
function phone10(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return d;
  if (d.length === 11 && d.startsWith('0')) return d.slice(1);
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  return null;
}

// Scraped WhatsApp column: wa.me/<n>, api.whatsapp.com/send?phone=<n>, or junk.
function waPhone10(raw) {
  const m = String(raw || '').match(/(?:wa\.me\/|[?&](?:amp;)?phone=)\+?(\d{10,13})/);
  return m ? phone10(m[1]) : null;
}

function nextStep(outcome, coldCall = {}, now = new Date(), callbackAt = null) {
  const rule = OUTCOMES[outcome];
  if (!rule) throw new Error(`unknown outcome: ${outcome}`);
  if (rule.needsCallbackAt && !(callbackAt && !Number.isNaN(new Date(callbackAt).getTime()))) {
    throw new Error('callbackAt required');
  }
  const attempts = (coldCall.attempts || 0) + 1;
  const noAnswers = (coldCall.no_answers || 0) + (outcome === 'no_answer' ? 1 : 0);
  let closed = !!rule.close;
  let closedReason = rule.close ? outcome : null;
  let retryAt = rule.retryDays ? new Date(now.getTime() + rule.retryDays * DAY_MS).toISOString() : null;
  if (outcome === 'no_answer' && noAnswers >= MAX_NO_ANSWER) { closed = true; closedReason = 'unreachable'; retryAt = null; }
  // Safety net: if the Callback task is closed elsewhere (Follow-ups page), the lead
  // resurfaces as a retry at the callback time instead of vanishing. buildQueue keeps
  // a lead with an open Callback out of retries, so it never shows twice.
  if (rule.needsCallbackAt) retryAt = new Date(callbackAt).toISOString();
  return {
    cold_call: {
      ...coldCall, attempts, no_answers: noAnswers, last_outcome: outcome,
      last_called_at: now.toISOString(), retry_at: retryAt, closed, closed_reason: closedReason,
    },
    status: rule.status || null,
    dnc: !!rule.dnc,
    tag: rule.tag || null,
    template: rule.template,
    callbackAt: rule.needsCallbackAt ? new Date(callbackAt).toISOString() : null,
  };
}

const num = (v) => { const n = parseInt(String(v ?? '').replace(/\D/g, ''), 10); return Number.isFinite(n) ? n : 9999; };
const cc = (l) => l.attributes?.cold_call || {};
const eligible = (l) => !!l && !l.do_not_contact && l.status !== 'do_not_contact';

function buildQueue(leads = [], followUps = [], now = new Date()) {
  const t = now.getTime();
  const byId = new Map(leads.map((l) => [l.id, l]));
  const callbacksDue = [];
  const upcoming = [];
  const hasCallback = new Set();
  for (const f of followUps) {
    const lead = byId.get(f.lead_id);
    if (!eligible(lead) || !String(f.title || '').startsWith(CALLBACK_PREFIX)) continue;
    hasCallback.add(lead.id);
    const due = new Date(f.due_at).getTime();
    const item = { lead, followUp: f, dueAt: f.due_at, overdue: due < t };
    (due <= t + DUE_SOON_MS ? callbacksDue : upcoming).push(item);
  }
  const open = leads.filter((l) => eligible(l) && !cc(l).closed && !hasCallback.has(l.id));
  const retries = open
    .filter((l) => cc(l).retry_at && new Date(cc(l).retry_at).getTime() <= t)
    .sort((a, b) => new Date(cc(a).retry_at) - new Date(cc(b).retry_at))
    .map((lead) => ({ lead }));
  const fresh = open
    .filter((l) => !(cc(l).attempts > 0))
    .sort((a, b) => (num(cc(a).day) - num(cc(b).day)) || (num(cc(a).priority) - num(cc(b).priority)))
    .map((lead) => ({ lead }));
  const byDue = (a, b) => new Date(a.dueAt) - new Date(b.dueAt);
  return { callbacksDue: callbacksDue.sort(byDue), retries, fresh, upcoming: upcoming.sort(byDue) };
}

function todayStats(outcomes = []) {
  return {
    calls: outcomes.length,
    connected: outcomes.filter((o) => o && !NOT_CONNECTED.has(o)).length,
    interested: outcomes.filter((o) => o === 'interested').length,
  };
}

function listTotals(leads = []) {
  const byOutcome = {};
  let fresh = 0, called = 0, signedUp = 0;
  for (const l of leads) {
    const c = cc(l);
    if (c.attempts > 0) called++; else if (!c.closed) fresh++;
    if (c.last_outcome) byOutcome[c.last_outcome] = (byOutcome[c.last_outcome] || 0) + 1;
    if (l.profile_id) signedUp++;
  }
  return { total: leads.length, fresh, called, signedUp, byOutcome };
}

const istDate = (now = new Date()) => new Date(now.getTime() + IST_MS).toISOString().slice(0, 10);
function istDayStart(now = new Date()) {
  const t = now.getTime() + IST_MS;
  return new Date(t - (t % DAY_MS) - IST_MS).toISOString();
}
const formatIst = (iso) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
}).format(new Date(iso));

module.exports = {
  OUTCOMES, CALLBACK_PREFIX, MAX_NO_ANSWER,
  phone10, waPhone10, nextStep, buildQueue, todayStats, listTotals, istDate, istDayStart, formatIst,
};

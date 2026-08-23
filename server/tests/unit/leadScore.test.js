'use strict';
// PR-3 (persisted score): the server score MUST equal the client formula, or the
// badge shows one number while the lifecycle engine acts on another. This test
// pins parity against an inline copy of the client formula
// (client/src/pages/admin/sales/salesConstants.js leadScore) at a fixed clock.

const { compute, intentOf } = require('../../services/crm/leadScore');

const NOW = new Date('2025-06-01T12:00:00Z').getTime();
const daysAgo = (n) => new Date(NOW - n * 864e5).toISOString();

// Oracle = verbatim client formula, parameterised on `now` for determinism.
function clientLeadScore(lead, now) {
  if (!lead) return { score: 0, temp: 'cold' };
  const STAGE = { new: 5, contacted: 20, replied: 45, qualified: 60, demo_scheduled: 70, trial: 78, activated: 88, paid: 95, lost: 0, do_not_contact: 0 };
  let s = STAGE[lead.status] ?? 10;
  if (lead.phone) s += 8;
  if (lead.email) s += 4;
  if (Number(lead.revenue_paise) > 0) s += 12;
  if (['referral', 'website'].includes(lead.source)) s += 5;
  const last = lead.last_activity_at || lead.last_contacted_at;
  if (last) { const days = (now - new Date(last)) / 864e5; if (days < 3) s += 10; else if (days < 7) s += 5; else if (days > 30) s -= 10; }
  if (lead.last_engaged_at) { const d = (now - new Date(lead.last_engaged_at)) / 864e5; if (d < 3) s += 15; else if (d < 14) s += 8; }
  s = Math.max(0, Math.min(100, Math.round(s)));
  return { score: s, temp: s >= 70 ? 'hot' : s >= 40 ? 'warm' : 'cold' };
}

const FIXTURES = [
  { status: 'new' },
  { status: 'new', phone: '9', email: 'a@b.com' },
  { status: 'contacted', source: 'referral', last_activity_at: daysAgo(1) },
  { status: 'replied', last_contacted_at: daysAgo(5), email: 'x@y.com' },
  { status: 'qualified', source: 'website', last_activity_at: daysAgo(40), phone: '9' },
  { status: 'demo_scheduled', last_engaged_at: daysAgo(1) },
  { status: 'trial', last_engaged_at: daysAgo(10) },
  { status: 'paid', revenue_paise: 50000, phone: '9', email: 'a@b', source: 'referral', last_activity_at: daysAgo(0), last_engaged_at: daysAgo(0) }, // clamps at 100
  { status: 'lost', last_activity_at: daysAgo(60) }, // can drive below 0 → clamps at 0
  { status: 'weird_unknown_status' }, // fallback 10
  {},
  null,
];

test('server compute matches the client formula for every fixture', () => {
  for (const lead of FIXTURES) {
    expect(compute(lead, NOW)).toEqual(clientLeadScore(lead, NOW));
  }
});

test('clamps stay within 0..100', () => {
  for (const lead of FIXTURES) {
    const { score } = compute(lead, NOW);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  }
});

test('intentOf: converted is activated regardless of score; else score buckets', () => {
  expect(intentOf({ status: 'paid' }, 5)).toBe('activated');
  expect(intentOf({ status: 'new', converted_at: '2025-01-01' }, 5)).toBe('activated');
  expect(intentOf({ status: 'replied' }, 75)).toBe('high');
  expect(intentOf({ status: 'contacted' }, 45)).toBe('medium');
  expect(intentOf({ status: 'new' }, 10)).toBe('low');
});

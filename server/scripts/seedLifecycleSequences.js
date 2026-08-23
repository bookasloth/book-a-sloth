'use strict';
/**
 * seedLifecycleSequences.js — create the nurture sequences the CRM lifecycle
 * engine (services/crm/lifecycleEngine.js) enrols leads into.
 *
 * The engine enrols BY EXACT NAME, so these names must match its SEQ constants
 * exactly. Run on BOTH DBs (staging Tokyo → prod Mumbai), per project convention:
 *
 *     node server/scripts/seedLifecycleSequences.js
 *
 * Idempotent: each sequence is matched by name; on re-run its steps are deleted
 * and reinserted so copy edits re-apply cleanly and no duplicates accumulate.
 *
 * Channel decision (see docs/nurture-sequence-content-spec):
 *  - The three host-facing sequences are EMAIL — hosts always have an email and
 *    renderVars personalises {{first_name}} etc. with no template approval.
 *  - "New Lead nurture" is seeded INACTIVE: cold leads are often phone-only and
 *    the real channel is WhatsApp, which needs approved AiSensy templates + a
 *    param-wiring change. Flip it active once that lands.
 *
 * Nothing here sends anything — sequences only fire through messageService,
 * which is still gated by the crm_admin_sends kill-switch (default OFF).
 */
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

// {{first_name}} {{name}} {{business_name}} {{profession}} {{city}} {{booking_link}}
// are the tokens renderVars fills. Links use {{booking_link}}/dashboard — never
// {{username}} (leads carry no username; it would collapse to empty).
const BL = '{{booking_link}}';
const p = (html) => `<p>${html}</p>`;

const SEQUENCES = [
  {
    name: 'Signed-up-not-activated',
    description: 'Host signed up but has not finished onboarding — nudge to live.',
    is_active: true, stop_on_reply: true, stop_on_convert: true,
    steps: [
      { step_no: 1, delay_hours: 0,  subject: 'Welcome to Book A Sloth, {{first_name}} 🦥',
        body: p(`You're in. Your booking page is almost ready — finish setup and start taking bookings.`) + p(`<a href="${BL}/dashboard">Finish setup →</a>`) },
      { step_no: 2, delay_hours: 24, subject: 'Finish your profile (2 minutes)',
        body: p(`A complete profile books more. Add your photo and a line about what you do.`) + p(`<a href="${BL}/dashboard">Complete profile →</a>`) },
      { step_no: 3, delay_hours: 48, subject: 'Add your first service',
        body: p(`Bookings need something to book. Add one service and you're live.`) + p(`<a href="${BL}/dashboard/services">Add a service →</a>`) },
      { step_no: 4, delay_hours: 48, subject: 'Your booking link is your storefront',
        body: p(`Share your link anywhere — bio, WhatsApp, DMs. That's where bookings come from.`) + p(`<a href="${BL}/dashboard">Get your link →</a>`) },
      { step_no: 5, delay_hours: 48, subject: 'Need a hand getting live?',
        body: p(`Reply and tell me where you're stuck — I read every one.`) + p(`— Shubham, Book A Sloth`) },
    ],
  },
  {
    name: 'Activated-no-booking',
    description: 'Host is live but has zero paid bookings — help land the first.',
    is_active: true, stop_on_reply: true, stop_on_convert: true,
    steps: [
      { step_no: 1, delay_hours: 0,  subject: "Your page is ready — now let's get the first booking",
        body: p(`You're live. Most first bookings come from sharing your link just once.`) + p(`<a href="${BL}/dashboard">Share your page →</a>`) },
      { step_no: 2, delay_hours: 72, subject: '3 ways hosts get their first booking',
        body: p(`A link in your bio, one WhatsApp broadcast, one Instagram story. That's usually all it takes.`) },
      { step_no: 3, delay_hours: 96, subject: "Still quiet? Let's fix that together",
        body: p(`Reply with your link and I'll tell you what I'd change.`) + p(`— Shubham, Book A Sloth`) },
    ],
  },
  {
    name: 'Win-back',
    description: 'Inactive 30+ days, never converted — re-engage.',
    is_active: true, stop_on_reply: true, stop_on_convert: true,
    steps: [
      { step_no: 1, delay_hours: 0,   subject: 'Still thinking about it, {{first_name}}?',
        body: p(`Your Book A Sloth page is still here. Picking up where you left off takes about two minutes.`) + p(`<a href="${BL}/dashboard">Pick up where you left off →</a>`) },
      { step_no: 2, delay_hours: 120, subject: "What's new since you last looked",
        body: p(`Faster payouts, WhatsApp booking reminders, and a cleaner booking page. Worth another look.`) + p(`<a href="${BL}/dashboard">See what's new →</a>`) },
    ],
  },
  {
    name: 'New Lead nurture',
    description: 'Cold lead (event/import/website). SEEDED INACTIVE — real channel is WhatsApp (needs approved AiSensy templates + param wiring). Email draft kept ready.',
    is_active: false, stop_on_reply: true, stop_on_convert: true,
    steps: [
      { step_no: 1, delay_hours: 0,   subject: 'A booking link that gets you paid, {{first_name}}',
        body: p(`Book A Sloth turns your link into bookings and payments — no back-and-forth.`) + p(`<a href="${BL}">See how it works →</a>`) },
      { step_no: 2, delay_hours: 48,  subject: 'Why creators switch to Book A Sloth',
        body: p(`One link for your services, calendar, and payments. Your clients book and pay in a couple of taps.`) },
      { step_no: 3, delay_hours: 72,  subject: 'How {{profession}}s use it',
        body: p(`People like you use Book A Sloth to take bookings without the DMs and the "what times work?" loop.`) },
      { step_no: 4, delay_hours: 120, subject: 'Want me to set it up with you?',
        body: p(`Reply and I'll help you get your page live — takes a few minutes.`) + p(`— Shubham, Book A Sloth`) },
    ],
  },
];

async function upsertSequence(seq) {
  const { data: existing } = await supabaseAdmin.from('crm_sequences')
    .select('id').eq('name', seq.name).maybeSingle();

  const row = {
    name: seq.name, description: seq.description, is_active: seq.is_active,
    stop_on_reply: seq.stop_on_reply, stop_on_convert: seq.stop_on_convert,
    created_by: 'seed', updated_at: new Date().toISOString(),
  };

  let seqId;
  if (existing) {
    await supabaseAdmin.from('crm_sequences').update(row).eq('id', existing.id);
    seqId = existing.id;
    // Replace steps so copy edits re-apply and counts never drift on re-run.
    await supabaseAdmin.from('crm_sequence_steps').delete().eq('sequence_id', seqId);
  } else {
    const { data, error } = await supabaseAdmin.from('crm_sequences').insert(row).select('id').single();
    if (error) throw error;
    seqId = data.id;
  }

  const steps = seq.steps.map((s) => ({
    sequence_id: seqId, step_no: s.step_no, delay_hours: s.delay_hours,
    channel: 'email', template_key: null, subject: s.subject, body: s.body,
  }));
  const { error: stepErr } = await supabaseAdmin.from('crm_sequence_steps').insert(steps);
  if (stepErr) throw stepErr;

  return { name: seq.name, seqId, steps: steps.length, active: seq.is_active, created: !existing };
}

async function main() {
  for (const seq of SEQUENCES) {
    const r = await upsertSequence(seq);
    console.log(`${r.created ? 'created' : 'updated'}: "${r.name}" — ${r.steps} steps, active=${r.active}`);
  }
  console.log('Done. Sequences match lifecycleEngine SEQ names; run on BOTH DBs.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });

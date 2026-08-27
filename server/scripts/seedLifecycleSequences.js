'use strict';
/**
 * seedLifecycleSequences.js — create the nurture sequences the CRM lifecycle
 * engine (services/crm/lifecycleEngine.js) enrols leads into, plus the churn
 * win-back sequence that markCancelled enrols cancelled hosts into.
 *
 * The engine enrols BY EXACT NAME, so names must match its SEQ constants exactly.
 * Run on BOTH DBs (staging Tokyo → prod Mumbai), per project convention:
 *
 *     node server/scripts/seedLifecycleSequences.js
 *
 * Idempotent: each sequence is matched by name; on re-run its steps are deleted
 * and reinserted so copy edits re-apply cleanly and no duplicates accumulate.
 *
 * SENDERS (v3.122): every email carries a sender_key → it sends FROM that persona.
 *  - tithi  = the automated lifecycle voice (onboarding, first-booking, nudges).
 *  - sujata = the offers/marketing voice (anything with a discount or deadline).
 *
 * WHATSAPP: steps with channel 'whatsapp' reference an APPROVED AiSensy campaign
 * name in template_key. Those names are placeholders until the templates are
 * created + approved in AiSensy — the step stays queued (and the kill-switch is
 * OFF anyway), so nothing sends prematurely. WA params come from step.variables.
 *
 * Nothing here sends anything — sequences only fire through messageService,
 * still gated by the crm_admin_sends kill-switch (default OFF).
 */
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

// {{first_name}} {{name}} {{business_name}} {{profession}} {{city}} {{booking_link}}
const BL = '{{booking_link}}';
const p = (html) => `<p>${html}</p>`;
const SIGN_TITHI = p(`— Tithi, Book A Sloth`);
const SIGN_SUJATA = p(`— Sujata, Book A Sloth`);

// WhatsApp placeholder campaigns (create + approve these in AiSensy, then they fire).
const WA = { onboarding: 'onboarding_nudge_wa', firstBooking: 'first_booking_wa', winback: 'winback_offer_wa' };

// The win-back offer — one place so email + WhatsApp stay in sync. Conditional on
// renewal: the host renews (monthly or yearly), then an admin adds 2 bonus months.
const OFFER_LINE = `Renew any plan — monthly or yearly — and we'll add <b>2 extra months free</b> on top.`;

const SEQUENCES = [
  {
    name: 'Signed-up-not-activated', sender_key: 'tithi',
    description: 'Host signed up but has not finished onboarding — nudge to live.',
    is_active: true, stop_on_reply: true, stop_on_convert: true,
    steps: [
      { step_no: 1, delay_hours: 0,  channel: 'email', subject: 'Welcome to Book A Sloth, {{first_name}} 🦥',
        body: p(`You're in. Your booking page is almost ready — finish setup and start taking bookings.`) + p(`<a href="${BL}/dashboard">Finish setup →</a>`) },
      { step_no: 2, delay_hours: 24, channel: 'email', subject: 'Finish your profile (2 minutes)',
        body: p(`A complete profile books more. Add your photo and a line about what you do.`) + p(`<a href="${BL}/dashboard">Complete profile →</a>`) },
      // WhatsApp nudge at ~48h quiet — highest-open channel for a stalled setup.
      { step_no: 3, delay_hours: 48, channel: 'whatsapp', template_key: WA.onboarding, variables: ['{{first_name}}'],
        subject: null, body: `Hi {{first_name}} 👋 Your Book A Sloth page is one service away from live. Want a hand finishing it?` },
      { step_no: 4, delay_hours: 24, channel: 'email', subject: 'Add your first service',
        body: p(`Bookings need something to book. Add one service and you're live.`) + p(`<a href="${BL}/dashboard/services">Add a service →</a>`) },
      { step_no: 5, delay_hours: 72, channel: 'email', subject: 'Need a hand getting live?',
        body: p(`Reply and tell me where you're stuck — I read every one.`) + SIGN_TITHI },
    ],
  },
  {
    name: 'Activated-no-booking', sender_key: 'tithi',
    description: 'Host is live but has zero paid bookings — help land the first.',
    is_active: true, stop_on_reply: true, stop_on_convert: true,
    steps: [
      { step_no: 1, delay_hours: 0,  channel: 'email', subject: "Your page is ready — now let's get the first booking",
        body: p(`You're live. Most first bookings come from sharing your link just once.`) + p(`<a href="${BL}/dashboard">Share your page →</a>`) },
      { step_no: 2, delay_hours: 72, channel: 'email', subject: '3 ways hosts get their first booking',
        body: p(`A link in your bio, one WhatsApp broadcast, one Instagram story. That's usually all it takes.`) },
      // WhatsApp nudge when the first booking still hasn't happened.
      { step_no: 3, delay_hours: 48, channel: 'whatsapp', template_key: WA.firstBooking, variables: ['{{first_name}}'],
        subject: null, body: `{{first_name}}, share your booking link once today — most first bookings come from a single share 🚀` },
      { step_no: 4, delay_hours: 48, channel: 'email', subject: "Still quiet? Let's fix that together",
        body: p(`Reply with your link and I'll tell you what I'd change.`) + SIGN_TITHI },
    ],
  },
  {
    name: 'Win-back', sender_key: 'tithi',
    description: 'Inactive 30+ days, never converted — re-engage (nudge only; these leads never paid).',
    is_active: true, stop_on_reply: true, stop_on_convert: true,
    steps: [
      { step_no: 1, delay_hours: 0,   channel: 'email', subject: 'Still thinking about it, {{first_name}}?',
        body: p(`Your Book A Sloth page is still here. Picking up where you left off takes about two minutes.`) + p(`<a href="${BL}/dashboard">Pick up where you left off →</a>`) },
      { step_no: 2, delay_hours: 120, channel: 'email', subject: "What's new since you last looked",
        body: p(`Faster payouts, WhatsApp booking reminders, and a cleaner booking page. Worth another look.`) + p(`<a href="${BL}/dashboard">See what's new →</a>`) + SIGN_TITHI },
    ],
  },
  {
    // NEW — enrolled by subscriptionService.markCancelled for hosts who CANCELLED a
    // paid plan. Carries the win-back OFFER (from Sujata). Redemption is manual:
    // the host replies / taps and an admin grants it via Host360 (no coupon engine).
    name: 'Churn-winback', sender_key: 'tithi',
    description: 'Host cancelled a paid subscription — win them back with an offer (Sujata).',
    is_active: true, stop_on_reply: true, stop_on_convert: true,
    steps: [
      { step_no: 1, delay_hours: 0, channel: 'email', sender_key: 'tithi',
        subject: 'Sorry to see you go, {{first_name}}',
        body: p(`You cancelled — totally fair. Before you leave for good, is there anything we can fix?`) + p(`Just reply and tell me what wasn't working.`) + SIGN_TITHI },
      // The OFFER — from Sujata (marketing voice). Conditional on renewal; admin
      // adds the 2 bonus months in Host360 once the host has renewed.
      { step_no: 2, delay_hours: 48, channel: 'email', sender_key: 'sujata',
        subject: 'Renew and get 2 months free, {{first_name}}',
        body: p(`We'd love to have you back, {{first_name}}. ${OFFER_LINE}`) + p(`<a href="${BL}/dashboard">Renew now →</a>`) + p(`Reply <b>DONE</b> once you have and we'll add the 2 months.`) + SIGN_SUJATA },
      // WhatsApp carrying the same offer (placeholder AiSensy template).
      { step_no: 3, delay_hours: 24, channel: 'whatsapp', sender_key: 'sujata', template_key: WA.winback,
        variables: ['{{first_name}}'],
        subject: null, body: `{{first_name}}, renew your Book A Sloth plan and we'll add 2 months free on top. Reply RENEW 💛` },
      { step_no: 4, delay_hours: 96, channel: 'email', sender_key: 'tithi',
        subject: 'Not the price? Let\'s talk',
        body: p(`If price wasn't the issue, a quick 15 minutes might be. Reply and we'll find a time.`) + SIGN_TITHI },
    ],
  },
  {
    name: 'New Lead nurture', sender_key: 'tithi',
    description: 'Cold lead (event/import/website). SEEDED INACTIVE — real channel is WhatsApp (needs approved AiSensy templates). Email draft kept ready.',
    is_active: false, stop_on_reply: true, stop_on_convert: true,
    steps: [
      { step_no: 1, delay_hours: 0,   channel: 'email', subject: 'A booking link that gets you paid, {{first_name}}',
        body: p(`Book A Sloth turns your link into bookings and payments — no back-and-forth.`) + p(`<a href="${BL}">See how it works →</a>`) },
      { step_no: 2, delay_hours: 48,  channel: 'email', subject: 'Why creators switch to Book A Sloth',
        body: p(`One link for your services, calendar, and payments. Your clients book and pay in a couple of taps.`) },
      { step_no: 3, delay_hours: 72,  channel: 'email', subject: 'How {{profession}}s use it',
        body: p(`People like you use Book A Sloth to take bookings without the DMs and the "what times work?" loop.`) },
      { step_no: 4, delay_hours: 120, channel: 'email', subject: 'Want me to set it up with you?',
        body: p(`Reply and I'll help you get your page live — takes a few minutes.`) + SIGN_TITHI },
    ],
  },
];

// The two offers, also stored in the crm_templates library so they can be sent
// manually from a lead (the "Offers" surface). category='offer', from Sujata.
const OFFER_TEMPLATES = [
  { channel: 'email', name: 'offer_two_months_on_renewal', label: 'Offer · 2 months free on renewal', category: 'offer',
    subject: 'Renew and get 2 months free, {{first_name}}',
    body: p(`Renew any plan — monthly or yearly — and we'll add <b>2 extra months</b> on us, {{first_name}}.`) + p(`<a href="{{booking_link}}/dashboard">Renew now →</a>`) + p(`Reply <b>DONE</b> once you have and we'll add them.`) + SIGN_SUJATA },
];

async function upsertSequence(seq) {
  const { data: existing } = await supabaseAdmin.from('crm_sequences')
    .select('id').eq('name', seq.name).maybeSingle();

  const row = {
    name: seq.name, description: seq.description, is_active: seq.is_active,
    stop_on_reply: seq.stop_on_reply, stop_on_convert: seq.stop_on_convert,
    sender_key: seq.sender_key || null,
    created_by: 'seed', updated_at: new Date().toISOString(),
  };

  let seqId;
  if (existing) {
    await supabaseAdmin.from('crm_sequences').update(row).eq('id', existing.id);
    seqId = existing.id;
    await supabaseAdmin.from('crm_sequence_steps').delete().eq('sequence_id', seqId);
  } else {
    const { data, error } = await supabaseAdmin.from('crm_sequences').insert(row).select('id').single();
    if (error) throw error;
    seqId = data.id;
  }

  const steps = seq.steps.map((s) => ({
    sequence_id: seqId, step_no: s.step_no, delay_hours: s.delay_hours,
    channel: s.channel || 'email', template_key: s.template_key || null,
    sender_key: s.sender_key || null,          // step override; else sequence sender applies
    subject: s.subject || null, body: s.body || null,
    variables: s.variables || null,            // WhatsApp ordered params
  }));
  const { error: stepErr } = await supabaseAdmin.from('crm_sequence_steps').insert(steps);
  if (stepErr) throw stepErr;

  return { name: seq.name, seqId, steps: steps.length, active: seq.is_active, created: !existing };
}

async function upsertOfferTemplate(t) {
  const { data: existing } = await supabaseAdmin.from('crm_templates').select('id').eq('name', t.name).maybeSingle();
  const row = { ...t, is_active: true, created_by: 'seed', updated_at: new Date().toISOString() };
  if (existing) await supabaseAdmin.from('crm_templates').update(row).eq('id', existing.id);
  else { const { error } = await supabaseAdmin.from('crm_templates').insert(row); if (error) throw error; }
  return { name: t.name, created: !existing };
}

async function main() {
  for (const seq of SEQUENCES) {
    const r = await upsertSequence(seq);
    console.log(`${r.created ? 'created' : 'updated'}: "${r.name}" — ${r.steps} steps, active=${r.active}`);
  }
  for (const t of OFFER_TEMPLATES) {
    const r = await upsertOfferTemplate(t);
    console.log(`${r.created ? 'created' : 'updated'} offer template: "${r.name}"`);
  }
  console.log('Done. Sequences match lifecycleEngine SEQ names + Churn-winback (markCancelled). Run on BOTH DBs.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message); process.exit(1); });

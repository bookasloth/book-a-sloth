'use strict';
/**
 * coldCallTemplates.js — the 8 follow-up templates the Cold Calling tab sends
 * after a call (4 outcomes × email + WhatsApp). Seeded into crm_templates by
 * scripts/seedColdCallTemplates.js; editable afterwards on /admin/sales/templates.
 *
 * Email: founder voice, sent as persona `shubham` (plain layout). Lead tokens
 * ({{business_name}}) are rendered by messageService; {{callback_time}} is filled
 * by coldCallService. WhatsApp: `name` is the AiSensy API CAMPAIGN name ("Purpose - Audience", the
 * Communication-page convention), not the template name; the founder
 * must create + get Meta approval for each, then mark it approved in the tab
 * (is_active=true). Until then sends are skipped with reason "pending_aisensy".
 */
const SIGNUP = 'https://bookasloth.com/login-as-vendor';
const PRICING = 'https://bookasloth.com/pricing';
const SIGN = '<p>Shubham<br>Founder, Book A Sloth</p>';
const BIZ = [{ key: 'business_name', label: 'Business name', example: 'Smile Dental' }];

const COLD_CALL_TEMPLATES = [
  {
    channel: 'email', name: 'cold_call_interested_email', label: 'Cold call · Interested → signup link', category: 'cold_call_interested', variables: [], is_active: true,
    subject: 'Your booking page — as discussed',
    body: `<p>Hi {{business_name}} team,</p>
<p>Thanks for your time on the call just now. As promised, here's the link to set up your online booking page:</p>
<p><a href="${SIGNUP}">Create your free booking page</a></p>
<p>It takes about 3 minutes: add your services and timings, and clients can book and pay online. They get automatic reminders, so fewer no-shows.</p>
<p>If you get stuck anywhere, just reply to this email and I'll set it up with you.</p>
${SIGN}`,
  },
  {
    channel: 'email', name: 'cold_call_details_email', label: 'Cold call · Wants details → info pack', category: 'cold_call_details', variables: [], is_active: true,
    subject: 'Book A Sloth — the details you asked for',
    body: `<p>Hi {{business_name}} team,</p>
<p>Thanks for speaking with me. Here are the details you asked for:</p>
<ul>
<li><b>What it is:</b> your own online booking page. Clients pick a service and a time slot, pay online, and get automatic reminders.</li>
<li><b>Pricing:</b> free to start. Plans are here: <a href="${PRICING}">bookasloth.com/pricing</a></li>
<li><b>Setup:</b> about 3 minutes, and I can do it with you on a call.</li>
</ul>
<p>When you're ready, you can create your page here: <a href="${SIGNUP}">bookasloth.com</a></p>
<p>I'll call you in a few days in case you have questions.</p>
${SIGN}`,
  },
  {
    channel: 'email', name: 'cold_call_callback_email', label: 'Cold call · Busy → callback reminder', category: 'cold_call_callback', variables: [], is_active: true,
    subject: "I'll call you on {{callback_time}}",
    body: `<p>Hi {{business_name}} team,</p>
<p>Thanks for picking up, I know it was a busy moment. As discussed, I'll call you on <b>{{callback_time}}</b>.</p>
<p>In the meantime, here's a quick look at what we do: <a href="https://bookasloth.com">bookasloth.com</a>, an online booking page with payments and automatic reminders for clinics and salons.</p>
${SIGN}`,
  },
  {
    channel: 'email', name: 'cold_call_nurture_email', label: 'Cold call · Not now → soft nurture', category: 'cold_call_nurture', variables: [], is_active: true,
    subject: "Whenever you're ready",
    body: `<p>Hi {{business_name}} team,</p>
<p>Thanks for your time today. No rush at all. Whenever you want to stop managing bookings over phone and WhatsApp, your free booking page is a 3-minute setup:</p>
<p><a href="${SIGNUP}">Create your free booking page</a></p>
<p>Just reply here if you ever want help setting it up.</p>
${SIGN}`,
  },
  {
    channel: 'whatsapp', name: 'Cold Call Interested - Vendor', label: 'Cold call · Interested → signup link (WA)', category: 'cold_call_interested', variables: BIZ, is_active: false, subject: null,
    body: `Hi {{1}} team, Shubham from Book A Sloth here. Thanks for your time today!
You can create your free booking page here:
${SIGNUP}
Clients can book, pay, and get reminders automatically. Setup takes about 3 minutes.
Reply here if you want me to help you set it up.`,
  },
  {
    channel: 'whatsapp', name: 'Cold Call Details - Vendor', label: 'Cold call · Wants details → info pack (WA)', category: 'cold_call_details', variables: BIZ, is_active: false, subject: null,
    body: `Hi {{1}} team, Shubham from Book A Sloth here. As discussed, here’s the quick overview:
• Online booking page
• Online payments
• Automatic reminders
• Less admin work
Free to start.
Pricing: ${PRICING}
I’ll check in with you in a few days. Feel free to message me anytime.`,
  },
  {
    channel: 'whatsapp', name: 'Cold Call Callback - Vendor', label: 'Cold call · Busy → callback reminder (WA)', category: 'cold_call_callback',
    variables: [...BIZ, { key: 'callback_time', label: 'Callback time', example: 'Tue, 7 Oct, 5:00 pm' }], is_active: false, subject: null,
    body: `Hi {{1}} team, Shubham from Book A Sloth here. Thanks for taking my call!
As discussed, I’ll call you on {{2}}.
Talk soon!`,
  },
  {
    channel: 'whatsapp', name: 'Cold Call Nurture - Vendor', label: 'Cold call · Not now → soft nurture (WA)', category: 'cold_call_nurture', variables: BIZ, is_active: false, subject: null,
    body: `Hi {{1}} team, Shubham from Book A Sloth here. Thanks for your time today.
Whenever you're ready, you can create your free booking page here:
${SIGNUP}
It takes about 3 minutes, and I’m happy to help you set it up.
Just reply here whenever you’re ready.`,
  },
];

module.exports = { COLD_CALL_TEMPLATES };

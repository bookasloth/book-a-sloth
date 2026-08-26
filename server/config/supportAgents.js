'use strict';

/**
 * supportAgents — maps an admin's login email to the customer-facing persona they
 * appear as in support chat (one of the real Book A Sloth support team members).
 *
 * WHY a config map and not a table: the roster is small and fixed. Agents log in
 * with their OWN admin accounts (the JWT already identifies who is replying — see
 * req.admin), so there is NO 4-digit code. This map only decides the warm display
 * NAME the customer sees; attribution/audit still uses the real admin id.
 *
 * RULE: keep this 1:1 — one admin email = one real person. Never let one admin
 * appear under several personas (that would be deception, not support).
 *
 * To add/rename an agent: edit PERSONAS. Promote to a DB table only if this ever
 * needs an in-admin editing UI. (ponytail: fixed roster → config file is enough.)
 */

// email (lower-cased) → display name shown to customers.
const PERSONAS = {
  'tithi@bookasloth.in': 'Tithi',
  // 8 team members from the About page — fill real login emails when provisioned.
  'durga@bookasloth.in': 'Durga',
  'aarav@bookasloth.in': 'Aarav',
  'meera@bookasloth.in': 'Meera',
  'kabir@bookasloth.in': 'Kabir',
  'ananya@bookasloth.in': 'Ananya',
  'rohan@bookasloth.in': 'Rohan',
  'isha@bookasloth.in': 'Isha',
  'vihaan@bookasloth.in': 'Vihaan',
};

const FALLBACK = 'Support Team';

/** Customer-facing name for an admin. Never leaks a raw email/id. */
function personaFor(email) {
  if (!email) return FALLBACK;
  return PERSONAS[String(email).trim().toLowerCase()] || FALLBACK;
}

/**
 * The auto-intro posted when an agent claims a chat. `name` is the customer's
 * first name when known (from the context service) — omitted gracefully otherwise.
 */
function introMessage(persona, name) {
  const hi = name ? `Hi ${name}` : 'Hi';
  return `${hi} — I'm ${persona} from the Book A Sloth support team. `
    + `Give me a moment to read your messages and I'll help you right away.`;
}

module.exports = { personaFor, introMessage, FALLBACK, PERSONAS };

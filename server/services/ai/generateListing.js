'use strict';
// ponytail: access getClient via the module object (not destructured) so
// jest.spyOn(client, 'getClient') in tests can intercept it live — a
// destructured reference would capture the original fn at require-time.
const anthropicClient = require('./anthropicClient');
const { MODELS } = anthropicClient;
const { LISTING_TOOL, sanitizeListing } = require('./listingContract');

const SYSTEM = [
  'You are an expert SEO/AEO/GEO copywriter for a services marketplace (Book A Sloth).',
  'Write a complete, publish-ready service listing by calling the emit_listing tool.',
  'Rules: English only. Primary keyword (from the title) appears in the title, the first',
  'sentence of long_description, and at least one FAQ — natural density, no stuffing.',
  'short_description and every FAQ answer lead with the direct answer and stand alone.',
  'Write in second person ("you"), benefit-led and concrete — name what the client walks away with, not adjectives.',
  'long_description opens definitionally ("<Service> is a ..."), factual, entity-rich.',
  'included_items/excluded_items are specific deliverables, not vague promises.',
  'NEVER invent prices, guarantees, certifications, licenses, medical/legal claims,',
  'specific results, reviews, ratings, addresses, or phone numbers. Leave unknowable',
  'facts out. Only choose a category from the allowed list; omit category if none fit.',
].join(' ');

function buildUserMessage({ title, category, price, duration, city, audience, tweak, allowedCategorySlugs }) {
  const ctx = [`Service title: ${title}`];
  if (category) ctx.push(`Host-selected category slug: ${category}`);
  if (price) ctx.push(`Price (context only, do not state in copy): ${price}`);
  if (duration) ctx.push(`Duration minutes (context only): ${duration}`);
  if (city) ctx.push(`City: ${city}`);
  if (audience) ctx.push(`Audience: ${audience}`);
  if (allowedCategorySlugs?.length) ctx.push(`Allowed category slugs: ${allowedCategorySlugs.join(', ')}`);
  if (tweak) ctx.push(`Adjustment requested: ${tweak}`);
  return ctx.join('\n');
}

// A forced tool_choice requires thinking OFF. How you express "off" depends on
// the model family, and getting it wrong is a 400 → the unmapped 502:
//   • adaptive family (Sonnet 5, Opus 4.6+, …): thinking is ON by default and
//     the ONLY way to turn it off is `{type:'disabled'}`.
//   • pre-adaptive (Haiku 4.5, Sonnet 4.5, Claude 3.x): thinking is OFF by
//     default and `{type:'disabled'}` is NOT a valid type — you must OMIT it.
// This lets MODELS.listing / BOLT_LISTING_MODEL point at either family safely.
function thinkingParamFor(model) {
  const preAdaptive = /haiku|sonnet-4-5|claude-3/.test(model || '');
  return preAdaptive ? {} : { thinking: { type: 'disabled' } };
}

async function callOnce(client, { model, system, user }) {
  // No temperature/top_p/top_k — defaults only (Sonnet 5 rejects non-default
  // sampling params). thinking handled per-model by thinkingParamFor().
  //
  // max_tokens 4096: the full listing (long_description + 4-6 included/excluded
  // bullets + 4-5 FAQs + note) overruns 1500, truncating the forced tool call
  // into invalid/partial JSON → AI_INVALID. 4096 leaves headroom.
  const resp = await client.messages.create({
    model, max_tokens: 4096, system,
    ...thinkingParamFor(model),
    tools: [LISTING_TOOL], tool_choice: { type: 'tool', name: 'emit_listing' },
    messages: [{ role: 'user', content: user }],
  });
  const block = (resp.content || []).find((b) => b.type === 'tool_use' && b.name === 'emit_listing');
  return block ? block.input : null;
}

async function generateListing(opts = {}) {
  const client = anthropicClient.getClient();
  if (!client) throw new Error('AI_UNAVAILABLE');
  const { allowedCategorySlugs = [] } = opts;
  // Listing generation uses MODELS.listing (Sonnet 5 by default; BOLT_LISTING_MODEL
  // can repoint it). generate vs regenerate no longer changes the model — variety comes from the
  // tweak text in the prompt (buildUserMessage), so opts.regenerate is unused here.
  const model = MODELS.listing;
  const user = buildUserMessage(opts);

  let raw = await callOnce(client, { model, system: SYSTEM, user });
  if (!raw) {
    raw = await callOnce(client, {
      model,
      system: SYSTEM + ' You MUST call emit_listing with every required field filled.',
      user,
    });
  }
  if (!raw) throw new Error('AI_INVALID');

  const { fields } = sanitizeListing(raw, { allowedCategorySlugs });
  return { fields, model };
}

module.exports = { generateListing, buildUserMessage, SYSTEM, thinkingParamFor };

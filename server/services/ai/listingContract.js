'use strict';
// Field contract for AI listing autofill: the Anthropic tool schema + a pure
// server-side sanitizer that enforces limits and strips fabricated facts.

const LISTING_TOOL = {
  name: 'emit_listing',
  description: 'Return the fully-written service listing fields.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Refined title, <=60 chars, primary keyword near front.' },
      short_description: { type: 'string', description: 'Answer-first hook, <=160 chars. Doubles as meta description.' },
      long_description: { type: 'string', description: 'HTML body, definitional opening ("<Service> is a ..."), ~300-600 chars of text.' },
      included_items: { type: 'array', items: { type: 'string' }, description: '4-6 concrete bullets.' },
      excluded_items: { type: 'array', items: { type: 'string' }, description: '4-6 expectation-setting bullets.' },
      faqs: {
        type: 'array',
        items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } }, required: ['question', 'answer'] },
        description: '4-5 FAQs, question phrased as users search, answer-first ~20 words.',
      },
      important_note: { type: 'string', description: 'Caveats/prerequisites, <=200 chars.' },
      category: { type: 'string', description: 'A slug from the allowed list only; omit if none fit.' },
    },
    required: ['title', 'short_description', 'long_description', 'included_items', 'excluded_items', 'faqs'],
  },
};

// Fabricated-fact signals the model must never assert. If present, blank the field.
const FABRICATION = /(₹|\bRs\.?\b|\$\d|\b\d+\s*%|money[- ]?back|guarantee|certified|licen[cs]ed|\bFDA\b|\bISO\b|\b\d(?:\.\d)?\s*stars?\b|\b\d{10}\b|@[\w.-]+\.\w+)/i;

const clamp = (s, n) => String(s || '').trim().slice(0, n);
const arr = (v) => (Array.isArray(v) ? v : []);

function sanitizeListing(raw, { allowedCategorySlugs = [] } = {}) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const dropped = [];
  const guard = (key, val) => {
    if (val && FABRICATION.test(String(val))) { dropped.push(key); return ''; }
    return val;
  };

  const fields = {};
  fields.title = clamp(guard('title', r.title), 60);
  fields.short_description = clamp(guard('short_description', r.short_description), 160);
  fields.long_description = guard('long_description', String(r.long_description || '').trim());
  fields.important_note = clamp(guard('important_note', r.important_note), 200);
  fields.included_items = arr(r.included_items).map((x) => String(x).trim()).filter(Boolean).slice(0, 6);
  fields.excluded_items = arr(r.excluded_items).map((x) => String(x).trim()).filter(Boolean).slice(0, 6);
  fields.faqs = arr(r.faqs)
    .filter((f) => f && (f.question || f.answer))
    .map((f) => ({ question: clamp(f.question, 200), answer: clamp(guard('faq_answer', f.answer), 400) }))
    .filter((f) => f.question && f.answer)
    .slice(0, 5);

  if (r.category && allowedCategorySlugs.includes(r.category)) fields.category = r.category;

  return { fields, dropped };
}

module.exports = { LISTING_TOOL, sanitizeListing };

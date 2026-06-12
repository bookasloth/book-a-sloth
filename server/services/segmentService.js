/**
 * segmentService — resolve a segment definition to a contactable recipient list.
 * Consent + suppression for the target channel are ALWAYS enforced here, so no
 * caller can message an opted-out contact.
 *
 * definition = { contact_type?: string, filters?: [{ field, op, value }] }
 *   field is a top-level contact column OR an attributes.<key>.
 *   op ∈ 'eq' | 'neq' | 'exists' | 'gt' | 'lt'
 */
'use strict';
const { supabaseAdmin } = require('../config/supabase');

const getField = (c, field) => (field in c ? c[field] : (c.attributes || {})[field]);

const passes = (c, f) => {
  const v = getField(c, f.field);
  switch (f.op) {
    case 'eq':     return v === f.value;
    case 'neq':    return v !== f.value;
    case 'exists': return v !== null && v !== undefined && v !== '';
    case 'gt':     return v != null && v > f.value;
    case 'lt':     return v != null && v < f.value;
    default:       return true;
  }
};

const contactable = (c, channel) =>
  channel === 'email'
    ? !!c.email && !!c.email_opt_in && !c.email_suppressed
    : !!c.phone && !!c.whatsapp_opt_in && !c.whatsapp_suppressed;

async function resolve(definition = {}, channel = 'email') {
  const { data, error } = await supabaseAdmin.from('contacts').select('*');
  if (error) return [];
  let rows = (data || []).filter((c) => contactable(c, channel));
  if (definition.contact_type) rows = rows.filter((c) => c.contact_type === definition.contact_type);
  for (const f of definition.filters || []) rows = rows.filter((c) => passes(c, f));
  return rows;
}

/** Count only (used by the builder preview). */
async function count(definition, channel = 'email') {
  return (await resolve(definition, channel)).length;
}

module.exports = { resolve, count };

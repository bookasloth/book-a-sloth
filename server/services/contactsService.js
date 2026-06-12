/**
 * contactsService — builds the consented, contactable audience by syncing
 * profiles + bookings + product_purchases into the `contacts` table.
 * Derived data: never hand-edited except suppression toggles (preserved here).
 */
'use strict';
const { supabaseAdmin } = require('../config/supabase');

const norm = (e) => (e || '').trim().toLowerCase();

const TYPE_RANK = { vendor: 3, buyer: 2, guest: 1 };
const rankType = (a, b) => ((TYPE_RANK[b] || 0) > (TYPE_RANK[a] || 0) ? b : (a || b));

async function loadExistingByEmail() {
  const { data } = await supabaseAdmin.from('contacts').select('*');
  const map = new Map();
  for (const c of data || []) if (c.email) map.set(norm(c.email), c);
  return map;
}

/** Merge a source record into the working map, newest wins for display fields. */
function upsertInto(map, { email, name, phone, type, attrs = {}, userId = null, source }) {
  const key = norm(email);
  if (!key) return; // Phase 1: email channel only
  const prev = map.get(key) || {};
  map.set(key, {
    ...prev,
    email: key,
    name: name || prev.name || '',
    phone: phone || prev.phone || '',
    user_id: userId || prev.user_id || null,
    // vendor outranks buyer outranks guest when a person appears in several sources
    contact_type: rankType(prev.contact_type, type),
    attributes: { ...(prev.attributes || {}), ...attrs },
    source: prev.source ? `${prev.source},${source}` : source,
  });
}

async function sync() {
  const [{ data: profiles }, { data: bookings }, { data: purchases }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, email, name, phone, role, plan'),
    supabaseAdmin.from('bookings').select('guest_email, guest_name, guest_phone, scheduled_at'),
    supabaseAdmin.from('product_purchases').select('buyer_email, buyer_name, buyer_phone'),
  ]);

  const work = new Map();
  for (const p of profiles || []) {
    upsertInto(work, {
      email: p.email, name: p.name, phone: p.phone, type: p.role === 'host' ? 'vendor' : 'guest',
      userId: p.id, attrs: { plan: p.plan || null }, source: 'profile',
    });
  }
  for (const b of bookings || []) {
    upsertInto(work, {
      email: b.guest_email, name: b.guest_name, phone: b.guest_phone, type: 'guest',
      attrs: { last_booking_at: b.scheduled_at }, source: 'booking',
    });
  }
  for (const pu of purchases || []) {
    upsertInto(work, {
      email: pu.buyer_email, name: pu.buyer_name, phone: pu.buyer_phone, type: 'buyer', source: 'purchase',
    });
  }

  // Preserve consent/suppression from existing rows.
  const existing = await loadExistingByEmail();
  const now = new Date().toISOString();
  const rows = [];
  for (const [key, c] of work) {
    const prev = existing.get(key) || {};
    rows.push({
      ...(prev.id ? { id: prev.id } : {}),
      email: c.email, name: c.name, phone: c.phone, user_id: c.user_id,
      contact_type: c.contact_type, attributes: c.attributes, source: c.source,
      email_opt_in:        prev.email_opt_in        ?? true,
      whatsapp_opt_in:     prev.whatsapp_opt_in     ?? true,
      email_suppressed:    prev.email_suppressed    ?? false,
      whatsapp_suppressed: prev.whatsapp_suppressed ?? false,
      last_synced_at: now, updated_at: now,
    });
  }

  if (rows.length) {
    const { error } = await supabaseAdmin.from('contacts').upsert(rows, { onConflict: 'email' }).select();
    if (error) return { upserted: 0, error: error.message };
  }
  return { upserted: rows.length };
}

module.exports = { sync, norm };

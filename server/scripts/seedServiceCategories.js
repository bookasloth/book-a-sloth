/**
 * seedServiceCategories.js — idempotent seed of the profession-scoped
 * service_categories table from config/serviceCategorySeed.js.
 *
 * For each primary_category, inserts one row per service name (slug derived from
 * the name, unique within the profession) with display_order = position in list.
 * Re-running only fills gaps: existing (primary_category, slug) rows are left
 * untouched so admin edits / deactivations are never clobbered.
 *
 * Run: node scripts/seedServiceCategories.js
 */
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');
const { SERVICE_CATEGORY_SEED } = require('../config/serviceCategorySeed');

// Mirrors serviceCategoryController.slugify (kept in sync intentionally).
const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

async function run() {
  let inserted = 0;
  let skipped = 0;
  const professions = Object.keys(SERVICE_CATEGORY_SEED);

  for (const primary of professions) {
    const names = SERVICE_CATEGORY_SEED[primary] || [];

    // Existing slugs for this profession → skip duplicates (idempotent).
    const { data: existing, error: exErr } = await supabaseAdmin
      .from('service_categories')
      .select('slug')
      .eq('primary_category', primary);
    if (exErr) throw exErr;
    const have = new Set((existing || []).map((r) => r.slug));

    const rows = [];
    const seen = new Set(have);
    names.forEach((name, i) => {
      let slug = slugify(name);
      if (!slug || seen.has(slug)) return; // collision within profession → skip
      seen.add(slug);
      rows.push({ primary_category: primary, name, slug, display_order: i, is_active: true });
    });

    if (rows.length === 0) {
      skipped += names.length;
      continue;
    }

    const { error: insErr } = await supabaseAdmin.from('service_categories').insert(rows);
    if (insErr) throw insErr;
    inserted += rows.length;
    skipped += names.length - rows.length;
    console.log(`  ${primary}: +${rows.length} (${have.size} already present)`);
  }

  console.log(`\nDone. Seeded ${professions.length} professions → ${inserted} inserted, ${skipped} skipped.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });

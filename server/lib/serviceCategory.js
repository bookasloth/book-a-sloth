// server/lib/serviceCategory.js
// A service's category must be one of the ACTIVE service categories defined for
// the host's PRIMARY profession (service_categories WHERE primary_category = …).
// See migration v3.53 and config/serviceCategorySeed.js.

// Pure decision. required=true → a category MUST be chosen when the profession
// has any active service categories (create). required=false → only validate
// membership when one is provided (update, where absent = "leave unchanged").
function validateServiceCategory({ category, validSlugs, required = false }) {
  const valid = Array.isArray(validSlugs) ? validSlugs.filter(Boolean) : [];
  const value = typeof category === 'string' ? category.trim() : '';

  if (!value) {
    if (required && valid.length) {
      return { ok: false, status: 400, message: 'A service category is required' };
    }
    return { ok: true, value: null };
  }
  // Profession has no service categories on record → nothing to validate against.
  if (!valid.length) return { ok: true, value: null };
  if (!valid.includes(value)) {
    return { ok: false, status: 400, message: `"${value}" is not a valid service category for your profession` };
  }
  return { ok: true, value };
}

// Load the host's primary category, then its active service-category slugs, then
// validate. supabaseAdmin is injected so the pure logic above stays unit-testable.
async function resolveAndValidateCategory(supabaseAdmin, hostId, category, opts = {}) {
  let validSlugs = [];
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('primary_category').eq('id', hostId).single();
  const primary = profile?.primary_category || null;

  if (primary) {
    const { data: rows } = await supabaseAdmin
      .from('service_categories')
      .select('slug')
      .eq('primary_category', primary)
      .eq('is_active', true);
    validSlugs = (rows || []).map((r) => r.slug);
  }
  return validateServiceCategory({ category, validSlugs, required: !!opts.required });
}

module.exports = { validateServiceCategory, resolveAndValidateCategory };

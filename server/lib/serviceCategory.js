// server/lib/serviceCategory.js
// A service must sit inside one of the host's own categories (profiles.categories).
// See docs/superpowers/specs/2026-06-20-service-categories-design.md.

// Pure decision. required=true → a category MUST be chosen when the host has any
// (create). required=false → only validate membership when one is provided
// (update, where an absent category means "leave unchanged").
function validateServiceCategory({ category, hostCategories, required = false }) {
  const host = Array.isArray(hostCategories) ? hostCategories.filter(Boolean) : [];
  const value = typeof category === 'string' ? category.trim() : '';

  if (!value) {
    if (required && host.length) {
      return { ok: false, status: 400, message: 'A service category is required' };
    }
    return { ok: true, value: null };
  }
  // No categories on record → nothing to validate against; drop it silently.
  if (!host.length) return { ok: true, value: null };
  if (!host.includes(value)) {
    return { ok: false, status: 400, message: `"${value}" is not one of your categories` };
  }
  return { ok: true, value };
}

// Load the host's categories, then validate. supabaseAdmin is injected so the
// pure logic above stays unit-testable without a DB.
async function resolveAndValidateCategory(supabaseAdmin, hostId, category, opts = {}) {
  let hostCategories = [];
  const { data } = await supabaseAdmin
    .from('profiles').select('categories, primary_category').eq('id', hostId).single();
  if (data) {
    if (Array.isArray(data.categories) && data.categories.length) hostCategories = data.categories;
    else if (data.primary_category) hostCategories = [data.primary_category];
  }
  return validateServiceCategory({ category, hostCategories, required: !!opts.required });
}

module.exports = { validateServiceCategory, resolveAndValidateCategory };

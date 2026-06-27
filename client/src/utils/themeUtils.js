/**
 * themeUtils.js
 * Plan-gated color system + WCAG contrast helpers for the creator profile theme.
 */

// ─── WCAG 2.1 relative luminance ────────────────────────────────────────────

const toLinear = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

export const getLuminance = (hex) => {
  if (!hex || hex.length < 7) return 0;
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  } catch {
    return 0;
  }
};

/**
 * Returns '#ffffff' or '#111827' based on WCAG contrast against the given background.
 */
export const getContrastColor = (hex) => {
  if (!hex || !hex.startsWith('#')) return '#ffffff';
  return getLuminance(hex) > 0.35 ? '#111827' : '#ffffff';
};

// ─── Plan-gated color palettes ───────────────────────────────────────────────

// Starter (free) tier: brand orange only — no choice, keeps free profiles on-brand.
export const FREE_COLORS = [
  { name: 'Brand Orange', hex: '#FE5100' },
];

export const CREATOR_COLORS = [
  { name: 'Brand Orange',  hex: '#FE5100' },
  { name: 'Royal Blue',    hex: '#2563EB' },
  { name: 'Indigo',        hex: '#4F46E5' },
  { name: 'Purple',        hex: '#7C3AED' },
  { name: 'Pink',          hex: '#EC4899' },
  { name: 'Crimson',       hex: '#DC2626' },
  { name: 'Emerald',       hex: '#10B981' },
  { name: 'Forest Green',  hex: '#15803D' },
  { name: 'Teal',          hex: '#0F766E' },
  { name: 'Cyan',          hex: '#0891B2' },
  { name: 'Sky Blue',      hex: '#0284C7' },
  { name: 'Amber',         hex: '#F59E0B' },
  { name: 'Yellow',        hex: '#EAB308' },
  { name: 'Lime',          hex: '#84CC16' },
  { name: 'Slate',         hex: '#475569' },
  { name: 'Charcoal',      hex: '#1F2937' },
];

// Studio (+ Supreme) tier: full hue-ordered palette + custom hex picker.
// No pure black/white. Approximated from the design swatch sheet — tweak hex freely.
export const STUDIO_COLORS = [
  // warm → green
  { name: 'Pink',         hex: '#EC4899' },
  { name: 'Rose',         hex: '#F43F5E' },
  { name: 'Coral',        hex: '#FB7185' },
  { name: 'Red',          hex: '#DC2626' },
  { name: 'Orange',       hex: '#F97316' },
  { name: 'Brand Orange', hex: '#FE5100' },
  { name: 'Amber',        hex: '#F59E0B' },
  { name: 'Gold',         hex: '#EAB308' },
  { name: 'Yellow',       hex: '#FACC15' },
  { name: 'Lime',         hex: '#84CC16' },
  { name: 'Light Green',  hex: '#4ADE80' },
  { name: 'Green',        hex: '#22C55E' },
  { name: 'Emerald',      hex: '#10B981' },
  { name: 'Forest Green', hex: '#15803D' },
  // cool → neutral
  { name: 'Teal',         hex: '#14B8A6' },
  { name: 'Cyan',         hex: '#06B6D4' },
  { name: 'Sky Blue',     hex: '#0EA5E9' },
  { name: 'Royal Blue',   hex: '#2563EB' },
  { name: 'Indigo',       hex: '#4F46E5' },
  { name: 'Violet',       hex: '#7C3AED' },
  { name: 'Purple',       hex: '#9333EA' },
  { name: 'Fuchsia',      hex: '#C026D3' },
  { name: 'Brown',        hex: '#92400E' },
  { name: 'Dark Brown',   hex: '#78350F' },
  { name: 'Slate',        hex: '#475569' },
  { name: 'Grey',         hex: '#6B7280' },
  { name: 'Cool Grey',    hex: '#9CA3AF' },
  { name: 'Taupe',        hex: '#A8A29E' },
];

export const DEFAULT_THEME_COLOR = '#FE5100';

/**
 * Returns the color swatches available for the given plan.
 *   Starter        → brand orange only (1)
 *   Host+          → CREATOR_COLORS (16)
 *   Studio/Supreme → STUDIO_COLORS (full palette) + custom hex input
 */
export const getColorsForPlan = (plan) => {
  if (plan === 'professional' || plan === 'supreme') return STUDIO_COLORS;
  if (plan === 'creator') return CREATOR_COLORS;
  return FREE_COLORS;
};

export const canUseCustomHex = (plan) => plan === 'professional' || plan === 'supreme';

// ─── Profile photo border color by plan ─────────────────────────────────────

export const getPlanBorderColor = (plan) => {
  if (plan === 'supreme')      return '#D4AF37'; // gold (top tier, shares Studio)
  if (plan === 'professional') return '#D4AF37'; // gold
  if (plan === 'creator')      return '#FE5100'; // brand orange
  return '#6B7280';                               // grey
};

// ─── Plan display labels (UI ONLY — DB slugs/names are unchanged) ────────────
// Maps the internal plan slug to the user-facing brand name. Internal code,
// routes, DB values, feature flags, and analytics keep their original slugs.
export const PLAN_DISPLAY = {
  starter: 'Starter', explorer: 'Starter', free: 'Starter',
  creator: 'Host+',
  professional: 'Studio', pro: 'Studio',
};

// Render-time plan label. Pass the slug; optional fallback for unknown slugs.
export const planLabel = (slug, fallback) =>
  PLAN_DISPLAY[String(slug || '').toLowerCase()] || fallback || slug || '';

// Collapse legacy plan aliases to the canonical DB slug so UI lookups
// (badges, premium cards, lock gates) never miss on a synonym. The free tier's
// real slug is `starter`; `explorer`/`free` are legacy aliases. `pro` ===
// `professional`. Unknown slugs fall through to `starter`.
const PLAN_ALIASES = { explorer: 'starter', free: 'starter', pro: 'professional' };
export const CANONICAL_PLANS = ['starter', 'creator', 'professional', 'supreme'];
export const normalizePlan = (slug) => {
  const s = String(slug || '').toLowerCase();
  const canon = PLAN_ALIASES[s] || s;
  return CANONICAL_PLANS.includes(canon) ? canon : 'starter';
};

export const getPlanBorderLabel = (plan) => {
  if (plan === 'supreme')      return 'Supreme';
  if (plan === 'professional') return 'Studio';
  if (plan === 'creator')      return 'Host+';
  return 'Starter';
};

// ─── Social platform brand colors ────────────────────────────────────────────

export const SOCIAL_BRAND_COLORS = {
  instagram: '#E1306C',
  youtube:   '#FF0000',
  linkedin:  '#0A66C2',
  facebook:  '#1877F2',
  twitter:   '#000000',
  website:   '#374151',
  whatsapp:  '#25D366',
  github:    '#24292F',
  email:     '#374151',
};

// ─── CSS variable application ────────────────────────────────────────────────

// Mix a hex color toward white (amount > 0) or black (amount < 0). amount ∈ [-1, 1].
export const shadeHex = (hex, amount) => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return hex;
  const target = amount >= 0 ? 255 : 0;
  const t = Math.abs(amount);
  const mix = (c) => Math.round(c + (target - c) * t);
  const r = mix(parseInt(hex.slice(1, 3), 16));
  const g = mix(parseInt(hex.slice(3, 5), 16));
  const b = mix(parseInt(hex.slice(5, 7), 16));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/**
 * Injects the full set of profile theme CSS vars onto an element:
 *   --profile-accent        the host's chosen color
 *   --profile-accent-text   WCAG-contrast text color on the accent
 *   --profile-accent-hover  slightly darker (hover states)
 *   --profile-accent-light  pale tint (backgrounds, pills)
 *   --profile-accent-dark   strong shade (headings on light)
 * Call this on the page wrapper (or document.documentElement) so all themed
 * elements consume vars instead of hardcoded colors.
 */
export const applyProfileTheme = (element, color) => {
  if (!element || !color) return;
  element.style.setProperty('--profile-accent', color);
  element.style.setProperty('--profile-accent-text', getContrastColor(color));
  element.style.setProperty('--profile-accent-hover', shadeHex(color, -0.12));
  element.style.setProperty('--profile-accent-light', shadeHex(color, 0.88));
  element.style.setProperty('--profile-accent-dark', shadeHex(color, -0.3));
};

/**
 * Validates a hex color string.
 */
export const isValidHex = (hex) => /^#[0-9a-fA-F]{6}$/.test(hex);

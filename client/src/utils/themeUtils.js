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

export const FREE_COLORS = [
  { name: 'Milk White',   hex: '#F8F7F2' },
  { name: 'Grey',         hex: '#6B7280' },
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

export const DEFAULT_THEME_COLOR = '#FE5100';

/**
 * Returns the color swatches available for the given plan.
 * Professional plan gets CREATOR_COLORS + custom hex input.
 */
export const getColorsForPlan = (plan) => {
  if (plan === 'creator' || plan === 'professional') return CREATOR_COLORS;
  return FREE_COLORS;
};

export const canUseCustomHex = (plan) => plan === 'professional';

// ─── Profile photo border color by plan ─────────────────────────────────────

export const getPlanBorderColor = (plan) => {
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

export const getPlanBorderLabel = (plan) => {
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

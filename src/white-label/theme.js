// Tenant theme resolution for the ABOS White-Label UI Kit.
//
// Pure functions only — no React, no DOM — so the whole branding contract is
// unit-testable and can also run server-side (e.g. the package builder baking
// a tenant's theme into a generated config file).
//
// Tenant branding is DATA, never code: adding a customer must never mean
// touching a component. Everything a tenant can customize is expressed here
// as a token, and components read tokens rather than hardcoding colors.

/** Neutral ABOS defaults. A tenant that sets nothing still gets a usable, unbranded-but-clean UI. */
export const DEFAULT_THEME = Object.freeze({
  brandName: 'Aircraft Intelligence',
  logoUrl: null,
  primaryColor: '#0EA5E9',
  mode: 'light',
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  radius: '0.75rem',
});

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const VALID_MODES = Object.freeze(['light', 'dark']);

/** Expands #abc to #aabbcc; returns null for anything that isn't a valid hex color. */
export function normalizeHexColor(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!HEX_PATTERN.test(trimmed)) return null;
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

/** sRGB relative luminance (WCAG 2.x definition). */
export function relativeLuminance(hex) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return 0;
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(normalized.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG contrast ratio between two colors, 1..21. */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Picks black or white text for a given background, whichever has better
 * contrast. A tenant can pick any brand color they like; the UI must stay
 * legible regardless — so foreground is derived, never configured.
 */
export function readableTextColor(backgroundHex) {
  return contrastRatio(backgroundHex, '#ffffff') >= contrastRatio(backgroundHex, '#000000')
    ? '#ffffff'
    : '#000000';
}

/**
 * Only http(s) URLs are allowed for tenant-supplied images. A tenant config is
 * customer-controlled data that ends up in an src attribute, so `javascript:`
 * and `data:` URLs are rejected here rather than relied on to be harmless.
 */
export function safeImageUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (_e) {
    return null;
  }
  return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null;
}

/**
 * Resolves a raw tenant config (as returned by tenantCoreApi's whoami, or
 * read from a generated package config file) into a complete, safe theme.
 * Unknown/invalid values fall back to defaults rather than propagating.
 */
export function resolveTenantTheme(tenantConfig) {
  const config = tenantConfig && typeof tenantConfig === 'object' ? tenantConfig : {};

  const primaryColor = normalizeHexColor(config.primary_color ?? config.primaryColor) || DEFAULT_THEME.primaryColor;
  const requestedMode = String(config.mode ?? config.theme_mode ?? '').toLowerCase();
  const mode = VALID_MODES.includes(requestedMode) ? requestedMode : DEFAULT_THEME.mode;

  const brandName =
    String(config.brand_name ?? config.brandName ?? '').trim() ||
    String(config.display_name ?? config.displayName ?? '').trim() ||
    DEFAULT_THEME.brandName;

  return {
    brandName,
    logoUrl: safeImageUrl(config.logo_url ?? config.logoUrl) || DEFAULT_THEME.logoUrl,
    primaryColor,
    onPrimaryColor: readableTextColor(primaryColor),
    mode,
    fontFamily: String(config.font_family ?? config.fontFamily ?? '').trim() || DEFAULT_THEME.fontFamily,
    radius: String(config.radius ?? '').trim() || DEFAULT_THEME.radius,
  };
}

/** Surface palette per mode. Kept separate from brand color so a tenant's accent works in both. */
const SURFACES = Object.freeze(Object.assign(Object.create(null), {
  light: Object.freeze({
    background: '#ffffff',
    surface: '#f8fafc',
    border: '#e2e8f0',
    text: '#0f172a',
    textMuted: '#64748b',
    track: '#e2e8f0',
  }),
  dark: Object.freeze({
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    track: '#1e293b',
  }),
}));

/**
 * Flattens a resolved theme into CSS custom properties. Consumers apply these
 * to a scoped container (not :root) so an embedded white-label widget can
 * never bleed its branding into the host page's own styles.
 */
export function themeToCssVariables(theme) {
  const resolved = theme && theme.primaryColor ? theme : resolveTenantTheme(theme);
  const surface = SURFACES[resolved.mode] || SURFACES.light;
  return {
    '--abos-wl-primary': resolved.primaryColor,
    '--abos-wl-on-primary': resolved.onPrimaryColor,
    '--abos-wl-background': surface.background,
    '--abos-wl-surface': surface.surface,
    '--abos-wl-border': surface.border,
    '--abos-wl-text': surface.text,
    '--abos-wl-text-muted': surface.textMuted,
    '--abos-wl-track': surface.track,
    '--abos-wl-font': resolved.fontFamily,
    '--abos-wl-radius': resolved.radius,
  };
}

// Score band colors are intentionally NOT tenant-configurable: an ATI score's
// meaning must read identically across every deployment. A tenant that could
// recolor "poor" to green would be misrepresenting ABOS's assessment.
export const SCORE_BANDS = Object.freeze([
  Object.freeze({ min: 80, label: 'Excellent', color: '#059669' }),
  Object.freeze({ min: 65, label: 'Good', color: '#d97706' }),
  Object.freeze({ min: 50, label: 'Fair', color: '#ea580c' }),
  Object.freeze({ min: 0, label: 'Poor', color: '#dc2626' }),
]);

export function scoreBand(score) {
  const value = Number(score);
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return SCORE_BANDS.find((band) => safe >= band.min) || SCORE_BANDS[SCORE_BANDS.length - 1];
}

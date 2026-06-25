/**
 * Community — isolated design system for community surfaces.
 *
 * Distinct dark tier: #0F1218 canvas, #1A1F29 cards, warm gold #C9A84D
 * accent. Separate from Core Platform (#0B1220 / #D4A017) and ATI
 * Premium (ink #04060a / amber #f5c242). Used by the Community hub
 * and its sub-components.
 */

export const C = {
  bg:        "#0F1218",
  card:      "#1A1F29",
  cardHover: "#232838",
  border:    "rgba(255,255,255,0.08)",
  borderMd:  "rgba(255,255,255,0.12)",
  gold:      "#C9A84D",
  goldLight: "#F4E3A1",
  blue:      "#2563EB",
  text:      "#ffffff",
  textMuted: "rgba(255,255,255,0.55)",
  textDim:   "rgba(255,255,255,0.35)",
};

export const communityCard = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: "1.5rem",
  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
};
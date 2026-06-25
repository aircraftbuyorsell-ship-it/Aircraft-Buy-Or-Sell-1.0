/**
 * Community — unified with Legal Ink / Privacy Policy style.
 *
 * Backgrounds are now transparent so the global dot-grid + radial-gradient
 * canvas (applied in Layout) shows through. Cards use the same translucent
 * rgba(255,255,255,0.04) surface as Core Platform. Gold accent retained
 * for community-specific warmth.
 */

export const C = {
  bg:        "transparent",
  card:      "rgba(255,255,255,0.04)",
  cardHover: "rgba(255,255,255,0.06)",
  border:    "rgba(255,255,255,0.08)",
  borderMd:  "rgba(255,255,255,0.12)",
  gold:      "#f5c242",
  goldLight: "#fdd05a",
  blue:      "#4e8ef7",
  text:      "rgba(255,255,255,0.90)",
  textMuted: "rgba(255,255,255,0.60)",
  textDim:   "rgba(255,255,255,0.35)",
};

export const communityCard = {
  background: C.card,
  border: `0.5px solid ${C.border}`,
  borderRadius: "12px",
};
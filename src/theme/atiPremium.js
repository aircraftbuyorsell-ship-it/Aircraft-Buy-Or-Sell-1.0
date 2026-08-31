/**
 * ATI Premium — isolated design system for ATI tool surfaces.
 *
 * Distinct from Core Platform (#0B1220 / #111827): ink-black canvas,
 * amber-gold accent, dot-grid texture, ambient glow. Single source of
 * truth for ATIQuickScore, ATIFullReport, ATIVerify, ATIPassport and
 * the ATICenter hub.
 */

export const T = {
  ink:      "#04060a",
  ink1:     "#0d1117",
  ink2:     "#111620",
  ink3:     "#1a2235",
  amber:    "#f5c242",
  amberHov: "#fdd05a",
  amberDim: "rgba(245,194,66,0.10)",
  amberBdr: "rgba(245,194,66,0.22)",
  teal:     "#5dcaa5",
  tealDim:  "rgba(93,202,165,0.09)",
  tealBdr:  "rgba(93,202,165,0.20)",
  red:      "#e24b4a",
  redDim:   "rgba(226,75,74,0.10)",
  redBdr:   "rgba(226,75,74,0.22)",
  w1:       "rgba(255,255,255,0.90)",
  w2:       "rgba(255,255,255,0.50)",
  w3:       "rgba(255,255,255,0.25)",
  w4:       "rgba(255,255,255,0.09)",
  border:   "rgba(255,255,255,0.08)",
  borderMd: "rgba(255,255,255,0.12)",
};

/** Standard ATI premium card surface */
export const atiCard = {
  background:   "rgba(255,255,255,0.04)",
  border:       `0.5px solid ${T.border}`,
  borderRadius: "12px",
  overflow:     "hidden",
};

export const atiAccentLine = {
  height:     "2px",
  background: T.amber,
  flexShrink: 0,
};

export const atiAccentLineDim = {
  height:     "2px",
  background: T.border,
  flexShrink: 0,
};

/** Dot-grid canvas background for ATI Premium surfaces */
export const atiCanvas = {
  minHeight: "100vh",
  background: T.ink,
  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.09) 1.5px, transparent 1.5px)",
  backgroundSize: "40px 40px",
  color: T.w1,
};

/** Ambient amber glow — fixed overlay at top of ATI surfaces */
export const atiGlow = {
  position: "fixed",
  top: "-200px",
  left: "50%",
  transform: "translateX(-50%)",
  width: "700px",
  height: "400px",
  background: "radial-gradient(ellipse, rgba(245,194,66,0.06), transparent 70%)",
  pointerEvents: "none",
  zIndex: 0,
};

/** ATI score → band label + colors */
export function atiBand(total) {
  if (total >= 96) return { label: "Strong Buy",             color: T.teal,  bg: T.tealDim,  bdr: T.tealBdr  };
  if (total >= 80) return { label: "Buy",                    color: T.teal,  bg: T.tealDim,  bdr: T.tealBdr  };
  if (total >= 60) return { label: "Review — Due Diligence", color: T.amber, bg: T.amberDim, bdr: T.amberBdr };
  return               { label: "Caution — Investigate",     color: T.red,   bg: T.redDim,   bdr: T.redBdr   };
}

/** Per-dimension color by score (0–15) */
export function atiDimColor(score) {
  if (score >= 12) return T.teal;
  if (score >= 8)  return T.amber;
  return T.red;
}
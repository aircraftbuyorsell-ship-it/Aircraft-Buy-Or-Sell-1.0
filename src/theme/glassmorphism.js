/**
 * ABOS Marketspace — Design System v3.0
 * Theme token library for React / Base44
 *
 * Source: abos-ds-v3/tokens/*.css
 * Linear × Vercel × Raycast inspired dark system
 */

export const COLORS = {
  ink:    "#04060a",
  ink1:   "#0d1117",
  ink2:   "#111620",
  ink3:   "#1a2235",
  ink4:   "#212d45",
  amber:        "#f5c242",
  amberHover:   "#fdd05a",
  amberPressed: "rgba(245,194,66,0.85)",
  amberDim:     "rgba(245,194,66,0.09)",
  amberDim2:    "rgba(245,194,66,0.14)",
  amberBorder:  "rgba(245,194,66,0.22)",
  amberGlow:    "rgba(245,194,66,0.06)",
  amberDeep:    "#c4820a",
  teal:       "#5dcaa5",
  tealDim:    "rgba(93,202,165,0.09)",
  tealDim2:   "rgba(93,202,165,0.14)",
  tealBorder: "rgba(93,202,165,0.20)",
  red:       "#e24b4a",
  redDim:    "rgba(226,75,74,0.10)",
  redDim2:   "rgba(226,75,74,0.16)",
  redBorder: "rgba(226,75,74,0.22)",
  blue:       "#4e8ef7",
  blueDim:    "rgba(78,142,247,0.09)",
  blueBorder: "rgba(78,142,247,0.20)",
  w1: "rgba(255,255,255,0.90)",
  w2: "rgba(255,255,255,0.60)",
  w3: "rgba(255,255,255,0.35)",
  w4: "rgba(255,255,255,0.14)",
  w5: "rgba(255,255,255,0.06)",
  border:   "rgba(255,255,255,0.08)",
  borderMd: "rgba(255,255,255,0.12)",
  borderHv: "rgba(255,255,255,0.18)",
};

export function atiBand(score) {
  if (score >= 96) return { color: COLORS.teal, colorDim: COLORS.tealDim, colorBorder: COLORS.tealBorder, label: "Strong Buy", borderLeft: `3px solid ${COLORS.teal}` };
  if (score >= 80) return { color: COLORS.teal, colorDim: COLORS.tealDim, colorBorder: COLORS.tealBorder, label: "Buy", borderLeft: "3px solid rgba(93,202,165,0.55)" };
  if (score >= 60) return { color: COLORS.amber, colorDim: COLORS.amberDim, colorBorder: COLORS.amberBorder, label: "Review", borderLeft: `3px solid ${COLORS.amber}` };
  return { color: COLORS.red, colorDim: COLORS.redDim, colorBorder: COLORS.redBorder, label: "Caution", borderLeft: `3px solid ${COLORS.red}` };
}

export function atiArc(score, max = 120) {
  const CIRC = 238.76;
  const arc  = Math.max(0, Math.min((score / max) * CIRC, CIRC - 1));
  return `${arc.toFixed(1)} ${(CIRC - arc).toFixed(1)}`;
}

export const TIER_META = {
  free_explorer: { label: "Free Explorer", color: COLORS.w3,    bg: COLORS.w5,       border: COLORS.border      },
  starter:       { label: "Starter",       color: COLORS.amber, bg: COLORS.amberDim, border: COLORS.amberBorder },
  pro:           { label: "Pro",           color: COLORS.teal,  bg: COLORS.tealDim,  border: COLORS.tealBorder  },
  enterprise:    { label: "Enterprise",    color: COLORS.blue,  bg: COLORS.blueDim,  border: COLORS.blueBorder  },
  demo:          { label: "DEMO",          color: "#a855f7",    bg: "rgba(168,85,247,0.09)", border: "rgba(168,85,247,0.22)" },
};

export const FONT = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  mono: "'Courier New', 'Menlo', 'Monaco', monospace",
};

export const h1 = () => ({ fontFamily: FONT.sans, fontSize: "clamp(28px,4vw,42px)", fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.06, color: COLORS.w1, margin: 0 });
export const h2 = () => ({ fontFamily: FONT.sans, fontSize: "22px", fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.1, color: COLORS.w1, margin: 0 });
export const h3 = () => ({ fontFamily: FONT.sans, fontSize: "15px", fontWeight: 600, letterSpacing: "-0.03em", color: COLORS.w1, margin: 0 });
export const bodyText = () => ({ fontFamily: FONT.sans, fontSize: "13px", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: 1.55, color: COLORS.w2 });
export const eyebrow = (color = COLORS.w3) => ({ fontFamily: FONT.sans, fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color });
export const mono = (color = COLORS.w2) => ({ fontFamily: FONT.mono, fontSize: "13px", letterSpacing: "0.06em", color });
export const statNum = (color = COLORS.w1) => ({ fontFamily: FONT.sans, fontSize: "24px", fontWeight: 600, letterSpacing: "-0.03em", color });
export const textMuted = () => ({ color: COLORS.w3, fontSize: "12px" });

export const card = (options = {}) => ({
  background:   options.elevated ? COLORS.ink2 : COLORS.ink1,
  border:       `0.5px solid ${options.borderColor || COLORS.border}`,
  borderRadius: "12px",
  overflow:     "hidden",
  boxShadow:    options.shadow || "0 1px 3px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.06)",
});
export const cardBody = (size = "md") => ({ padding: size === "sm" ? "16px 18px" : size === "lg" ? "28px 24px" : "20px 22px" });
export const accentLine = (color = COLORS.amber) => ({ height: "2px", background: color, flexShrink: 0 });
export const cardNested = () => ({ background: COLORS.ink3, border: `0.5px solid ${COLORS.border}`, borderRadius: "8px", padding: "14px 16px" });

export const btnPrimary = () => ({ display: "inline-flex", alignItems: "center", gap: "6px", background: COLORS.amber, color: COLORS.ink, padding: "10px 20px", borderRadius: "8px", border: "none", fontFamily: FONT.sans, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 150ms ease-out", letterSpacing: "-0.01em" });
export const btnGhost = () => ({ display: "inline-flex", alignItems: "center", gap: "6px", background: "transparent", color: COLORS.w2, padding: "10px 20px", borderRadius: "8px", border: `0.5px solid ${COLORS.border}`, fontFamily: FONT.sans, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "background 150ms ease-out, border-color 150ms ease-out", letterSpacing: "-0.01em" });
export const btnTeal = () => ({ display: "inline-flex", alignItems: "center", gap: "6px", background: COLORS.tealDim, color: COLORS.teal, padding: "10px 20px", borderRadius: "8px", border: `0.5px solid ${COLORS.tealBorder}`, fontFamily: FONT.sans, fontSize: "13px", fontWeight: 600, cursor: "pointer" });
export const btnRed  = () => ({ display: "inline-flex", alignItems: "center", gap: "6px", background: COLORS.redDim,  color: COLORS.red,  padding: "10px 20px", borderRadius: "8px", border: `0.5px solid ${COLORS.redBorder}`,  fontFamily: FONT.sans, fontSize: "13px", fontWeight: 600, cursor: "pointer" });
export const btnSm   = (base) => ({ ...(base || btnPrimary()), padding: "7px 14px", fontSize: "11px" });

const chipBase = { display: "inline-block", padding: "2px 10px", borderRadius: "9999px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", border: "0.5px solid", lineHeight: 1.6, whiteSpace: "nowrap" };
export const chip = {
  teal:  { ...chipBase, background: COLORS.tealDim,  color: COLORS.teal,  borderColor: COLORS.tealBorder  },
  amber: { ...chipBase, background: COLORS.amberDim, color: COLORS.amber, borderColor: COLORS.amberBorder },
  red:   { ...chipBase, background: COLORS.redDim,   color: COLORS.red,   borderColor: COLORS.redBorder   },
  blue:  { ...chipBase, background: COLORS.blueDim,  color: COLORS.blue,  borderColor: COLORS.blueBorder  },
  gray:  { ...chipBase, background: COLORS.w5,       color: COLORS.w3,    borderColor: COLORS.border      },
};
export function tierChip(tier) {
  switch (tier) {
    case "starter":    return chip.amber;
    case "pro":        return chip.teal;
    case "enterprise": return chip.blue;
    case "demo":       return { ...chipBase, background: "rgba(168,85,247,0.09)", color: "#a855f7", borderColor: "rgba(168,85,247,0.22)" };
    default:           return chip.gray;
  }
}
export function atiChip(score) {
  if (score >= 80) return chip.teal;
  if (score >= 60) return chip.amber;
  return chip.red;
}

export const input = () => ({ padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: `0.5px solid ${COLORS.border}`, borderRadius: "8px", color: COLORS.w1, fontFamily: FONT.sans, fontSize: "13px", letterSpacing: "-0.01em", outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 150ms ease-out, background 150ms ease-out" });
export const inputFocus = () => ({ borderColor: COLORS.amberBorder, background: "rgba(245,194,66,0.03)" });
export const inputError = () => ({ borderColor: COLORS.redBorder,   background: COLORS.redDim });

export const pageBackground = () => ({
  background: COLORS.ink,
  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.09) 1.5px, transparent 1.5px)",
  backgroundSize: "40px 40px",
  minHeight: "100vh",
  fontFamily: FONT.sans,
  color: COLORS.w1,
  position: "relative",
});

export const sectionHeader = () => ({ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "28px", paddingBottom: "14px", borderBottom: `0.5px solid ${COLORS.border}` });
export const sectionTag = () => ({ fontSize: "10px", color: COLORS.amber, fontWeight: 700, letterSpacing: "0.06em", background: COLORS.amberDim, border: `0.5px solid ${COLORS.amberBorder}`, padding: "2px 8px", borderRadius: "9999px" });

export function listingRow(score, locked = false) {
  const base = { display: "flex", alignItems: "center", gap: "20px", padding: "14px 14px 14px 18px", borderBottom: `0.5px solid ${COLORS.border}`, position: "relative" };
  if (locked) return { ...base, borderLeft: `3px solid ${COLORS.border}`, opacity: 0.65 };
  return { ...base, borderLeft: atiBand(score).borderLeft };
}

export const divider = () => ({ borderTop: `0.5px solid ${COLORS.border}`, margin: "20px 0" });

export const MOTION = {
  sm: "150ms", md: "250ms", lg: "350ms", xl: "500ms",
  easeUI:  "cubic-bezier(0.16, 1, 0.3, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  surface: "background 150ms ease-out, border-color 150ms ease-out, box-shadow 250ms ease-out",
  all:     "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
};

// Backward-compat shims
export const glassBase      = () => card();
export const glassCard      = () => card({ elevated: true });
export const glassStrong    = () => card();
export const glassInput     = () => input();
export const tierBadgeStyle = tierChip;

export default {
  COLORS, TIER_META, FONT, MOTION,
  atiBand, atiArc, atiChip, tierChip,
  card, cardBody, accentLine, cardNested,
  btnPrimary, btnGhost, btnTeal, btnRed, btnSm,
  chip, input, inputFocus, inputError,
  h1, h2, h3, bodyText, eyebrow, mono, statNum, textMuted,
  pageBackground, sectionHeader, sectionTag, listingRow, divider,
  glassBase, glassCard, glassStrong, glassInput, tierBadgeStyle,
};
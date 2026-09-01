/**
 * GlassCard — ABOS DS v3 Card Component
 * Solid ink-1 background, 2px accent line, 0.5px border, hover lift
 */
import { useState } from "react";

const INK = { normal: "rgba(255,255,255,0.04)", elevated: "rgba(255,255,255,0.04)", nested: "rgba(255,255,255,0.04)" };
const SHADOWS = {
  normal:   "0 1px 3px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.06)",
  elevated: "0 4px 16px rgba(0,0,0,0.5),  0 0 0 0.5px rgba(255,255,255,0.08)",
  hover:    "0 6px 24px rgba(0,0,0,0.60), 0 0 0 0.5px rgba(255,255,255,0.10)",
};
const PAD = { sm: "16px 18px", md: "20px 22px", lg: "28px 24px" };

export default function GlassCard({
  accent    = "#f5c242",
  elevated  = false,
  nested    = false,
  padding   = "md",
  shadow,
  style     = {},
  className,
  onClick,
  glow,
  header,
  footer,
  noBorder  = false,
  children,
}) {
  const [hovered, setHovered] = useState(false);
  const bg = nested ? INK.nested : elevated ? INK.elevated : INK.normal;
  const sh = shadow || (hovered && onClick ? SHADOWS.hover : elevated ? SHADOWS.elevated : SHADOWS.normal);
  const borderColor = hovered && glow ? glow + "40" : "rgba(255,255,255,0.08)";

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bg, border: `0.5px solid ${borderColor}`, borderRadius: "12px",
        overflow: "hidden", boxShadow: sh,
        cursor: onClick ? "pointer" : "default",
        transform: hovered && onClick ? "translateY(-2px)" : "none",
        transition: "transform 250ms cubic-bezier(0.16,1,0.3,1), box-shadow 250ms ease-out, border-color 150ms ease-out",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        display: "flex", flexDirection: "column", ...style,
      }}
    >
      {header && <div style={{ padding: PAD.sm, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>{header}</div>}
      {!noBorder && accent && <div style={{ height: "2px", background: accent, flexShrink: 0 }} />}
      <div style={{ padding: PAD[padding] || PAD.md, flex: 1 }}>{children}</div>
      {footer && <div style={{ padding: PAD.sm, borderTop: "0.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>{footer}</div>}
    </div>
  );
}

export function CardTable({ children, title, tag, style = {} }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(255,255,255,0.06)", fontFamily: "-apple-system, sans-serif", ...style }}>
      <div style={{ height: "2px", background: "linear-gradient(90deg, transparent 5%, rgba(245,194,66,0.40) 50%, transparent 95%)" }} />
      {(title || tag) && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          {title && <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.90)" }}>{title}</span>}
          {tag   && <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f5c242", background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)", padding: "2px 8px", borderRadius: "9999px" }}>{tag}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
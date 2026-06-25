import { Badge } from "@/components/ui/badge";

/**
 * CoreBadge — Privacy Policy / Legal Ink chip style.
 * Uppercase, 9px, 700 weight, 0.08em tracking, pill shape, tinted bg + border.
 * variant: "gold" | "blue" | "teal" | "neutral" | "success" | "danger"
 */
const PP = {
  amber: "#f5c242", amberDim: "rgba(245,194,66,0.09)", amberBorder: "rgba(245,194,66,0.22)",
  teal: "#5dcaa5", tealDim: "rgba(93,202,165,0.09)", tealBorder: "rgba(93,202,165,0.20)",
  red: "#e24b4a", redDim: "rgba(226,75,74,0.10)", redBorder: "rgba(226,75,74,0.22)",
  blue: "#4e8ef7", blueDim: "rgba(78,142,247,0.09)", blueBorder: "rgba(78,142,247,0.20)",
  w3: "rgba(255,255,255,0.35)", w5: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
};

const VARIANTS = {
  gold:    { bg: PP.amberDim, color: PP.amber, border: PP.amberBorder },
  blue:    { bg: PP.blueDim, color: PP.blue, border: PP.blueBorder },
  teal:    { bg: PP.tealDim, color: PP.teal, border: PP.tealBorder },
  success: { bg: PP.tealDim, color: PP.teal, border: PP.tealBorder },
  danger:  { bg: PP.redDim, color: PP.red, border: PP.redBorder },
  neutral: { bg: PP.w5, color: PP.w3, border: PP.border },
};

export default function CoreBadge({ variant = "gold", className = "", style, children }) {
  const v = VARIANTS[variant] || VARIANTS.gold;
  return (
    <Badge
      variant="outline"
      className={`font-bold uppercase tracking-[0.08em] text-[9px] px-2.5 leading-relaxed rounded-full ${className}`}
      style={{ background: v.bg, color: v.color, borderColor: v.border, ...style }}
    >
      {children}
    </Badge>
  );
}
import { Button } from "@/components/ui/button";

/**
 * CoreButton — Privacy Policy / Legal Ink style.
 * Transparent surfaces, amber/teal/red accents, thin borders.
 * variant: "default" (amber) | "secondary" | "outline" | "ghost" | "destructive" | "teal"
 * accent=true → amber primary
 */
const PP = {
  amber: "#f5c242", amberDim: "rgba(245,194,66,0.09)", amberBorder: "rgba(245,194,66,0.22)",
  teal: "#5dcaa5", tealDim: "rgba(93,202,165,0.09)", tealBorder: "rgba(93,202,165,0.20)",
  red: "#e24b4a", redDim: "rgba(226,75,74,0.10)", redBorder: "rgba(226,75,74,0.22)",
  ink: "#04060a",
  w1: "rgba(255,255,255,0.90)", w2: "rgba(255,255,255,0.60)",
  border: "rgba(255,255,255,0.08)",
};

const VARIANTS = {
  default:     { background: PP.amber, color: PP.ink, border: "none" },
  secondary:   { background: "rgba(255,255,255,0.04)", color: PP.w1, border: `0.5px solid ${PP.border}` },
  outline:     { background: "transparent", color: PP.w1, border: `0.5px solid ${PP.border}` },
  ghost:       { background: "transparent", color: PP.w2, border: "none" },
  destructive: { background: PP.redDim, color: PP.red, border: `0.5px solid ${PP.redBorder}` },
  teal:        { background: PP.tealDim, color: PP.teal, border: `0.5px solid ${PP.tealBorder}` },
};

export default function CoreButton({
  accent = false,
  variant = "default",
  className = "",
  style,
  children,
  ...props
}) {
  const v = accent ? "default" : variant;
  return (
    <Button
      variant="ghost"
      className={`rounded-lg font-semibold text-[13px] tracking-[-0.01em] transition-opacity hover:opacity-90 ${className}`}
      style={{ ...VARIANTS[v] || VARIANTS.default, ...style }}
      {...props}
    >
      {children}
    </Button>
  );
}
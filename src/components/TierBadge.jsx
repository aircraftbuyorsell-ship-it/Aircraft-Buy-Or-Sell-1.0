/**
 * TierBadge — ABOS DS v3 tier chip
 * free_explorer=gray, starter=amber, pro=teal, enterprise=blue, demo=purple
 */
import { Lock, Zap, Building2, Globe, Sparkles } from "lucide-react";

const TIERS = {
  free_explorer: { label: "Free Explorer", color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.08)", icon: Globe },
  starter:       { label: "Starter",       color: "#f5c242", bg: "rgba(245,194,66,0.09)",   border: "rgba(245,194,66,0.22)",   icon: Zap       },
  pro:           { label: "Pro",           color: "#5dcaa5", bg: "rgba(93,202,165,0.09)",   border: "rgba(93,202,165,0.20)",   icon: Sparkles  },
  enterprise:    { label: "Enterprise",    color: "#4e8ef7", bg: "rgba(78,142,247,0.09)",   border: "rgba(78,142,247,0.20)",   icon: Building2 },
  demo:          { label: "DEMO",          color: "#a855f7", bg: "rgba(168,85,247,0.09)",   border: "rgba(168,85,247,0.22)",   icon: Zap       },
  locked:        { label: "Premium",       color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.08)", icon: Lock },
};

export default function TierBadge({ tier = "free_explorer", locked = false, size = "sm" }) {
  const key  = locked ? "locked" : (tier || "free_explorer");
  const meta = TIERS[key] || TIERS.free_explorer;
  const Icon = meta.icon;
  const md   = size === "md";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: md ? "5px" : "4px", background: meta.bg, border: `0.5px solid ${meta.border}`, borderRadius: "9999px", color: meta.color, fontSize: md ? "10px" : "9px", fontWeight: 700, padding: md ? "3px 12px" : "2px 10px", letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.6, whiteSpace: "nowrap" }}>
      <Icon size={md ? 10 : 9} />
      {meta.label}
    </span>
  );
}

export function TierRow({ tiers = [], label = "Available for" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
      {label && <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginRight: "2px" }}>{label}:</span>}
      {tiers.map(t => <TierBadge key={t} tier={t} />)}
    </div>
  );
}

export function LockOverlay({ tier = "pro", children, style = {} }) {
  return (
    <div style={{ position: "relative", ...style }}>
      <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.5 }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", background: "rgba(4,6,10,0.60)", backdropFilter: "blur(2px)", borderRadius: "8px" }}>
        <Lock size={18} color="rgba(255,255,255,0.35)" />
        <TierBadge tier={tier} />
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.40)" }}>Upgrade to unlock</span>
      </div>
    </div>
  );
}
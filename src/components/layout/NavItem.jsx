import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";

export default function NavItem({ to, icon: Icon, label, active, onClick }) {
  const isDark = useTheme();

  const base = {
    display: "flex", alignItems: "center", gap: "8px",
    fontSize: "13px", padding: "12px 16px", borderRadius: "8px", minHeight: 44,
    cursor: "pointer", textDecoration: "none", transition: "background 150ms ease-out, color 150ms ease-out",
    marginBottom: "2px",
  };
  const activeStyle = {
    ...base,
    background: "rgba(245,194,66,0.09)", color: "#f5c242", fontWeight: 600,
    borderLeft: "2px solid #f5c242", paddingLeft: "14px",
  };
  const idleColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
  const hoverBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const hoverColor = isDark ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.80)";
  const idleStyle = { ...base, color: idleColor, fontWeight: 500, borderLeft: "2px solid transparent", paddingLeft: "14px" };

  return (
    <Link
      to={to}
      onClick={onClick}
      style={active ? activeStyle : idleStyle}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = hoverColor; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = idleColor; } }}
    >
      <Icon size={14} style={{ color: active ? "#f5c242" : "currentColor", flexShrink: 0 }} />
      <span>{label}</span>
    </Link>
  );
}
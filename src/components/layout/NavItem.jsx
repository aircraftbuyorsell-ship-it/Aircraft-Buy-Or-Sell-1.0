import { Link } from "react-router-dom";

export default function NavItem({ to, icon: Icon, label, active, onClick }) {
  const base = {
    display: "flex", alignItems: "center", gap: "8px",
    fontSize: "13px", padding: "12px 16px", borderRadius: "8px", minHeight: 44,
    cursor: "pointer", textDecoration: "none", transition: "background 150ms ease-out, color 150ms ease-out",
    marginBottom: "2px",
  };
  const activeStyle = {
    ...base,
    background: "rgba(212,160,23,0.09)", color: "#D4A017", fontWeight: 600,
    borderLeft: "2px solid #D4A017", paddingLeft: "14px",
  };
  const idleColor = "rgba(255,255,255,0.55)";
  const hoverBg = "rgba(255,255,255,0.04)";
  const hoverColor = "rgba(255,255,255,0.80)";
  const idleStyle = { ...base, color: idleColor, fontWeight: 500, borderLeft: "2px solid transparent", paddingLeft: "14px" };

  return (
    <Link
      to={to}
      onClick={onClick}
      style={active ? activeStyle : idleStyle}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = hoverColor; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = idleColor; } }}
    >
      <Icon size={14} style={{ color: active ? "#D4A017" : "currentColor", flexShrink: 0 }} />
      <span>{label}</span>
    </Link>
  );
}
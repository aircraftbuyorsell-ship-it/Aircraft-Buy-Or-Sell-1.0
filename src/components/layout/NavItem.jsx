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
    background: "rgba(245,194,66,0.09)", color: "#f5c242", fontWeight: 600,
    borderLeft: "2px solid #f5c242", paddingLeft: "14px",
  };
  const idleStyle = { ...base, color: "rgba(255,255,255,0.55)", fontWeight: 500, borderLeft: "2px solid transparent", paddingLeft: "14px" };

  return (
    <Link
      to={to}
      onClick={onClick}
      style={active ? activeStyle : idleStyle}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "#1a2235"; e.currentTarget.style.color = "rgba(255,255,255,0.80)"; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; } }}
    >
      <Icon size={14} style={{ color: active ? "#f5c242" : "currentColor", flexShrink: 0 }} />
      <span>{label}</span>
    </Link>
  );
}
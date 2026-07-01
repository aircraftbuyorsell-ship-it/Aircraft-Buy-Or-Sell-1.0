import { Link } from "react-router-dom";

export default function SidebarLogo() {
  return (
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none" }}>
      <div style={{ width: "3px", height: "22px", borderRadius: "2px", background: "linear-gradient(180deg, #ffffff 0%, #f5c242 100%)", flexShrink: 0 }} />
      <div style={{ lineHeight: 1 }}>
        <span style={{ display: "block", fontSize: "18px", fontWeight: 600, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.90)", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif" }}>
          ABOS
        </span>
        <span style={{ display: "block", marginTop: "2px", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
          Marketspace
        </span>
      </div>
    </Link>);

}
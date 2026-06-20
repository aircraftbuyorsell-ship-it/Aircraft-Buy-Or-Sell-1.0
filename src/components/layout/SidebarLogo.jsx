import { Link } from "react-router-dom";

export default function SidebarLogo() {
  return (
    <Link to="/" style={{ display: "block", textDecoration: "none" }}>
      <svg width="88" height="24" viewBox="0 0 172 40" style={{ display: "block" }}>
        <polyline points="2,36 26,8 34,36" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="34,36 42,18 50,28 60,6 68,30 74,22" fill="none" stroke="#f5c242" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="72,17 81,21.5 72,26" fill="#f5c242" />
        <text x="90" y="28" fill="rgba(255,255,255,0.90)" fontSize="18" fontWeight="500" letterSpacing="-0.03em" fontFamily="-apple-system,sans-serif">ABOS</text>
      </svg>
      <p style={{ margin: "6px 0 0", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
        Marketspace
      </p>
    </Link>
  );
}
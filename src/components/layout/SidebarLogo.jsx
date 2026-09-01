import { Link, useLocation } from "react-router-dom";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";

export default function SidebarLogo({ compact = false }) {
  const { pathname } = useLocation();
  const currentSection = NAV_TREE.find((section) => isPathInSection(section, pathname))?.label || "Dashboard";

  if (compact) {
    return (
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <svg width="28" height="28" viewBox="0 0 40 40" style={{ display: "block", flexShrink: 0 }}>
          <rect width="40" height="40" rx="10" fill="rgba(212,160,23,0.10)" stroke="rgba(212,160,23,0.30)" />
          <polyline points="6,30 14,12 18,30" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="18,30 22,18 26,24 32,8" fill="none" stroke="#f5c242" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="31,7 35,10 31,13" fill="#f5c242" />
        </svg>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", fontFamily: "Inter, sans-serif" }}>
          ABOS<span style={{ fontSize: 8, fontWeight: 600, verticalAlign: "super", color: "rgba(255,255,255,0.55)", marginLeft: 1 }}>™</span>
        </span>
      </Link>
    );
  }

  return (
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
      {/* Dominant mark */}
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ display: "block", flexShrink: 0 }}>
        <defs>
          <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(212,160,23,0.18)" />
            <stop offset="100%" stopColor="rgba(212,160,23,0.04)" />
          </linearGradient>
        </defs>
        <rect width="44" height="44" rx="12" fill="url(#logo-bg)" stroke="rgba(212,160,23,0.35)" strokeWidth="1" />
        {/* Chart line — white */}
        <polyline points="7,33 15,14 19,33" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Chart line — gold */}
        <polyline points="19,33 24,20 28,26 36,9" fill="none" stroke="#f5c242" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Arrow head */}
        <polygon points="35,8 39,11 35,14" fill="#f5c242" />
      </svg>
      {/* Wordmark */}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{
          fontSize: 22,
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "-0.03em",
          fontFamily: "Inter, -apple-system, sans-serif",
        }}>
          ABOS<span style={{ fontSize: 10, fontWeight: 600, verticalAlign: "super", color: "rgba(255,255,255,0.55)", marginLeft: 1 }}>™</span>
        </span>
        <span style={{
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(212,160,23,0.70)",
          fontWeight: 700,
          marginTop: 3,
        }}>
          {currentSection}{currentSection === "Marketspace" && <span style={{ fontSize: 7, verticalAlign: "super", marginLeft: 1 }}>™</span>}
        </span>
      </div>
    </Link>
  );
}
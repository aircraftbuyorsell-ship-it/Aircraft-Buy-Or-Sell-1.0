import { Link, useLocation } from "react-router-dom";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";

const BRAND_LOGO_URL = "https://media.base44.com/images/public/workspaces/6998b56ab3d79ca33dfcf1d0/brands/e2c3611ed_brand_upload_logo.jpg";

export default function SidebarLogo({ compact = false }) {
  const { pathname } = useLocation();
  const currentSection = NAV_TREE.find((section) => isPathInSection(section, pathname))?.label || "Dashboard";

  if (compact) {
    return (
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <img
          src={BRAND_LOGO_URL}
          alt="ABOS Logo"
          width={28}
          height={28}
          style={{ display: "block", flexShrink: 0, borderRadius: 6, objectFit: "cover" }}
        />
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", fontFamily: "var(--brand-font-heading)" }}>
          ABOS
        </span>
      </Link>
    );
  }

  return (
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
      <img
        src={BRAND_LOGO_URL}
        alt="ABOS Logo"
        width={44}
        height={44}
        style={{ display: "block", flexShrink: 0, borderRadius: 10, objectFit: "cover", border: "1px solid rgba(212,160,23,0.3)" }}
      />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "-0.03em",
          fontFamily: "var(--brand-font-heading)",
        }}>
          ABOS
        </span>
        <span style={{
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(212,160,23,0.70)",
          fontWeight: 700,
          marginTop: 3,
          fontFamily: "Inter, sans-serif",
        }}>
          {currentSection}
        </span>
      </div>
    </Link>
  );
}
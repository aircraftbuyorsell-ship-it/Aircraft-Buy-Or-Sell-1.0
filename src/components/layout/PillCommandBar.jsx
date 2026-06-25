import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const SECTIONS = [
  { label: "Home", path: "/" },
  {
    label: "Marketplace",
    items: [
      { path: "/listings", label: "Aircraft Listings" },
      { path: "/compare", label: "Compare Aircraft" },
      { path: "/deal-radar", label: "Deal Radar" },
      { path: "/escrow", label: "Escrow" },
      { path: "/pre-buy-inspection", label: "Pre-buy Inspection" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { path: "/analytics", label: "Analytics" },
      { path: "/market-reports", label: "Market Reports" },
      { path: "/traffic", label: "Traffic Maps" },
      { path: "/faa-map", label: "FAA Registry" },
    ],
  },
  {
    label: "ATI",
    items: [
      { path: "/ati-quick-score", label: "Quick Score" },
      { path: "/ati-standard", label: "Standard" },
      { path: "/ati-full-report", label: "Full Report" },
      { path: "/ati-verify", label: "Verification" },
      { path: "/ati-passport", label: "Passport" },
    ],
  },
  {
    label: "Tools",
    items: [
      { path: "/opex-calculator", label: "OPEX Calculator" },
      { path: "/valuation", label: "Valuation" },
    ],
  },
  {
    label: "Community",
    items: [
      { path: "/community", label: "ABOS Community" },
      { path: "/weekly-briefing", label: "Weekly Briefings" },
      { path: "/feature-requests", label: "Feature Requests" },
    ],
  },
  { label: "Developers", path: "/developers" },
  {
    label: "Account",
    items: [
      { path: "/my-account", label: "Profile & Settings" },
      { path: "/pricing", label: "Credits & Benefits" },
    ],
  },
  {
    label: "Admin",
    items: [
      { path: "/admin/settings", label: "Admin Settings" },
      { path: "/admin/listings", label: "Admin Listings" },
    ],
  },
];

export default function PillCommandBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState(null);
  const barRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpenSection(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleNav = (path) => {
    setOpenSection(null);
    navigate(path);
  };

  const isSectionActive = (section) => {
    if (section.path) return pathname === section.path;
    return section.items?.some(
      (i) => pathname === i.path || pathname.startsWith(i.path + "/")
    );
  };

  return (
    <div ref={barRef} className="hidden lg:flex items-center gap-1" style={{ height: 48 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          height: 48,
          padding: 4,
          background: "#111827",
          border: "1px solid rgba(212,160,23,0.28)",
          borderRadius: 999,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}
        className="mx-auto"
      >
        {SECTIONS.map((section) => {
          const active = isSectionActive(section);
          const open = openSection === section.label;
          const hasDropdown = !!section.items;

          if (!hasDropdown) {
            return (
              <button
                key={section.label}
                onClick={() => handleNav(section.path)}
                style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#0B1220" : "rgba(255,255,255,0.65)",
                  background: active ? "#D4A017" : "transparent",
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 16px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 150ms ease, background 150ms ease",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
              >
                {section.label}
              </button>
            );
          }

          return (
            <div key={section.label} style={{ position: "relative" }}>
              <button
                onClick={() => setOpenSection(open ? null : section.label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: open ? "#fff" : active ? "#0B1220" : "rgba(255,255,255,0.65)",
                  background: active && !open ? "#D4A017" : "transparent",
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 16px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 150ms ease, background 150ms ease",
                }}
                onMouseEnter={(e) => { if (!active && !open) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { if (!active && !open) e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
              >
                {section.label}
                <ChevronDown size={14} style={{ transition: "transform 150ms ease", transform: open ? "rotate(180deg)" : "none" }} />
              </button>

              {open && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: 0,
                    minWidth: 220,
                    background: "#111827",
                    border: "1px solid rgba(212,160,23,0.15)",
                    borderRadius: 12,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    padding: 6,
                    zIndex: 100,
                  }}
                >
                  {section.items.map((item) => {
                    const itemActive = pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          fontSize: 13,
                          fontWeight: itemActive ? 600 : 500,
                          color: itemActive ? "#D4A017" : "rgba(255,255,255,0.75)",
                          background: "transparent",
                          border: "none",
                          borderRadius: 8,
                          padding: "10px 16px",
                          cursor: "pointer",
                          transition: "background 150ms ease, color 150ms ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(212,160,23,0.07)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = itemActive ? "#D4A017" : "rgba(255,255,255,0.75)";
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
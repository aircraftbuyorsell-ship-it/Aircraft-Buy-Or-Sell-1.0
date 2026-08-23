import { useLocation, useNavigate } from "react-router-dom";
import { NAV_TREE, isPathInSection, navGradientWeight } from "@/components/layout/navConfig";
import { useTheme } from "@/lib/useTheme";

/** Flat text nav bar — all sections are direct links to the 4 hubs + Home + Pricing. */
export default function PillCommandBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDark = useTheme();

  const idleColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.60)";
  const hoverColor = isDark ? "#fff" : "#000";

  const handleNav = (path) => navigate(path);

  return (
    <div className="hidden lg:flex items-center gap-6" style={{ height: 48 }}>
      {NAV_TREE.map((section, idx) => {
        const active = isPathInSection(section, pathname);
        const w = navGradientWeight(idx);
        const fontSize = 12 + w * 4;
        const idleOpacity = 0.45 + w * 0.40;
        const fontWeight = active ? 800 : 400 + Math.round(w * 200);

        return (
          <div key={section.label} style={{ position: "relative" }}>
            <button
              onClick={() => handleNav(section.path)}
              style={{
                fontSize,
                fontWeight: active ? 800 : fontWeight,
                color: active ? "#D4A017" : `rgba(${isDark ? "255,255,255" : "0,0,0"},${idleOpacity})`,
                background: "transparent",
                border: "none",
                padding: "8px 2px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
                textShadow: w > 0.6 ? `0 0 ${w * 12}px rgba(212,160,23,${w * 0.15})` : "none",
                transition: "color 150ms ease, text-shadow 150ms ease",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = hoverColor; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = `rgba(${isDark ? "255,255,255" : "0,0,0"},${idleOpacity})`; }}
            >
              {section.label}
            </button>
            {active && (
              <div style={{
                position: "absolute", bottom: 2, left: 2, right: 2, height: 2,
                background: "#D4A017", borderRadius: 1,
                boxShadow: "0 0 8px rgba(212,160,23,0.5)",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
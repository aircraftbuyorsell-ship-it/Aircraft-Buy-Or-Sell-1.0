import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { NAV_TREE, isPathInSection, navGradientWeight } from "@/components/layout/navConfig";
import GuidedDropdown from "@/components/layout/GuidedDropdown";
import { useTheme } from "@/lib/useTheme";

/** Flat text nav bar — all sections are direct links to the 4 hubs + Home + Pricing. */
export default function PillCommandBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDark = useTheme();
  const [open, setOpen] = useState(null);
  const [usage, setUsage] = useState(() => {
    try { return JSON.parse(localStorage.getItem("abos-nav-usage") || "{}"); } catch { return {}; }
  });
  const navRef = useRef(null);

  useEffect(() => {
    const close = (event) => { if (!navRef.current?.contains(event.target)) setOpen(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => setOpen(null), [pathname]);

  const idleColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.60)";
  const hoverColor = isDark ? "#fff" : "#000";

  const handleNav = (path) => {
    navigate(path);
    setOpen(null);
    setUsage((prev) => {
      const next = { ...prev, [path]: (prev[path] || 0) + 1 };
      try { localStorage.setItem("abos-nav-usage", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <div ref={navRef} className="hidden lg:flex items-center gap-6" style={{ height: 48 }}>
      {NAV_TREE.map((section, idx) => {
        const active = isPathInSection(section, pathname);
        const w = navGradientWeight(idx);
        const fontSize = 12 + w * 4;
        const idleOpacity = 0.45 + w * 0.40;
        const fontWeight = active ? 800 : 400 + Math.round(w * 200);

        return (
          <div key={section.label} style={{ position: "relative" }}>
            <button
              aria-expanded={Boolean(section.categories && open === section.label)}
              onClick={() => section.categories ? setOpen(open === section.label ? null : section.label) : handleNav(section.path)}
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
            {section.categories && open === section.label && (
              <div
                className="absolute left-1/2 top-[calc(100%+10px)] z-50 -translate-x-1/2 rounded-2xl border p-4 shadow-2xl"
                style={{
                  background: isDark ? "rgba(7,10,16,0.98)" : "rgba(255,255,255,0.98)",
                  borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)",
                  backdropFilter: "blur(18px)",
                }}
              >
                <GuidedDropdown section={section} usage={usage} onNavigate={handleNav} />
              </div>
            )}
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
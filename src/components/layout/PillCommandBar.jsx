import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";
import GuidedDropdown from "@/components/layout/GuidedDropdown";
import { useTheme } from "@/lib/useTheme";

// Flat text nav (homepage style) + card-grid dropdown (chip style)
export default function PillCommandBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDark = useTheme();
  const [openSection, setOpenSection] = useState(null);
  const [usage, setUsage] = useState(() => {
    const counts = {};
    NAV_TREE.flatMap((section) => section.categories?.flatMap((category) => category.items) || []).forEach((item) => {
      counts[item.path] = Number(localStorage.getItem(`abos-nav-use:${item.path}`) || 0);
    });
    return counts;
  });
  const barRef = useRef(null);

  const idleColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.60)";
  const hoverColor = isDark ? "#fff" : "#000";
  const dropdownBg = isDark
    ? "linear-gradient(180deg, rgba(28,28,38,0.97) 0%, rgba(16,16,24,0.97) 100%)"
    : "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,246,241,0.97) 100%)";
  const dropdownBorder = isDark ? "rgba(212,160,23,0.18)" : "rgba(212,160,23,0.25)";
  const dropdownShadow = isDark ? "0 12px 40px rgba(0,0,0,0.7)" : "0 12px 40px rgba(0,0,0,0.15)";

  useEffect(() => {
    const onClick = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpenSection(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleNav = (path) => {
    const nextCount = (usage[path] || 0) + 1;
    localStorage.setItem(`abos-nav-use:${path}`, String(nextCount));
    setUsage((current) => ({ ...current, [path]: nextCount }));
    setOpenSection(null);
    navigate(path);
  };

  return (
    <div ref={barRef} className="hidden lg:flex items-center gap-8" style={{ height: 48 }}>
      {NAV_TREE.map((section) => {
        const active = isPathInSection(section, pathname);
        const open = openSection === section.label;

        if (section.direct) {
          return (
            <div key={section.label} style={{ position: "relative" }}>
              <button
                onClick={() => handleNav(section.path)}
                style={{
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#D4A017" : idleColor,
                  background: "transparent",
                  border: "none",
                  padding: "8px 2px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.01em",
                  transition: "color 150ms ease",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = hoverColor; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = idleColor; }}
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
        }

        return (
          <div key={section.label} style={{ position: "relative" }}>
            <button
              onClick={() => setOpenSection(open ? null : section.label)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 13,
                fontWeight: active || open ? 700 : 500,
                color: open ? "#D4A017" : active ? "#D4A017" : idleColor,
                background: "transparent",
                border: "none",
                padding: "8px 2px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e) => { if (!active && !open) e.currentTarget.style.color = hoverColor; }}
              onMouseLeave={(e) => { if (!active && !open) e.currentTarget.style.color = idleColor; }}
            >
              {section.label}
              <ChevronDown size={13} style={{ transition: "transform 150ms ease", transform: open ? "rotate(180deg)" : "none", opacity: 0.7 }} />
            </button>
            {(active || open) && (
              <div style={{
                position: "absolute", bottom: 2, left: 2, right: 16, height: 2,
                background: "#D4A017", borderRadius: 1,
                boxShadow: "0 0 8px rgba(212,160,23,0.5)",
              }} />
            )}

            {open && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 18,
                  background: dropdownBg,
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: `1px solid ${dropdownBorder}`,
                  borderRadius: 16,
                  boxShadow: dropdownShadow,
                  padding: 14,
                  zIndex: 100,
                  maxHeight: "72vh",
                  overflowY: "auto",
                }}
              >
                <GuidedDropdown section={section} usage={usage} onNavigate={handleNav} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
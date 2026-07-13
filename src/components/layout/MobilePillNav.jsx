import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";
import { useTheme } from "@/lib/useTheme";

export default function MobilePillNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isDark = useTheme();
  const [openSection, setOpenSection] = useState(null);
  const barRef = useRef(null);

  const idleBg = isDark ? "#1a1a1a" : "#f0ede6";
  const idleBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const idleColor = isDark ? "#a0a0a0" : "#666";
  const dropdownBg = isDark
    ? "linear-gradient(180deg, rgba(40,40,40,0.92) 0%, rgba(20,20,20,0.88) 70%, rgba(20,20,20,0.60) 100%)"
    : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,246,241,0.92) 70%, rgba(248,246,241,0.80) 100%)";
  const dropdownBorder = isDark ? "rgba(212,160,23,0.18)" : "rgba(212,160,23,0.25)";
  const itemBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
  const itemBorder = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const itemColor = isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.65)";
  const catColor = isDark ? "rgba(212,160,23,0.55)" : "rgba(212,160,23,0.65)";

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

  return (
    <div ref={barRef} className="w-full max-w-sm mx-auto" style={{ position: "relative" }}>
      {/* ── Chip row ── */}
      <div className="flex items-center justify-center gap-2 w-full">
        {NAV_TREE.map((section) => {
          const active = isPathInSection(section, pathname);
          const open = openSection === section.label;
          const Icon = section.icon;
          return (
            <button
              key={section.label}
              onClick={() => section.direct ? handleNav(section.path) : setOpenSection(open ? null : section.label)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-all"
              style={{
                height: 52,
                minWidth: 44,
                borderRadius: 14,
                padding: "6px 4px",
                background: open
                  ? "radial-gradient(circle at 50% 40%, rgba(212,160,23,0.20), rgba(26,26,26,0.95))"
                  : idleBg,
                border: open
                  ? "1px solid rgba(212,160,23,0.65)"
                  : `1px solid ${idleBorder}`,
                boxShadow: open
                  ? "0 0 16px rgba(212,160,23,0.25), inset 0 0 12px rgba(212,160,23,0.06)"
                  : "none",
                color: open ? "#D4A017" : idleColor,
                cursor: "pointer",
              }}
            >
              {Icon && <Icon size={15} style={{ opacity: open ? 1 : 0.7 }} />}
              <span style={{ fontSize: 10, fontWeight: open ? 700 : 600, letterSpacing: "0.03em" }}>
                {section.mobileLabel || section.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Dropdown card ── */}
      {openSection && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: dropdownBg,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${dropdownBorder}`,
            borderRadius: 16,
            boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.7)" : "0 12px 40px rgba(0,0,0,0.15)",
            padding: 10,
            zIndex: 100,
            maxHeight: "72vh",
            overflowY: "auto",
          }}
        >
          {NAV_TREE.find((s) => s.label === openSection)?.categories.map((cat, ci) => (
            <div key={cat.label} style={{ marginBottom: ci > 0 ? 6 : 0 }}>
              <div style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: catColor,
                padding: "6px 6px 4px",
              }}>
                {cat.label}
              </div>
              {/* 2-column grid of icon+label chips */}
              <div className="grid grid-cols-2 gap-1.5">
                {cat.items.map((item) => {
                  const itemActive = pathname === item.path || pathname.startsWith(item.path + "/");
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className="flex flex-col items-center justify-center gap-1 text-center transition-all"
                      style={{
                        borderRadius: 12,
                        padding: "10px 6px",
                        minHeight: 60,
                        background: itemActive
                          ? "rgba(74,74,62,0.80)"
                          : itemBg,
                        border: itemActive
                          ? "1px solid rgba(212,160,23,0.25)"
                          : `1px solid ${itemBorder}`,
                        color: itemActive ? "#D4A017" : itemColor,
                        cursor: "pointer",
                      }}
                    >
                      {ItemIcon && <ItemIcon size={16} style={{ opacity: 0.85 }} />}
                      <span style={{ fontSize: 10, fontWeight: itemActive ? 700 : 600, lineHeight: 1.15, maxWidth: "100%" }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
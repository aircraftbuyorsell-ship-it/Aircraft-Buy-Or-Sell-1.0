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

  const idleBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)";
  const idleBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const idleColor = isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)";
  const dropdownBg = isDark ?
  "linear-gradient(180deg, rgba(40,40,40,0.96) 0%, rgba(20,20,20,0.94) 100%)" :
  "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,246,241,0.96) 100%)";
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
    document.addEventListener("touchstart", onClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
  }, []);

  const handleNav = (path) => {
    setOpenSection(null);
    navigate(path);
  };

  return (
    <div ref={barRef} className="w-full max-w-sm mx-auto" style={{ position: "relative" }}>
      {/* ── Tab row — uniform sizes for consistent touch targets ── */}
      <div className="flex items-center justify-center gap-1 w-full">
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
                height: 46,
                minWidth: 44,
                borderRadius: 14,
                padding: "4px 2px",
                background: open ?
                isDark ? "rgba(212,160,23,0.12)" : "rgba(212,160,23,0.10)" :
                active ?
                isDark ? "rgba(212,160,23,0.08)" : "rgba(212,160,23,0.06)" :
                idleBg,
                border: open ?
                "1px solid rgba(212,160,23,0.50)" :
                active ?
                "1px solid rgba(212,160,23,0.25)" :
                `1px solid ${idleBorder}`,
                color: open || active ? "#D4A017" : idleColor,
                cursor: "pointer"
              }}>
              
              {Icon && <Icon size={17} style={{ opacity: open || active ? 1 : 0.7 }} />}
              <span style={{ fontSize: 10, fontWeight: open || active ? 700 : 500, letterSpacing: "0.02em" }} className="text-xs capitalize">
                {section.mobileLabel || section.label}
              </span>
            </button>);

        })}
      </div>

      {/* ── Dropdown card ── */}
      {openSection &&
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
          maxHeight: "68vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch"
        }}>
        
          {NAV_TREE.find((s) => s.label === openSection)?.categories.map((cat, ci) =>
        <div key={cat.label} style={{ marginBottom: ci > 0 ? 6 : 0 }}>
              <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: catColor,
            padding: "6px 6px 4px"
          }}>
                {cat.label}
              </div>
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
                    padding: "12px 6px",
                    minHeight: 64,
                    background: itemActive ?
                    isDark ? "rgba(212,160,23,0.10)" : "rgba(212,160,23,0.08)" :
                    itemBg,
                    border: itemActive ?
                    "1px solid rgba(212,160,23,0.25)" :
                    `1px solid ${itemBorder}`,
                    color: itemActive ? "#D4A017" : itemColor,
                    cursor: "pointer"
                  }}>
                  
                      {ItemIcon && <ItemIcon size={18} style={{ opacity: 0.85 }} />}
                      <span style={{ fontSize: 10.5, fontWeight: itemActive ? 700 : 600, lineHeight: 1.15, maxWidth: "100%" }}>
                        {item.label}
                      </span>
                    </button>);

            })}
              </div>
            </div>
        )}
        </div>
      }
    </div>);

}
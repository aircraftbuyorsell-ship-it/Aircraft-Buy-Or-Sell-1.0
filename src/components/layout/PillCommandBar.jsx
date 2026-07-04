import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";

// Flat text nav (homepage style) + card-grid dropdown (chip style)
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

  return (
    <div ref={barRef} className="hidden lg:flex items-center gap-8" style={{ height: 48 }}>
      {NAV_TREE.map((section) => {
        const active = isPathInSection(section, pathname);
        const open = openSection === section.label;

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
                color: open ? "#D4A017" : active ? "#D4A017" : "rgba(255,255,255,0.65)",
                background: "transparent",
                border: "none",
                padding: "8px 2px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e) => { if (!active && !open) e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { if (!active && !open) e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
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
                  background: "linear-gradient(180deg, rgba(28,28,38,0.97) 0%, rgba(16,16,24,0.97) 100%)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(212,160,23,0.18)",
                  borderRadius: 16,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
                  padding: 14,
                  zIndex: 100,
                }}
              >
                {section.categories.map((cat) => (
                  <div key={cat.label} style={{ minWidth: 230 }}>
                    <div style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(212,160,23,0.65)",
                      padding: "2px 4px 8px",
                    }}>
                      {cat.label}
                    </div>
                    {/* 2-column grid of icon card chips */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {cat.items.map((item) => {
                        const itemActive = pathname === item.path || pathname.startsWith(item.path + "/");
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNav(item.path)}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              textAlign: "center",
                              minHeight: 64,
                              width: 112,
                              borderRadius: 12,
                              padding: "10px 6px",
                              background: itemActive ? "rgba(212,160,23,0.12)" : "rgba(255,255,255,0.03)",
                              border: itemActive ? "1px solid rgba(212,160,23,0.35)" : "1px solid rgba(255,255,255,0.06)",
                              color: itemActive ? "#D4A017" : "rgba(255,255,255,0.72)",
                              cursor: "pointer",
                              transition: "background 150ms ease, border-color 150ms ease, color 150ms ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(212,160,23,0.10)";
                              e.currentTarget.style.borderColor = "rgba(212,160,23,0.30)";
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = itemActive ? "rgba(212,160,23,0.12)" : "rgba(255,255,255,0.03)";
                              e.currentTarget.style.borderColor = itemActive ? "rgba(212,160,23,0.35)" : "rgba(255,255,255,0.06)";
                              e.currentTarget.style.color = itemActive ? "#D4A017" : "rgba(255,255,255,0.72)";
                            }}
                          >
                            {ItemIcon && <ItemIcon size={16} style={{ opacity: 0.85 }} />}
                            <span style={{ fontSize: 10.5, fontWeight: itemActive ? 700 : 600, lineHeight: 1.15 }}>
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
      })}
    </div>
  );
}
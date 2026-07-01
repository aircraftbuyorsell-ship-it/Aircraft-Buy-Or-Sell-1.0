import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";

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
                    display: "flex",
                    gap: 0,
                    background: "#111827",
                    border: "1px solid rgba(212,160,23,0.15)",
                    borderRadius: 12,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    padding: 12,
                    zIndex: 100,
                  }}
                >
                  {section.categories.map((cat, ci) => (
                    <div
                      key={cat.label}
                      style={{
                        minWidth: 180,
                        paddingRight: ci < section.categories.length - 1 ? 14 : 0,
                        marginRight: ci < section.categories.length - 1 ? 14 : 0,
                        borderRight: ci < section.categories.length - 1 ? "0.5px solid rgba(255,255,255,0.08)" : "none",
                      }}
                    >
                      <div style={{
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgba(212,160,23,0.70)",
                        padding: "4px 10px 8px",
                      }}>
                        {cat.label}
                      </div>
                      {cat.items.map((item) => {
                        const itemActive = pathname === item.path || pathname.startsWith(item.path + "/");
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNav(item.path)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              width: "100%",
                              textAlign: "left",
                              fontSize: 13,
                              fontWeight: itemActive ? 600 : 500,
                              color: itemActive ? "#D4A017" : "rgba(255,255,255,0.75)",
                              background: "transparent",
                              border: "none",
                              borderRadius: 8,
                              padding: "9px 10px",
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
                            {item.icon && <item.icon size={13} style={{ opacity: 0.6, flexShrink: 0 }} />}
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
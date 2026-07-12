import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";
import IntelligenceDropdown from "@/components/layout/IntelligenceDropdown";

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

        if (section.direct) {
          return (
            <div key={section.label} style={{ position: "relative" }}>
              <button
                onClick={() => handleNav(section.path)}
                style={{
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#D4A017" : "rgba(255,255,255,0.65)",
                  background: "transparent",
                  border: "none",
                  padding: "8px 2px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.01em",
                  transition: "color 150ms ease",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
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
                {section.label === "Intelligence" ? (
                  <IntelligenceDropdown section={section} onNavigate={handleNav} />
                ) : section.categories.map((cat) => (
                  <div key={cat.label} style={{ minWidth: 230 }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(212,160,23,0.65)", padding: "2px 4px 8px" }}>{cat.label}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {cat.items.map((item) => { const ItemIcon = item.icon; const itemActive = pathname === item.path || pathname.startsWith(item.path + "/"); return (
                        <button key={item.path} onClick={() => handleNav(item.path)} className="flex min-h-16 w-28 flex-col items-center justify-center gap-1.5 rounded-xl px-1.5 py-2.5 text-center transition-colors hover:border-gold/30 hover:bg-gold/10 hover:text-white" style={{ background: itemActive ? "rgba(212,160,23,0.12)" : "rgba(255,255,255,0.03)", border: itemActive ? "1px solid rgba(212,160,23,0.35)" : "1px solid rgba(255,255,255,0.06)", color: itemActive ? "#D4A017" : "rgba(255,255,255,0.72)" }}>
                          {ItemIcon && <ItemIcon size={16} className="opacity-85" />}<span className="text-[10.5px] font-semibold leading-tight">{item.label}</span>
                        </button>
                      ); })}
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
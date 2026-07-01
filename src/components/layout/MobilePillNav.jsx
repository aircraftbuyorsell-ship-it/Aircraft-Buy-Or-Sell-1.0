import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { NAV_TREE, isPathInSection } from "@/components/layout/navConfig";

export default function MobilePillNav() {
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
    <div ref={barRef} className="w-full max-w-sm mx-auto" style={{ position: "relative" }}>
      <div
        className="flex items-center gap-1 w-full"
        style={{
          height: 44,
          padding: 4,
          background: "#111827",
          border: "1px solid rgba(212,160,23,0.28)",
          borderRadius: 999,
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        {NAV_TREE.map((section) => {
          const active = isPathInSection(section, pathname);
          const open = openSection === section.label;
          return (
            <button
              key={section.label}
              onClick={() => setOpenSection(open ? null : section.label)}
              className="flex-1 flex items-center justify-center gap-1 transition-colors"
              style={{
                height: 36,
                minWidth: 44,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                color: open ? "#fff" : active ? "#0B1220" : "rgba(255,255,255,0.65)",
                background: active && !open ? "#D4A017" : "transparent",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {section.label}
              <ChevronDown size={12} style={{ transition: "transform 150ms ease", transform: open ? "rotate(180deg)" : "none" }} />
            </button>
          );
        })}
      </div>

      {openSection && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#111827",
            border: "1px solid rgba(212,160,23,0.15)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            padding: 10,
            zIndex: 100,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {NAV_TREE.find((s) => s.label === openSection)?.categories.map((cat, ci) => (
            <div key={cat.label} style={{ marginBottom: ci > 0 ? 4 : 0 }}>
              <div style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(212,160,23,0.70)",
                padding: "8px 10px 4px",
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
                      fontSize: 12,
                      fontWeight: itemActive ? 600 : 500,
                      color: itemActive ? "#D4A017" : "rgba(255,255,255,0.75)",
                      background: "transparent",
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 10px",
                      cursor: "pointer",
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
}
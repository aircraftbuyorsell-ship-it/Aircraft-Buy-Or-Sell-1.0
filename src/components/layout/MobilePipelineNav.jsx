import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PIPELINE_PHASES, isPathInPhase } from "@/components/layout/pipelineNavConfig";

/**
 * Mobile n8n-style pipeline nav — horizontal scrollable node chain + bottom sheet flyout.
 */
export default function MobilePipelineNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [openPhase, setOpenPhase] = useState(null);
  const railRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (railRef.current && !railRef.current.contains(e.target)) setOpenPhase(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleNav = (path) => {
    setOpenPhase(null);
    navigate(path);
  };

  return (
    <div ref={railRef} className="w-full" style={{ position: "relative" }}>
      {/* ── Horizontal node chain ── */}
      <div className="flex items-center justify-start gap-0 overflow-x-auto" style={{ scrollbarWidth: "none", paddingBottom: 2 }}>
        {PIPELINE_PHASES.map((phase, idx) => {
          const active = isPathInPhase(phase, pathname);
          const isOpen = openPhase === phase.label;
          const Icon = phase.icon;
          const color = phase.color;

          return (
            <div key={phase.label} className="flex items-center flex-shrink-0">
              {/* Connecting line */}
              {idx > 0 && (
                <div style={{ width: 10, height: 2, background: active ? color : "rgba(255,255,255,0.08)", flexShrink: 0 }} />
              )}

              {/* Node */}
              <button
                onClick={() => setOpenPhase(isOpen ? null : phase.label)}
                className="flex flex-col items-center justify-center transition-all"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: active ? `${color}1a` : isOpen ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                  border: active ? `1px solid ${color}55` : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: active ? `0 0 12px ${color}25` : "none",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Icon size={16} style={{ color: active ? color : isOpen ? "#fff" : "rgba(255,255,255,0.45)" }} />
                <span style={{ fontSize: 7.5, fontWeight: active || isOpen ? 700 : 600, color: active ? color : "rgba(255,255,255,0.38)", marginTop: 2, letterSpacing: "0.02em" }}>
                  {phase.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Bottom sheet flyout ── */}
      {openPhase && (() => {
        const phase = PIPELINE_PHASES.find((p) => p.label === openPhase);
        if (!phase) return null;

        return (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: "linear-gradient(180deg, rgba(28,28,38,0.98) 0%, rgba(16,16,22,0.98) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
              padding: 12,
              zIndex: 100,
              maxHeight: "68vh",
              overflowY: "auto",
            }}
          >
            {/* Phase header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 10, borderBottom: `0.5px solid ${phase.color}22` }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: `${phase.color}15`, border: `1px solid ${phase.color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <phase.icon size={13} style={{ color: phase.color }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{phase.label}</div>
                <div style={{ fontSize: 8.5, color: "rgba(255,255,255,0.35)" }}>{phase.description}</div>
              </div>
            </div>

            {phase.categories.map((cat, ci) => (
              <div key={cat.label} style={{ marginBottom: ci > 0 ? 8 : 0 }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: `${phase.color}99`, padding: "4px 4px 4px" }}>
                  {cat.label}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {cat.items.map((item) => {
                    const itemActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/"));
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className="flex flex-col items-center justify-center gap-1 text-center transition-all"
                        style={{
                          borderRadius: 10,
                          padding: "8px 4px",
                          minHeight: 54,
                          background: itemActive ? `${phase.color}12` : "rgba(255,255,255,0.03)",
                          border: itemActive ? `1px solid ${phase.color}30` : "1px solid rgba(255,255,255,0.05)",
                          cursor: "pointer",
                        }}
                      >
                        {ItemIcon && <ItemIcon size={14} style={{ color: itemActive ? phase.color : "rgba(255,255,255,0.40)" }} />}
                        <span style={{ fontSize: 9, fontWeight: itemActive ? 700 : 600, color: itemActive ? "#fff" : "rgba(255,255,255,0.65)", lineHeight: 1.15 }}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
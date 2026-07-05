import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PIPELINE_PHASES, isPathInPhase } from "@/components/layout/pipelineNavConfig";

/**
 * n8n-style vertical sidebar navigation.
 * Renders pipeline phases as a chain of connected nodes with flyout panels.
 */
export default function PipelineSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [hoveredPhase, setHoveredPhase] = useState(null);
  const [pinnedPhase, setPinnedPhase] = useState(null);
  const sidebarRef = useRef(null);

  // Close flyout on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setPinnedPhase(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleNav = (path) => {
    setPinnedPhase(null);
    setHoveredPhase(null);
    navigate(path);
  };

  return (
    <div ref={sidebarRef} className="relative flex h-full" style={{ zIndex: 50 }}>
      {/* ── Node rail ── */}
      <nav
        className="flex flex-col items-center pt-3 pb-2 overflow-y-auto overflow-x-hidden"
        style={{
          width: 72,
          flexShrink: 0,
          background: "rgba(8,10,16,0.82)",
          backdropFilter: "blur(16px)",
          borderRight: "0.5px solid rgba(255,255,255,0.06)",
          scrollbarWidth: "none",
        }}
      >
        {PIPELINE_PHASES.map((phase, idx) => {
          const active = isPathInPhase(phase, pathname);
          const isHovered = hoveredPhase === phase.label;
          const isPinned = pinnedPhase === phase.label;
          const isOpen = isPinned || (isHovered && !pinnedPhase);
          const Icon = phase.icon;
          const color = phase.color;

          return (
            <div key={phase.label} className="relative flex flex-col items-center">
              {/* Connecting line above (except first) */}
              {idx > 0 && (
                <div
                  style={{
                    width: 2,
                    height: 18,
                    background: active ? color : "rgba(255,255,255,0.10)",
                    opacity: active ? 0.5 : 1,
                    flexShrink: 0,
                  }}
                />
              )}

              {/* Node button */}
              <button
                onClick={() => setPinnedPhase(isPinned ? null : phase.label)}
                onMouseEnter={() => setHoveredPhase(phase.label)}
                onMouseLeave={() => setHoveredPhase(null)}
                aria-label={phase.label}
                className="group relative flex flex-col items-center justify-center transition-all"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: active
                    ? `${color}1a`
                    : isOpen
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.02)",
                  border: active
                    ? `1px solid ${color}55`
                    : "1px solid rgba(255,255,255,0.06)",
                  boxShadow: active ? `0 0 16px ${color}30` : "none",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Icon
                  size={18}
                  style={{
                    color: active ? color : isOpen ? "#fff" : "rgba(255,255,255,0.50)",
                    transition: "color 150ms ease",
                  }}
                />
                {/* Active indicator dot */}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 6px ${color}`,
                    }}
                  />
                )}
              </button>

              {/* Phase label under node */}
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: active || isOpen ? 700 : 600,
                  color: active ? color : "rgba(255,255,255,0.40)",
                  marginTop: 4,
                  textAlign: "center",
                  lineHeight: 1.1,
                  maxWidth: 64,
                  transition: "color 150ms ease",
                  letterSpacing: "0.02em",
                }}
              >
                {phase.label}
              </span>

              {/* Connecting line below (except last) */}
              {idx < PIPELINE_PHASES.length - 1 && (
                <div
                  style={{
                    width: 2,
                    height: 8,
                    background: "rgba(255,255,255,0.06)",
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Flyout panel ── */}
      {pinnedPhase && (() => {
        const phase = PIPELINE_PHASES.find((p) => p.label === pinnedPhase);
        if (!phase) return null;

        return (
          <div
            onMouseEnter={() => setHoveredPhase(phase.label)}
            onMouseLeave={() => setHoveredPhase(null)}
            className="absolute top-0 bottom-0 overflow-y-auto"
            style={{
              left: 72,
              width: 280,
              background: "linear-gradient(180deg, rgba(20,20,28,0.98) 0%, rgba(12,12,18,0.98) 100%)",
              backdropFilter: "blur(24px)",
              borderRight: "0.5px solid rgba(255,255,255,0.06)",
              boxShadow: "8px 0 32px rgba(0,0,0,0.5)",
              padding: "16px 12px",
            }}
          >
            {/* Phase header */}
            <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `0.5px solid ${phase.color}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${phase.color}15`,
                    border: `1px solid ${phase.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <phase.icon size={14} style={{ color: phase.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{phase.label}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.02em" }}>
                    {phase.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            {phase.categories.map((cat) => (
              <div key={cat.label} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: `${phase.color}99`,
                    padding: "2px 6px 6px",
                  }}
                >
                  {cat.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {cat.items.map((item) => {
                    const itemActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/"));
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className="group flex items-center gap-2.5 transition-all text-left"
                        style={{
                          borderRadius: 8,
                          padding: "7px 8px",
                          background: itemActive ? `${phase.color}12` : "transparent",
                          border: "none",
                          cursor: "pointer",
                          width: "100%",
                        }}
                        onMouseEnter={(e) => {
                          if (!itemActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        }}
                        onMouseLeave={(e) => {
                          if (!itemActive) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {ItemIcon && (
                          <ItemIcon
                            size={14}
                            style={{
                              color: itemActive ? phase.color : "rgba(255,255,255,0.40)",
                              flexShrink: 0,
                              transition: "color 150ms ease",
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: 11.5,
                            fontWeight: itemActive ? 600 : 500,
                            color: itemActive ? "#fff" : "rgba(255,255,255,0.65)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            transition: "color 150ms ease",
                          }}
                        >
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

      {/* ── Hover flyout (preview when not pinned) ── */}
      {hoveredPhase && !pinnedPhase && (() => {
        const phase = PIPELINE_PHASES.find((p) => p.label === hoveredPhase);
        if (!phase) return null;

        return (
          <div
            onMouseEnter={() => setHoveredPhase(phase.label)}
            onMouseLeave={() => setHoveredPhase(null)}
            className="absolute top-0 bottom-0 overflow-y-auto"
            style={{
              left: 72,
              width: 280,
              background: "linear-gradient(180deg, rgba(20,20,28,0.98) 0%, rgba(12,12,18,0.98) 100%)",
              backdropFilter: "blur(24px)",
              borderRight: "0.5px solid rgba(255,255,255,0.06)",
              boxShadow: "8px 0 32px rgba(0,0,0,0.5)",
              padding: "16px 12px",
            }}
          >
            <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: `0.5px solid ${phase.color}22` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${phase.color}15`,
                    border: `1px solid ${phase.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <phase.icon size={14} style={{ color: phase.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{phase.label}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{phase.description}</div>
                </div>
              </div>
            </div>

            {phase.categories.map((cat) => (
              <div key={cat.label} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: `${phase.color}99`,
                    padding: "2px 6px 6px",
                  }}
                >
                  {cat.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {cat.items.map((item) => {
                    const itemActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/"));
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className="flex items-center gap-2.5 transition-all text-left"
                        style={{
                          borderRadius: 8,
                          padding: "7px 8px",
                          background: itemActive ? `${phase.color}12` : "transparent",
                          border: "none",
                          cursor: "pointer",
                          width: "100%",
                        }}
                        onMouseEnter={(e) => { if (!itemActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { if (!itemActive) e.currentTarget.style.background = "transparent"; }}
                      >
                        {ItemIcon && <ItemIcon size={14} style={{ color: itemActive ? phase.color : "rgba(255,255,255,0.40)", flexShrink: 0 }} />}
                        <span style={{ fontSize: 11.5, fontWeight: itemActive ? 600 : 500, color: itemActive ? "#fff" : "rgba(255,255,255,0.65)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
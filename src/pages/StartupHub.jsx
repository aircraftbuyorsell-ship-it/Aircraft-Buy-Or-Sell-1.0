import { useState } from "react";
import SoarStartupHub from "@/pages/SoarStartupHub";
import AviationStartupHub from "@/pages/AviationStartupHub";

/**
 * StartupHub — consolidated startup hub.
 * Phase 1: tab shell rendering the two legacy startup pages (non-breaking).
 * Legacy routes /soar and /startup-hub remain functional.
 */
const TABS = [
  { key: "soar", label: "SOAR Program", Component: SoarStartupHub },
  { key: "aviation", label: "Aviation Startups", Component: AviationStartupHub },
];

export default function StartupHub() {
  const [active, setActive] = useState("soar");
  const current = TABS.find((t) => t.key === active);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "transparent",
        color: "#fff",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          borderBottom: "0.5px solid rgba(255,255,255,0.08)",
          background: "rgba(17,24,39,0.6)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            gap: 2,
            overflowX: "auto",
          }}
        >
          {TABS.map((t) => {
            const on = active === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                style={{
                  padding: "18px 20px",
                  background: "transparent",
                  border: "none",
                  borderBottom: on ? "2px solid #D4A017" : "2px solid transparent",
                  color: on ? "#D4A017" : "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "color 150ms ease",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {current?.Component ? <current.Component /> : null}
    </div>
  );
}
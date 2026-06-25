import SectionShell from "./SectionShell";

export default function MarketCounters({ listings = [], atiCards = [], activeAti = [] }) {
  const counters = [
    { label: "Active Listings", value: listings.length, color: "#5dcaa5" },
    { label: "ATI Passports Issued", value: atiCards.length, color: "#D4A017" },
    { label: "ATI Scores Active", value: activeAti.length, color: "#2563EB" },
    { label: "Platform Coverage", value: "Global", color: "#5dcaa5" },
  ];
  return (
    <SectionShell eyebrow="Market Intelligence" title="Real-Time Aviation Data Feed">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {counters.map((c) => (
          <div
            key={c.label}
            style={{
              background: "#111827",
              border: "0.5px solid rgba(212,160,23,0.12)",
              borderRadius: 8,
              padding: "20px 24px",
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: 8,
              }}
            >
              {c.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: c.color, fontSize: 12 }}>✔</span>
              <span
                style={{
                  fontSize: 24,
                  color: c.color,
                  letterSpacing: "-0.02em",
                }}
              >
                {c.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
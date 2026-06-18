const DIMENSIONS = [
  { key: "documentation", label: "Documentation" },
  { key: "technical", label: "Technical" },
  { key: "transparency", label: "Transparency" },
  { key: "transaction_ready", label: "Transaction Ready" },
  { key: "usage_mission", label: "Usage / Mission" },
  { key: "storage_exposure", label: "Storage / Exposure" },
  { key: "config_clarity", label: "Config Clarity" },
  { key: "market_readiness", label: "Market Readiness" },
];

function colorForScore(score, max) {
  const pct = score / max;
  if (pct >= 0.75) return "#22c55e";
  if (pct >= 0.55) return "#D4A017";
  return "#ef4444";
}

function verdictLabel(total) {
  if (total >= 105) return { text: "Exceptional", color: "#22c55e" };
  if (total >= 84) return { text: "Strong", color: "#D4A017" };
  if (total >= 60) return { text: "Fair", color: "#f48120" };
  return { text: "Needs Attention", color: "#ef4444" };
}

export function ScoreArc({ score, max = 120 }) {
  const pct = score / max;
  const radius = 64;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * pct;
  const unfilled = circumference - filled;
  const v = verdictLabel(score);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <svg width="160" height="100" viewBox="0 0 160 100" style={{ overflow: "visible" }}>
        <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx="80" cy="80" r={radius} fill="none" stroke={v.color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${filled} ${unfilled}`}
          strokeDashoffset={circumference / 4}
          transform="rotate(180 80 80)"
          style={{ transition: "stroke-dasharray 0.8s ease-out" }}
        />
        <text x="80" y="76" textAnchor="middle" fill="#fff" fontSize="28" fontWeight="800" letterSpacing="-0.02em">
          {score}
        </text>
        <text x="80" y="92" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11" fontWeight="600">
          / {max}
        </text>
      </svg>
      <span style={{
        fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: v.color, padding: "2px 12px", borderRadius: "6px",
        background: `${v.color}18`, border: `1px solid ${v.color}30`,
      }}>
        {v.text}
      </span>
    </div>
  );
}

export function DimensionBars({ result }) {
  const total = DIMENSIONS.reduce((sum, d) => sum + (result[d.key] || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {DIMENSIONS.map((d) => {
        const score = result[d.key] || 0;
        const pct = (score / 15) * 100;
        const color = colorForScore(score, 15);
        return (
          <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", fontWeight: 600 }}>{d.label}</span>
              <span style={{ color, fontSize: "11px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                {score}/15
              </span>
            </div>
            <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%", width: `${pct}%`, borderRadius: "3px",
                  background: color,
                  transition: "width 0.6s ease-out",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FlagsList({ result }) {
  const flags = [];
  if (result.asking_price && result.omvm_low && result.asking_price < result.omvm_low) {
    flags.push({ text: `Priced below OMVM ($${result.asking_price.toLocaleString()} vs $${result.omvm_low.toLocaleString()}–$${result.omvm_high.toLocaleString()})`, color: "#22c55e" });
  }
  if (result.asking_price && result.omvm_high && result.asking_price > result.omvm_high) {
    flags.push({ text: `Priced above OMVM ($${result.asking_price.toLocaleString()} vs $${result.omvm_low.toLocaleString()}–$${result.omvm_high.toLocaleString()})`, color: "#ef4444" });
  }
  result.flash_line && flags.push({ text: result.flash_line, color: "#D4A017" });

  if (!flags.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {flags.map((f, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px",
          background: `${f.color}10`, border: `1px solid ${f.color}25`,
        }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: f.color, flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", lineHeight: 1.4 }}>{f.text}</span>
        </div>
      ))}
    </div>
  );
}

export function OMVMValue({ result }) {
  if (!result.omvm_low || !result.omvm_high) return null;
  const mid = Math.round((result.omvm_low + result.omvm_high) / 2);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 12px", borderRadius: "8px",
      background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)",
    }}>
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", fontWeight: 600 }}>OMVM:</span>
      <span style={{ color: "#22c55e", fontSize: "14px", fontWeight: 800 }}>
        ${mid.toLocaleString()}
      </span>
    </div>
  );
}
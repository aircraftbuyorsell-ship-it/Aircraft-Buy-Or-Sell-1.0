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

const CIRC = 238.76; // 2π·38

function dimColor(score) {
  if (score >= 12) return "#5dcaa5";
  if (score >= 8) return "#f5c242";
  return "#e24b4a";
}

function arcColor(total) {
  if (total >= 96) return { color: "url(#atiTeal)", solid: "#5dcaa5" };
  if (total >= 80) return { color: "rgba(93,202,165,0.6)", solid: "#5dcaa5" };
  if (total >= 60) return { color: "url(#atiAmber)", solid: "#f5c242" };
  return { color: "#e24b4a", solid: "#e24b4a" };
}

export function ScoreArc({ score, max = 120 }) {
  const arc = Math.max(0, Math.min((score / max) * CIRC, CIRC - 1));
  const gap = CIRC - arc;
  const { color, solid } = arcColor(score);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg width="120" height="120" viewBox="0 0 90 90">
        <defs>
          <linearGradient id="atiTeal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5dcaa5" />
            <stop offset="100%" stopColor="#3da888" />
          </linearGradient>
          <linearGradient id="atiAmber" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5c242" />
            <stop offset="100%" stopColor="#d9a520" />
          </linearGradient>
        </defs>
        <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle
          cx="45" cy="45" r="38" fill="none" stroke={color}
          strokeWidth={5} strokeLinecap="round"
          strokeDasharray={`${arc.toFixed(1)} ${gap.toFixed(1)}`}
          transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)" }}
        />
        <text x="45" y="46" textAnchor="middle" fill={solid} fontSize="18" fontWeight="600" letterSpacing="-0.04em">
          {score}
        </text>
        <text x="45" y="58" textAnchor="middle" fill="rgba(255,255,255,0.30)" fontSize="9">
          /{max}
        </text>
      </svg>
    </div>
  );
}

export function DimensionBars({ result }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {DIMENSIONS.map((d) => {
        const score = result[d.key] || 0;
        const pct = (score / 15) * 100;
        const color = dimColor(score);
        return (
          <div key={d.key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{
                color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 600,
                letterSpacing: "0.12em", textTransform: "uppercase",
              }}>{d.label}</span>
              <span style={{ color: "rgba(255,255,255,0.90)", fontSize: "12px", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {score}<span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>/15</span>
              </span>
            </div>
            <div style={{ height: "4px", borderRadius: "99px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`, borderRadius: "99px",
                background: color, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
              }} />
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
    flags.push(`Priced below OMVM ($${result.asking_price.toLocaleString()} vs $${result.omvm_low.toLocaleString()}–$${result.omvm_high.toLocaleString()})`);
  }
  if (result.asking_price && result.omvm_high && result.asking_price > result.omvm_high) {
    flags.push(`Priced above OMVM ($${result.asking_price.toLocaleString()} vs $${result.omvm_low.toLocaleString()}–$${result.omvm_high.toLocaleString()})`);
  }
  result.flash_line && flags.push(result.flash_line);

  if (!flags.length) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {flags.map((f, i) => (
        <div key={i} style={{
          borderLeft: "3px solid #e24b4a",
          background: "rgba(226,75,74,0.08)",
          padding: "10px 14px", borderRadius: "8px",
          fontSize: "12px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5,
        }}>
          {f}
        </div>
      ))}
    </div>
  );
}

export function OMVMValue({ result }) {
  if (!result.omvm_low || !result.omvm_high) return null;
  const mid = Math.round((result.omvm_low + result.omvm_high) / 2);
  const omvmConfidence = result.omvm_confidence;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
      <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Free Market Value Estimate
      </span>
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        <span style={{ color: "#5dcaa5", fontSize: "24px", fontWeight: 600, letterSpacing: "-0.03em" }}>
          ${mid.toLocaleString()}
        </span>
        {omvmConfidence && (
          <span style={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "2px 8px",
            borderRadius: "9999px",
            border: "0.5px solid",
            marginLeft: "8px",
            ...(omvmConfidence === "high"
              ? { color: "#5dcaa5", background: "rgba(93,202,165,0.09)", borderColor: "rgba(93,202,165,0.20)" }
              : omvmConfidence === "medium"
              ? { color: "#f5c242", background: "rgba(245,194,66,0.09)", borderColor: "rgba(245,194,66,0.22)" }
              : { color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)" }
            )
          }}>
            {omvmConfidence === "high" ? "Model match" : omvmConfidence === "medium" ? "Make match" : "Estimate"}
          </span>
        )}
      </span>
    </div>
  );
}
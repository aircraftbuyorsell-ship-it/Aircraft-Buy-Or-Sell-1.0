import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

const DIMENSIONS = [
  { key: "documentation",   label: "Documentation & Records",  desc: "Logbooks, airframe history, FAA records" },
  { key: "technical",       label: "Maintenance History",       desc: "AD compliance, service trail, squawks" },
  { key: "transparency",    label: "Engine Condition",          desc: "SMOH, TBO, compressions, oil consumption" },
  { key: "transaction_ready", label: "Avionics Package",        desc: "GPS/WAAS, ADS-B out, autopilot, glass panel" },
  { key: "usage_mission",   label: "Operational History",       desc: "Private vs training vs charter usage" },
  { key: "storage_exposure", label: "Storage & Climate",        desc: "Hangared, dry vs outdoor, coastal exposure" },
  { key: "config_clarity",  label: "Configuration Clarity",     desc: "Specs, STCs, modifications, weight & balance" },
  { key: "market_readiness", label: "Transaction Readiness",    desc: "Annual freshness, pre-buy willingness" },
];

function scoreColor(s) {
  if (s >= 13) return { text: "#0F7A56", bg: "rgba(15,122,86,0.08)", bar: "#0F7A56", label: "Strong" };
  if (s >= 10) return { text: "#185FA5", bg: "rgba(24,95,165,0.08)", bar: "#185FA5", label: "Good" };
  if (s >= 7)  return { text: "#A67C00", bg: "rgba(212,160,23,0.10)", bar: "#D4A017", label: "Partial" };
  return       { text: "#C0392B", bg: "rgba(192,57,43,0.08)", bar: "#C0392B", label: "Weak" };
}

function DimRow({ dim, score }) {
  const s = score || 0;
  const c = scoreColor(s);
  const pct = (s / 15) * 100;
  const Icon = s >= 13 ? CheckCircle2 : s >= 7 ? AlertCircle : AlertTriangle;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-black/[0.05] last:border-0">
      {/* Icon */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: c.bg }}>
        <Icon className="w-3.5 h-3.5" style={{ color: c.text }} />
      </div>

      {/* Label + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          <span className="text-[12px] font-bold text-[#1A1814] truncate">{dim.label}</span>
              <span className="text-[10px] text-[#6B6560] shrink-0 hidden sm:inline">{dim.desc}</span>
        </div>
        <div className="h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.bar }} />
        </div>
      </div>

      {/* Score badge */}
      <div className="text-right shrink-0 w-16">
        <span className="text-[13px] font-black" style={{ color: c.text }}>{s}</span>
        <span className="text-[10px] text-[#C4BEB6]">/15</span>
      </div>
    </div>
  );
}

export default function ATIScoreBreakdown({ passport, missing_data }) {
  const scores = {
    documentation:    passport?.documentation || 0,
    technical:        passport?.technical || 0,
    transparency:     passport?.transparency || 0,
    transaction_ready: passport?.transaction_ready || 0,
    usage_mission:    passport?.usage_mission || 0,
    storage_exposure: passport?.storage_exposure || 0,
    config_clarity:   passport?.config_clarity || 0,
    market_readiness: passport?.market_readiness || 0,
  };

  const total = passport?.ati_total || 0;
  const pct = Math.round((total / 120) * 100);

  const missingItems = missing_data
    ? missing_data.split("\n").filter(Boolean)
    : [];

  return (
    <div className="space-y-4">
      {/* Total bar */}
      <div className="bg-white border border-black/[0.07] rounded-2xl p-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#0B2D5B]">ATI Score Breakdown</p>
            <p className="text-[11px] text-[#AAA49C] mt-0.5">8 dimensions · 15 points each · 120 maximum</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-[#0B2D5B] leading-none">{total}</span>
            <span className="text-[11px] text-[#AAA49C] ml-1">/ 120</span>
          </div>
        </div>

        {/* Segmented progress */}
        <div className="relative h-2 bg-black/[0.05] rounded-full overflow-hidden mb-1">
          <div className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: total >= 90
                ? "linear-gradient(90deg,#185FA5,#0F7A56)"
                : total >= 72
                ? "linear-gradient(90deg,#D4A017,#185FA5)"
                : "linear-gradient(90deg,#C0392B,#D4A017)",
            }}
          />
        </div>
        <div className="flex justify-between">
          {["0","30","60","90","120"].map(t => (
            <span key={t} className="text-[8px] text-[#C4BEB6] font-medium">{t}</span>
          ))}
        </div>
      </div>

      {/* Dimension list */}
      <div className="bg-white border border-black/[0.07] rounded-2xl px-5 py-2">
        {DIMENSIONS.map(dim => (
          <DimRow key={dim.key} dim={dim} score={scores[dim.key]} />
        ))}
      </div>

      {/* Missing data */}
      {missingItems.length > 0 && (
        <div className="bg-[rgba(212,160,23,0.05)] border border-[rgba(212,160,23,0.20)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#D4A017] shrink-0" />
            <p className="text-[10px] uppercase tracking-wider font-black text-[#A67C00]">Data Gaps — Request Before Making an Offer</p>
          </div>
          <ul className="space-y-1.5">
            {missingItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-[#6B6560]">
                <span className="w-1 h-1 rounded-full bg-[#D4A017] mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
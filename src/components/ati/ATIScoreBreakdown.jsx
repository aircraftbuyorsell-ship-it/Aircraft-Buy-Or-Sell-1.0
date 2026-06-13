import { CheckCircle2, AlertCircle, AlertTriangle, HelpCircle } from "lucide-react";

const DIMENSIONS = [
  {
    key: "documentation",
    label: "Documentation",
    desc: "Bill of sale, logbook completeness, FAA records",
  },
  {
    key: "technical",
    label: "Technical Traceability",
    desc: "Engine maintenance logs, service history clarity",
  },
  {
    key: "transparency",
    label: "Engine Transparency",
    desc: "SMOH clarity, compression data, TBO status",
  },
  {
    key: "transaction_ready",
    label: "Avionics Quality",
    desc: "Equipment list, glass cockpit status, support availability",
  },
  {
    key: "usage_mission",
    label: "Usage & Mission",
    desc: "Utilization pattern, damage history, modification risk",
  },
  {
    key: "storage_exposure",
    label: "Storage & Exposure",
    desc: "Hangar status, corrosion risk, environmental factors",
  },
  {
    key: "config_clarity",
    label: "Configuration Clarity",
    desc: "Seating, weight/balance, equipment manifest",
  },
  {
    key: "market_readiness",
    label: "Market Readiness",
    desc: "Photos, valuation data, comparable sales info",
  },
];

function DimensionBar({ score, maxScore = 15 }) {
  const pct = (score / maxScore) * 100;
  let color = "#C0392B"; // red
  if (score >= 13) color = "#0F7A56"; // green
  else if (score >= 10) color = "#185FA5"; // blue
  else if (score >= 7) color = "#D4A017"; // amber

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 bg-black/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-black text-[#1A1814] w-8 text-right">{score}/15</span>
    </div>
  );
}

function ReadinessCard({ dimension, scores, missingFields }) {
  const score = scores[dimension.key] || 0;
  const isComplete = score >= 13;
  const isPartial = score >= 7;

  const edgeColor = isComplete ? "#0F7A56" : isPartial ? "#D4A017" : "#C0392B";
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeft: `3px solid ${edgeColor}` }}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-[#0F7A56]" />
            ) : isPartial ? (
              <AlertCircle className="w-4 h-4 text-[#D4A017]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#C0392B]" />
            )}
            <h4 className="text-[13px] font-black text-[#1A1814]">{dimension.label}</h4>
          </div>
          <p className="text-[11px] text-[#6B6560]">{dimension.desc}</p>
        </div>
        <span
          className={`text-xs font-black px-2 py-1 rounded-lg ${
            isComplete
              ? "bg-[rgba(15,122,86,0.1)] text-[#0F7A56]"
              : isPartial
              ? "bg-[rgba(212,160,23,0.1)] text-[#A67C00]"
              : "bg-[rgba(192,57,43,0.1)] text-[#C0392B]"
          }`}
        >
          {isComplete ? "✓ Ready" : isPartial ? "~ Partial" : "⚠ Incomplete"}
        </span>
      </div>

      <div className="mb-3">
        <DimensionBar score={score} maxScore={15} />
      </div>

      {missingFields[dimension.key] && missingFields[dimension.key].length > 0 && (
        <div className="bg-[#F7F4EF] border border-black/[0.05] rounded-lg p-2.5 text-[10px]">
          <div className="flex items-center gap-1.5 mb-1">
            <HelpCircle className="w-3 h-3 text-[#D4A017]" />
            <span className="font-bold text-[#A67C00]">To improve this score:</span>
          </div>
          <ul className="space-y-0.5 ml-5 list-disc text-[#6B6560]">
            {missingFields[dimension.key].map((field, i) => (
              <li key={i}>{field}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ATIScoreBreakdown({ passport, missing_data }) {
  const scores = {
    documentation: passport?.documentation || 0,
    technical: passport?.technical || 0,
    transparency: passport?.transparency || 0,
    transaction_ready: passport?.transaction_ready || 0,
    usage_mission: passport?.usage_mission || 0,
    storage_exposure: passport?.storage_exposure || 0,
    config_clarity: passport?.config_clarity || 0,
    market_readiness: passport?.market_readiness || 0,
  };

  const totalScore = passport?.ati_total || 0;
  const maxScore = 120;
  const completeness = (totalScore / maxScore) * 100;

  // Parse missing_data string into grouped fields
  const missingFieldsByDimension = {
    documentation: [],
    technical: [],
    transparency: [],
    transaction_ready: [],
    usage_mission: [],
    storage_exposure: [],
    config_clarity: [],
    market_readiness: [],
  };

  if (missing_data) {
    const lines = missing_data.split("\n").filter(Boolean);
    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes("bill") || lower.includes("logbook") || lower.includes("faa"))
        missingFieldsByDimension.documentation.push(line.trim());
      else if (lower.includes("maintenance") || lower.includes("service") || lower.includes("history"))
        missingFieldsByDimension.technical.push(line.trim());
      else if (lower.includes("smoh") || lower.includes("engine") || lower.includes("compression") || lower.includes("tbo"))
        missingFieldsByDimension.transparency.push(line.trim());
      else if (lower.includes("avionics") || lower.includes("glass") || lower.includes("equipment"))
        missingFieldsByDimension.transaction_ready.push(line.trim());
      else if (lower.includes("usage") || lower.includes("damage") || lower.includes("mission"))
        missingFieldsByDimension.usage_mission.push(line.trim());
      else if (lower.includes("hangar") || lower.includes("storage") || lower.includes("exposure") || lower.includes("corrosion"))
        missingFieldsByDimension.storage_exposure.push(line.trim());
      else if (lower.includes("seating") || lower.includes("weight") || lower.includes("config"))
        missingFieldsByDimension.config_clarity.push(line.trim());
      else if (lower.includes("photo") || lower.includes("valuation") || lower.includes("market"))
        missingFieldsByDimension.market_readiness.push(line.trim());
    });
  }

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div className="relative overflow-hidden bg-white border border-black/[0.07] rounded-2xl p-5 shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent 5%, #0B2D5B 50%, transparent 95%)" }} />
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] font-black text-[#0B2D5B] mb-1">Report Completeness</p>
            <p className="text-sm text-[#6B6560]">How much data has been provided or verified</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-[#0B2D5B] leading-none">{Math.round(completeness)}%</p>
            <p className="text-[10px] text-[#AAA49C] mt-1">{totalScore} / 120 points</p>
          </div>
        </div>
        <div className="h-3 bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D4A017] via-[#185FA5] to-[#0F7A56] rounded-full transition-all"
            style={{ width: `${completeness}%`, boxShadow: "0 0 8px rgba(24,95,165,0.4)" }}
          />
        </div>
        {/* Tick markers */}
        <div className="flex justify-between mt-1.5 px-0.5">
          {["0", "30", "60", "90", "120"].map(t => (
            <span key={t} className="text-[8px] text-[#AAA49C] font-semibold">{t}</span>
          ))}
        </div>
      </div>

      {/* Dimension breakdown */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.15em] font-black text-[#0B2D5B] mb-3">
          8 Scoring Dimensions
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {DIMENSIONS.map(dim => (
            <ReadinessCard
              key={dim.key}
              dimension={dim}
              scores={scores}
              missingFields={missingFieldsByDimension}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[#0B2D5B] text-white rounded-2xl p-5">
        <p className="text-[11px] uppercase tracking-[0.15em] font-black text-[#E8A83A] mb-2">Next Steps to Strengthen Report</p>
        <div className="space-y-2 text-[12px]">
          {Object.entries(missingFieldsByDimension).some(([_, fields]) => fields.length > 0) ? (
            <>
              <p>
                To improve buyer confidence and valuation accuracy, focus on fields marked{" "}
                <span className="font-bold text-[#D4A017]">⚠ Incomplete</span> above.
              </p>
              <p className="text-white/80">
                Each missing data point reduces the ATI score by 1–2 points. Providing complete documentation can add 10–15 points and unlock{" "}
                <span className="font-bold">Deal Radar eligibility</span>.
              </p>
            </>
          ) : (
            <p>All critical data has been provided. This report is ready for buyer distribution.</p>
          )}
        </div>
      </div>
    </div>
  );
}
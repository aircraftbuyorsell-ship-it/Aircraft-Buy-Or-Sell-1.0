import { CheckCircle2, AlertTriangle, Eye } from "lucide-react";

export default function ClaritySummary({ clarity, maintenance, service, totalAnnual, perHour }) {
  const Icon = clarity.score >= 80 ? CheckCircle2 : clarity.score >= 40 ? Eye : AlertTriangle;

  return (
    <div className="bg-white border-2 rounded-2xl p-5 md:p-6" style={{ borderColor: clarity.color }}>
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${clarity.color}15` }}
        >
          <Icon className="w-7 h-7" style={{ color: clarity.color }} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#E8A83A]">Ownership Clarity Summary</p>
          <div className="flex items-baseline gap-3 mt-1 flex-wrap">
            <h3 className="text-2xl font-black tracking-tight" style={{ color: clarity.color }}>
              {clarity.label}
            </h3>
            <span className="text-sm font-black text-[#6B6560]">
              {clarity.score}/100 clarity
            </span>
          </div>
          <p className="text-sm text-[#4A4845] mt-2 leading-relaxed">{clarity.verdict}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-black/[0.07]">
        <Metric label="Total / Year" value={`$${Math.round(totalAnnual).toLocaleString()}`} color="#1A1814" />
        <Metric label="Cost / Flight Hour" value={`$${Math.round(perHour).toLocaleString()}`} color="#0B2D5B" />
        <Metric label="Maintenance Exposure" value={maintenance.label} color={maintenance.color} />
        <Metric label="Service Accessibility" value={service.label} color={service.color} />
      </div>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">{label}</p>
      <p className="text-base font-black mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}
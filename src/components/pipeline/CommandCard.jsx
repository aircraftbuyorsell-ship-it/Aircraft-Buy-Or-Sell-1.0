import { Plane, ShieldCheck, FileText, TrendingUp, CheckCircle, Scale } from "lucide-react";

// Top "Command Card" — the central hub showing pipeline summary
// with connected tool nodes (the sketch's upper section)

export default function CommandCard({ pipeline, passport }) {
  const steps = pipeline.steps || [];
  const completed = steps.filter(s => s.status === "completed").length;
  const blocked = steps.filter(s => s.status === "blocked").length;
  const aiSteps = steps.filter(s => s.ai_driven);
  const aiDone = aiSteps.filter(s => s.status === "completed").length;

  // Tool nodes — connected to the card like the sketch
  const tools = [
    { icon: ShieldCheck, label: "ATI Score", value: passport?.ati_total ? `${passport.ati_total}/120` : "—", color: "#4e8ef7" },
    { icon: TrendingUp, label: "Valuation", value: passport?.omvm_value ? `$${(passport.omvm_value / 1000).toFixed(0)}K` : "—", color: "#f5c242" },
    { icon: FileText, label: "Documents", value: `${completed}/${steps.length}`, color: "#a78bfa" },
    { icon: CheckCircle, label: "AI Steps", value: `${aiDone}/${aiSteps.length}`, color: "#5dcaa5" },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)]"
      style={{ background: "rgba(255,255,255,0.03)" }}>

      {/* Tool nodes row (top connections) */}
      <div className="flex items-center justify-center gap-3 py-3 px-4 border-b border-[rgba(255,255,255,0.06)] flex-wrap">
        {tools.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: `${t.color}0D`, border: `0.5px solid ${t.color}25` }}>
            <t.icon className="w-3 h-3" style={{ color: t.color }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
              {t.label}
            </span>
            <span className="text-[11px] font-black" style={{ color: t.color }}>{t.value}</span>
          </div>
        ))}
      </div>

      {/* Central CARD */}
      <div className="px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Plane className="w-4 h-4 text-[#f5c242]" />
          <span className="text-[9px] uppercase tracking-[0.25em] font-black text-[#f5c242]">Sales Pipeline</span>
        </div>

        <h2 className="text-xl font-black text-[rgba(255,255,255,0.92)] font-mono tracking-wider mb-0.5">
          {pipeline.registration?.toUpperCase()}
        </h2>
        {pipeline.aircraft_label && (
          <p className="text-[12px] text-[rgba(255,255,255,0.50)] mb-3">{pipeline.aircraft_label}</p>
        )}

        {/* Progress bar */}
        <div className="max-w-xs mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[rgba(255,255,255,0.35)]">Pipeline Progress</span>
            <span className="text-[11px] font-black text-[#f5c242]">{pipeline.progress_pct || 0}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pipeline.progress_pct || 0}%`,
                background: blocked > 0
                  ? "linear-gradient(90deg, #5dcaa5, #f5c242, #e24b4a)"
                  : "linear-gradient(90deg, #4e8ef7, #5dcaa5)",
              }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[9px] text-[rgba(255,255,255,0.35)]">
              {completed} of {steps.length} steps done
            </span>
            {blocked > 0 && (
              <span className="text-[9px] font-bold text-[#e24b4a]">{blocked} blocked</span>
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="mt-3">
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full"
            style={{
              color: pipeline.status === "completed" ? "#5dcaa5" : pipeline.status === "active" ? "#f5c242" : "#6B7280",
              background: pipeline.status === "completed" ? "rgba(93,202,165,0.08)" : pipeline.status === "active" ? "rgba(245,194,66,0.08)" : "rgba(107,114,128,0.06)",
              border: `0.5px solid ${pipeline.status === "completed" ? "rgba(93,202,165,0.2)" : pipeline.status === "active" ? "rgba(245,194,66,0.2)" : "rgba(107,114,128,0.15)"}`,
            }}>
            {pipeline.status === "completed" ? "✓ Deal Closed" : pipeline.status === "active" ? "● In Progress" : "Draft"}
          </span>
        </div>
      </div>
    </div>
  );
}
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

function parseLines(text) {
  if (!text) return [];
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}

export default function ATIInsights({ passport }) {
  const strengths = parseLines(passport.strengths);
  const risks = parseLines(passport.risks);
  const recommendations = parseLines(passport.recommendations);

  return (
    <div className="space-y-5">
      {/* AI Summary */}
      {passport.ai_summary && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-3">AI Summary</p>
          <p className="text-slate-200 text-sm leading-relaxed">{passport.ai_summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Strengths */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">Strengths</p>
          <ul className="space-y-2.5">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-3">Risks</p>
          <ul className="space-y-2.5">
            {risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-400 mb-3">Recommendations</p>
          <ul className="space-y-2.5">
            {recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <ArrowRight className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-xs text-slate-600 text-right">
        ATI {passport.ati_version || "v2"} · Generated {passport.created_date ? new Date(passport.created_date).toLocaleDateString() : "—"}
      </p>
    </div>
  );
}
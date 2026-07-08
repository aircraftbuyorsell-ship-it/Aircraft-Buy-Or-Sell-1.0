import { Sparkles, AlertTriangle, FileQuestion, Lightbulb } from "lucide-react";
import InsightCard from "./InsightCard";

/**
 * ABOS Intelligence — AI insight panel.
 * confidence: 0–100 | warnings/missing/recommendations: string[]
 */
export default function AIInsightPanel({ title = "AI Insights", confidence, warnings = [], missing = [], recommendations = [] }) {
  const empty = !warnings.length && !missing.length && !recommendations.length && confidence == null;
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center border border-gold-official/30 bg-gold-bg">
            <Sparkles className="w-4 h-4 text-gold-official" />
          </span>
          <h3 className="text-sm font-bold">{title}</h3>
        </div>
        {confidence != null && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Confidence</span>
            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gold-official transition-all duration-500" style={{ width: `${confidence}%` }} />
            </div>
            <span className="text-xs font-bold text-gold-official tabular-nums">{confidence}%</span>
          </div>
        )}
      </div>
      {empty ? (
        <p className="text-xs text-muted-foreground">No AI insights available yet.</p>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {warnings.map((w, i) => <InsightCard key={`w${i}`} icon={AlertTriangle} tone="warning" title="Warning" text={w} />)}
          {missing.map((m, i) => <InsightCard key={`m${i}`} icon={FileQuestion} tone="danger" title="Missing" text={m} />)}
          {recommendations.map((r, i) => <InsightCard key={`r${i}`} icon={Lightbulb} tone="positive" title="Recommendation" text={r} />)}
        </div>
      )}
    </div>
  );
}
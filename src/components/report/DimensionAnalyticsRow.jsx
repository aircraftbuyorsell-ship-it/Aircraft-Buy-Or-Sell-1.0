import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { atiDimColor } from "@/theme/atiPremium";

function DetailBlock({ title, items, colorCls }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className={`text-[9px] font-bold uppercase tracking-[0.08em] mb-1 ${colorCls}`}>{title}</p>
      {items.map((s, i) => (
        <p key={i} className="text-[11px] text-muted-foreground leading-relaxed my-0.5 pl-2.5 border-l-2 border-current/30">{s}</p>
      ))}
    </div>
  );
}

/** ABOS Intelligence — expandable 8-dimension analytics row (0–15 scale). */
export default function DimensionAnalyticsRow({ label, score, reason, strengths, risks, missing }) {
  const [expanded, setExpanded] = useState(false);
  const color = atiDimColor(score);
  const pct = (score / 15) * 100;
  const hasDetails = !!(strengths?.length || risks?.length || missing?.length);
  return (
    <div className="py-3 border-b border-border last:border-0">
      <button
        className="w-full flex justify-between items-center mb-1.5 bg-transparent border-0 p-0 cursor-pointer text-left touch-target-compact"
        onClick={() => hasDetails && setExpanded(v => !v)} disabled={!hasDetails}>
        <span className="text-xs font-semibold flex items-center gap-1.5">
          {hasDetails && (expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />)}
          {label}
        </span>
        <span className="text-xs font-black tabular-nums" style={{ color }}>
          {score}<span className="text-muted-foreground font-normal">/15</span>
        </span>
      </button>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      {reason && !expanded && <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{reason}</p>}
      {expanded && hasDetails && (
        <div className="mt-2.5 space-y-2.5">
          {reason && <p className="text-[11px] text-foreground/80 leading-relaxed">{reason}</p>}
          <DetailBlock title="Strengths" items={strengths} colorCls="text-emerald-600 dark:text-emerald-400" />
          <DetailBlock title="Risks" items={risks} colorCls="text-red-600 dark:text-red-400" />
          <DetailBlock title="Missing Data" items={missing} colorCls="text-amber-600 dark:text-amber-400" />
        </div>
      )}
    </div>
  );
}
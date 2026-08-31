const LEVELS = {
  low:      { label: "Low Risk",      color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", width: "25%" },
  medium:   { label: "Medium Risk",   color: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400",   width: "50%" },
  high:     { label: "High Risk",     color: "bg-orange-500",  text: "text-orange-600 dark:text-orange-400", width: "75%" },
  critical: { label: "Critical Risk", color: "bg-red-500",     text: "text-red-600 dark:text-red-400",       width: "100%" },
};

/** ABOS Intelligence — risk level bar. level: low|medium|high|critical. */
export default function RiskIndicator({ level = "low", label }) {
  const cfg = LEVELS[level] || LEVELS.low;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label || "Risk Level"}</p>
        <p className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</p>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${cfg.color}`} style={{ width: cfg.width }} />
      </div>
    </div>
  );
}
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/** ABOS Intelligence — metric card with optional trend delta (number, % assumed). */
export default function MetricCard({ label, value, sub, trend, accent = "text-gold-official" }) {
  const TrendIcon = trend == null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendCls = trend == null ? "" : trend > 0 ? "text-emerald-600 dark:text-emerald-400" : trend < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
  return (
    <div className="glass-card p-4">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className={`text-2xl font-black tabular-nums leading-none ${accent}`}>{value}</p>
        {TrendIcon && (
          <span className={`inline-flex items-center gap-1 text-xs font-bold ${trendCls}`}>
            <TrendIcon className="w-3.5 h-3.5" />{trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      {sub && <p className="text-[10px] text-muted-foreground mt-1.5">{sub}</p>}
    </div>
  );
}
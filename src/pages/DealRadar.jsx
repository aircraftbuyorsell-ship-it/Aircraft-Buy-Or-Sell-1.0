import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, TrendingDown, BarChart2, Radar } from "lucide-react";
import DealCard from "@/components/deals/DealCard";

export default function DealRadar() {
  const [minScore, setMinScore] = useState(6.0);
  const [hotOnly, setHotOnly] = useState(false);

  const { data: allDeals = [], isLoading } = useQuery({
    queryKey: ["deal-radar"],
    queryFn: () =>
      base44.entities.AircraftListing.filter(
        { status: "active" },
        "-deal_score",
        100
      ),
  });

  const dealsWithScore = useMemo(
    () => allDeals.filter((d) => d.deal_score != null && d.deal_score >= 1),
    [allDeals]
  );

  const hot_deals = useMemo(
    () => dealsWithScore.filter((d) => d.deal_score >= 8.5).length,
    [dealsWithScore]
  );
  const good_deals = useMemo(
    () => dealsWithScore.filter((d) => d.deal_score >= 6.5 && d.deal_score < 8.5).length,
    [dealsWithScore]
  );
  const avg_discount = useMemo(() => {
    const withDisc = dealsWithScore.filter((d) => d.discount_pct != null);
    if (!withDisc.length) return null;
    return Math.round(withDisc.reduce((s, d) => s + d.discount_pct, 0) / withDisc.length);
  }, [dealsWithScore]);

  const filtered = useMemo(() => {
    const threshold = hotOnly ? 8.5 : minScore;
    return dealsWithScore.filter((d) => d.deal_score >= threshold);
  }, [dealsWithScore, minScore, hotOnly]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <Radar className="w-5 h-5 text-amber-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">Deal Radar</h1>
          {!isLoading && (
            <span className="ml-2 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {filtered.length} deals
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Hot Deals"
            value={isLoading ? null : hot_deals}
            icon={<Zap className="w-5 h-5 text-amber-400" />}
            color="amber"
            sub="score ≥ 8.5"
          />
          <StatCard
            label="Good Deals"
            value={isLoading ? null : good_deals}
            icon={<TrendingDown className="w-5 h-5 text-sky-400" />}
            color="sky"
            sub="score 6.5 – 8.4"
          />
          <StatCard
            label="Avg Discount"
            value={isLoading || avg_discount == null ? null : `${avg_discount}%`}
            icon={<BarChart2 className="w-5 h-5 text-emerald-400" />}
            color="emerald"
            sub="vs OMVM fair value"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-700/50 rounded-xl px-5 py-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-slate-500 mb-2">
              Min Deal Score: <span className="text-white font-bold">{hotOnly ? "8.5+" : minScore.toFixed(1)}</span>
            </label>
            <input
              type="range" min={1} max={10} step={0.5}
              value={minScore}
              disabled={hotOnly}
              onChange={(e) => setMinScore(+e.target.value)}
              className="w-full accent-amber-400 disabled:opacity-40"
            />
          </div>
          <button
            onClick={() => setHotOnly((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              hotOnly
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30"
            }`}
          >
            <Zap className="w-4 h-4" />
            Hot deals only
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl bg-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Radar className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">No deals match your filters</p>
            <p className="text-sm mt-1">Try lowering the minimum deal score</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, sub }) {
  const colorMap = {
    amber: "border-amber-500/30 bg-amber-500/5",
    sky: "border-sky-500/30 bg-sky-500/5",
    emerald: "border-emerald-500/30 bg-emerald-500/5",
  };
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-3 ${colorMap[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="p-2 rounded-lg bg-slate-800/60">{icon}</div>
      </div>
      {value == null ? (
        <Skeleton className="h-8 w-20 bg-slate-700" />
      ) : (
        <span className="text-3xl font-bold text-white">{value}</span>
      )}
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}
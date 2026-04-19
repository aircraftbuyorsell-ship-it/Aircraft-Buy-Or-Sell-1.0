import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { avgPriceByMonth, topModels, daysOnMarketByModel, priceDelta, summary } from "@/lib/analytics";
import StatTile from "@/components/analytics/StatTile";
import PriceTrendChart from "@/components/analytics/PriceTrendChart";
import DaysOnMarketChart from "@/components/analytics/DaysOnMarketChart";
import TopModelsTable from "@/components/analytics/TopModelsTable";

export default function Analytics() {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["analytics-listings"],
    queryFn: () => base44.entities.AircraftListing.list("-created_date", 1000),
  });

  const monthly = useMemo(() => avgPriceByMonth(listings, 12), [listings]);
  const models = useMemo(() => topModels(listings, 10), [listings]);
  const dom = useMemo(() => daysOnMarketByModel(listings, 8), [listings]);
  const delta = useMemo(() => priceDelta(monthly), [monthly]);
  const sum = useMemo(() => summary(listings), [listings]);

  const deltaIcon = !delta ? Minus : delta.pct > 0 ? TrendingUp : delta.pct < 0 ? TrendingDown : Minus;
  const deltaColor = !delta ? "#6B6560" : delta.pct > 0 ? "#0F7A56" : delta.pct < 0 ? "#C0392B" : "#6B6560";

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Intelligence · Analytics</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="w-9 h-9 rounded-md bg-[#0B2D5B] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#E8A83A]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight uppercase">Market Analytics</h1>
            <p className="text-[#6B6560] text-sm">Historical pricing trends & inventory liquidity signals</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 md:px-8 pb-10 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white border border-black/[0.05] rounded-2xl animate-pulse" />)}
          </div>
          <div className="h-72 bg-white border border-black/[0.05] rounded-2xl animate-pulse" />
          <div className="h-72 bg-white border border-black/[0.05] rounded-2xl animate-pulse" />
        </div>
      ) : (
        <div className="px-4 md:px-8 pb-12 space-y-5">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile
              label="Total Listings"
              value={sum.total.toLocaleString()}
              sub={`${sum.active} active · ${sum.sold} sold`}
              accent="#0B2D5B"
            />
            <StatTile
              label="Median Price"
              value={sum.medianPrice ? `$${(sum.medianPrice / 1000).toFixed(0)}k` : "—"}
              sub="Across all listings"
              accent="#0B2D5B"
            />
            <StatTile
              label="12-Month Price Change"
              value={
                delta ? (
                  <span style={{ color: deltaColor }} className="inline-flex items-center gap-1">
                    {(() => { const I = deltaIcon; return <I className="w-5 h-5" />; })()}
                    {delta.pct > 0 ? "+" : ""}{delta.pct}%
                  </span>
                ) : "—"
              }
              sub={delta ? `$${(delta.first / 1000).toFixed(0)}k → $${(delta.last / 1000).toFixed(0)}k avg` : "Not enough data"}
              accent={deltaColor}
            />
            <StatTile
              label="Average ATI Score"
              value={sum.avgAti ?? "—"}
              sub={sum.avgAti ? (sum.avgAti >= 85 ? "Strong market" : sum.avgAti >= 65 ? "Fair market" : "Caution") : "No scores yet"}
              accent={sum.avgAti >= 85 ? "#0F7A56" : sum.avgAti >= 65 ? "#E8A83A" : "#C0392B"}
            />
          </div>

          {/* Price trend */}
          <PriceTrendChart data={monthly} />

          {/* Days on market + top models */}
          <div className="grid lg:grid-cols-2 gap-5">
            <DaysOnMarketChart data={dom} />
            <TopModelsTable rows={models} />
          </div>

          {/* Footer note */}
          <p className="text-[10px] text-[#AAA49C] uppercase tracking-wider text-center pt-2">
            Computed live from {sum.total.toLocaleString()} listings · updates with every new record
          </p>
        </div>
      )}
    </div>
  );
}
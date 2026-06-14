import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { avgPriceByMonth, topModels, daysOnMarketByModel, priceDelta, summary } from "@/lib/analytics";
import StatTile from "@/components/analytics/StatTile";
import PriceTrendChart from "@/components/analytics/PriceTrendChart";
import DaysOnMarketChart from "@/components/analytics/DaysOnMarketChart";
import TopModelsTable from "@/components/analytics/TopModelsTable";
import { useTheme } from "@/lib/useTheme";

export default function Analytics() {
  const isDark = useTheme();

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
  const deltaColor = !delta ? (isDark ? "rgba(255,255,255,0.45)" : "#6B6560") : delta.pct > 0 ? "#0F7A56" : delta.pct < 0 ? "#C0392B" : (isDark ? "rgba(255,255,255,0.45)" : "#6B6560");

  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const textColor = isDark ? "#ffffff" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.50)";

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <p className="text-[10px] uppercase tracking-[0.25em] font-black" style={{ color: accentCyan }}>Intelligence · Analytics</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${accentCyan}18`, border: `1px solid ${accentCyan}35` }}>
            <BarChart3 className="w-5 h-5" style={{ color: accentCyan }} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase" style={{ color: textColor }}>Market Analytics</h1>
            <p className="text-sm" style={{ color: mutedColor }}>Historical pricing trends & inventory liquidity signals</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="px-4 md:px-8 pb-10 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse"
                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
            ))}
          </div>
          <div className="h-72 rounded-2xl animate-pulse"
            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
          <div className="h-72 rounded-2xl animate-pulse"
            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
        </div>
      ) : (
        <div className="px-4 md:px-8 pb-12 space-y-5">
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile
              label="Total Listings"
              value={sum.total.toLocaleString()}
              sub={`${sum.active} active · ${sum.sold} sold`}
              accent={accentCyan}
              isDark={isDark}
            />
            <StatTile
              label="Median Price"
              value={sum.medianPrice ? `$${(sum.medianPrice / 1000).toFixed(0)}k` : "—"}
              sub="Across all listings"
              accent={accentCyan}
              isDark={isDark}
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
              isDark={isDark}
            />
            <StatTile
              label="Average ATI Score"
              value={sum.avgAti ?? "—"}
              sub={sum.avgAti ? (sum.avgAti >= 85 ? "Strong market" : sum.avgAti >= 65 ? "Fair market" : "Caution") : "No scores yet"}
              accent={sum.avgAti >= 85 ? "#0F7A56" : sum.avgAti >= 65 ? "#E8A83A" : "#C0392B"}
              isDark={isDark}
            />
          </div>

          {/* Price trend */}
          <PriceTrendChart data={monthly} isDark={isDark} />

          {/* Days on market + top models */}
          <div className="grid lg:grid-cols-2 gap-5">
            <DaysOnMarketChart data={dom} isDark={isDark} />
            <TopModelsTable rows={models} isDark={isDark} />
          </div>

          {/* Footer note */}
          <p className="text-[10px] uppercase tracking-wider text-center pt-2" style={{ color: mutedColor }}>
            Computed live from {sum.total.toLocaleString()} listings · updates with every new record
          </p>
        </div>
      )}
    </div>
  );
}
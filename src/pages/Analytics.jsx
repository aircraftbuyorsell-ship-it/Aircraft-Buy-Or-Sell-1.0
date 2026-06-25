import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Plane, Database, Store, Cpu, Radar, Globe, AlertTriangle,
} from "lucide-react";
import { avgPriceByMonth, topModels, daysOnMarketByModel, priceDelta, summary } from "@/lib/analytics";
import StatTile from "@/components/analytics/StatTile";
import PriceTrendChart from "@/components/analytics/PriceTrendChart";
import DaysOnMarketChart from "@/components/analytics/DaysOnMarketChart";
import TopModelsTable from "@/components/analytics/TopModelsTable";
import RocketMetrics from "@/components/dashboard/RocketMetrics";
import DatabaseCharts from "@/components/dashboard/DatabaseCharts";
import FaaRegistryPanel from "@/components/dashboard/FaaRegistryPanel";
import { useTheme } from "@/lib/useTheme";

const GOLD = "#D4A017";

export default function Analytics() {
  const isDark = useTheme();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["analytics-listings"],
    queryFn: () => base44.entities.AircraftListing.list("-created_date", 1000),
  });

  const { data: faaAircraft = [] } = useQuery({
    queryKey: ["analytics-faa-aircraft"],
    queryFn: () => base44.entities.FAAAircraft.list("-created_date", 5000),
    staleTime: 300000,
  });

  const { data: dealers = [] } = useQuery({
    queryKey: ["analytics-dealers"],
    queryFn: () => base44.entities.DealerLocation.list("-created_date", 5000),
    staleTime: 60000,
  });

  const { data: faaSummary } = useQuery({
    queryKey: ["analytics-faa-summary"],
    queryFn: async () => {
      const res = await base44.functions.invoke("syncFaaFromSupabase", { mode: "registry_summary" });
      return res.data || {};
    },
    staleTime: 300000,
  });

  const faaRegistryTotal = faaSummary?.faaRegistryTotal || 308985;
  const faaAcftrefTotal = faaSummary?.faaAcftrefTotal || 93572;
  const faaAdTotal = faaSummary?.faaAdTotal || 187;
  const faaDealersTotal = faaSummary?.faaDealersTotal || 12507;
  const faaEngineTotal = faaSummary?.faaEngineTotal || 4743;

  const totalListings = listings.length;
  const activeListings = listings.filter((l) => l.status === "active").length;
  const faaSynced = faaSummary?.abosFaaAircraftCount || faaAircraft.length;
  const dealerCount = dealers.length;
  const matchedToFaa = listings.filter((l) => l.registration && /^N/i.test(l.registration)).length;
  const avgAti = listings.length > 0
    ? Math.round(listings.reduce((s, l) => s + (l.ati_score || 0), 0) / listings.length)
    : 0;
  const evaluated = listings.filter((l) => l.ati_score).length;
  const engineEnriched = faaAircraft.filter((f) => f.engine_mfr).length;

  const monthly = useMemo(() => avgPriceByMonth(listings, 12), [listings]);
  const models = useMemo(() => topModels(listings, 10), [listings]);
  const dom = useMemo(() => daysOnMarketByModel(listings, 8), [listings]);
  const delta = useMemo(() => priceDelta(monthly), [monthly]);
  const sum = useMemo(() => summary(listings), [listings]);

  const deltaIcon = !delta ? Minus : delta.pct > 0 ? TrendingUp : delta.pct < 0 ? TrendingDown : Minus;
  const deltaColor = !delta
    ? (isDark ? "rgba(255,255,255,0.45)" : "#6B6560")
    : delta.pct > 0 ? "#5dcaa5"
    : delta.pct < 0 ? "#e24b4a"
    : (isDark ? "rgba(255,255,255,0.45)" : "#6B6560");

  const textColor = isDark ? "#ffffff" : "#1A1814";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "#6B6560";
  const cardBg = isDark ? "#111827" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <p className="text-[10px] uppercase tracking-[0.25em] font-black" style={{ color: GOLD }}>
          Intelligence · Analytics
        </p>
        <div className="flex items-center gap-3 mt-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${GOLD}18`, border: `0.5px solid ${GOLD}35` }}
          >
            <BarChart3 className="w-5 h-5" style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase" style={{ color: textColor }}>
              Market Analytics
            </h1>
            <p className="text-sm" style={{ color: mutedColor }}>
              Historical pricing trends & inventory liquidity signals
            </p>
          </div>
        </div>
      </div>

      {/* DATABASE & REGISTRY INTELLIGENCE */}
      {!isLoading && (
        <div className="px-4 md:px-8 pb-5 space-y-5">
          <p className="text-[10px] tracking-[0.18em] font-bold" style={{ color: GOLD }}>
            DATABASE & REGISTRY INTELLIGENCE
          </p>
          <RocketMetrics
            metrics={[
              { icon: Plane, label: "Aircraft Register", value: activeListings.toLocaleString(), sub: `${totalListings.toLocaleString()} total · ${evaluated} ATI scored · avg ${avgAti}`, link: "/listings", color: "#f48120" },
              { icon: Database, label: "FAA Registry Sync", value: `${faaSynced.toLocaleString()} / ${faaRegistryTotal.toLocaleString()}`, sub: `${matchedToFaa} N‑reg matched · ${faaSynced > 0 ? Math.round((faaSynced / faaRegistryTotal) * 100) : 0}% synced`, link: "/admin/supabase-sync", color: GOLD },
              { icon: Store, label: "Dealer Network", value: dealerCount.toLocaleString(), sub: `ABOS sync · ${faaDealersTotal.toLocaleString()} FAA certified`, link: "/admin/supabase-sync", color: "#06b6d4" },
              { icon: Cpu, label: "Engine Enrichment", value: `${engineEnriched.toLocaleString()} / ${faaSynced.toLocaleString()}`, sub: `${faaSynced > 0 ? Math.round((engineEnriched / faaSynced) * 100) : 0}% with engine data`, link: "/admin/supabase-sync", color: "#8b5cf6" },
              { icon: TrendingUp, label: "ACFTREF Database", value: faaAcftrefTotal.toLocaleString(), sub: "Make / model codes · feeds listing enrichment", link: "/admin/supabase-sync", color: "#f59e0b" },
              { icon: Radar, label: "FAA Engine Specs", value: faaEngineTotal.toLocaleString(), sub: "Engine manufacturer + model data", link: "/admin/supabase-sync", color: "#22c55e" },
              { icon: AlertTriangle, label: "Airworthiness Dir.", value: faaAdTotal.toLocaleString(), sub: "FAA regulatory directives", link: "/admin/supabase-sync", color: "#ec4899" },
              { icon: Globe, label: "Global Live Traffic", value: "ADS‑B + DB", sub: "Real‑time tracking · globe + map", link: "/traffic", color: "#14b8a6" },
            ]}
          />
          <div
            className="rounded-xl p-5"
            style={{ background: cardBg, border: `0.5px solid ${cardBorder}` }}
          >
            <DatabaseCharts
              faaAircraft={faaAircraft}
              listings={listings}
              matchedCount={matchedToFaa}
              faaTotalRegistry={faaRegistryTotal}
              faaAcftrefTotal={faaAcftrefTotal}
              faaAdTotal={faaAdTotal}
              faaDealersTotal={faaDealersTotal}
              faaEngineTotal={faaEngineTotal}
            />
          </div>
          <FaaRegistryPanel />
        </div>
      )}

      {isLoading ? (
        <div className="px-4 md:px-8 pb-10 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl animate-pulse"
                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
              />
            ))}
          </div>
          <div
            className="h-72 rounded-2xl animate-pulse"
            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
          />
          <div
            className="h-72 rounded-2xl animate-pulse"
            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
          />
        </div>
      ) : (
        <div className="px-4 md:px-8 pb-12 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatTile
              label="Total Listings"
              value={sum.total.toLocaleString()}
              sub={`${sum.active} active · ${sum.sold} sold`}
              accent={GOLD}
              isDark={isDark}
            />
            <StatTile
              label="Median Price"
              value={sum.medianPrice ? `$${(sum.medianPrice / 1000).toFixed(0)}k` : "—"}
              sub="Across all listings"
              accent={GOLD}
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
              accent={sum.avgAti >= 85 ? "#5dcaa5" : sum.avgAti >= 65 ? GOLD : "#e24b4a"}
              isDark={isDark}
            />
          </div>

          <PriceTrendChart data={monthly} isDark={isDark} />

          <div className="grid lg:grid-cols-2 gap-5">
            <DaysOnMarketChart data={dom} isDark={isDark} />
            <TopModelsTable rows={models} isDark={isDark} />
          </div>

          <p className="text-[10px] uppercase tracking-wider text-center pt-2" style={{ color: mutedColor }}>
            Computed live from {sum.total.toLocaleString()} listings · updates with every new record
          </p>
        </div>
      )}
    </div>
  );
}
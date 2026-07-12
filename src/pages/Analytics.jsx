import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  BarChart3, Plane, Database, TrendingUp, ShieldCheck, DollarSign, Activity, ChevronDown, Server,
} from "lucide-react";
import PriceTrendChart from "@/components/analytics/PriceTrendChart";
import DaysOnMarketChart from "@/components/analytics/DaysOnMarketChart";
import TopModelsTable from "@/components/analytics/TopModelsTable";
import MarketInsightCard from "@/components/analytics/MarketInsightCard";
import DatabaseCharts from "@/components/dashboard/DatabaseCharts";
import FaaRegistryPanel from "@/components/dashboard/FaaRegistryPanel";
import HeroHeader from "@/components/intelligence/HeroHeader";
import SectionHeader from "@/components/intelligence/SectionHeader";
import SummaryCard from "@/components/intelligence/SummaryCard";
import MetricCard from "@/components/intelligence/MetricCard";
import LoadingSkeleton from "@/components/intelligence/LoadingSkeleton";
import { useTheme } from "@/lib/useTheme";

const GOLD = "#D4A017";

export default function Analytics() {
  const isDark = useTheme();
  const [showInfra, setShowInfra] = useState(false);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["market-analytics"],
    queryFn: async () => {
      const res = await base44.functions.invoke("computeMarketAnalytics", {});
      return res.data || res;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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

  const sum = analytics?.summary || { total: 0, active: 0, sold: 0, avgAti: null, medianPrice: null };
  const monthly = analytics?.monthly || [];
  const models = analytics?.topModels || [];
  const dom = analytics?.daysOnMarket || [];
  const delta = analytics?.delta || null;

  const faaSynced = faaSummary?.abosFaaAircraftCount || faaAircraft.length;
  const matchedToFaa = faaAircraft.filter((f) => f.n_number).length;
  const engineEnriched = faaAircraft.filter((f) => f.engine_mfr).length;
  const avgAti = sum.avgAti || 0;

  return (
    <div className="min-h-screen dot-grid bg-canvas text-foreground">
      <HeroHeader
        eyebrow="ABOS Intelligence · Analytics"
        icon={BarChart3}
        title="Executive Intelligence"
        titleAccent="Dashboard"
        subtitle="Market performance, verification growth, registry coverage and pricing trends — computed live from platform data."
      />

      <div className="px-4 md:px-8 pb-12 max-w-6xl mx-auto space-y-8">
        {/* Summary cards */}
        {isLoading ? (
          <LoadingSkeleton variant="cards" count={6} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <SummaryCard icon={Plane} label="Total Listings" value={sum.total.toLocaleString()} sub={`${sum.active} active · ${sum.sold} sold`} />
            <SummaryCard icon={Activity} label="Active Market" value={sum.active.toLocaleString()} accent="text-emerald-600 dark:text-emerald-400" sub="Live inventory" />
            <SummaryCard icon={DollarSign} label="Median Price" value={sum.medianPrice ? `$${(sum.medianPrice / 1000).toFixed(0)}k` : "—"} accent="text-gold-official" sub="Across all listings" />
            <MetricCard label="12-Mo Price Change" value={delta ? `${delta.pct > 0 ? "+" : ""}${delta.pct}%` : "—"}
              trend={delta ? delta.pct : null}
              sub={delta ? `$${(delta.first / 1000).toFixed(0)}k → $${(delta.last / 1000).toFixed(0)}k avg` : "Not enough data"}
              accent="text-foreground" />
            <SummaryCard icon={ShieldCheck} label="Avg Transparency" value={sum.avgAti ?? "—"}
              accent={avgAti >= 85 ? "text-emerald-600 dark:text-emerald-400" : avgAti >= 65 ? "text-gold-official" : "text-red-600 dark:text-red-400"}
              sub={sum.avgAti ? (avgAti >= 85 ? "Strong market" : avgAti >= 65 ? "Fair market" : "Caution") : "No scores yet"} />
          </div>
        )}

        {/* Market trend charts */}
        {isLoading ? (
          <LoadingSkeleton variant="block" height="h-72" />
        ) : (
          <div className="space-y-5">
            <SectionHeader eyebrow="Market Trends" title="Pricing & Liquidity" sub="Historical pricing trends and inventory liquidity signals" />
            <PriceTrendChart data={monthly} isDark={isDark} />
            <div className="grid lg:grid-cols-2 gap-5">
              <DaysOnMarketChart data={dom} isDark={isDark} />
              <TopModelsTable rows={models} isDark={isDark} />
            </div>
          </div>
        )}

        {/* AI market insights */}
        {!isLoading && (
          <div>
            <SectionHeader eyebrow="ABOS Intelligence" title="AI Market Insights" sub="Generated market intelligence from live platform data" />
            <MarketInsightCard isDark={isDark} />
          </div>
        )}

        {/* Data Infrastructure — collapsible (admin/devops) */}
        {!isLoading && (
          <div className="space-y-4">
            <button
              onClick={() => setShowInfra((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gold-bg border border-gold/20">
                  <Server className="w-4 h-4 text-gold-official" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Data Infrastructure (Admin)</p>
                  <p className="text-[11px] text-muted-foreground">Registry coverage, engine enrichment & sync health</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  {faaSynced.toLocaleString()} FAA synced
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showInfra ? "rotate-180" : ""}`} />
              </div>
            </button>

            {showInfra && (
              <div className="space-y-5 animate-accordion-down">
                <SummaryCard icon={Database} label="FAA Synced" value={faaSynced.toLocaleString()}
                  sub={`${faaSynced > 0 ? Math.round((faaSynced / faaRegistryTotal) * 100) : 0}% of registry`} accent="text-gold-official" />
                <div className="glass-card p-5">
                  <DatabaseCharts
                    faaAircraft={faaAircraft}
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
          </div>
        )}

        {!isLoading && (
          <p className="text-[10px] uppercase tracking-wider text-center text-muted-foreground">
            Computed {analytics?.cached ? "from cache" : "live"} from {sum.total.toLocaleString()} listings · {analytics?.cached ? "refreshes every 5 min" : "updates with every new record"}
          </p>
        )}
      </div>
    </div>
  );
}
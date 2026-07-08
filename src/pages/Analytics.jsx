import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  BarChart3, Plane, Database, Store, Cpu, Radar, Globe, AlertTriangle, TrendingUp, ShieldCheck, DollarSign, Activity,
} from "lucide-react";
import PriceTrendChart from "@/components/analytics/PriceTrendChart";
import DaysOnMarketChart from "@/components/analytics/DaysOnMarketChart";
import TopModelsTable from "@/components/analytics/TopModelsTable";
import MarketInsightCard from "@/components/analytics/MarketInsightCard";
import RocketMetrics from "@/components/dashboard/RocketMetrics";
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
            <SummaryCard icon={Database} label="FAA Synced" value={faaSynced.toLocaleString()}
              sub={`${faaSynced > 0 ? Math.round((faaSynced / faaRegistryTotal) * 100) : 0}% of registry`} accent="text-gold-official" />
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

        {/* Database & registry intelligence */}
        {!isLoading && (
          <div className="space-y-5">
            <SectionHeader eyebrow="Data Infrastructure" title="Database & Registry Intelligence" sub="Registry coverage, enrichment and sync health" />
            <RocketMetrics
              metrics={[
                { icon: Plane, label: "Aircraft Register", value: sum.active.toLocaleString(), sub: `${sum.total.toLocaleString()} total · ${engineEnriched} ATI scored · avg ${avgAti}`, link: "/listings", color: "#f48120" },
                { icon: Database, label: "FAA Registry Sync", value: `${faaSynced.toLocaleString()} / ${faaRegistryTotal.toLocaleString()}`, sub: `${matchedToFaa} N‑reg matched · ${faaSynced > 0 ? Math.round((faaSynced / faaRegistryTotal) * 100) : 0}% synced`, link: "/admin/supabase-sync", color: GOLD },
                { icon: Store, label: "Dealer Network", value: dealers.length.toLocaleString(), sub: `ABOS sync · ${faaDealersTotal.toLocaleString()} FAA certified`, link: "/admin/supabase-sync", color: "#06b6d4" },
                { icon: Cpu, label: "Engine Enrichment", value: `${engineEnriched.toLocaleString()} / ${faaSynced.toLocaleString()}`, sub: `${faaSynced > 0 ? Math.round((engineEnriched / faaSynced) * 100) : 0}% with engine data`, link: "/admin/supabase-sync", color: "#8b5cf6" },
                { icon: TrendingUp, label: "ACFTREF Database", value: faaAcftrefTotal.toLocaleString(), sub: "Make / model codes · feeds listing enrichment", link: "/admin/supabase-sync", color: "#f59e0b" },
                { icon: Radar, label: "FAA Engine Specs", value: faaEngineTotal.toLocaleString(), sub: "Engine manufacturer + model data", link: "/admin/supabase-sync", color: "#22c55e" },
                { icon: AlertTriangle, label: "Airworthiness Dir.", value: faaAdTotal.toLocaleString(), sub: "FAA regulatory directives", link: "/admin/supabase-sync", color: "#ec4899" },
                { icon: Globe, label: "Global Live Traffic", value: "ADS‑B + DB", sub: "Real‑time tracking · globe + map", link: "/traffic", color: "#14b8a6" },
              ]}
            />
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

        {!isLoading && (
          <p className="text-[10px] uppercase tracking-wider text-center text-muted-foreground">
            Computed {analytics?.cached ? "from cache" : "live"} from {sum.total.toLocaleString()} listings · {analytics?.cached ? "refreshes every 5 min" : "updates with every new record"}
          </p>
        )}
      </div>
    </div>
  );
}
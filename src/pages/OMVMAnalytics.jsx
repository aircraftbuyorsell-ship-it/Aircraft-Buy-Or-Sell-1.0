import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calculator, Loader2, TrendingUp, Cpu } from "lucide-react";
import DepreciationCurveChart from "@/components/omvm/DepreciationCurveChart";
import MarketDemandChart from "@/components/omvm/MarketDemandChart";
import ProjectionChart from "@/components/omvm/ProjectionChart";
import ExpertInterventionPanel from "@/components/omvm/ExpertInterventionPanel";

function StatTile({ label, value, hint, color = "#1A1814" }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-3">
      <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">{label}</p>
      <p className="text-lg font-black mt-1" style={{ color }}>{value}</p>
      {hint && <p className="text-[10px] text-[#6B6560] mt-0.5">{hint}</p>}
    </div>
  );
}

export default function OMVMAnalytics() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [targetId, setTargetId] = useState("");
  const [horizon, setHorizon] = useState(5);

  const { data: listings = [] } = useQuery({
    queryKey: ["omvm-listings-options"],
    queryFn: () => base44.entities.AircraftListing.list("-created_date", 500),
  });

  const makes = useMemo(() => [...new Set(listings.map((l) => l.make).filter(Boolean))].sort(), [listings]);
  const models = useMemo(
    () => [...new Set(listings.filter((l) => !make || l.make === make).map((l) => l.model).filter(Boolean))].sort(),
    [listings, make]
  );
  const targetOptions = useMemo(
    () => listings.filter((l) => (!make || l.make === make) && (!model || l.model === model)).slice(0, 100),
    [listings, make, model]
  );

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["omvm-analytics", make, model, targetId, horizon],
    queryFn: async () => {
      const res = await base44.functions.invoke("computeOMVMAnalytics", {
        make: make || undefined,
        model: model || undefined,
        targetListingId: targetId || undefined,
        horizonYears: Number(horizon),
      });
      return res.data;
    },
  });

  const modelOMVM = data?.projection?.[0]?.projected_value || null;

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#E8A83A]" />
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#E8A83A]">OMVM Analytics · Hybrid Engine</p>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight mt-1">
          Depreciation & Future Valuation
        </h1>
        <p className="text-[#6B6560] text-sm mt-0.5">
          Data-driven regressions on historical listings × engine time remaining × market demand × expert calibration loop.
        </p>
      </div>

      {/* Filters */}
      <div className="px-4 md:px-8 pb-5">
        <div className="bg-white border border-black/[0.07] rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">Make</label>
            <select value={make} onChange={(e) => { setMake(e.target.value); setModel(""); setTargetId(""); }}
              className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm">
              <option value="">All makes</option>
              {makes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">Model</label>
            <select value={model} onChange={(e) => { setModel(e.target.value); setTargetId(""); }}
              className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm">
              <option value="">All models</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">Target Listing</label>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm">
              <option value="">— none —</option>
              {targetOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.year} {l.make} {l.model} {l.registration ? `· ${l.registration}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">Horizon (yrs)</label>
            <input type="number" min={1} max={15} value={horizon} onChange={(e) => setHorizon(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm" />
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-10 space-y-4 max-w-6xl">
        {isLoading ? (
          <div className="bg-white border border-black/[0.07] rounded-2xl p-10 flex items-center justify-center gap-2 text-[#6B6560]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Running regression on historical data…</span>
          </div>
        ) : !data ? (
          <p className="text-sm text-[#AAA49C]">No data.</p>
        ) : (
          <>
            {/* Top stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile label="Sample Size" value={data.sample_size} hint="Historical listings" color="#0B2D5B" />
              <StatTile label="Annual Depreciation" value={`${data.depreciation.annual_pct}%`} hint={`R² ${data.depreciation.r2}`} color="#C0392B" />
              <StatTile label="Demand Trend (6mo)" value={`${data.market_demand.trend_pct >= 0 ? "+" : ""}${data.market_demand.trend_pct}%`}
                hint={`Avg ${data.market_demand.avg_monthly} /mo`} color={data.market_demand.trend_pct >= 0 ? "#0F7A56" : "#C0392B"} />
              <StatTile label="Expert Multiplier" value={`×${data.expert_calibration.multiplier}`}
                hint={`${data.expert_calibration.sample} reviews`} color="#E8A83A" />
            </div>

            {/* Charts grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <DepreciationCurveChart
                data={data.depreciation.curve}
                annualPct={data.depreciation.annual_pct}
                r2={data.depreciation.r2}
              />
              <MarketDemandChart
                monthly={data.market_demand.monthly}
                trendPct={data.market_demand.trend_pct}
                avgMonthly={data.market_demand.avg_monthly}
              />
            </div>

            {/* Engine impact */}
            <div className="bg-white border border-black/[0.07] rounded-2xl p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[rgba(11,45,91,0.08)] flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5 text-[#0B2D5B]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Engine Time Remaining Impact</p>
                <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">
                  +${Math.abs(data.engine_impact.value_per_10pct_remaining).toLocaleString()} per 10% engine life
                </h3>
                <p className="text-[11px] text-[#6B6560] mt-1">
                  Linear regression coefficient · R² {data.engine_impact.r2}. Drives projection adjustments as hours accrue.
                </p>
              </div>
            </div>

            {/* Projection */}
            <ProjectionChart projection={data.projection} target={data.target} />

            {/* Expert panel (Option 3 feedback loop) */}
            <ExpertInterventionPanel
              target={data.target}
              modelOMVM={modelOMVM}
              calibration={data.expert_calibration}
            />

            {/* Refresh */}
            <div className="flex justify-end">
              <button onClick={() => refetch()} disabled={isFetching}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-black text-[#6B6560] hover:text-[#0B2D5B] disabled:opacity-50">
                <TrendingUp className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
                Recompute
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
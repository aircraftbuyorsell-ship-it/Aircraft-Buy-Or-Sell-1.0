import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Sparkles, TrendingUp, TrendingDown, Minus, Zap, AlertCircle,
  RefreshCw, ArrowRight, Radar, Loader2,
} from "lucide-react";

function DirectionIcon({ direction }) {
  if (direction === "up") return <TrendingUp className="w-3.5 h-3.5 text-[#0F7A56]" />;
  if (direction === "down") return <TrendingDown className="w-3.5 h-3.5 text-[#C0392B]" />;
  return <Minus className="w-3.5 h-3.5 text-[#6B6560]" />;
}

function ConfidenceDots({ score = 3 }) {
  const n = Math.max(1, Math.min(5, Math.round(score)));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className={`w-1 h-1 rounded-full ${i <= n ? "bg-[#E8A83A]" : "bg-black/10"}`}
        />
      ))}
    </div>
  );
}

function SectionTitle({ icon: Icon, label, accent = "#0B2D5B" }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
      <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: accent }}>
        {label}
      </p>
    </div>
  );
}

export default function AIInsightsPanel() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["market-insights"],
    queryFn: async () => {
      const res = await base44.functions.invoke("generateMarketInsights", {});
      return res.data;
    },
    staleTime: 15 * 60 * 1000,
    retry: false,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <aside className="bg-white border border-black/[0.08] rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#0B2D5B] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-[#E8A83A] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#0B2D5B]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">AI Market Intelligence</p>
            <p className="text-[12px] font-black uppercase tracking-tight truncate">Live Insights</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || isLoading}
          className="text-white/60 hover:text-[#E8A83A] disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing || isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-[#6B6560]">
            <Loader2 className="w-6 h-6 animate-spin text-[#E8A83A] mb-2" />
            <p className="text-[11px] uppercase tracking-wider font-semibold">Analyzing market signals…</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex items-start gap-2 bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.18)] rounded-md p-3 text-[#C0392B]">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-bold">Unable to generate insights</p>
              <p className="text-[10px] text-[#6B6560] mt-0.5">Try again in a moment.</p>
            </div>
          </div>
        )}

        {/* Content */}
        {data && !isLoading && (
          <>
            {/* Summary */}
            {data.summary && (
              <div className="bg-[#F7F4EF] border border-black/[0.05] rounded-md p-3">
                <p className="text-[11px] text-[#1A1814] leading-relaxed italic">{data.summary}</p>
              </div>
            )}

            {/* Snapshot chips */}
            {data.snapshot && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Listings", value: data.snapshot.totalListings, color: "#0B2D5B" },
                  { label: "Hot", value: data.snapshot.hotDeals, color: "#E8A83A" },
                  { label: "Avg ATI", value: data.snapshot.avgAti, color: "#0F7A56" },
                  { label: "Escrows", value: data.snapshot.activeEscrows, color: "#185FA5" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1 text-[10px] bg-white border border-black/[0.08] rounded-full px-2 py-0.5">
                    <span className="font-black" style={{ color: s.color }}>{s.value}</span>
                    <span className="text-[#6B6560] uppercase tracking-wider font-semibold">{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Trending Models */}
            {data.trending_models?.length > 0 && (
              <div>
                <SectionTitle icon={TrendingUp} label="Trending Models" accent="#0B2D5B" />
                <div className="space-y-2">
                  {data.trending_models.slice(0, 4).map((t, i) => (
                    <div key={i} className="bg-white border border-black/[0.06] rounded-md p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <DirectionIcon direction={t.direction} />
                          <p className="text-[12px] font-black text-[#1A1814] truncate">{t.model}</p>
                        </div>
                        <ConfidenceDots score={t.confidence} />
                      </div>
                      <p className="text-[10px] text-[#6B6560] mt-1 leading-relaxed">{t.signal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buy Alerts */}
            {data.buy_alerts?.length > 0 && (
              <div>
                <SectionTitle icon={Zap} label="Buy Alerts" accent="#E8A83A" />
                <div className="space-y-2">
                  {data.buy_alerts.slice(0, 3).map((a, i) => (
                    <div key={i} className="bg-[rgba(232,168,58,0.06)] border border-[rgba(232,168,58,0.25)] rounded-md p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[12px] font-black text-[#1A1814] truncate flex-1">{a.aircraft}</p>
                        <ConfidenceDots score={a.confidence} />
                      </div>
                      <p className="text-[10px] text-[#6B6560] mt-1 leading-relaxed">{a.reason}</p>
                      {a.listing_id && (
                        <Link
                          to={`/ati-passport/${a.listing_id}`}
                          className="inline-flex items-center gap-0.5 text-[10px] text-[#0B2D5B] font-black uppercase tracking-wider mt-1.5 hover:text-[#E8A83A]"
                        >
                          View ATI <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Shifts */}
            {data.market_shifts?.length > 0 && (
              <div>
                <SectionTitle icon={Radar} label="Market Shifts" accent="#185FA5" />
                <ul className="space-y-1.5">
                  {data.market_shifts.slice(0, 3).map((s, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-[#4A4845] leading-relaxed">
                      <span className="shrink-0 w-1 h-1 rounded-full mt-1.5 bg-[#185FA5]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[9px] text-[#AAA49C] uppercase tracking-wider pt-1 border-t border-black/[0.05]">
              {data.cached ? "Cached · refreshes every 15 min" : "Generated just now"}
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
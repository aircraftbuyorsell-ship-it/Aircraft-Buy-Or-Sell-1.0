import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

const GOLD = "#D4A017";

export default function MarketInsightCard({ isDark }) {
  const [refetchKey, setRefetchKey] = useState(0);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["market-insights", refetchKey],
    queryFn: async () => {
      const res = await base44.functions.invoke("generateMarketInsights", {});
      return res.data || res;
    },
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const textColor = "rgba(255,255,255,0.90)";
  const mutedColor = "rgba(255,255,255,0.55)";
  const cardBg = "rgba(255,255,255,0.04)";
  const cardBorder = "rgba(255,255,255,0.08)";

  const dirIcon = (dir) => dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;
  const dirColor = (dir) => dir === 'up' ? '#5dcaa5' : dir === 'down' ? '#e24b4a' : mutedColor;

  return (
    <div className="rounded-2xl p-5" style={{ background: cardBg, border: `0.5px solid ${cardBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${GOLD}18`, border: `0.5px solid ${GOLD}35` }}>
            <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: textColor }}>AI Market Intelligence</h3>
            <p className="text-[10px]" style={{ color: mutedColor }}>
              {data?.cached ? "Cached" : "Fresh"} · {data?.generated_at ? new Date(data.generated_at).toLocaleTimeString() : "—"}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setRefetchKey(k => k + 1); refetch(); }}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-opacity"
          style={{ background: `${GOLD}12`, border: `0.5px solid ${GOLD}25`, color: GOLD, opacity: isFetching ? 0.5 : 1 }}
        >
          <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }} />
          ))}
        </div>
      ) : data ? (
        <div className="space-y-4">
          {data.summary && (
            <p className="text-[13px] leading-relaxed" style={{ color: textColor }}>
              {data.summary}
            </p>
          )}

          {data.trending_models?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2" style={{ color: GOLD }}>Trending Models</p>
              <div className="space-y-2">
                {data.trending_models.slice(0, 4).map((m, i) => {
                  const I = dirIcon(m.direction);
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <I className="w-4 h-4 mt-0.5 shrink-0" style={{ color: dirColor(m.direction) }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold" style={{ color: textColor }}>{m.model}</p>
                        <p className="text-[11px]" style={{ color: mutedColor }}>{m.signal}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.market_shifts?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2" style={{ color: GOLD }}>Market Shifts</p>
              <div className="space-y-1.5">
                {data.market_shifts.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: mutedColor }} />
                    <p className="text-[11px] leading-relaxed" style={{ color: mutedColor }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.fallback && (
            <p className="text-[10px] italic" style={{ color: mutedColor }}>
              AI engine unavailable — showing rule-based fallback signals.
            </p>
          )}
        </div>
      ) : (
        <p className="text-[12px]" style={{ color: mutedColor }}>Unable to load market insights.</p>
      )}
    </div>
  );
}
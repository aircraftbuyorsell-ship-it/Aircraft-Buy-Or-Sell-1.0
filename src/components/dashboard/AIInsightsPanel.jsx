import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  TrendingUp, Sparkles, Plane, ShieldCheck, Loader2, ArrowRight,
} from "lucide-react";

function StatChip({ label, value, color }) {
  return (
    <div className="flex items-center gap-1 text-[10px] bg-white border border-black/[0.08] rounded-full px-2 py-0.5">
      <span className="font-black" style={{ color }}>{value}</span>
      <span className="text-[#6B6560] uppercase tracking-wider font-semibold">{label}</span>
    </div>
  );
}

function TopModelRow({ name, count, color }) {
  return (
    <div className="bg-white border border-black/[0.06] rounded-md p-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <Plane className="w-3 h-3 shrink-0" style={{ color }} />
          <p className="text-[12px] font-black text-[#1A1814] truncate">{name}</p>
        </div>
        <span className="text-[11px] font-bold" style={{ color }}>{count}</span>
      </div>
    </div>
  );
}

function HotDealRow({ d }) {
  return (
    <div className="bg-[rgba(232,168,58,0.06)] border border-[rgba(232,168,58,0.25)] rounded-md p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-black text-[#1A1814] truncate">{d.aircraft}</p>
          <p className="text-[10px] text-[#6B6560] mt-0.5 leading-relaxed">
            Score {d.ati_score || "—"} · {(d.discount_pct || 0) >= 0 ? "▼" : "▲"}{Math.abs(d.discount_pct || 0)}%
          </p>
        </div>
      </div>
      {d.id && (
        <Link
          to={`/ati-passport/${d.id}`}
          className="inline-flex items-center gap-0.5 text-[10px] text-[#0B2D5B] font-black uppercase tracking-wider mt-1.5 hover:text-[#E8A83A]"
        >
          View ATI <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function SectionTitle({ label, accent = "#0B2D5B" }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.15em] font-black mb-2" style={{ color: accent }}>
      {label}
    </p>
  );
}

export default function AIInsightsPanel() {
  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active", visibility: "public" }, "-ati_score", 200),
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["deal-radar-list"],
    queryFn: () => base44.entities.DealRadar.list("-deal_score", 20),
  });

  const { data: escrows = [] } = useQuery({
    queryKey: ["escrow-active"],
    queryFn: () => base44.entities.EscrowTransaction.list("-created_date", 50),
  });

  const isLoading = loadingListings;

  const computed = useMemo(() => {
    if (!listings.length) return null;

    const scored = listings.filter(l => l.ati_score);
    const avgAti = scored.length > 0
      ? Math.round(scored.reduce((s, l) => s + (l.ati_score || 0), 0) / scored.length)
      : 0;
    const hotDeals = deals.filter(d => (d.deal_score || 0) >= 8.5);
    const activeEscrows = escrows.filter(e => !["closed", "cancelled"].includes(e.status)).length;

    // Top makes by count
    const makeCounts = {};
    listings.forEach(l => {
      if (l.make) makeCounts[l.make] = (makeCounts[l.make] || 0) + 1;
    });
    const topMakes = Object.entries(makeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // Top models
    const modelCounts = {};
    listings.forEach(l => {
      const key = `${l.make || ""} ${l.model || ""}`.trim();
      if (key) modelCounts[key] = (modelCounts[key] || 0) + 1;
    });
    const topModels = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Price range
    const prices = listings.filter(l => l.asking_price).map(l => l.asking_price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

    // Summary
    const summary = avgAti >= 80
      ? `Market showing strong transparency with an average ATI score of ${avgAti}. ${hotDeals.length} aircraft flagged as hot deals — strong buyer opportunity.`
      : avgAti >= 60
      ? `Steady market conditions across ${listings.length} active listings. Average ATI score of ${avgAti} indicates moderate transparency.`
      : `${listings.length} aircraft on the market. ATI scoring coverage is building — ${scored.length} evaluated so far.`;

    return {
      totalListings: listings.length,
      scoredCount: scored.length,
      avgAti,
      hotDeals,
      activeEscrows,
      topMakes,
      topModels,
      minPrice,
      maxPrice,
      summary,
      snapshot: {
        totalListings: listings.length,
        scored: scored.length,
        avgAti,
        hotDeals: hotDeals.length,
        activeEscrows,
      },
      trending_models: topModels.map(([name, count]) => ({
        model: name,
        direction: "up",
        signal: `${count} listing${count > 1 ? "s" : ""} active`,
        confidence: Math.min(5, count),
      })),
      buy_alerts: hotDeals.slice(0, 3).map(d => ({
        aircraft: d.listing ? `Deal Score ${d.deal_score}` : "—",
        reason: d.deal_label || "Below market",
        listing_id: d.listing,
        ati_score: d.ati_score,
        discount_pct: d.discount_pct,
        confidence: 4,
        id: d.listing,
      })),
      market_shifts: [
        `${scored.length} of ${listings.length} listings ATI-evaluated`,
        prices.length > 0 ? `Price range: $${minPrice?.toLocaleString()} — $${maxPrice?.toLocaleString()}` : "No prices listed yet",
        activeEscrows > 0 ? `${activeEscrows} active escrow transactions` : "No active escrow transactions",
      ],
    };
  }, [listings, deals, escrows]);

  return (
    <aside className="bg-white border border-black/[0.08] rounded-lg shadow-sm overflow-hidden">
      <div className="bg-[#0B2D5B] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-[#E8A83A] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#0B2D5B]" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">Market Intelligence</p>
            <p className="text-[12px] font-black uppercase tracking-tight truncate">Live Overview</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-[#6B6560]">
            <Loader2 className="w-6 h-6 animate-spin text-[#E8A83A] mb-2" />
            <p className="text-[11px] uppercase tracking-wider font-semibold">Loading market data…</p>
          </div>
        ) : !computed ? (
          <div className="flex flex-col items-center justify-center py-8 text-[#AAA49C]">
            <ShieldCheck className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-[11px] font-semibold">No market data yet</p>
            <p className="text-[10px] mt-0.5">Add aircraft listings to see insights</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="bg-[#F7F4EF] border border-black/[0.05] rounded-md p-3">
              <p className="text-[11px] text-[#1A1814] leading-relaxed italic">{computed.summary}</p>
            </div>

            {/* Snapshot chips */}
            <div className="flex flex-wrap gap-1.5">
              <StatChip label="Listings" value={computed.snapshot.totalListings} color="#0B2D5B" />
              <StatChip label="Scored" value={computed.snapshot.scored} color="#0F7A56" />
              {computed.avgAti > 0 && <StatChip label="Avg ATI" value={computed.avgAti} color="#185FA5" />}
              <StatChip label="Hot" value={computed.hotDeals.length} color="#E8A83A" />
              {computed.activeEscrows > 0 && <StatChip label="Escrows" value={computed.activeEscrows} color="#CD7F32" />}
            </div>

            {/* Top Models */}
            {computed.trending_models.length > 0 && (
              <div>
                <SectionTitle label="Top Models" accent="#0B2D5B" />
                <div className="space-y-2">
                  {computed.trending_models.map((t, i) => (
                    <TopModelRow key={i} name={t.model} count={t.confidence} color={i === 0 ? "#0B2D5B" : i === 1 ? "#185FA5" : "#6B6560"} />
                  ))}
                </div>
              </div>
            )}

            {/* Buy Alerts (hot deals) */}
            {computed.buy_alerts.length > 0 && (
              <div>
                <SectionTitle label="Buy Alerts" accent="#E8A83A" />
                <div className="space-y-2">
                  {computed.buy_alerts.map((a, i) => (
                    <HotDealRow key={i} d={a} />
                  ))}
                </div>
              </div>
            )}

            {/* Market Shifts */}
            {computed.market_shifts.length > 0 && (
              <div>
                <SectionTitle label="Market Overview" accent="#185FA5" />
                <ul className="space-y-1.5">
                  {computed.market_shifts.map((s, i) => (
                    <li key={i} className="flex gap-2 text-[11px] text-[#4A4845] leading-relaxed">
                      <span className="shrink-0 w-1 h-1 rounded-full mt-1.5 bg-[#185FA5]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[9px] text-[#AAA49C] uppercase tracking-wider pt-1 border-t border-black/[0.05]">
              Computed from live listing data · always available
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
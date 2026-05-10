import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { Zap, TrendingDown, BarChart2, Radar, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

function StatCard({ label, value, icon: Icon, sub, loading }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#AAA49C]">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-[#F7F4EF] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#D4A017]" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-black/5 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-black text-[#1A1814]">{value ?? "—"}</p>
      )}
      {sub && <p className="text-[11px] text-[#AAA49C] mt-1">{sub}</p>}
    </div>
  );
}

function DealCard({ deal }) {
  const score = deal.deal_score;
  const label = (deal.deal_label || "").toLowerCase();

  const scoreStyle = score >= 8.5
    ? { bg: "rgba(212,160,23,0.08)", border: "rgba(212,160,23,0.25)", text: "#A67C00", barColor: "#D4A017" }
    : score >= 6.5
    ? { bg: "rgba(15,122,86,0.06)", border: "rgba(15,122,86,0.2)", text: "#0F7A56", barColor: "#0F7A56" }
    : score >= 5
    ? { bg: "rgba(24,95,165,0.06)", border: "rgba(24,95,165,0.2)", text: "#185FA5", barColor: "#185FA5" }
    : { bg: "rgba(192,57,43,0.06)", border: "rgba(192,57,43,0.2)", text: "#C0392B", barColor: "#C0392B" };

  return (
    <div
      className="bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
      style={{ borderColor: scoreStyle.border }}
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-black text-[#1A1814]">{deal.year && `${deal.year} `}{deal.make} {deal.model}</p>
            <p className="text-[11px] text-[#AAA49C] font-mono">{deal.registration || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-[#1A1814]" style={{ color: scoreStyle.text }}>
              {score?.toFixed(1)}
            </p>
            <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: scoreStyle.text }}>
              {label || "deal score"}
            </p>
          </div>
        </div>

        {/* Score bar */}
        <div className="h-1.5 bg-black/5 rounded-full overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all" style={{ width: `${(score / 10) * 100}%`, backgroundColor: scoreStyle.barColor }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-[#AAA49C] uppercase tracking-wider mb-0.5">Asking</p>
            <p className="text-sm font-bold text-[#1A1814]">
              {deal.asking_price ? `$${deal.asking_price.toLocaleString()}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#AAA49C] uppercase tracking-wider mb-0.5">OMVM Value</p>
            <p className="text-sm font-bold text-[#1A1814]">
              {deal.omvm_value ? `$${deal.omvm_value.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>

        {deal.discount_pct != null && (
          <div className={`mt-3 text-center text-sm font-bold py-1.5 rounded-lg ${deal.discount_pct >= 0 ? "bg-[rgba(15,122,86,0.08)] text-[#0F7A56]" : "bg-[rgba(192,57,43,0.08)] text-[#C0392B]"}`}>
            {deal.discount_pct >= 0 ? "▼" : "▲"} {Math.abs(deal.discount_pct)}% vs OMVM
          </div>
        )}
      </div>
      <div className="border-t border-black/[0.06] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {deal.ati_score && (
            <span className="text-[10px] text-[#6B6560] font-medium">ATI {deal.ati_score}</span>
          )}
        </div>
        <Link
          to={`/ati-passport/${deal.id}`}
          className="text-[11px] text-[#D4A017] font-semibold flex items-center gap-0.5 hover:text-[#A67C00]"
        >
          View Passport <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function DealRadar() {
   const [minScore, setMinScore] = useState(6.0);
   const [hotOnly, setHotOnly] = useState(false);

   const { data: allDeals = [], isLoading } = useQuery({
     queryKey: ["deal-radar"],
     queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }, "-deal_score", 100),
   });

   const dealsWithScore = useMemo(() => allDeals.filter(d => d.deal_score != null && d.deal_score >= 1), [allDeals]);
   const hot_deals = useMemo(() => dealsWithScore.filter(d => d.deal_score >= 8.5).length, [dealsWithScore]);
   const good_deals = useMemo(() => dealsWithScore.filter(d => d.deal_score >= 6.5 && d.deal_score < 8.5).length, [dealsWithScore]);
   const avg_discount = useMemo(() => {
     const w = dealsWithScore.filter(d => d.discount_pct != null);
     if (!w.length) return null;
     return Math.round(w.reduce((s, d) => s + d.discount_pct, 0) / w.length);
   }, [dealsWithScore]);

   const filtered = useMemo(() => {
     const threshold = hotOnly ? 8.5 : minScore;
     return dealsWithScore.filter(d => d.deal_score >= threshold);
   }, [dealsWithScore, minScore, hotOnly]);

   return (
     <div className="min-h-screen bg-[#F7F4EF]">
       {/* Header */}
       <div className="bg-[#0B2D5B] border-b border-white/5">
         <div className="px-4 md:px-8 py-6 md:py-8">
           <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.2em] font-bold mb-2">Smart Deal Spotting</p>
           <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 flex-wrap">
             <div>
               <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                 Aircraft Below Market Value
               </h1>
               <p className="text-white/60 text-sm mt-2 max-w-xl">
                 Real-time deal scoring identifies aircraft priced 8%+ below verified market comparables. Filter by deal quality and find opportunities before they're gone.
               </p>
             </div>
             <button
               onClick={() => setHotOnly(v => !v)}
               className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-black transition-colors whitespace-nowrap ${hotOnly ? "bg-[#E8A83A] text-[#0B2D5B] border-[#E8A83A]" : "bg-white/10 border-white/20 text-white hover:bg-white/15"}`}
             >
               <Zap className="w-4 h-4" />
               Hot Deals Only
             </button>
           </div>
         </div>
       </div>

      <div className="px-4 md:px-8 pb-8 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <StatCard 
            label="Exceptional Deals" 
            value={isLoading ? null : hot_deals} 
            icon={Zap} 
            sub="score ≥ 8.5 (8%+ below market)" 
            loading={isLoading} 
          />
          <StatCard 
            label="Good Opportunities" 
            value={isLoading ? null : good_deals} 
            icon={TrendingDown} 
            sub="score 6.5 – 8.4" 
            loading={isLoading} 
          />
          <StatCard 
            label="Avg Savings" 
            value={isLoading || avg_discount == null ? null : `${avg_discount}%`} 
            icon={BarChart2} 
            sub="below OMVM valuation" 
            loading={isLoading} 
          />
        </div>

        {/* Score slider */}
        {!hotOnly && (
          <div className="bg-white border border-black/[0.07] rounded-xl px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block">
                  Minimum Deal Score
                </label>
                <p className="text-[10px] text-[#6B6560] mt-0.5">Show deals rated {minScore.toFixed(1)} or higher</p>
              </div>
              <span className="text-2xl font-black text-[#D4A017]">{minScore.toFixed(1)}</span>
            </div>
            <input type="range" min={1} max={10} step={0.5} value={minScore}
              onChange={e => setMinScore(+e.target.value)}
              className="w-full accent-[#D4A017]" />
            <div className="flex justify-between text-[10px] text-[#AAA49C] mt-2 font-semibold">
              <span>1.0</span>
              <span>5.5</span>
              <span>10.0</span>
            </div>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-black/[0.07] rounded-2xl h-52 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-[#AAA49C]">
            <div className="w-16 h-16 rounded-full bg-[rgba(11,45,91,0.1)] flex items-center justify-center mb-4">
              <Radar className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-lg font-black text-[#1A1814]">No deals found</p>
            <p className="text-[12px] mt-2 max-w-md text-center">No aircraft match your deal score criteria right now. Try lowering the minimum score or checking back later for new opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(deal => <DealCard key={deal.id} deal={deal} />)}
          </div>
        )}
      </div>
    </div>
  );
}
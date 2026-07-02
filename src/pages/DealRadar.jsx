import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { Zap, TrendingDown, BarChart2, Radar, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import CoreCard from "@/components/core/CoreCard";
import ComplianceBadge from "@/components/gcr/ComplianceBadge";

function StatCard({ label, value, icon: Icon, sub, loading }) {
  return (
    <CoreCard className="p-5">
      <div className="flex items-center justify-between mb-2">
        <p
          className="text-[10px] uppercase tracking-[0.15em] font-semibold"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(212,160,23,0.12)" }}
        >
          <Icon className="w-4 h-4" style={{ color: "#D4A017" }} />
        </div>
      </div>
      {loading ? (
        <div
          className="h-8 w-16 rounded animate-pulse"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
      ) : (
        <p className="text-3xl font-black text-white">{value ?? "—"}</p>
      )}
      {sub && (
        <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          {sub}
        </p>
      )}
    </CoreCard>
  );
}

function DealCard({ deal }) {
  const score = deal.deal_score;
  const label = (deal.deal_label || "").toLowerCase();
  const scoreStyle =
    score >= 8.5
      ? { text: "#D4A017", barColor: "#D4A017" }
      : score >= 6.5
      ? { text: "#5dcaa5", barColor: "#5dcaa5" }
      : score >= 5
      ? { text: "#2563EB", barColor: "#2563EB" }
      : { text: "#e24b4a", barColor: "#e24b4a" };

  return (
    <CoreCard className="overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-black text-white">
              {deal.year && `${deal.year} `}
              {deal.make} {deal.model}
            </p>
            <p
              className="text-[11px] font-mono"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {deal.registration || "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black" style={{ color: scoreStyle.text }}>
              {score?.toFixed(1)}
            </p>
            <p
              className="text-[9px] uppercase tracking-widest font-bold"
              style={{ color: scoreStyle.text }}
            >
              {label || "deal score"}
            </p>
          </div>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden mb-4"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(score / 10) * 100}%`, backgroundColor: scoreStyle.barColor }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p
              className="text-[10px] uppercase tracking-wider mb-0.5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Asking
            </p>
            <p className="text-sm font-bold text-white">
              {deal.asking_price ? `$${deal.asking_price.toLocaleString()}` : "—"}
            </p>
          </div>
          <div>
            <p
              className="text-[10px] uppercase tracking-wider mb-0.5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              OMVM Value
            </p>
            <p className="text-sm font-bold text-white">
              {deal.omvm_value ? `$${deal.omvm_value.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>
        {deal.discount_pct != null && (
          <div
            className={`mt-3 text-center text-sm font-bold py-1.5 rounded-lg ${
              deal.discount_pct >= 0 ? "text-[#5dcaa5]" : "text-[#e24b4a]"
            }`}
            style={{
              background:
                deal.discount_pct >= 0
                  ? "rgba(93,202,165,0.10)"
                  : "rgba(226,75,74,0.10)",
            }}
          >
            {deal.discount_pct >= 0 ? "▼" : "▲"} {Math.abs(deal.discount_pct)}% vs
            OMVM
          </div>
        )}
      </div>
      <div
        className="px-5 py-3 flex items-center justify-between border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          {deal.ati_score && (
            <span
              className="text-[10px] font-medium"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              ATI {deal.ati_score}
            </span>
          )}
          <ComplianceBadge registration={deal.registration} />
        </div>
        <Link
          to={`/ati-passport/${deal.id}`}
          className="text-[11px] font-semibold flex items-center gap-0.5 hover:opacity-80"
          style={{ color: "#D4A017" }}
        >
          View Passport <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </CoreCard>
  );
}

export default function DealRadar() {
  const [minScore, setMinScore] = useState(6.0);
  const [hotOnly, setHotOnly] = useState(false);

  const { data: allDeals = [], isLoading } = useQuery({
    queryKey: ["deal-radar"],
    queryFn: () =>
      base44.entities.AircraftListing.filter({ status: "active" }, "-deal_score", 100),
  });

  const dealsWithScore = useMemo(
    () => allDeals.filter((d) => d.deal_score != null && d.deal_score >= 1),
    [allDeals]
  );
  const hot_deals = useMemo(
    () => dealsWithScore.filter((d) => d.deal_score >= 8.5).length,
    [dealsWithScore]
  );
  const good_deals = useMemo(
    () =>
      dealsWithScore.filter((d) => d.deal_score >= 6.5 && d.deal_score < 8.5).length,
    [dealsWithScore]
  );
  const avg_discount = useMemo(() => {
    const w = dealsWithScore.filter((d) => d.discount_pct != null);
    if (!w.length) return null;
    return Math.round(w.reduce((s, d) => s + d.discount_pct, 0) / w.length);
  }, [dealsWithScore]);

  const filtered = useMemo(() => {
    const threshold = hotOnly ? 8.5 : minScore;
    return dealsWithScore.filter((d) => d.deal_score >= threshold);
  }, [dealsWithScore, minScore, hotOnly]);

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div
        style={{
          background: "#111827",
          borderBottom: "0.5px solid rgba(212,160,23,0.12)",
        }}
      >
        <div className="px-4 md:px-8 py-6 md:py-8">
          <p
            className="text-[9px] uppercase tracking-[0.2em] font-bold mb-2"
            style={{ color: "#D4A017" }}
          >
            Smart Deal Spotting
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Aircraft Below Market Value
              </h1>
              <p className="text-white/60 text-sm mt-2 max-w-xl">
                Real-time deal scoring identifies aircraft priced 8%+ below
                verified market comparables.
              </p>
            </div>
            <button
              onClick={() => setHotOnly((v) => !v)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-black transition-colors whitespace-nowrap ${
                hotOnly ? "border-[#D4A017]" : "border-white/20"
              }`}
              style={
                hotOnly
                  ? { background: "#D4A017", color: "#0B1220" }
                  : { background: "rgba(255,255,255,0.06)", color: "#fff" }
              }
            >
              <Zap className="w-4 h-4" /> Hot Deals Only
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-5 pt-5">
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

        {!hotOnly && (
          <CoreCard className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label
                  className="text-[10px] uppercase tracking-wider font-semibold block"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Minimum Deal Score
                </label>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Show deals rated {minScore.toFixed(1)} or higher
                </p>
              </div>
              <span className="text-2xl font-black" style={{ color: "#D4A017" }}>
                {minScore.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={minScore}
              onChange={(e) => setMinScore(+e.target.value)}
              className="w-full"
              style={{ accentColor: "#D4A017" }}
            />
            <div
              className="flex justify-between text-[10px] mt-2 font-semibold"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <span>1.0</span>
              <span>5.5</span>
              <span>10.0</span>
            </div>
          </CoreCard>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl h-52 animate-pulse"
                style={{ background: "#111827", border: "0.5px solid rgba(255,255,255,0.08)" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-24">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <Radar className="w-8 h-8 opacity-40 text-white" />
            </div>
            <p className="text-lg font-black text-white">No deals found</p>
            <p
              className="text-[12px] mt-2 max-w-md text-center"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              No aircraft match your deal score criteria right now. Try lowering
              the minimum score.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
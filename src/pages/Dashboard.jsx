import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plane, BarChart2, Zap, DollarSign, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

function GoldLabel({ children }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017] mb-1">
      {children}
    </p>
  );
}

function StatCard({ label, value, icon: Icon, sub, trend, loading }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-5 flex flex-col gap-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#AAA49C]">{label}</p>
          {loading ? (
            <div className="h-8 w-20 bg-black/5 rounded animate-pulse mt-2" />
          ) : (
            <p className="text-3xl font-bold text-[#1A1814] mt-1 leading-none">{value}</p>
          )}
          {sub && <p className="text-[11px] text-[#AAA49C] mt-1">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-lg bg-[#F7F4EF] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#D4A017]" />
        </div>
      </div>
      {trend != null && !loading && (
        <div className={`flex items-center gap-1 text-[11px] font-medium mt-1 ${trend >= 0 ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend >= 0 ? "+" : ""}{trend}%
        </div>
      )}
    </div>
  );
}

function ATIBadge({ score }) {
  if (score == null) return <div className="w-10 h-10 rounded-full bg-black/5 animate-pulse" />;
  const color = score >= 85 ? "#0F7A56" : score >= 65 ? "#A67C00" : "#C0392B";
  const label = score >= 85 ? "EXCELLENT" : score >= 65 ? "GOOD" : "POOR";
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#F0EDE6" strokeWidth="3" />
        <circle
          cx="20" cy="20" r="16"
          fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 120) * 100.5} 100.5`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black text-[#1A1814]">{score}</span>
      </div>
    </div>
  );
}

const MARKET_PULSE = [
  { type: "Single Piston", ati: 72, trend: 3.2 },
  { type: "Multi Piston", ati: 65, trend: -1.8 },
  { type: "Turboprop", ati: 81, trend: 5.1 },
  { type: "Light Jet", ati: 88, trend: 0.3 },
];

export default function Dashboard() {
  const { data: listings = [], isLoading: loadingListings } = useQuery({
    queryKey: ["listings-active"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active" }),
  });

  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ["deals"],
    queryFn: () => base44.entities.DealRadar.list(),
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["orders-paid"],
    queryFn: () => base44.entities.Order.filter({ status: "paid" }),
  });

  const total_listings = listings.length;
  const avg_ati = listings.length > 0
    ? Math.round(listings.reduce((s, l) => s + (l.ati_score || 0), 0) / listings.length)
    : null;
  const hot_deals = deals.filter((d) => (d.deal_score || 0) >= 8.5).length;
  const total_revenue = orders.reduce((s, o) => s + (o.amount || 0), 0);

  const recent = [...listings].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Page header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <GoldLabel>Live · Global Network</GoldLabel>
          <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight">Dashboard</h1>
          <p className="text-[#6B6560] text-sm mt-0.5">Aircraft transaction intelligence at a glance</p>
        </div>
        <Link
          to="/listings"
          className="inline-flex items-center gap-2 bg-[#1A1814] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#D4A017] transition-colors shrink-0"
        >
          + New Aircraft Card
        </Link>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Aircraft Cards" value={total_listings} icon={Plane} sub={`${listings.filter(l => l.ati_score).length} evaluated`} loading={loadingListings} />
          <StatCard label="Avg ATI Score" value={avg_ati ?? "—"} icon={BarChart2} sub="out of 120" loading={loadingListings} />
          <StatCard label="Hot Deals" value={hot_deals} icon={Zap} sub="score ≥ 8.5" loading={loadingDeals} />
          <StatCard label="Revenue" value={`$${total_revenue.toLocaleString()}`} icon={DollarSign} sub="paid orders" loading={loadingOrders} />
        </div>

        {/* Hero promo banner */}
        <div className="relative bg-[#111113] rounded-2xl overflow-hidden px-6 md:px-10 py-8 md:py-10">
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4A017] font-semibold mb-3">Off-market · Transaction Intelligence</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#F0EDE6] leading-tight mb-2">
              Off-market exposure.<br />
              <span className="text-[#D4A017]">Transaction intelligence.</span>
            </h2>
            <div className="flex flex-wrap gap-6 mt-6">
              {[{ val: "270k", label: "Members" }, { val: "4,440", label: "Off-market" }, { val: "87", label: "Countries" }].map(item => (
                <div key={item.label}>
                  <p className="text-xl md:text-2xl font-black text-[#F0EDE6]">{item.val}</p>
                  <p className="text-[11px] text-[#8A8780] uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* decorative */}
          <div className="absolute right-0 top-0 bottom-0 w-40 md:w-64 opacity-[0.04]">
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="white">
              <text x="20" y="160" fontSize="180" fontFamily="serif" fontStyle="italic">IZ</text>
            </svg>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Recent Aircraft Cards */}
          <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1A1814]">Recent Aircraft Cards</h3>
              <Link to="/listings" className="text-[11px] text-[#D4A017] font-semibold hover:text-[#A67C00] flex items-center gap-0.5">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {loadingListings ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-10 h-10 rounded-full bg-black/5 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-black/5 rounded animate-pulse w-2/3" />
                      <div className="h-2.5 bg-black/5 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                ))
              ) : recent.length === 0 ? (
                <div className="px-5 py-10 text-center text-[#AAA49C] text-sm">No aircraft cards yet</div>
              ) : (
                recent.map((l) => (
                  <Link key={l.id} to={`/ati-passport/${l.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F7F4EF] transition-colors">
                    <ATIBadge score={l.ati_score} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1814] truncate">
                        {l.year && `${l.year} `}{l.make} {l.model}
                      </p>
                      <p className="text-[11px] text-[#AAA49C] font-mono">{l.registration || "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-[#AAA49C]">{l.asking_price ? `$${l.asking_price.toLocaleString()}` : "No price"}</p>
                      <p className={`text-[9px] uppercase tracking-wider font-bold mt-0.5 ${l.ati_score ? "text-[#0F7A56]" : "text-[#AAA49C]"}`}>
                        {l.ati_score ? "EVALUATED" : l.status?.toUpperCase() || "DRAFT"}
                      </p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#AAA49C] shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Market Pulse */}
          <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06]">
              <h3 className="text-sm font-bold text-[#1A1814]">Market Pulse</h3>
              <p className="text-[11px] text-[#AAA49C] mt-0.5">GA sector trends — last 30 days</p>
            </div>
            <div className="divide-y divide-black/[0.05]">
              {MARKET_PULSE.map((item) => (
                <div key={item.type} className="flex items-center px-5 py-4 gap-4">
                  <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${item.trend >= 0 ? "bg-[rgba(15,122,86,0.08)]" : "bg-[rgba(192,57,43,0.08)]"}`}>
                    {item.trend >= 0
                      ? <TrendingUp className="w-3.5 h-3.5 text-[#0F7A56]" />
                      : <TrendingDown className="w-3.5 h-3.5 text-[#C0392B]" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1A1814]">{item.type}</p>
                    <p className="text-[11px] text-[#AAA49C]">Avg ATI: {item.ati}</p>
                  </div>
                  <span className={`text-sm font-bold ${item.trend >= 0 ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
                    {item.trend >= 0 ? "+" : ""}{item.trend}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
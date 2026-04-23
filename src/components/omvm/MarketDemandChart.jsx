import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MarketDemandChart({ monthly, trendPct, avgMonthly }) {
  const up = trendPct >= 0;
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Market Demand</p>
          <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">Listings / Month (18 mo)</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {up ? <TrendingUp className="w-4 h-4 text-[#0F7A56]" /> : <TrendingDown className="w-4 h-4 text-[#C0392B]" />}
          <span className="text-sm font-black" style={{ color: up ? "#0F7A56" : "#C0392B" }}>
            {up ? "+" : ""}{trendPct}%
          </span>
          <span className="text-[10px] text-[#AAA49C] uppercase tracking-wider">vs avg {avgMonthly}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={monthly}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis dataKey="month" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="listings" fill="#E8A83A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
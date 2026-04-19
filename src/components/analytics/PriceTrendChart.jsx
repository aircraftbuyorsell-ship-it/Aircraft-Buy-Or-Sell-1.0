import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const fmt = (v) => v == null ? "—" : `$${(v / 1000).toFixed(0)}k`;

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const { avgPrice, listings } = payload[0].payload;
  return (
    <div className="bg-white border border-black/10 rounded-md px-3 py-2 shadow-lg text-[11px]">
      <p className="font-black text-[#0B2D5B] uppercase tracking-wider">{label}</p>
      <p className="text-[#1A1814] mt-1">Avg price: <span className="font-black">{fmt(avgPrice)}</span></p>
      <p className="text-[#6B6560]">Listings: {listings}</p>
    </div>
  );
}

export default function PriceTrendChart({ data }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">Market Trend</p>
          <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">Avg Asking Price Over Time</h3>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0B2D5B" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0B2D5B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B6560" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: "#6B6560" }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="avgPrice" stroke="#0B2D5B" strokeWidth={2} fill="url(#priceGrad)" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
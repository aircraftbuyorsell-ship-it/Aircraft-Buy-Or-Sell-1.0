import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const fmt = (v) => v == null ? "—" : `$${(v / 1000).toFixed(0)}k`;
const AMBER = "#f5c242";
const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const { avgPrice, listings } = payload[0].payload;
  return (
    <div style={{
      background: "rgba(13,17,23,0.98)",
      border: "0.5px solid rgba(245,194,66,0.22)",
      borderRadius: 8, padding: "8px 12px", fontSize: 11,
    }}>
      <p style={{ fontWeight: 900, color: AMBER, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
      <p style={{ color: W1, marginTop: 4 }}>Avg price: <strong>{fmt(avgPrice)}</strong></p>
      <p style={{ color: W3 }}>Listings: {listings}</p>
    </div>
  );
}

export default function PriceTrendChart({ data, isDark }) {
  return (
    <div className="rounded-2xl p-5" style={{
      background: "rgba(255,255,255,0.04)",
      border: "0.5px solid rgba(255,255,255,0.08)",
    }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: AMBER }}>Market Trend</p>
          <h3 className="text-base font-black uppercase tracking-tight" style={{ color: W1 }}>Avg Asking Price Over Time</h3>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AMBER} stopOpacity={0.35} />
                <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: W3 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: W3 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="avgPrice" stroke={AMBER} strokeWidth={2} fill="url(#priceGrad)" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
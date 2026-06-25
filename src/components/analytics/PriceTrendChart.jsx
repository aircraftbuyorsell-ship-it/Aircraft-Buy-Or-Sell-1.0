import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const fmt = (v) => v == null ? "—" : `$${(v / 1000).toFixed(0)}k`;

const GOLD = "#D4A017";

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  const { avgPrice, listings } = payload[0].payload;
  return (
    <div style={{
      background: isDark ? "#0B1220" : "#ffffff",
      border: isDark ? "1px solid rgba(212,160,23,0.25)" : "1px solid rgba(0,0,0,0.10)",
      borderRadius: 8, padding: "8px 12px", fontSize: 11,
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    }}>
      <p style={{ fontWeight: 900, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
      <p style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#1A1814", marginTop: 4 }}>Avg price: <strong>{fmt(avgPrice)}</strong></p>
      <p style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#6B6560" }}>Listings: {listings}</p>
    </div>
  );
}

export default function PriceTrendChart({ data, isDark = false }) {
  const lineColor = isDark ? GOLD : "#0B2D5B";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "rgba(255,255,255,0.35)" : "#6B6560";
  const textColor = isDark ? "#ffffff" : "#1A1814";

  return (
    <div className="rounded-2xl p-5" style={{
      background: isDark ? "#111827" : "#ffffff",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
      boxShadow: isDark ? "0 1px 2px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.04)",
    }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: GOLD }}>Market Trend</p>
          <h3 className="text-base font-black uppercase tracking-tight" style={{ color: textColor }}>Avg Asking Price Over Time</h3>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} width={48} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Area type="monotone" dataKey="avgPrice" stroke={lineColor} strokeWidth={2} fill="url(#priceGrad)" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
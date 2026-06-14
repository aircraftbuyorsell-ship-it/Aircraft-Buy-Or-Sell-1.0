import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

const fmt = (v) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v}%`);

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null;
  const { avgPrice, momPct, listings } = payload[0].payload;
  const up = momPct > 0;
  return (
    <div style={{
      background: isDark ? "rgba(10,10,32,0.95)" : "#ffffff",
      border: isDark ? "1px solid rgba(0,245,255,0.25)" : "1px solid rgba(0,0,0,0.10)",
      borderRadius: 8, padding: "8px 12px", fontSize: 11,
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    }}>
      <p style={{ fontWeight: 900, color: isDark ? "#00f5ff" : "#0B2D5B", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
      <p style={{ color: isDark ? "rgba(255,255,255,0.8)" : "#1A1814", marginTop: 4 }}>
        Avg: <strong>${(avgPrice / 1000).toFixed(0)}k</strong>
      </p>
      <p style={{ color: up ? "#0F7A56" : "#C0392B", fontWeight: 700 }}>
        {fmt(momPct)}
      </p>
      <p style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#6B6560" }}>{listings} listings</p>
    </div>
  );
}

export default function MonthOverMonthChart({ data, isDark = false }) {
  const upColor = "#0F7A56";
  const downColor = "#C0392B";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "rgba(255,255,255,0.35)" : "#6B6560";
  const accentLabel = isDark ? "#00f5ff" : "#E8A83A";
  const textColor = isDark ? "#ffffff" : "#1A1814";

  return (
    <div className="rounded-2xl p-5" style={{
      background: isDark
        ? "linear-gradient(150deg, rgba(110,140,175,0.12) 0%, rgba(25,45,75,0.55) 60%)"
        : "rgba(255,255,255,0.90)",
      border: isDark ? "1px solid rgba(150,200,225,0.20)" : "1px solid rgba(0,0,0,0.07)",
      boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: accentLabel }}>Monthly Change</p>
        <h3 className="text-base font-black uppercase tracking-tight" style={{ color: textColor }}>Price Change vs Prior Month</h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 10, fill: tickColor }} axisLine={false} tickLine={false} width={52} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Bar dataKey="momPct" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.momPct >= 0 ? upColor : downColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
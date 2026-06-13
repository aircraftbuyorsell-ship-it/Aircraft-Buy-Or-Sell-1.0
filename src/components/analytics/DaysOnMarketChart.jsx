import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

function CustomTooltip({ active, payload, isDark }) {
  if (!active || !payload?.length) return null;
  const { model, avgDays, listings, sold } = payload[0].payload;
  return (
    <div style={{
      background: isDark ? "rgba(10,10,32,0.95)" : "#ffffff",
      border: isDark ? "1px solid rgba(0,245,255,0.25)" : "1px solid rgba(0,0,0,0.10)",
      borderRadius: 8, padding: "8px 12px", fontSize: 11,
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    }}>
      <p style={{ fontWeight: 900, color: isDark ? "#00f5ff" : "#0B2D5B", textTransform: "uppercase", letterSpacing: "0.1em" }}>{model}</p>
      <p style={{ color: isDark ? "rgba(255,255,255,0.8)" : "#1A1814", marginTop: 4 }}>Avg days: <strong>{avgDays}</strong></p>
      <p style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#6B6560" }}>{listings} listings · {sold} sold</p>
    </div>
  );
}

function colorFor(days, max) {
  const ratio = max ? days / max : 0;
  if (ratio < 0.33) return "#0F7A56";
  if (ratio < 0.66) return "#E8A83A";
  return "#C0392B";
}

export default function DaysOnMarketChart({ data, isDark = false }) {
  const max = Math.max(...data.map(d => d.avgDays), 1);
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColorX = isDark ? "rgba(255,255,255,0.35)" : "#6B6560";
  const tickColorY = isDark ? "rgba(255,255,255,0.7)" : "#1A1814";
  const accentLabel = isDark ? "#00f5ff" : "#E8A83A";
  const textColor = isDark ? "#ffffff" : "#1A1814";
  const mutedColor = isDark ? "rgba(255,255,255,0.35)" : "#6B6560";

  return (
    <div className="rounded-2xl p-5" style={{
      background: isDark
        ? "linear-gradient(150deg, rgba(110,140,175,0.12) 0%, rgba(25,45,75,0.55) 60%)"
        : "rgba(255,255,255,0.90)",
      backdropFilter: isDark ? "blur(24px) saturate(160%)" : undefined,
      WebkitBackdropFilter: isDark ? "blur(24px) saturate(160%)" : undefined,
      border: isDark ? "1px solid rgba(150,200,225,0.20)" : "1px solid rgba(0,0,0,0.07)",
      boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(220,250,255,0.20)" : "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: accentLabel }}>Liquidity Signal</p>
        <h3 className="text-base font-black uppercase tracking-tight" style={{ color: textColor }}>Avg Days on Market · Popular Models</h3>
        <p className="text-[11px] mt-1" style={{ color: mutedColor }}>Lower = faster-moving inventory</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: tickColorX }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="model" tick={{ fontSize: 10, fill: tickColorY }} axisLine={false} tickLine={false} width={120} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? "rgba(0,245,255,0.05)" : "rgba(11,45,91,0.04)" }} />
            <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => <Cell key={i} fill={colorFor(d.avgDays, max)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
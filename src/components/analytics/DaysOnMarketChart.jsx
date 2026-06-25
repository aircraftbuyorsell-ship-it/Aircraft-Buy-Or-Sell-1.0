import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

const GOLD = "#D4A017";

function CustomTooltip({ active, payload, isDark }) {
  if (!active || !payload?.length) return null;
  const { model, avgDays, listings, sold } = payload[0].payload;
  return (
    <div style={{
      background: isDark ? "#0B1220" : "#ffffff",
      border: isDark ? "1px solid rgba(212,160,23,0.25)" : "1px solid rgba(0,0,0,0.10)",
      borderRadius: 8, padding: "8px 12px", fontSize: 11,
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    }}>
      <p style={{ fontWeight: 900, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>{model}</p>
      <p style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#1A1814", marginTop: 4 }}>Avg days: <strong>{avgDays}</strong></p>
      <p style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#6B6560" }}>{listings} listings · {sold} sold</p>
    </div>
  );
}

function colorFor(days, max) {
  const ratio = max ? days / max : 0;
  if (ratio < 0.33) return "#10b981";
  if (ratio < 0.66) return GOLD;
  return "#ef4444";
}

export default function DaysOnMarketChart({ data, isDark = false }) {
  const max = Math.max(...data.map(d => d.avgDays), 1);
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColorX = isDark ? "rgba(255,255,255,0.35)" : "#6B6560";
  const tickColorY = isDark ? "rgba(255,255,255,0.85)" : "#1A1814";
  const textColor = isDark ? "#ffffff" : "#1A1814";
  const mutedColor = isDark ? "rgba(255,255,255,0.40)" : "#6B6560";

  return (
    <div className="rounded-2xl p-5" style={{
      background: isDark ? "#111827" : "#ffffff",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
      boxShadow: isDark ? "0 1px 2px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.04)",
    }}>
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: GOLD }}>Liquidity Signal</p>
        <h3 className="text-base font-black uppercase tracking-tight" style={{ color: textColor }}>Avg Days on Market · Popular Models</h3>
        <p className="text-[11px] mt-1" style={{ color: mutedColor }}>Lower = faster-moving inventory</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: tickColorX }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="model" tick={{ fontSize: 10, fill: tickColorY }} axisLine={false} tickLine={false} width={120} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? "rgba(212,160,23,0.06)" : "rgba(11,45,91,0.04)" }} />
            <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => <Cell key={i} fill={colorFor(d.avgDays, max)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
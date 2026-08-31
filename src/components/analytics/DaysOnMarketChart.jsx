import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const RED = "#e24b4a";
const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { model, avgDays, listings, sold } = payload[0].payload;
  return (
    <div style={{
      background: "rgba(13,17,23,0.98)",
      border: "0.5px solid rgba(245,194,66,0.22)",
      borderRadius: 8, padding: "8px 12px", fontSize: 11,
    }}>
      <p style={{ fontWeight: 900, color: AMBER, textTransform: "uppercase", letterSpacing: "0.1em" }}>{model}</p>
      <p style={{ color: W1, marginTop: 4 }}>Avg days: <strong>{avgDays}</strong></p>
      <p style={{ color: W3 }}>{listings} listings · {sold} sold</p>
    </div>
  );
}

function colorFor(days, max) {
  const ratio = max ? days / max : 0;
  if (ratio < 0.33) return TEAL;
  if (ratio < 0.66) return AMBER;
  return RED;
}

export default function DaysOnMarketChart({ data, isDark }) {
  const max = Math.max(...data.map(d => d.avgDays), 1);

  return (
    <div className="rounded-2xl p-5" style={{
      background: "rgba(255,255,255,0.04)",
      border: "0.5px solid rgba(255,255,255,0.08)",
    }}>
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: AMBER }}>Liquidity Signal</p>
        <h3 className="text-base font-black uppercase tracking-tight" style={{ color: W1 }}>Avg Days on Market · Popular Models</h3>
        <p className="text-[11px] mt-1" style={{ color: W2 }}>Lower = faster-moving inventory</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: W3 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="model" tick={{ fontSize: 10, fill: W1 }} axisLine={false} tickLine={false} width={120} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,194,66,0.06)" }} />
            <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => <Cell key={i} fill={colorFor(d.avgDays, max)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
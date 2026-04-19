import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { model, avgDays, listings, sold } = payload[0].payload;
  return (
    <div className="bg-white border border-black/10 rounded-md px-3 py-2 shadow-lg text-[11px]">
      <p className="font-black text-[#0B2D5B] uppercase tracking-wider">{model}</p>
      <p className="text-[#1A1814] mt-1">Avg days: <span className="font-black">{avgDays}</span></p>
      <p className="text-[#6B6560]">{listings} listings · {sold} sold</p>
    </div>
  );
}

// Color scale: fewer days = greener (faster moving market)
function colorFor(days, max) {
  const ratio = max ? days / max : 0;
  if (ratio < 0.33) return "#0F7A56";
  if (ratio < 0.66) return "#E8A83A";
  return "#C0392B";
}

export default function DaysOnMarketChart({ data }) {
  const max = Math.max(...data.map(d => d.avgDays), 1);
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">Liquidity Signal</p>
        <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">Avg Days on Market · Popular Models</h3>
        <p className="text-[11px] text-[#6B6560] mt-1">Lower = faster-moving inventory</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: "#6B6560" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="model" tick={{ fontSize: 10, fill: "#1A1814" }} axisLine={false} tickLine={false} width={120} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(11,45,91,0.04)" }} />
            <Bar dataKey="avgDays" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => <Cell key={i} fill={colorFor(d.avgDays, max)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
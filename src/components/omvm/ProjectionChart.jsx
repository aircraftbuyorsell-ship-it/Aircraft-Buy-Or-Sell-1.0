import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Plane } from "lucide-react";

export default function ProjectionChart({ projection, target }) {
  if (!projection || projection.length === 0) {
    return (
      <div className="bg-white border border-dashed border-black/[0.12] rounded-2xl p-8 text-center">
        <Plane className="w-8 h-8 text-[#AAA49C] mx-auto mb-2" />
        <p className="text-sm font-bold text-[#1A1814]">Select a target listing to project its valuation</p>
        <p className="text-[11px] text-[#AAA49C] mt-1">Uses depreciation × engine-remaining × market-demand × expert calibration</p>
      </div>
    );
  }
  const today = projection[0]?.projected_value;
  return (
    <div className="bg-white border border-[rgba(212,160,23,0.3)] rounded-2xl p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Future Valuation Projection</p>
          <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">{target?.label}</h3>
          {target?.registration && <p className="font-mono text-[10px] text-[#AAA49C]">{target.registration}</p>}
        </div>
        {target?.asking_price && (
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Current Ask</p>
            <p className="text-sm font-black text-[#1A1814]">${target.asking_price.toLocaleString()}</p>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={projection}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
          <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
          {target?.asking_price && <ReferenceLine y={target.asking_price} stroke="#C0392B" strokeDasharray="4 4" label={{ value: "Ask", fontSize: 10, fill: "#C0392B" }} />}
          <Line type="monotone" dataKey="projected_value" stroke="#0B2D5B" strokeWidth={2.5} dot={{ r: 4, fill: "#E8A83A" }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[projection[0], projection[Math.floor(projection.length / 2)], projection[projection.length - 1]].map((p) => (
          <div key={p.year} className="bg-[#F7F4EF] rounded-lg p-2 text-center">
            <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">{p.year}</p>
            <p className="text-sm font-black text-[#1A1814]">${p.projected_value.toLocaleString()}</p>
            {today && p.year !== projection[0].year && (
              <p className="text-[10px] font-bold" style={{ color: p.projected_value >= today ? "#0F7A56" : "#C0392B" }}>
                {p.projected_value >= today ? "+" : ""}
                {Math.round(((p.projected_value - today) / today) * 100)}%
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
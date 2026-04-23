import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function DepreciationCurveChart({ data, annualPct, r2 }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Depreciation Curve</p>
          <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">Price vs Age</h3>
        </div>
        <div className="flex gap-3 text-right">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Annual %</p>
            <p className="text-sm font-black text-[#C0392B]">-{annualPct}%</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">R²</p>
            <p className="text-sm font-black text-[#0B2D5B]">{r2}</p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data.slice(0, 51)}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
          <XAxis dataKey="age" tick={{ fontSize: 10 }} label={{ value: "Age (yrs)", position: "insideBottom", offset: -2, fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
          <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} labelFormatter={(l) => `Age: ${l} yrs`} />
          <Line type="monotone" dataKey="estimated_price" stroke="#0B2D5B" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
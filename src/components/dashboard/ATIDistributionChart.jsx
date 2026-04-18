import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const BUCKETS = [
  { label: "80+", color: "#34d399", min: 80, max: Infinity },
  { label: "65–79", color: "#38bdf8", min: 65, max: 80 },
  { label: "50–64", color: "#f59e0b", min: 50, max: 65 },
  { label: "<50", color: "#f87171", min: -Infinity, max: 50 },
];

export default function ATIDistributionChart({ listings, loading }) {
  const data = BUCKETS.map((b) => ({
    label: b.label,
    count: listings.filter((l) => (l.ati_score || 0) >= b.min && (l.ati_score || 0) < b.max).length,
    color: b.color,
  }));

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">
        ATI Score Distribution
      </h2>
      {loading ? (
        <div className="flex items-end gap-4 h-[220px]">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="flex-1 bg-slate-700 rounded" style={{ height: `${40 + i * 20}%` }} />
          ))}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 4, bottom: 4 }}>
            <XAxis dataKey="label" tick={{ fill: "#cbd5e1", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
              itemStyle={{ color: "#94a3b8" }}
              formatter={(v) => [v, "Listings"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
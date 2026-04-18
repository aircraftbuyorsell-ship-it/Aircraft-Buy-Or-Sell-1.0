import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#38bdf8", "#818cf8", "#34d399", "#f59e0b", "#f87171", "#a78bfa", "#fb923c"];

export default function ListingsByMakeChart({ listings, loading }) {
  const data = Object.entries(
    listings.reduce((acc, l) => {
      acc[l.make] = (acc[l.make] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([make, count]) => ({ make, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-4">
        Listings by Make
      </h2>
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-6 bg-slate-700 rounded" style={{ width: `${70 - i * 10}%` }} />
          ))}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="make" tick={{ fill: "#cbd5e1", fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0" }}
              itemStyle={{ color: "#94a3b8" }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
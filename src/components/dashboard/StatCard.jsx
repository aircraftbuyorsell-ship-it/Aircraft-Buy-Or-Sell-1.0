import { Skeleton } from "@/components/ui/skeleton";

const colorMap = {
  sky: "border-sky-500/30 bg-sky-500/5",
  violet: "border-violet-500/30 bg-violet-500/5",
  amber: "border-amber-500/30 bg-amber-500/5",
  emerald: "border-emerald-500/30 bg-emerald-500/5",
};

export default function StatCard({ label, value, icon, color = "sky", loading, suffix, sub }) {
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="p-2 rounded-lg bg-slate-800/60">{icon}</div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24 bg-slate-700" />
      ) : (
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-white">{value}</span>
          {suffix && <span className="text-slate-500 text-sm mb-1">{suffix}</span>}
        </div>
      )}
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}
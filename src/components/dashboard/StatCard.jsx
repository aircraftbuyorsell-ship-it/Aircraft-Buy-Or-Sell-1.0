import { Skeleton } from "@/components/ui/skeleton";

/**
 * StatCard — Core Platform dark stat card.
 * #111827 card, subtle border, gold accent label.
 */
const colorMap = {
  sky: "#2563EB",
  violet: "#8b5cf6",
  amber: "#D4A017",
  emerald: "#10b981",
};

export default function StatCard({ label, value, icon, color = "sky", loading, suffix, sub }) {
  const accent = colorMap[color] || "#2563EB";
  return (
    <div className="rounded-xl p-5 flex flex-col gap-3" style={{
      background: "#111827",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
    }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
        <div className="p-2 rounded-lg" style={{ background: `${accent}18`, border: `0.5px solid ${accent}35` }}>
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-24" style={{ background: "rgba(255,255,255,0.06)" }} />
      ) : (
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold" style={{ color: "#ffffff" }}>{value}</span>
          {suffix && <span className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.40)" }}>{suffix}</span>}
        </div>
      )}
      {sub && <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{sub}</span>}
    </div>
  );
}
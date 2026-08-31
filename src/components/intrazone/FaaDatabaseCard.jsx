import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Database, FileCode, Store, Cpu, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function FaaDatabaseCard() {
  const { data } = useQuery({
    queryKey: ["faa-database-card"],
    queryFn: async () => {
      const res = await base44.functions.invoke("syncFaaFromSupabase", { mode: "registry_summary" });
      return res.data || {};
    },
    staleTime: 120000,
  });

  const tables = [
    { label: "Registry", value: data?.faaRegistryTotal || "—", synced: data?.abosFaaAircraftCount || 0, icon: Database, color: "#0B2D5B" },
    { label: "ACFTREF", value: data?.faaAcftrefTotal || "—", synced: 0, icon: FileCode, color: "#f59e0b" },
    { label: "Dealers", value: data?.faaDealersTotal || "—", synced: 0, icon: Store, color: "#06b6d4" },
    { label: "Engine", value: data?.faaEngineTotal || "—", synced: 0, icon: Cpu, color: "#22c55e" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-5 hover:border-black/[0.12] transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0B2D5B] flex items-center justify-center">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-[#1A1814] uppercase tracking-tight">FAA Database</p>
            <p className="text-[10px] text-[#6B6560]">Supabase sync status</p>
          </div>
        </div>
        <Link
          to="/admin/supabase-sync"
          className="flex items-center gap-1 text-[11px] font-bold text-[#0B2D5B] hover:opacity-70 transition-opacity"
        >
          Manage <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tables.map((t) => {
          const Icon = t.icon;
          const pct = typeof t.value === "number" && t.synced > 0
            ? Math.round((t.synced / t.value) * 100)
            : 0;
          return (
            <div
              key={t.label}
              className="rounded-xl p-3 border border-black/[0.05] bg-[#F7F4EF] flex flex-col gap-1"
            >
              <div className="flex items-center gap-1.5">
                <Icon className="w-3 h-3" style={{ color: t.color }} />
                <span className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wider">{t.label}</span>
              </div>
              <span className="text-lg font-black text-[#1A1814] leading-none">
                {typeof t.value === "number" ? t.value.toLocaleString() : t.value}
              </span>
              {pct > 0 && (
                <span className="text-[9px] text-[#0F7A56] font-semibold">{pct}% synced</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
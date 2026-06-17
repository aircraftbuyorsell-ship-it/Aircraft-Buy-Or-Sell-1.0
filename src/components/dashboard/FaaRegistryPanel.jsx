import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Search, ChevronLeft, ChevronRight, Database,
  ArrowRight, Plane, ExternalLink, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_LABELS = {
  V: "Valid",
  E: "Expired",
  R: "Revoked",
  C: "Cancelled",
  X: "Other",
};

export default function FaaRegistryPanel() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [appliedSearch, setAppliedSearch] = useState("");
  const PAGE_SIZE = 15;

  const { data, isLoading, error } = useQuery({
    queryKey: ["faa-registry-browse", page, appliedSearch],
    queryFn: async () => {
      const res = await base44.functions.invoke("syncFaaFromSupabase", {
        mode: "browse",
        page,
        pageSize: PAGE_SIZE,
        search: appliedSearch || undefined,
        status_code: !appliedSearch ? "V" : undefined,
      });
      return res.data || {};
    },
    keepPreviousData: true,
  });

  const rows = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  return (
    <div className="rounded-xl" style={{
      background: "rgba(15,15,28,0.72)",
      border: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.25)" }}>
            <Database className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight">FAA Registry</p>
            <p className="text-[10px] text-white/35">
              {total.toLocaleString()} active aircraft · browse & search
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="N-number or owner..."
                className="w-[180px] md:w-[220px] pl-9 pr-3 py-2 rounded-lg text-[12px] text-white placeholder:text-white/20 focus:outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-lg text-[11px] font-bold text-white transition-colors"
              style={{ background: "rgba(37,99,235,0.25)", border: "1px solid rgba(37,99,235,0.35)" }}
            >
              Search
            </button>
          </form>
          <Link
            to="/admin/supabase-sync"
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-bold text-white/70 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ExternalLink className="w-3 h-3" /> Manage
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.04]" style={{ background: "rgba(255,255,255,0.02)" }}>
              {["N-Number", "Owner", "Location", "Type", "Year", "Status"].map((h) => (
                <th key={h} className="pb-2.5 pt-2 px-4 text-[9px] uppercase tracking-[0.12em] font-black text-white/30 first:pl-5">
                  {h}
                </th>
              ))}
              <th className="pb-2.5 pt-2 px-4 text-[9px] uppercase tracking-[0.12em] font-black text-white/30 text-right pr-5">In ABOS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-white/25" />
                  <p className="text-[12px] text-white/30">Loading FAA registry...</p>
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <p className="text-[12px] text-red-400">Failed to load: {error.message}</p>
                </td>
              </tr>
            )}
            {!isLoading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <Plane className="w-6 h-6 mx-auto mb-2 opacity-15" />
                  <p className="text-[12px] text-white/30">No records found</p>
                </td>
              </tr>
            )}
            {!isLoading && !error && rows.map((row) => (
              <tr
                key={row.n_number}
                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-2.5 px-4 first:pl-5">
                  <span className="text-[11px] font-mono font-bold text-white">N{row.n_number}</span>
                </td>
                <td className="py-2.5 px-4">
                  <span className="text-[11px] text-white/70 max-w-[160px] truncate block" title={row.name}>
                    {row.name || "—"}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <span className="text-[11px] text-white/50">
                    {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <span className="text-[11px] text-white/50">{row.type_aircraft || "—"}</span>
                </td>
                <td className="py-2.5 px-4">
                  <span className="text-[11px] text-white/50">{row.year_mfr || "—"}</span>
                </td>
                <td className="py-2.5 px-4">
                  <span
                    className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
                    style={{
                      background: row.status_code === "V" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
                      color: row.status_code === "V" ? "#22c55e" : "rgba(255,255,255,0.4)",
                      border: `1px solid ${row.status_code === "V" ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    {STATUS_LABELS[row.status_code] || row.status_code || "—"}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right pr-5">
                  {row.inAbos ? (
                    <Link
                      to={`/ati-passport/${row.abosListing?.id}`}
                      className="text-[10px] font-bold text-[#2563eb] hover:opacity-70 transition-opacity inline-flex items-center gap-1"
                    >
                      View <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-[10px] text-white/20">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
          <p className="text-[10px] text-white/30">
            Page {page} of {totalPages} · {total.toLocaleString()} records
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-default transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 5) {
                p = i + 1;
              } else if (page <= 3) {
                p = i + 1;
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-[10px] font-bold transition-all"
                  style={
                    p === page
                      ? { background: "rgba(37,99,235,0.25)", border: "1px solid rgba(37,99,235,0.35)", color: "#fff" }
                      : { color: "rgba(255,255,255,0.45)", border: "1px solid transparent" }
                  }
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:cursor-default transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
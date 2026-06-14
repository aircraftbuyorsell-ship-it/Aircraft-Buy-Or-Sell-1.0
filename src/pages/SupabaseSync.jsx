import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  RefreshCw, Database, CheckCircle2, AlertTriangle,
  Search, ChevronLeft, ChevronRight, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";

export default function SupabaseSync() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [mode, setMode] = useState("summary");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  const fetchData = async (fetchMode = mode, fetchPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("syncFaaFromSupabase", {
        mode: fetchMode,
        page: fetchPage,
        pageSize: 50,
        search: search || undefined,
      });
      setData(res.data);
    } catch (err) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = () => { setMode("summary"); setPage(1); fetchData("summary", 1); };
  const browseTable = () => { setMode("browse"); setPage(1); fetchData("browse", 1); };

  const totalPages = data?.total ? Math.ceil(data.total / (data.pageSize || 50)) : 0;

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      <div className="bg-white border-b border-black/[0.07] sticky top-0 z-10">
        <div className="px-4 md:px-8 py-3 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/settings" className="text-[#6B6560] hover:text-[#0B2D5B]">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-sm font-black text-[#1A1814]">Supabase FAA Sync</p>
              <p className="text-[10px] text-[#AAA49C]">faa_registry → ABOS AircraftListing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSummary}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                mode === "summary"
                  ? "bg-[#0B2D5B] text-white"
                  : "bg-black/[0.04] text-[#6B6560] hover:bg-black/[0.08]"
              }`}
            >
              Summary
            </button>
            <button
              onClick={browseTable}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                mode === "browse"
                  ? "bg-[#0B2D5B] text-white"
                  : "bg-black/[0.04] text-[#6B6560] hover:bg-black/[0.08]"
              }`}
            >
              Browse FAA Data
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!data && !loading && (
          <div className="bg-white rounded-2xl border border-black/[0.07] p-10 text-center">
            <Database className="w-10 h-10 text-[#AAA49C] mx-auto mb-3" />
            <p className="text-[#6B6560] font-bold mb-1">No data loaded</p>
            <p className="text-[#AAA49C] text-sm mb-4">Click Summary or Browse to fetch data from Supabase.</p>
            <button
              onClick={loadSummary}
              className="bg-[#0B2D5B] hover:bg-[#143C75] text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Load Data
            </button>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl border border-black/[0.07] p-10 text-center">
            <RefreshCw className="w-8 h-8 text-[#D4A017] animate-spin mx-auto mb-3" />
            <p className="text-[#6B6560] text-sm">Loading from Supabase...</p>
          </div>
        )}

        {/* ── Summary Mode ── */}
        {!loading && data?.mode === "summary" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Database className="w-5 h-5" />}
                label="FAA Registry (Supabase)"
                value={data.faaTotal?.toLocaleString() || "—"}
                color="#0B2D5B"
              />
              <StatCard
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="ABOS N-Reg Listings"
                value={data.abosNRegCount?.toLocaleString() || "0"}
                color="#0F7A56"
              />
              <StatCard
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="Matched"
                value={data.matched?.toLocaleString() || "0"}
                color="#185FA5"
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5" />}
                label="ABOS Only (not in FAA)"
                value={data.abosOnly?.toLocaleString() || "0"}
                color="#D4A017"
              />
            </div>

            {data.sampleMatches?.length > 0 && (
              <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#0F7A56] mb-3">
                  Matched — Found in Both (sample)
                </p>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-left text-[#AAA49C] border-b border-black/[0.06]">
                      <th className="pb-2 font-bold">N-Number</th>
                      <th className="pb-2 font-bold">Owner</th>
                      <th className="pb-2 font-bold">City/State</th>
                      <th className="pb-2 font-bold">Type</th>
                      <th className="pb-2 font-bold">Year</th>
                      <th className="pb-2 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sampleMatches.slice(0, 20).map((r, i) => (
                      <tr key={i} className="border-b border-black/[0.03] hover:bg-black/[0.01]">
                        <td className="py-2 font-mono font-bold text-[#0B2D5B]">{r.n_number || "—"}</td>
                        <td className="py-2 text-[#3A3530]">{r.name || "—"}</td>
                        <td className="py-2 text-[#6B6560]">{[r.city, r.state].filter(Boolean).join(", ") || "—"}</td>
                        <td className="py-2 text-[#3A3530]">{r.type_aircraft || "—"}</td>
                        <td className="py-2 text-[#6B6560]">{r.year_mfr || "—"}</td>
                        <td className="py-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/[0.04] text-[#6B6560]">
                            {r.status_code || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.abosOnlySample?.length > 0 && (
              <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
                <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#D4A017] mb-3">
                  ABOS Only — Not Found in FAA Registry
                </p>
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-left text-[#AAA49C] border-b border-black/[0.06]">
                      <th className="pb-2 font-bold">Registration</th>
                      <th className="pb-2 font-bold">Aircraft</th>
                      <th className="pb-2 font-bold">Year</th>
                      <th className="pb-2 font-bold">Status</th>
                      <th className="pb-2 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.abosOnlySample.map((l) => (
                      <tr key={l.id} className="border-b border-black/[0.03] hover:bg-black/[0.01]">
                        <td className="py-2 font-mono font-bold text-[#C0392B]">{l.registration}</td>
                        <td className="py-2 text-[#3A3530]">{l.make} {l.model}</td>
                        <td className="py-2 text-[#6B6560]">{l.year || "—"}</td>
                        <td className="py-2">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/[0.04] text-[#6B6560]">
                            {l.status}
                          </span>
                        </td>
                        <td className="py-2">
                          <Link to={`/ati-passport/${l.id}`} className="text-[#0B2D5B] hover:underline text-[10px] font-bold">
                            View <ExternalLink className="w-3 h-3 inline" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Browse Mode ── */}
        {!loading && data?.mode === "browse" && (
          <div className="bg-white rounded-2xl border border-black/[0.07] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#AAA49C]" />
                <input
                  type="text"
                  placeholder="Search N-number or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchData("browse", 1)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-black/[0.1] text-[13px]"
                />
              </div>
              <button
                onClick={() => fetchData("browse", 1)}
                className="text-[11px] font-bold bg-[#0B2D5B] text-white px-4 py-2 rounded-lg"
              >
                Search
              </button>
              <span className="text-[11px] text-[#AAA49C] ml-auto">
                {data.total?.toLocaleString()} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[#AAA49C] border-b border-black/[0.06]">
                    <th className="pb-2 font-bold">N-Number</th>
                    <th className="pb-2 font-bold">Owner</th>
                    <th className="pb-2 font-bold">Location</th>
                    <th className="pb-2 font-bold">Type</th>
                    <th className="pb-2 font-bold">Year</th>
                    <th className="pb-2 font-bold">Serial</th>
                    <th className="pb-2 font-bold">In ABOS</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.data || []).map((r, i) => (
                    <tr key={i} className="border-b border-black/[0.03] hover:bg-black/[0.01]">
                      <td className="py-2 font-mono font-bold text-[#0B2D5B]">{r.n_number || "—"}</td>
                      <td className="py-2 text-[#3A3530] max-w-[160px] truncate">{r.name || "—"}</td>
                      <td className="py-2 text-[#6B6560] text-[11px]">{[r.city, r.state].filter(Boolean).join(", ") || "—"}</td>
                      <td className="py-2 text-[#3A3530]">{r.type_aircraft || "—"}</td>
                      <td className="py-2 text-[#6B6560]">{r.year_mfr || "—"}</td>
                      <td className="py-2 text-[#AAA49C] text-[11px] font-mono">{r.serial_number || "—"}</td>
                      <td className="py-2">
                        {r.inAbos ? (
                          <span className="text-[10px] font-bold text-[#0F7A56] bg-[#0F7A56]/5 px-2 py-0.5 rounded-full">
                            In ABOS
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#AAA49C]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-black/[0.06]">
                <button
                  disabled={page <= 1}
                  onClick={() => { const p = page - 1; setPage(p); fetchData("browse", p); }}
                  className="p-1.5 rounded-lg hover:bg-black/[0.04] disabled:opacity-20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[12px] text-[#6B6560] font-bold">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => { const p = page + 1; setPage(p); fetchData("browse", p); }}
                  className="p-1.5 rounded-lg hover:bg-black/[0.04] disabled:opacity-20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-4">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <p className="text-[10px] uppercase tracking-[0.12em] font-bold" style={{ color }}>
          {label}
        </p>
      </div>
      <p className="text-2xl font-black text-[#1A1814]">{value}</p>
    </div>
  );
}
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  RefreshCw, Database, Search, ChevronLeft, ChevronRight,
  Plane, FileCode, Store, Cpu, Download, ArrowRight,
  AlertTriangle, CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";

/* ── Table definitions ─────────────────────────────────── */
const TABLES = [
  {
    id: "registry",
    label: "FAA Registry",
    icon: Database,
    color: "#0B2D5B",
    summaryMode: "registry_summary",
    browseMode: "browse",
    syncMode: "registry_sync",
    importMode: "registry_import_single",
    searchPlaceholder: "N-number or owner name...",
    totalKey: "faaRegistryTotal",
    syncedKey: "abosFaaAircraftCount",
    columns: [
      { key: "n_number", label: "N-Number", mono: true, bold: true },
      { key: "name", label: "Owner", truncate: true },
      { key: "city", label: "Location", format: (r) => [r.city, r.state].filter(Boolean).join(", ") },
      { key: "type_aircraft", label: "Type" },
      { key: "year_mfr", label: "Year" },
      { key: "status_code", label: "Status", badge: true },
    ],
    rowActions: [{ label: "Import to ABOS", icon: Download, mode: "registry_import_single", idField: "n_number" }],
    rowLinks: [{ label: "ABOS Listing", field: "abosListing", linkField: "id", linkPrefix: "/ati-passport/" }],
    hasBatches: true,
  },
  {
    id: "acftref",
    label: "ACFTREF",
    icon: FileCode,
    color: "#f59e0b",
    summaryMode: "acftref_summary",
    browseMode: "acftref_browse",
    syncMode: "acftref_sync",
    importMode: "acftref_enrich_single",
    searchPlaceholder: "Code, make or model...",
    totalKey: "faaAcftrefTotal",
    syncedKey: "acftrefSyncedCount",
    columns: [
      { key: "code", label: "Code", mono: true, bold: true },
      { key: "mfr", label: "Manufacturer", truncate: true },
      { key: "model", label: "Model" },
      { key: "type_aircraft", label: "Type" },
      { key: "type_engine", label: "Engine Type" },
      { key: "ac_cat", label: "Category" },
    ],
    rowActions: [{ label: "Enrich Listings", icon: RefreshCw, mode: "acftref_enrich_single", idField: "code" }],
    rowLinks: [],
    hasBatches: false,
  },
  {
    id: "dealers",
    label: "Dealers",
    icon: Store,
    color: "#06b6d4",
    summaryMode: "dealers_summary",
    browseMode: "dealers_browse",
    syncMode: "dealers_sync",
    importMode: "dealers_import_single",
    searchPlaceholder: "Name or cert number...",
    totalKey: "faaDealersTotal",
    syncedKey: "dealersSyncedCount",
    columns: [
      { key: "cert_num", label: "Cert #", mono: true, bold: true },
      { key: "name", label: "Name", truncate: true },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "zip_code", label: "ZIP" },
      { key: "is_active", label: "Active", badge: true },
    ],
    rowActions: [{ label: "Import to ABOS", icon: Download, mode: "dealers_import_single", idField: "cert_num" }],
    rowLinks: [],
    hasBatches: true,
  },
  {
    id: "engine",
    label: "Engine",
    icon: Cpu,
    color: "#22c55e",
    summaryMode: "engine_summary",
    browseMode: "engine_browse",
    syncMode: "engine_sync",
    importMode: "engine_enrich_single",
    searchPlaceholder: "Code, mfr or model...",
    totalKey: "faaEngineTotal",
    syncedKey: "engineSyncedCount",
    columns: [
      { key: "code", label: "Code", mono: true, bold: true },
      { key: "mfr", label: "Manufacturer", truncate: true },
      { key: "model", label: "Model" },
      { key: "type", label: "Type" },
      { key: "horsepower", label: "HP" },
      { key: "thrust", label: "Thrust" },
    ],
    rowActions: [{ label: "Enrich Aircraft", icon: RefreshCw, mode: "engine_enrich_single", idField: "code" }],
    rowLinks: [],
    hasBatches: false,
  },
];

/* ── Stat Card ─────────────────────────────────────────── */
function StatPill({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-black/[0.06] px-4 py-3 text-center min-w-[100px]">
      <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-[#AAA49C]">{label}</p>
      <p className="text-lg font-black mt-0.5" style={{ color }}>{value?.toLocaleString?.() || value || "—"}</p>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
export default function SupabaseSync() {
  const [activeTab, setActiveTab] = useState("registry");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [perRowLoading, setPerRowLoading] = useState(null);
  const [perRowResult, setPerRowResult] = useState(null);

  const table = TABLES.find((t) => t.id === activeTab) || TABLES[0];

  // Auto-load summary on mount & tab change
  useEffect(() => {
    fetchSummary();
  }, [activeTab]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("syncFaaFromSupabase", { mode: table.summaryMode });
      setData({ mode: table.summaryMode, ...res.data });
    } catch (err) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const browseData = async (p = 1) => {
    setLoading(true);
    setError(null);
    setPage(p);
    try {
      const res = await base44.functions.invoke("syncFaaFromSupabase", {
        mode: table.browseMode,
        page: p,
        pageSize: 50,
        search: search || undefined,
      });
      setData({ mode: table.browseMode, ...res.data });
    } catch (err) {
      setError(err.message || "Failed to browse");
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    setSyncing(true);
    setSyncProgress({ batch: 0, totalBatches: "?" });
    setError(null);
    try {
      const res = await base44.functions.invoke("syncFaaFromSupabase", { mode: table.syncMode });
      setSyncProgress(res.data);
      // Refresh data
      await fetchSummary();
    } catch (err) {
      setError(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const triggerPerRowAction = async (row, actionMode, idField) => {
    setPerRowLoading(`${actionMode}:${row[idField]}`);
    setPerRowResult(null);
    try {
      const res = await base44.functions.invoke("syncFaaFromSupabase", {
        mode: actionMode,
        [idField]: row[idField],
      });
      setPerRowResult({ ...res.data, rowId: row[idField] });
      setTimeout(() => setPerRowResult(null), 4000);
      fetchSummary();
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setPerRowLoading(null);
    }
  };

  const totalPages = data?.total ? Math.ceil(data.total / (data.pageSize || 50)) : 1;
  const supabaseTotal = data?.[table.totalKey] || data?.total || 0;
  const syncedCount = data?.[table.syncedKey] || 0;
  const syncPct = supabaseTotal > 0 ? Math.round((syncedCount / supabaseTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="bg-[#0B2D5B] px-4 md:px-8 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <Link to="/admin/settings" className="text-white/50 hover:text-white/80">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-[#E8A83A] flex items-center justify-center">
            <Database className="w-4 h-4 text-[#0B2D5B]" />
          </div>
          <div>
            <p className="text-[#E8A83A]/70 text-[9px] uppercase tracking-[0.2em] font-bold">Admin · FAA Supabase</p>
            <h1 className="text-xl font-black text-white uppercase tracking-tight">Database Sync Centre</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABLES.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setPage(1); setSearch(""); setData(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-[11px] font-bold border-b-2 transition-all ${
                  active
                    ? "bg-white text-[#0B2D5B] border-[#E8A83A]"
                    : "bg-transparent text-white/50 border-transparent hover:text-white/80 hover:bg-white/[0.06]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto space-y-5">
        {/* Error banner */}
        {error && (
          <div className="bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-[#991b1b]/60 hover:text-[#991b1b] font-bold text-[11px]">Dismiss</button>
          </div>
        )}

        {/* Per-row result toast */}
        {perRowResult && (
          <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
            perRowResult.success
              ? "bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534]"
              : "bg-[#fef2f2] border border-[#fecaca] text-[#991b1b]"
          }`}>
            {perRowResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {perRowResult.action || (perRowResult.success ? "Done" : "Failed")} — {perRowResult.rowId}
          </div>
        )}

        {/* Stats strip */}
        <div className="flex items-center gap-4 flex-wrap">
          <StatPill label="Supabase Total" value={supabaseTotal} color={table.color} />
          <StatPill label="ABOS Synced" value={syncedCount > 0 ? syncedCount.toLocaleString() : "—"} color={syncedCount > 0 ? "#0F7A56" : "#AAA49C"} />
          <StatPill label="Sync %" value={syncedCount > 0 ? `${syncPct}%` : "—"} color={syncedCount > 0 ? "#185FA5" : "#AAA49C"} />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#AAA49C]" />
              <input
                type="text"
                placeholder={table.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && browseData(1)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-black/[0.1] text-[12px] bg-white"
              />
            </div>
            <button
              onClick={() => browseData(1)}
              className="text-[11px] font-bold bg-[#0B2D5B] text-white px-4 py-2 rounded-lg hover:bg-[#185FA5] transition-colors"
            >
              Search
            </button>
            <button
              onClick={triggerSync}
              disabled={syncing}
              className={`text-[11px] font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                syncing
                  ? "bg-[#E8A83A]/30 text-[#A67C00] cursor-wait"
                  : "bg-[#E8A83A] text-[#0B2D5B] hover:bg-[#f5bb4e]"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : `Sync ${table.label}`}
            </button>
          </div>
        </div>

        {/* Sync progress */}
        {syncing && syncProgress && (
          <div className="bg-[#0B2D5B]/5 border border-[#0B2D5B]/10 rounded-xl px-4 py-3 text-sm text-[#0B2D5B] flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="font-bold">
              {table.hasBatches
                ? `Batch ${syncProgress.batch || 1} / ${syncProgress.totalBatches || "?"}`
                : `Processing ${syncProgress.totalRefs?.toLocaleString?.() || "..."} records...`}
            </span>
            {syncProgress.created !== undefined && (
              <span className="text-[11px] text-[#6B6560]">
                Created: {syncProgress.created} · Updated: {syncProgress.updated}
              </span>
            )}
          </div>
        )}

        {/* Sync result (post-sync) */}
        {!syncing && syncProgress && syncProgress.mode === table.syncMode && (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-4 py-3 text-sm text-[#166534] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Sync complete — {syncProgress.created || 0} created, {syncProgress.updated || 0} updated
          </div>
        )}

        {/* Loading */}
        {loading && !syncing && (
          <div className="bg-white rounded-2xl border border-black/[0.07] p-16 text-center">
            <RefreshCw className="w-8 h-8 text-[#D4A017] animate-spin mx-auto mb-3" />
            <p className="text-[#6B6560] text-sm">Loading {table.label} data from Supabase...</p>
          </div>
        )}

        {/* Data table */}
        {!loading && data && (data.mode === table.browseMode || data.mode === table.summaryMode) && (
          <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[#AAA49C] border-b border-black/[0.06] bg-black/[0.01]">
                    {table.columns.map((col) => (
                      <th key={col.key} className="pb-2.5 pt-3 px-4 font-bold text-[10px] uppercase tracking-wider">{col.label}</th>
                    ))}
                    <th className="pb-2.5 pt-3 px-4 font-bold text-[10px] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.data || data.sample || []).map((row, i) => (
                    <tr key={row.n_number || row.code || row.cert_num || i} className="border-b border-black/[0.03] hover:bg-black/[0.01] transition-colors">
                      {table.columns.map((col) => {
                        let val = col.format ? col.format(row) : row[col.key];
                        if (val === undefined || val === null || val === "") val = "—";
                        return (
                          <td key={col.key} className={`py-2.5 px-4 ${
                            col.mono ? "font-mono text-[11px]" : ""
                          } ${col.bold ? "font-bold text-[#0B2D5B]" : "text-[#3A3530]"} ${
                            col.truncate ? "max-w-[180px] truncate" : ""
                          }`}>
                            {col.badge ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/[0.04] text-[#6B6560]">
                                {String(val)}
                              </span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {table.rowActions.map((action) => (
                            <button
                              key={action.mode}
                              onClick={() => triggerPerRowAction(row, action.mode, action.idField)}
                              disabled={perRowLoading === `${action.mode}:${row[action.idField]}`}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-black/[0.08] text-[#6B6560] hover:border-[#0B2D5B] hover:text-[#0B2D5B] hover:bg-[#0B2D5B]/04 transition-all flex items-center gap-1 disabled:opacity-40"
                            >
                              {perRowLoading === `${action.mode}:${row[action.idField]}` ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <action.icon className="w-3 h-3" />
                              )}
                              {action.label}
                            </button>
                          ))}
                          {table.rowLinks.map((link) => {
                            const linked = link.field ? row[link.field] : row;
                            if (!linked?.id) return null;
                            return (
                              <Link
                                key={link.label}
                                to={`${link.linkPrefix}${linked.id}`}
                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#0F7A56]/20 text-[#0F7A56] hover:bg-[#0F7A56]/05 transition-all flex items-center gap-1"
                              >
                                {link.label} <ArrowRight className="w-3 h-3" />
                              </Link>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {(!data.data && !data.sample) || (data.data?.length === 0 && data.sample?.length === 0) ? (
              <div className="py-12 text-center">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-15" />
                <p className="text-sm text-[#AAA49C]">
                  {data.mode === table.summaryMode
                    ? `Click Search to browse ${table.label} records`
                    : "No records found"}
                </p>
                {data.mode === table.summaryMode && (
                  <button onClick={() => browseData(1)} className="mt-2 text-[11px] font-bold text-[#0B2D5B] hover:underline">
                    Browse all {supabaseTotal?.toLocaleString()} rows →
                  </button>
                )}
              </div>
            ) : null}

            {/* Row count */}
            {(data.data?.length > 0 || data.sample?.length > 0) && (
              <div className="px-4 py-2 text-[10px] text-[#AAA49C] border-t border-black/[0.04] bg-black/[0.005]">
                Showing {(data.data || data.sample || []).length} of {data.total?.toLocaleString?.() || supabaseTotal?.toLocaleString?.() || "?"} {table.label} records
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              disabled={page <= 1}
              onClick={() => browseData(page - 1)}
              className="p-2 rounded-lg bg-white border border-black/[0.08] hover:bg-black/[0.02] disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-bold text-[#6B6560]">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => browseData(page + 1)}
              className="p-2 rounded-lg bg-white border border-black/[0.08] hover:bg-black/[0.02] disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
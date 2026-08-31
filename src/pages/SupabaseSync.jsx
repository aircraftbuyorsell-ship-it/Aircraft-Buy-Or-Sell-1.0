import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  RefreshCw, Database, Search, ChevronLeft, ChevronRight,
  Plane, FileCode, Store, Cpu, Download, ArrowRight,
  AlertTriangle, CheckCircle2, CheckSquare, Square, X, Layers
} from "lucide-react";
import { Link } from "react-router-dom";
import SupabaseProjectsPanel from "@/components/supabase/SupabaseProjectsPanel";
import AiSafetyDefaultsCard from "@/components/supabase/AiSafetyDefaultsCard";

/* ── Table definitions ─────────────────────────────────── */
const TABLES = [
  {
    id: "registry",
    label: "FAA Registry",
    icon: Database,
    color: "#4e8ef7",
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
    <div className="bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.08)] px-4 py-3 text-center min-w-[100px]">
      <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-[rgba(255,255,255,0.35)]">{label}</p>
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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const table = TABLES.find((t) => t.id === activeTab) || TABLES[0];

  const browseRows = data?.data || data?.sample || [];
  const rowIdKey = table.rowActions[0]?.idField || "id";

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = browseRows.map((r) => r[rowIdKey]);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const triggerBulkAction = async () => {
    if (selectedIds.size === 0) return;
    const action = table.rowActions[0];
    if (!action) return;
    setBulkLoading(true);
    setBulkResult(null);
    let success = 0;
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await base44.functions.invoke("syncFaaFromSupabase", {
          mode: action.mode,
          [action.idField]: id,
        });
        success++;
      } catch (_) {
        failed++;
      }
    }
    setBulkResult({ success, failed, total: selectedIds.size, action: action.label });
    setBulkLoading(false);
    clearSelection();
    fetchSummary();
  };

  // Auto-load summary on mount & tab change
  useEffect(() => {
    fetchSummary();
  }, [activeTab]);

  // Clear selection on tab change
  useEffect(() => {
    setSelectedIds(new Set());
    setBulkResult(null);
  }, [activeTab]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("syncFaaFromSupabase", { mode: table.summaryMode });
      setData({ ...res.data, mode: table.summaryMode });
    } catch (err) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const browseData = async (p = 1) => {
    setLoading(true);
    setError(null);
    setData(null);
    setPage(p);
    try {
      const res = await base44.functions.invoke("syncFaaFromSupabase", {
        mode: table.browseMode,
        page: p,
        pageSize: 50,
        search: search || undefined,
      });
      setData({ ...res.data, mode: table.browseMode });
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
    <div className="min-h-screen" style={{ background: "transparent" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-5 pb-0" style={{ background: "rgba(13,17,23,0.95)", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3 mb-1">
          <Link to="/admin/settings" className="text-white/50 hover:text-white/80">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-[#f5c242] flex items-center justify-center">
            <Database className="w-4 h-4 text-[#4e8ef7]" />
          </div>
          <div>
            <p className="text-[#f5c242]/70 text-[9px] uppercase tracking-[0.2em] font-bold">Admin · FAA Supabase</p>
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
                    ? "bg-[rgba(255,255,255,0.04)] text-[#4e8ef7] border-[#f5c242]"
                    : "bg-transparent text-white/50 border-transparent hover:text-white/80 hover:bg-[rgba(255,255,255,0.04)]/[0.06]"
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
        {/* Supabase Projects Overview */}
        <SupabaseProjectsPanel />

        {/* AI Safety Defaults (ai_config) */}
        <AiSafetyDefaultsCard />

        {/* Error banner */}
        {error && (
          <div className="bg-[rgba(226,75,74,0.06)] border border-[rgba(226,75,74,0.22)] text-[#e24b4a] rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-[#e24b4a]/60 hover:text-[#e24b4a] font-bold text-[11px]">Dismiss</button>
          </div>
        )}

        {/* Per-row result toast */}
        {perRowResult && (
          <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
            perRowResult.success
              ? "bg-[rgba(93,202,165,0.06)] border border-[rgba(93,202,165,0.20)] text-[#5dcaa5]"
              : "bg-[rgba(226,75,74,0.06)] border border-[rgba(226,75,74,0.22)] text-[#e24b4a]"
          }`}>
            {perRowResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {perRowResult.action || (perRowResult.success ? "Done" : "Failed")} — {perRowResult.rowId}
          </div>
        )}

        {/* Bulk result toast */}
        {bulkResult && (
          <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2 bg-[rgba(93,202,165,0.06)] border border-[rgba(93,202,165,0.20)] text-[#5dcaa5]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-bold">{bulkResult.action}:</span>
            {bulkResult.success} succeeded{bulkResult.failed > 0 ? `, ${bulkResult.failed} failed` : ""} of {bulkResult.total} selected
            <button onClick={() => setBulkResult(null)} className="ml-auto text-[#5dcaa5]/60 hover:text-[#5dcaa5] font-bold text-[11px]">Dismiss</button>
          </div>
        )}

        {/* Stats strip */}
        <div className="flex items-center gap-4 flex-wrap">
          <StatPill label="Supabase Total" value={supabaseTotal} color={table.color} />
          <StatPill label="ABOS Synced" value={syncedCount > 0 ? syncedCount.toLocaleString() : "—"} color={syncedCount > 0 ? "#5dcaa5" : "#AAA49C"} />
          <StatPill label="Sync %" value={syncedCount > 0 ? `${syncPct}%` : "—"} color={syncedCount > 0 ? "#4e8ef7" : "#AAA49C"} />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgba(255,255,255,0.35)]" />
              <input
                type="text"
                placeholder={table.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && browseData(1)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-[12px] bg-[rgba(255,255,255,0.04)]"
              />
            </div>
            <button
              onClick={() => browseData(1)}
              className="text-[11px] font-bold bg-[#4e8ef7] text-white px-4 py-2 rounded-lg hover:bg-[#3d7ae0] transition-colors"
            >
              Search
            </button>
            <button
              onClick={triggerSync}
              disabled={syncing}
              className={`text-[11px] font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
                syncing
                  ? "bg-[#f5c242]/30 text-[#f5c242] cursor-wait"
                  : "bg-[#f5c242] text-[#4e8ef7] hover:bg-[#f5bb4e]"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : `Sync ${table.label}`}
            </button>
          </div>
        </div>

        {/* Sync progress */}
        {syncing && syncProgress && (
          <div className="bg-[#4e8ef7]/5 border border-[#4e8ef7]/10 rounded-xl px-4 py-3 text-sm text-[#4e8ef7] flex items-center gap-3">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="font-bold">
              {table.hasBatches
                ? `Batch ${syncProgress.batch || 1} / ${syncProgress.totalBatches || "?"}`
                : `Processing ${syncProgress.totalRefs?.toLocaleString?.() || "..."} records...`}
            </span>
            {syncProgress.created !== undefined && (
              <span className="text-[11px] text-[rgba(255,255,255,0.60)]">
                Created: {syncProgress.created} · Updated: {syncProgress.updated}
              </span>
            )}
          </div>
        )}

        {/* Sync result (post-sync) */}
        {!syncing && syncProgress && syncProgress.mode === table.syncMode && (
          <div className="bg-[rgba(93,202,165,0.06)] border border-[rgba(93,202,165,0.20)] rounded-xl px-4 py-3 text-sm text-[#5dcaa5] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Sync complete — {syncProgress.created || 0} created, {syncProgress.updated || 0} updated
          </div>
        )}

        {/* Loading */}
        {loading && !syncing && (
          <div className="bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)] p-16 text-center">
            <RefreshCw className="w-8 h-8 text-[#f5c242] animate-spin mx-auto mb-3" />
            <p className="text-[rgba(255,255,255,0.60)] text-sm">Loading {table.label} data from Supabase...</p>
          </div>
        )}

        {/* Data table */}
        {!loading && data && (data.mode === table.browseMode || data.mode === table.summaryMode) && (
          <div className="bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[rgba(255,255,255,0.35)] border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]">
                    <th className="pb-2.5 pt-3 px-4 w-8">
                      <button onClick={toggleSelectAll} className="text-[rgba(255,255,255,0.45)] hover:text-[#f5c242] transition-colors" aria-label="Select all visible rows">
                        {browseRows.length > 0 && browseRows.every((r) => selectedIds.has(r[rowIdKey]))
                          ? <CheckSquare className="w-4 h-4 text-[#f5c242]" />
                          : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    {table.columns.map((col) => (
                      <th key={col.key} className="pb-2.5 pt-3 px-4 font-bold text-[10px] uppercase tracking-wider">{col.label}</th>
                    ))}
                    <th className="pb-2.5 pt-3 px-4 font-bold text-[10px] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {browseRows.map((row, i) => {
                    const rowId = row[rowIdKey];
                    const isSelected = selectedIds.has(rowId);
                    return (
                    <tr key={row.n_number || row.code || row.cert_num || i} className={`border-b border-[rgba(255,255,255,0.06)] transition-colors ${isSelected ? "bg-[rgba(245,194,66,0.05)]" : "hover:bg-[rgba(255,255,255,0.03)]"}`}>
                      <td className="py-2.5 px-4">
                        <button onClick={() => toggleRow(rowId)} className="text-[rgba(255,255,255,0.45)] hover:text-[#f5c242] transition-colors" aria-label={`Select row ${rowId}`}>
                          {isSelected ? <CheckSquare className="w-4 h-4 text-[#f5c242]" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      {table.columns.map((col) => {
                        let val = col.format ? col.format(row) : row[col.key];
                        if (val === undefined || val === null || val === "") val = "—";
                        return (
                          <td key={col.key} className={`py-2.5 px-4 ${
                            col.mono ? "font-mono text-[11px]" : ""
                          } ${col.bold ? "font-bold text-[#4e8ef7]" : "text-[rgba(255,255,255,0.70)]"} ${
                            col.truncate ? "max-w-[180px] truncate" : ""
                          }`}>
                            {col.badge ? (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/[0.04] text-[rgba(255,255,255,0.60)]">
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
                              className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.60)] hover:border-[#4e8ef7] hover:text-[#4e8ef7] hover:bg-[#4e8ef7]/5 transition-all flex items-center gap-1 disabled:opacity-40"
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
                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#5dcaa5]/20 text-[#5dcaa5] hover:bg-[#5dcaa5]/5 transition-all flex items-center gap-1"
                              >
                                {link.label} <ArrowRight className="w-3 h-3" />
                              </Link>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Empty state */}
            {(data.data || data.sample || []).length === 0 ? (
              <div className="py-12 text-center">
                <Plane className="w-8 h-8 mx-auto mb-2 opacity-15" />
                <p className="text-sm text-[rgba(255,255,255,0.35)]">
                  {data.mode === table.summaryMode
                    ? `Click Search to browse ${table.label} records`
                    : "No records found"}
                </p>
                {data.mode === table.summaryMode && (
                  <button onClick={() => browseData(1)} className="mt-2 text-[11px] font-bold text-[#4e8ef7] hover:underline">
                    Browse all {supabaseTotal?.toLocaleString()} rows →
                  </button>
                )}
              </div>
            ) : null}

            {/* Row count */}
            {(data.data?.length > 0 || data.sample?.length > 0) && (
              <div className="px-4 py-2 text-[10px] text-[rgba(255,255,255,0.35)] border-t border-black/[0.04] bg-black/[0.005]">
                Showing {(data.data || data.sample || []).length} of {data.total?.toLocaleString?.() || supabaseTotal?.toLocaleString?.() || "?"} {table.label} records
              </div>
            )}
          </div>
        )}

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="sticky bottom-4 z-20 mx-auto max-w-fit">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl" style={{ background: "rgba(13,17,23,0.98)", border: "1px solid rgba(245,194,66,0.35)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
              <Layers className="w-4 h-4 text-[#f5c242] shrink-0" />
              <span className="text-[12px] font-bold text-white whitespace-nowrap">
                {selectedIds.size} selected
              </span>
              <button
                onClick={triggerBulkAction}
                disabled={bulkLoading}
                className="text-[11px] font-black px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all bg-[#f5c242] text-[#0d1117] hover:bg-[#f5bb4e] disabled:opacity-50"
              >
                {bulkLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {bulkLoading ? "Processing..." : `${table.rowActions[0]?.label || "Run"} (All)`}
              </button>
              <button
                onClick={clearSelection}
                className="text-[rgba(255,255,255,0.40)] hover:text-white p-1 transition-colors"
                aria-label="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              disabled={page <= 1}
              onClick={() => browseData(page - 1)}
              className="p-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.03)] disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-bold text-[rgba(255,255,255,0.60)]">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => browseData(page + 1)}
              className="p-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.03)] disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
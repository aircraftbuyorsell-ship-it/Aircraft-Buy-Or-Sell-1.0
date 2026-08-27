import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plane, Search, X, CheckSquare, Square, RefreshCw,
  ShieldCheck, Tag, ChevronDown, Loader2, SlidersHorizontal, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import { isAdminRole } from "@/utils/roles";

const STATUS_OPTIONS = ["active", "sold", "draft"];
const ATI_PRESETS = [
  { label: "EXCEPTIONAL (108)", value: 108 },
  { label: "STRONG BUY (93)", value: 93 },
  { label: "FAIR (78)", value: 78 },
  { label: "CAUTION (63)", value: 63 },
  { label: "RED FLAGS (45)", value: 45 },
  { label: "Clear ATI", value: null },
];

function StatusBadge({ status }) {
  const cfg = {
    active: "bg-green-100 text-green-700",
    sold:   "bg-gray-100 text-gray-600",
    draft:  "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${cfg[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status ?? "—"}
    </span>
  );
}

function ATIBadge({ score }) {
  if (!score) return <span className="text-[rgba(255,255,255,0.35)] text-xs">—</span>;
  const color = score >= 90 ? "#0F7A56" : score >= 72 ? "#185FA5" : score >= 54 ? "#D4A017" : "#C0392B";
  return <span className="text-xs font-black" style={{ color }}>{score}</span>;
}

export default function AdminListings() {
  const isDark = useTheme();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatus, setShowStatus] = useState(false);
  const [showATI, setShowATI] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-all-listings"],
    queryFn: () => base44.entities.AircraftListing.list("-created_date", 500),
    enabled: isAdminRole(currentUser),
  });

  const filtered = useMemo(() => listings.filter(l => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (q && !`${l.make} ${l.model} ${l.registration ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  }), [listings, search, statusFilter]);

  const allSelected = selectedIds.length === filtered.length && filtered.length > 0;

  const toggleOne = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => allSelected ? setSelectedIds([]) : setSelectedIds(filtered.map(l => l.id));
  const clearSel = () => setSelectedIds([]);

  const bulkUpdate = async (field, value) => {
    if (!selectedIds.length) return;
    setBulkLoading(true);
    try {
      await Promise.all(selectedIds.map(id => base44.entities.AircraftListing.update(id, { [field]: value })));
      toast.success(`Updated ${selectedIds.length} listing(s)`);
      clearSel();
      queryClient.invalidateQueries({ queryKey: ["admin-all-listings"] });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBulkLoading(false);
      setShowStatus(false);
      setShowATI(false);
    }
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} listing(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await Promise.all(selectedIds.map(id => base44.entities.AircraftListing.delete(id)));
      toast.success(`Deleted ${selectedIds.length} listing(s)`);
      clearSel();
      queryClient.invalidateQueries({ queryKey: ["admin-all-listings"] });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#C0392B] font-bold">Admin access required.</p>
      </div>
    );
  }

  const textPrimary = isDark ? "#ffffff" : "#1A1814";
  const textMuted = isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.90)";
  const inputBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)";
  const filterBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.80)";
  const filterBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)";
  const tableBg = isDark ? "rgba(13,20,50,0.70)" : "rgba(255,255,255,0.85)";
  const tableBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const rowDivider = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const rowAlt = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)";
  const headerText = isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.40)";

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8A83A] font-black">Admin Panel</p>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: textPrimary }}>All Aircraft Listings</h1>
          {!isLoading && <p className="text-xs sm:text-sm mt-0.5" style={{ color: textMuted }}>{listings.length} total · {filtered.length} shown</p>}
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors border"
          style={{ color: textMuted, borderColor: filterBorder, background: filterBg }}
          onMouseEnter={e => e.currentTarget.style.color = textPrimary}
          onMouseLeave={e => e.currentTarget.style.color = textMuted}>
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Make, model, registration…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: textMuted }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-xl px-2 py-1 border overflow-x-auto" style={{ background: filterBg, borderColor: filterBorder }}>
          <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" style={{ color: textMuted }} />
          {["all", ...STATUS_OPTIONS].map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className="px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold capitalize transition-colors whitespace-nowrap"
              style={statusFilter === s
                ? { background: "#E8A83A", color: "#0B2D5B" }
                : { color: textMuted }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 mb-4 px-3 sm:px-4 py-3 rounded-xl border"
          style={isDark
            ? { background: "rgba(11,45,91,0.85)", borderColor: "rgba(0,245,255,0.20)" }
            : { background: "rgba(255,255,255,0.95)", borderColor: "rgba(0,0,0,0.10)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
          <button onClick={toggleAll}
            className="flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
            style={{ color: isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.55)" }}>
            <CheckSquare className="w-4 h-4" />
            {allSelected ? "Deselect all" : `Select all (${filtered.length})`}
          </button>
          <div className="w-px h-4" style={{ background: isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.12)" }} />
          <span className="text-[12px] font-black" style={{ color: isDark ? "#E8A83A" : "#D4911A" }}>{selectedIds.length} selected</span>
          <div className="hidden sm:block flex-1" />

          {/* Set Status */}
          <div className="relative">
            <button onClick={() => { setShowStatus(v => !v); setShowATI(false); }}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors"
              style={isDark
                ? { background: "rgba(255,255,255,0.10)", borderColor: "rgba(255,255,255,0.20)", color: "#ffffff" }
                : { background: "rgba(0,0,0,0.05)", borderColor: "rgba(0,0,0,0.15)", color: "rgba(0,0,0,0.70)" }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.09)"}
              onMouseLeave={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.05)"}>
              <Tag className="w-3.5 h-3.5" /> Set Status <ChevronDown className="w-3 h-3" />
            </button>
            {showStatus && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-xl overflow-hidden min-w-[140px]"
                style={isDark ? { background: "#1a2040", border: "1px solid rgba(255,255,255,0.12)" } : { background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => bulkUpdate("status", s)}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-semibold capitalize transition-colors"
                    style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#1A1814" }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "#F7F4EF"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Set ATI */}
          <div className="relative">
            <button onClick={() => { setShowATI(v => !v); setShowStatus(false); }}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors"
              style={{ background: "rgba(232,168,58,0.20)", borderColor: "rgba(232,168,58,0.40)", color: isDark ? "#E8A83A" : "#A67C00" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(232,168,58,0.30)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(232,168,58,0.20)"}>
              <ShieldCheck className="w-3.5 h-3.5" /> Set ATI Score <ChevronDown className="w-3 h-3" />
            </button>
            {showATI && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-xl shadow-xl overflow-hidden min-w-[180px]"
                style={isDark ? { background: "#1a2040", border: "1px solid rgba(255,255,255,0.12)" } : { background: "#ffffff", border: "1px solid rgba(0,0,0,0.08)" }}>
                {ATI_PRESETS.map(p => (
                  <button key={p.label} onClick={() => bulkUpdate("ati_score", p.value)}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-semibold transition-colors"
                    style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#1A1814" }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.08)" : "#F7F4EF"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <button onClick={bulkDelete} disabled={bulkLoading}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors"
            style={{ background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.30)", color: isDark ? "#f87171" : "#dc2626" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.25)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}>
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>

          {bulkLoading && <Loader2 className="w-4 h-4 animate-spin" style={{ color: isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.50)" }} />}

          <button onClick={clearSel}
            className="flex items-center gap-1 text-[11px] transition-colors ml-1"
            style={{ color: isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.35)" }}
            onMouseEnter={e => e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.70)"}
            onMouseLeave={e => e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.35)"}>
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border overflow-x-auto"
        style={{ background: tableBg, borderColor: tableBorder, backdropFilter: isDark ? "blur(24px)" : "none" }}>
        {/* Header row */}
        <div className="grid items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b min-w-[680px]"
          style={{ gridTemplateColumns: "36px 40px 1fr 70px 80px 80px 70px 60px", borderColor: rowDivider }}>
          <button onClick={toggleAll} className="flex items-center justify-center transition-colors"
            style={{ color: headerText }}>
            {allSelected ? <CheckSquare className="w-4 h-4 text-[#E8A83A]" /> : <Square className="w-4 h-4" />}
          </button>
          {["ATI", "Aircraft", "Reg.", "Status", "Price", "TT", "Link"].map(h => (
            <p key={h} className="text-[8px] sm:text-[9px] uppercase tracking-[0.12em] sm:tracking-[0.15em] font-black" style={{ color: headerText }}>{h}</p>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-[#E8A83A]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ color: textMuted }}>
            <Plane className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No listings match your filters.</p>
          </div>
        ) : (
          filtered.map((l, i) => {
            const sel = selectedIds.includes(l.id);
            return (
              <div
                key={l.id}
                className="grid items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 last:border-0 transition-colors cursor-pointer min-w-[680px]"
                style={{
                  gridTemplateColumns: "36px 40px 1fr 70px 80px 80px 70px 60px",
                  borderTop: `1px solid ${rowDivider}`,
                  background: sel ? "rgba(232,168,58,0.08)" : i % 2 !== 0 ? rowAlt : undefined
                }}
                onClick={() => toggleOne(l.id)}
              >
                {/* Checkbox */}
                <div className="flex items-center justify-center" onClick={e => { e.stopPropagation(); toggleOne(l.id); }}>
                  {sel ? <CheckSquare className="w-4 h-4 text-[#E8A83A]" /> : <Square className="w-4 h-4" style={{ color: headerText }} />}
                </div>

                {/* ATI */}
                <div className="flex items-center justify-center">
                  <ATIBadge score={l.ati_score} />
                </div>

                {/* Aircraft */}
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-[13px] font-black truncate leading-tight" style={{ color: textPrimary }}>
                    {l.year ? `${l.year} ` : ""}{l.make} {l.model}
                  </p>
                  {l.deal_label && (
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase text-[#E8A83A] opacity-70">{l.deal_label}</span>
                  )}
                </div>

                {/* Reg */}
                <p className="text-[10px] sm:text-[11px] font-mono truncate" style={{ color: textMuted }}>{l.registration ?? "—"}</p>

                {/* Status */}
                <div><StatusBadge status={l.status} /></div>

                {/* Price */}
                <p className="text-[10px] sm:text-[12px] font-bold" style={{ color: isDark ? "rgba(255,255,255,0.80)" : "#1A1814" }}>
                  {l.asking_price ? `$${l.asking_price.toLocaleString()}` : <span style={{ color: textMuted }}>—</span>}
                </p>

                {/* TT */}
                <p className="text-[10px] sm:text-[12px]" style={{ color: textMuted }}>
                  {l.total_time ? l.total_time.toLocaleString() : "—"}
                </p>

                {/* Actions */}
                <div onClick={e => e.stopPropagation()}>
                  <Link to={`/ati-passport/${l.id}`}
                    className="text-[10px] font-bold transition-colors"
                    style={{ color: isDark ? "#00f5ff" : "#0B2D5B" }}>
                    ATI →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer count */}
      {!isLoading && filtered.length > 0 && (
        <p className="text-center text-xs mt-4" style={{ color: textMuted }}>
          Showing {filtered.length} of {listings.length} listings
        </p>
      )}
    </div>
  );
}
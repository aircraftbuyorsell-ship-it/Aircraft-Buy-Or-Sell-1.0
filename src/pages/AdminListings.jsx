import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Plane, Search, X, CheckSquare, Square, RefreshCw,
  ShieldCheck, Tag, ChevronDown, Loader2, SlidersHorizontal, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

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
  if (!score) return <span className="text-[#AAA49C] text-xs">—</span>;
  const color = score >= 90 ? "#0F7A56" : score >= 72 ? "#185FA5" : score >= 54 ? "#D4A017" : "#C0392B";
  return <span className="text-xs font-black" style={{ color }}>{score}</span>;
}

export default function AdminListings() {
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
    enabled: currentUser?.role === "admin",
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#E8A83A] font-black">Admin Panel</p>
          <h1 className="text-2xl font-black text-white tracking-tight">All Aircraft Listings</h1>
          {!isLoading && <p className="text-white/40 text-sm mt-0.5">{listings.length} total · {filtered.length} shown</p>}
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white/70 hover:text-white border border-white/10 hover:border-white/25 transition-colors">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Make, model, registration…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none border border-white/10 focus:border-[#E8A83A]/50"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-xl px-2 py-1 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
          <SlidersHorizontal className="w-3.5 h-3.5 text-white/30" />
          {["all", ...STATUS_OPTIONS].map(s => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${statusFilter === s ? "bg-[#E8A83A] text-[#0B2D5B]" : "text-white/50 hover:text-white"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 px-4 py-3 rounded-xl"
          style={{ background: "rgba(11,45,91,0.85)", border: "1px solid rgba(0,245,255,0.20)" }}>
          <button onClick={toggleAll}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-[11px] font-semibold transition-colors">
            <CheckSquare className="w-4 h-4" />
            {allSelected ? "Deselect all" : `Select all (${filtered.length})`}
          </button>
          <div className="w-px h-4 bg-white/20" />
          <span className="text-[#E8A83A] text-[12px] font-black">{selectedIds.length} selected</span>
          <div className="flex-1" />

          {/* Set Status */}
          <div className="relative">
            <button onClick={() => { setShowStatus(v => !v); setShowATI(false); }}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/20 transition-colors">
              <Tag className="w-3.5 h-3.5" /> Set Status <ChevronDown className="w-3 h-3" />
            </button>
            {showStatus && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-black/[0.08] rounded-xl shadow-xl overflow-hidden min-w-[140px]">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => bulkUpdate("status", s)}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-[#1A1814] hover:bg-[#F7F4EF] capitalize transition-colors">
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
              className="flex items-center gap-1.5 bg-[#E8A83A]/20 hover:bg-[#E8A83A]/30 text-[#E8A83A] text-[11px] font-bold px-3 py-1.5 rounded-lg border border-[#E8A83A]/40 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5" /> Set ATI Score <ChevronDown className="w-3 h-3" />
            </button>
            {showATI && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-black/[0.08] rounded-xl shadow-xl overflow-hidden min-w-[180px]">
                {ATI_PRESETS.map(p => (
                  <button key={p.label} onClick={() => bulkUpdate("ati_score", p.value)}
                    className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-[#1A1814] hover:bg-[#F7F4EF] transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <button onClick={bulkDelete} disabled={bulkLoading}
            className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-500/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>

          {bulkLoading && <Loader2 className="w-4 h-4 text-white animate-spin" />}

          <button onClick={clearSel}
            className="flex items-center gap-1 text-white/40 hover:text-white text-[11px] transition-colors ml-1">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden border border-white/10"
        style={{ background: "rgba(13,20,50,0.70)", backdropFilter: "blur(24px)" }}>
        {/* Header row */}
        <div className="grid items-center gap-3 px-4 py-3 border-b border-white/[0.06]"
          style={{ gridTemplateColumns: "40px 44px 1fr 80px 90px 90px 80px 80px" }}>
          <button onClick={toggleAll} className="flex items-center justify-center text-white/40 hover:text-white transition-colors">
            {allSelected
              ? <CheckSquare className="w-4 h-4 text-[#E8A83A]" />
              : <Square className="w-4 h-4" />}
          </button>
          {["ATI", "Aircraft", "Reg.", "Status", "Price", "TT (h)", "Actions"].map(h => (
            <p key={h} className="text-[9px] uppercase tracking-[0.15em] text-white/30 font-black">{h}</p>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-[#E8A83A]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-white/25">
            <Plane className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No listings match your filters.</p>
          </div>
        ) : (
          filtered.map((l, i) => {
            const sel = selectedIds.includes(l.id);
            return (
              <div
                key={l.id}
                className={`grid items-center gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 transition-colors cursor-pointer ${sel ? "bg-[#E8A83A]/08" : i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                style={{ gridTemplateColumns: "40px 44px 1fr 80px 90px 90px 80px 80px", background: sel ? "rgba(232,168,58,0.08)" : undefined }}
                onClick={() => toggleOne(l.id)}
              >
                {/* Checkbox */}
                <div className="flex items-center justify-center" onClick={e => { e.stopPropagation(); toggleOne(l.id); }}>
                  {sel
                    ? <CheckSquare className="w-4 h-4 text-[#E8A83A]" />
                    : <Square className="w-4 h-4 text-white/25 group-hover:text-white/50" />}
                </div>

                {/* ATI */}
                <div className="flex items-center justify-center">
                  <ATIBadge score={l.ati_score} />
                </div>

                {/* Aircraft */}
                <div className="min-w-0">
                  <p className="text-[13px] font-black text-white truncate leading-tight">
                    {l.year ? `${l.year} ` : ""}{l.make} {l.model}
                  </p>
                  {l.deal_label && (
                    <span className="text-[9px] font-bold uppercase text-[#E8A83A] opacity-70">{l.deal_label}</span>
                  )}
                </div>

                {/* Reg */}
                <p className="text-[11px] font-mono text-white/50 truncate">{l.registration ?? "—"}</p>

                {/* Status */}
                <div><StatusBadge status={l.status} /></div>

                {/* Price */}
                <p className="text-[12px] font-bold text-white/80">
                  {l.asking_price ? `$${l.asking_price.toLocaleString()}` : <span className="text-white/25">—</span>}
                </p>

                {/* TT */}
                <p className="text-[12px] text-white/50">
                  {l.total_time ? l.total_time.toLocaleString() : <span className="text-white/20">—</span>}
                </p>

                {/* Actions */}
                <div onClick={e => e.stopPropagation()}>
                  <Link to={`/ati-passport/${l.id}`}
                    className="text-[10px] font-bold text-[#00f5ff] hover:text-white transition-colors">
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
        <p className="text-center text-white/20 text-xs mt-4">
          Showing {filtered.length} of {listings.length} listings
        </p>
      )}
    </div>
  );
}
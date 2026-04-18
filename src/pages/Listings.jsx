import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { Plane, Search, SlidersHorizontal, X, ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ListingDrawer from "@/components/listings/ListingDrawer";
import ImportFromFBModal from "@/components/listings/ImportFromFBModal";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

function ATIBadge({ score }) {
  if (score == null) return (
    <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center">
      <span className="text-[9px] text-[#AAA49C] font-bold">—</span>
    </div>
  );
  const color = score >= 85 ? "#0F7A56" : score >= 65 ? "#A67C00" : "#C0392B";
  return (
    <div className="relative w-9 h-9 shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="#F0EDE6" strokeWidth="2.5" />
        <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={`${(score / 120) * 87.96} 87.96`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-black text-[#1A1814]">{score}</span>
      </div>
    </div>
  );
}

function DealBadge({ label, score }) {
  if (!label && !score) return null;
  const styles = {
    "hot deal": "bg-[rgba(212,160,23,0.12)] text-[#A67C00] border-[rgba(212,160,23,0.25)]",
    "good deal": "bg-[rgba(15,122,86,0.08)] text-[#0F7A56] border-[rgba(15,122,86,0.2)]",
    "fair": "bg-[rgba(24,95,165,0.08)] text-[#185FA5] border-[rgba(24,95,165,0.2)]",
    "overpriced": "bg-[rgba(192,57,43,0.08)] text-[#C0392B] border-[rgba(192,57,43,0.2)]",
  };
  const key = (label || "").toLowerCase();
  return (
    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${styles[key] || "bg-black/5 text-[#AAA49C] border-black/10"}`}>
      {label || "—"}
    </span>
  );
}

function ListingRow({ listing, onClick }) {
  const enginePct = listing.tbo
    ? Math.max(0, Math.min(100, ((listing.tbo - (listing.engine_hours || 0)) / listing.tbo) * 100))
    : null;

  return (
    <div
      onClick={() => onClick(listing)}
      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 md:px-6 py-4 hover:bg-[#F7F4EF] transition-colors cursor-pointer border-b border-black/[0.05] last:border-0"
    >
      <ATIBadge score={listing.ati_score} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-[#1A1814]">
            {listing.year && `${listing.year} `}{listing.make} {listing.model}
          </p>
          <DealBadge label={listing.deal_label} score={listing.deal_score} />
        </div>
        <div className="flex flex-wrap gap-3 mt-1">
          <span className="text-[11px] text-[#AAA49C] font-mono">{listing.registration || "—"}</span>
          {listing.total_time && <span className="text-[11px] text-[#6B6560]">{listing.total_time.toLocaleString()} TT</span>}
          {listing.engine_hours && <span className="text-[11px] text-[#6B6560]">{listing.engine_hours.toLocaleString()} ENG</span>}
          {listing.avionics && <span className="text-[11px] text-[#6B6560] truncate max-w-[120px]">{listing.avionics}</span>}
        </div>
        {enginePct != null && (
          <div className="mt-2 w-full max-w-[120px] h-1 bg-black/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#D4A017]" style={{ width: `${enginePct}%` }} />
          </div>
        )}
      </div>
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
        <p className="text-base font-black text-[#1A1814]">
          {listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : "—"}
        </p>
        {listing.omvm_value && (
          <p className={`text-[10px] font-semibold ${listing.discount_pct >= 0 ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
            {listing.discount_pct >= 0 ? "▼" : "▲"} {Math.abs(listing.discount_pct)}% vs OMVM
          </p>
        )}
        <Link
          to={`/ati-passport/${listing.id}`}
          onClick={e => e.stopPropagation()}
          className="text-[10px] text-[#D4A017] font-semibold hover:text-[#A67C00] flex items-center gap-0.5 uppercase tracking-wider"
        >
          ATI <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function Listings() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [makeFilter, setMakeFilter] = useState("");
  const [minATI, setMinATI] = useState(0);
  const [showFBImport, setShowFBImport] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings-public"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active", visibility: "public" }, "-ati_score", 100),
  });

  const makes = useMemo(() => [...new Set(listings.map(l => l.make).filter(Boolean))].sort(), [listings]);

  const filtered = useMemo(() => listings.filter(l => {
    const q = search.toLowerCase();
    if (q && !`${l.make} ${l.model} ${l.registration}`.toLowerCase().includes(q)) return false;
    if (makeFilter && l.make !== makeFilter) return false;
    if ((l.ati_score || 0) < minATI) return false;
    return true;
  }), [listings, search, makeFilter, minATI]);

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017] mb-1">Market · Listings</p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight">Aircraft Listings</h1>
            <p className="text-[#6B6560] text-sm mt-0.5">{filtered.length} aircraft available</p>
          </div>
          <button
            onClick={() => setShowFBImport(true)}
            className="flex items-center gap-2 bg-[#D4A017] hover:bg-[#A67C00] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            Import inzerátu
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-4 md:px-8 pb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search make, model, registration…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAA49C]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters ? "bg-[#D4A017] text-white border-[#D4A017]" : "bg-white border-black/10 text-[#6B6560] hover:border-[#D4A017]"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 bg-white border border-black/[0.07] rounded-xl p-4 flex flex-wrap gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1.5">Make</label>
              <select
                value={makeFilter}
                onChange={e => setMakeFilter(e.target.value)}
                className="text-sm border border-black/10 rounded-lg px-3 py-2 text-[#1A1814] bg-white focus:outline-none focus:border-[#D4A017]"
              >
                <option value="">All makes</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1.5">
                Min ATI: <span className="text-[#D4A017]">{minATI}</span>
              </label>
              <input type="range" min={0} max={100} step={5} value={minATI} onChange={e => setMinATI(+e.target.value)}
                className="w-36 accent-[#D4A017]" />
            </div>
            {(makeFilter || minATI > 0) && (
              <button onClick={() => { setMakeFilter(""); setMinATI(0); }}
                className="text-[11px] text-[#C0392B] font-medium self-end pb-2">Clear filters</button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div className="px-4 md:px-8 pb-8">
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-black/[0.05]">
                <div className="w-9 h-9 rounded-full bg-black/5 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-black/5 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-black/5 rounded animate-pulse w-1/3" />
                </div>
                <div className="h-6 bg-black/5 rounded animate-pulse w-20" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-[#AAA49C]">
              <Plane className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No listings match your filters</p>
            </div>
          ) : (
            filtered.map(l => <ListingRow key={l.id} listing={l} onClick={setSelected} />)
          )}
        </div>
      </div>

      <ListingDrawer listing={selected} onClose={() => setSelected(null)} />

      {showFBImport && (
        <ImportFromFBModal
          onClose={() => setShowFBImport(false)}
          onImported={(listing) => {
            queryClient.invalidateQueries({ queryKey: ["listings-public"] });
            setShowFBImport(false);
          }}
        />
      )}
    </div>
  );
}
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, RefreshCw } from "lucide-react";
import { useBehavior, useAutoTrack } from "@/lib/useBehavior";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import { detectRegType } from "@/lib/regUtils";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import ListingsHeader from "@/components/listings/ListingsHeader";
import ListingsBody from "@/components/listings/ListingsBody";

// ─── Page ────────────────────────────────────────────────────────
export default function Listings() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [makeFilter, setMakeFilter] = useState("");
  const [minATI, setMinATI] = useState(0);
  const [regRegion, setRegRegion] = useState("all"); // "all" | "faa" | "easa"
  const [showImport, setShowImport] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [gate, setGate] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "list" | "grid"
  const [shortlisted, setShortlisted] = useState([]);
  const [discarded, setDiscarded] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFAQ, setShowFAQ] = useState(false);

  const toggleSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const clearSelection = () => setSelectedIds([]);
  const selectAll = () => setSelectedIds(filtered.map((l) => l.id));

  useAutoTrack("listings");
  const { tokens, tier, isVerified, track } = useBehavior();

  const requireFeature = (feature, requiredTokens, openFn) => {
    const isFree = tier === "free_explorer" && !isVerified;
    const outOfCredits = tokens < requiredTokens;
    if (isFree || outOfCredits) {
      track("limit_hit", { feature });
      setGate({ feature, requiredTokens });
      return;
    }
    openFn();
  };

  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ["listings-public"],
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active", visibility: "public" }, "-ati_score", 5000)
  });

  const { distance, pulling, refreshing } = usePullToRefresh({ onRefresh: () => refetch() });

  const makes = useMemo(() => [...new Set(listings.map((l) => l.make).filter(Boolean))].sort(), [listings]);

  const filtered = useMemo(() => listings.filter((l) => {
    const q = search.toLowerCase();
    if (q && !`${l.make} ${l.model} ${l.registration}`.toLowerCase().includes(q)) return false;
    if (makeFilter && l.make !== makeFilter) return false;
    if ((l.ati_score || 0) < minATI) return false;
    if (regRegion !== "all") {
      const rt = detectRegType(l.registration);
      if (rt !== regRegion) return false;
    }
    return true;
  }), [listings, search, makeFilter, minATI, regRegion]);

  // Stats
  const scoredCount = listings.filter((l) => l.ati_score).length;
  const hotDeals = listings.filter((l) => l.deal_label === "hot deal").length;
  const avgATI = scoredCount > 0 ?
  Math.round(listings.filter((l) => l.ati_score).reduce((s, l) => s + l.ati_score, 0) / scoredCount) :
  null;

  return (
    <div className="min-h-screen" style={{ background: "transparent", color: "#fff" }}>
      {/* Pull-to-refresh */}
      <div className="md:hidden flex items-center justify-center overflow-hidden transition-[height] duration-150" style={{ height: distance, background: "#0d1117" }}>
        {(pulling || refreshing) &&
        <RefreshCw className={`w-5 h-5 text-[#f5c242] ${refreshing ? "animate-spin" : ""}`}
        style={{ transform: `rotate(${Math.min(360, distance * 4)}deg)` }} />
        }
      </div>

      {/* ── Header ── */}
      <ListingsHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        listingsCount={listings.length}
        scoredCount={scoredCount}
        hotDeals={hotDeals}
        avgATI={avgATI}
        isLoading={isLoading}
        onShowImport={() => setShowImport(true)}
        onShowWizard={() => setShowWizard(true)}
        requireFeature={requireFeature}
        onShowFAQ={() => setShowFAQ((v) => !v)}
      />

      {/* ── Search & Filters ── */}
      <div className="px-4 md:px-8 py-3 sticky top-0 z-10" style={{ background: "rgba(4,6,10,0.95)", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.3)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Make, model or registration…"
              className="w-full pl-9 pr-4 py-2 rounded-lg text-[13px] outline-none transition-colors" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "#fff" }} />

            {search &&
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.3)] hover:text-[rgba(255,255,255,0.6)]">
                <X className="w-3.5 h-3.5" />
              </button>
            }
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[12px] font-semibold transition-colors ${showFilters ? "text-[#04060a] border-[#f5c242]" : "border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.55)] hover:border-[#f5c242] hover:text-[#f5c242]"}`} style={showFilters ? { background: "#f5c242" } : { background: "rgba(255,255,255,0.04)" }}>

            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {(makeFilter || minATI > 0 || regRegion !== "all") && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
          </button>
        </div>

        {showFilters &&
        <div className="mt-2.5 rounded-xl p-4 flex flex-wrap gap-5 items-end" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <div className="min-w-[160px]">
              <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Registration</label>
              <select
              value={regRegion}
              onChange={(e) => setRegRegion(e.target.value)}
              className="w-full rounded-lg text-[13px] h-9 px-3 outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "#fff" }}>

                <option value="all">All registrations</option>
                <option value="faa">🇺🇸 FAA (N-Reg)</option>
                <option value="easa">🇪🇺 EASA (EU)</option>
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>Manufacturer</label>
              <BottomSheetSelect
              label="Filter by make"
              value={makeFilter}
              onChange={setMakeFilter}
              options={[{ value: "", label: "All manufacturers" }, ...makes.map((m) => ({ value: m, label: m }))]}
              placeholder="All manufacturers"
              className="w-full" />

            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Min ATI Score: <span className="text-[#f5c242] font-bold">{minATI}</span>
              </label>
              <input type="range" min={0} max={100} step={5} value={minATI}
            onChange={(e) => setMinATI(+e.target.value)}
            className="w-36 accent-[#f5c242] touch-target-compact" />
            </div>
            {(makeFilter || minATI > 0 || regRegion !== "all") &&
          <button onClick={() => {setMakeFilter("");setMinATI(0);setRegRegion("all");}}
          className="text-[11px] text-[#e24b4a] font-semibold hover:underline pb-1 touch-target-compact">
                Clear filters
              </button>
          }
          </div>
        }

        {/* Active filter pills */}
        {(makeFilter || minATI > 0 || regRegion !== "all") && !showFilters &&
        <div className="flex gap-1.5 mt-2 flex-wrap">
            {regRegion !== "all" &&
          <span className="flex items-center gap-1 text-[10px] text-[#04060a] px-2.5 py-1 rounded-full font-semibold" style={{ background: "#f5c242" }}>
                {regRegion === "faa" ? "🇺🇸 FAA" : "🇪🇺 EASA"} <button onClick={() => setRegRegion("all")}><X className="w-2.5 h-2.5" /></button>
              </span>
          }
            {makeFilter &&
          <span className="flex items-center gap-1 text-[10px] text-[#04060a] px-2.5 py-1 rounded-full font-semibold" style={{ background: "#f5c242" }}>
                {makeFilter} <button onClick={() => setMakeFilter("")}><X className="w-2.5 h-2.5" /></button>
              </span>
          }
            {minATI > 0 &&
          <span className="flex items-center gap-1 text-[10px] text-[#04060a] px-2.5 py-1 rounded-full font-semibold" style={{ background: "#f5c242" }}>
                ATI ≥ {minATI} <button onClick={() => setMinATI(0)}><X className="w-2.5 h-2.5" /></button>
              </span>
          }
          </div>
        }
      </div>

      {/* ── Body ── */}
      <ListingsBody
        isLoading={isLoading}
        filtered={filtered}
        listings={listings}
        viewMode={viewMode}
        shortlisted={shortlisted}
        discarded={discarded}
        selectedIds={selectedIds}
        selected={selected}
        showImport={showImport}
        showWizard={showWizard}
        showFAQ={showFAQ}
        gate={gate}
        tokens={tokens}
        isVerified={isVerified}
        queryClient={queryClient}
        setShortlisted={setShortlisted}
        setDiscarded={setDiscarded}
        setSelected={setSelected}
        setShowImport={setShowImport}
        setShowWizard={setShowWizard}
        setShowFAQ={setShowFAQ}
        setGate={setGate}
        selectAll={selectAll}
        clearSelection={clearSelection}
        toggleSelect={toggleSelect}
        requireFeature={requireFeature}
      />
    </div>);
}
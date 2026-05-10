import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import {
  Plane, Search, SlidersHorizontal, X, ArrowUpRight,
  Upload, FileArchive, RefreshCw, TrendingDown, TrendingUp,
  ShieldCheck, LayoutList, CreditCard, ThumbsUp, ThumbsDown
} from "lucide-react";
import { Link } from "react-router-dom";
import ListingDrawer from "@/components/listings/ListingDrawer";
import ImportAndEditFlow from "@/components/listings/ImportAndEditFlow";
import UpgradeGate from "@/components/marketing/UpgradeGate";
import AircraftWizard from "@/components/aircraft-wizard/AircraftWizard";
import BottomSheetSelect from "@/components/ui/BottomSheetSelect";
import { useBehavior, useAutoTrack } from "@/lib/useBehavior";
import { TOKEN_COSTS } from "@/lib/pricing";
import { usePullToRefresh } from "@/lib/usePullToRefresh";
import SwipeDeck from "@/components/listings/SwipeCard";

// ─── ATI Score Ring ──────────────────────────────────────────────
function ATIBadge({ score }) {
  if (score == null) return (
    <div className="w-10 h-10 rounded-full bg-black/5 border border-black/[0.06] flex items-center justify-center shrink-0">
      <span className="text-[9px] text-[#AAA49C] font-bold">—</span>
    </div>
  );
  const color = score >= 90 ? "#0F7A56" : score >= 72 ? "#185FA5" : score >= 54 ? "#D4A017" : "#C0392B";
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
        <circle cx="20" cy="20" r="16" fill="none" stroke="#F0EDE6" strokeWidth="3" />
        <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 120) * 100.5} 100.5`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-black text-[#1A1814]">{score}</span>
      </div>
    </div>
  );
}

// ─── Deal Badge ──────────────────────────────────────────────────
function DealBadge({ label }) {
  if (!label) return null;
  const styles = {
    "hot deal": "bg-[rgba(212,160,23,0.12)] text-[#A67C00] border-[rgba(212,160,23,0.3)]",
    "good deal": "bg-[rgba(15,122,86,0.1)] text-[#0F7A56] border-[rgba(15,122,86,0.25)]",
    "fair": "bg-[rgba(24,95,165,0.08)] text-[#185FA5] border-[rgba(24,95,165,0.2)]",
    "overpriced": "bg-[rgba(192,57,43,0.08)] text-[#C0392B] border-[rgba(192,57,43,0.2)]",
  };
  const key = label.toLowerCase();
  return (
    <span className={`text-[8px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full border ${styles[key] || "bg-black/5 text-[#AAA49C] border-black/10"}`}>
      {label}
    </span>
  );
}

// ─── Listing Row ─────────────────────────────────────────────────
function ListingRow({ listing, onClick }) {
  const enginePct = listing.tbo
    ? Math.max(0, Math.min(100, ((listing.tbo - (listing.engine_hours || 0)) / listing.tbo) * 100))
    : null;
  const engineColor = enginePct > 60 ? "#0F7A56" : enginePct > 30 ? "#D4A017" : "#C0392B";
  const hasDiscount = listing.discount_pct != null;
  const isBelow = hasDiscount && listing.discount_pct >= 0;

  return (
    <div
      onClick={() => onClick(listing)}
      className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 md:px-6 py-4 hover:bg-[#F7F4EF] transition-all cursor-pointer border-b border-black/[0.05] last:border-0"
    >
      {/* ATI Ring */}
      <ATIBadge score={listing.ati_score} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="text-sm font-black text-[#1A1814]">
            {listing.year && `${listing.year} `}{listing.make} {listing.model}
          </p>
          {listing.registration && (
            <span className="text-[10px] text-[#AAA49C] font-mono bg-black/5 px-1.5 py-0.5 rounded">
              {listing.registration}
            </span>
          )}
          <DealBadge label={listing.deal_label} />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {listing.total_time && (
            <span className="text-[11px] text-[#6B6560]">
              <span className="text-[#AAA49C]">TT</span> {listing.total_time.toLocaleString()} hrs
            </span>
          )}
          {listing.engine_hours && (
            <span className="text-[11px] text-[#6B6560]">
              <span className="text-[#AAA49C]">ENG</span> {listing.engine_hours.toLocaleString()} hrs
            </span>
          )}
          {listing.avionics && (
            <span className="text-[11px] text-[#6B6560] truncate max-w-[150px]">{listing.avionics}</span>
          )}
        </div>

        {/* Engine life bar */}
        {enginePct != null && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-24 h-1.5 bg-black/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${enginePct}%`, backgroundColor: engineColor }} />
            </div>
            <span className="text-[9px] text-[#AAA49C]">{Math.round(enginePct)}% eng life</span>
          </div>
        )}
      </div>

      {/* Price + ATI link */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 shrink-0">
        <div className="text-right">
          <p className="text-base font-black text-[#1A1814]">
            {listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : <span className="text-[#AAA49C] text-sm">Price on request</span>}
          </p>
          {hasDiscount && (
            <div className={`flex items-center justify-end gap-0.5 text-[10px] font-bold ${isBelow ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
              {isBelow ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              {Math.abs(listing.discount_pct)}% {isBelow ? "below" : "above"} market
            </div>
          )}
        </div>
        <Link
          to={`/ati-passport/${listing.id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] text-[#D4A017] hover:text-[#0B2D5B] font-black uppercase tracking-wider transition-colors whitespace-nowrap group-hover:gap-1.5"
        >
          View Score Card <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Stat Pill ───────────────────────────────────────────────────
function StatPill({ value, label, color = "#0B2D5B" }) {
  return (
    <div className="text-center px-4">
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold mt-0.5">{label}</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────
export default function Listings() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [makeFilter, setMakeFilter] = useState("");
  const [minATI, setMinATI] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [gate, setGate] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // "list" | "cards"
  const [shortlisted, setShortlisted] = useState([]);
  const [discarded, setDiscarded] = useState([]);

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
    queryFn: () => base44.entities.AircraftListing.filter({ status: "active", visibility: "public" }, "-ati_score", 100),
  });

  const { distance, pulling, refreshing } = usePullToRefresh({ onRefresh: () => refetch() });

  const makes = useMemo(() => [...new Set(listings.map(l => l.make).filter(Boolean))].sort(), [listings]);

  const filtered = useMemo(() => listings.filter(l => {
    const q = search.toLowerCase();
    if (q && !`${l.make} ${l.model} ${l.registration}`.toLowerCase().includes(q)) return false;
    if (makeFilter && l.make !== makeFilter) return false;
    if ((l.ati_score || 0) < minATI) return false;
    return true;
  }), [listings, search, makeFilter, minATI]);

  // Stats
  const scoredCount = listings.filter(l => l.ati_score).length;
  const hotDeals = listings.filter(l => l.deal_label === "hot deal").length;
  const avgATI = scoredCount > 0
    ? Math.round(listings.filter(l => l.ati_score).reduce((s, l) => s + l.ati_score, 0) / scoredCount)
    : null;

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Pull-to-refresh */}
      <div className="md:hidden flex items-center justify-center overflow-hidden transition-[height] duration-150 bg-[#F7F4EF]" style={{ height: distance }}>
        {(pulling || refreshing) && (
          <RefreshCw className={`w-5 h-5 text-[#0B2D5B] ${refreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${Math.min(360, distance * 4)}deg)` }} />
        )}
      </div>

      {/* ── Header ── */}
      <div className="bg-[#0B2D5B] border-b border-white/5">
        <div className="px-4 md:px-8 py-6">
          <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.2em] font-bold mb-2">Market · Aircraft Inventory</p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Off-Market Aircraft
              </h1>
              <p className="text-white/50 text-sm mt-1">
                {filtered.length} aircraft — independently scored, priced against real market data
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {/* View mode toggle */}
              <div className="flex bg-white/10 rounded-xl p-1 border border-white/15">
                <button onClick={() => setViewMode("cards")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === "cards" ? "bg-white text-[#0B2D5B]" : "text-white/60 hover:text-white"}`}>
                  <CreditCard className="w-3.5 h-3.5" /> Cards
                </button>
                <button onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === "list" ? "bg-white text-[#0B2D5B]" : "text-white/60 hover:text-white"}`}>
                  <LayoutList className="w-3.5 h-3.5" /> List
                </button>
              </div>
              <button
                onClick={() => requireFeature("bulk_import", TOKEN_COSTS.bulk_import_per_listing * 10, () => setShowImport(true))}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
              >
                <FileArchive className="w-4 h-4" />
                <span className="hidden sm:inline">Import & Edit</span>
                <span className="sm:hidden">Import</span>
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] text-sm font-black px-4 py-2.5 rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4" />
                Add Aircraft
              </button>
            </div>
          </div>

          {/* Inline stats */}
          {!isLoading && listings.length > 0 && (
            <div className="flex items-center gap-0 mt-5 divide-x divide-white/10 bg-white/5 rounded-xl w-fit">
              <StatPill value={listings.length} label="Total Aircraft" color="#E8A83A" />
              <StatPill value={scoredCount} label="ATI Scored" color="#6FA3E8" />
              <StatPill value={hotDeals} label="Hot Deals" color="#F5C842" />
              {avgATI && <StatPill value={avgATI} label="Avg ATI Score" color="#A8D5BE" />}
            </div>
          )}
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="px-4 md:px-8 py-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search make, model or tail number…"
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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${showFilters ? "bg-[#D4A017] text-white border-[#D4A017]" : "bg-white border-black/10 text-[#6B6560] hover:border-[#D4A017]"}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 bg-white border border-black/[0.07] rounded-xl p-4 flex flex-wrap gap-5 items-end">
            <div className="min-w-[180px]">
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1.5">Manufacturer</label>
              <BottomSheetSelect
                label="Filter by make"
                value={makeFilter}
                onChange={setMakeFilter}
                options={[{ value: "", label: "All manufacturers" }, ...makes.map(m => ({ value: m, label: m }))]}
                placeholder="All manufacturers"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1.5">
                Min ATI Score: <span className="text-[#D4A017] font-black">{minATI}</span>
              </label>
              <input type="range" min={0} max={100} step={5} value={minATI}
                onChange={e => setMinATI(+e.target.value)}
                className="w-36 accent-[#D4A017] touch-target-compact" />
            </div>
            {(makeFilter || minATI > 0) && (
              <button onClick={() => { setMakeFilter(""); setMinATI(0); }}
                className="text-[11px] text-[#C0392B] font-bold hover:underline pb-1 touch-target-compact">
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Active filter pills */}
        {(makeFilter || minATI > 0) && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {makeFilter && (
              <span className="flex items-center gap-1 text-[10px] bg-[#0B2D5B] text-white px-2.5 py-1 rounded-full font-bold">
                {makeFilter}
                <button onClick={() => setMakeFilter("")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {minATI > 0 && (
              <span className="flex items-center gap-1 text-[10px] bg-[#0B2D5B] text-white px-2.5 py-1 rounded-full font-bold">
                ATI ≥ {minATI}
                <button onClick={() => setMinATI(0)}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Listings ── */}
      <div className="px-4 md:px-8 pb-8">
        {isLoading ? (
          <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-black/[0.05]">
                <div className="w-10 h-10 rounded-full bg-black/5 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-black/5 rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-black/5 rounded animate-pulse w-1/3" />
                </div>
                <div className="h-6 bg-black/5 rounded animate-pulse w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-black/[0.07] rounded-2xl flex flex-col items-center py-20 text-[#AAA49C]">
            <Plane className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-semibold text-[#6B6560]">No aircraft match your criteria</p>
            <p className="text-[11px] mt-1">Try adjusting your filters or adding a new listing</p>
            <button
              onClick={() => requireFeature("ati_passport_full", TOKEN_COSTS.ati_passport_full, () => setShowImport(true))}
              className="mt-4 flex items-center gap-2 bg-[#0B2D5B] text-white text-sm font-bold px-5 py-2.5 rounded-xl"
            >
              <Upload className="w-4 h-4" />
              Add First Listing
            </button>
          </div>
        ) : viewMode === "cards" ? (
          /* ── TINDER SWIPE DECK ── */
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Main deck (left, full width on mobile) */}
            <div className="w-full lg:flex-1 min-w-0">
              {/* Shortlist banner */}
              {shortlisted.length > 0 && (
                <div className="flex items-center gap-2 bg-[rgba(15,122,86,0.08)] border border-[rgba(15,122,86,0.2)] rounded-xl px-4 py-2.5 mb-4">
                  <ShieldCheck className="w-4 h-4 text-[#0F7A56] shrink-0" />
                  <p className="text-[12px] text-[#0F7A56] font-bold">
                    {shortlisted.length} shortlisted
                  </p>
                  <button onClick={() => setShortlisted([])} className="ml-auto text-[#0F7A56] opacity-60 hover:opacity-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {filtered.filter(l => !discarded.includes(l.id)).length === 0 ? (
                <div className="text-center py-16 text-[#AAA49C]">
                  <p className="text-2xl mb-2">✈️</p>
                  <p className="text-sm font-semibold text-[#6B6560]">You've reviewed all aircraft</p>
                  {discarded.length > 0 && (
                    <button onClick={() => setDiscarded([])}
                      className="mt-4 text-[11px] text-[#D4A017] font-bold hover:underline">
                      ↺ Restore {discarded.length} skipped
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <SwipeDeck
                    listings={filtered.filter(l => !discarded.includes(l.id))}
                    onLike={(l) => setShortlisted(prev => prev.includes(l.id) ? prev : [...prev, l.id])}
                    onDiscard={(l) => setDiscarded(prev => [...prev, l.id])}
                  />
                  {/* Mobile action buttons */}
                  <div className="flex lg:hidden items-center justify-center gap-6 mt-6">
                    <button
                      onClick={() => {
                        const top = filtered.filter(l => !discarded.includes(l.id))[0];
                        if (top) setDiscarded(prev => [...prev, top.id]);
                      }}
                      className="w-14 h-14 rounded-full bg-white border-2 border-[rgba(192,57,43,0.3)] text-[#C0392B] flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
                      title="Skip (Swipe left)"
                    >
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                    <p className="text-[10px] text-[#AAA49C] uppercase tracking-wider font-semibold">
                      {filtered.filter(l => !discarded.includes(l.id)).length} left
                    </p>
                    <button
                      onClick={() => {
                        const top = filtered.filter(l => !discarded.includes(l.id))[0];
                        if (top) {
                          setShortlisted(prev => prev.includes(top.id) ? prev : [...prev, top.id]);
                          setDiscarded(prev => [...prev, top.id]);
                        }
                      }}
                      className="w-14 h-14 rounded-full bg-white border-2 border-[rgba(15,122,86,0.3)] text-[#0F7A56] flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
                      title="Shortlist (Swipe right)"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Desktop sidebar stats */}
            <div className="hidden lg:flex flex-col gap-4 w-80 shrink-0">
              {/* Summary card */}
              <div className="bg-white border border-black/[0.07] rounded-2xl p-5 sticky top-4">
                <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#0B2D5B] mb-4">Session Stats</p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] text-[#AAA49C] font-semibold mb-1">Remaining</p>
                    <p className="text-3xl font-black text-[#0B2D5B]">
                      {filtered.filter(l => !discarded.includes(l.id)).length}
                    </p>
                  </div>

                  <div className="h-px bg-black/[0.06]" />

                  <div>
                    <p className="text-[11px] text-[#AAA49C] font-semibold mb-1">Shortlisted</p>
                    <p className="text-2xl font-black text-[#0F7A56]">{shortlisted.length}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#AAA49C] font-semibold mb-1">Skipped</p>
                    <p className="text-2xl font-black text-[#C0392B]">{discarded.length}</p>
                  </div>

                  <div>
                    <p className="text-[11px] text-[#AAA49C] font-semibold mb-1">Reviewed</p>
                    <p className="text-2xl font-black text-[#D4A017]">
                      {shortlisted.length + discarded.length} / {filtered.length}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 pt-4 border-t border-black/[0.06]">
                  <div className="h-2 bg-black/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4A017] to-[#0B2D5B] rounded-full transition-all"
                      style={{
                        width: `${filtered.length > 0 ? ((shortlisted.length + discarded.length) / filtered.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-[9px] text-[#AAA49C] mt-2 text-center">
                    {filtered.length > 0 ? Math.round(((shortlisted.length + discarded.length) / filtered.length) * 100) : 0}% Complete
                  </p>
                </div>

                {/* Actions */}
                {discarded.length > 0 && (
                  <button
                    onClick={() => setDiscarded([])}
                    className="w-full mt-4 text-[11px] text-[#D4A017] font-bold hover:text-[#A67C00] transition-colors py-2 border-t border-black/[0.06]"
                  >
                    ↺ Restore skipped
                  </button>
                )}
              </div>

              {/* Top shortlisted preview (if any) */}
              {shortlisted.length > 0 && (
                <div className="bg-[rgba(15,122,86,0.06)] border border-[rgba(15,122,86,0.2)] rounded-2xl p-5">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#0F7A56] mb-3">Your Shortlist</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filtered
                      .filter(l => shortlisted.includes(l.id))
                      .slice(0, 5)
                      .map(l => (
                        <div key={l.id} className="flex items-start gap-2 pb-2 border-b border-[rgba(15,122,86,0.1)] last:border-0">
                          <div className="shrink-0 w-8 h-8 rounded bg-[#0F7A56] flex items-center justify-center">
                            <span className="text-white text-[10px] font-black">✓</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-[#0F7A56] truncate">{l.year} {l.make} {l.model}</p>
                            <p className="text-[10px] text-[#6B6560] font-mono">{l.registration}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  {shortlisted.length > 5 && (
                    <p className="text-[9px] text-[#6B6560] mt-2 text-center font-semibold">+{shortlisted.length - 5} more</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
            <div className="hidden sm:flex items-center gap-4 px-6 py-2.5 bg-[#F7F4EF] border-b border-black/[0.05]">
              <div className="w-10 shrink-0" />
              <div className="flex-1 text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold">Aircraft</div>
              <div className="shrink-0 w-32 text-right text-[9px] uppercase tracking-wider text-[#AAA49C] font-bold">Price / Market</div>
            </div>
            {filtered.map(l => <ListingRow key={l.id} listing={l} onClick={setSelected} />)}
          </div>
        )}

        {/* Score CTA */}
        {!isLoading && listings.filter(l => !l.ati_score).length > 0 && (
          <div className="mt-3 flex items-center gap-3 bg-[rgba(11,45,91,0.05)] border border-[rgba(11,45,91,0.12)] rounded-xl px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-[#0B2D5B] shrink-0" />
            <p className="text-[12px] text-[#4A4845]">
              <span className="font-black text-[#0B2D5B]">{listings.filter(l => !l.ati_score).length} aircraft</span> haven't been scored yet — open any listing and issue an ATI Score Card.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ListingDrawer listing={selected} onClose={() => setSelected(null)} />

      <ImportAndEditFlow
        open={showImport}
        onClose={() => setShowImport(false)}
        onPublish={() => {
          queryClient.invalidateQueries({ queryKey: ["listings-public"] });
          setShowImport(false);
        }}
      />

      <AircraftWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onPublish={() => {
          queryClient.invalidateQueries({ queryKey: ["listings-public"] });
          setShowWizard(false);
        }}
      />

      <UpgradeGate
        open={!!gate}
        onClose={() => setGate(null)}
        feature={gate?.feature}
        requiredTokens={gate?.requiredTokens}
        userTokens={tokens}
        isVerified={isVerified}
      />
    </div>
  );
}
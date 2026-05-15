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
    <div className="w-11 h-11 rounded-full bg-[#F0EDE6] border border-black/[0.06] flex items-center justify-center shrink-0">
      <span className="text-[9px] text-[#AAA49C] font-bold">—</span>
    </div>
  );
  const color = score >= 90 ? "#0F7A56" : score >= 72 ? "#185FA5" : score >= 54 ? "#D4A017" : "#C0392B";
  const bg = score >= 90 ? "rgba(15,122,86,0.08)" : score >= 72 ? "rgba(24,95,165,0.08)" : score >= 54 ? "rgba(212,160,23,0.08)" : "rgba(192,57,43,0.08)";
  return (
    <div className="relative w-11 h-11 shrink-0 rounded-full" style={{ background: bg }}>
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r="18" fill="none" stroke={`${color}30`} strokeWidth="3" />
        <circle cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 120) * 113.1} 113.1`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] font-black" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Deal Badge ──────────────────────────────────────────────────
function DealBadge({ label }) {
  if (!label) return null;
  const styles = {
    "hot deal":   { dot: "#D4A017", bg: "rgba(212,160,23,0.1)",  text: "#A67C00",  border: "rgba(212,160,23,0.25)" },
    "good deal":  { dot: "#0F7A56", bg: "rgba(15,122,86,0.08)", text: "#0F7A56",  border: "rgba(15,122,86,0.2)" },
    "fair":       { dot: "#185FA5", bg: "rgba(24,95,165,0.07)", text: "#185FA5",  border: "rgba(24,95,165,0.18)" },
    "overpriced": { dot: "#C0392B", bg: "rgba(192,57,43,0.07)", text: "#C0392B",  border: "rgba(192,57,43,0.18)" },
  };
  const s = styles[label.toLowerCase()];
  if (!s) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
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
      className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 px-5 md:px-6 py-4 hover:bg-[#FAFAF8] transition-all cursor-pointer border-b border-black/[0.04] last:border-0"
    >
      {/* ATI Ring */}
      <ATIBadge score={listing.ati_score} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <p className="text-[13px] font-black text-[#1A1814] tracking-tight">
            {listing.year && `${listing.year} `}{listing.make} {listing.model}
          </p>
          {listing.registration && (
            <span className="text-[10px] text-[#6B6560] font-mono bg-[#F0EDE6] px-2 py-0.5 rounded-md border border-black/[0.05]">
              {listing.registration}
            </span>
          )}
          <DealBadge label={listing.deal_label} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
          {listing.total_time && (
            <span className="text-[11px] text-[#6B6560]">
              <span className="text-[#AAA49C] font-medium">TT </span>{listing.total_time.toLocaleString()} h
            </span>
          )}
          {listing.engine_hours && (
            <span className="text-[11px] text-[#6B6560]">
              <span className="text-[#AAA49C] font-medium">ENG </span>{listing.engine_hours.toLocaleString()} h
            </span>
          )}
          {enginePct != null && (
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1 bg-black/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${enginePct}%`, backgroundColor: engineColor }} />
              </div>
              <span className="text-[9px] text-[#AAA49C] font-medium">{Math.round(enginePct)}%</span>
            </div>
          )}
          {listing.avionics && (
            <span className="text-[11px] text-[#AAA49C] truncate max-w-[140px]">{listing.avionics}</span>
          )}
        </div>
      </div>

      {/* Price + link */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
        <div className="text-right">
          <p className="text-[15px] font-black text-[#1A1814] tracking-tight">
            {listing.asking_price ? `$${listing.asking_price.toLocaleString()}` : <span className="text-[#AAA49C] text-sm font-normal">On request</span>}
          </p>
          {hasDiscount && (
            <div className={`flex items-center justify-end gap-0.5 text-[10px] font-bold mt-0.5 ${isBelow ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
              {isBelow ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
              {Math.abs(listing.discount_pct)}% {isBelow ? "below" : "above"}
            </div>
          )}
        </div>
        <Link
          to={`/ati-passport/${listing.id}`}
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-[10px] text-[#D4A017] hover:text-[#A67C00] font-bold transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100"
        >
          Score Card <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── Stat Pill ───────────────────────────────────────────────────
function StatPill({ value, label, color = "#E8A83A" }) {
  return (
    <div>
      <p className="text-lg font-black leading-none" style={{ color }}>{value}</p>
      <p className="text-[9px] uppercase tracking-[0.15em] text-white/40 font-semibold mt-1">{label}</p>
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
      <div className="relative overflow-hidden bg-[#0B2D5B] min-h-[320px] md:min-h-[380px]">
        <img
          src="https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/207a73d13_624324958_2759110867807924_1126729800774297176_n.jpg"
          alt="Aircraft viewed from an airport lounge window"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2D5B]/78 via-[#0B2D5B]/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-7 bg-[#111113]/95 shadow-[0_18px_45px_rgba(0,0,0,0.45)]" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#111113]/85 via-[#111113]/30 to-transparent" />
        <div className="absolute left-0 top-0 bottom-0 w-[9%] bg-gradient-to-r from-[#111113]/95 to-transparent" />
        <div className="absolute left-[23%] top-0 bottom-0 w-2 md:w-4 bg-[#111113]/82 shadow-[0_0_35px_rgba(0,0,0,0.55)] rotate-[-2deg] origin-top" />
        <div className="absolute left-[50%] top-0 bottom-0 w-2 md:w-4 bg-[#111113]/78 shadow-[0_0_35px_rgba(0,0,0,0.5)]" />
        <div className="absolute right-[18%] top-0 bottom-0 w-2 md:w-4 bg-[#111113]/82 shadow-[0_0_35px_rgba(0,0,0,0.55)] rotate-[2deg] origin-top" />
        <div className="absolute bottom-0 left-8 hidden md:block w-44 h-14 rounded-t-[2rem] bg-[#111113]/75 blur-[1px]" />
        <div className="absolute bottom-0 right-10 hidden md:block w-56 h-16 rounded-t-[2rem] bg-[#111113]/70 blur-[1px]" />
        <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-[1px]" />
        <div className="relative px-4 md:px-8 pt-8 md:pt-12 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 rounded-[2rem] border border-white/30 bg-white/[0.10] backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.38)] px-5 md:px-7 py-6 md:py-7 ring-1 ring-white/10">
            <div>
              <p className="text-[#E8A83A] text-[9px] uppercase tracking-[0.28em] font-bold mb-2 drop-shadow">Airport Lounge View · Aircraft Inventory</p>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-[-0.05em] leading-none drop-shadow-lg">
                Off-Market Aircraft
              </h1>
              {!isLoading && (
                <p className="text-white/75 text-[13px] mt-3 font-medium max-w-xl">
                  {filtered.length} aircraft · scored against real market data
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* View mode toggle */}
              <div className="flex bg-white/[0.16] backdrop-blur-md rounded-full p-1 border border-white/20 shadow-lg">
                <button onClick={() => setViewMode("cards")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold transition-colors ${viewMode === "cards" ? "bg-white text-[#0B2D5B] shadow-sm" : "text-white/65 hover:text-white"}`}>
                  <CreditCard className="w-3 h-3" /> Cards
                </button>
                <button onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-bold transition-colors ${viewMode === "list" ? "bg-white text-[#0B2D5B] shadow-sm" : "text-white/65 hover:text-white"}`}>
                  <LayoutList className="w-3 h-3" /> List
                </button>
              </div>
              <button
                onClick={() => requireFeature("bulk_import", TOKEN_COSTS.bulk_import_per_listing * 10, () => setShowImport(true))}
                className="flex items-center gap-1.5 bg-white/[0.14] hover:bg-white/[0.22] backdrop-blur-md border border-white/20 text-white text-[12px] font-bold px-4 py-2.5 rounded-full transition-colors shadow-lg"
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Import</span>
              </button>
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-1.5 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] text-[12px] font-black px-5 py-2.5 rounded-full transition-colors shadow-xl"
              >
                <Upload className="w-3.5 h-3.5" />
                Add Aircraft
              </button>
            </div>
          </div>

          {/* Inline stats */}
          {!isLoading && listings.length > 0 && (
            <div className="flex flex-wrap items-center gap-5 mt-5 rounded-[1.5rem] border border-white/20 bg-white/[0.12] backdrop-blur-xl px-5 py-4 shadow-xl">
              <StatPill value={listings.length} label="Total" color="#E8A83A" />
              <div className="w-px h-6 bg-white/10" />
              <StatPill value={scoredCount} label="ATI Scored" color="#6FA3E8" />
              <div className="w-px h-6 bg-white/10" />
              <StatPill value={hotDeals} label="Hot Deals" color="#F5C842" />
              {avgATI && <>
                <div className="w-px h-6 bg-white/10" />
                <StatPill value={avgATI} label="Avg ATI" color="#A8D5BE" />
              </>}
            </div>
          )}
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="px-4 md:px-8 py-3 bg-white border-b border-black/[0.05] sticky top-0 z-10 shadow-sm">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Make, model or tail number…"
              className="w-full pl-9 pr-4 py-2 bg-[#F7F4EF] border border-black/[0.07] rounded-lg text-[13px] text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:border-[#D4A017] focus:bg-white transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAA49C] hover:text-[#6B6560]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[12px] font-bold transition-colors ${showFilters ? "bg-[#D4A017] text-white border-[#D4A017]" : "bg-[#F7F4EF] border-black/[0.07] text-[#6B6560] hover:border-[#D4A017] hover:text-[#D4A017]"}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {(makeFilter || minATI > 0) && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
          </button>
        </div>

        {showFilters && (
          <div className="mt-2.5 bg-[#F7F4EF] border border-black/[0.06] rounded-xl p-4 flex flex-wrap gap-5 items-end">
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
                className="text-[11px] text-[#C0392B] font-semibold hover:underline pb-1 touch-target-compact">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Active filter pills */}
        {(makeFilter || minATI > 0) && !showFilters && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {makeFilter && (
              <span className="flex items-center gap-1 text-[10px] bg-[#0B2D5B] text-white px-2.5 py-1 rounded-full font-bold">
                {makeFilter} <button onClick={() => setMakeFilter("")}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {minATI > 0 && (
              <span className="flex items-center gap-1 text-[10px] bg-[#0B2D5B] text-white px-2.5 py-1 rounded-full font-bold">
                ATI ≥ {minATI} <button onClick={() => setMinATI(0)}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Listings ── */}
      <div className="px-4 md:px-8 py-5 pb-8">
        {isLoading ? (
          <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-black/[0.04]">
                <div className="w-11 h-11 rounded-full bg-black/[0.05] animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-black/[0.05] rounded-md animate-pulse w-2/5" />
                  <div className="h-2.5 bg-black/[0.04] rounded-md animate-pulse w-1/3" />
                </div>
                <div className="h-5 bg-black/[0.05] rounded-md animate-pulse w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-black/[0.07] rounded-2xl flex flex-col items-center py-16 text-[#AAA49C]">
            <div className="w-12 h-12 rounded-full bg-[#F0EDE6] flex items-center justify-center mb-3">
              <Plane className="w-6 h-6 text-[#AAA49C]" />
            </div>
            <p className="text-sm font-bold text-[#6B6560]">No aircraft match your criteria</p>
            <p className="text-[11px] mt-1 text-[#AAA49C]">Try adjusting filters or add a new listing</p>
            <button
              onClick={() => requireFeature("ati_passport_full", TOKEN_COSTS.ati_passport_full, () => setShowImport(true))}
              className="mt-4 flex items-center gap-2 bg-[#0B2D5B] text-white text-[12px] font-bold px-5 py-2.5 rounded-xl"
            >
              <Upload className="w-3.5 h-3.5" />
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
          <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-sm">
            <div className="hidden sm:flex items-center gap-5 px-6 py-2.5 bg-[#F7F4EF] border-b border-black/[0.05]">
              <div className="w-11 shrink-0" />
              <div className="flex-1 text-[9px] uppercase tracking-[0.12em] text-[#AAA49C] font-bold">Aircraft</div>
              <div className="shrink-0 w-28 text-right text-[9px] uppercase tracking-[0.12em] text-[#AAA49C] font-bold">Price</div>
            </div>
            {filtered.map(l => <ListingRow key={l.id} listing={l} onClick={setSelected} />)}
          </div>
        )}

        {/* Score CTA */}
        {!isLoading && listings.filter(l => !l.ati_score).length > 0 && (
          <div className="mt-4 flex items-center gap-3 bg-white border border-[rgba(11,45,91,0.1)] rounded-xl px-4 py-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[rgba(11,45,91,0.07)] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#0B2D5B]" />
            </div>
            <p className="text-[12px] text-[#6B6560]">
              <span className="font-black text-[#0B2D5B]">{listings.filter(l => !l.ati_score).length} aircraft</span> not yet scored — open any listing to issue an ATI Score Card.
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
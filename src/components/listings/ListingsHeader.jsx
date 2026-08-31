import { useState, useRef, useEffect } from "react";
import {
  Search, Zap, Upload, HelpCircle, ArrowRight, List, LayoutGrid,
  Plane, Loader2, ShieldCheck, X, Plus } from
"lucide-react";
import { base44 } from "@/api/base44Client";
import MarketspaceTourLauncher from "@/components/marketspace-tour/MarketspaceTourLauncher";

// ─── Design tokens ───────────────────────────────────────────────
const INK = "#04060a";
const CARD = "#0d1117";
const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const RED = "#e24b4a";

const AVIATION_PHOTO = "https://images.unsplash.com/photo-1559066653-0febae96b689?w=1200&q=80";

function atiColor(score) {
  if (score == null) return "rgba(255,255,255,0.4)";
  if (score >= 80) return TEAL;
  if (score >= 60) return AMBER;
  return RED;
}

// ─── Stat cell ───────────────────────────────────────────────────
function StatCell({ value, label, color, isLoading }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {isLoading ?
      <div className="h-8 w-16 rounded-md animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} /> :

      <span
        className="text-2xl md:text-[28px] font-medium tabular-nums leading-none"
        style={{ color: color || "#fff", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
        
          {value ?? "—"}
        </span>
      }
      <span
        className="text-[9px] uppercase font-semibold whitespace-nowrap"
        style={{ color: "rgba(255,255,255,0.42)", letterSpacing: "0.11em" }}>
        
        {label}
      </span>
    </div>);

}

// ─── View toggle ─────────────────────────────────────────────────
function ViewToggle({ viewMode, onViewModeChange }) {
  const btn = (mode, Icon, label) => {
    const active = viewMode === mode;
    return (
      <button
        onClick={() => onViewModeChange(mode)}
        aria-label={label}
        aria-pressed={active}
        className="flex items-center gap-1.5 h-8 px-3 rounded-md text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2"
        style={{
          background: active ? AMBER : "transparent",
          color: active ? INK : "rgba(255,255,255,0.55)",
          "--tw-ring-color": AMBER
        }}>
        
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{label}</span>
      </button>);

  };
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-lg"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)" }}>
      
      {btn("list", List, "List")}
      {btn("grid", LayoutGrid, "Grid")}
    </div>);

}

// ─── Badge chip ──────────────────────────────────────────────────
function BadgeChip({ children, color, dot, icon: Icon, pulse }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
      style={{
        background: `${color}14`,
        color,
        border: `1px solid ${color}28`,
        letterSpacing: "0.04em"
      }}>
      
      {dot &&
      <span className="relative flex w-1.5 h-1.5">
          {pulse &&
        <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: color }} />
        }
          <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ background: color }} />
        </span>
      }
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>);

}

// ─── FAA result card (inline) ────────────────────────────────────
function FaaResultCard({ faa, onCreate, creating }) {
  const statusActive = (faa.status_code || "").toUpperCase() === "A" || (faa.status_code || "").toUpperCase() === "V";
  return (
    <div
      className="mt-3 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
      
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[15px] font-medium" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
              N{faa.n_number}
            </p>
            <span
              className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full"
              style={{
                background: statusActive ? `${TEAL}18` : `${RED}18`,
                color: statusActive ? TEAL : RED,
                letterSpacing: "0.08em"
              }}>
              
              {statusActive ? "Active" : faa.status_code || "Unknown"}
            </span>
          </div>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>
            {faa.year_mfr || "—"} {faa.make || faa.mfr_mdl_code || ""} {faa.model || ""}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {faa.mode_s_hex &&
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                Mode S <span style={{ color: "rgba(255,255,255,0.7)" }}>{faa.mode_s_hex}</span>
              </span>
            }
            {faa.state &&
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                State <span style={{ color: "rgba(255,255,255,0.7)" }}>{faa.state}</span>
              </span>
            }
            {faa.serial_number &&
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                S/N <span style={{ color: "rgba(255,255,255,0.7)" }}>{faa.serial_number}</span>
              </span>
            }
          </div>
        </div>
        <button
          onClick={onCreate}
          disabled={creating}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 shrink-0"
          style={{ background: AMBER, color: INK, "--tw-ring-color": AMBER }}>
          
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Create ATI Card
        </button>
      </div>
    </div>);

}

// ─── Header ──────────────────────────────────────────────────────
export default function ListingsHeader({
  viewMode, onViewModeChange,
  listingsCount, scoredCount, hotDeals, avgATI, isLoading,
  onShowImport, onShowWizard, requireFeature, onShowFAQ
}) {
  const [lookupReg, setLookupReg] = useState("");
  const [showLookup, setShowLookup] = useState(false);
  const [searching, setSearching] = useState(false);
  const [faaResult, setFaaResult] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (showLookup && inputRef.current) inputRef.current.focus();
  }, [showLookup]);

  // Global ⌘K / Ctrl+K shortcut to open the N-number lookup — the pill next
  // to the search input advertised this but no listener ever backed it.
  useEffect(() => {
    const onGlobalKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        setShowLookup(true);
      }
    };
    window.addEventListener("keydown", onGlobalKeyDown);
    return () => window.removeEventListener("keydown", onGlobalKeyDown);
  }, []);

  const collapse = () => {
    setShowLookup(false);
    setLookupReg("");
    setFaaResult(null);
    setError("");
  };

  const handleLookup = async () => {
    const clean = lookupReg.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!clean) return;
    setSearching(true);
    setError("");
    setFaaResult(null);

    try {
      // 1. Search ABOS listings first
      const results = await base44.entities.AircraftListing.filter({ registration: clean }, "-created_date", 1);
      if (results.length > 0) {
        window.location.href = `/ati-passport/${results[0].id}`;
        return;
      }

      // 2. Global registry fallback (FAA or international)
      const res = await base44.functions.invoke("globalAircraftLookup", { registration: clean });
      if (res.data?.found) {
        setFaaResult(res.data.aircraft);
      } else {
        setError(res.data?.error || `No record found for ${clean}.`);
      }
    } catch (e) {
      setError("Lookup failed. Please try again.");
    }
    setSearching(false);
  };

  const handleCreateCard = async () => {
    if (!faaResult) return;
    setCreating(true);
    try {
      const res = await base44.functions.invoke("syncFaaToAtiCard", { registration: faaResult.registration || faaResult.n_number });
      if (res.data?.listingId) {
        window.location.href = `/ati-passport/${res.data.listingId}`;
      } else {
        setError(res.data?.error || "Failed to create ATI Card.");
      }
    } catch (e) {
      setError("Failed to create ATI Card. Please try again.");
    }
    setCreating(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLookup();
    if (e.key === "Escape") collapse();
  };

  return (
    <div className="relative overflow-hidden" style={{ background: INK }}>
      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px"
        }} />
      
      {/* Amber glow from top */}
      <div
        className="absolute top-0 left-1/4 right-0 h-48 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top, ${AMBER}1c, transparent 65%)` }} />
      
      {/* Aviation photo bleeding from right */}
      <div className="absolute top-0 right-0 bottom-0 w-1/2 pointer-events-none hidden md:block" style={{ opacity: 0.3 }}>
        <img src={AVIATION_PHOTO} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${INK}, rgba(0,0,0,0.8))` }} />
      </div>

      <div className="relative px-4 md:px-8 pt-7 md:pt-10 pb-6">
        {/* Top bar: eyebrow + actions */}
        <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full"
            style={{
              color: AMBER,
              background: `${AMBER}12`,
              border: `1px solid ${AMBER}24`,
              letterSpacing: "0.12em"
            }}>
            
            <Plane className="w-3 h-3" /> ABOS MarketSpace
          </span>

          <div className="flex items-center gap-2">
            <MarketspaceTourLauncher />
            <button
              onClick={onShowFAQ}
              aria-label="How it works"
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-all focus:outline-none focus-visible:ring-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                "--tw-ring-color": AMBER
              }}>
              
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => onShowImport(true)}
              className="hidden sm:flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-all focus:outline-none focus-visible:ring-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
                "--tw-ring-color": AMBER
              }}>
              
              <Upload className="w-3.5 h-3.5" /> Import
            </button>
            <button
              onClick={() => onShowWizard()}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-105 focus:outline-none focus-visible:ring-2"
              style={{ background: AMBER, color: INK, "--tw-ring-color": AMBER }}>
              
              <Plus className="w-3.5 h-3.5" /> Add Aircraft
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-xl">
          <h1
            className="text-3xl md:text-[40px] font-medium leading-[1.05] text-white"
            style={{ letterSpacing: "-0.04em" }}>
            
            Aircraft Market <span style={{ color: AMBER }}>Intelligence</span>
          </h1>
          <p className="mt-3 text-[13px] md:text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
            Browse the aircraft register with ATI™ scores, real-time market intelligence, and off-market valuation data.
          </p>
        </div>

        {/* N-number lookup */}
        <div className="mt-6 max-w-xl">
          {showLookup ?
          <div className="flex gap-2">
              <div
              className="relative flex-1 flex items-center rounded-lg overflow-hidden"
              style={{ background: CARD, border: `1px solid ${AMBER}` }}>
              
                <Search className="absolute left-3 w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />
                <input
                ref={inputRef}
                value={lookupReg}
                onChange={(e) => setLookupReg(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="N-NUMBER OR REGISTRATION"
                className="w-full bg-transparent pl-9 pr-3 py-2.5 text-[14px] font-mono outline-none"
                style={{ color: "#fff", letterSpacing: "0.05em" }} />
              
                <button onClick={collapse} aria-label="Close" className="px-2.5 text-white/40 hover:text-white/80 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
              onClick={handleLookup}
              disabled={searching || !lookupReg.trim()}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2.5 rounded-lg transition-all disabled:opacity-40 focus:outline-none focus-visible:ring-2 shrink-0"
              style={{ background: AMBER, color: INK, "--tw-ring-color": AMBER }}>
              
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>ATI Score <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </div> :

          <button
            onClick={() => setShowLookup(true)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all group focus:outline-none focus-visible:ring-2"
            style={{
              background: CARD,
              border: "1px solid rgba(255,255,255,0.10)",
              "--tw-ring-color": AMBER
            }}>
            
              <span className="flex items-center gap-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                <Search className="w-4 h-4" /> Look up N-number or aircraft…
              </span>
              <kbd
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
              
                ⌘K
              </kbd>
            </button>
          }

          {error &&
          <p className="mt-2 text-[11px]" style={{ color: RED }}>{error}</p>
          }

          {faaResult &&
          <FaaResultCard faa={faaResult} onCreate={handleCreateCard} creating={creating} />
          }
        </div>

        {/* Stats bar + view toggle */}
        <div
          className="mt-7 pt-5 flex items-end justify-between gap-4 flex-wrap"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          
          <div className="flex items-end gap-7 md:gap-10">
            <StatCell value={listingsCount} label="Total Listings" color="#fff" isLoading={isLoading} />
            <StatCell value={scoredCount} label="ATI Scored" color="#fff" isLoading={isLoading} />
            <StatCell value={hotDeals} label="Hot Deals" color={AMBER} isLoading={isLoading} />
            <StatCell value={avgATI} label="Avg ATI Score" color={atiColor(avgATI)} isLoading={isLoading} />
          </div>
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>

        {/* Sub-bar badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <BadgeChip color={TEAL} dot pulse>Live · 280k Members</BadgeChip>
          <BadgeChip color={AMBER} icon={Zap}>ATI™ Score Engine</BadgeChip>
          <BadgeChip color="rgba(255,255,255,0.5)" icon={ShieldCheck}>FAA Registry Verified</BadgeChip>
        </div>
      </div>
    </div>);

}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  CreditCard, LayoutList, Search, Zap, Upload, FileArchive,
  HelpCircle, X, ArrowRight } from
"lucide-react";
import { Link } from "react-router-dom";
import { useBehavior, useAutoTrack } from "@/lib/useBehavior";
import { TOKEN_COSTS } from "@/lib/pricing";

export default function ListingsHeader({
  viewMode, onViewModeChange,
  listingsCount, scoredCount, hotDeals, avgATI, isLoading,
  onShowImport, onShowWizard, requireFeature, onShowFAQ
}) {
  const [lookupReg, setLookupReg] = useState("");
  const [showLookup, setShowLookup] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me-listing-header"],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 60000,
  });

  const handleLookup = () => {
    const clean = lookupReg.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (!clean) return;
    // Search for existing listing by registration
    base44.entities.AircraftListing.filter({ registration: clean }, "-created_date", 1)
      .then((results) => {
        if (results.length > 0) {
          window.location.href = `/ati-passport/${results[0].id}`;
        } else {
          // No existing listing — open wizard with reg pre-filled
          onShowWizard();
        }
      })
      .catch(() => onShowWizard());
  };

  return (
    <div className="relative overflow-hidden bg-[#0B2D5B] min-h-[280px] md:min-h-[340px]">
      {/* Background */}
      <img
        src="https://images.unsplash.com/photo-1559066653-0febae96b689?w=1400&q=80"
        alt="Aircraft on ramp at sunset"
        className="absolute inset-0 w-full h-full object-cover opacity-75"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B2D5B]/85 via-[#0B2D5B]/50 to-[#0B2D5B]/90" />

      <div className="relative px-4 md:px-8 pt-8 md:pt-14 pb-8">
        {/* Top bar: view toggle + actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          {/* View toggle — moved to a cleaner position */}
          <div className="flex bg-white/[0.14] backdrop-blur-md rounded-full p-1 border border-white/15">
            <button
              onClick={() => onViewModeChange("cards")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold transition-all ${
                viewMode === "cards"
                  ? "bg-white text-[#0B2D5B] shadow-md"
                  : "text-white/70 hover:text-white"
              }`}>
              
              <CreditCard className="w-3.5 h-3.5" /> Cards
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white text-[#0B2D5B] shadow-md"
                  : "text-white/70 hover:text-white"
              }`}>
              
              <LayoutList className="w-3.5 h-3.5" /> List
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onShowFAQ}
              className="flex items-center gap-1.5 bg-white/[0.10] hover:bg-white/[0.18] backdrop-blur-md border border-white/15 text-white/80 hover:text-white text-[11px] font-semibold px-3.5 py-2 rounded-full transition-colors">
              
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">How it works</span>
            </button>
            <button
              onClick={() => requireFeature("bulk_import", TOKEN_COSTS.bulk_import_per_listing * 10, () => onShowImport(true))}
              className="flex items-center gap-1.5 bg-white/[0.10] hover:bg-white/[0.18] backdrop-blur-md border border-white/15 text-white/80 hover:text-white text-[11px] font-semibold px-3.5 py-2 rounded-full transition-colors">
              
              <FileArchive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </div>
        </div>

        {/* Main CTA area */}
        <div className="max-w-2xl">
          <p className="text-[#E8A83A] text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-black mb-3 drop-shadow-sm">
            ABOS MarketSpace · Aircraft Intelligence Network
          </p>
          <h1 className="text-2xl md:text-4xl font-black tracking-[-0.03em] leading-tight text-white drop-shadow-lg"
            style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>
            Discover & Evaluate Aircraft
          </h1>
          <p className="text-white/60 text-[13px] md:text-[14px] mt-3 max-w-xl leading-relaxed">
            Browse active listings with ATI scores, real-time market intelligence, and off-market valuation data.
            {!isLoading && (
              <span className="text-white/40"> · {listingsCount} aircraft available</span>
            )}
          </p>

          {/* Unified Create / Search bar */}
          <div className="mt-6 flex gap-2">
            <div className="relative flex-1 max-w-md">
              {showLookup ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      value={lookupReg}
                      onChange={(e) => setLookupReg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                      placeholder="Enter N-reg or EASA registration..."
                      className="w-full pl-9 pr-4 py-3 bg-black/30 border border-white/20 rounded-xl text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#E8A83A] transition-colors backdrop-blur-sm"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleLookup}
                    disabled={!lookupReg.trim()}
                    className="flex items-center gap-1.5 bg-[#E8A83A] hover:bg-[#f5bb4e] disabled:opacity-40 disabled:cursor-not-allowed text-[#0B2D5B] text-[12px] font-black px-4 py-3 rounded-xl transition-colors shadow-lg">
                    
                    <Zap className="w-3.5 h-3.5" />
                    Look Up
                  </button>
                  <button
                    onClick={() => {setShowLookup(false);setLookupReg("");}}
                    className="text-white/40 hover:text-white/80 transition-colors">
                    
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLookup(true)}
                  className="w-full flex items-center justify-between gap-3 bg-white/[0.14] hover:bg-white/[0.20] backdrop-blur-md border border-white/20 text-white text-[13px] font-semibold px-5 py-3.5 rounded-xl transition-all shadow-lg group">
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E8A83A]/20 border border-[#E8A83A]/30 flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4 text-[#E8A83A]" />
                    </div>
                    <div className="text-left">
                      <span className="text-white font-bold">Create ATI Score Card</span>
                      <p className="text-white/40 text-[10px] font-normal mt-0.5">
                        Look up by N-registration or EASA mark · or add manually
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-[#E8A83A] group-hover:translate-x-0.5 transition-all" />
                </button>
              )}
            </div>

            <button
              onClick={() => onShowWizard()}
              className="flex items-center gap-1.5 bg-white text-[#0B2D5B] text-[12px] font-black px-5 py-3 rounded-xl transition-colors hover:bg-white/90 shadow-lg shrink-0">
              
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Manual Add</span>
            </button>
          </div>

          {/* Inline stats */}
          {!isLoading && listingsCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-5">
              {[
                { value: listingsCount, label: "Total", color: "#E8A83A" },
                { value: scoredCount, label: "ATI Scored", color: "#6FA3E8" },
                { value: hotDeals, label: "Hot Deals", color: "#F5C842" },
                { value: avgATI, label: "Avg ATI", color: "#A8D5BE" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] backdrop-blur-sm px-3 py-1.5"
                >
                  <span className="text-[13px] font-black" style={{ color: s.color }}>
                    {s.value ?? "—"}
                  </span>
                  <span className="text-[9px] text-white/45 font-semibold uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
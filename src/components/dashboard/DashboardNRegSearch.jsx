import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, BadgeCheck, AlertTriangle, Plane, Zap, FileCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import SmartAircraftSearch from "@/components/search/SmartAircraftSearch";

const ABOS_AMBER = "#D4A017";
const NAVY = "#1A1F2B";
const MUTED = "#7D8590";
const BG = "#F4F6F8";
const CARD = "#FFFFFF";

export default function DashboardNRegSearch() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [listingMatch, setListingMatch] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  const normalizeN = (s) => s.replace(/^N/i, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const search = useCallback(async (directQuery = query) => {
    const nNumber = normalizeN(directQuery);
    if (!nNumber) return;
    setSearching(true);
    setError("");
    setResult(null);
    setListingMatch(null);
    setShowDropdown(true);

    try {
      const res = await base44.functions.invoke("globalAircraftLookup", { registration: `N${nNumber}` });
      const data = res.data;

      if (!data.found) {
        setError(data.error || `No FAA registry record found for N${nNumber}.`);
        setSearching(false);
        return;
      }

      setResult(data.aircraft);
      if (data.listing) setListingMatch(data.listing);
    } catch (e) {
      setError("Failed to search FAA registry. Please try again.");
    }
    setSearching(false);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <SmartAircraftSearch variant="hero" value={query} onChange={setQuery} onSubmit={search} loading={searching} />

      {/* Dropdown Results — ATI Passport preview card */}
      <AnimatePresence>
        {showDropdown && (result || error || searching) && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
            style={{
              background: CARD,
              border: `1px solid rgba(0,0,0,0.08)`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            }}
          >
            {searching && (
              <div className="p-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: ABOS_AMBER }} />
                <span className="text-[12px]" style={{ color: MUTED }}>Searching FAA registry…</span>
              </div>
            )}

            {error && !searching && (
              <div className="p-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-[12px]" style={{ color: MUTED }}>{error}</span>
              </div>
            )}

            {result && !searching && (
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[8px] tracking-[0.15em] font-black uppercase" style={{ color: ABOS_AMBER }}>ATI Passport Preview</p>
                    <h3 className="text-base font-black" style={{ color: NAVY }}>N{result.n_number}</h3>
                    <p className="text-[11px] font-semibold" style={{ color: MUTED }}>
                      {result.year_mfr || "—"} {result.make || result.mfr_mdl_code || ""} {result.model || ""}
                    </p>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-full shrink-0"
                    style={{
                      background: result.status_code === "active" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                      color: result.status_code === "active" ? "#22c55e" : "#ef4444",
                      border: `1px solid ${result.status_code === "active" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                    }}>
                    {result.status_code || "Unknown"}
                  </span>
                </div>

                {/* Registry source badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[7px] font-bold uppercase tracking-wider mr-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Verified in:</span>
                  <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(245,194,66,0.12)", color: ABOS_AMBER, border: `1px solid ${ABOS_AMBER}33` }}>
                    <BadgeCheck className="w-2.5 h-2.5" /> ABOS
                  </span>
                  <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(245,194,66,0.12)", color: ABOS_AMBER, border: `1px solid ${ABOS_AMBER}33` }}>
                    <BadgeCheck className="w-2.5 h-2.5" /> FAA
                  </span>
                  <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(245,194,66,0.12)", color: ABOS_AMBER, border: `1px solid ${ABOS_AMBER}33` }}>
                    <BadgeCheck className="w-2.5 h-2.5" /> AirRef
                  </span>
                </div>

                {/* Quick data */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Serial", value: result.serial_number || "—" },
                    { label: "Engine", value: result.engine_mfr ? `${result.engine_mfr} ${result.engine_model || ""}` : "—" },
                    { label: "State", value: result.state || "—" },
                  ].map((d) => (
                    <div key={d.label}>
                      <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{d.label}</p>
                      <p className="text-[10px] font-semibold mt-0.5" style={{ color: NAVY }}>{d.value}</p>
                    </div>
                  ))}
                </div>

                {/* Listing match */}
                {listingMatch ? (
                  <Link to={`/ati-passport/${listingMatch.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl p-3 transition-all hover:scale-[1.01]"
                    style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <BadgeCheck className="w-4 h-4 text-green-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-green-400 uppercase tracking-wider">Listed on ABOS</p>
                        <p className="text-[11px] font-bold truncate" style={{ color: NAVY }}>
                          {listingMatch.year} {listingMatch.make} {listingMatch.model}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl p-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Plane className="w-3.5 h-3.5" style={{ color: MUTED }} />
                    <span className="text-[10px]" style={{ color: MUTED }}>Not currently listed on ABOS</span>
                  </div>
                )}

                {/* ATI Quick Score CTA */}
                <Link to="/ati-quick-score"
                  className="flex items-center justify-between gap-2 rounded-xl p-3 transition-all hover:scale-[1.01] group"
                  style={{
                    background: `linear-gradient(135deg, ${ABOS_AMBER}22, ${ABOS_AMBER}11)`,
                    border: `1.5px solid ${ABOS_AMBER}55`,
                    boxShadow: `0 0 20px ${ABOS_AMBER}14`,
                  }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${ABOS_AMBER}22`, border: `1px solid ${ABOS_AMBER}44` }}>
                      <Zap className="w-3.5 h-3.5" style={{ color: ABOS_AMBER }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: ABOS_AMBER }}>Next Step</p>
                      <p className="text-[11px] font-bold truncate" style={{ color: NAVY }}>Create ATI Quick Score</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" style={{ color: ABOS_AMBER }} />
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
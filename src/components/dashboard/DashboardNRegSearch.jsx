import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Loader2, ArrowRight, BadgeCheck, AlertTriangle, Plane } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

const ABOS_AMBER = "#f5c242";

export default function DashboardNRegSearch() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [listingMatch, setListingMatch] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  const normalizeN = (s) => s.replace(/^N/i, "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const search = useCallback(async () => {
    const nNumber = normalizeN(query);
    if (!nNumber) return;
    setSearching(true);
    setError("");
    setResult(null);
    setListingMatch(null);
    setShowDropdown(true);

    try {
      const res = await base44.functions.invoke("nregSearch", { n_number: nNumber });
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

  const handleKeyDown = (e) => { if (e.key === "Enter") search(); };

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
      {/* Hero Search Bar */}
      <div className="flex items-center w-full rounded-2xl overflow-hidden"
        style={{
          background: "rgba(12,10,6,0.72)",
          border: `1.5px solid ${ABOS_AMBER}44`,
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          boxShadow: `0 0 24px ${ABOS_AMBER}14, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}>
        <div className="pl-4 pr-2">
          <Search className="w-4 h-4" style={{ color: `${ABOS_AMBER}aa` }} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => result && setShowDropdown(true)}
          placeholder="Enter N-Number (e.g. N12345)…"
          className="flex-1 py-2.5 text-sm font-medium bg-transparent border-none outline-none"
          style={{ color: "#f0e8d4", background: "transparent !important", border: "none !important" }}
        />
        <button
          onClick={search}
          disabled={searching || !normalizeN(query)}
          className="px-5 py-2.5 text-[11px] font-bold tracking-wider uppercase transition-all disabled:opacity-30 flex items-center gap-1.5"
          style={{ background: `linear-gradient(135deg, ${ABOS_AMBER}, #D4A017)`, color: "#1a1208" }}
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Search <ArrowRight className="w-3.5 h-3.5" /></>}
        </button>
      </div>

      {/* Dropdown Results */}
      {showDropdown && (result || error || searching) && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
          style={{
            background: "rgba(8,6,4,0.92)",
            border: `1px solid ${ABOS_AMBER}33`,
            backdropFilter: "blur(32px) saturate(180%)",
            WebkitBackdropFilter: "blur(32px) saturate(180%)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}>
          {searching && (
            <div className="p-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: ABOS_AMBER }} />
              <span className="text-[12px]" style={{ color: "rgba(245,194,66,0.6)" }}>Searching FAA registry…</span>
            </div>
          )}

          {error && !searching && (
            <div className="p-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>{error}</span>
            </div>
          )}

          {result && !searching && (
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[8px] tracking-[0.15em] font-black uppercase" style={{ color: ABOS_AMBER }}>FAA Registry Result</p>
                  <h3 className="text-base font-black" style={{ color: "#f0e8d4" }}>N{result.n_number}</h3>
                  <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
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

              {/* Quick data */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Serial", value: result.serial_number || "—" },
                  { label: "Engine", value: result.engine_mfr ? `${result.engine_mfr} ${result.engine_model || ""}` : "—" },
                  { label: "State", value: result.state || "—" },
                ].map((d) => (
                  <div key={d.label}>
                    <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{d.label}</p>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#f0e8d4" }}>{d.value}</p>
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
                      <p className="text-[11px] font-bold truncate" style={{ color: "#f0e8d4" }}>
                        {listingMatch.year} {listingMatch.make} {listingMatch.model}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-green-400 shrink-0" />
                </Link>
              ) : (
                <div className="flex items-center gap-2 rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Plane className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Not currently listed on ABOS</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
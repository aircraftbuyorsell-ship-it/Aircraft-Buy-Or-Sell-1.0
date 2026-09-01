import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, History, Clock, MapPin, ArrowUp, ArrowDown, Minus, Loader2, X, ChevronRight, Plane, Gauge } from "lucide-react";
import { format } from "date-fns";
import FlightPathMap from "./FlightPathMap";

export default function AircraftHistoryPanel({ isDark = false }) {
  const [search, setSearch] = useState("");
  const [appearances, setAppearances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadedFor, setLoadedFor] = useState("");

  const textColor = isDark ? "#ffffff" : "#1A1814";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "#6B6560";
  const subColor = isDark ? "rgba(255,255,255,0.25)" : "#AAA49C";
  const bgColor = isDark ? "rgba(255,255,255,0.04)" : "#F7F4EF";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";

  const handleSearch = async () => {
    const q = search.trim().toUpperCase().replace(/[-\s]/g, "");
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      // Try by registration first, then by ICAO24
      let results = await base44.entities.TrafficAppearance.filter(
        { registration: q },
        "-captured_at",
        50
      );
      if (!results?.length) {
        results = await base44.entities.TrafficAppearance.filter(
          { icao24: q.toLowerCase() },
          "-captured_at",
          50
        );
      }
      setAppearances(results || []);
      setLoadedFor(q);
      if (!results?.length) setError(`No history found for "${search.trim()}"`);
    } catch (e) {
      setError(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearch("");
    setAppearances([]);
    setError(null);
    setLoadedFor("");
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.70)", backdropFilter: "blur(24px)", border: `1px solid ${borderColor}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: isDark ? "rgba(0,245,255,0.10)" : "rgba(11,45,91,0.08)", border: `1px solid ${isDark ? "rgba(0,245,255,0.20)" : "rgba(11,45,91,0.15)"}` }}>
            <History className="w-4 h-4" style={{ color: isDark ? "#00f5ff" : "#0B2D5B" }} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: isDark ? "#00f5ff" : "#E8A83A" }}>Aircraft History</p>
            <p className="text-[11px] font-bold" style={{ color: textColor }}>Track Flight Appearances</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-5 py-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="N-number or ICAO24 (e.g. N123AB)..."
              className="w-full rounded-xl border px-3 py-2.5 text-sm font-mono outline-none transition-colors"
              style={{
                background: bgColor,
                borderColor: borderColor,
                color: textColor,
              }}
            />
            {search && (
              <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: subColor }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !search.trim()}
            className="rounded-xl px-4 py-2.5 text-sm font-black text-white transition-all disabled:opacity-40"
            style={{ background: isDark ? "linear-gradient(135deg, #00f5ff, #0099bb)" : "linear-gradient(135deg, #0B2D5B, #1A4A8A)", boxShadow: "0 2px 12px rgba(11,45,91,0.25)" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="px-5 pb-4">
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: isDark ? "rgba(255,77,109,0.08)" : "rgba(255,77,109,0.06)", border: `1px solid ${isDark ? "rgba(255,77,109,0.20)" : "rgba(255,77,109,0.15)"}`, color: isDark ? "#ff4d6d" : "#b91c1c" }}>
            {error}
          </div>
        </div>
      )}

      {appearances.length > 0 && (
        <div>
          <div className="px-5 pb-2 flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: mutedColor }}>
              {appearances.length} appearances for <span style={{ color: "#E8A83A" }}>{loadedFor}</span>
            </p>
          </div>
          <div className="px-5 pb-4">
            <FlightPathMap appearances={appearances} isDark={isDark} />
          </div>
          <div className="px-3 pb-3 space-y-1 max-h-[420px] overflow-y-auto">
            {appearances.map((a, i) => {
              const altFt = a.altitude_ft;
              const vrate = a.vertical_rate_fpm;
              return (
                <div key={a.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.04]"
                  style={{ borderBottom: i < appearances.length - 1 ? `1px solid ${borderColor}` : "none" }}>
                  {/* Time */}
                  <div className="shrink-0 w-16">
                    <div className="flex items-center gap-1" style={{ color: subColor }}>
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        {a.captured_at ? format(new Date(a.captured_at), "HH:mm") : "—"}
                      </span>
                    </div>
                    <p className="text-[9px] mt-0.5" style={{ color: subColor }}>
                      {a.captured_at ? format(new Date(a.captured_at), "MMM d") : "—"}
                    </p>
                  </div>

                  {/* Flight data */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.callsign && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: isDark ? "rgba(0,245,255,0.08)" : "rgba(11,45,91,0.06)", color: isDark ? "#00f5ff" : "#0B2D5B" }}>
                          {a.callsign}
                        </span>
                      )}
                      {a.aircraft_type && (
                        <span className="text-[10px] font-bold uppercase" style={{ color: mutedColor }}>{a.aircraft_type}</span>
                      )}
                      {a.has_listing && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase"
                          style={{ background: "rgba(232,168,58,0.15)", color: "#E8A83A", border: "1px solid rgba(232,168,58,0.35)" }}>
                          ABOS
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <div className="flex items-center gap-1" style={{ color: mutedColor }}>
                        <MapPin className="w-3 h-3" />
                        <span className="text-[11px] font-mono">
                          {a.latitude?.toFixed(2)}, {a.longitude?.toFixed(2)}
                        </span>
                      </div>
                      {altFt != null && (
                        <div className="flex items-center gap-1" style={{ color: mutedColor }}>
                          <ArrowUp className="w-3 h-3" />
                          <span className="text-[11px] font-bold" style={{ color: textColor }}>{altFt.toLocaleString()} ft</span>
                        </div>
                      )}
                      {a.speed_kt != null && (
                        <div className="flex items-center gap-1" style={{ color: mutedColor }}>
                          <Gauge className="w-3 h-3" />
                          <span className="text-[11px] font-bold" style={{ color: textColor }}>{a.speed_kt} kt</span>
                        </div>
                      )}
                      {vrate != null && (
                        <div className="flex items-center gap-1" style={{ color: vrate > 100 ? "#22c55e" : vrate < -100 ? "#ef4444" : mutedColor }}>
                          {vrate > 100 ? <ArrowUp className="w-3 h-3" /> : vrate < -100 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                          <span className="text-[11px] font-bold">{Math.abs(vrate)} fpm</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: subColor }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!appearances.length && !loading && !error && (
        <div className="px-5 pb-6 pt-2 text-center">
          <Plane className="w-8 h-8 mx-auto mb-2" style={{ color: subColor }} />
          <p className="text-[11px]" style={{ color: subColor }}>Search an N-number or ICAO24 hex to see its flight history</p>
        </div>
      )}
    </div>
  );
}
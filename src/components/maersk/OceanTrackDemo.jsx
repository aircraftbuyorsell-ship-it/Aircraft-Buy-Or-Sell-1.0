import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Ship, MapPin, Anchor, Calendar, Loader2, Container } from "lucide-react";

export default function OceanTrackDemo() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke("maerskOceanTrack", {
        containerNumber: query.trim(),
      });
      setResult(res.data || res);
    } catch (e) {
      setError(e.message || "Tracking lookup failed");
    }
    setLoading(false);
  };

  const fmtDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1.5 block">
            Container / BOL Number
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. MAEU1234567"
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid rgba(255,255,255,0.10)",
              color: "#fff",
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className="px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-30"
          style={{ background: "#f5c242", color: "#04060a", minHeight: 42 }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Track
        </button>
      </div>

      {/* Demo banner */}
      {result?.demo && (
        <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.20)" }}>
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#f5c242]">Demo Mode</span>
          <span className="text-[11px] text-white/50">{result.message}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg" style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.20)" }}>
          <p className="text-[11px] text-[#e24b4a]">{error}</p>
        </div>
      )}

      {/* Result */}
      {result?.shipment && (
        <div className="space-y-3">
          {/* Status header */}
          <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Container size={16} className="text-[#f5c242]" />
                <span className="text-sm font-bold text-white/90">{result.shipment.containerNumber}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(93,202,165,0.12)", color: "#5dcaa5", border: "0.5px solid rgba(93,202,165,0.25)" }}>
                {result.shipment.status}
              </span>
            </div>

            {/* Route */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Origin</p>
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-white/40" />
                  <span className="text-xs font-semibold text-white/80">{result.shipment.pol.name}</span>
                  <span className="text-[10px] text-white/30">{result.shipment.pol.unLocode}</span>
                </div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1">
                  <div className="h-px w-8 bg-white/15" />
                  <Ship size={14} className="text-[#f5c242]" />
                  <div className="h-px w-8 bg-white/15" />
                </div>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[9px] uppercase tracking-wider text-white/30 mb-0.5">Destination</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-xs font-semibold text-white/80">{result.shipment.pod.name}</span>
                  <span className="text-[10px] text-white/30">{result.shipment.pod.unLocode}</span>
                  <MapPin size={12} className="text-white/40" />
                </div>
              </div>
            </div>

            {/* Vessel + ETA */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[9px] uppercase tracking-wider text-white/30 mb-1 flex items-center gap-1">
                  <Anchor size={10} /> Vessel
                </p>
                <p className="text-xs font-semibold text-white/80">{result.shipment.vessel.name}</p>
                <p className="text-[10px] text-white/40">IMO {result.shipment.vessel.imo} · Voy {result.shipment.vessel.voyage}</p>
              </div>
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                <p className="text-[9px] uppercase tracking-wider text-white/30 mb-1 flex items-center gap-1">
                  <Calendar size={10} /> ETA
                </p>
                <p className="text-xs font-semibold text-white/80">{fmtDate(result.shipment.eta)}</p>
              </div>
            </div>
          </div>

          {/* Event timeline */}
          {result.events && result.events.length > 0 && (
            <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-3">Tracking Events</p>
              <div className="space-y-3">
                {result.events.map((evt, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1"
                        style={{ background: i === 0 ? "#5dcaa5" : "rgba(255,255,255,0.20)" }} />
                      {i < result.events.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-xs font-semibold text-white/80">{evt.description}</p>
                      <p className="text-[10px] text-white/40">{evt.location}</p>
                      <p className="text-[9px] text-white/25 mt-0.5">{fmtDate(evt.timestamp)}</p>
                    </div>
                    <span className="text-[8px] uppercase tracking-wider text-white/30 font-bold">{evt.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
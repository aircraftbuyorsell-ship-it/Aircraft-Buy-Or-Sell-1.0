import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/lib/useTheme";
import { base44 } from "@/api/base44Client";
import {
  Search, X, RefreshCw, ChevronDown, ChevronUp,
  Globe, Plane, Gauge, Loader2
} from "lucide-react";

const REGIONS = [
  { key: "eu", label: "Europe", lamin: 34, lomin: -25, lamax: 72, lomax: 45 },
  { key: "cz", label: "Czech / CEE", lamin: 48.5, lomin: 12.0, lamax: 51.1, lomax: 18.9 },
  { key: "us", label: "North America", lamin: 24, lomin: -125, lamax: 50, lomax: -66 },
  { key: "global", label: "Global", lamin: -60, lomin: -130, lamax: 72, lomax: 50 },
];

export default function GlobeTrafficControls({ onSearch, onRefresh, trafficCount, listingCount, isLoading, compact }) {
  const isDark = useTheme();
  const [region, setRegion] = useState("eu");
  const [search, setSearch] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [cid, setCid] = useState("aircraftbuyorsell@gmail.com-api-client");
  const [csec, setCsec] = useState("IEP2aVXNWl5znURwv52525Vz9SxpA7ea");
  const [btok, setBtok] = useState("");
  const [dataTime, setDataTime] = useState(null);
  const [sourceLabel, setSourceLabel] = useState("OpenSky");
  const [credits, setCredits] = useState("—");

  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";

  const handleSearch = () => {
    const q = search.trim();
    if (q && onSearch) onSearch(q);
  };

  const clearSearch = () => {
    setSearch("");
    if (onSearch) onSearch("");
  };

  // ─── Compact inline mode (used in toggle bar) ───
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 pointer-events-auto">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search N-number, ICAO…"
            className="w-[160px] text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 outline-none font-mono"
            style={{ color: isDark ? "#fff" : "#1e293b" }}
          />
          {search && (
            <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1 rounded-full text-white/70 hover:text-white transition-colors"
          style={{ background: `${accentCyan}10`, border: `1px solid ${accentCyan}20` }}
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" style={{ color: accentCyan }} />}
        </button>
      </div>
    );
  }

  // ─── Full overlay mode (default) ───
  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-auto" style={{ maxWidth: 260 }}>
      {/* Main control panel */}
      <div className="glass-card p-3 space-y-2.5">
        {/* Title */}
        <div className="flex items-center justify-between">
          <p className="text-[9px] uppercase tracking-[0.2em] font-black" style={{ color: accentCyan }}>
            SKYBOSS · LIVE TRAFFIC
          </p>
          <span className="text-[8px] uppercase tracking-wider" style={{ color: mutedColor }}>
            OpenSky
          </span>
        </div>

        {/* Region + Stats */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[9px] uppercase tracking-wider" style={{ color: mutedColor }}>Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-[120px] text-[10px] px-1.5 py-1 rounded-md bg-white/5 border border-white/10 outline-none"
              style={{ color: accentCyan }}
            >
              {REGIONS.map(r => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: accentCyan }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentCyan, boxShadow: `0 0 6px ${accentCyan}` }} />
              {trafficCount?.toLocaleString() || "—"} airborne
            </span>
            <span className="text-[10px] font-bold" style={{ color: "#E8A83A" }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block mr-1 animate-pulse" style={{ background: "#E8A83A", boxShadow: "0 0 6px #E8A83A" }} />
              {listingCount?.toLocaleString() || "—"} listings
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-1">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="N-number, ICAO, callsign…"
              className="w-full text-[10px] px-2 py-1.5 rounded-md bg-white/5 border border-white/10 outline-none font-mono"
              style={{ color: isDark ? "#fff" : "#1e293b" }}
            />
            {search && (
              <button onClick={clearSearch} className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-2.5 rounded-md text-white/70 hover:text-white transition-colors"
            style={{ background: `${accentCyan}15`, border: `1px solid ${accentCyan}30` }}
          >
            <Search className="w-3 h-3" />
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-2.5 rounded-md text-white/70 hover:text-white transition-colors"
            style={{ background: `${accentCyan}15`, border: `1px solid ${accentCyan}30` }}
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[8px]" style={{ color: mutedColor }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#D4A017" }} />Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#3fd0e0" }} />Mid</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: accentCyan }} />High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#ff4d6d" }} />Listing</span>
        </div>

        {/* Auth toggle */}
        <div className="border-t pt-2" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
          <button
            onClick={() => setShowAuth(!showAuth)}
            className="flex items-center gap-1 text-[9px] uppercase tracking-wider w-full"
            style={{ color: mutedColor }}
          >
            {showAuth ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Auth (higher limits)
          </button>
          {showAuth && (
            <div className="mt-2 space-y-1.5">
              <input
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                placeholder="client_id"
                className="w-full text-[9px] px-2 py-1 rounded-md bg-white/5 border border-white/10 outline-none font-mono"
                style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}
              />
              <input
                value={csec}
                onChange={(e) => setCsec(e.target.value)}
                type="password"
                placeholder="client_secret"
                className="w-full text-[9px] px-2 py-1 rounded-md bg-white/5 border border-white/10 outline-none font-mono"
                style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" }}
              />
              <p className="text-[8px] leading-relaxed" style={{ color: mutedColor }}>
                Anonymous = 400 credits/day. Auth = 4,000/day. Stored in your browser only.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
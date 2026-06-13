import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import {
  Radar, RefreshCw, Loader2, Search, X, Filter, Sparkles, CheckCircle2, AlertCircle
} from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const WORLD_CENTER = [30, -30];
const WORLD_ZOOM = 3;

// Neon blue aircraft silhouette SVG (matches 3D globe style)
function aircraftSilhouetteSvg({ color = "#00d4ff", glow = "rgba(0,212,255,0.35)", size = 32, heading = 0 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 96 96" style="transform:rotate(${heading}deg);filter:drop-shadow(0 0 3px ${glow})">
    <defs>
      <radialGradient id="acGlow" cx="48" cy="48" r="42">
        <stop offset="0%" stop-color="${glow}" />
        <stop offset="100%" stop-color="transparent" />
      </radialGradient>
    </defs>
    <circle cx="48" cy="48" r="42" fill="url(#acGlow)" />
    <!-- Fuselage -->
    <rect x="45" y="10" width="6" height="66" fill="${color}" rx="2" />
    <!-- Wings -->
    <polygon points="48,26 18,44 20,48 48,32" fill="${color}" />
    <polygon points="48,26 78,44 76,48 48,32" fill="${color}" />
    <!-- Horizontal stabilizer -->
    <polygon points="48,56 26,68 28,72 48,62" fill="${color}" />
    <polygon points="48,56 70,68 68,72 48,62" fill="${color}" />
    <!-- Bright core line -->
    <line x1="48" y1="10" x2="48" y2="76" stroke="white" stroke-width="0.8" opacity="0.6" />
  </svg>`;
}

function makeIcon(altM, heading = 0, highlight = false, hasListing = false) {
  let color = "#00d4ff";
  let glow = "rgba(0,212,255,0.35)";
  let size = 28;

  if (hasListing) {
    color = "#E8A83A";
    glow = "rgba(232,168,58,0.45)";
    size = 30;
  }
  if (highlight) {
    size = 40;
    glow = "rgba(0,245,255,0.60)";
  }

  const svg = aircraftSilhouetteSvg({ color, glow, size, heading });
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo([target.latitude, target.longitude], 9, { duration: 1.2 }); }, [target]);
  return null;
}

const CATEGORY_FILTERS = [
  { key: "all", label: "All", test: () => true },
  { key: "ga", label: "GA", test: (a) => a.category >= 1 && a.category <= 3 },
  { key: "turboprop", label: "Turboprop", test: (a) => a.category === 4 },
  { key: "jet", label: "Jet", test: (a) => a.category === 5 || a.category === 6 },
  { key: "heli", label: "Heli", test: (a) => a.category === 8 || a.category === 9 },
  { key: "other", label: "Other", test: (a) => a.category === 0 || a.category >= 10 },
];

export default function TrafficMapSection({ globalSearch = "", onClearSearch }) {
  const isDark = useTheme();
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dataTime, setDataTime] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [catFilter, setCatFilter] = useState("all");
  const [scoringMap, setScoringMap] = useState({});
  const markerRefs = useRef({});

  // Accept external search
  useEffect(() => {
    if (globalSearch) {
      setSearch(globalSearch);
      handleSearchWith(globalSearch);
    }
  }, [globalSearch]);

  const fetchTraffic = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    setError(null);
    setFlyTarget(null);
    try {
      const res = await base44.functions.invoke("cachedTraffic", {
        region_key: "world",
        region_label: "Global",
        force_refresh: true,
        limit: 1000,
        allow_heavy: true,
      });
      const ac = res.data?.aircraft || [];
      setAircraft(ac);
      setDataTime(res.data?.refreshed_at ? new Date(res.data.refreshed_at) : new Date());
      setDataSource(res.data?.source || null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to load traffic");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTraffic(false); }, []);

  const handleSearchWith = (q) => {
    setSearchError(null);
    const query = q.trim().toUpperCase().replace(/[-\s]/g, "");
    if (!query) return;
    const found = aircraft.find((ac) => {
      const reg = (ac.faa?.n_number || ac.registration || "").toUpperCase().replace(/[-\s]/g, "");
      const icao = (ac.icao24 || "").toUpperCase();
      const cs = (ac.callsign || "").toUpperCase().trim();
      return reg === query || icao === query || reg.includes(query) || cs === query || cs.includes(query);
    });
    if (!found) { setSearchError(`"${q.trim()}" not found in current snapshot`); return; }
    setFlyTarget(found);
    setTimeout(() => { const r = markerRefs.current[found.icao24]; if (r) r.openPopup(); }, 1400);
  };

  const handleSearch = () => {
    const q = search.trim();
    if (q) handleSearchWith(q);
  };

  const clearSearch = () => {
    setSearch("");
    setSearchError(null);
    setFlyTarget(null);
    if (onClearSearch) onClearSearch();
  };

  const handleScoreAircraft = async (ac) => {
    const reg = ac.registration || (ac.faa?.n_number || "").replace(/^N/, "").trim();
    if (!reg) return;
    setScoringMap(prev => ({ ...prev, [ac.icao24]: "loading" }));
    try {
      const res = await base44.functions.invoke("syncFaaToAtiCard", { n_number: reg.replace(/^N/i, "").trim() });
      if (res.data?.listingId) {
        setScoringMap(prev => ({ ...prev, [ac.icao24]: "success" }));
        setAircraft(prev => prev.map(a => a.icao24 === ac.icao24 ? {
          ...a,
          listing: { id: res.data.listingId, ati_score: res.data.atiScore, card_code: res.data.cardCode }
        } : a));
      } else {
        setScoringMap(prev => ({ ...prev, [ac.icao24]: res.data?.error || "No data found" }));
      }
    } catch (e) {
      setScoringMap(prev => ({ ...prev, [ac.icao24]: e?.response?.data?.error || e.message || "Scoring failed" }));
    }
  };

  const catDef = CATEGORY_FILTERS.find(f => f.key === catFilter) || CATEGORY_FILTERS[0];
  const visibleAircraft = aircraft.filter(catDef.test);
  const airborne = visibleAircraft.filter((a) => !a.on_ground);
  const withListing = visibleAircraft.filter((a) => a.listing).length;

  const sourceLabel = dataSource === "live" ? "Live" : dataSource === "cache" ? "Cache" : dataSource?.startsWith("snapshot:") ? dataSource.replace("snapshot:", "") : dataSource || "—";

  const textColor = isDark ? "#fff" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accentCyan}15`, border: `1px solid ${accentCyan}30` }}>
            <Radar className="w-5 h-5" style={{ color: accentCyan }} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-black" style={{ color: accentCyan }}>ADS-B Live · adsb.lol</p>
            <h3 className="text-base font-black tracking-tight" style={{ color: textColor }}>Global 2D Traffic Map</h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="flex gap-1">
            <div className="relative">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSearchError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="N-number, ICAO, callsign…"
                className="rounded-lg text-[11px] px-3 py-2 w-44 outline-none font-mono"
                style={{
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
                  color: textColor
                }}
              />
              {search && (
                <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button onClick={handleSearch} className="rounded-lg px-3 py-2 hover:opacity-80 transition"
              style={{ background: `${accentCyan}15`, border: `1px solid ${accentCyan}30` }}>
              <Search className="w-3.5 h-3.5" style={{ color: accentCyan }} />
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 rounded-lg px-2 py-1"
            style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}` }}>
            <Filter className="w-3 h-3 shrink-0" style={{ color: mutedColor }} />
            {CATEGORY_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setCatFilter(f.key)}
                style={catFilter === f.key
                  ? { background: "#E8A83A", color: "#0B2D5B" }
                  : { color: mutedColor }}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold transition-all"
              >{f.label}</button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchTraffic(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-black transition disabled:opacity-50"
            style={{ background: "#E8A83A", color: "#0B2D5B" }}
          >
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { label: "Airborne", value: airborne.length },
          { label: "Visible", value: visibleAircraft.length },
          { label: "Total loaded", value: aircraft.length },
          { label: "ABOS matched", value: withListing },
          { label: "Source", value: sourceLabel },
          { label: "Updated", value: dataTime ? dataTime.toLocaleTimeString() : "—" },
        ].map((s) => (
          <div key={s.label} className="glass-pill px-3 py-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider mr-1" style={{ color: mutedColor }}>{s.label}:</span>
            <span className="text-[11px] font-black" style={{ color: textColor }}>{s.value}</span>
          </div>
        ))}
      </div>

      {searchError && (
        <div className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]"
          style={{ background: "rgba(232,168,58,0.10)", border: "1px solid rgba(232,168,58,0.20)", color: "#E8A83A" }}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {searchError}
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-lg px-3 py-2 text-[11px]"
          style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.15)", color: "#ff4d6d" }}>{error}</div>
      )}

      {/* Map */}
      <div className="h-[55vh] rounded-2xl overflow-hidden relative"
        style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}` }}>
        {loading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center backdrop-blur-sm" style={{ background: isDark ? "rgba(10,10,20,0.85)" : "rgba(255,255,255,0.85)" }}>
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#E8A83A]" />
              <p className="text-sm font-bold" style={{ color: mutedColor }}>Loading global traffic…</p>
            </div>
          </div>
        )}
        <MapContainer center={WORLD_CENTER} zoom={WORLD_ZOOM} style={{ height: "100%", width: "100%" }} scrollWheelZoom zoomControl worldCopyJump>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {flyTarget && <FlyTo target={flyTarget} key={flyTarget.icao24 + "-fly"} />}
          {visibleAircraft.map((ac) => {
            if (!ac.latitude || !ac.longitude) return null;
            const isHighlight = flyTarget?.icao24 === ac.icao24;
            const altFt = ac.baro_altitude != null ? Math.round(ac.baro_altitude * 3.28084) : null;
            const speedKt = ac.velocity != null ? Math.round(ac.velocity * 1.94384) : null;
            const nReg = ac.faa?.n_number || ac.registration || null;
            const vrateStr = ac.vertical_rate != null
              ? (ac.vertical_rate > 0.5 ? `▲ ${Math.round(ac.vertical_rate * 196.85)} fpm` : ac.vertical_rate < -0.5 ? `▼ ${Math.round(Math.abs(ac.vertical_rate) * 196.85)} fpm` : "Level")
              : "—";
            const bgColor = isDark ? "#1a1f3a" : "#fff";
            const tColor = isDark ? "#ffffff" : "#0B2D5B";
            const mColor = isDark ? "rgba(255,255,255,0.45)" : "#6B6560";
            const sColor = isDark ? "rgba(255,255,255,0.30)" : "#AAA49C";
            const bColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)";
            return (
              <Marker
                key={ac.icao24}
                position={[ac.latitude, ac.longitude]}
                icon={makeIcon(ac.baro_altitude, ac.true_track || 0, isHighlight, !!ac.listing)}
                ref={(r) => { if (r) markerRefs.current[ac.icao24] = r; }}
                zIndexOffset={isHighlight ? 1000 : 0}
              >
                <Popup maxWidth={260}>
                  <div style={{ minWidth: 220, background: bgColor }}>
                    <div style={{ borderBottom: `1px solid ${bColor}`, paddingBottom: 6, marginBottom: 6 }}>
                      <p style={{ fontWeight: 900, color: "#E8A83A", fontSize: 12, margin: 0 }}>
                        {nReg || ac.callsign?.trim() || ac.icao24}
                      </p>
                      <p style={{ fontSize: 9, color: sColor, margin: "1px 0 0", fontFamily: "monospace" }}>
                        ICAO: {ac.icao24} {ac.squawk ? `· SQWK ${ac.squawk}` : ""}
                      </p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 10px", fontSize: 11, marginBottom: 4 }}>
                      <div><span style={{ color: sColor }}>Alt: </span><strong style={{ color: tColor }}>{altFt != null ? `${altFt.toLocaleString()} ft` : "—"}</strong></div>
                      <div><span style={{ color: sColor }}>Speed: </span><strong style={{ color: tColor }}>{speedKt != null ? `${speedKt} kt` : "—"}</strong></div>
                      <div><span style={{ color: sColor }}>Hdg: </span><strong style={{ color: tColor }}>{ac.true_track != null ? `${Math.round(ac.true_track)}°` : "—"}</strong></div>
                      <div><span style={{ color: sColor }}>V/S: </span><strong style={{ color: tColor }}>{vrateStr}</strong></div>
                    </div>
                    {ac.listing && (
                      <div style={{ marginTop: 6, borderRadius: 8, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", border: `1px solid ${bColor}`, padding: "6px 8px" }}>
                        <p style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#E8A83A", margin: "0 0 3px" }}>ABOS Listing</p>
                        <p style={{ fontWeight: 700, color: tColor, fontSize: 11, margin: 0 }}>
                          {ac.listing.year || ""} {ac.listing.make || ""} {ac.listing.model || ""}
                        </p>
                        <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 10, flexWrap: "wrap" }}>
                          {ac.listing.ati_score && <span style={{ color: mColor }}>ATI: <strong style={{ color: tColor }}>{ac.listing.ati_score}</strong></span>}
                          {ac.listing.asking_price && <span style={{ color: mColor }}>Price: <strong style={{ color: tColor }}>${ac.listing.asking_price?.toLocaleString()}</strong></span>}
                        </div>
                      </div>
                    )}
                    {!ac.listing && nReg && /^N/i.test(nReg || "") && !scoringMap[ac.icao24] && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleScoreAircraft(ac); }}
                        style={{
                          marginTop: 6, width: "100%", border: "none", borderRadius: 8,
                          background: "linear-gradient(135deg, #0B2D5B, #1A4A8A)", cursor: "pointer",
                          padding: "6px 8px", fontSize: 10, fontWeight: 700, color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                        }}
                      >
                        <Sparkles className="w-3 h-3" /> Look up FAA &amp; Create ATI Card
                      </button>
                    )}
                    {scoringMap[ac.icao24] === "loading" && (
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: mColor }}>
                        <Loader2 className="w-3 h-3 animate-spin text-[#E8A83A]" /> Scoring…
                      </div>
                    )}
                    {scoringMap[ac.icao24] === "success" && (
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#22c55e", fontWeight: 600 }}>
                        <CheckCircle2 className="w-3 h-3" /> ATI Card created!
                      </div>
                    )}
                    {scoringMap[ac.icao24] && scoringMap[ac.icao24] !== "loading" && scoringMap[ac.icao24] !== "success" && (
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#ef4444", fontWeight: 600 }}>
                        <AlertCircle className="w-3 h-3" /> {scoringMap[ac.icao24]}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 items-center">
        <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: mutedColor }}>Markers:</span>
        {[
          { color: "#00d4ff", label: "Live traffic" },
          { color: "#E8A83A", label: "ABOS listing" },
          { color: "#00f5ff", label: "Search target", shadow: true },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.color, boxShadow: l.shadow ? `0 0 6px ${l.color}` : undefined }} />
            <span className="text-[10px]" style={{ color: mutedColor }}>{l.label}</span>
          </div>
        ))}
        <span className="ml-auto text-[9px]" style={{ color: mutedColor }}>Data: adsb.lol · ABOS</span>
      </div>
    </div>
  );
}
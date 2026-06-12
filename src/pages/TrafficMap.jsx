import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import { Radar, RefreshCw, Loader2, Search, X, Info, Filter, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import AircraftHistoryPanel from "@/components/live-traffic/AircraftHistoryPanel";
import SnapshotHistoryPanel from "@/components/live-traffic/SnapshotHistoryPanel";
import { useTheme } from "@/lib/useTheme";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Global bounds — as wide as adsb.lol reasonably supports in one call
const WORLD = { key: "world", label: "Global", lamin: -60, lamax: 72, lomin: -130, lomax: 50 };
const WORLD_CENTER = [30, -30];
const WORLD_ZOOM = 3;

function altColor(altM) {
  if (altM == null) return "#999";
  const ft = altM * 3.28084;
  if (ft < 5000)  return "#ef4444";
  if (ft < 15000) return "#f59e0b";
  if (ft < 30000) return "#22c55e";
  return "#3b82f6";
}

function makeIcon(altM, heading = 0, highlight = false) {
  const color = highlight ? "#E8A83A" : altColor(altM);
  const size = highlight ? 34 : 22;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="transform:rotate(${heading}deg)">
    <path d="M12 2 L7 20 L12 17 L17 20 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo([target.latitude, target.longitude], 9, { duration: 1.2 }); }, [target]);
  return null;
}

const CATEGORY_FILTERS = [
  { key: "all",       label: "All",        test: () => true },
  { key: "ga",        label: "GA",         test: (a) => a.category >= 1 && a.category <= 3 },
  { key: "turboprop", label: "Turboprop",  test: (a) => a.category === 4 },
  { key: "jet",       label: "Jet",        test: (a) => a.category === 5 || a.category === 6 },
  { key: "heli",      label: "Helicopter", test: (a) => a.category === 8 || a.category === 9 },
  { key: "other",     label: "Other",      test: (a) => a.category === 0 || a.category >= 10 },
];

export default function TrafficMap() {
  const isDark = useTheme();
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dataTime, setDataTime] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [catFilter, setCatFilter] = useState("all");
  const markerRefs = useRef({});
  const [scoringMap, setScoringMap] = useState({}); // { [icao24]: "loading"|"success"|"error"|errorMsg }

  const loadSnapshots = useCallback(async () => {
    try {
      const recs = await base44.entities.TrafficSnapshot.list("-refreshed_at", 50);
      setSnapshots(recs || []);
    } catch (_) {}
  }, []);

  const fetchTraffic = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    setError(null);
    setFlyTarget(null);
    try {
      // Always force_refresh=true on initial load so we get live data even with no cache
      const res = await base44.functions.invoke("cachedTraffic", {
        region_key: WORLD.key,
        region_label: WORLD.label,
        force_refresh: true,
        limit: 1000,
        allow_heavy: true,
      });
      const ac = res.data?.aircraft || [];
      setAircraft(ac);
      setDataTime(res.data?.refreshed_at ? new Date(res.data.refreshed_at) : new Date());
      setDataSource(res.data?.source || null);
      await loadSnapshots();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to load traffic");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadSnapshots]);

  useEffect(() => {
    fetchTraffic(false);
    loadSnapshots();
  }, []);

  const loadSnapshot = (snap) => {
    try {
      const ac = JSON.parse(snap.aircraft_json || "[]");
      setAircraft(ac);
      setDataTime(snap.refreshed_at ? new Date(snap.refreshed_at) : null);
      setDataSource(`snapshot:${snap.region_label || snap.region_key}`);
      setFlyTarget(null);
    } catch (_) {}
  };

  const handleSearch = () => {
    setSearchError(null);
    const q = search.trim().toUpperCase().replace(/[-\s]/g, "");
    if (!q) return;
    const found = aircraft.find((ac) => {
      const reg = (ac.faa?.n_number || ac.registration || "").toUpperCase().replace(/[-\s]/g, "");
      const icao = (ac.icao24 || "").toUpperCase();
      const cs = (ac.callsign || "").toUpperCase().trim();
      return reg === q || icao === q || reg.includes(q) || cs === q || cs.includes(q);
    });
    if (!found) { setSearchError(`"${search.trim()}" not found in current snapshot`); return; }
    setFlyTarget(found);
    setTimeout(() => { const r = markerRefs.current[found.icao24]; if (r) r.openPopup(); }, 1400);
  };

  const clearSearch = () => { setSearch(""); setSearchError(null); setFlyTarget(null); };

  const handleScoreAircraft = async (ac) => {
    const reg = ac.registration || (ac.faa?.n_number || "").replace(/^N/, "").trim();
    if (!reg) return;
    setScoringMap(prev => ({ ...prev, [ac.icao24]: "loading" }));
    try {
      const res = await base44.functions.invoke("syncFaaToAtiCard", { n_number: reg.replace(/^N/i, "").trim() });
      if (res.data?.listingId) {
        setScoringMap(prev => ({ ...prev, [ac.icao24]: "success" }));
        // Update aircraft data with the new listing
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

  const sourceLabel = dataSource === "live" ? "🟢 Live" : dataSource === "cache" ? "🔵 Cache" : dataSource?.startsWith("snapshot:") ? `📁 ${dataSource.replace("snapshot:", "")}` : dataSource || "—";

  return (
    <div className="flex flex-col min-h-screen" style={{ background: isDark ? "#0a0a0f" : "#1a1d2e" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-8 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0B2D5B] flex items-center justify-center shrink-0">
                <Radar className="w-6 h-6 text-[#E8A83A]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E8A83A]">ADS-B Live · adsb.lol</p>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Global Live Traffic</h1>
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
                    className="rounded-xl border pl-3 pr-8 py-2 text-sm font-mono w-52 outline-none focus:border-[#E8A83A] transition-colors"
                    style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.10)", borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.20)", color: "#fff" }}
                  />
                  {search && (
                    <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#AAA49C] hover:text-[#1A1814]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button onClick={handleSearch} className="rounded-xl bg-[#0B2D5B] px-3 py-2 text-white hover:bg-[#143C75] transition">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1 rounded-xl px-2 py-1"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)", border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.15)" }}>
                <Filter className="w-3.5 h-3.5 text-white/40 shrink-0" />
                {CATEGORY_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setCatFilter(f.key)}
                    style={catFilter === f.key
                      ? { background: isDark ? "#E8A83A" : "#E8A83A", color: isDark ? "#0B2D5B" : "#fff" }
                      : { color: "rgba(255,255,255,0.45)" }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                    onMouseEnter={e => { if (catFilter !== f.key) e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { if (catFilter !== f.key) e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
                  >{f.label}</button>
                ))}
              </div>

              {/* Refresh */}
              <button
                onClick={() => fetchTraffic(true)}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-xl bg-[#E8A83A] px-4 py-2 text-sm font-black text-[#0B2D5B] hover:bg-[#F5C842] transition disabled:opacity-50"
              >
                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { label: "Airborne", value: airborne.length },
              { label: "Visible", value: visibleAircraft.length },
              { label: "Total loaded", value: aircraft.length },
              { label: "ABOS matched", value: withListing },
              { label: "Source", value: sourceLabel },
              { label: "Last updated", value: dataTime ? dataTime.toLocaleTimeString() : "—" },
            ].map((s) => (
              <div key={s.label} className="glass-pill px-4 py-2"
                style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)", border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(12px)" }}>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.70)" }}>{s.label}: </span>
                <span className="text-sm font-black" style={{ color: isDark ? "#ffffff" : "#ffffff" }}>{s.value}</span>
              </div>
            ))}
          </div>

          {searchError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
              style={{ background: "rgba(232,168,58,0.12)", border: "1px solid rgba(232,168,58,0.25)", color: "#E8A83A" }}>
              <Info className="w-4 h-4 shrink-0" /> {searchError}
            </div>
          )}
          {error && (
            <div className="mt-3 rounded-xl px-4 py-2.5 text-sm"
              style={{ background: "rgba(255,77,109,0.10)", border: "1px solid rgba(255,77,109,0.20)", color: "#ff4d6d" }}>{error}</div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 px-4 md:px-8 pb-4">
        <div className="max-w-7xl mx-auto h-[70vh] rounded-3xl overflow-hidden shadow-xl relative"
          style={{ border: isDark ? "2px solid rgba(255,255,255,0.15)" : "2px solid rgba(255,255,255,0.10)" }}>
          {loading && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center backdrop-blur-sm" style={{ background: "rgba(10,10,20,0.85)" }}>
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#E8A83A]" />
                <p className="text-sm font-bold text-white/80">Loading global traffic…</p>
              </div>
            </div>
          )}
          <MapContainer center={WORLD_CENTER} zoom={WORLD_ZOOM} style={{ height: "100%", width: "100%" }} scrollWheelZoom zoomControl worldCopyJump>
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
              const textColor = isDark ? "#ffffff" : "#0B2D5B";
              const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "#6B6560";
              const subColor = isDark ? "rgba(255,255,255,0.30)" : "#AAA49C";
              const borderColor = isDark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.18)";
              const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)";
              return (
                <Marker
                  key={ac.icao24}
                  position={[ac.latitude, ac.longitude]}
                  icon={makeIcon(ac.baro_altitude, ac.true_track || 0, isHighlight)}
                  ref={(r) => { if (r) markerRefs.current[ac.icao24] = r; }}
                  zIndexOffset={isHighlight ? 1000 : 0}
                >
                  <Popup maxWidth={280}>
                    <div style={{ minWidth: 240, fontFamily: "system-ui, sans-serif", background: bgColor }}>
                      {/* Header: N-Reg → ICAO → Aircraft Type */}
                      <div style={{ borderBottom: `1px solid ${borderColor}`, paddingBottom: 8, marginBottom: 8 }}>
                        {/* 1. N-Reg (primary) */}
                        <p style={{ fontWeight: 900, color: "#E8A83A", fontSize: 13, margin: 0, letterSpacing: "0.05em" }}>
                          {nReg || ac.callsign?.trim() || ac.icao24}
                        </p>
                        {/* 2. ICAO */}
                        <p style={{ fontSize: 9, color: subColor, margin: "2px 0 0", fontFamily: "monospace" }}>
                          ICAO: {ac.icao24} {ac.squawk ? `· SQWK ${ac.squawk}` : ""}
                        </p>
                        {/* 3. Aircraft Type */}
                        {(ac.aircraft_type || ac.faa?.type_aircraft) && (
                          <p style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#00f5ff" : "#0B2D5B", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {ac.aircraft_type || ac.faa?.type_aircraft}
                          </p>
                        )}
                        {ac.callsign?.trim() && (nReg || ac.icao24 !== ac.callsign?.trim()) && (
                          <p style={{ fontSize: 10, color: mutedColor, margin: "2px 0 0" }}>Callsign: {ac.callsign.trim()}</p>
                        )}
                      </div>
                      {/* Stats grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 12, marginBottom: 6 }}>
                        <div><span style={{ color: subColor }}>Alt: </span><strong style={{ color: textColor }}>{altFt != null ? `${altFt.toLocaleString()} ft` : "—"}</strong></div>
                        <div><span style={{ color: subColor }}>Speed: </span><strong style={{ color: textColor }}>{speedKt != null ? `${speedKt} kt` : "—"}</strong></div>
                        <div><span style={{ color: subColor }}>Hdg: </span><strong style={{ color: textColor }}>{ac.true_track != null ? `${Math.round(ac.true_track)}°` : "—"}</strong></div>
                        <div><span style={{ color: subColor }}>V/S: </span><strong style={{ color: textColor }}>{vrateStr}</strong></div>
                        <div><span style={{ color: subColor }}>Status: </span><strong style={{ color: ac.on_ground ? "#ef4444" : "#22c55e" }}>{ac.on_ground ? "Ground" : "Airborne"}</strong></div>
                        {ac.squawk && <div><span style={{ color: subColor }}>Squawk: </span><strong style={{ color: textColor }}>{ac.squawk}</strong></div>}
                      </div>
                      {/* ABOS listing badge */}
                      {ac.listing && (
                        <div style={{ marginTop: 8, borderRadius: 8, background: cardBg, border: `1px solid ${borderColor}`, padding: "8px 10px" }}>
                          <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "#E8A83A", margin: "0 0 4px" }}>ABOS Listing</p>
                          {(ac.listing.year || ac.listing.make) ? (
                            <p style={{ fontWeight: 700, color: textColor, fontSize: 12, margin: 0 }}>{ac.listing.year || ""} {ac.listing.make || ""} {ac.listing.model || ""}</p>
                          ) : (
                            <p style={{ fontWeight: 700, color: textColor, fontSize: 12, margin: 0 }}>{nReg}</p>
                          )}
                          <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, flexWrap: "wrap" }}>
                            {ac.listing.ati_score && <span style={{ color: mutedColor }}>ATI: <strong style={{ color: textColor }}>{ac.listing.ati_score}</strong></span>}
                            {ac.listing.asking_price && <span style={{ color: mutedColor }}>Price: <strong style={{ color: textColor }}>${ac.listing.asking_price?.toLocaleString()}</strong></span>}
                            {ac.listing.deal_label && <span style={{ color: ac.listing.deal_label === "hot deal" ? "#22c55e" : undefined }}><strong>{ac.listing.deal_label}</strong></span>}
                            {ac.listing.card_code && <span style={{ color: mutedColor, fontSize: 10, fontFamily: "monospace" }}>{ac.listing.card_code}</span>}
                          </div>
                        </div>
                      )}

                      {/* Score N-reg aircraft without existing listing */}
                      {!ac.listing && nReg && /^N/i.test(nReg || "") && !scoringMap[ac.icao24] && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleScoreAircraft(ac); }}
                          style={{
                            marginTop: 8, width: "100%", border: "none", borderRadius: 8,
                            background: "linear-gradient(135deg, #0B2D5B, #1A4A8A)", cursor: "pointer",
                            padding: "7px 10px", fontSize: 11, fontWeight: 700, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            boxShadow: "0 2px 12px rgba(11,45,91,0.30)",
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Look up FAA &amp; Create ATI Card
                        </button>
                      )}
                      {scoringMap[ac.icao24] === "loading" && (
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: mutedColor }}>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8A83A]" /> Looking up FAA &amp; scoring…
                        </div>
                      )}
                      {scoringMap[ac.icao24] === "success" && (
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#22c55e", fontWeight: 600 }}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> ATI Card created!
                        </div>
                      )}
                      {scoringMap[ac.icao24] && scoringMap[ac.icao24] !== "loading" && scoringMap[ac.icao24] !== "success" && (
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                          <AlertCircle className="w-3.5 h-3.5" /> {scoringMap[ac.icao24]}
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
        <div className="max-w-7xl mx-auto mt-3 flex flex-wrap gap-3 items-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/60">Altitude:</span>
          {[
            { color: "#ef4444", label: "0–5k ft" },
            { color: "#f59e0b", label: "5–15k ft" },
            { color: "#22c55e", label: "15–30k ft" },
            { color: "#3b82f6", label: "30k+ ft" },
            { color: "#E8A83A", label: "Search result" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-white/55">{l.label}</span>
            </div>
          ))}
          <span className="ml-auto text-[10px] text-white/35">Data: adsb.lol · Cached snapshots via ABOS</span>
        </div>

        {/* Aircraft Flight History */}
        <div className="max-w-7xl mx-auto mt-6">
          <AircraftHistoryPanel isDark={isDark} />
        </div>

        {/* Historical snapshots */}
        <SnapshotHistoryPanel snapshots={snapshots} onLoad={loadSnapshot} />
      </div>
    </div>
  );
}
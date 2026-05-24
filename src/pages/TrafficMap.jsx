import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import { Radar, RefreshCw, Loader2, Search, X, Plane, Info } from "lucide-react";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const REGIONS = [
  { key: "central-europe", label: "Central Europe", center: [49.8, 15.5], zoom: 6, lamin: 45, lamax: 56, lomin: 5, lomax: 25 },
  { key: "europe",         label: "Europe",         center: [51, 10],      zoom: 5, lamin: 35, lamax: 62, lomin: -12, lomax: 35 },
  { key: "usa-east",       label: "USA East",       center: [38, -78],     zoom: 5, lamin: 25, lamax: 48, lomin: -90, lomax: -65 },
  { key: "usa-west",       label: "USA West",       center: [38, -115],    zoom: 5, lamin: 25, lamax: 50, lomin: -130, lomax: -100 },
  { key: "middle-east",    label: "Middle East",    center: [25, 45],      zoom: 5, lamin: 15, lamax: 38, lomin: 30, lomax: 65 },
];

const ftFromM = (m) => m == null ? "—" : `${Math.round(m * 3.28084).toLocaleString()} ft`;
const ktFromMs = (ms) => ms == null ? "—" : `${Math.round(ms * 1.94384)} kt`;

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
  const size = highlight ? 34 : 26;
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

function ResetView({ region }) {
  const map = useMap();
  useEffect(() => { map.setView(region.center, region.zoom); }, [region]);
  return null;
}

export default function TrafficMap() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dataTime, setDataTime] = useState(null);
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const markerRefs = useRef({});

  const fetchTraffic = useCallback(async (reg, force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    setError(null);
    setFlyTarget(null);
    try {
      const res = await base44.functions.invoke("cachedTraffic", {
        region_key: reg.key,
        region_label: reg.label,
        force_refresh: force,
        limit: 300,
        allow_heavy: true,
        lamin: reg.lamin, lamax: reg.lamax,
        lomin: reg.lomin, lomax: reg.lomax,
      });
      setAircraft(res.data?.aircraft || []);
      setDataTime(res.data?.refreshed_at ? new Date(res.data.refreshed_at) : new Date());
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to load traffic");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTraffic(region); }, [region.key]);

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

  const airborne = aircraft.filter((a) => !a.on_ground);
  const withListing = aircraft.filter((a) => a.listing).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F4EF]">
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
                <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight">Live Traffic Map</h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Region selector */}
              <select
                value={region.key}
                onChange={(e) => setRegion(REGIONS.find((r) => r.key === e.target.value))}
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold text-[#1A1814] outline-none"
              >
                {REGIONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>

              {/* Search */}
              <div className="flex gap-1">
                <div className="relative">
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setSearchError(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="N-number, ICAO, callsign…"
                    className="rounded-xl border border-black/10 bg-white pl-3 pr-8 py-2 text-sm font-mono w-52 outline-none focus:border-[#E8A83A]"
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

              {/* Refresh */}
              <button
                onClick={() => fetchTraffic(region, true)}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-xl bg-[#E8A83A] px-4 py-2 text-sm font-black text-[#0B2D5B] hover:bg-[#F5C842] transition disabled:opacity-50"
              >
                {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { label: "Airborne", value: airborne.length },
              { label: "Total visible", value: aircraft.length },
              { label: "ABOS listings matched", value: withListing },
              { label: "Last updated", value: dataTime ? dataTime.toLocaleTimeString() : "—" },
            ].map((s) => (
              <div key={s.label} className="glass-pill px-4 py-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6560]">{s.label}: </span>
                <span className="text-sm font-black text-[#0B2D5B]">{s.value}</span>
              </div>
            ))}
          </div>

          {searchError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              <Info className="w-4 h-4 shrink-0" /> {searchError}
            </div>
          )}
          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">{error}</div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto h-[70vh] rounded-3xl overflow-hidden border border-black/[0.07] shadow-sm relative">
          {loading && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#E8A83A]" />
                <p className="text-sm font-bold text-[#1A1814]">Loading live traffic…</p>
              </div>
            </div>
          )}
          <MapContainer center={region.center} zoom={region.zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom zoomControl>
            <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ResetView region={region} key={region.key} />
            {flyTarget && <FlyTo target={flyTarget} key={flyTarget.icao24 + Date.now()} />}
            {aircraft.map((ac) => {
              if (!ac.latitude || !ac.longitude) return null;
              const isHighlight = flyTarget?.icao24 === ac.icao24;
              const altFt = ac.baro_altitude != null ? Math.round(ac.baro_altitude * 3.28084) : null;
              const speedKt = ac.velocity != null ? Math.round(ac.velocity * 1.94384) : null;
              return (
                <Marker
                  key={ac.icao24}
                  position={[ac.latitude, ac.longitude]}
                  icon={makeIcon(ac.baro_altitude, ac.true_track || 0, isHighlight)}
                  ref={(r) => { if (r) markerRefs.current[ac.icao24] = r; }}
                  zIndexOffset={isHighlight ? 1000 : 0}
                >
                  <Popup maxWidth={260}>
                    <div className="space-y-1 text-sm" style={{ minWidth: 220 }}>
                      <p className="font-black text-[#0B2D5B] text-base">
                        {ac.callsign?.trim() || ac.faa?.n_number || ac.registration || ac.icao24}
                      </p>
                      <p className="text-[11px] font-mono text-[#6B6560]">ICAO: {ac.icao24}</p>
                      {ac.faa?.n_number && <p><strong>Reg:</strong> {ac.faa.n_number}</p>}
                      <p><strong>Alt:</strong> {altFt != null ? `${altFt.toLocaleString()} ft` : "—"}</p>
                      <p><strong>Speed:</strong> {speedKt != null ? `${speedKt} kt` : "—"}</p>
                      <p><strong>Heading:</strong> {ac.true_track != null ? `${Math.round(ac.true_track)}°` : "—"}</p>
                      <p><strong>Status:</strong> {ac.on_ground ? "On ground" : "Airborne"}</p>
                      {ac.listing && (
                        <div className="mt-2 rounded-lg bg-[#0B2D5B]/5 p-2 border border-[#0B2D5B]/10">
                          <p className="font-black text-[10px] uppercase tracking-wider text-[#E8A83A]">ABOS Listing</p>
                          <p className="font-bold text-[#0B2D5B]">{ac.listing.year} {ac.listing.make} {ac.listing.model}</p>
                          {ac.listing.ati_score && <p className="text-xs">ATI Score: <strong>{ac.listing.ati_score}</strong></p>}
                          {ac.listing.asking_price && <p className="text-xs">Price: <strong>${ac.listing.asking_price?.toLocaleString()}</strong></p>}
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
          <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6560]">Altitude:</span>
          {[
            { color: "#ef4444", label: "0–5k ft" },
            { color: "#f59e0b", label: "5–15k ft" },
            { color: "#22c55e", label: "15–30k ft" },
            { color: "#3b82f6", label: "30k+ ft" },
            { color: "#E8A83A", label: "Search result" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
              <span className="text-xs text-[#6B6560]">{l.label}</span>
            </div>
          ))}
          <span className="ml-auto text-[10px] text-[#AAA49C]">Data: adsb.lol · Cached snapshots via ABOS</span>
        </div>
      </div>
    </div>
  );
}
import { useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import { Plane, RefreshCw, AlertCircle, Search, X } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const REGIONS = [
  { label: "Europe",         center: [50, 14],  zoom: 5, bbox: { lamin: 35, lomin: -10, lamax: 60, lomax: 35 } },
  { label: "North America",  center: [40, -95], zoom: 4, bbox: { lamin: 25, lomin: -130, lamax: 55, lomax: -60 } },
  { label: "UK & Ireland",   center: [53, -2],  zoom: 6, bbox: { lamin: 49, lomin: -11, lamax: 61, lomax: 3 } },
  { label: "Central Europe", center: [50, 16],  zoom: 7, bbox: { lamin: 46, lomin: 10, lamax: 55, lomax: 24 } },
  { label: "Middle East",    center: [25, 45],  zoom: 5, bbox: { lamin: 12, lomin: 30, lamax: 40, lomax: 65 } },
  { label: "Asia Pacific",   center: [25, 115], zoom: 4, bbox: { lamin: -10, lomin: 90, lamax: 45, lomax: 145 } },
];

const m2ft = (m) => m != null ? Math.round(m * 3.28084) : null;
const mps2kts = (v) => v != null ? Math.round(v * 1.94384) : null;

function makeIcon(onGround, hasATI, highlighted) {
  const color = highlighted ? "#E8A83A" : hasATI ? "#D4A017" : onGround ? "#AAA49C" : "#185FA5";
  const size = highlighted ? 32 : 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="${color}" fill-opacity="${highlighted ? 0.35 : 0.2}" stroke="${color}" stroke-width="${highlighted ? 2.5 : 1.5}"/>
    <path d="M12 4 L9.5 16 L12 14 L14.5 16 Z" fill="${color}"/>
  </svg>`;
  return L.divIcon({ html: svg, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
}

// Fly map to position and open a marker's popup
function MapFlyTo({ target }) {
  const map = useMap();
  if (target) {
    map.flyTo([target.latitude, target.longitude], 10, { duration: 1.2 });
  }
  return null;
}

function MapView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function LiveTraffic() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataTime, setDataTime] = useState(null);
  const [mapCenter, setMapCenter] = useState(REGIONS[0].center);
  const [mapZoom, setMapZoom] = useState(REGIONS[0].zoom);
  const [recenter, setRecenter] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const markerRefs = useRef({});

  const fetchTraffic = useCallback(async (r) => {
    setLoading(true);
    setError(null);
    setFlyTarget(null);
    try {
      const res = await base44.functions.invoke("openSky", {
        action: "map_states",
        ...r.bbox,
        allow_heavy: true,
        limit: 500,
      });
      const list = res.data?.aircraft || [];
      setAircraft(list);
      setDataTime(res.data?.time ? new Date(res.data.time * 1000) : new Date());
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load traffic");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRegionChange = (r) => {
    setRegion(r);
    setMapCenter(r.center);
    setMapZoom(r.zoom);
    setRecenter(v => !v);
    setFlyTarget(null);
    setSearchQuery("");
    setSearchError(null);
    fetchTraffic(r);
  };

  const handleSearch = () => {
    setSearchError(null);
    const q = searchQuery.trim().toUpperCase().replace(/[-\s]/g, "");
    if (!q) return;

    const found = aircraft.find(ac => {
      const nNum = ac.faa?.n_number?.toUpperCase().replace(/[-\s]/g, "") || "";
      const icao = ac.icao24?.toUpperCase() || "";
      const cs = ac.callsign?.toUpperCase().trim() || "";
      return nNum === q || icao === q.toLowerCase() || nNum.includes(q) || cs === q;
    });

    if (!found) {
      setSearchError(`"${searchQuery.trim()}" not found in current traffic snapshot`);
      return;
    }

    setFlyTarget(found);
    // Open popup after map flies (slight delay)
    setTimeout(() => {
      const ref = markerRefs.current[found.icao24];
      if (ref) ref.openPopup();
    }, 1400);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchError(null);
    setFlyTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] flex flex-col">
      {/* Header */}
      <div className="bg-[#0B2D5B] px-4 md:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[#E8A83A]/70 text-[9px] uppercase tracking-[0.25em] font-bold mb-1">
              OpenSky Network · ADS-B · Live
            </p>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              Live Traffic Map
            </h1>
          </div>
          <button
            onClick={() => fetchTraffic(region)}
            disabled={loading}
            className="flex items-center gap-2 bg-[#E8A83A] hover:bg-[#D4A017] disabled:opacity-50 text-[#0B2D5B] font-black text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* Region selector */}
        <div className="flex flex-wrap gap-2 mt-4">
          {REGIONS.map(r => (
            <button
              key={r.label}
              onClick={() => handleRegionChange(r)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                region.label === r.label
                  ? "bg-[#E8A83A] text-[#0B2D5B] border-[#E8A83A]"
                  : "bg-white/[0.07] text-white/60 border-white/10 hover:border-white/25 hover:text-white/80"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchError(null); }}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Search N-number or ICAO24 hex (e.g. N123AB, 3c675a)"
                className="w-full pl-9 pr-8 py-2.5 bg-white/[0.08] border border-white/10 rounded-xl text-white text-[13px] font-mono placeholder:font-sans placeholder:text-white/30 focus:outline-none focus:border-[#E8A83A]/60 transition-colors"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || aircraft.length === 0}
              className="px-4 py-2.5 bg-white/[0.1] hover:bg-white/[0.18] disabled:opacity-40 border border-white/10 text-white font-bold text-[12px] rounded-xl transition-colors whitespace-nowrap"
            >
              Find
            </button>
          </div>
          {searchError && (
            <p className="mt-1.5 text-[11px] text-[#E8A83A] font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> {searchError}
            </p>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 md:px-8 py-2.5 bg-white border-b border-black/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="w-4 h-4 text-[#0B2D5B]" />
          <span className="text-sm font-bold text-[#1A1814]">
            {loading ? "Fetching data…" : `${aircraft.length} aircraft`}
          </span>
          {aircraft.length > 0 && !loading && (
            <span className="text-[11px] text-[#AAA49C]">
              · snapshot {dataTime?.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {flyTarget && (
            <span className="text-[11px] font-bold text-[#E8A83A]">
              · Showing: {flyTarget.faa?.n_number || flyTarget.callsign || flyTarget.icao24}
            </span>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-[#C0392B] text-[11px] font-semibold">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 240px)" }}>
        {aircraft.length === 0 && !loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-[999] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm border border-black/[0.08] rounded-2xl px-6 py-5 text-center shadow-lg pointer-events-auto">
              <Plane className="w-8 h-8 text-[#0B2D5B] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#1A1814] mb-1">Select a region to load traffic</p>
              <p className="text-[11px] text-[#6B6560]">Live data from OpenSky Network</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-[999] bg-white/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#E8A83A]/30 border-t-[#E8A83A] rounded-full animate-spin" />
              <p className="text-sm font-bold text-[#6B6560]">Loading traffic data…</p>
            </div>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%", minHeight: "calc(100vh - 240px)" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapView center={mapCenter} zoom={mapZoom} key={`${mapCenter}-${mapZoom}-${recenter}`} />
          {flyTarget && <MapFlyTo target={flyTarget} key={flyTarget.icao24} />}

          {aircraft.map((ac) => {
            const isHighlighted = flyTarget?.icao24 === ac.icao24;
            return (
              <Marker
                key={ac.icao24}
                position={[ac.latitude, ac.longitude]}
                icon={makeIcon(ac.on_ground, !!ac.listing, isHighlighted)}
                ref={ref => { if (ref) markerRefs.current[ac.icao24] = ref; }}
                zIndexOffset={isHighlighted ? 1000 : 0}
              >
                <Popup maxWidth={240}>
                  <div style={{ fontFamily: "Inter, sans-serif", minWidth: 200 }}>
                    <div style={{ background: "#0B2D5B", margin: "-8px -12px 10px", padding: "10px 12px", borderRadius: "6px 6px 0 0" }}>
                      <p style={{ color: "#E8A83A", fontSize: 10, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                        {ac.faa?.n_number || ac.callsign || ac.icao24}
                      </p>
                      <p style={{ color: "white", fontWeight: 900, fontSize: 13, marginTop: 2 }}>
                        {ac.listing ? `${ac.listing.year || ""} ${ac.listing.make || ""} ${ac.listing.model || ""}`.trim() : (ac.callsign?.trim() || ac.icao24)}
                      </p>
                      {ac.origin_country && (
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 2 }}>{ac.origin_country}</p>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                      {[
                        { label: "Altitude", value: m2ft(ac.baro_altitude) != null ? `${m2ft(ac.baro_altitude).toLocaleString()} ft` : "—" },
                        { label: "Speed", value: mps2kts(ac.velocity) != null ? `${mps2kts(ac.velocity)} kts` : "—" },
                        { label: "Heading", value: ac.true_track != null ? `${Math.round(ac.true_track)}°` : "—" },
                        { label: "Status", value: ac.on_ground ? "On Ground" : "Airborne" },
                      ].map(s => (
                        <div key={s.label} style={{ background: "#F7F4EF", borderRadius: 6, padding: "5px 8px" }}>
                          <p style={{ fontSize: 8, color: "#AAA49C", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
                          <p style={{ fontSize: 12, fontWeight: 900, color: s.label === "Status" ? (ac.on_ground ? "#C0392B" : "#0F7A56") : "#1A1814" }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {ac.listing && (
                      <div style={{ background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.3)", borderRadius: 8, padding: "6px 10px" }}>
                        <p style={{ fontSize: 9, fontWeight: 800, color: "#A67C00", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>
                          ATI Score: {ac.listing.ati_score}
                        </p>
                        {ac.listing.asking_price && (
                          <p style={{ fontSize: 13, fontWeight: 900, color: "#1A1814" }}>${ac.listing.asking_price.toLocaleString()}</p>
                        )}
                      </div>
                    )}

                    <p style={{ fontSize: 8, color: "#AAA49C", marginTop: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ICAO24: {ac.icao24}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
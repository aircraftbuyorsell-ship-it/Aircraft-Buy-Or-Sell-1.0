import { useState, useRef, useCallback, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import LiveTrafficHeader from "@/components/live-traffic/LiveTrafficHeader";
import LiveTrafficStatusBar from "@/components/live-traffic/LiveTrafficStatusBar";
import AircraftPopup from "@/components/live-traffic/AircraftPopup";
import { PALETTE, REGIONS, toRegionKey } from "@/components/live-traffic/liveTrafficConfig";
import "leaflet/dist/leaflet.css";

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeIcon(onGround, hasListing, highlighted) {
  const color = highlighted ? PALETTE.gold : hasListing ? PALETTE.amber : onGround ? PALETTE.muted : PALETTE.cognac;
  const size = highlighted ? 36 : 28;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="${color}" fill-opacity="${highlighted ? 0.4 : 0.25}" stroke="${color}" stroke-width="${highlighted ? 3 : 2}"/>
    <path d="M12 4 L9.5 16 L12 14 L14.5 16 Z" fill="${color}" opacity="0.92"/>
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

  const fetchTraffic = useCallback(async (r, forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setFlyTarget(null);
    try {
      const regionKey = toRegionKey(r.label);
      const res = await base44.functions.invoke("cachedTraffic", {
        region_key: regionKey,
        region_label: r.label,
        force_refresh: forceRefresh,
        ...r.bbox,
        allow_heavy: false,
        limit: 200,
      });
      const list = res.data?.aircraft || [];
      setAircraft(list);
      setDataTime(res.data?.time ? new Date(res.data.time * 1000) : new Date(res.data?.refreshed_at || Date.now()));
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load traffic");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTraffic(REGIONS[0]);
  }, [fetchTraffic]);

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
      const makeModel = `${ac.listing?.make || ""}${ac.listing?.model || ""}${ac.listing?.year || ""}`.toUpperCase().replace(/[-\s]/g, "");
      return nNum === q || icao === q || nNum.includes(q) || cs === q || cs.includes(q) || makeModel.includes(q);
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
    <div className="flex min-h-screen flex-col bg-[#0a0602]">
      <LiveTrafficHeader
        region={region}
        regions={REGIONS}
        loading={loading}
        aircraftCount={aircraft.length}
        searchQuery={searchQuery}
        searchError={searchError}
        onSearchChange={(value) => { setSearchQuery(value); setSearchError(null); }}
        onSearch={handleSearch}
        onClearSearch={clearSearch}
        onRegionChange={handleRegionChange}
        onRefresh={() => fetchTraffic(region, true)}
      />

      <LiveTrafficStatusBar
        loading={loading}
        aircraftCount={aircraft.length}
        dataTime={dataTime}
        flyTarget={flyTarget}
        error={error}
      />

      <div className="relative flex-1" style={{ minHeight: "calc(100vh - 330px)" }}>
        {aircraft.length === 0 && !loading && !error && (
          <div className="pointer-events-none absolute inset-0 z-[999] flex flex-col items-center justify-center">
            <div className="pointer-events-auto rounded-2xl border border-[#7a6248]/40 bg-[#f5e8ce]/95 px-6 py-5 text-center shadow-2xl">
              <p className="text-sm font-black text-[#0a0602]">Loading cached traffic</p>
              <p className="mt-1 text-[11px] text-[#7a6248]">Fast snapshots from OpenSky Network</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center bg-[#1c1008]/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#7a6248]/40 border-t-[#c8862e]" />
              <p className="text-sm font-bold text-[#ede0c4]">Loading traffic data…</p>
            </div>
          </div>
        )}

        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: "100%", width: "100%", minHeight: "calc(100vh - 330px)", filter: "invert(0.93) hue-rotate(200deg) saturate(0.82)" }}
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
                <Popup maxWidth={275}>
                  <AircraftPopup aircraft={ac} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
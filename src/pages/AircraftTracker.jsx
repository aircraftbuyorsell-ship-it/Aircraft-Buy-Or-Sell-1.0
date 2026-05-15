import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import { Search, ZoomIn, ZoomOut, RotateCcw, Plane, Loader2, Moon, Sun } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const ALT_LEGEND = [
  { color: "#ff0000", label: "0–5,000 ft" },
  { color: "#ffaa00", label: "5,000–15,000 ft" },
  { color: "#00ff00", label: "15,000–30,000 ft" },
  { color: "#0000ff", label: "30,000+ ft" },
];

function altitudeColor(altFt) {
  if (altFt == null) return "#999999";
  if (altFt < 5000) return "#ff0000";
  if (altFt < 15000) return "#ffaa00";
  if (altFt < 30000) return "#00ff00";
  return "#0000ff";
}

function makeIcon(altFt, heading = 0, selected = false) {
  const color = altitudeColor(altFt);
  const size = selected ? 34 : 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="transform: rotate(${heading}deg);">
    <path d="M12 2 L7 20 L12 17 L17 20 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function MapController({ center, zoom, flyTo }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) map.flyTo(flyTo, 8, { duration: 1.2 });
  }, [flyTo, map]);
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function ZoomControls({ onZoomIn, onZoomOut, onReset, darkMode, onToggleTheme }) {
  return (
    <div className="absolute top-3 right-3 z-[500] flex flex-col gap-2">
      <button onClick={onZoomIn} title="Zoom in" className="h-10 w-10 rounded-lg bg-white/95 text-black font-bold shadow-lg hover:bg-white dark:bg-zinc-800/95 dark:text-white dark:hover:bg-zinc-700">+</button>
      <button onClick={onZoomOut} title="Zoom out" className="h-10 w-10 rounded-lg bg-white/95 text-black font-bold shadow-lg hover:bg-white dark:bg-zinc-800/95 dark:text-white dark:hover:bg-zinc-700">−</button>
      <button onClick={onReset} title="Reset" className="h-10 w-10 rounded-lg bg-white/95 text-black shadow-lg hover:bg-white dark:bg-zinc-800/95 dark:text-white dark:hover:bg-zinc-700 flex items-center justify-center">
        <RotateCcw className="h-4 w-4" />
      </button>
      <button onClick={onToggleTheme} title="Toggle theme" className="h-10 w-10 rounded-lg bg-white/95 text-black shadow-lg hover:bg-white dark:bg-zinc-800/95 dark:text-white dark:hover:bg-zinc-700 flex items-center justify-center">
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}

const DEFAULT_CENTER = [50, 5];
const DEFAULT_ZOOM = 4;

export default function AircraftTracker() {
  const [icaoInput, setIcaoInput] = useState("");
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIcao, setSelectedIcao] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const markerRefs = useRef({});

  const searchByIcao = useCallback(async (hex) => {
    const cleaned = String(hex || "").toLowerCase().trim();
    if (!/^[0-9a-f]{6}$/.test(cleaned)) {
      setError("Enter a valid 6-character ICAO24 hex code (e.g. 3c675a)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("openSky", { action: "state", icao24: cleaned });
      const s = res.data?.state;
      if (!s || s.latitude == null || s.longitude == null) {
        setError("Aircraft not currently visible on ADS-B network");
        setAircraft([]);
        return;
      }
      const enriched = {
        ...s,
        faa: res.data?.faa,
        fuel_estimate: res.data?.fuel_estimate,
        endurance: res.data?.endurance,
      };
      setAircraft([enriched]);
      setSelectedIcao(s.icao24);
      setFlyTo([s.latitude, s.longitude]);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to fetch");
      setAircraft([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load default area on mount (Europe)
  const loadDefaultArea = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("openSky", {
        action: "map_states",
        lamin: 45, lamax: 55, lomin: -5, lomax: 15,
        allow_heavy: true, limit: 80,
      });
      setAircraft(res.data?.aircraft || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load traffic");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDefaultArea(); }, [loadDefaultArea]);

  const handleSelect = (ac) => {
    setSelectedIcao(ac.icao24);
    setFlyTo([ac.latitude, ac.longitude]);
    setTimeout(() => {
      const ref = markerRefs.current[ac.icao24];
      if (ref) ref.openPopup();
    }, 1300);
  };

  const reset = () => {
    setFlyTo(null);
    setSelectedIcao(null);
    loadDefaultArea();
  };

  const tileUrl = darkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-[calc(100vh-80px)] bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
        {/* Sidebar */}
        <aside className="w-[360px] flex-shrink-0 overflow-y-auto border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-5">
          <div className="flex items-center justify-between border-b-2 border-blue-500 pb-3 mb-5">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-500" /> Aircraft Tracker
            </h1>
            <button
              onClick={() => setDarkMode(v => !v)}
              className="rounded-md bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-sm font-semibold"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>

          <div className="flex gap-2 mb-5">
            <input
              value={icaoInput}
              onChange={(e) => setIcaoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchByIcao(icaoInput)}
              placeholder="ICAO24 hex (e.g. 3c675a)"
              className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500"
            />
            <button
              onClick={() => searchByIcao(icaoInput)}
              disabled={loading}
              className="rounded-md bg-green-600 hover:bg-green-700 text-white px-4 text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-1">Active Aircraft</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              {loading ? "Loading..." : `${aircraft.length} aircraft`}
            </p>
            <div className="space-y-2 max-h-[calc(100vh-440px)] overflow-y-auto">
              {aircraft.map((ac) => {
                const altFt = ac.baro_altitude != null ? Math.round(ac.baro_altitude * 3.281) : null;
                const speedKt = ac.velocity != null ? Math.round(ac.velocity * 1.944) : null;
                const isSelected = ac.icao24 === selectedIcao;
                return (
                  <button
                    key={ac.icao24}
                    onClick={() => handleSelect(ac)}
                    className={`w-full text-left rounded-md border px-3 py-2.5 transition ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600"}`}
                  >
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {ac.callsign?.trim() || ac.faa?.n_number || "Unknown"}
                    </div>
                    <div className="text-[11px] mt-1 space-y-0.5 text-zinc-700 dark:text-zinc-300">
                      <div><strong>ICAO:</strong> <span className="font-mono">{ac.icao24}</span></div>
                      <div><strong>Alt:</strong> {altFt != null ? `${altFt.toLocaleString()} ft` : "N/A"}</div>
                      <div><strong>Speed:</strong> {speedKt != null ? `${speedKt} kt` : "N/A"}</div>
                      <div><strong>Country:</strong> {ac.origin_country || "—"}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-md border border-zinc-200 dark:border-zinc-600 p-3 bg-white dark:bg-zinc-700">
            <h4 className="font-semibold text-sm mb-2">Altitude Legend</h4>
            {ALT_LEGEND.map(l => (
              <div key={l.label} className="flex items-center gap-2 text-xs mb-1.5 last:mb-0">
                <span className="inline-block h-4 w-4 rounded-full" style={{ background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </aside>

        {/* Map */}
        <div className="relative flex-1">
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
            zoomControl={false}
          >
            <TileLayer
              key={tileUrl}
              attribution='&copy; OpenStreetMap contributors'
              url={tileUrl}
            />
            <MapController flyTo={flyTo} />
            <ZoomControlsBridge onReset={reset} darkMode={darkMode} onToggleTheme={() => setDarkMode(v => !v)} />

            {aircraft.map((ac) => {
              if (ac.latitude == null || ac.longitude == null) return null;
              const altFt = ac.baro_altitude != null ? Math.round(ac.baro_altitude * 3.281) : null;
              const speedKt = ac.velocity != null ? Math.round(ac.velocity * 1.944) : null;
              return (
                <Marker
                  key={ac.icao24}
                  position={[ac.latitude, ac.longitude]}
                  icon={makeIcon(altFt, ac.true_track || 0, ac.icao24 === selectedIcao)}
                  ref={(ref) => { if (ref) markerRefs.current[ac.icao24] = ref; }}
                >
                  <Popup>
                    <div style={{ minWidth: 200, fontFamily: "system-ui" }}>
                      <div style={{ fontWeight: 700, color: "#2563eb", fontSize: 14, marginBottom: 6 }}>
                        {ac.callsign?.trim() || ac.faa?.n_number || ac.icao24}
                      </div>
                      <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                        <div><strong>ICAO24:</strong> <span style={{ fontFamily: "monospace" }}>{ac.icao24}</span></div>
                        <div><strong>Altitude:</strong> {altFt != null ? `${altFt.toLocaleString()} ft` : "N/A"}</div>
                        <div><strong>Speed:</strong> {speedKt != null ? `${speedKt} kt` : "N/A"}</div>
                        <div><strong>Heading:</strong> {ac.true_track != null ? `${Math.round(ac.true_track)}°` : "N/A"}</div>
                        <div><strong>Country:</strong> {ac.origin_country || "—"}</div>
                        <div><strong>Status:</strong> {ac.on_ground ? "On Ground" : "Airborne"}</div>
                        {ac.faa?.n_number && <div><strong>Reg:</strong> {ac.faa.n_number}</div>}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

// Hook the zoom controls into the map context
function ZoomControlsBridge({ onReset, darkMode, onToggleTheme }) {
  const map = useMap();
  return (
    <ZoomControls
      onZoomIn={() => map.setZoom(map.getZoom() + 1)}
      onZoomOut={() => map.setZoom(map.getZoom() - 1)}
      onReset={() => { map.setView(DEFAULT_CENTER, DEFAULT_ZOOM); onReset?.(); }}
      darkMode={darkMode}
      onToggleTheme={onToggleTheme}
    />
  );
}
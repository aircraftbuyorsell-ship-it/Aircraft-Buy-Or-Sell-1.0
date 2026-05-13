import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import {
  Radio, Search, Plane, AlertCircle, Navigation, Gauge,
  MapPin, Fuel, Zap, RefreshCw, ChevronDown, X
} from "lucide-react";
import ATIMarkerPopup from "@/components/live-traffic/ATIMarkerPopup";
import TrafficStatsPanel from "@/components/live-traffic/TrafficStatsPanel";
import { AIRPORT_PRESETS } from "@/components/live-traffic/AirportPresets";
import TrafficFilterBar, { mapCategoryToMTOW } from "@/components/live-traffic/TrafficFilterBar";
import { useBehavior } from "@/lib/useBehavior";

// Fix leaflet default icons
import "leaflet/dist/leaflet.css";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Custom aircraft icons ────────────────────────────────────────
function makeAircraftIcon(ati, heading, onGround) {
  const color = ati >= 90 ? "#0F7A56" : ati >= 72 ? "#185FA5" : ati > 0 ? "#D4A017" : "#6B6560";
  const bg = ati > 0 ? color : "#AAA49C";
  const rotation = heading != null ? heading : 0;
  const size = ati > 0 ? 28 : 22;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="transform:rotate(${rotation}deg)">
    <circle cx="12" cy="12" r="11" fill="${bg}" fill-opacity="0.18" stroke="${bg}" stroke-width="1.5"/>
    <path d="M12 3 L9 14 L12 12 L15 14 Z" fill="${onGround ? '#888' : bg}" stroke="${onGround ? '#888' : bg}" stroke-width="0.5"/>
    ${ati > 0 ? `<text x="12" y="22" text-anchor="middle" font-size="5" font-weight="900" fill="${bg}" font-family="Inter,sans-serif">${ati}</text>` : ""}
  </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// ─── Map recenter helper ──────────────────────────────────────────
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || map.getZoom());
  }, [center, zoom]);
  return null;
}

// ─── Single aircraft lookup (legacy N-number search) ─────────────
const HEX_RE = /^[0-9a-f]{6}$/i;
async function resolveToHex(query) {
  const q = query.trim();
  if (!q) throw new Error("Enter a registration or Mode-S hex");
  if (HEX_RE.test(q)) return { hex: q.toLowerCase(), source: "hex", reg: null };
  const normalized = q.toUpperCase().replace(/[-\s]/g, "");
  const isNreg = /^N[0-9A-Z]{1,5}$/.test(normalized);
  if (isNreg) {
    const nNum = normalized.substring(1);
    const matches = await base44.entities.FAAAircraft.filter({ n_number: nNum }, "-last_action_date", 1);
    if (matches.length && matches[0].mode_s_hex) {
      return { hex: matches[0].mode_s_hex.toLowerCase(), source: "faa", reg: `N${nNum}` };
    }
    throw new Error(`N${nNum} not found in FAA registry. Try the 6-char hex directly.`);
  }
  throw new Error(`Non-US registration. Enter the 6-char Mode-S hex instead.`);
}

function formatTime(unix) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
const mps2kts = (v) => v != null ? Math.round(v * 1.94384) : null;
const m2ft = (m) => m != null ? Math.round(m * 3.28084) : null;

// ─── Main page ────────────────────────────────────────────────────
export default function LiveTraffic() {
  const { tier } = useBehavior();
  const isPro = tier !== "free_explorer";

  // Map view state
  const [mapCenter, setMapCenter] = useState([39.5, -98.35]); // USA default
  const [mapZoom, setMapZoom] = useState(5);
  const [mapAircraft, setMapAircraft] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [allowHeavy, setAllowHeavy] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const mapRef = useRef(null);

  // Primary filters
  const [nSearch, setNSearch] = useState("");
  const [airportSearch, setAirportSearch] = useState("");
  const [mtowCategory, setMtowCategory] = useState("all");

  // Filtered aircraft (primary filters applied on frontend)
  const filteredAircraft = mapAircraft.filter(ac => {
    // N-number / ICAO24 filter
    if (nSearch) {
      const q = nSearch.trim().toUpperCase().replace(/[-\s]/g, "");
      const nNum = ac.faa?.n_number?.toUpperCase().replace(/[-\s]/g, "") || "";
      const icao = ac.icao24?.toUpperCase() || "";
      const callsign = ac.callsign?.toUpperCase().trim() || "";
      if (!nNum.includes(q) && !icao.includes(q) && !callsign.includes(q)) return false;
    }
    // Airport filter (match departure/arrival from recent flights — approximate via callsign prefix)
    if (airportSearch) {
      const apt = airportSearch.trim().toUpperCase();
      const cs = ac.callsign?.toUpperCase().trim() || "";
      // basic: callsign starts with ICAO airport prefix (KOSH → OSH flights, etc.)
      if (!cs.startsWith(apt.slice(1)) && !cs.includes(apt)) return false;
    }
    // MTOW category filter
    if (mtowCategory !== "all") {
      const bucket = mapCategoryToMTOW(ac.category);
      if (bucket !== mtowCategory) return false;
    }
    return true;
  });

  // Single aircraft lookup state
  const [query, setQuery] = useState("");
  const [resolved, setResolved] = useState(null);
  const [singleState, setSingleState] = useState(null);
  const [flights, setFlights] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  // Fetch area traffic
  const fetchMapTraffic = useCallback(async (bbox, heavy) => {
    setMapLoading(true);
    setMapError(null);
    try {
      const res = await base44.functions.invoke("openSky", {
        action: "map_states",
        lamin: bbox.lamin,
        lomin: bbox.lomin,
        lamax: bbox.lamax,
        lomax: bbox.lomax,
        allow_heavy: heavy ?? allowHeavy,
        limit: isPro ? 500 : 200,
      });
      setMapAircraft(res.data?.aircraft || []);
      setLastRefresh(new Date());
    } catch (e) {
      setMapError(e.response?.data?.error || e.message);
    } finally {
      setMapLoading(false);
    }
  }, [allowHeavy, isPro]);

  // Load preset
  const loadPreset = (preset) => {
    setSelectedPreset(preset);
    setMapCenter([preset.lat, preset.lng]);
    setMapZoom(preset.zoom);
    setShowPresets(false);
    fetchMapTraffic(preset.bbox, allowHeavy);
  };

  // Auto-refresh every 30s when a preset is selected
  useEffect(() => {
    if (!selectedPreset) return;
    const interval = setInterval(() => {
      fetchMapTraffic(selectedPreset.bbox, allowHeavy);
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedPreset, allowHeavy, fetchMapTraffic]);

  // Single aircraft lookup
  const lookupMutation = useMutation({
    mutationFn: async () => {
      setLookupError(null);
      setSingleState(null);
      setFlights(null);
      setResolved(null);
      const info = await resolveToHex(query);
      setResolved(info);
      const [stateRes, flightsRes] = await Promise.allSettled([
        base44.functions.invoke("openSky", { action: "state", icao24: info.hex }),
        base44.functions.invoke("openSky", { action: "flights", icao24: info.hex, days: 7 }),
      ]);
      return {
        state: stateRes.status === "fulfilled" ? (stateRes.value.data?.state || null) : null,
        flights: flightsRes.status === "fulfilled" ? (flightsRes.value.data?.flights || []) : [],
        stateError: stateRes.status === "rejected" ? stateRes.reason?.message : null,
      };
    },
    onSuccess: (data) => {
      setSingleState(data.state);
      setFlights(data.flights);
      if (data.state?.latitude && data.state?.longitude) {
        setMapCenter([data.state.latitude, data.state.longitude]);
        setMapZoom(10);
      }
    },
    onError: (e) => setLookupError(e.message),
  });

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* ── Header ── */}
      <div className="bg-[#0B2D5B] px-4 md:px-8 pt-6 pb-5">
        <p className="text-[#E8A83A]/70 text-[9px] uppercase tracking-[0.25em] font-bold mb-2">Live · OpenSky Network · ADS-B</p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none uppercase">
              Live ATI Traffic Map
            </h1>
            <p className="text-white/40 text-[12px] mt-2">
              Real-time aircraft + ATI scoring · perfect for airshows & fly-ins
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Heavy filter toggle */}
            <button
              onClick={() => {
                const next = !allowHeavy;
                setAllowHeavy(next);
                if (selectedPreset) fetchMapTraffic(selectedPreset.bbox, next);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[11px] font-bold border transition-all ${
                allowHeavy
                  ? "bg-[#E8A83A] text-[#0B2D5B] border-[#E8A83A]"
                  : "bg-white/[0.07] text-white/60 border-white/10 hover:border-white/20"
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              {allowHeavy ? "All Traffic (incl. Heavy)" : "GA Only (no heavy)"}
            </button>

            {/* Preset selector */}
            <div className="relative">
              <button
                onClick={() => setShowPresets(v => !v)}
                className="flex items-center gap-2 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] text-[12px] font-black px-4 py-2 rounded-lg transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                {selectedPreset ? selectedPreset.label.split("(")[0].trim() : "Select Airshow / Airport"}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showPresets && (
                <div className="absolute top-full mt-1 right-0 z-50 bg-white rounded-xl shadow-2xl border border-black/[0.08] min-w-[280px] overflow-hidden">
                  {AIRPORT_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => loadPreset(p)}
                      className={`w-full text-left px-4 py-3 text-[12px] font-semibold hover:bg-[#F7F4EF] border-b border-black/[0.04] last:border-0 transition-colors ${selectedPreset?.label === p.label ? "text-[#0B2D5B] font-black bg-[rgba(11,45,91,0.04)]" : "text-[#1A1814]"}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-5 space-y-5">

        {/* ── Primary Filters ── */}
        <TrafficFilterBar
          nSearch={nSearch} setNSearch={setNSearch}
          airportSearch={airportSearch} setAirportSearch={setAirportSearch}
          mtowCategory={mtowCategory} setMtowCategory={setMtowCategory}
          activeCount={mapAircraft.length > 0 ? filteredAircraft.length : null}
        />

        {/* ── Stats row ── */}
        {filteredAircraft.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560]">
                {selectedPreset?.label} — {filteredAircraft.length} of {mapAircraft.length} aircraft
              </p>
              <div className="flex items-center gap-2">
                {lastRefresh && (
                  <p className="text-[10px] text-[#AAA49C]">
                    Updated {lastRefresh.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </p>
                )}
                <button
                  onClick={() => selectedPreset && fetchMapTraffic(selectedPreset.bbox, allowHeavy)}
                  disabled={mapLoading}
                  className="flex items-center gap-1.5 text-[11px] text-[#0B2D5B] font-bold hover:text-[#E8A83A] transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${mapLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
            <TrafficStatsPanel aircraft={filteredAircraft} />
          </div>
        )}

        {/* ── Map ── */}
        <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden shadow-sm" style={{ height: "clamp(360px, 55vh, 620px)" }}>
          {!selectedPreset && mapAircraft.length === 0 && !mapLoading && (
            <div className="flex flex-col items-center justify-center h-full text-[#AAA49C] space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#F0EDE6] flex items-center justify-center">
                <MapPin className="w-8 h-8 text-[#AAA49C]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-[#6B6560]">Select an airshow or airport above</p>
                <p className="text-[11px] mt-1 text-[#AAA49C]">to load live GA traffic with ATI scoring</p>
              </div>
            </div>
          )}

          {mapLoading && mapAircraft.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 border-4 border-[#E8A83A]/30 border-t-[#E8A83A] rounded-full animate-spin" />
              <p className="text-sm font-bold text-[#6B6560]">Loading live traffic…</p>
            </div>
          )}

          {mapError && (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-[#C0392B] text-sm bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.2)] rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {mapError}
              </div>
            </div>
          )}

          {(filteredAircraft.length > 0 || selectedPreset) && !mapError && (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapRecenter center={mapCenter} zoom={mapZoom} />
              {filteredAircraft.map((ac) => (
                <Marker
                  key={ac.icao24}
                  position={[ac.latitude, ac.longitude]}
                  icon={makeAircraftIcon(ac.listing?.ati_score, ac.true_track, ac.on_ground)}
                >
                  <Popup maxWidth={260}>
                    <ATIMarkerPopup ac={ac} />
                  </Popup>
                </Marker>
              ))}
              {/* Single aircraft pin */}
              {singleState?.latitude && singleState?.longitude && (
                <Marker
                  position={[singleState.latitude, singleState.longitude]}
                  icon={makeAircraftIcon(null, singleState.true_track, singleState.on_ground)}
                >
                  <Popup>
                    <div style={{ fontFamily: "Inter, sans-serif", minWidth: 180 }}>
                      <p style={{ fontWeight: 900, fontSize: 14, color: "#0B2D5B" }}>{resolved?.reg || resolved?.hex}</p>
                      <p style={{ fontSize: 11, color: "#6B6560" }}>
                        {m2ft(singleState.baro_altitude)?.toLocaleString()} ft · {mps2kts(singleState.velocity)} kts
                      </p>
                      <p style={{ fontSize: 10, color: singleState.on_ground ? "#C0392B" : "#0F7A56", fontWeight: 800, marginTop: 4 }}>
                        {singleState.on_ground ? "On Ground" : "Airborne"}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          )}
        </div>

        {/* ── Single aircraft lookup ── */}
        <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#0B2D5B] mb-3">Track Individual Aircraft</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupMutation.mutate()}
                placeholder="N123AB, N67890, or 6-char hex (3c675a)"
                className="w-full pl-9 pr-4 py-2.5 bg-[#F7F4EF] border border-black/[0.07] rounded-lg text-sm font-mono focus:outline-none focus:border-[#0B2D5B] transition-colors"
              />
            </div>
            <button
              onClick={() => lookupMutation.mutate()}
              disabled={lookupMutation.isPending || !query.trim()}
              className="flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-50 text-white font-black uppercase tracking-wider text-sm px-5 rounded-lg transition-colors"
            >
              <Radio className={`w-4 h-4 ${lookupMutation.isPending ? "animate-pulse" : ""}`} />
              {lookupMutation.isPending ? "Pinging…" : "Track"}
            </button>
          </div>

          {resolved && (
            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#6B6560]">
              <span className="uppercase tracking-wider font-bold text-[#E8A83A]">{resolved.source === "faa" ? "FAA match" : "Direct hex"}</span>
              {resolved.reg && <span className="font-mono font-bold text-[#1A1814]">{resolved.reg}</span>}
              <span>→</span>
              <span className="font-mono font-bold text-[#0B2D5B]">{resolved.hex}</span>
            </div>
          )}

          {lookupError && (
            <div className="mt-3 flex items-start gap-2 bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-sm rounded-lg px-4 py-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {/* Single aircraft state */}
          {singleState && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Gauge, label: "Altitude", value: `${m2ft(singleState.baro_altitude)?.toLocaleString() || "—"} ft` },
                { icon: Navigation, label: "Speed", value: `${mps2kts(singleState.velocity) || "—"} kts` },
                { icon: Navigation, label: "Heading", value: singleState.true_track != null ? `${Math.round(singleState.true_track)}°` : "—" },
                { icon: MapPin, label: "Status", value: singleState.on_ground ? "On Ground" : "Airborne" },
              ].map(s => (
                <div key={s.label} className="bg-[#F7F4EF] rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <s.icon className="w-3 h-3 text-[#0B2D5B]" />
                    <p className="text-[9px] uppercase tracking-wider font-semibold text-[#AAA49C]">{s.label}</p>
                  </div>
                  <p className="text-sm font-black text-[#1A1814]">{s.value}</p>
                </div>
              ))}
              <p className="col-span-2 md:col-span-4 text-[10px] text-[#AAA49C] uppercase tracking-wider">
                Last contact: {formatTime(singleState.last_contact)} · {singleState.position_source === 0 ? "ADS-B" : "MLAT/FLARM"}
              </p>
            </div>
          )}

          {/* Flight history */}
          {flights && flights.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560] mb-2">Last 7 Days</p>
              <div className="bg-[#F7F4EF] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_1fr_70px] gap-2 px-4 py-2 text-[9px] uppercase tracking-wider font-bold text-[#AAA49C]">
                  <div>Departure</div><div>Arrival</div><div>Callsign</div><div className="text-right">Duration</div>
                </div>
                {flights.slice(0, 8).map((f, i) => {
                  const dur = f.lastSeen && f.firstSeen ? Math.round((f.lastSeen - f.firstSeen) / 60) + "m" : "—";
                  return (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_70px] gap-2 px-4 py-2.5 border-t border-black/[0.04] text-[12px]">
                      <div>
                        <p className="font-bold text-[#1A1814] font-mono">{f.estDepartureAirport || "—"}</p>
                        <p className="text-[10px] text-[#AAA49C]">{formatTime(f.firstSeen)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1814] font-mono">{f.estArrivalAirport || "—"}</p>
                        <p className="text-[10px] text-[#AAA49C]">{formatTime(f.lastSeen)}</p>
                      </div>
                      <div className="font-mono text-[#6B6560] text-[11px]">{f.callsign?.trim() || "—"}</div>
                      <div className="text-right font-bold text-[#0B2D5B]">{dur}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Pro upgrade note ── */}
        {!isPro && (
          <div className="flex items-center gap-3 bg-[rgba(11,45,91,0.05)] border border-[rgba(11,45,91,0.12)] rounded-xl px-4 py-3">
            <Zap className="w-4 h-4 text-[#E8A83A] shrink-0" />
            <p className="text-[12px] text-[#6B6560]">
              <span className="font-black text-[#0B2D5B]">Pro users</span> can view all traffic including heavy/commercial jets and get up to 500 aircraft per area.
            </p>
          </div>
        )}

        <p className="text-[10px] text-[#AAA49C] uppercase tracking-wider text-center pb-4">
          Data: OpenSky Network · Community ADS-B feed · Auto-refresh every 30s
        </p>
      </div>
    </div>
  );
}
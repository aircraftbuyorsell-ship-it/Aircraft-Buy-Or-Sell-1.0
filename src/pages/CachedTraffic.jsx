import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Radar, Database } from "lucide-react";

const REGIONS = [
  { key: "europe", label: "Europe", center: [49.8, 15.5], zoom: 5, bounds: { lamin: 35, lomin: -12, lamax: 60, lomax: 35 } },
  { key: "usa", label: "United States", center: [39.5, -98.35], zoom: 4, bounds: { lamin: 24, lomin: -125, lamax: 50, lomax: -66 } },
  { key: "central-europe", label: "Central Europe", center: [49.8, 15.5], zoom: 6, bounds: { lamin: 45, lomin: 5, lamax: 55, lomax: 25 } },
];

const planeIcon = L.divIcon({
  className: "",
  html: '<div style="width:28px;height:28px;border-radius:999px;background:#0B2D5B;border:2px solid #E8A83A;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;box-shadow:0 8px 20px rgba(0,0,0,.25)">✈</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const formatDate = (value) => value ? new Date(value).toLocaleString() : "Not refreshed yet";
const metersToFeet = (meters) => meters == null ? "—" : `${Math.round(meters * 3.28084).toLocaleString()} ft`;
const msToKnots = (ms) => ms == null ? "—" : `${Math.round(ms * 1.94384)} kt`;

export default function CachedTraffic() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [aircraft, setAircraft] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadTraffic = async (forceRefresh = false, selectedRegion = region) => {
    setError("");
    forceRefresh ? setRefreshing(true) : setLoading(true);

    try {
      const response = await base44.functions.invoke("cachedTraffic", {
        region_key: selectedRegion.key,
        region_label: selectedRegion.label,
        force_refresh: forceRefresh,
        limit: 250,
        allow_heavy: true,
        ...selectedRegion.bounds,
      });
      setAircraft(response.data.aircraft || []);
      setMeta(response.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Traffic data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTraffic(false, region);
  }, [region.key]);

  const handleRegionChange = (key) => {
    const next = REGIONS.find((item) => item.key === key) || REGIONS[0];
    setRegion(next);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EF] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-black/[0.07] bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B2D5B]">
                <Radar className="h-6 w-6 text-[#E8A83A]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">Cached OpenSky traffic</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1A1814] md:text-5xl">Persistent live traffic map</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6B6560]">
                The map loads the last saved traffic snapshot instantly. A fresh OpenSky call is only made when a user clicks refresh, then everyone sees the updated snapshot.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select value={region.key} onChange={(e) => handleRegionChange(e.target.value)} className="rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm font-bold text-[#1A1814] outline-none focus:border-[#D4A017]">
                {REGIONS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
              </select>
              <button onClick={() => loadTraffic(true)} disabled={refreshing} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B2D5B] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#143C75] disabled:opacity-60">
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh OpenSky
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Visible aircraft</p>
            <p className="mt-1 text-3xl font-black text-[#1A1814]">{aircraft.length}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Data source</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-black text-[#1A1814]"><Database className="h-4 w-4 text-[#D4A017]" /> {meta?.source || "loading"}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-[#6B6560]">Last refreshed</p>
            <p className="mt-1 text-sm font-bold text-[#1A1814]">{formatDate(meta?.refreshed_at)}</p>
          </div>
        </div>

        {meta?.warning && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">OpenSky refresh failed, so the saved snapshot is shown: {meta.warning}</div>}
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>}

        <div className="h-[68vh] overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-sm">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm font-bold text-[#6B6560]"><Loader2 className="mr-2 h-5 w-5 animate-spin text-[#D4A017]" /> Loading saved traffic snapshot...</div>
          ) : (
            <MapContainer key={region.key} center={region.center} zoom={region.zoom} className="h-full w-full">
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {aircraft.map((item) => item.latitude && item.longitude && (
                <Marker key={`${item.icao24}-${item.last_contact || item.time_position}`} position={[item.latitude, item.longitude]} icon={planeIcon}>
                  <Popup>
                    <div className="min-w-[210px] space-y-1 text-sm">
                      <p className="font-black text-[#1A1814]">{item.callsign || item.faa?.n_number || item.icao24}</p>
                      <p><strong>Origin:</strong> {item.origin_country || "—"}</p>
                      <p><strong>Altitude:</strong> {metersToFeet(item.baro_altitude || item.geo_altitude)}</p>
                      <p><strong>Speed:</strong> {msToKnots(item.velocity)}</p>
                      <p><strong>Registration:</strong> {item.faa?.n_number || "—"}</p>
                      <p><strong>Aircraft:</strong> {item.faa?.type_aircraft || item.listing ? `${item.listing?.make || ""} ${item.listing?.model || ""}` : "—"}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}
import { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import { DEFAULT_FILTER } from "@/components/dashboard/GlobeLayerFilter";
import IntelligenceGlobeHeader from "@/components/traffic/IntelligenceGlobeHeader";
import TrafficTimeline from "@/components/traffic/TrafficTimeline";

const clean = (value) => String(value || "").toUpperCase().replace(/[-\s]/g, "");
const snapshotAircraft = (snapshot) => { try { return JSON.parse(snapshot?.aircraft_json || "[]"); } catch { return []; } };

export default function AircraftIntelligenceGlobe() {
  const [filter, setFilter] = useState(() => ({ ...structuredClone(DEFAULT_FILTER), faaRegistry: { ...DEFAULT_FILTER.faaRegistry, enabled: true }, dealers: { enabled: true } }));
  const [traffic, setTraffic] = useState([]);
  const [registry, setRegistry] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [listings, setListings] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [source, setSource] = useState("Connecting");
  const [updated, setUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("registration") || "");
  const [focusLocation, setFocusLocation] = useState(null);
  const [selectedExternal, setSelectedExternal] = useState(null);
  const [historyActive, setHistoryActive] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const loadTraffic = useCallback(async (force = false) => {
    setRefreshing(true);
    try {
      const result = await base44.functions.invoke("cachedTraffic", { region_key: "world", region_label: "Global", force_refresh: force, allow_heavy: true });
      setTraffic(result.data?.aircraft || []);
      setSource(result.data?.source || "cache");
      setUpdated(result.data?.refreshed_at ? new Date(result.data.refreshed_at) : new Date());
    } catch {
      setSource("Unavailable");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTraffic(false);
    base44.entities.AircraftListing.filter({ status: "active" }, "-created_date", 10000).then((rows) => setListings(rows || [])).catch(() => setListings([]));
    base44.entities.DealerLead.list("-created_date", 10000).then((rows) => setDealers(rows || [])).catch(() => setDealers([]));
    base44.entities.TrafficSnapshot.list("refreshed_at", 250).then((rows) => setSnapshots((rows || []).filter((row) => row.aircraft_json))).catch(() => setSnapshots([]));
  }, [loadTraffic]);

  useEffect(() => {
    if (!filter.faaRegistry?.enabled) { setRegistry([]); return; }
    const query = {};
    const f = filter.faaRegistry;
    if (f.nNumber) query.n_number = clean(f.nNumber).replace(/^N/, "");
    if (f.type) query.type_aircraft = f.type;
    if (f.engine) query.type_engine = f.engine;
    if (f.status) query.status_code = f.status;
    if (f.category) query.category = f.category;
    if (f.yearFrom || f.yearTo) query.year_mfr = { ...(f.yearFrom ? { $gte: Number(f.yearFrom) } : {}), ...(f.yearTo ? { $lte: Number(f.yearTo) } : {}) };
    base44.entities.FAAAircraft.filter(query, "-created_date", f.limit || 10000).then((rows) => setRegistry(rows || []));
  }, [filter.faaRegistry]);

  useEffect(() => {
    if (!playing || !historyActive || snapshots.length < 2) return;
    const timer = setInterval(() => setHistoryIndex((current) => current >= snapshots.length - 1 ? 0 : current + 1), 1500);
    return () => clearInterval(timer);
  }, [playing, historyActive, snapshots.length]);

  const historicalAircraft = historyActive ? snapshotAircraft(snapshots[historyIndex]) : null;
  const visibleTraffic = historicalAircraft || traffic;
  const searchAll = () => {
    const query = clean(search);
    if (!query) return;
    const flight = visibleTraffic.find((item) => [item.registration, item.faa?.n_number, item.icao24, item.callsign].some((value) => clean(value).includes(query)));
    if (flight) { setFocusLocation({ lat: flight.latitude, lon: flight.longitude }); setSelectedExternal({ type: "traffic", data: flight }); return; }
    const record = registry.find((item) => clean(`N${item.n_number}`).includes(query));
    if (record) { setSelectedExternal({ type: "registryrecord", data: record }); return; }
    const listing = listings.find((item) => [item.registration, item.make, item.model].some((value) => clean(value).includes(query)));
    if (listing) { setSelectedExternal({ type: "listing", data: listing }); return; }
    const dealer = dealers.find((item) => clean(item.name).includes(query) || clean(item.cert_num).includes(query));
    if (dealer) setSelectedExternal({ type: "dealer", data: dealer });
  };

  const stats = useMemo(() => [
    { label: historyActive ? "Historical traffic" : "Live traffic", value: visibleTraffic.length.toLocaleString() },
    { label: "FAA registry", value: registry.length.toLocaleString() },
    { label: "Dealers", value: dealers.length.toLocaleString() },
    { label: "Source", value: historyActive ? "Snapshot" : source },
    { label: "Updated", value: historyActive ? (snapshots[historyIndex]?.refreshed_at ? new Date(snapshots[historyIndex].refreshed_at).toLocaleTimeString() : "—") : (updated ? updated.toLocaleTimeString() : "—") },
  ], [historyActive, visibleTraffic.length, registry.length, dealers.length, source, updated, snapshots, historyIndex]);

  return <main className="dark fixed inset-0 overflow-hidden bg-[var(--brand-background)]">
    <SkyBossGlobe forceDark className="h-full w-full" listings={listings} filter={filter} focusLocation={focusLocation} historicalAircraft={historicalAircraft} dealers={dealers} registryAircraft={registry} selectedExternal={selectedExternal} />
    <IntelligenceGlobeHeader stats={stats} filter={filter} onFilterChange={setFilter} search={search} onSearchChange={setSearch} onSearch={searchAll} onClear={() => { setSearch(""); setFocusLocation(null); setSelectedExternal(null); }} refreshing={refreshing} onRefresh={() => loadTraffic(true)} />
    <TrafficTimeline snapshots={snapshots} index={historyIndex} active={historyActive} playing={playing} onToggle={() => { setHistoryActive((value) => !value); setPlaying(false); }} onChange={setHistoryIndex} onPlay={() => setPlaying((value) => !value)} />
  </main>;
}
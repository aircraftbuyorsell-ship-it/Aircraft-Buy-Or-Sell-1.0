import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Radar, RefreshCw, Loader2, Search, X, Info, Filter, ChevronDown } from "lucide-react";
import TrafficGlobe from "@/components/live-traffic/TrafficGlobe";
import AircraftInfoPanel from "@/components/live-traffic/AircraftInfoPanel";

const C = {
  ink: "#04060a",
  ink1: "#0d1117",
  amber: "#f5c242",
  amberDim: "rgba(245,194,66,0.10)",
  amberBdr: "rgba(245,194,66,0.22)",
  teal: "#5dcaa5",
  red: "#e24b4a",
  w1: "rgba(255,255,255,0.90)",
  w2: "rgba(255,255,255,0.50)",
  w3: "rgba(255,255,255,0.35)",
  border: "rgba(255,255,255,0.08)",
  borderMd: "rgba(255,255,255,0.12)",
};

const WORLD = { key: "world", label: "Global", lamin: -60, lamax: 72, lomin: -130, lomax: 50 };

const CATEGORY_FILTERS = [
  { key: "all",       label: "All",        test: () => true },
  { key: "ga",        label: "GA",         test: (a) => a.category >= 1 && a.category <= 3 },
  { key: "turboprop", label: "Turboprop",  test: (a) => a.category === 4 },
  { key: "jet",       label: "Jet",        test: (a) => a.category === 5 || a.category === 6 },
  { key: "heli",      label: "Helicopter", test: (a) => a.category === 8 || a.category === 9 },
  { key: "other",     label: "Other",      test: (a) => a.category === 0 || a.category >= 10 },
];

const LEGEND = [
  { color: "#e24b4a", label: "0–5k ft" },
  { color: "#f5c242", label: "5–15k ft" },
  { color: "#5dcaa5", label: "15–30k ft" },
  { color: "#4e8ef7", label: "30k+ ft" },
];

export default function TrafficMap() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dataTime, setDataTime] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [catFilter, setCatFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [scoringMap, setScoringMap] = useState({});
  const [snapOpen, setSnapOpen] = useState(false);

  const loadSnapshots = useCallback(async () => {
    try {
      const recs = await base44.entities.TrafficSnapshot.list("-refreshed_at", 50);
      setSnapshots(recs || []);
    } catch (_) {}
  }, []);

  const fetchTraffic = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    setError(null);
    setSelected(null);
    try {
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
      setSelected(null);
      setSnapOpen(false);
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
    setSelected(found);
  };

  const clearSearch = () => { setSearch(""); setSearchError(null); };

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
        setSelected(prev => prev && prev.icao24 === ac.icao24 ? {
          ...prev,
          listing: { id: res.data.listingId, ati_score: res.data.atiScore, card_code: res.data.cardCode }
        } : prev);
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

  const stats = [
    { label: "Airborne", value: airborne.length },
    { label: "Total loaded", value: aircraft.length },
    { label: "ABOS matched", value: withListing },
    { label: "Source", value: sourceLabel },
    { label: "Updated", value: dataTime ? dataTime.toLocaleTimeString() : "—" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: C.ink, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ── Stats / control bar ── */}
      <div style={{ background: "rgba(13,17,23,0.85)", borderBottom: `0.5px solid ${C.border}`, flexShrink: 0, zIndex: 30 }}>
        <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          {/* Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: C.amberDim, border: `0.5px solid ${C.amberBdr}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Radar size={17} color={C.amber} />
            </div>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.amber, margin: 0 }}>ADS-B Live · adsb.lol</p>
              <h1 style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.02em", color: C.w1, margin: 0 }}>Global Live Traffic</h1>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginLeft: "4px" }}>
            {stats.map((s) => (
              <div key={s.label}>
                <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.amber, margin: "0 0 1px" }}>{s.label}</p>
                <p style={{ fontSize: "13px", fontWeight: 600, color: C.w1, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Search */}
          <div style={{ display: "flex", gap: "6px" }}>
            <div style={{ position: "relative" }}>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSearchError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="N-number, ICAO, callsign…"
                style={{
                  width: "200px", background: "rgba(255,255,255,0.04)", border: `0.5px solid ${C.border}`,
                  borderRadius: "8px", color: C.w1, fontSize: "12px", fontFamily: "'Courier New', monospace",
                  padding: "8px 28px 8px 12px", outline: "none", transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.target.style.borderColor = C.amberBdr; }}
                onBlur={(e) => { e.target.style.borderColor = C.border; }}
              />
              {search && (
                <button onClick={clearSearch} aria-label="Clear"
                  style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.w3, cursor: "pointer", display: "flex" }}>
                  <X size={13} />
                </button>
              )}
            </div>
            <button onClick={handleSearch} aria-label="Search"
              style={{ background: "rgba(255,255,255,0.04)", border: `0.5px solid ${C.border}`, borderRadius: "8px", color: C.w2, padding: "0 11px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Search size={15} />
            </button>
          </div>

          {/* Snapshot dropdown */}
          {snapshots.length > 0 && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setSnapOpen((o) => !o)}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", border: `0.5px solid ${C.border}`, borderRadius: "8px", color: C.w2, fontSize: "12px", padding: "8px 12px", cursor: "pointer" }}>
                Snapshots <ChevronDown size={13} />
              </button>
              {snapOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", width: "240px", maxHeight: "300px", overflowY: "auto", background: C.ink1, border: `0.5px solid ${C.borderMd}`, borderRadius: "10px", zIndex: 40, boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}>
                  {snapshots.map((s) => (
                    <button key={s.id} onClick={() => loadSnapshot(s)}
                      style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", borderBottom: `0.5px solid ${C.border}`, padding: "9px 14px", cursor: "pointer" }}>
                      <span style={{ fontSize: "12px", color: C.w1, fontWeight: 500 }}>{s.region_label || s.region_key}</span>
                      <span style={{ display: "block", fontSize: "10px", color: C.w3, marginTop: "2px" }}>
                        {s.refreshed_at ? new Date(s.refreshed_at).toLocaleString() : "—"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Refresh */}
          <button onClick={() => fetchTraffic(true)} disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: "7px", background: C.amber, color: C.ink, border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: refreshing ? "default" : "pointer", opacity: refreshing ? 0.6 : 1 }}>
            {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
        </div>

        {/* Category filters */}
        <div style={{ padding: "0 18px 12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <Filter size={13} color={C.w3} />
          {CATEGORY_FILTERS.map((f) => {
            const active = catFilter === f.key;
            return (
              <button key={f.key} onClick={() => setCatFilter(f.key)}
                style={{
                  padding: "5px 12px", borderRadius: "7px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                  background: active ? C.amberDim : "transparent",
                  border: `0.5px solid ${active ? C.amberBdr : C.border}`,
                  color: active ? C.amber : C.w2, transition: "all 0.15s",
                }}>
                {f.label}
              </button>
            );
          })}
        </div>

        {searchError && (
          <div style={{ margin: "0 18px 12px", display: "flex", alignItems: "center", gap: "8px", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", background: C.amberDim, border: `0.5px solid ${C.amberBdr}`, color: C.amber }}>
            <Info size={14} /> {searchError}
          </div>
        )}
        {error && (
          <div style={{ margin: "0 18px 12px", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", background: "rgba(226,75,74,0.10)", border: "0.5px solid rgba(226,75,74,0.22)", color: C.red }}>{error}</div>
        )}
      </div>

      {/* ── Globe ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <TrafficGlobe aircraft={visibleAircraft} onSelect={setSelected} selected={selected} />

        {loading && (
          <div style={{ position: "absolute", inset: 0, zIndex: 25, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", background: "rgba(4,6,10,0.7)", backdropFilter: "blur(4px)" }}>
            <Loader2 size={28} className="animate-spin" color={C.amber} />
            <p style={{ fontSize: "13px", color: C.w2 }}>Loading global traffic…</p>
          </div>
        )}

        {/* Legend */}
        <div style={{ position: "absolute", left: "18px", bottom: "18px", zIndex: 15, background: "rgba(13,17,23,0.85)", border: `0.5px solid ${C.border}`, borderRadius: "10px", padding: "12px 14px" }}>
          <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: C.w3, margin: "0 0 8px" }}>Altitude</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {LEGEND.map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: "11px", color: C.w2 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hint */}
        <div style={{ position: "absolute", right: selected ? "296px" : "18px", bottom: "18px", zIndex: 15, fontSize: "10px", color: C.w3, transition: "right 0.2s" }}>
          Drag to rotate · click an aircraft for details
        </div>

        {/* Info panel */}
        <AircraftInfoPanel
          ac={selected}
          onClose={() => setSelected(null)}
          onScore={handleScoreAircraft}
          scoreState={selected ? scoringMap[selected.icao24] : null}
        />
      </div>
    </div>
  );
}
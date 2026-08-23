import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Radar, RefreshCw, Loader2, Search, X, Info, ChevronDown } from "lucide-react";
import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import GlobeLayerFilter, { DEFAULT_FILTER } from "@/components/dashboard/GlobeLayerFilter";

const C = {
  ink: "#0B1220",
  ink1: "#111827",
  amber: "#D4A017",
  amberDim: "rgba(212,160,23,0.10)",
  amberBdr: "rgba(212,160,23,0.22)",
  red: "#e24b4a",
  w1: "rgba(255,255,255,0.90)",
  w2: "rgba(255,255,255,0.50)",
  w3: "rgba(255,255,255,0.35)",
  border: "rgba(255,255,255,0.08)",
  borderMd: "rgba(255,255,255,0.12)",
};

const WORLD = { key: "world", label: "Global" };

export default function TrafficMap() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dataTime, setDataTime] = useState(null);
  const [dataSource, setDataSource] = useState(null);
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("registration") || "");
  const [searchError, setSearchError] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [snapOpen, setSnapOpen] = useState(false);
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [focusLocation, setFocusLocation] = useState(null);
  const [skylinkEnabled, setSkylinkEnabled] = useState(false);
  const [skylinkAircraft, setSkylinkAircraft] = useState([]);
  const [skylinkStatus, setSkylinkStatus] = useState("idle"); // idle | live | not_configured | error

  const fetchSkylink = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("skylinkTracking", { bbox: "-60,-170,60,170", limit: 500 });
      const d = res.data || res;
      if (d.configured === false) { setSkylinkStatus("not_configured"); setSkylinkAircraft([]); return; }
      setSkylinkAircraft(d.aircraft || []);
      setSkylinkStatus("live");
    } catch (_) { setSkylinkStatus("error"); }
  }, []);

  useEffect(() => {
    if (!skylinkEnabled) { setSkylinkAircraft([]); setSkylinkStatus("idle"); return; }
    fetchSkylink();
    const t = setInterval(fetchSkylink, 30000);
    return () => clearInterval(t);
  }, [skylinkEnabled, fetchSkylink]);

  const loadSnapshots = useCallback(async () => {
    try {
      const recs = await base44.entities.TrafficSnapshot.list("-refreshed_at", 50);
      setSnapshots(recs || []);
    } catch (_) {}
  }, []);

  const fetchTraffic = useCallback(async (force = false) => {
    force ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("cachedTraffic", {
        region_key: WORLD.key,
        region_label: WORLD.label,
        force_refresh: force,
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
  }, []);

  const loadSnapshot = (snap) => {
    try {
      const ac = JSON.parse(snap.aircraft_json || "[]");
      setAircraft(ac);
      setDataTime(snap.refreshed_at ? new Date(snap.refreshed_at) : null);
      setDataSource(`snapshot:${snap.region_label || snap.region_key}`);
      setSnapOpen(false);
    } catch (_) {}
  };

  const handleSearch = () => {
    setSearchError(null);
    const q = search.trim().toUpperCase().replace(/[-\s]/g, "");
    if (!q) return;
    const found = [...aircraft, ...skylinkAircraft].find((ac) => {
      const reg = (ac.faa?.n_number || ac.registration || "").toUpperCase().replace(/[-\s]/g, "");
      const icao = (ac.icao24 || "").toUpperCase();
      const cs = (ac.callsign || "").toUpperCase().trim();
      return reg === q || icao === q || reg.includes(q) || cs === q || cs.includes(q);
    });
    if (!found) { setSearchError(`"${search.trim()}" not found in current snapshot`); return; }
    if (found.latitude != null && found.longitude != null) {
      setFocusLocation({ lat: found.latitude, lon: found.longitude });
    }
  };

  const clearSearch = () => { setSearch(""); setSearchError(null); setFocusLocation(null); };

  const sourceLabel = dataSource === "live" ? "🟢 Live" : dataSource === "cache" ? "🔵 Cache" : dataSource?.startsWith("snapshot:") ? `📁 ${dataSource.replace("snapshot:", "")}` : dataSource || "—";

  const stats = [
    { label: "Total loaded", value: aircraft.length + skylinkAircraft.length },
    { label: "Source", value: sourceLabel },
    { label: "Updated", value: dataTime ? dataTime.toLocaleTimeString() : "—" },
    ...(skylinkEnabled ? [{ label: "SkyLink", value: skylinkStatus === "not_configured" ? "No key" : skylinkStatus === "live" ? `${skylinkAircraft.length} ADS-B` : "…" }] : []),
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: C.ink, overflow: "hidden" }}>
      {/* ── Globe (full height) ── */}
      <SkyBossGlobe className="w-full h-full" filter={filter} focusLocation={focusLocation} extraAircraft={skylinkAircraft} />

      {/* ── Top overlay bar ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 30, background: "rgba(13,17,23,0.85)", backdropFilter: "blur(12px)", borderBottom: `0.5px solid ${C.border}` }}>
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

          {/* Layer filter */}
          <GlobeLayerFilter filter={filter} onChange={setFilter} />

          {/* SkyLink source toggle */}
          <button onClick={() => setSkylinkEnabled((v) => !v)}
            title={skylinkStatus === "not_configured" ? "SkyLink API key not set" : "Toggle SkyLink ADS-B source"}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: skylinkEnabled ? C.amber : "rgba(255,255,255,0.04)",
              color: skylinkEnabled ? C.ink : C.w2,
              border: `0.5px solid ${skylinkEnabled ? C.amber : C.border}`,
              borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              opacity: skylinkStatus === "not_configured" ? 0.55 : 1,
            }}>
            <Radar size={14} />
            SkyLink
            {skylinkEnabled && skylinkAircraft.length > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.8 }}>· {skylinkAircraft.length}</span>
            )}
          </button>

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

        {searchError && (
          <div style={{ margin: "0 18px 12px", display: "flex", alignItems: "center", gap: "8px", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", background: C.amberDim, border: `0.5px solid ${C.amberBdr}`, color: C.amber }}>
            <Info size={14} /> {searchError}
          </div>
        )}
        {error && (
          <div style={{ margin: "0 18px 12px", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", background: "rgba(226,75,74,0.10)", border: "0.5px solid rgba(226,75,74,0.22)", color: C.red }}>{error}</div>
        )}
      </div>

      {/* Hint */}
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: "18px", zIndex: 15, fontSize: "10px", color: C.w3, pointerEvents: "none" }}>
        Drag to rotate · hover for labels · click for details
      </div>

      {loading && (
        <div style={{ position: "absolute", inset: 0, zIndex: 25, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", background: "rgba(4,6,10,0.7)", backdropFilter: "blur(4px)" }}>
          <Loader2 size={28} className="animate-spin" color={C.amber} />
          <p style={{ fontSize: "13px", color: C.w2 }}>Loading global traffic…</p>
        </div>
      )}
    </div>
  );
}
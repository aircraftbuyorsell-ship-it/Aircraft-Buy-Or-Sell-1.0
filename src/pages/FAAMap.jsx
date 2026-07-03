import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Map, SlidersHorizontal, Table, Globe, Search, ChevronDown,
  ExternalLink, Zap, ShieldCheck, X, Filter
} from "lucide-react";
import MiniGlobe from "@/components/MiniGlobe";

const INK   = "#0B1220";
const INK1  = "#111827";
const AMBER = "#D4A017";
const TEAL  = "#5dcaa5";
const W1    = "rgba(255,255,255,0.90)";
const W2    = "rgba(255,255,255,0.60)";
const W3    = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";

const GLASS_CARD = {
  background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}`, borderRadius: "12px",
};

const GLASS_INPUT = {
  background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}`,
  borderRadius: "8px", color: W1, outline: "none", padding: "11px 14px",
  fontSize: "13px", width: "100%", boxSizing: "border-box",
};

const LABEL = { display: "block", fontSize: "9px", color: W3, marginBottom: 4, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" };

const FONT_11PX = "11px -apple-system, sans-serif";
const FONT_7PX = "7px -apple-system, sans-serif";

const AIRCRAFT_TYPES = [
  { value: "", label: "All" },
  { value: "4", label: "Fixed Wing" },
  { value: "7", label: "Rotorcraft" },
  { value: "2", label: "Balloon" },
  { value: "1", label: "Glider" },
  { value: "8", label: "Powered-Lift" },
];

const ENGINE_TYPES = [
  { value: "", label: "All" },
  { value: "1", label: "Reciprocating" },
  { value: "2", label: "Turboprop" },
  { value: "3", label: "Turbo-shaft" },
  { value: "5", label: "Turbo-jet" },
  { value: "6", label: "Turbo-fan" },
  { value: "8", label: "Electric" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "V", label: "Valid" },
  { value: "I", label: "Invalid" },
  { value: "E", label: "Expired" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All" },
  { value: "1", label: "Land" },
  { value: "2", label: "Sea" },
  { value: "3", label: "Amphibian" },
];

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={GLASS_INPUT}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value || o.label} value={o.value} style={{ color: "#000" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const STORAGE_KEY = "faamap_state_v1";

function loadPersistedState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export default function FAAMap() {
  const persisted = useRef(loadPersistedState());
  const [view, setView] = useState(persisted.current?.view || "map");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState(persisted.current?.filters || {
    nNumber: "", type: "", engine: "", status: "V",
    category: "", yearFrom: "", yearTo: "", limit: 500,
  });
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const canvasRef = useRef(null);
  const totalCount = useRef(0);

  // Persist state to sessionStorage so search survives back-navigation
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ view, filters }));
  }, [view, filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const query = {};
      if (filters.nNumber) query.n_number = filters.nNumber.trim().toUpperCase();
      if (filters.status) query.status_code = filters.status;
      if (filters.type) query.type_aircraft = filters.type;
      if (filters.engine) query.type_engine = filters.engine;
      const data = await base44.entities.FAAAircraft.filter(query, "-created_date", filters.limit);
      setAircraft(data || []);
      totalCount.current = (data || []).length;
    } catch (e) {
      setAircraft([]);
    }
    setLoading(false);
  }, [filters]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  // Canvas map rendering
  useEffect(() => {
    if (view !== "map") return;
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = cv.width = cv.offsetWidth * (window.devicePixelRatio || 1);
    const H = cv.height = cv.offsetHeight * (window.devicePixelRatio || 1);
    const usCenterX = 0.22, usCenterY = 0.55;
    const usW = 0.65, usH = 0.5;

    ctx.clearRect(0, 0, W, H);

    // Map background outline
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.beginPath();
    ctx.rect(usCenterX * W, usCenterY * H, usW * W, usH * H);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw aircraft as dots
    const dotR = 1.8;
    for (const ac of aircraft) {
      const state = (ac.state || "").trim().toUpperCase();
      const centroid = US_CENTROIDS[state] || [39.8, -98.5];
      const x = usCenterX + ((centroid[1] + 125) / 59) * usW;
      const y = usCenterY + ((50 - centroid[0]) / 26) * usH;
      const cx = x * W, cy = y * H;

      const color = ac.status_code === "V" ? "#22c55e" : "#ef4444";
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Count overlay
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = FONT_11PX;
    ctx.fillText(`${totalCount.current.toLocaleString()} aircraft`, W - 160, H - 16);

    // States labels
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = FONT_7PX;
    for (const [st, [lat, lon]] of Object.entries(US_CENTROIDS)) {
      const x = usCenterX + ((lon + 125) / 59) * usW;
      const y = usCenterY + ((50 - lat) / 26) * usH;
      ctx.fillText(st, x * W, y * H);
    }
  }, [view, aircraft]);

  const resetFilters = () => {
    setFilters({ nNumber: "", type: "", engine: "", status: "V", category: "", yearFrom: "", yearTo: "", limit: 500 });
  };

  return (
    <div style={{ minHeight: "100vh", background: INK, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.09) 1.5px, transparent 1.5px)", backgroundSize: "40px 40px", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", top: "-200px", left: "50%", transform: "translateX(-50%)", width: "800px", height: "500px", background: "radial-gradient(ellipse, rgba(212,160,23,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      {/* Top bar */}
      <div style={{ background: INK1, borderBottom: `0.5px solid ${BORDER}`, padding: "12px 18px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(212,160,23,0.09)", display: "flex", alignItems: "center", justifyContent: "center", border: `0.5px solid rgba(212,160,23,0.22)` }}>
            <Map size={16} color={AMBER} />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 600, margin: 0, letterSpacing: "-0.03em", color: W1 }}>FAA Aircraft Registry</h1>
            <span style={{ fontSize: 9, color: AMBER, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em" }}>Map View</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {loading && <MiniGlobe size={24} color={AMBER} inline={true} />}

        <span style={{ fontSize: 12, color: W2, fontWeight: 600 }}>
          {totalCount.current.toLocaleString()} records
        </span>

        <div style={{ display: "flex", gap: 4 }}>
          {[
            { v: "map", icon: Map, label: "Map" },
            { v: "list", icon: Table, label: "List" },
          ].map(({ v, icon: Icon, label }) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
                borderRadius: 8, border: view === v ? `0.5px solid rgba(212,160,23,0.22)` : `0.5px solid ${BORDER}`,
                background: view === v ? "rgba(212,160,23,0.09)" : "rgba(255,255,255,0.04)",
                color: view === v ? AMBER : W2,
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
          <button onClick={() => setFiltersOpen(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
              borderRadius: 8, border: filtersOpen ? `0.5px solid rgba(212,160,23,0.22)` : `0.5px solid ${BORDER}`,
              background: filtersOpen ? "rgba(212,160,23,0.09)" : "rgba(255,255,255,0.04)",
              color: filtersOpen ? AMBER : W2,
              fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>
            <Filter size={13} /> Filters
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", gap: 0, height: "calc(100vh - 60px)", position: "relative", zIndex: 1 }}>
        {/* Filter panel */}
        {filtersOpen && (
          <div style={{ width: 260, flexShrink: 0, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: INK1, borderRight: `0.5px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <SlidersHorizontal size={14} color={W3} />
              <span style={{ fontSize: 9, fontWeight: 600, color: W3, textTransform: "uppercase", letterSpacing: "0.12em" }}>Filters</span>
            </div>

            <div>
              <label style={LABEL}>N-Number</label>
              <input value={filters.nNumber} onChange={e => setFilters(f => ({ ...f, nNumber: e.target.value }))}
                placeholder="e.g. N12345" style={{ ...GLASS_INPUT, fontFamily: "'Courier New', monospace" }} />
            </div>

            <div>
              <label style={LABEL}>Aircraft Type</label>
              <Select value={filters.type} onChange={v => setFilters(f => ({ ...f, type: v }))} options={AIRCRAFT_TYPES} />
            </div>

            <div>
              <label style={LABEL}>Engine Type</label>
              <Select value={filters.engine} onChange={v => setFilters(f => ({ ...f, engine: v }))} options={ENGINE_TYPES} />
            </div>

            <div>
              <label style={LABEL}>Registration Status</label>
              <Select value={filters.status} onChange={v => setFilters(f => ({ ...f, status: v }))} options={STATUS_OPTIONS} />
            </div>

            <div>
              <label style={LABEL}>Category</label>
              <Select value={filters.category} onChange={v => setFilters(f => ({ ...f, category: v }))} options={CATEGORY_OPTIONS} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL}>Year From</label>
                <input type="number" value={filters.yearFrom} onChange={e => setFilters(f => ({ ...f, yearFrom: e.target.value }))}
                  placeholder="1960" style={GLASS_INPUT} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LABEL}>Year To</label>
                <input type="number" value={filters.yearTo} onChange={e => setFilters(f => ({ ...f, yearTo: e.target.value }))}
                  placeholder="2026" style={GLASS_INPUT} />
              </div>
            </div>

            <div>
              <label style={LABEL}>Max Results: {filters.limit}</label>
              <input type="range" min="50" max="5000" step="50" value={filters.limit}
                onChange={e => setFilters(f => ({ ...f, limit: parseInt(e.target.value) }))}
                style={{ width: "100%", accentColor: AMBER }} />
            </div>

            <button onClick={fetchData}
              style={{
                background: AMBER, border: "none",
                borderRadius: 8, color: INK, cursor: "pointer", fontWeight: 600,
                padding: "10px 20px", fontSize: 13, letterSpacing: "-0.01em", marginTop: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#fdd05a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = AMBER; }}>
              Apply Filters
            </button>

            <button onClick={resetFilters}
              style={{
                background: "transparent", border: `0.5px solid ${BORDER}`,
                borderRadius: 8, color: W2, cursor: "pointer",
                padding: "10px 20px", fontSize: 13, fontWeight: 600,
              }}>
              Reset
            </button>
          </div>
        )}

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, padding: 12, minWidth: 0 }}>
          {/* Map / List view */}
          <div style={{ ...GLASS_CARD, flex: 1, overflow: "hidden", position: "relative", background: view === "map" ? INK : "rgba(255,255,255,0.04)" }}>
            {view === "map" ? (
              <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", background: INK }} />
            ) : (
              <div style={{ overflow: "auto", height: "100%", padding: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `0.5px solid ${BORDER}`, background: "rgba(255,255,255,0.03)" }}>
                      {["N-Number", "Make", "Model", "Year", "Type", "Engine", "Status"].map(h => (
                        <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: W3, fontWeight: 600, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aircraft.map((ac, i) => (
                      <tr key={ac.id || i} onClick={() => setSelected(ac)}
                        style={{
                          borderBottom: `0.5px solid ${BORDER}`,
                          borderLeft: `3px solid ${ac.status_code === "V" ? TEAL : "#e24b4a"}`,
                          cursor: "pointer",
                          background: selected?.id === ac.id ? "rgba(212,160,23,0.06)" : "transparent",
                        }}
                        onMouseEnter={e => { if (selected?.id !== ac.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { if (selected?.id !== ac.id) e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "10px 14px", fontFamily: "'Courier New', monospace", fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", color: AMBER }}>N{ac.n_number}</td>
                        <td style={{ padding: "10px 14px", color: W1 }}>{ac.mfr_mdl_code || "—"}</td>
                        <td style={{ padding: "10px 14px", color: W2 }}>—</td>
                        <td style={{ padding: "10px 14px", color: W2 }}>{ac.year_mfr || "—"}</td>
                        <td style={{ padding: "10px 14px", color: W2 }}>{ac.type_aircraft || "—"}</td>
                        <td style={{ padding: "10px 14px", color: W2 }}>{ac.type_engine || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{
                            display: "inline-block", padding: "2px 10px", borderRadius: 9999,
                            background: ac.status_code === "V" ? "rgba(93,202,165,0.09)" : "rgba(226,75,74,0.10)",
                            border: `0.5px solid ${ac.status_code === "V" ? "rgba(93,202,165,0.20)" : "rgba(226,75,74,0.22)"}`,
                            color: ac.status_code === "V" ? TEAL : "#e24b4a",
                            fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                          }}>
                            {ac.status_code === "V" ? "Valid" : ac.status_code || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Count overlay for map */}
            {view === "map" && (
              <div style={{
                position: "absolute", bottom: 12, right: 12, padding: "6px 14px",
                borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `0.5px solid ${BORDER}`,
                fontSize: 11, fontWeight: 600, color: W2,
              }}>
                {totalCount.current.toLocaleString()} aircraft
              </div>
            )}
          </div>

          {/* Selected aircraft strip */}
          {selected && (
            <div style={{ background: "rgba(212,160,23,0.06)", border: `0.5px solid rgba(212,160,23,0.22)`, borderRadius: 12, boxShadow: "0 0 0 0.5px rgba(212,160,23,0.10)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: 9, color: AMBER, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em" }}>Selected</span>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em", color: W1 }}>
                  N{selected.n_number} — {selected.mfr_mdl_code || "Aircraft"} ({selected.year_mfr || "—"})
                </p>
                <p style={{ margin: 0, fontSize: 11, color: W3 }}>
                  {selected.city || ""}{selected.city && selected.state ? ", " : ""}{selected.state || ""}
                </p>
              </div>
              <div style={{ flex: 1 }} />
              <Link to={`/ati-quick-score?nreg=N${selected.n_number}`}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                  borderRadius: 8, background: AMBER, color: INK,
                  fontWeight: 600, fontSize: 12, textDecoration: "none", letterSpacing: "-0.01em",
                }}>
                <Zap size={13} /> ATI Score
              </Link>
              <Link to={`/ati-verify?nreg=N${selected.n_number}`}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                  borderRadius: 8, background: "rgba(93,202,165,0.09)", border: `0.5px solid rgba(93,202,165,0.20)`,
                  color: TEAL, fontWeight: 600, fontSize: 12, textDecoration: "none", letterSpacing: "-0.01em",
                }}>
                <ShieldCheck size={13} /> Verify
              </Link>
              <button onClick={() => setSelected(null)}
                style={{
                  background: "transparent", border: "none", color: W3, cursor: "pointer", padding: 4,
                }}>
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const US_CENTROIDS = {
  AL: [32.7, -86.7], AK: [61.4, -150.0], AZ: [34.3, -111.7], AR: [34.8, -92.4],
  CA: [36.4, -119.7], CO: [39.0, -105.5], CT: [41.6, -72.8], DE: [39.1, -75.5],
  FL: [28.5, -81.5], GA: [32.7, -83.4], HI: [21.1, -157.5], ID: [44.3, -114.7],
  IL: [40.0, -89.5], IN: [39.9, -86.3], IA: [42.0, -93.5], KS: [38.5, -97.5],
  KY: [37.5, -85.3], LA: [31.0, -92.0], ME: [45.2, -69.2], MD: [39.0, -76.8],
  MA: [42.3, -71.8], MI: [43.4, -84.6], MN: [46.0, -94.5], MS: [32.6, -89.9],
  MO: [38.3, -92.4], MT: [47.0, -109.6], NE: [41.5, -99.7], NV: [39.0, -116.5],
  NH: [43.7, -71.6], NJ: [40.2, -74.5], NM: [34.5, -106.0], NY: [43.0, -75.5],
  NC: [35.5, -79.5], ND: [47.5, -100.5], OH: [40.3, -82.8], OK: [35.5, -97.5],
  OR: [43.9, -120.5], PA: [40.9, -77.8], RI: [41.6, -71.5], SC: [33.9, -80.9],
  SD: [44.5, -100.5], TN: [35.8, -86.5], TX: [31.5, -99.5], UT: [39.5, -112.0],
  VT: [44.0, -72.6], VA: [37.5, -79.0], WA: [47.5, -120.5], WV: [38.8, -80.5],
  WI: [44.5, -89.5], WY: [42.8, -107.5], DC: [38.9, -77.0],
};
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Map, Loader2, SlidersHorizontal, Table, Globe, Search, ChevronDown,
  ExternalLink, Zap, ShieldCheck, X, Filter
} from "lucide-react";

const GLASS_CARD = {
  background: "rgba(255,255,255,0.07)", backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)", border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: "16px",
};

const GLASS_INPUT = {
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "8px", color: "#fff", outline: "none", padding: "10px 14px",
  fontSize: "13px", width: "100%", boxSizing: "border-box",
};

const PAGE_BG = "linear-gradient(135deg, #0a1628, #1B2A4A, #0d1f3c)";

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

export default function FAAMap() {
  const [view, setView] = useState("map");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [filters, setFilters] = useState({
    nNumber: "", type: "", engine: "", status: "V",
    category: "", yearFrom: "", yearTo: "", limit: 500,
  });
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const canvasRef = useRef(null);
  const totalCount = useRef(0);

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
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText(`${totalCount.current.toLocaleString()} aircraft`, W - 160, H - 16);

    // States labels
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "7px -apple-system, sans-serif";
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
    <div style={{ minHeight: "100vh", background: PAGE_BG, color: "#fff" }}>
      {/* Top bar */}
      <div style={{ ...GLASS_CARD, margin: "12px", padding: "12px 20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(0,194,203,0.15)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,194,203,0.3)" }}>
            <Map size={16} color="#00c2cb" />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>FAA Aircraft Registry</h1>
            <span style={{ fontSize: 10, color: "#00c2cb", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Map View</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {loading && <Loader2 size={16} className="animate-spin" color="rgba(255,255,255,0.4)" />}

        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
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
                borderRadius: 8, border: view === v ? "1px solid rgba(0,194,203,0.3)" : "1px solid rgba(255,255,255,0.08)",
                background: view === v ? "rgba(0,194,203,0.12)" : "rgba(255,255,255,0.04)",
                color: view === v ? "#00c2cb" : "rgba(255,255,255,0.5)",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>
              <Icon size={13} /> {label}
            </button>
          ))}
          <button onClick={() => setFiltersOpen(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
              borderRadius: 8, border: filtersOpen ? "1px solid rgba(212,160,23,0.3)" : "1px solid rgba(255,255,255,0.08)",
              background: filtersOpen ? "rgba(212,160,23,0.12)" : "rgba(255,255,255,0.04)",
              color: filtersOpen ? "#D4A017" : "rgba(255,255,255,0.5)",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}>
            <Filter size={13} /> Filters
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", padding: "0 12px 12px", gap: 12, height: "calc(100vh - 100px)" }}>
        {/* Filter panel */}
        {filtersOpen && (
          <div style={{ ...GLASS_CARD, width: 260, flexShrink: 0, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <SlidersHorizontal size={14} color="rgba(255,255,255,0.4)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Filters</span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontWeight: 600 }}>N-Number</label>
              <input value={filters.nNumber} onChange={e => setFilters(f => ({ ...f, nNumber: e.target.value }))}
                placeholder="e.g. N12345" style={GLASS_INPUT} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontWeight: 600 }}>Aircraft Type</label>
              <Select value={filters.type} onChange={v => setFilters(f => ({ ...f, type: v }))} options={AIRCRAFT_TYPES} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontWeight: 600 }}>Engine Type</label>
              <Select value={filters.engine} onChange={v => setFilters(f => ({ ...f, engine: v }))} options={ENGINE_TYPES} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontWeight: 600 }}>Registration Status</label>
              <Select value={filters.status} onChange={v => setFilters(f => ({ ...f, status: v }))} options={STATUS_OPTIONS} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontWeight: 600 }}>Category</label>
              <Select value={filters.category} onChange={v => setFilters(f => ({ ...f, category: v }))} options={CATEGORY_OPTIONS} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontWeight: 600 }}>Year From</label>
                <input type="number" value={filters.yearFrom} onChange={e => setFilters(f => ({ ...f, yearFrom: e.target.value }))}
                  placeholder="1960" style={GLASS_INPUT} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontWeight: 600 }}>Year To</label>
                <input type="number" value={filters.yearTo} onChange={e => setFilters(f => ({ ...f, yearTo: e.target.value }))}
                  placeholder="2026" style={GLASS_INPUT} />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, fontWeight: 600 }}>
                Max Results: {filters.limit}
              </label>
              <input type="range" min="50" max="5000" step="50" value={filters.limit}
                onChange={e => setFilters(f => ({ ...f, limit: parseInt(e.target.value) }))}
                style={{ width: "100%", accentColor: "#D4A017" }} />
            </div>

            <button onClick={fetchData}
              style={{
                background: "linear-gradient(135deg, #D4A017, #A67C00)", border: "none",
                borderRadius: 10, color: "#fff", cursor: "pointer", fontWeight: 700,
                padding: "10px 20px", fontSize: 12, letterSpacing: "0.04em",
                textTransform: "uppercase", marginTop: 4,
              }}>
              Apply Filters
            </button>

            <button onClick={resetFilters}
              style={{
                background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10, color: "rgba(255,255,255,0.5)", cursor: "pointer",
                padding: "8px 16px", fontSize: 11, fontWeight: 600,
              }}>
              Reset
            </button>
          </div>
        )}

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Map / List view */}
          <div style={{ ...GLASS_CARD, flex: 1, overflow: "hidden", position: "relative" }}>
            {view === "map" ? (
              <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
            ) : (
              <div style={{ overflow: "auto", height: "100%", padding: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {["N-Number", "Make", "Model", "Year", "Type", "Engine", "Status"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "rgba(255,255,255,0.4)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aircraft.map((ac, i) => (
                      <tr key={ac.id || i} onClick={() => setSelected(ac)}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          cursor: "pointer",
                          background: selected?.id === ac.id ? "rgba(0,194,203,0.08)" : "transparent",
                        }}
                        onMouseEnter={e => { if (selected?.id !== ac.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={e => { if (selected?.id !== ac.id) e.currentTarget.style.background = "transparent"; }}
                      >
                        <td style={{ padding: "8px 14px", fontFamily: "monospace", fontWeight: 700, color: "#00c2cb" }}>N{ac.n_number}</td>
                        <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.8)" }}>{ac.mfr_mdl_code || "—"}</td>
                        <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.6)" }}>—</td>
                        <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.6)" }}>{ac.year_mfr || "—"}</td>
                        <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.6)" }}>{ac.type_aircraft || "—"}</td>
                        <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.6)" }}>{ac.type_engine || "—"}</td>
                        <td style={{ padding: "8px 14px" }}>
                          <span style={{
                            display: "inline-block", padding: "2px 8px", borderRadius: 5,
                            background: ac.status_code === "V" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                            color: ac.status_code === "V" ? "#22c55e" : "#ef4444",
                            fontSize: 10, fontWeight: 700, textTransform: "uppercase",
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
                borderRadius: 8, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)",
                fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)",
              }}>
                {totalCount.current.toLocaleString()} aircraft
              </div>
            )}
          </div>

          {/* Selected aircraft strip */}
          {selected && (
            <div style={{ ...GLASS_CARD, border: "1px solid rgba(212,160,23,0.3)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: 10, color: "#D4A017", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Selected</span>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 800 }}>
                  N{selected.n_number} — {selected.mfr_mdl_code || "Aircraft"} ({selected.year_mfr || "—"})
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {selected.city || ""}{selected.city && selected.state ? ", " : ""}{selected.state || ""}
                </p>
              </div>
              <div style={{ flex: 1 }} />
              <Link to={`/ati-quick-score?nreg=N${selected.n_number}`}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                  borderRadius: 10, background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)",
                  color: "#D4A017", fontWeight: 700, fontSize: 11, textDecoration: "none",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                <Zap size={13} /> ATI Score
              </Link>
              <Link to={`/ati-verify?nreg=N${selected.n_number}`}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                  borderRadius: 10, background: "rgba(0,194,203,0.12)", border: "1px solid rgba(0,194,203,0.3)",
                  color: "#00c2cb", fontWeight: 700, fontSize: 11, textDecoration: "none",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                <ShieldCheck size={13} /> Verify
              </Link>
              <button onClick={() => setSelected(null)}
                style={{
                  background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4,
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
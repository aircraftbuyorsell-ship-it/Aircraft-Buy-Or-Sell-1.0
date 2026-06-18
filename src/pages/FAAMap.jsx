import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Map, List, Filter, Search, X, Loader2, ChevronDown, Zap, ShieldCheck
} from "lucide-react";

const PAGE_BG = "linear-gradient(135deg, #0a1628, #1B2A4A, #0d1f3c)";
const GLASS = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: "16px",
};
const INPUT_STYLE = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: "8px",
  color: "#fff",
  outline: "none",
  padding: "10px 14px",
  fontSize: "13px",
  width: "100%",
  boxSizing: "border-box",
};

const AIRCRAFT_TYPES = [
  { value: "", label: "All" },
  { value: "4", label: "Fixed Wing" },
  { value: "5", label: "Rotorcraft" },
  { value: "1", label: "Balloon" },
  { value: "2", label: "Glider" },
  { value: "7", label: "Powered-Lift" },
];
const ENGINE_TYPES = [
  { value: "", label: "All" },
  { value: "1", label: "Reciprocating" },
  { value: "2", label: "Turboprop" },
  { value: "3", label: "Turbo-shaft" },
  { value: "4", label: "Turbo-jet" },
  { value: "5", label: "Turbo-fan" },
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

export default function FAAMap() {
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [viewMode, setViewMode] = useState("map");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selected, setSelected] = useState(null);
  const canvasRef = useRef(null);

  const [filters, setFilters] = useState({
    nNumber: "",
    typeAircraft: "",
    typeEngine: "",
    statusCode: "V",
    category: "",
    yearFrom: "",
    yearTo: "",
    limit: 500,
  });

  const fetchAircraft = useCallback(async () => {
    setLoading(true);
    try {
      const query = {};
      if (filters.statusCode) query.status_code = filters.statusCode;
      if (filters.typeAircraft) query.type_aircraft = filters.typeAircraft;
      if (filters.typeEngine) query.type_engine = filters.typeEngine;
      if (filters.nNumber) query.n_number = filters.nNumber.toUpperCase().trim();

      let data = await base44.entities.FAAAircraft.filter(query, "-created_date", filters.limit);

      // Client-side filtering
      if (filters.yearFrom || filters.yearTo) {
        data = data.filter((a) => {
          const y = a.year_mfr;
          if (filters.yearFrom && y < Number(filters.yearFrom)) return false;
          if (filters.yearTo && y > Number(filters.yearTo)) return false;
          return true;
        });
      }
      if (filters.category) {
        data = data.filter((a) => a.type_aircraft === filters.category ||
          (filters.category === "1" && a.type_aircraft === "4") ||
          (filters.category === "2" && a.type_aircraft === "5"));
      }

      setAircraft(data);
      setCount(data.length);
    } catch {} finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchAircraft(); }, [fetchAircraft]);

  // ── Map canvas ──
  useEffect(() => {
    if (viewMode !== "map" || !canvasRef.current) return;
    const cv = canvasRef.current;
    const W = cv.parentElement.clientWidth;
    const H = cv.parentElement.clientHeight;
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");

    // Background
    ctx.fillStyle = "#0a1628";
    ctx.fillRect(0, 0, W, H);

    // Simple US outline dots
    const pts = [];
    for (let i = 0; i < aircraft.length; i++) {
      const a = aircraft[i];
      const st = (a.state || "").toUpperCase();
      const idx = st.charCodeAt(0) * 31 + (st.charCodeAt(1) || 0);
      const x = ((idx * 7919) % W);
      const y = ((idx * 6271) % H);
      pts.push({ x, y, status: a.status_code });
    }

    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = p.status === "V" ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)";
      ctx.fill();
    }
  }, [viewMode, aircraft]);

  function toggleFilters() { setFiltersOpen((v) => !v); }
  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div style={{ height: "100vh", overflow: "hidden", display: "flex", flexDirection: "column", background: PAGE_BG, color: "#fff" }}>
      {/* ── Top Bar ── */}
      <div style={{ ...GLASS, margin: "12px 12px 0", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(0,194,203,0.15)", border: "1px solid rgba(0,194,203,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Map size={18} color="#00c2cb" />
          </div>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>FAA Aircraft Registry</h1>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "#00c2cb", background: "rgba(0,194,203,0.1)", border: "1px solid rgba(0,194,203,0.25)", borderRadius: "4px", padding: "1px 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Map View</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {loading && <Loader2 size={18} color="rgba(255,255,255,0.5)" className="animate-spin" />}
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{count.toLocaleString()} records</span>
          <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.14)" }}>
            <button onClick={() => setViewMode("map")} style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "map" ? "rgba(0,194,203,0.18)" : "transparent", color: viewMode === "map" ? "#00c2cb" : "rgba(255,255,255,0.5)", borderRight: "1px solid rgba(255,255,255,0.14)" }}>
              <Map size={14} style={{ display: "inline", marginRight: "4px" }} /> Map
            </button>
            <button onClick={() => setViewMode("list")} style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer", background: viewMode === "list" ? "rgba(0,194,203,0.18)" : "transparent", color: viewMode === "list" ? "#00c2cb" : "rgba(255,255,255,0.5)" }}>
              <List size={14} style={{ display: "inline", marginRight: "4px" }} /> List
            </button>
          </div>
          <button onClick={toggleFilters} style={{ ...GLASS, padding: "6px 14px", fontSize: "12px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer", color: filtersOpen ? "#00c2cb" : "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: "6px", borderRadius: "8px" }}>
            <Filter size={14} /> Filters
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, padding: "12px", gap: "12px", overflow: "hidden" }}>
        {/* Filter Panel */}
        {filtersOpen && (
          <div style={{ ...GLASS, width: "260px", padding: "16px", flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", marginBottom: "4px", display: "block" }}>N-Number</label>
              <input
                value={filters.nNumber}
                onChange={(e) => updateFilter("nNumber", e.target.value)}
                placeholder="e.g. N12345"
                style={INPUT_STYLE}
              />
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", marginBottom: "4px", display: "block" }}>Aircraft Type</label>
              <select
                value={filters.typeAircraft}
                onChange={(e) => updateFilter("typeAircraft", e.target.value)}
                style={{ ...INPUT_STYLE, appearance: "none", cursor: "pointer" }}>
                {AIRCRAFT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", marginBottom: "4px", display: "block" }}>Engine Type</label>
              <select
                value={filters.typeEngine}
                onChange={(e) => updateFilter("typeEngine", e.target.value)}
                style={{ ...INPUT_STYLE, appearance: "none", cursor: "pointer" }}>
                {ENGINE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", marginBottom: "4px", display: "block" }}>Registration Status</label>
              <select
                value={filters.statusCode}
                onChange={(e) => updateFilter("statusCode", e.target.value)}
                style={{ ...INPUT_STYLE, appearance: "none", cursor: "pointer" }}>
                {STATUS_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", marginBottom: "4px", display: "block" }}>Category</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilter("category", e.target.value)}
                style={{ ...INPUT_STYLE, appearance: "none", cursor: "pointer" }}>
                {CATEGORY_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", marginBottom: "4px", display: "block" }}>Year From</label>
                <input
                  type="number"
                  value={filters.yearFrom}
                  onChange={(e) => updateFilter("yearFrom", e.target.value)}
                  placeholder="1960"
                  style={INPUT_STYLE}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", marginBottom: "4px", display: "block" }}>Year To</label>
                <input
                  type="number"
                  value={filters.yearTo}
                  onChange={(e) => updateFilter("yearTo", e.target.value)}
                  placeholder="2026"
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)", marginBottom: "4px", display: "block" }}>Max Results: {filters.limit}</label>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={filters.limit}
                onChange={(e) => updateFilter("limit", Number(e.target.value))}
                style={{ width: "100%", accentColor: "#D4A017" }}
              />
            </div>

            <button
              onClick={fetchAircraft}
              style={{
                background: "linear-gradient(135deg, #D4A017, #A67C00)",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                padding: "10px 0",
                fontSize: "13px",
                letterSpacing: "0.04em",
                width: "100%",
              }}>
              Apply Filters
            </button>
          </div>
        )}

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}>
          <div style={{ ...GLASS, flex: 1, position: "relative", overflow: "hidden" }}>
            {viewMode === "map" ? (
              <>
                <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
                <div style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(0,0,0,0.5)", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
                  {count.toLocaleString()} aircraft
                </div>
              </>
            ) : (
              <div style={{ overflow: "auto", maxHeight: "100%" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", position: "sticky", top: 0, background: "rgba(10,22,40,0.95)", backdropFilter: "blur(8px)" }}>
                      {["N-Number", "Make", "Model", "Year", "Type", "Engine", "Status"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255,255,255,0.4)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aircraft.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => setSelected(a)}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          background: selected?.id === a.id ? "rgba(0,194,203,0.08)" : "transparent",
                        }}
                        onMouseEnter={(e) => { if (selected?.id !== a.id) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={(e) => { if (selected?.id !== a.id) e.currentTarget.style.background = "transparent"; }}>
                        <td style={{ padding: "8px 14px", fontWeight: 700, fontFamily: "monospace", color: "#00c2cb" }}>{a.n_number}</td>
                        <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.7)" }}>{a.mfr_mdl_code || "—"}</td>
                        <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.7)" }}>{a.eng_mfr_mdl || "—"}</td>
                        <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.6)" }}>{a.year_mfr || "—"}</td>
                        <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.6)" }}>{a.type_aircraft || "—"}</td>
                        <td style={{ padding: "8px 14px", color: "rgba(255,255,255,0.6)" }}>{a.type_engine || "—"}</td>
                        <td style={{ padding: "8px 14px" }}>
                          <span style={{
                            display: "inline-block",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "10px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: a.status_code === "V" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                            color: a.status_code === "V" ? "#22c55e" : "#ef4444",
                            border: `1px solid ${a.status_code === "V" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                          }}>
                            {a.status_code === "V" ? "Valid" : a.status_code || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Selected Aircraft Strip */}
          {selected && (
            <div style={{ ...GLASS, border: "1px solid rgba(212,160,23,0.3)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
                  <X size={16} />
                </button>
                <div>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "15px", color: "#D4A017", marginRight: "10px" }}>N{selected.n_number}</span>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                    {selected.year_mfr || "—"} · {selected.mfr_mdl_code || "Unknown"} · {selected.eng_mfr_mdl || "—"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  to={`/ati-quick-score?nreg=N${selected.n_number}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)",
                    borderRadius: "8px", color: "#D4A017", padding: "6px 14px",
                    fontSize: "11px", fontWeight: 700, textDecoration: "none",
                    letterSpacing: "0.04em", textTransform: "uppercase"
                  }}>
                  <Zap size={13} /> ATI Score
                </Link>
                <Link
                  to={`/ati-verify?nreg=N${selected.n_number}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                    borderRadius: "8px", color: "#22c55e", padding: "6px 14px",
                    fontSize: "11px", fontWeight: 700, textDecoration: "none",
                    letterSpacing: "0.04em", textTransform: "uppercase"
                  }}>
                  <ShieldCheck size={13} /> Verify
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
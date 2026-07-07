import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Map, SlidersHorizontal, Table, Zap, ShieldCheck, X, Filter
} from "lucide-react";
import MiniGlobe from "@/components/MiniGlobe";

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

const INPUT_CLS = "w-full rounded-lg px-3 py-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-gold-official/40";
const LABEL_CLS = "block text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1";

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={INPUT_CLS}>
      {options.map(o => (
        <option key={o.value || o.label} value={o.value}>{o.label}</option>
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

  // Canvas map rendering (fixed dark instrument panel — same in both modes)
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

  const viewBtnCls = (active) =>
    `flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
      active
        ? "border-gold-official/40 bg-gold-bg text-gold-official"
        : "border-border bg-card text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen dot-grid bg-canvas text-foreground">
      {/* Official header band */}
      <div className="border-b border-border glass-navbar relative z-10">
        <div className="px-4 md:px-5 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center border border-gold-official/30 bg-gold-bg shrink-0">
              <Map className="w-5 h-5 text-gold-official" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] font-bold text-gold-official uppercase">FAA Registry™</p>
              <h1 className="text-base font-bold tracking-tight leading-tight">Aircraft Registry Map</h1>
            </div>
          </div>

          <div className="flex-1" />

          {loading && <MiniGlobe size={24} color="#D4A017" inline={true} />}

          <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
            {totalCount.current.toLocaleString()} records
          </span>

          <div className="flex gap-1.5">
            {[
              { v: "map", icon: Map, label: "Map" },
              { v: "list", icon: Table, label: "List" },
            ].map(({ v, icon: Icon, label }) => (
              <button key={v} onClick={() => setView(v)} className={viewBtnCls(view === v)}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
            <button onClick={() => setFiltersOpen(v => !v)} className={viewBtnCls(filtersOpen)}>
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex h-[calc(100vh-64px)] relative z-10">
        {/* Filter panel — record module */}
        {filtersOpen && (
          <div className="w-[260px] shrink-0 p-4 overflow-y-auto flex flex-col gap-3 bg-card border-r border-border">
            <div className="flex items-center gap-1.5 mb-0.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Filters</span>
            </div>

            <div>
              <label className={LABEL_CLS}>N-Number</label>
              <input value={filters.nNumber} onChange={e => setFilters(f => ({ ...f, nNumber: e.target.value }))}
                placeholder="e.g. N12345" className={`${INPUT_CLS} font-mono`} />
            </div>

            <div>
              <label className={LABEL_CLS}>Aircraft Type</label>
              <Select value={filters.type} onChange={v => setFilters(f => ({ ...f, type: v }))} options={AIRCRAFT_TYPES} />
            </div>

            <div>
              <label className={LABEL_CLS}>Engine Type</label>
              <Select value={filters.engine} onChange={v => setFilters(f => ({ ...f, engine: v }))} options={ENGINE_TYPES} />
            </div>

            <div>
              <label className={LABEL_CLS}>Registration Status</label>
              <Select value={filters.status} onChange={v => setFilters(f => ({ ...f, status: v }))} options={STATUS_OPTIONS} />
            </div>

            <div>
              <label className={LABEL_CLS}>Category</label>
              <Select value={filters.category} onChange={v => setFilters(f => ({ ...f, category: v }))} options={CATEGORY_OPTIONS} />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className={LABEL_CLS}>Year From</label>
                <input type="number" value={filters.yearFrom} onChange={e => setFilters(f => ({ ...f, yearFrom: e.target.value }))}
                  placeholder="1960" className={INPUT_CLS} />
              </div>
              <div className="flex-1">
                <label className={LABEL_CLS}>Year To</label>
                <input type="number" value={filters.yearTo} onChange={e => setFilters(f => ({ ...f, yearTo: e.target.value }))}
                  placeholder="2026" className={INPUT_CLS} />
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>Max Results: {filters.limit}</label>
              <input type="range" min="50" max="5000" step="50" value={filters.limit}
                onChange={e => setFilters(f => ({ ...f, limit: parseInt(e.target.value) }))}
                className="w-full accent-[#D4A017]" />
            </div>

            <button onClick={fetchData}
              className="mt-1 py-2.5 rounded-lg text-[13px] font-bold bg-gold-official text-white hover:opacity-90 transition-opacity cursor-pointer">
              Apply Filters
            </button>

            <button onClick={resetFilters}
              className="py-2.5 rounded-lg text-[13px] font-semibold border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Reset
            </button>
          </div>
        )}

        {/* Main area */}
        <div className="flex-1 flex flex-col gap-3 p-3 min-w-0">
          {/* Map / List view — record module */}
          <div className={`flex-1 overflow-hidden relative rounded-xl border border-border ${view === "map" ? "bg-[#0B1220]" : "bg-card"}`}>
            {view === "map" ? (
              <canvas ref={canvasRef} className="w-full h-full block" style={{ background: "#0B1220" }} />
            ) : (
              <div className="overflow-auto h-full">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/60">
                      {["N-Number", "Make", "Model", "Year", "Type", "Engine", "Status"].map(h => (
                        <th key={h} className="px-3.5 py-2.5 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aircraft.map((ac, i) => (
                      <tr key={ac.id || i} onClick={() => setSelected(ac)}
                        className={`border-b border-border cursor-pointer transition-colors ${
                          selected?.id === ac.id ? "bg-gold-bg" : "hover:bg-muted/60"
                        }`}
                        style={{ borderLeft: `3px solid ${ac.status_code === "V" ? "#22c55e" : "#ef4444"}` }}
                      >
                        <td className="px-3.5 py-2.5 font-mono font-semibold tracking-wider text-gold-official">N{ac.n_number}</td>
                        <td className="px-3.5 py-2.5 text-foreground">{ac.mfr_mdl_code || "—"}</td>
                        <td className="px-3.5 py-2.5 text-muted-foreground">—</td>
                        <td className="px-3.5 py-2.5 text-muted-foreground tabular-nums">{ac.year_mfr || "—"}</td>
                        <td className="px-3.5 py-2.5 text-muted-foreground">{ac.type_aircraft || "—"}</td>
                        <td className="px-3.5 py-2.5 text-muted-foreground">{ac.type_engine || "—"}</td>
                        <td className="px-3.5 py-2.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${
                            ac.status_code === "V"
                              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                              : "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/25"
                          }`}>
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
              <div className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold border border-white/10 bg-white/5 text-white/60">
                {totalCount.current.toLocaleString()} aircraft
              </div>
            )}
          </div>

          {/* Selected aircraft strip — official record module */}
          {selected && (
            <div className="rounded-xl border border-gold-official/30 bg-gold-bg px-5 py-3.5 flex items-center gap-4 flex-wrap">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-gold-official">Selected Record</span>
                <p className="text-sm font-bold tracking-tight mt-0.5">
                  N{selected.n_number} — {selected.mfr_mdl_code || "Aircraft"} ({selected.year_mfr || "—"})
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {selected.city || ""}{selected.city && selected.state ? ", " : ""}{selected.state || ""}
                </p>
              </div>
              <div className="flex-1" />
              <Link to={`/ati-quick-score?nreg=N${selected.n_number}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold bg-gold-official text-white hover:opacity-90 transition-opacity">
                <Zap className="w-3.5 h-3.5" /> ATI Score
              </Link>
              <Link to={`/ati-verify?nreg=N${selected.n_number}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity">
                <ShieldCheck className="w-3.5 h-3.5" /> Verify
              </Link>
              <button onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer">
                <X className="w-4 h-4" />
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
import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const BLUE = "#4e8ef7";
const CARD = "rgba(255,255,255,0.04)";

const AIRCRAFT_CATEGORIES = [
  "", "SEP (Single Engine Piston)", "MEP (Multi Engine Piston)",
  "Turboprop", "Light Jet", "Midsize Jet", "Super-Midsize Jet",
  "Heavy Jet", "Ultra-Long Range Jet", "Helicopter", "Amphibious",
];

const ALL_REGIONS = [
  "USA", "Canada", "South America", "UK", "EU - Western Europe",
  "EU - Eastern Europe", "Middle East", "Africa", "India",
  "China", "Russia & CIS", "Asia-Pacific", "Australia & Oceania",
];

const FOCUS_AREAS = [
  "Pricing trends", "Transaction volume", "Regulatory compliance",
  "Currency impact", "Fuel cost impact", "Fleet renewal",
  "OEM supply constraints", "Used aircraft demand", "Charter market",
];

export default function PersonalizationPanel({ filters, onChange }) {
  const [open, setOpen] = useState(false);

  const toggleRegion = (r) => {
    const cur = filters.regions || [];
    onChange({ ...filters, regions: cur.includes(r) ? cur.filter(x => x !== r) : [...cur, r] });
  };

  const toggleFocus = (f) => {
    const cur = filters.focus_areas || [];
    onChange({ ...filters, focus_areas: cur.includes(f) ? cur.filter(x => x !== f) : [...cur, f] });
  };

  const activeCount = [
    filters.aircraft_category ? 1 : 0,
    filters.regions?.length || 0,
    filters.price_range_min || filters.price_range_max ? 1 : 0,
    filters.focus_areas?.length || 0,
  ].reduce((a, b) => a + b, 0);

  const inputStyle = { background: CARD, border: `0.5px solid ${BORDER}`, color: W1 };

  return (
    <div className="rounded-2xl overflow-hidden mb-6" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" style={{ color: BLUE }} />
          <span className="font-black text-sm" style={{ color: W1 }}>Personalize Report</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: "rgba(78,142,247,0.09)", color: BLUE }}>{activeCount} active</span>
          )}
          <span className="text-[11px]" style={{ color: W2 }}>Personalized reports bypass the shared cache — always fresh</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: W3 }} /> : <ChevronDown className="w-4 h-4" style={{ color: W3 }} />}
      </button>

      {open && (
        <div className="p-5 space-y-5" style={{ borderTop: `0.5px solid ${BORDER}` }}>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: W3 }}>Aircraft Category</label>
            <select
              value={filters.aircraft_category || ""}
              onChange={e => onChange({ ...filters, aircraft_category: e.target.value || undefined })}
              className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none"
              style={inputStyle}
            >
              {AIRCRAFT_CATEGORIES.map(c => <option key={c} value={c}>{c || "All categories"}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: W3 }}>Price Range (USD)</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" value={filters.price_range_min || ""} onChange={e => onChange({ ...filters, price_range_min: e.target.value ? Number(e.target.value) : undefined })} className="flex-1 h-10 px-3 rounded-xl text-sm focus:outline-none" style={inputStyle} />
              <span className="text-sm" style={{ color: W3 }}>–</span>
              <input type="number" placeholder="Max" value={filters.price_range_max || ""} onChange={e => onChange({ ...filters, price_range_max: e.target.value ? Number(e.target.value) : undefined })} className="flex-1 h-10 px-3 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: W3 }}>
              Regions {filters.regions?.length ? `(${filters.regions.length} selected)` : "(all)"}
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_REGIONS.map(r => {
                const active = filters.regions?.includes(r);
                return (
                  <button key={r} onClick={() => toggleRegion(r)} className="h-8 px-3 rounded-lg text-xs font-bold transition-colors" style={active ? { background: BLUE, color: "#04060a" } : { background: CARD, border: `0.5px solid ${BORDER}`, color: W2 }}>
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: W3 }}>Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map(f => {
                const active = filters.focus_areas?.includes(f);
                return (
                  <button key={f} onClick={() => toggleFocus(f)} className="h-8 px-3 rounded-lg text-xs font-bold transition-colors" style={active ? { background: AMBER, color: "#04060a" } : { background: CARD, border: `0.5px solid ${BORDER}`, color: W2 }}>
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {activeCount > 0 && (
            <button onClick={() => onChange({})} className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#e24b4a" }}>
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
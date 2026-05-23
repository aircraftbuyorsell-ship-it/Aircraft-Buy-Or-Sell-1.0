import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";

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

  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F7F4EF] transition-colors"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#0B2D5B]" />
          <span className="font-black text-sm text-[#1A1814]">Personalize Report</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#0B2D5B] text-white text-[10px] font-black">{activeCount} active</span>
          )}
          <span className="text-[11px] text-[#6B6560]">Personalized reports bypass the shared cache — always fresh</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#6B6560]" /> : <ChevronDown className="w-4 h-4 text-[#6B6560]" />}
      </button>

      {open && (
        <div className="border-t border-black/8 p-5 space-y-5">

          {/* Aircraft Category */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#6B6560] mb-2">Aircraft Category</label>
            <select
              value={filters.aircraft_category || ""}
              onChange={e => onChange({ ...filters, aircraft_category: e.target.value || undefined })}
              className="w-full h-10 px-3 rounded-xl border border-black/10 bg-[#F7F4EF] text-sm text-[#1A1814] focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40"
            >
              {AIRCRAFT_CATEGORIES.map(c => <option key={c} value={c}>{c || "All categories"}</option>)}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#6B6560] mb-2">Price Range (USD)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.price_range_min || ""}
                onChange={e => onChange({ ...filters, price_range_min: e.target.value ? Number(e.target.value) : undefined })}
                className="flex-1 h-10 px-3 rounded-xl border border-black/10 bg-[#F7F4EF] text-sm text-[#1A1814] focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40"
              />
              <span className="text-[#AAA49C] text-sm">–</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.price_range_max || ""}
                onChange={e => onChange({ ...filters, price_range_max: e.target.value ? Number(e.target.value) : undefined })}
                className="flex-1 h-10 px-3 rounded-xl border border-black/10 bg-[#F7F4EF] text-sm text-[#1A1814] focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40"
              />
            </div>
          </div>

          {/* Regions */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#6B6560] mb-2">
              Regions {filters.regions?.length ? `(${filters.regions.length} selected)` : "(all)"}
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_REGIONS.map(r => {
                const active = filters.regions?.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleRegion(r)}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors ${
                      active ? "bg-[#0B2D5B] text-white" : "bg-[#F7F4EF] text-[#6B6560] hover:bg-[#E8A83A]/20 border border-black/8"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-[#6B6560] mb-2">Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map(f => {
                const active = filters.focus_areas?.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => toggleFocus(f)}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-colors ${
                      active ? "bg-[#E8A83A] text-white" : "bg-[#F7F4EF] text-[#6B6560] hover:bg-[#E8A83A]/20 border border-black/8"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear */}
          {activeCount > 0 && (
            <button
              onClick={() => onChange({})}
              className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-bold"
            >
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
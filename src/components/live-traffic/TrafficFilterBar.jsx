import { useState } from "react";
import { Search, Filter, X, Weight } from "lucide-react";

// MTOW weight categories (ICAO/FAA)
export const MTOW_CATEGORIES = [
  { key: "all",         label: "All",         desc: "No filter",               color: "#6B6560" },
  { key: "uul",         label: "UUL",         desc: "< 600 kg (ultralight)",   color: "#185FA5" },
  { key: "light",       label: "Light",       desc: "< 5,700 kg",              color: "#0F7A56" },
  { key: "medium",      label: "Medium",      desc: "5,700 – 136,000 kg",      color: "#D4A017" },
  { key: "heavy",       label: "Heavy",       desc: "> 136,000 kg",            color: "#C0392B" },
  { key: "superheavy",  label: "Super Heavy", desc: "> 500,000 kg (A380+)",    color: "#7B1FA2" },
];

// Map OpenSky ADS-B category codes → MTOW bucket
// https://opensky-network.org/apidoc/rest#response
// cat 0 = unknown, 1 = no info, 2 = no category
// cat 3 = ultralight (UUL), 4 = glider (treat as light)
// cat 5 = medium-large (typically medium), 6 = heavy, 7 = high performance (treat as medium)
// cat 8-11 = rotor/tilt/skydiver/ultralight balloon (light-ish)
// cat 12-14 = UAV (light), cat 15 = Space, cat 16-17 = emergency
export function mapCategoryToMTOW(category) {
  if (!category || category <= 2) return "unknown";
  if (category === 3) return "uul";
  if (category === 4) return "light";         // glider
  if (category === 5) return "medium";        // medium-large (737 etc.)
  if (category === 6) return "heavy";         // heavy (777, 747 etc.)
  if (category === 7) return "superheavy";    // high perf / A380
  if (category >= 8 && category <= 14) return "light"; // rotor/UAV/skydiver
  return "unknown";
}

export default function TrafficFilterBar({
  nSearch, setNSearch,
  airportSearch, setAirportSearch,
  mtowCategory, setMtowCategory,
  onSearch,
  isPending,
  activeCount,
}) {
  const [showMTOW, setShowMTOW] = useState(false);

  const selectedCat = MTOW_CATEGORIES.find(c => c.key === mtowCategory) || MTOW_CATEGORIES[0];
  const hasFilters = nSearch || airportSearch || mtowCategory !== "all";

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-4 space-y-3">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#0B2D5B]">
          <Filter className="inline w-3 h-3 mr-1.5 mb-0.5" />
          Traffic Filters
        </p>
        {activeCount != null && (
          <span className="text-[10px] text-[#6B6560] font-semibold">
            {activeCount} aircraft shown
          </span>
        )}
      </div>

      {/* Primary filter row */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* N-number / ICAO24 search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#AAA49C]" />
          <input
            value={nSearch}
            onChange={e => setNSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSearch?.()}
            placeholder="N-number or ICAO24 hex (e.g. N123AB, 3c675a)"
            className="w-full pl-9 pr-8 py-2 bg-[#F7F4EF] border border-black/[0.07] rounded-lg text-[12px] font-mono focus:outline-none focus:border-[#0B2D5B] transition-colors placeholder:font-sans placeholder:text-[#AAA49C]"
          />
          {nSearch && (
            <button onClick={() => setNSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#AAA49C] hover:text-[#6B6560]">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Airport ICAO code */}
        <div className="relative w-full sm:w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#AAA49C]" />
          <input
            value={airportSearch}
            onChange={e => setAirportSearch(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && onSearch?.()}
            placeholder="Airport ICAO (KOSH, KLAL)"
            className="w-full pl-9 pr-8 py-2 bg-[#F7F4EF] border border-black/[0.07] rounded-lg text-[12px] font-mono uppercase focus:outline-none focus:border-[#0B2D5B] transition-colors placeholder:font-sans placeholder:normal-case placeholder:text-[#AAA49C]"
          />
          {airportSearch && (
            <button onClick={() => setAirportSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#AAA49C] hover:text-[#6B6560]">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* MTOW category selector */}
      <div>
        <p className="text-[9px] uppercase tracking-wider font-semibold text-[#AAA49C] mb-2 flex items-center gap-1">
          <Weight className="w-3 h-3" /> Weight Category (MTOW)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MTOW_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setMtowCategory(cat.key)}
              title={cat.desc}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all"
              style={
                mtowCategory === cat.key
                  ? { background: cat.color, color: "white", borderColor: cat.color }
                  : { background: "transparent", color: cat.color, borderColor: `${cat.color}50` }
              }
            >
              {cat.label}
              <span
                className="text-[8px] font-normal opacity-70 hidden sm:inline"
              >
                {cat.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={() => { setNSearch(""); setAirportSearch(""); setMtowCategory("all"); }}
          className="text-[10px] text-[#C0392B] font-semibold hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
import { MapPin } from "lucide-react";

// Regional cost modifiers (index 1.0 = baseline Europe/US average)
export const LOCATION_RATES = {
  "north-america": {
    label: "North America",
    fuel: 1.0,
    maintenance: 1.0,
    hangar: 1.0,
    insurance: 1.0,
  },
  "western-europe": {
    label: "Western Europe",
    fuel: 1.15,
    maintenance: 1.08,
    hangar: 1.2,
    insurance: 1.1,
  },
  "eastern-europe": {
    label: "Eastern Europe",
    fuel: 0.95,
    maintenance: 0.85,
    hangar: 0.8,
    insurance: 0.9,
  },
  "middle-east": {
    label: "Middle East",
    fuel: 0.85,
    maintenance: 1.2,
    hangar: 1.3,
    insurance: 1.25,
  },
  "asia-pacific": {
    label: "Asia-Pacific",
    fuel: 1.1,
    maintenance: 1.15,
    hangar: 1.4,
    insurance: 1.2,
  },
  "africa": {
    label: "Africa",
    fuel: 1.2,
    maintenance: 1.3,
    hangar: 1.1,
    insurance: 1.4,
  },
};

export default function LocationAdjustments({ location, onChange, fuelRate, maintRate, hangarYr, insuranceYr }) {
  const rates = LOCATION_RATES[location] || LOCATION_RATES["north-america"];

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-black/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-[#0B2D5B] flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[13px] font-black text-[#1A1814] uppercase tracking-tight">Operating Region</p>
          <p className="text-[10px] text-[#6B6560]">Cost multipliers apply to base rates</p>
        </div>
      </div>

      <div>
        <label className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-2">
          Primary base location
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(LOCATION_RATES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`text-[11px] font-bold px-3 py-2 rounded-lg border transition-all ${
                location === key
                  ? "border-[#0B2D5B] bg-[rgba(11,45,91,0.06)] text-[#0B2D5B]"
                  : "border-black/10 bg-white text-[#6B6560] hover:border-black/20"
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cost multipliers display */}
      <div className="bg-[#F7F4EF] border border-black/[0.06] rounded-xl p-4 grid grid-cols-2 gap-3">
        {[
          { label: "Fuel", multiplier: rates.fuel, adjusted: (fuelRate * rates.fuel).toFixed(0) },
          { label: "Maintenance", multiplier: rates.maintenance, adjusted: (maintRate * rates.maintenance).toFixed(0) },
          { label: "Hangar", multiplier: rates.hangar, adjusted: (hangarYr * rates.hangar).toFixed(0) },
          { label: "Insurance", multiplier: rates.insurance, adjusted: (insuranceYr * rates.insurance).toFixed(0) },
        ].map(item => (
          <div key={item.label}>
            <p className="text-[10px] uppercase tracking-wider text-[#6B6560] font-semibold">{item.label}</p>
            <p className="text-sm font-black text-[#1A1814] leading-tight">
              {item.multiplier.toFixed(2)}×
            </p>
            <p className="text-[10px] text-[#AAA49C]">${item.adjusted}/{'unit'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
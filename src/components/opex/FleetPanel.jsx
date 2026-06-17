import { useState } from "react";
import { Plane, Plus, Trash2, TrendingUp, Calculator, Fuel, Wrench, Gauge, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { AIRCRAFT_PRESETS, RESERVE_RATES } from "@/lib/opexEngine";
import { LOCATION_RATES } from "@/components/opex/LocationAdjustments";

function FleetAircraftCard({ aircraft, index, onUpdateHours, onRemove, locationMult }) {
  const p = aircraft.preset;
  const hours = aircraft.annualHours;
  const reserves = p.custom
    ? { engine: p.reserveEngine || 25, prop: p.reserveProp || 5, inspection: p.reserveInspection || 12 }
    : (RESERVE_RATES[p.id] || RESERVE_RATES.cirrus_sr22);

  const fuelRate = p.fuel * locationMult.fuel;
  const maintRate = p.maintenance * locationMult.maintenance;
  const hangarYr = p.hangar_yr * locationMult.hangar;
  const insuranceYr = p.insurance_yr * locationMult.insurance;

  const variable = hours * (fuelRate + maintRate);
  const fixed = insuranceYr + hangarYr;
  const reservesYr = (reserves.engine + reserves.prop + reserves.inspection) * hours;
  const total = variable + fixed + reservesYr;
  const perHour = hours > 0 ? total / hours : 0;

  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-3.5 flex items-center justify-between gap-3 group hover:border-black/[0.12] transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#1A1814] truncate">{p.name}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-[#0B2D5B]/08 text-[#0B2D5B]">{p.class || "preset"}</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <input
            type="range"
            min={50}
            max={1500}
            step={10}
            value={hours}
            onChange={(e) => onUpdateHours(index, +e.target.value)}
            className="w-20 accent-[#0B2D5B]"
          />
          <span className="text-[11px] font-bold text-[#0B2D5B]">{hours} hr/yr</span>
          <span className="text-[10px] text-[#AAA49C]">→ ${Math.round(total).toLocaleString()}/yr</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <p className="text-xs font-black text-[#1A1814]">${Math.round(total).toLocaleString()}</p>
          <p className="text-[9px] text-[#AAA49C]">${Math.round(perHour).toLocaleString()}/hr</p>
        </div>
        <button
          onClick={() => onRemove(index)}
          className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function FleetPanel({ presets, customAircraft, location }) {
  const [fleet, setFleet] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const locationMult = LOCATION_RATES[location] || LOCATION_RATES["north-america"];

  const allAircraft = [...presets, ...customAircraft];

  const addToFleet = (p) => {
    setFleet((prev) => [...prev, { preset: p, annualHours: 200 }]);
    setShowPicker(false);
  };

  const removeFromFleet = (index) => {
    setFleet((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFleetHours = (index, hours) => {
    setFleet((prev) => prev.map((a, i) => (i === index ? { ...a, annualHours: hours } : a)));
  };

  // Fleet totals
  let fleetTotal = 0;
  let fleetHours = 0;
  let fleetVariable = 0;
  let fleetFixed = 0;
  let fleetReserves = 0;

  fleet.forEach((a) => {
    const p = a.preset;
    const hours = a.annualHours;
    const reserves = p.custom
      ? { engine: p.reserveEngine || 25, prop: p.reserveProp || 5, inspection: p.reserveInspection || 12 }
      : (RESERVE_RATES[p.id] || RESERVE_RATES.cirrus_sr22);

    const fuelRate = p.fuel * locationMult.fuel;
    const maintRate = p.maintenance * locationMult.maintenance;
    const hangarYr = p.hangar_yr * locationMult.hangar;
    const insuranceYr = p.insurance_yr * locationMult.insurance;

    const variable = hours * (fuelRate + maintRate);
    const fixed = insuranceYr + hangarYr;
    const reservesYr = (reserves.engine + reserves.prop + reserves.inspection) * hours;
    const total = variable + fixed + reservesYr;

    fleetTotal += total;
    fleetHours += hours;
    fleetVariable += variable;
    fleetFixed += fixed;
    fleetReserves += reservesYr;
  });

  const fleetPerHour = fleetHours > 0 ? fleetTotal / fleetHours : 0;
  const fleetMonthly = fleetTotal / 12;

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-black/[0.01] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B2D5B] to-[#185FA5] flex items-center justify-center">
            <Layers className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-[#1A1814] uppercase tracking-tight">Fleet Cost Analysis</p>
            <p className="text-[10px] text-[#6B6560]">
              {fleet.length === 0
                ? "Add multiple aircraft to compare fleet-level operational costs"
                : `${fleet.length} aircraft · ${fleetHours.toLocaleString()} total hrs/yr · $${Math.round(fleetTotal).toLocaleString()}/yr`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {fleet.length > 0 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#0F7A56]/10 text-[#0F7A56]">
              {fleet.length} active
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-[#6B6560]" /> : <ChevronDown className="w-4 h-4 text-[#6B6560]" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          {/* Fleet summary */}
          {fleet.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-4">
              <div className="rounded-xl bg-[#F7F4EF] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-[#0B2D5B]" />
                  <span className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Total / Year</span>
                </div>
                <p className="text-base font-black text-[#1A1814]">${Math.round(fleetTotal).toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-[#F7F4EF] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Calculator className="w-3 h-3 text-[#185FA5]" />
                  <span className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Monthly</span>
                </div>
                <p className="text-base font-black text-[#1A1814]">${Math.round(fleetMonthly).toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-[#F7F4EF] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Gauge className="w-3 h-3 text-[#0F7A56]" />
                  <span className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Avg $/hr</span>
                </div>
                <p className="text-base font-black text-[#1A1814]">${Math.round(fleetPerHour).toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-[#F7F4EF] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Plane className="w-3 h-3 text-[#A67C00]" />
                  <span className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Total Hours</span>
                </div>
                <p className="text-base font-black text-[#1A1814]">{fleetHours.toLocaleString()} hr</p>
              </div>
            </div>
          )}

          {/* Fleet cost breakdown */}
          {fleet.length > 0 && (
            <div className="rounded-xl bg-[#F7F4EF] border border-black/[0.05] p-3.5">
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#A67C00] mb-2">Cost Breakdown</p>
              <div className="flex items-center h-2 rounded-full overflow-hidden bg-white border border-black/[0.06]">
                <div className="h-full bg-[#0B2D5B]" style={{ width: `${fleetTotal > 0 ? (fleetVariable / fleetTotal) * 100 : 0}%` }} title="Variable (fuel + maint)" />
                <div className="h-full bg-[#185FA5]" style={{ width: `${fleetTotal > 0 ? (fleetFixed / fleetTotal) * 100 : 0}%` }} title="Fixed (insurance + hangar)" />
                <div className="h-full bg-[#A67C00]" style={{ width: `${fleetTotal > 0 ? (fleetReserves / fleetTotal) * 100 : 0}%` }} title="Reserves" />
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px]">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#0B2D5B]" /> Variable ${Math.round(fleetVariable).toLocaleString()}</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#185FA5]" /> Fixed ${Math.round(fleetFixed).toLocaleString()}</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#A67C00]" /> Reserves ${Math.round(fleetReserves).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Aircraft list */}
          {fleet.length > 0 && (
            <div className="space-y-1.5">
              {fleet.map((a, i) => (
                <FleetAircraftCard
                  key={i}
                  aircraft={a}
                  index={i}
                  onUpdateHours={updateFleetHours}
                  onRemove={removeFromFleet}
                  locationMult={locationMult}
                />
              ))}
            </div>
          )}

          {/* Add aircraft button */}
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#0B2D5B]/25 text-[11px] font-bold text-[#0B2D5B] hover:bg-[#0B2D5B]/04 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Aircraft to Fleet
            </button>

            {showPicker && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-black/[0.08] rounded-xl shadow-xl max-h-48 overflow-y-auto z-10">
                <div className="p-1.5">
                  <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#AAA49C] px-2 py-1">Presets</p>
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToFleet(p)}
                      className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold text-[#1A1814] hover:bg-[#F7F4EF] transition-colors flex items-center gap-2"
                    >
                      <Plane className="w-3 h-3 text-[#0B2D5B]" /> {p.name}
                    </button>
                  ))}
                  {customAircraft.length > 0 && (
                    <>
                      <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#AAA49C] px-2 py-1 mt-1">Custom</p>
                      {customAircraft.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => addToFleet(p)}
                          className="w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold text-[#065f46] hover:bg-[#F7F4EF] transition-colors flex items-center gap-2"
                        >
                          <Plane className="w-3 h-3 text-[#10b981]" /> {p.name}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {fleet.length === 0 && (
            <p className="text-center text-[10px] text-[#AAA49C] py-2">
              Add aircraft from presets or custom list to start fleet analysis.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
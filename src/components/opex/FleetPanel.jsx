import { useState, useMemo } from "react";
import { Plane, Plus, Trash2, Layers, Minus } from "lucide-react";
import { RESERVE_RATES } from "@/lib/opexEngine";
import { LOCATION_RATES } from "@/components/opex/LocationAdjustments";

function calcAircraftCost(p, hours, locationMult) {
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

  return { variable, fixed, reservesYr, total, perHour: hours > 0 ? total / hours : 0 };
}

function FleetAircraftCard({ aircraft, index, onUpdate, onRemove, locationMult }) {
  const p = aircraft.preset;
  const qty = aircraft.quantity || 1;
  const hours = aircraft.annualHours;

  const single = calcAircraftCost(p, hours, locationMult);
  const totalCost = single.total * qty;
  const fleetHours = hours * qty;

  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-3.5 group hover:border-black/[0.12] transition-all space-y-2.5">
      {/* Top row: name + qty + remove */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-bold text-[#1A1814] truncate">{p.name}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-[#0B2D5B]/08 text-[#0B2D5B] shrink-0">{p.class || "preset"}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Quantity */}
          <div className="flex items-center gap-0.5 bg-[#F7F4EF] rounded-lg border border-black/[0.06] px-1">
            <button
              onClick={() => onUpdate(index, { quantity: Math.max(1, qty - 1) })}
              className="w-5 h-5 flex items-center justify-center text-[#6B6560] hover:text-[#1A1814]"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-bold text-[#1A1814] w-5 text-center">{qty}</span>
            <button
              onClick={() => onUpdate(index, { quantity: Math.min(99, qty + 1) })}
              className="w-5 h-5 flex items-center justify-center text-[#6B6560] hover:text-[#1A1814]"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => onRemove(index)}
            className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Hours slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Flight hours per aircraft</span>
          <span className="text-[10px] font-bold text-[#0B2D5B]">{hours} hr/yr</span>
        </div>
        <input
          type="range"
          min={50}
          max={1500}
          step={10}
          value={hours}
          onChange={(e) => onUpdate(index, { annualHours: +e.target.value })}
          className="w-full accent-[#0B2D5B]"
        />
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-4 text-[10px] pt-1.5 border-t border-black/[0.04]">
        <div>
          <span className="text-[#AAA49C]">Per aircraft: </span>
          <span className="font-bold text-[#1A1814]">${Math.round(single.total).toLocaleString()}/yr</span>
        </div>
        <div>
          <span className="text-[#AAA49C]">×{qty}: </span>
          <span className="font-bold text-[#0B2D5B]">{fleetHours.toLocaleString()} hr · ${Math.round(totalCost).toLocaleString()}/yr</span>
        </div>
        <div>
          <span className="text-[#AAA49C]">$/hr: </span>
          <span className="font-bold text-[#0F7A56]">${Math.round(single.perHour).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function FleetPanel({ presets, customAircraft, location }) {
  const [fleet, setFleet] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  const locationMult = LOCATION_RATES[location] || LOCATION_RATES["north-america"];
  const allAircraft = [...presets, ...customAircraft];

  const addToFleet = (p) => {
    setFleet((prev) => [...prev, { preset: p, annualHours: 200, quantity: 1 }]);
    setShowPicker(false);
  };

  const removeFromFleet = (index) => {
    setFleet((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFleet = (index, updates) => {
    setFleet((prev) => prev.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  };

  // Fleet totals
  const fleetMetrics = useMemo(() => {
    let totalCost = 0, totalHours = 0, totalVariable = 0, totalFixed = 0, totalReserves = 0, aircraftCount = 0;

    fleet.forEach((a) => {
      const qty = a.quantity || 1;
      const single = calcAircraftCost(a.preset, a.annualHours, locationMult);
      totalCost += single.total * qty;
      totalHours += a.annualHours * qty;
      totalVariable += single.variable * qty;
      totalFixed += single.fixed * qty;
      totalReserves += single.reservesYr * qty;
      aircraftCount += qty;
    });

    return {
      totalCost, totalHours, totalVariable, totalFixed, totalReserves, aircraftCount,
      perHour: totalHours > 0 ? totalCost / totalHours : 0,
      monthly: totalCost / 12,
      weekly: totalCost / 52,
    };
  }, [fleet, locationMult]);

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: fleet.length > 0 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B2D5B] to-[#185FA5] flex items-center justify-center">
            <Layers className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-[#1A1814] uppercase tracking-tight">Fleet Cost Analysis</p>
            <p className="text-[10px] text-[#6B6560]">
              {fleet.length === 0
                ? "Add aircraft with quantities to model full fleet operational costs"
                : `${fleetMetrics.aircraftCount} aircraft · ${fleetMetrics.totalHours.toLocaleString()} total hrs/yr`}
            </p>
          </div>
        </div>
        {fleet.length > 0 && (
          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#0F7A56]/10 text-[#0F7A56]">
            {fleetMetrics.aircraftCount} active
          </span>
        )}
      </div>

      {/* Fleet summary cards — always visible when fleet exists */}
      {fleet.length > 0 && (
        <div className="px-5 pt-4 space-y-4">
          {/* Top-line total */}
          <div className="bg-gradient-to-r from-[#0B2D5B] to-[#185FA5] rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/70">Total Fleet Monthly Cost</p>
                <p className="text-3xl font-black tracking-tight mt-0.5">${Math.round(fleetMetrics.monthly).toLocaleString()}<span className="text-lg font-normal text-white/60">/mo</span></p>
                <p className="text-[11px] text-white/60 mt-1">
                  ${Math.round(fleetMetrics.totalCost).toLocaleString()}/yr · ${Math.round(fleetMetrics.weekly).toLocaleString()}/wk
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-wider text-white/50">Fleet Size</p>
                  <p className="text-xl font-black">{fleetMetrics.aircraftCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-wider text-white/50">Total Hours</p>
                  <p className="text-xl font-black">{fleetMetrics.totalHours.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-wider text-white/50">Avg $/hr</p>
                  <p className="text-xl font-black">${Math.round(fleetMetrics.perHour).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="rounded-xl bg-[#F7F4EF] border border-black/[0.05] p-3.5">
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#A67C00] mb-2">Fleet Cost Breakdown</p>
            <div className="flex items-center h-2.5 rounded-full overflow-hidden bg-white border border-black/[0.06]">
              <div className="h-full bg-[#0B2D5B]" style={{ width: `${fleetMetrics.totalCost > 0 ? (fleetMetrics.totalVariable / fleetMetrics.totalCost) * 100 : 0}%` }} title="Variable (fuel + maint)" />
              <div className="h-full bg-[#185FA5]" style={{ width: `${fleetMetrics.totalCost > 0 ? (fleetMetrics.totalFixed / fleetMetrics.totalCost) * 100 : 0}%` }} title="Fixed (insurance + hangar)" />
              <div className="h-full bg-[#A67C00]" style={{ width: `${fleetMetrics.totalCost > 0 ? (fleetMetrics.totalReserves / fleetMetrics.totalCost) * 100 : 0}%` }} title="Reserves" />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2.5">
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0B2D5B] shrink-0" />
                <span className="text-[#6B6560]">Variable</span>
                <span className="font-bold text-[#1A1814] ml-auto">${Math.round(fleetMetrics.totalVariable).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#185FA5] shrink-0" />
                <span className="text-[#6B6560]">Fixed</span>
                <span className="font-bold text-[#1A1814] ml-auto">${Math.round(fleetMetrics.totalFixed).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#A67C00] shrink-0" />
                <span className="text-[#6B6560]">Reserves</span>
                <span className="font-bold text-[#1A1814] ml-auto">${Math.round(fleetMetrics.totalReserves).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Aircraft list */}
          <div className="space-y-2">
            {fleet.map((a, i) => (
              <FleetAircraftCard
                key={i}
                aircraft={a}
                index={i}
                onUpdate={updateFleet}
                onRemove={removeFromFleet}
                locationMult={locationMult}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add aircraft */}
      <div className="px-5 pb-5 pt-3 relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-[#0B2D5B]/25 text-[11px] font-bold text-[#0B2D5B] hover:bg-[#0B2D5B]/04 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Aircraft to Fleet
        </button>

        {showPicker && (
          <div className="absolute bottom-full left-5 right-5 mb-2 bg-white border border-black/[0.08] rounded-xl shadow-xl max-h-48 overflow-y-auto z-10">
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
        <p className="text-center text-[10px] text-[#AAA49C] pb-4">
          Add aircraft from presets or custom list to model full fleet operational costs. Set quantity per type and flight hours for each.
        </p>
      )}
    </div>
  );
}
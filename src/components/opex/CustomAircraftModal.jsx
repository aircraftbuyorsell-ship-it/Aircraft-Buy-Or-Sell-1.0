import { useState } from "react";
import { Plane, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AIRCRAFT_CLASSES = [
  { value: "piston_single", label: "Piston Single" },
  { value: "piston_twin", label: "Piston Twin" },
  { value: "turboprop", label: "Turboprop" },
  { value: "light_jet", label: "Light Jet" },
  { value: "midsize_jet", label: "Midsize Jet" },
  { value: "heavy_jet", label: "Heavy Jet" },
  { value: "helicopter", label: "Helicopter" },
  { value: "experimental", label: "Experimental / Kit" },
];

const CLASS_DEFAULTS = {
  piston_single:   { fuel: 60, maintenance: 50, insurance: 2500, hangar: 4200, tbo: 2000, tboProp: 2400, gph: 10, engineReserve: 25, propReserve: 5, inspectionReserve: 12 },
  piston_twin:     { fuel: 150, maintenance: 120, insurance: 8000, hangar: 6600, tbo: 1700, tboProp: 2000, gph: 28, engineReserve: 55, propReserve: 10, inspectionReserve: 22 },
  turboprop:       { fuel: 550, maintenance: 400, insurance: 24000, hangar: 15000, tbo: 3600, tboProp: 4000, gph: 85, engineReserve: 180, propReserve: 25, inspectionReserve: 55 },
  light_jet:       { fuel: 800, maintenance: 650, insurance: 35000, hangar: 28000, tbo: 5000, tboProp: 5000, gph: 140, engineReserve: 350, propReserve: 0, inspectionReserve: 120 },
  midsize_jet:     { fuel: 1200, maintenance: 950, insurance: 55000, hangar: 42000, tbo: 5000, tboProp: 5000, gph: 200, engineReserve: 550, propReserve: 0, inspectionReserve: 180 },
  heavy_jet:       { fuel: 2200, maintenance: 1800, insurance: 120000, hangar: 80000, tbo: 6000, tboProp: 6000, gph: 380, engineReserve: 950, propReserve: 0, inspectionReserve: 320 },
  helicopter:      { fuel: 350, maintenance: 500, insurance: 18000, hangar: 12000, tbo: 2200, tboProp: 2200, gph: 45, engineReserve: 250, propReserve: 0, inspectionReserve: 80 },
  experimental:    { fuel: 50, maintenance: 80, insurance: 3500, hangar: 3600, tbo: 1500, tboProp: 1500, gph: 8, engineReserve: 30, propReserve: 8, inspectionReserve: 15 },
};

export default function CustomAircraftModal({ open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [aircraftClass, setAircraftClass] = useState("piston_single");
  const [fuelRate, setFuelRate] = useState(CLASS_DEFAULTS.piston_single.fuel);
  const [maintRate, setMaintRate] = useState(CLASS_DEFAULTS.piston_single.maintenance);
  const [insuranceYr, setInsuranceYr] = useState(CLASS_DEFAULTS.piston_single.insurance);
  const [hangarYr, setHangarYr] = useState(CLASS_DEFAULTS.piston_single.hangar);
  const [tbo, setTbo] = useState(CLASS_DEFAULTS.piston_single.tbo);
  const [tboProp, setTboProp] = useState(CLASS_DEFAULTS.piston_single.tboProp);
  const [gph, setGph] = useState(CLASS_DEFAULTS.piston_single.gph);

  const applyClassDefaults = (cls) => {
    setAircraftClass(cls);
    const d = CLASS_DEFAULTS[cls];
    setFuelRate(d.fuel);
    setMaintRate(d.maintenance);
    setInsuranceYr(d.insurance);
    setHangarYr(d.hangar);
    setTbo(d.tbo);
    setTboProp(d.tboProp);
    setGph(d.gph);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const d = CLASS_DEFAULTS[aircraftClass];
    onSave({
      id: `custom_${Date.now()}`,
      name: name.trim(),
      custom: true,
      class: aircraftClass,
      fuel: fuelRate,
      maintenance: maintRate,
      insurance_yr: insuranceYr,
      hangar_yr: hangarYr,
      tbo,
      tbo_prop: tboProp,
      gph,
      reserveEngine: d.engineReserve,
      reserveProp: d.propReserve,
      reserveInspection: d.inspectionReserve,
    });
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setAircraftClass("piston_single");
    applyClassDefaults("piston_single");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white rounded-2xl border border-black/[0.08] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
              <Plane className="w-4 h-4 text-[#10b981]" />
            </div>
            <div>
              <p className="text-sm font-black text-[#1A1814] uppercase tracking-tight">Add Custom Aircraft</p>
              <p className="text-[10px] text-[#6B6560]">Define your own aircraft for CAPEX/OPEX analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.05]">
            <X className="w-3.5 h-3.5 text-[#6B6560]" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560] block mb-1.5">Aircraft Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Piper PA-28 Archer, HondaJet Elite..."
              className="h-9 text-sm" />
          </div>

          {/* Class */}
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560] block mb-1.5">Aircraft Class</label>
            <Select value={aircraftClass} onValueChange={applyClassDefaults}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AIRCRAFT_CLASSES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-sm">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-[#AAA49C] mt-1">Selecting a class pre-fills industry-average defaults below.</p>
          </div>

          {/* Operating costs grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560] block mb-1.5">Fuel $/hr</label>
              <Input type="number" value={fuelRate} onChange={(e) => setFuelRate(+e.target.value)}
                className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560] block mb-1.5">Maintenance $/hr</label>
              <Input type="number" value={maintRate} onChange={(e) => setMaintRate(+e.target.value)}
                className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560] block mb-1.5">Insurance $/yr</label>
              <Input type="number" value={insuranceYr} onChange={(e) => setInsuranceYr(+e.target.value)}
                className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560] block mb-1.5">Hangar $/yr</label>
              <Input type="number" value={hangarYr} onChange={(e) => setHangarYr(+e.target.value)}
                className="h-9 text-sm" />
            </div>
          </div>

          {/* TBO / GPH */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560] block mb-1.5">TBO Engine (hr)</label>
              <Input type="number" value={tbo} onChange={(e) => setTbo(+e.target.value)}
                className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560] block mb-1.5">TBO Prop (hr)</label>
              <Input type="number" value={tboProp} onChange={(e) => setTboProp(+e.target.value)}
                className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#6B6560] block mb-1.5">Fuel burn (GPH)</label>
              <Input type="number" value={gph} onChange={(e) => setGph(+e.target.value)}
                className="h-9 text-sm" />
            </div>
          </div>

          {/* Pre-fill info */}
          <div className="rounded-xl bg-[#10b981]/05 border border-[#10b981]/15 p-3">
            <p className="text-[10px] text-[#065f46] font-semibold">
              Reserve rates are auto-assigned based on aircraft class. Engine reserve: ${CLASS_DEFAULTS[aircraftClass].engineReserve}/hr, Prop: ${CLASS_DEFAULTS[aircraftClass].propReserve}/hr, Inspection: ${CLASS_DEFAULTS[aircraftClass].inspectionReserve}/hr
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-black/[0.06]">
          <Button variant="outline" size="sm" onClick={resetForm} className="text-[11px]">Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim()}
            className="gap-1.5 text-[11px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
            <Save className="w-3.5 h-3.5" /> Save Aircraft
          </Button>
        </div>
      </div>
    </div>
  );
}
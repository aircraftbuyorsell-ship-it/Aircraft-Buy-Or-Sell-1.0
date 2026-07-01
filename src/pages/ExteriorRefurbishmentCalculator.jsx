import { useState, useMemo } from "react";
import { Paintbrush, DollarSign, Check } from "lucide-react";

const AIRCRAFT_SIZE = [
  { label: "Small SEP (C172, PA28)", baseMultiplier: 1.0, value: "small" },
  { label: "Large SEP / MEP (C210, Baron)", baseMultiplier: 1.4, value: "large_sep" },
  { label: "Turboprop (King Air, PC-12)", baseMultiplier: 2.2, value: "turboprop" },
  { label: "Light Jet (Citation Mustang)", baseMultiplier: 3.0, value: "light_jet" },
  { label: "Mid/Heavy Jet", baseMultiplier: 5.5, value: "heavy_jet" },
  { label: "Helicopter (R44 / Bell 206)", baseMultiplier: 1.6, value: "helicopter" },
];

const CONDITION = [
  { label: "Good (minor work)", factor: 0.85 },
  { label: "Fair (standard)", factor: 1.0 },
  { label: "Poor (heavy corrosion/damage)", factor: 1.35 },
];

const SERVICES = [
  { id: "strip_paint", label: "Full Strip & Paint", basePrice: 22500, hours: 80, value: "service" },
  { id: "partial_repaint", label: "Partial Repaint / Touch-Up", basePrice: 5500, hours: 24, value: "service" },
  { id: "polish", label: "Bare Metal Polishing", basePrice: 4000, hours: 32, value: "service" },
  { id: "deice_boots", label: "Deice Boot Replacement", basePrice: 6000, hours: 16, value: "service" },
  { id: "windshield", label: "Windshield / Window Replacement", basePrice: 2800, hours: 10, value: "service" },
  { id: "corrosion", label: "Corrosion Treatment & Prevention", basePrice: 4000, hours: 20, value: "service" },
  { id: "reg_repaint", label: "Registration Markings Repaint", basePrice: 1000, hours: 4, value: "service" },
  { id: "control_surf", label: "Control Surface Recovering", basePrice: 3500, hours: 18, value: "service" },
  { id: "striping", label: "Custom Striping / Livery Design", basePrice: 2200, hours: 12, value: "service" },
  { id: "leading_edge", label: "Leading Edge Polish / Protection", basePrice: 1500, hours: 8, value: "service" },
];

const LABOR_RATE = 95; // exterior shops typically $85-110/hr

export default function ExteriorRefurbishmentCalculator() {
  const [size, setSize] = useState("small");
  const [condition, setCondition] = useState("Fair (standard)");
  const [selected, setSelected] = useState({ strip_paint: true });

  const result = useMemo(() => {
    const sz = AIRCRAFT_SIZE.find((a) => a.value === size);
    const cond = CONDITION.find((c) => c.label === condition);
    let partsTotal = 0;
    let laborHours = 0;

    const lineItems = SERVICES.filter((s) => selected[s.id]).map((s) => {
      const parts = Math.round(s.basePrice * sz.baseMultiplier);
      const labor = Math.round(s.hours * sz.baseMultiplier);
      const laborCost = labor * LABOR_RATE * cond.factor;
      const lineTotal = parts + laborCost;
      partsTotal += parts;
      laborHours += labor;
      return { ...s, parts, labor, laborCost, lineTotal };
    });

    const laborTotal = laborHours * LABOR_RATE * cond.factor;
    const grandTotal = partsTotal + laborTotal;
    return { lineItems, partsTotal, laborHours, laborTotal: Math.round(laborTotal), grandTotal: Math.round(grandTotal) };
  }, [size, condition, selected]);

  const toggle = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(93,202,165,0.12)", border: "1px solid rgba(93,202,165,0.25)" }}>
          <Paintbrush className="w-5 h-5" style={{ color: "#5dcaa5" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Exterior Refurbishment Calculator</h1>
          <p className="text-sm text-white/50">Estimate paint, polish, and exterior restoration costs based on aircraft size and condition.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Selectors */}
          <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">Aircraft Size</label>
              <select value={size} onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#5dcaa5]">
                {AIRCRAFT_SIZE.map((a) => (
                  <option key={a.value} value={a.value} className="bg-[#0B0F1A] text-white">{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">Current Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#5dcaa5]">
                {CONDITION.map((c) => (
                  <option key={c.label} value={c.label} className="bg-[#0B0F1A] text-white">{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Services */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white/70 mb-3">Select Services</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SERVICES.map((s) => (
                <button key={s.id} onClick={() => toggle(s.id)}
                  className={`flex items-center gap-3 p-3 min-h-[44px] rounded-xl text-left transition-all ${selected[s.id] ? "bg-[#5dcaa5]/10 border border-[#5dcaa5]/25" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${selected[s.id] ? "bg-[#5dcaa5]" : "border border-white/20"}`}>
                    {selected[s.id] && <Check className="w-3.5 h-3.5 text-[#04060a]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.label}</p>
                    <p className="text-[11px] text-white/40">from ${s.basePrice.toLocaleString()} · {s.hours}h</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-[#5dcaa5]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white/80">Cost Breakdown</h3>
            </div>

            {result.lineItems.length === 0 ? (
              <p className="text-sm text-white/40 py-8 text-center">Select services to see estimate</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {result.lineItems.map((li) => (
                    <div key={li.id} className="flex items-start justify-between text-[12px]">
                      <span className="text-white/70 pr-2">{li.label}</span>
                      <span className="text-white font-semibold tabular-nums shrink-0">${li.lineTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-3 space-y-1.5">
                  <Row label="Materials" value={result.partsTotal} />
                  <Row label={`Labor (${result.laborHours}h @ $${LABOR_RATE}/hr)`} value={result.laborTotal} />
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white">Total Estimate</span>
                      <span className="text-2xl font-black text-[#5dcaa5] tabular-nums">${result.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-semibold tabular-nums">${value.toLocaleString()}</span>
    </div>
  );
}
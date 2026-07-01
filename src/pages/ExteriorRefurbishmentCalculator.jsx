import { useState, useMemo } from "react";
import { Paintbrush, DollarSign, Check } from "lucide-react";
import { GA_AIRCRAFT } from "@/lib/aircraftModels";

const CONDITION = [
  { label: "Good (minor work)", factor: 0.85 },
  { label: "Fair (standard)", factor: 1.0 },
  { label: "Poor (heavy corrosion/damage)", factor: 1.35 },
];

const SERVICES = [
  { id: "strip_paint", label: "Full Strip & Paint", basePrice: 22500, hours: 80 },
  { id: "partial_repaint", label: "Partial Repaint / Touch-Up", basePrice: 5500, hours: 24 },
  { id: "polish", label: "Bare Metal Polishing", basePrice: 4000, hours: 32 },
  { id: "deice_boots", label: "Deice Boot Replacement", basePrice: 6000, hours: 16 },
  { id: "windshield", label: "Windshield / Window Replacement", basePrice: 2800, hours: 10 },
  { id: "corrosion", label: "Corrosion Treatment & Prevention", basePrice: 4000, hours: 20 },
  { id: "reg_repaint", label: "Registration Markings Repaint", basePrice: 1000, hours: 4 },
  { id: "control_surf", label: "Control Surface Recovering", basePrice: 3500, hours: 18 },
  { id: "striping", label: "Custom Striping / Livery Design", basePrice: 2200, hours: 12 },
  { id: "leading_edge", label: "Leading Edge Polish / Protection", basePrice: 1500, hours: 8 },
];

const LABOR_RATE = 95;

export default function ExteriorRefurbishmentCalculator() {
  const [aircraft, setAircraft] = useState("c172");
  const [condition, setCondition] = useState("Fair (standard)");
  const [selected, setSelected] = useState({ strip_paint: true });

  const result = useMemo(() => {
    const ac = GA_AIRCRAFT.find((a) => a.value === aircraft);
    const cond = CONDITION.find((c) => c.label === condition);
    let partsTotal = 0;
    let laborHours = 0;

    const lineItems = SERVICES.filter((s) => selected[s.id]).map((s) => {
      const parts = Math.round(s.basePrice * ac.exteriorMult);
      const labor = Math.round(s.hours * ac.exteriorMult);
      const laborCost = labor * LABOR_RATE * cond.factor;
      const lineTotal = parts + laborCost;
      partsTotal += parts;
      laborHours += labor;
      return { ...s, parts, labor, laborCost, lineTotal };
    });

    const laborTotal = laborHours * LABOR_RATE * cond.factor;
    const grandTotal = partsTotal + laborTotal;
    return { lineItems, partsTotal, laborHours, laborTotal: Math.round(laborTotal), grandTotal: Math.round(grandTotal), ac };
  }, [aircraft, condition, selected]);

  const toggle = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(93,202,165,0.12)", border: "1px solid rgba(93,202,165,0.25)" }}>
          <Paintbrush className="w-5 h-5" style={{ color: "#5dcaa5" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Exterior Refurbishment Calculator</h1>
          <p className="text-sm text-white/50">Estimate paint, polish, and exterior restoration costs scaled by aircraft model and condition.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">Aircraft Model</label>
              <select value={aircraft} onChange={(e) => setAircraft(e.target.value)}
                className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#5dcaa5]">
                {GA_AIRCRAFT.map((a) => (
                  <option key={a.value} value={a.value} className="bg-[#0B0F1A] text-white">{a.label} ({a.category})</option>
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
                    <p className="text-[11px] text-white/40">from ${s.basePrice.toLocaleString()} · {s.hours}h base</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-[#5dcaa5]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white/80">Cost Breakdown</h3>
            </div>
            <div className="mb-3 pb-3 border-b border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Aircraft</p>
              <p className="text-sm font-bold text-white">{result.ac.label}</p>
              <p className="text-[11px] text-white/40">Surface area factor: {result.ac.exteriorMult}×</p>
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
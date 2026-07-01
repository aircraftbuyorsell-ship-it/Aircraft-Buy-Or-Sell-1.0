import { useState, useMemo } from "react";
import { Sparkles, DollarSign, Check, Plane, Info } from "lucide-react";
import { GA_AIRCRAFT } from "@/lib/aircraftModels";

const SERVICE_TIERS = [
  { label: "Wash & Wax", factor: 0.50 },
  { label: "Standard Detail", factor: 1.0 },
  { label: "Premium Show Detail", factor: 1.60 },
];

const EXTERIOR_SERVICES = [
  { id: "hand_wash", label: "Hand Wash & Dry", basePrice: 250, hours: 3 },
  { id: "wax_sealant", label: "Carnauba Wax / Paint Sealant", basePrice: 450, hours: 5 },
  { id: "ceramic_coating", label: "Ceramic Coating (2-year)", basePrice: 1800, hours: 12 },
  { id: "brightwork", label: "Brightwork Polishing (leading edges, spinners)", basePrice: 600, hours: 6 },
  { id: "windshield_polish", label: "Windshield / Window Polish & Seal", basePrice: 350, hours: 3 },
  { id: "belly_degrease", label: "Belly Cleaning & Degreasing", basePrice: 400, hours: 4 },
  { id: "engine_bay", label: "Engine Compartment Cleaning", basePrice: 300, hours: 3 },
  { id: "landing_gear", label: "Landing Gear Detail & Lube", basePrice: 250, hours: 2 },
  { id: "wheel_polish", label: "Wheel & Brake Polishing", basePrice: 200, hours: 2 },
  { id: "paint_correction", label: "Paint Correction / Swirl Removal", basePrice: 800, hours: 8 },
];

const INTERIOR_SERVICES = [
  { id: "vacuum_shampoo", label: "Vacuum & Carpet Shampoo", basePrice: 200, hours: 3 },
  { id: "deep_clean", label: "Interior Deep Clean & Sanitize", basePrice: 350, hours: 4 },
  { id: "leather_condition", label: "Leather Cleaning & Conditioning", basePrice: 300, hours: 3, perSeat: true },
  { id: "headliner_clean", label: "Headliner & Side Panel Clean", basePrice: 250, hours: 3 },
  { id: "cockpit_detail", label: "Cockpit / Panel Detail", basePrice: 200, hours: 2 },
  { id: "glass_interior", label: "Interior Glass Clean & Anti-Fog", basePrice: 100, hours: 1 },
  { id: "odor_removal", label: "Ozone Odor Removal Treatment", basePrice: 250, hours: 2 },
  { id: "fabric_protect", label: "Fabric & Carpet Protection Spray", basePrice: 150, hours: 2 },
];

const LABOR_RATE = 75; // detailing labor typically $65-85/hr

export default function AircraftDetailingCalculator() {
  const [aircraft, setAircraft] = useState("c172");
  const [tier, setTier] = useState("Standard Detail");
  const [extSelected, setExtSelected] = useState({ hand_wash: true, wax_sealant: true });
  const [intSelected, setIntSelected] = useState({ vacuum_shampoo: true, deep_clean: true });

  const ac = GA_AIRCRAFT.find((a) => a.value === aircraft);
  const tierObj = SERVICE_TIERS.find((t) => t.label === tier);
  // Detailing scales more gently — average of exterior & interior multipliers
  const detailMult = (ac.exteriorMult + ac.interiorMult) / 2;

  const result = useMemo(() => {
    let partsTotal = 0;
    let laborHours = 0;
    const lineItems = [];

    [...EXTERIOR_SERVICES, ...INTERIOR_SERVICES].forEach((s) => {
      const isOn = EXTERIOR_SERVICES.includes(s) ? extSelected[s.id] : intSelected[s.id];
      if (!isOn) return;
      const qty = s.perSeat ? ac.interiorSeats : 1;
      const parts = Math.round(s.basePrice * detailMult * tierObj.factor * qty);
      const labor = Math.round(s.hours * detailMult * qty);
      const laborCost = labor * LABOR_RATE;
      const lineTotal = parts + laborCost;
      partsTotal += parts;
      laborHours += labor;
      const category = EXTERIOR_SERVICES.includes(s) ? "Exterior" : "Interior";
      lineItems.push({ label: s.perSeat ? `${s.label} ×${qty}` : s.label, category, lineTotal: Math.round(lineTotal) });
    });

    const laborTotal = laborHours * LABOR_RATE;
    const grandTotal = partsTotal + laborTotal;
    return { lineItems, partsTotal: Math.round(partsTotal), laborHours, laborTotal: Math.round(laborTotal), grandTotal: Math.round(grandTotal) };
  }, [aircraft, tier, extSelected, intSelected, ac, detailMult, tierObj]);

  const toggleExt = (id) => setExtSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleInt = (id) => setIntSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(78,200,255,0.12)", border: "1px solid rgba(78,200,255,0.25)" }}>
          <Sparkles className="w-5 h-5" style={{ color: "#4ec8ff" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Aircraft Detailing Calculator</h1>
          <p className="text-sm text-white/50">Estimate exterior wash, polish, coating, and interior detailing costs by aircraft model.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Selectors */}
          <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block flex items-center gap-2">
                <Plane className="w-3.5 h-3.5" /> Aircraft Model
              </label>
              <select value={aircraft} onChange={(e) => setAircraft(e.target.value)}
                className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#4ec8ff]">
                {GA_AIRCRAFT.map((a) => (
                  <option key={a.value} value={a.value} className="bg-[#0B0F1A] text-white">{a.label} ({a.category})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">Service Tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value)}
                className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#4ec8ff]">
                {SERVICE_TIERS.map((t) => (
                  <option key={t.label} value={t.label} className="bg-[#0B0F1A] text-white">{t.label} ({t.factor}×)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Exterior Services */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white/70 mb-3">Exterior Detailing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXTERIOR_SERVICES.map((s) => (
                <button key={s.id} onClick={() => toggleExt(s.id)}
                  className={`flex items-center gap-3 p-3 min-h-[44px] rounded-xl text-left transition-all ${extSelected[s.id] ? "bg-[#4ec8ff]/10 border border-[#4ec8ff]/25" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${extSelected[s.id] ? "bg-[#4ec8ff]" : "border border-white/20"}`}>
                    {extSelected[s.id] && <Check className="w-3.5 h-3.5 text-[#04060a]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.label}</p>
                    <p className="text-[11px] text-white/40">from ${s.basePrice.toLocaleString()} · {s.hours}h</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interior Services */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white/70 mb-3">Interior Detailing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INTERIOR_SERVICES.map((s) => (
                <button key={s.id} onClick={() => toggleInt(s.id)}
                  className={`flex items-center gap-3 p-3 min-h-[44px] rounded-xl text-left transition-all ${intSelected[s.id] ? "bg-[#4ec8ff]/10 border border-[#4ec8ff]/25" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${intSelected[s.id] ? "bg-[#4ec8ff]" : "border border-white/20"}`}>
                    {intSelected[s.id] && <Check className="w-3.5 h-3.5 text-[#04060a]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.label}</p>
                    <p className="text-[11px] text-white/40">from ${s.basePrice.toLocaleString()} · {s.hours}h{s.perSeat ? " /seat" : ""}</p>
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
              <DollarSign className="w-4 h-4 text-[#4ec8ff]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white/80">Cost Breakdown</h3>
            </div>
            <div className="mb-3 pb-3 border-b border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Aircraft</p>
              <p className="text-sm font-bold text-white">{ac.label}</p>
              <p className="text-[11px] text-white/40">Detail factor: {detailMult.toFixed(2)}× · Tier: {tierObj.factor}×</p>
            </div>

            {result.lineItems.length === 0 ? (
              <p className="text-sm text-white/40 py-8 text-center">Select services to see estimate</p>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto">
                  {result.lineItems.map((li, i) => (
                    <div key={i} className="flex items-start justify-between text-[12px]">
                      <div className="pr-2">
                        <p className="text-white/70">{li.label}</p>
                        <p className="text-[9px] uppercase tracking-wider text-white/30">{li.category}</p>
                      </div>
                      <span className="text-white font-semibold tabular-nums shrink-0">${li.lineTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-3 space-y-1.5">
                  <Row label="Service Costs" value={result.partsTotal} />
                  <Row label={`Labor (${result.laborHours}h @ $${LABOR_RATE}/hr)`} value={result.laborTotal} />
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white">Total Estimate</span>
                      <span className="text-2xl font-black text-[#4ec8ff] tabular-nums">${result.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl p-3 bg-[#4ec8ff]/8 border border-[#4ec8ff]/15 flex gap-2">
                  <Info className="w-4 h-4 text-[#4ec8ff] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    Estimates based on standard detailing rates. Ceramic coating and paint correction require shop evaluation.
                  </p>
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
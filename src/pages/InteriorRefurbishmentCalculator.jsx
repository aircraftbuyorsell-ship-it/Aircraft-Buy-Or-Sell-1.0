import { useState, useMemo } from "react";
import { Armchair, DollarSign, Plus, Minus, Check } from "lucide-react";
import { GA_AIRCRAFT } from "@/lib/aircraftModels";

const SEAT_TYPES = [
  { label: "Crew / Passenger (Standard)", price: 2200, value: "standard" },
  { label: "Crew / Passenger (Premium Leather)", price: 3800, value: "premium" },
  { label: "Crew / Passenger (Ultra-Luxury)", price: 5500, value: "ultra" },
  { label: "Bench / Divan", price: 4500, value: "bench" },
];

const MATERIAL_GRADE = [
  { label: "Economy (vinyl / fabric mix)", factor: 0.80 },
  { label: "Standard (leather / wool carpet)", factor: 1.0 },
  { label: "Premium (full leather / premium carpet)", factor: 1.35 },
  { label: "Ultra-Luxury (hand-stitched / exotic)", factor: 1.85 },
];

const SERVICES = [
  { id: "carpet", label: "Cabin Carpet Replacement", basePrice: 3500, hours: 16 },
  { id: "headliner", label: "Headliner Replacement", basePrice: 2200, hours: 14 },
  { id: "side_panels", label: "Side Panels / Cabinetry Refinish", basePrice: 3200, hours: 24 },
  { id: "placards", label: "Placards & Trim Kit", basePrice: 900, hours: 6 },
  { id: "soundproof", label: "Soundproofing / Insulation Upgrade", basePrice: 2800, hours: 20 },
  { id: "seat_belts", label: "Seat Belts / Restraints Replacement", basePrice: 650, hours: 4, perSeat: true },
  { id: "cockpit_panel", label: "Cockpit Panel Cover / Yoke Boots", basePrice: 1100, hours: 8 },
  { id: "cabinetry", label: "Cabinetry Rebuild / Refinish", basePrice: 4500, hours: 32 },
  { id: "lighting", label: "Cabin LED Lighting Upgrade", basePrice: 1800, hours: 10 },
  { id: "usb_power", label: "USB / Power Outlets Installation", basePrice: 750, hours: 6 },
];

const LABOR_RATE = 95;

export default function InteriorRefurbishmentCalculator() {
  const [aircraft, setAircraft] = useState("c172");
  const [seatOverride, setSeatOverride] = useState(null);
  const [seatType, setSeatType] = useState("standard");
  const [material, setMaterial] = useState("Standard (leather / wool carpet)");
  const [selected, setSelected] = useState({ carpet: true, headliner: true });

  const ac = GA_AIRCRAFT.find((a) => a.value === aircraft);
  const seats = seatOverride !== null ? seatOverride : ac.interiorSeats;

  const result = useMemo(() => {
    const seat = SEAT_TYPES.find((s) => s.value === seatType);
    const mat = MATERIAL_GRADE.find((m) => m.label === material);
    let partsTotal = 0;
    let laborHours = 0;
    const lineItems = [];

    const seatParts = seat.price * seats;
    const seatLabor = 12 * seats;
    const seatLaborCost = seatLabor * LABOR_RATE;
    const seatTotal = seatParts + seatLaborCost;
    partsTotal += seatParts;
    laborHours += seatLabor;
    lineItems.push({ label: `${seat.label} ×${seats}`, lineTotal: Math.round(seatTotal) });

    SERVICES.filter((s) => selected[s.id]).forEach((s) => {
      const qty = s.perSeat ? seats : 1;
      const parts = Math.round(s.basePrice * mat.factor * ac.interiorMult * qty);
      const labor = s.hours * qty;
      const laborCost = labor * LABOR_RATE;
      const lineTotal = parts + laborCost;
      partsTotal += parts;
      laborHours += labor;
      lineItems.push({ label: s.perSeat ? `${s.label} ×${qty}` : s.label, lineTotal: Math.round(lineTotal) });
    });

    const laborTotal = laborHours * LABOR_RATE;
    const grandTotal = partsTotal + laborTotal;
    return { lineItems, partsTotal: Math.round(partsTotal), laborHours, laborTotal: Math.round(laborTotal), grandTotal: Math.round(grandTotal) };
  }, [aircraft, seats, seatType, material, selected, ac]);

  const toggle = (id) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(200,140,255,0.12)", border: "1px solid rgba(200,140,255,0.25)" }}>
          <Armchair className="w-5 h-5" style={{ color: "#c88cff" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Interior Refurbishment Calculator</h1>
          <p className="text-sm text-white/50">Estimate seats, carpet, panels, and cabin restoration costs scaled by aircraft model.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-card p-5 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">Aircraft Model</label>
              <select value={aircraft} onChange={(e) => { setAircraft(e.target.value); setSeatOverride(null); }}
                className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c88cff]">
                {GA_AIRCRAFT.map((a) => (
                  <option key={a.value} value={a.value} className="bg-[#0B0F1A] text-white">{a.label} ({a.category})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">Number of Seats <span className="text-white/30 normal-case font-normal">(auto-set from model, override if needed)</span></label>
              <div className="flex items-center gap-3">
                <button onClick={() => setSeatOverride((s) => Math.max(1, (s ?? ac.interiorSeats) - 1))} className="w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-black text-white tabular-nums w-12 text-center">{seats}</span>
                <button onClick={() => setSeatOverride((s) => Math.min(20, (s ?? ac.interiorSeats) + 1))} className="w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#c88cff]/20 text-[#c88cff] hover:bg-[#c88cff]/30">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">Seat Type</label>
                <select value={seatType} onChange={(e) => setSeatType(e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c88cff]">
                  {SEAT_TYPES.map((s) => (
                    <option key={s.value} value={s.value} className="bg-[#0B0F1A] text-white">{s.label} (${s.price.toLocaleString()}/ea)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">Material Grade</label>
                <select value={material} onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c88cff]">
                  {MATERIAL_GRADE.map((m) => (
                    <option key={m.label} value={m.label} className="bg-[#0B0F1A] text-white">{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white/70 mb-3">Additional Cabin Services</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SERVICES.map((s) => (
                <button key={s.id} onClick={() => toggle(s.id)}
                  className={`flex items-center gap-3 p-3 min-h-[44px] rounded-xl text-left transition-all ${selected[s.id] ? "bg-[#c88cff]/10 border border-[#c88cff]/25" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${selected[s.id] ? "bg-[#c88cff]" : "border border-white/20"}`}>
                    {selected[s.id] && <Check className="w-3.5 h-3.5 text-[#04060a]" />}
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

        <div>
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-[#c88cff]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white/80">Cost Breakdown</h3>
            </div>
            <div className="mb-3 pb-3 border-b border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Aircraft</p>
              <p className="text-sm font-bold text-white">{ac.label}</p>
              <p className="text-[11px] text-white/40">Cabin size factor: {ac.interiorMult}× · {ac.interiorSeats} seats default</p>
            </div>

            {result.lineItems.length === 0 ? (
              <p className="text-sm text-white/40 py-8 text-center">Select services to see estimate</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {result.lineItems.map((li, i) => (
                    <div key={i} className="flex items-start justify-between text-[12px]">
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
                      <span className="text-2xl font-black text-[#c88cff] tabular-nums">${result.grandTotal.toLocaleString()}</span>
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
import { useState, useMemo } from "react";
import { GitCompare, Radio, Paintbrush, Armchair, Check, Plane } from "lucide-react";

const AIRCRAFT_SIZE = [
  { label: "Small SEP (C172, PA28)", value: "small", avionicsMult: 1.0, exteriorMult: 1.0, interiorSeats: 4 },
  { label: "Large SEP / MEP (C210, Baron)", value: "large_sep", avionicsMult: 1.3, exteriorMult: 1.4, interiorSeats: 6 },
  { label: "Turboprop (King Air, PC-12)", value: "turboprop", avionicsMult: 1.6, exteriorMult: 2.2, interiorSeats: 9 },
  { label: "Light Jet (Citation Mustang)", value: "light_jet", avionicsMult: 2.0, exteriorMult: 3.0, interiorSeats: 6 },
  { label: "Mid/Heavy Jet", value: "heavy_jet", avionicsMult: 2.8, exteriorMult: 5.5, interiorSeats: 12 },
  { label: "Helicopter (R44 / Bell 206)", value: "helicopter", avionicsMult: 1.8, exteriorMult: 1.6, interiorSeats: 4 },
];

const AVIONICS_ITEMS = [
  { id: "gps_nav", label: "GPS Navigator (GTN 650)", price: 14500, hours: 16 },
  { id: "adsb", label: "ADS-B Transponder (GTX 345)", price: 4200, hours: 6 },
  { id: "audio_panel", label: "Audio Panel (GMA 350)", price: 2800, hours: 4 },
  { id: "autopilot", label: "Autopilot (GFC 500)", price: 11000, hours: 24 },
  { id: "glass_panel", label: "Glass Panel / EFIS (per screen)", price: 12500, hours: 20 },
  { id: "com_radio", label: "COM Radio (GTR 225)", price: 2200, hours: 5 },
];

const EXTERIOR_ITEMS = [
  { id: "strip_paint", label: "Full Strip & Paint", price: 22500, hours: 80 },
  { id: "partial_repaint", label: "Partial Repaint / Touch-Up", price: 5500, hours: 24 },
  { id: "polish", label: "Bare Metal Polishing", price: 4000, hours: 32 },
  { id: "deice_boots", label: "Deice Boot Replacement", price: 6000, hours: 16 },
  { id: "windshield", label: "Windshield / Window Replacement", price: 2800, hours: 10 },
  { id: "corrosion", label: "Corrosion Treatment & Prevention", price: 4000, hours: 20 },
];

const INTERIOR_ITEMS = [
  { id: "seats", label: "Seat Refurbishment (per seat)", price: 2200, hours: 12, perSeat: true },
  { id: "carpet", label: "Cabin Carpet Replacement", price: 3500, hours: 16 },
  { id: "headliner", label: "Headliner Replacement", price: 2200, hours: 14 },
  { id: "side_panels", label: "Side Panels / Cabinetry Refinish", price: 3200, hours: 24 },
  { id: "soundproof", label: "Soundproofing Upgrade", price: 2800, hours: 20 },
  { id: "lighting", label: "Cabin LED Lighting Upgrade", price: 1800, hours: 10 },
];

const LABOR_RATE = 95;

const CATEGORIES = [
  { key: "avionics", label: "Avionics", icon: Radio, color: "#f5c242", items: AVIONICS_ITEMS },
  { key: "exterior", label: "Exterior", icon: Paintbrush, color: "#5dcaa5", items: EXTERIOR_ITEMS },
  { key: "interior", label: "Interior", icon: Armchair, color: "#c88cff", items: INTERIOR_ITEMS },
];

export default function UpgradeComparison() {
  const [aircraft, setAircraft] = useState("small");
  const [selected, setSelected] = useState({
    avionics: { gps_nav: true, adsb: true },
    exterior: { strip_paint: true },
    interior: { seats: true, carpet: true },
  });

  const ac = AIRCRAFT_SIZE.find((a) => a.value === aircraft);

  const results = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const mult = cat.key === "avionics" ? ac.avionicsMult : cat.key === "exterior" ? ac.exteriorMult : 1.0;
      let parts = 0;
      let labor = 0;
      const lineItems = [];

      cat.items.forEach((item) => {
        if (!selected[cat.key][item.id]) return;
        const qty = item.perSeat ? ac.interiorSeats : 1;
        const itemParts = Math.round(item.price * mult * qty);
        const itemLabor = Math.round(item.hours * mult * qty);
        parts += itemParts;
        labor += itemLabor;
        lineItems.push({ label: item.perSeat ? `${item.label} ×${qty}` : item.label, parts: itemParts, labor: itemLabor, total: itemParts + itemLabor * LABOR_RATE });
      });

      const laborCost = labor * LABOR_RATE;
      return {
        key: cat.key,
        label: cat.label,
        icon: cat.icon,
        color: cat.color,
        lineItems,
        parts,
        laborHours: labor,
        laborCost,
        total: parts + laborCost,
      };
    });
  }, [aircraft, selected, ac]);

  const grandTotal = results.reduce((sum, r) => sum + r.total, 0);
  const toggle = (cat, id) =>
    setSelected((prev) => ({ ...prev, [cat]: { ...prev[cat], [id]: !prev[cat][id] } }));

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(78,142,247,0.12)", border: "1px solid rgba(78,142,247,0.25)" }}>
          <GitCompare className="w-5 h-5" style={{ color: "#4e8ef7" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Upgrade Cost Comparison</h1>
          <p className="text-sm text-white/50">Compare avionics, exterior, and interior refurbishment costs side by side for project planning.</p>
        </div>
      </div>

      {/* Aircraft selector */}
      <div className="glass-card p-5 mb-6">
        <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block flex items-center gap-2">
          <Plane className="w-3.5 h-3.5" /> Aircraft Category
        </label>
        <select value={aircraft} onChange={(e) => setAircraft(e.target.value)}
          className="w-full sm:w-auto px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#4e8ef7]">
          {AIRCRAFT_SIZE.map((a) => (
            <option key={a.value} value={a.value} className="bg-[#0B0F1A] text-white">{a.label}</option>
          ))}
        </select>
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {results.map((cat) => (
          <div key={cat.key} className="glass-card p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: `${cat.color}25` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}30` }}>
                <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">{cat.label}</h3>
            </div>

            <div className="space-y-2 mb-4 flex-1">
              {CATEGORIES.find((c) => c.key === cat.key).items.map((item) => {
                const isOn = selected[cat.key][item.id];
                return (
                  <button key={item.id} onClick={() => toggle(cat.key, item.id)}
                    className={`w-full flex items-center gap-3 p-2.5 min-h-[44px] rounded-lg text-left transition-all ${isOn ? "bg-white/8 border border-white/15" : "bg-white/[0.02] border border-white/5 opacity-60"}`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isOn ? "" : "border border-white/20"}`} style={isOn ? { background: cat.color } : {}}>
                      {isOn && <Check className="w-3.5 h-3.5 text-[#04060a]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-white truncate">{item.label}</p>
                      <p className="text-[10px] text-white/40">${item.price.toLocaleString()} · {item.hours}h{item.perSeat ? " /seat" : ""}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-white/40">Parts</span>
                <span className="text-white/70 tabular-nums">${cat.parts.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mb-2">
                <span className="text-white/40">Labor ({cat.laborHours}h)</span>
                <span className="text-white/70 tabular-nums">${cat.laborCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/80">Subtotal</span>
                <span className="text-lg font-black tabular-nums" style={{ color: cat.color }}>${cat.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grand total bar */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Combined Project Total</p>
          <p className="text-[11px] text-white/40 mt-0.5">{ac.label} · Labor rate ${LABOR_RATE}/hr</p>
        </div>
        <div className="flex items-center gap-6">
          {results.map((r) => (
            <div key={r.key} className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-white/40">{r.label}</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: r.color }}>${r.total.toLocaleString()}</p>
            </div>
          ))}
          <div className="text-center pl-4 border-l border-white/15">
            <p className="text-[10px] uppercase tracking-wider text-white/60">Grand Total</p>
            <p className="text-2xl font-black text-white tabular-nums">${grandTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
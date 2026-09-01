import { useState, useMemo } from "react";
import { Radio, Wrench, Plus, Minus } from "lucide-react";
import { GA_AIRCRAFT } from "@/lib/aircraftModels";

const LABOR_RATES = [
  { label: "Regional Shop ($85/hr)", rate: 85 },
  { label: "Mid-Tier Shop ($105/hr)", rate: 105 },
  { label: "Premium / Garmin Dealer ($125/hr)", rate: 125 },
  { label: "Specialized Avionics ($150/hr)", rate: 150 },
];

const UPGRADES = [
  { id: "gps_nav", label: "GPS Navigator (GTN 650 / Avidyne IFD)", unitPrice: 14500, installHours: 16, defaultQty: 1 },
  { id: "adsb_transponder", label: "ADS-B Transponder (GTX 345)", unitPrice: 4200, installHours: 6, defaultQty: 1 },
  { id: "audio_panel", label: "Audio Panel (GMA 350 / PMA450)", unitPrice: 2800, installHours: 4, defaultQty: 1 },
  { id: "autopilot", label: "Autopilot System (GFC 500 / GFC 700)", unitPrice: 11000, installHours: 24, defaultQty: 1 },
  { id: "glass_panel", label: "Glass Panel / EFIS (G3X Touch per screen)", unitPrice: 12500, installHours: 20, defaultQty: 2 },
  { id: "traffic_weather", label: "Traffic/Weather Module (GDL 52)", unitPrice: 1600, installHours: 3, defaultQty: 1 },
  { id: "adsb_in", label: "ADS-B In (Stratus / portable integration)", unitPrice: 900, installHours: 2, defaultQty: 1 },
  { id: "com_radio", label: "COM Radio (Garmin GTR 225)", unitPrice: 2200, installHours: 5, defaultQty: 1 },
  { id: "nav_radio", label: "VOR/NAV Radio (Garmin GNC 355)", unitPrice: 6950, installHours: 12, defaultQty: 1 },
  { id: "elt", label: "ELT 406 MHz (Artex)", unitPrice: 850, installHours: 3, defaultQty: 1 },
  { id: "panel_rewire", label: "Panel Rewire / Harness Replacement", unitPrice: 3500, installHours: 30, defaultQty: 0 },
  { id: "adsb_out_install", label: "ADS-B Out Mandate Compliance Kit", unitPrice: 1800, installHours: 8, defaultQty: 0 },
];

export default function AvionicsUpgradeCalculator() {
  const [aircraft, setAircraft] = useState("c172");
  const [laborIdx, setLaborIdx] = useState(1);
  const [items, setItems] = useState(
    Object.fromEntries(UPGRADES.map((u) => [u.id, u.defaultQty]))
  );

  const result = useMemo(() => {
    const ac = GA_AIRCRAFT.find((a) => a.value === aircraft);
    const laborRate = LABOR_RATES[laborIdx].rate;
    let partsTotal = 0;
    let laborHours = 0;

    const lineItems = UPGRADES.map((u) => {
      const qty = items[u.id] || 0;
      if (qty === 0) return null;
      const parts = u.unitPrice * qty;
      const labor = u.installHours * ac.avionicsMult * qty;
      const lineTotal = parts + labor * laborRate;
      partsTotal += parts;
      laborHours += labor;
      return { ...u, qty, parts, labor, lineTotal };
    }).filter(Boolean);

    const laborTotal = laborHours * laborRate;
    const grandTotal = partsTotal + laborTotal;
    return { lineItems, partsTotal, laborHours, laborTotal, grandTotal, ac };
  }, [aircraft, laborIdx, items]);

  const setQty = (id, delta) =>
    setItems((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,194,66,0.12)", border: "1px solid rgba(245,194,66,0.25)" }}>
          <Radio className="w-5 h-5" style={{ color: "#f5c242" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Avionics Upgrade Calculator</h1>
          <p className="text-sm text-white/50">Estimate parts and labor costs scaled by specific GA aircraft model.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Selectors */}
          <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">Aircraft Model</label>
              <select value={aircraft} onChange={(e) => setAircraft(e.target.value)}
                className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#f5c242]">
                {GA_AIRCRAFT.map((a) => (
                  <option key={a.value} value={a.value} className="bg-[#0B0F1A] text-white">{a.label} ({a.category})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">Labor Rate</label>
              <select value={laborIdx} onChange={(e) => setLaborIdx(Number(e.target.value))}
                className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#f5c242]">
                {LABOR_RATES.map((r, i) => (
                  <option key={i} value={i} className="bg-[#0B0F1A] text-white">{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Line items */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-white/70 mb-3">Select Upgrades</h3>
            <div className="space-y-2">
              {UPGRADES.map((u) => (
                <div key={u.id} className={`flex items-center gap-3 rounded-xl p-3 transition-all ${items[u.id] > 0 ? "bg-[#f5c242]/8 border border-[#f5c242]/20" : "bg-white/5 border border-white/10"}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.label}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">${u.unitPrice.toLocaleString()} · {u.installHours}h base install</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setQty(u.id, -1)} className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-white tabular-nums">{items[u.id] || 0}</span>
                    <button onClick={() => setQty(u.id, 1)} className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-[#f5c242]/20 text-[#f5c242] hover:bg-[#f5c242]/30">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="w-4 h-4 text-[#5dcaa5]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white/80">Cost Breakdown</h3>
            </div>
            <div className="mb-3 pb-3 border-b border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Aircraft</p>
              <p className="text-sm font-bold text-white">{result.ac.label}</p>
              <p className="text-[11px] text-white/40">Panel complexity factor: {result.ac.avionicsMult}×</p>
            </div>

            {result.lineItems.length === 0 ? (
              <p className="text-sm text-white/40 py-8 text-center">Select upgrades to see estimate</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {result.lineItems.map((li) => (
                    <div key={li.id} className="flex items-start justify-between text-[12px]">
                      <span className="text-white/70 pr-2">{li.label} ×{li.qty}</span>
                      <span className="text-white font-semibold tabular-nums shrink-0">${li.lineTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-3 space-y-1.5">
                  <Row label="Parts Subtotal" value={result.partsTotal} />
                  <Row label={`Labor (${result.laborHours.toFixed(1)}h)`} value={result.laborTotal} />
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
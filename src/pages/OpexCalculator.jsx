import { useState, useMemo } from "react";
import { Calculator, TrendingUp, Fuel, Wrench, FileText, Plane, Info } from "lucide-react";
import { useAutoTrack } from "@/lib/useBehavior";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#D4A017]">{children}</p>;
}

// Typical per-hour cost baselines (USD/hr) — editable by user
const AIRCRAFT_PRESETS = [
  { id: "cessna172", name: "Cessna 172", fuel: 45, maintenance: 35, insurance_yr: 1800, hangar_yr: 3600 },
  { id: "cirrus_sr22", name: "Cirrus SR22", fuel: 95, maintenance: 85, insurance_yr: 6500, hangar_yr: 6000 },
  { id: "baron_58", name: "Beechcraft Baron 58", fuel: 180, maintenance: 140, insurance_yr: 9000, hangar_yr: 7200 },
  { id: "king_air", name: "King Air B200", fuel: 650, maintenance: 450, insurance_yr: 28000, hangar_yr: 18000 },
];

function Slider({ label, value, onChange, min, max, step, hint, suffix = "" }) {
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <label className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold">{label}</label>
        <span className="text-sm font-black text-[#1A1814]">{value.toLocaleString()}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="w-full mt-1 accent-[#D4A017]" />
      {hint && <p className="text-[10px] text-[#AAA49C] mt-1 flex items-center gap-1"><Info className="w-2.5 h-2.5" /> {hint}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent = "#D4A017" }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#AAA49C]">{label}</p>
      </div>
      <p className="text-xl font-black text-[#1A1814]">${value.toLocaleString()}</p>
      {sub && <p className="text-[10px] text-[#6B6560] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function OpexCalculator() {
  useAutoTrack("opex_calculator");
  const [preset, setPreset] = useState(AIRCRAFT_PRESETS[1]);
  const [annualHours, setAnnualHours] = useState(200);
  const [fuelRate, setFuelRate] = useState(preset.fuel);
  const [maintRate, setMaintRate] = useState(preset.maintenance);
  const [insuranceYr, setInsuranceYr] = useState(preset.insurance_yr);
  const [hangarYr, setHangarYr] = useState(preset.hangar_yr);
  const [crewType, setCrewType] = useState("private"); // private | commercial_single | commercial_multi

  const pickPreset = (p) => {
    setPreset(p);
    setFuelRate(p.fuel);
    setMaintRate(p.maintenance);
    setInsuranceYr(p.insurance_yr);
    setHangarYr(p.hangar_yr);
  };

  const calc = useMemo(() => {
    const variable = annualHours * (fuelRate + maintRate);
    const fixed = insuranceYr + hangarYr;
    const total = variable + fixed;
    const perHour = annualHours > 0 ? total / annualHours : 0;
    return { variable, fixed, total, perHour };
  }, [annualHours, fuelRate, maintRate, insuranceYr, hangarYr]);

  // Legal crew limits (regulatory hint)
  const crewLimits = {
    private: { max: 1500, label: "Private pilot · no hard cap, but 1500 hr/yr is industry practical max" },
    commercial_single: { max: 1200, label: "FAR 121/135 single-pilot · ~1,200 flight hr/yr calendar or any 12 consecutive months" },
    commercial_multi: { max: 1000, label: "FAR 121 multi-crew · 1,000 flight hr/yr calendar or any 12 consecutive months" },
  };
  const limit = crewLimits[crewType];
  const overLimit = annualHours > limit.max;

  // Smart hints based on utilization
  const hints = [];
  if (annualHours < 100) hints.push({ type: "warn", text: "Very low utilization — consider fractional ownership or charter instead. Fixed costs dominate." });
  if (annualHours > 300 && annualHours <= limit.max) hints.push({ type: "info", text: "High utilization sweet-spot — per-hour cost is optimized." });
  if (overLimit) hints.push({ type: "alert", text: `⚠ ${annualHours} hr exceeds ${limit.max} hr regulatory limit for ${crewType.replace("_", " ")}. Add crew or reduce.` });
  if (calc.perHour > 800) hints.push({ type: "info", text: "Turbine-class cost/hr — verify fuel burn and MRO reserves are realistic." });

  return (
    <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <GoldLabel>Tools · Cost Intelligence</GoldLabel>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight mt-1">Operational Cost Calculator</h1>
        <p className="text-[#6B6560] text-sm mt-1">Estimate true cost of ownership per year & per hour — with regulatory crew limits and smart hints.</p>

        <div className="grid lg:grid-cols-3 gap-4 mt-6">
          {/* Inputs */}
          <div className="lg:col-span-2 bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6 space-y-5">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-2">Aircraft preset</label>
              <div className="flex flex-wrap gap-2">
                {AIRCRAFT_PRESETS.map(p => (
                  <button key={p.id} onClick={() => pickPreset(p)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${preset.id === p.id ? "border-[#D4A017] bg-[rgba(212,160,23,0.08)] text-[#1A1814]" : "border-black/10 bg-white text-[#6B6560] hover:border-black/20"}`}>
                    <Plane className="w-3 h-3 inline mr-1" /> {p.name}
                  </button>
                ))}
              </div>
            </div>

            <Slider label="Annual flight hours" value={annualHours} onChange={setAnnualHours} min={50} max={1500} step={10}
              suffix=" hr" hint="Range: 50–1,500 hr/yr (calendar or any 12 consecutive months)" />

            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-2">Crew profile (regulatory)</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "private", label: "Private (Part 91)" },
                  { id: "commercial_single", label: "Commercial single-pilot" },
                  { id: "commercial_multi", label: "Commercial multi-crew" },
                ].map(o => (
                  <button key={o.id} onClick={() => setCrewType(o.id)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${crewType === o.id ? "border-[#D4A017] bg-[rgba(212,160,23,0.08)] text-[#1A1814]" : "border-black/10 bg-white text-[#6B6560]"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#AAA49C] mt-1.5">{limit.label}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-3 border-t border-black/[0.05]">
              <Slider label="Fuel $/hr" value={fuelRate} onChange={setFuelRate} min={20} max={1500} step={5} suffix=" $/hr" />
              <Slider label="Maintenance $/hr" value={maintRate} onChange={setMaintRate} min={15} max={1000} step={5} suffix=" $/hr" />
              <Slider label="Insurance $/yr" value={insuranceYr} onChange={setInsuranceYr} min={500} max={80000} step={100} suffix=" $/yr" />
              <Slider label="Hangar $/yr" value={hangarYr} onChange={setHangarYr} min={0} max={40000} step={100} suffix=" $/yr" />
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3">
            <StatCard label="Total annual cost" value={Math.round(calc.total)} sub={`${annualHours} hr × baseline`} icon={TrendingUp} />
            <StatCard label="Cost per flight hour" value={Math.round(calc.perHour)} sub="True $/hr incl. fixed" icon={Calculator} accent="#0F7A56" />
            <StatCard label="Variable costs" value={Math.round(calc.variable)} sub="Fuel + maintenance" icon={Fuel} accent="#185FA5" />
            <StatCard label="Fixed costs" value={Math.round(calc.fixed)} sub="Insurance + hangar" icon={Wrench} accent="#A67C00" />
          </div>
        </div>

        {/* Hints */}
        {hints.length > 0 && (
          <div className="mt-5 space-y-2">
            {hints.map((h, i) => (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${
                h.type === "alert" ? "bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)] text-[#C0392B]" :
                h.type === "warn" ? "bg-[rgba(212,160,23,0.06)] border-[rgba(212,160,23,0.2)] text-[#A67C00]" :
                "bg-[rgba(24,95,165,0.06)] border-[rgba(24,95,165,0.2)] text-[#185FA5]"
              }`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{h.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA — Service offers */}
        <div className="mt-5 bg-[#1A1814] text-white rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <GoldLabel>Need real quotes?</GoldLabel>
            <p className="text-sm font-bold mt-1">Compare insurance, MRO & hangar rates from verified providers near you.</p>
          </div>
          <a href="/service-finder" className="shrink-0 bg-[#D4A017] hover:bg-[#F5C842] text-[#1A1814] font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Find services
          </a>
        </div>
      </div>
    </div>
  );
}
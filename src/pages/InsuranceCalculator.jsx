import { useState, useMemo } from "react";
import { Shield, Plane, Calculator, Info, DollarSign, TrendingUp } from "lucide-react";

const AIRCRAFT_TYPES = [
  { label: "Single-Engine Piston (SEP)", value: "sep", baseRate: 0.012 },
  { label: "Multi-Engine Piston (MEP)", value: "mep", baseRate: 0.016 },
  { label: "Turboprop", value: "turboprop", baseRate: 0.020 },
  { label: "Light Jet", value: "light_jet", baseRate: 0.025 },
  { label: "Mid/Heavy Jet", value: "heavy_jet", baseRate: 0.030 },
  { label: "Helicopter", value: "helicopter", baseRate: 0.028 },
];

const USAGE_OPTIONS = [
  { label: "Pleasure / Personal", factor: 1.0 },
  { label: "Business", factor: 1.15 },
  { label: "Instruction / Training", factor: 1.45 },
  { label: "Charter / Part 135", factor: 1.80 },
  { label: "Agricultural", factor: 2.10 },
];

const PILOT_EXPERIENCE = [
  { label: "Low (<250 hrs)", factor: 1.40 },
  { label: "Moderate (250–1000 hrs)", factor: 1.10 },
  { label: "Experienced (1000–3000 hrs)", factor: 0.95 },
  { label: "Veteran (3000+ hrs)", factor: 0.85 },
];

const COVERAGE_TYPES = [
  { label: "Liability Only", factor: 0.45 },
  { label: "Liability + Hull (Standard)", factor: 1.0 },
  { label: "Full Coverage + Passenger", factor: 1.35 },
];

const DEDUCTIBLE_OPTIONS = [
  { label: "$0", factor: 1.12 },
  { label: "$1,000", factor: 1.05 },
  { label: "$2,500", factor: 1.0 },
  { label: "$5,000", factor: 0.92 },
  { label: "$10,000", factor: 0.85 },
];

export default function InsuranceCalculator() {
  const [hullValue, setHullValue] = useState(250000);
  const [aircraftType, setAircraftType] = useState("sep");
  const [usage, setUsage] = useState("Pleasure / Personal");
  const [pilotExp, setPilotExp] = useState("Moderate (250–1000 hrs)");
  const [coverage, setCoverage] = useState("Liability + Hull (Standard)");
  const [deductible, setDeductible] = useState("$2,500");

  const result = useMemo(() => {
    const acType = AIRCRAFT_TYPES.find((a) => a.value === aircraftType);
    const usageOpt = USAGE_OPTIONS.find((u) => u.label === usage);
    const pilotOpt = PILOT_EXPERIENCE.find((p) => p.label === pilotExp);
    const covOpt = COVERAGE_TYPES.find((c) => c.label === coverage);
    const dedOpt = DEDUCTIBLE_OPTIONS.find((d) => d.label === deductible);

    const basePremium = hullValue * acType.baseRate;
    const adjusted = basePremium * usageOpt.factor * pilotOpt.factor * covOpt.factor * dedOpt.factor;
    const annual = Math.round(adjusted);
    const monthly = Math.round(adjusted / 12);
    const liabilityLimit = coverage.includes("Liability") ? 1000000 : 0;
    const ratePct = ((annual / hullValue) * 100).toFixed(2);

    return { annual, monthly, liabilityLimit, ratePct, baseRate: acType.baseRate };
  }, [hullValue, aircraftType, usage, pilotExp, coverage, deductible]);

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(78,142,247,0.12)", border: "1px solid rgba(78,142,247,0.25)" }}>
            <Shield className="w-5 h-5" style={{ color: "#4e8ef7" }} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Aircraft Insurance Calculator</h1>
            <p className="text-sm text-white/50">Estimate annual and monthly premiums based on aircraft value, usage, and pilot profile.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-3 space-y-5">
          {/* Hull Value */}
          <div className="glass-card p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2 block">
              Insured Hull Value (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="number"
                value={hullValue}
                onChange={(e) => setHullValue(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-white text-lg font-bold focus:outline-none focus:border-[#4e8ef7]"
              />
            </div>
            <input
              type="range"
              min="25000"
              max="5000000"
              step="25000"
              value={hullValue}
              onChange={(e) => setHullValue(Number(e.target.value))}
              className="w-full mt-3 accent-[#4e8ef7]"
            />
            <p className="text-xs text-white/40 mt-1">${hullValue.toLocaleString()}</p>
          </div>

          {/* Aircraft Type */}
          <div className="glass-card p-5">
            <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2 block">Aircraft Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AIRCRAFT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setAircraftType(t.value)}
                  className={`flex items-center gap-2 px-3 py-3 min-h-[44px] rounded-xl text-sm font-semibold text-left transition-all ${
                    aircraftType === t.value
                      ? "bg-[#4e8ef7] text-white"
                      : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <Plane className="w-4 h-4 shrink-0 opacity-70" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selects */}
          <div className="glass-card p-5 space-y-4">
            <SelectField label="Usage Type" value={usage} options={USAGE_OPTIONS.map((u) => u.label)} onChange={setUsage} />
            <SelectField label="Pilot Experience" value={pilotExp} options={PILOT_EXPERIENCE.map((p) => p.label)} onChange={setPilotExp} />
            <SelectField label="Coverage Type" value={coverage} options={COVERAGE_TYPES.map((c) => c.label)} onChange={setCoverage} />
            <SelectField label="Deductible" value={deductible} options={DEDUCTIBLE_OPTIONS.map((d) => d.label)} onChange={setDeductible} />
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-[#5dcaa5]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white/80">Estimated Premium</h3>
            </div>

            <div className="mb-5">
              <p className="text-xs text-white/50 mb-1">Annual Premium</p>
              <p className="text-4xl font-black text-[#5dcaa5] tabular-nums">${result.annual.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">{result.ratePct}% of hull value per year</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl p-3 bg-white/5 border border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Monthly</p>
                <p className="text-xl font-bold text-white tabular-nums">${result.monthly.toLocaleString()}</p>
              </div>
              <div className="rounded-xl p-3 bg-white/5 border border-white/10">
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Liability</p>
                <p className="text-xl font-bold text-white tabular-nums">${result.liabilityLimit.toLocaleString()}</p>
              </div>
            </div>

            <div className="rounded-xl p-3 bg-[#4e8ef7]/8 border border-[#4e8ef7]/20 flex gap-2">
              <Info className="w-4 h-4 text-[#4e8ef7] shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/60 leading-relaxed">
                Estimates are indicative only. Actual premiums vary by insurer, claims history, geographic region, and specific aircraft condition. Contact a licensed aviation insurance broker for a binding quote.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/40">Base rate</span>
                <span className="text-white/70 font-mono">{(result.baseRate * 100).toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-white/40 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Effective rate</span>
                <span className="text-white/70 font-mono">{result.ratePct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-3 min-h-[44px] bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#4e8ef7]"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-[#0B0F1A] text-white">{opt}</option>
        ))}
      </select>
    </div>
  );
}
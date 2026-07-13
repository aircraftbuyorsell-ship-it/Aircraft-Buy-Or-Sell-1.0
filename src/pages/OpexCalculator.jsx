import { useState, useMemo } from "react";
import { Calculator, TrendingUp, Fuel, Wrench, FileText, Plane, Info, ShieldCheck, MapPin, Gauge, Cpu, Plus, Lock } from "lucide-react";
import CalculatorPricingBadge from "@/components/calculators/CalculatorPricingBadge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAutoTrack } from "@/lib/useBehavior";
import {
  AIRCRAFT_PRESETS, RESERVE_RATES,
  assessMaintenanceRisk, assessServiceAccessibility, assessOwnershipClarity,
} from "@/lib/opexEngine";
import ReserveCard from "@/components/opex/ReserveCard";
import ClaritySummary from "@/components/opex/ClaritySummary";
import LocationAdjustments, { LOCATION_RATES } from "@/components/opex/LocationAdjustments";
import MaintenanceSchedule from "@/components/opex/MaintenanceSchedule";
import ComplianceTracker from "@/components/opex/ComplianceTracker";
import CustomAircraftModal from "@/components/opex/CustomAircraftModal";
import FleetPanel from "@/components/opex/FleetPanel";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: "#f5c242" }}>{children}</p>;
}

function Slider({ label, value, onChange, min, max, step, hint, suffix = "" }) {
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.60)" }}>{label}</label>
        <span className="text-sm font-black" style={{ color: "rgba(255,255,255,0.90)" }}>{value.toLocaleString()}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="w-full mt-1 accent-[#f5c242]" />
      {hint && <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.35)" }}><Info className="w-2.5 h-2.5" /> {hint}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent = "#4e8ef7" }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
      </div>
      <p className="text-xl font-black" style={{ color: "rgba(255,255,255,0.90)" }}>${value.toLocaleString()}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.60)" }}>{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-2.5 pb-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#4e8ef7" }}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-[13px] font-black uppercase tracking-tight" style={{ color: "rgba(255,255,255,0.90)" }}>{title}</p>
        {desc && <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.60)" }}>{desc}</p>}
      </div>
    </div>
  );
}

const CUSTOM_KEY = "abos_custom_aircraft";

function loadCustomAircraft() {
  try { const raw = localStorage.getItem(CUSTOM_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

const readParam = (key) => new URLSearchParams(window.location.search).get(key) || "";

export default function OpexCalculator() {
  useAutoTrack("opex_calculator");

  // --- Tier check ---
  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });
  const tier = user?.tier || user?.role === "admin" ? "enterprise" : "free_explorer";
  const canUseCustom = tier === "starter" || tier === "pro" || tier === "enterprise" || user?.role === "admin" || user?.role === "super_admin";

  // --- Prefill from URL params ---
  const urlMake = readParam("make");
  const urlModel = readParam("model") || readParam("engine_model");
  const urlEngineHours = readParam("engine_hours");
  const urlState = readParam("state");

  const findMatchingPreset = () => {
    if (!urlMake) return null;
    const needle = `${urlMake} ${urlModel}`.toLowerCase().trim();
    return AIRCRAFT_PRESETS.find(p => p.name.toLowerCase().includes(needle) || needle.includes(p.name.toLowerCase())) || null;
  };
  const matchedPreset = findMatchingPreset();

  // --- Aircraft state ---
  const [preset, setPreset] = useState(matchedPreset || AIRCRAFT_PRESETS[1]);
  const [customAircraft, setCustomAircraft] = useState(loadCustomAircraft);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [annualHours, setAnnualHours] = useState(200);
  const [totalTime, setTotalTime] = useState(1800);
  const [engineHours, setEngineHours] = useState(urlEngineHours ? parseInt(urlEngineHours) || 900 : 900);
  const [propHours, setPropHours] = useState(400);
  const [annualOverdue, setAnnualOverdue] = useState(false);
  const [upcomingCost, setUpcomingCost] = useState(5000);

  // --- Operating costs ---
  const [fuelRate, setFuelRate] = useState(preset.fuel);
  const [maintRate, setMaintRate] = useState(preset.maintenance);
  const [insuranceYr, setInsuranceYr] = useState(preset.insurance_yr);
  const [hangarYr, setHangarYr] = useState(preset.hangar_yr);
  const [crewType, setCrewType] = useState("private");

  // --- Service accessibility ---
  const [serviceCenters, setServiceCenters] = useState(2); // 0-3
  const [partsAccessibility, setPartsAccessibility] = useState("good");
  const [avionicsSupport, setAvionicsSupport] = useState("supported");

  // --- Location & Regional ---
  const [location, setLocation] = useState(urlState ? "north-america" : "north-america");
  const locationMult = LOCATION_RATES[location] || LOCATION_RATES["north-america"];

  // --- Compliance ---
  const [adsb, setAdsb] = useState(true);
  const [altimeterCert, setAltimeterCert] = useState(true);
  const [transponderCert, setTransponderCert] = useState(true);
  const [staticPortCert, setStaticPortCert] = useState(true);
  const [annualInspection, setAnnualInspection] = useState(true);
  const [airworthinessAlert, setAirworthinessAlert] = useState(false);

  const pickPreset = (p) => {
    setPreset(p);
    setFuelRate(p.fuel);
    setMaintRate(p.maintenance);
    setInsuranceYr(p.insurance_yr);
    setHangarYr(p.hangar_yr);
    setEngineHours(Math.min(engineHours, p.tbo));
    setPropHours(Math.min(propHours, p.tbo_prop || p.tbo));
  };

  const handleAddCustom = (aircraft) => {
    const updated = [...customAircraft, aircraft];
    setCustomAircraft(updated);
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(updated)); } catch {}
    setShowCustomModal(false);
    pickPreset(aircraft);
  };

  const handleDeleteCustom = (id) => {
    const updated = customAircraft.filter((a) => a.id !== id);
    setCustomAircraft(updated);
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(updated)); } catch {}
    if (preset.custom && preset.id === id) pickPreset(AIRCRAFT_PRESETS[1]);
  };

  // --- Calculations ---
  const reserves = preset.custom
    ? { engine: preset.reserveEngine || 25, prop: preset.reserveProp || 5, inspection: preset.reserveInspection || 12 }
    : (RESERVE_RATES[preset.id] || RESERVE_RATES.cirrus_sr22);
  const engineHoursToTBO = preset.tbo - engineHours;
  const propHoursToTBO = (preset.tbo_prop || preset.tbo) - propHours;

  const engineReserveYr = reserves.engine * annualHours;
  const propReserveYr = reserves.prop * annualHours;
  const inspectionReserveYr = reserves.inspection * annualHours;

  // Apply location multipliers
  const adjustedFuelRate = fuelRate * locationMult.fuel;
  const adjustedMaintRate = maintRate * locationMult.maintenance;
  const adjustedHangarYr = hangarYr * locationMult.hangar;
  const adjustedInsuranceYr = insuranceYr * locationMult.insurance;

  const variable = annualHours * (adjustedFuelRate + adjustedMaintRate);
  const fixed = adjustedInsuranceYr + adjustedHangarYr;
  const reservesTotal = engineReserveYr + propReserveYr + inspectionReserveYr;
  const totalAnnual = variable + fixed + reservesTotal;
  const perHour = annualHours > 0 ? totalAnnual / annualHours : 0;
  const monthly = totalAnnual / 12;

  const maintenance = useMemo(() => assessMaintenanceRisk({
    annualHours, engineHoursToTBO, propHoursToTBO, annualOverdue, upcomingCost,
  }), [annualHours, engineHoursToTBO, propHoursToTBO, annualOverdue, upcomingCost]);

  const service = useMemo(() => assessServiceAccessibility({
    serviceCenters, partsAccessibility, avionicsSupport,
  }), [serviceCenters, partsAccessibility, avionicsSupport]);

  const utilizationSweetspot = annualHours >= 150 && annualHours <= 600;
  const clarity = useMemo(() => assessOwnershipClarity({
    maintenanceScore: maintenance.score,
    serviceScore: service.score,
    annualOverdue,
    utilizationSweetspot,
  }), [maintenance.score, service.score, annualOverdue, utilizationSweetspot]);

  // --- Crew limits ---
  const crewLimits = {
    private: { max: 1500, label: "Private pilot · 1,500 hr/yr practical max" },
    commercial_single: { max: 1200, label: "FAR 135 single-pilot · 1,200 hr/yr" },
    commercial_multi: { max: 1000, label: "FAR 121 multi-crew · 1,000 hr/yr" },
  };
  const limit = crewLimits[crewType];
  const overLimit = annualHours > limit.max;

  // --- Smart hints ---
  const hints = [];
  if (annualHours < 100) hints.push({ type: "warn", text: "Very low utilization — fixed costs dominate. Consider fractional ownership." });
  if (utilizationSweetspot) hints.push({ type: "info", text: "Healthy utilization — fixed costs are well-absorbed, per-hour economics are favorable." });
  if (overLimit) hints.push({ type: "alert", text: `⚠ ${annualHours} hr exceeds ${limit.max} hr regulatory limit for ${crewType.replace("_", " ")}.` });
  if (maintenance.projectedEngineGap < 200) hints.push({ type: "warn", text: `Engine overhaul within ~${Math.max(0, maintenance.projectedEngineGap)} hr — budget major reserve now.` });
  if (annualOverdue) hints.push({ type: "alert", text: "Annual inspection overdue — major negotiation red flag for buyer." });
  if (service.score < 40) hints.push({ type: "warn", text: "Limited service network nearby — expect ferry costs and longer downtimes." });

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "transparent" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <GoldLabel>Cost Intelligence · Buyer & Seller Transparency</GoldLabel>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-1 uppercase" style={{ color: "rgba(255,255,255,0.90)" }}>
              Aircraft Operational Cost Calculator
            </h1>
            <p className="text-sm mt-1 max-w-3xl" style={{ color: "rgba(255,255,255,0.60)" }}>
              Not just what the aircraft costs to buy — <b>what it costs to own.</b> Combines flight hours, reserves,
              inspections, maintenance exposure, and service availability into a transparent ownership picture.
            </p>
          </div>
          <div className="shrink-0 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "rgba(255,255,255,0.40)" }}>Pricing</p>
            <CalculatorPricingBadge featureId="opex_calculator" />
          </div>
        </div>

        {/* Ownership Clarity Summary — front & center */}
        <div className="mt-6">
          <ClaritySummary clarity={clarity} maintenance={maintenance} service={service} totalAnnual={totalAnnual} perHour={perHour} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-5">
          {/* Inputs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Aircraft & Utilization */}
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <SectionHeader icon={Plane} title="Aircraft & Utilization" desc="Core aircraft profile" />
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[rgba(255,255,255,0.60)] font-semibold block mb-2">Aircraft preset</label>
                <div className="flex flex-wrap gap-2">
                  {AIRCRAFT_PRESETS.map(p => (
                    <button key={p.id} onClick={() => pickPreset(p)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${preset.id === p.id && !preset.custom ? "border-[#f5c242] bg-[rgba(245,194,66,0.09)] text-[#f5c242]" : "border-[rgba(255,255,255,0.08)] bg-transparent text-[rgba(255,255,255,0.60)] hover:border-[rgba(255,255,255,0.12)]"}`}>
                      <Plane className="w-3 h-3 inline mr-1" /> {p.name}
                    </button>
                  ))}
                  {customAircraft.map(p => (
                    <button key={p.id} onClick={() => pickPreset(p)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all group relative ${preset.custom && preset.id === p.id ? "border-[#5dcaa5] bg-[rgba(16,185,129,0.07)] text-[#5dcaa5]" : "border-[#5dcaa5]/30 bg-transparent text-[#5dcaa5] hover:border-[#5dcaa5]"}`}>
                      <Plane className="w-3 h-3 inline mr-1" /> {p.name}
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteCustom(p.id); }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#e24b4a] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] leading-none">×</span>
                      </button>
                    </button>
                  ))}
                  {canUseCustom ? (
                    <button onClick={() => setShowCustomModal(true)}
                      className="text-xs font-bold px-3 py-2 rounded-xl border border-dashed border-[#5dcaa5]/40 bg-[#5dcaa5]/03 text-[#5dcaa5] hover:bg-[#5dcaa5]/08 transition-all">
                      <Plus className="w-3 h-3 inline mr-1" /> Add Custom
                    </button>
                  ) : (
                    <button disabled className="text-xs font-medium px-3 py-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[rgba(255,255,255,0.35)] cursor-not-allowed"
                      title="Upgrade to Starter or higher to add custom aircraft">
                      <Lock className="w-3 h-3 inline mr-1" /> Add Custom
                    </button>
                  )}
                </div>
              </div>

              <Slider label="Annual flight hours" value={annualHours} onChange={setAnnualHours} min={50} max={1500} step={10} suffix=" hr" />

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[rgba(255,255,255,0.60)] font-semibold block mb-2">Crew profile</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "private", label: "Private (Part 91)" },
                    { id: "commercial_single", label: "Comm. single-pilot" },
                    { id: "commercial_multi", label: "Comm. multi-crew" },
                  ].map(o => (
                    <button key={o.id} onClick={() => setCrewType(o.id)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${crewType === o.id ? "border-[#f5c242] bg-[rgba(245,194,66,0.09)] text-[#f5c242]" : "border-[rgba(255,255,255,0.08)] bg-transparent text-[rgba(255,255,255,0.60)]"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[rgba(255,255,255,0.35)] mt-1.5">{limit.label}</p>
              </div>
            </div>

            {/* Airframe state — reserves & inspections */}
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <SectionHeader icon={Gauge} title="Airframe & Engine State" desc="Hours, reserves & inspections" />
              <div className="grid md:grid-cols-2 gap-4">
                <Slider label="Total Time (TT)" value={totalTime} onChange={setTotalTime} min={0} max={15000} step={50} suffix=" hr" />
                <Slider label={`Engine SMOH (TBO ${preset.tbo} hr)`} value={engineHours} onChange={setEngineHours} min={0} max={preset.tbo} step={25} suffix=" hr" />
                <Slider label={`Prop SPOH (TBO ${preset.tbo_prop} hr)`} value={propHours} onChange={setPropHours} min={0} max={preset.tbo_prop} step={25} suffix=" hr" />
                <Slider label="Known upcoming maintenance ($)" value={upcomingCost} onChange={setUpcomingCost} min={0} max={100000} step={500} suffix=" $" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={annualOverdue} onChange={e => setAnnualOverdue(e.target.checked)} className="accent-[#e24b4a]" />
                <span className="text-sm text-[rgba(255,255,255,0.90)] font-medium">Annual inspection overdue or expiring within 30 days</span>
              </label>
            </div>

            {/* Operating rates */}
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <SectionHeader icon={Fuel} title="Operating Costs" desc="Variable & fixed expenses" />
              <div className="grid md:grid-cols-2 gap-4">
                <Slider label="Fuel $/hr" value={fuelRate} onChange={setFuelRate} min={20} max={1500} step={5} suffix=" $/hr" />
                <Slider label="Maintenance $/hr" value={maintRate} onChange={setMaintRate} min={15} max={1000} step={5} suffix=" $/hr" />
                <Slider label="Insurance $/yr" value={insuranceYr} onChange={setInsuranceYr} min={500} max={80000} step={100} suffix=" $/yr" />
                <Slider label="Hangar $/yr" value={hangarYr} onChange={setHangarYr} min={0} max={40000} step={100} suffix=" $/yr" />
              </div>
            </div>

            {/* Location adjustments */}
            <LocationAdjustments
              location={location}
              onChange={setLocation}
              fuelRate={fuelRate}
              maintRate={maintRate}
              hangarYr={hangarYr}
              insuranceYr={insuranceYr}
            />

            {/* Service accessibility */}
            <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              <SectionHeader icon={MapPin} title="Service Accessibility" desc="Support network in your region" />

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[rgba(255,255,255,0.60)] font-semibold block mb-2">
                  Nearby service centers (within 300 nm)
                </label>
                <div className="flex gap-2">
                  {[
                    { v: 0, label: "None" },
                    { v: 1, label: "1" },
                    { v: 2, label: "2–3" },
                    { v: 3, label: "4+" },
                  ].map(o => (
                    <button key={o.v} onClick={() => setServiceCenters(o.v)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${serviceCenters === o.v ? "border-[#f5c242] bg-[rgba(245,194,66,0.09)] text-[#f5c242]" : "border-[rgba(255,255,255,0.08)] bg-transparent text-[rgba(255,255,255,0.60)]"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[rgba(255,255,255,0.60)] font-semibold block mb-2">Parts accessibility</label>
                <div className="flex flex-wrap gap-2">
                  {["poor", "fair", "good", "excellent"].map(o => (
                    <button key={o} onClick={() => setPartsAccessibility(o)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border capitalize transition-all ${partsAccessibility === o ? "border-[#f5c242] bg-[rgba(245,194,66,0.09)] text-[#f5c242]" : "border-[rgba(255,255,255,0.08)] bg-transparent text-[rgba(255,255,255,0.60)]"}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[rgba(255,255,255,0.60)] font-semibold block mb-2">Avionics support status</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "legacy", label: "Legacy (out of support)" },
                    { v: "supported", label: "Supported" },
                    { v: "modern", label: "Modern / current" },
                  ].map(o => (
                    <button key={o.v} onClick={() => setAvionicsSupport(o.v)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${avionicsSupport === o.v ? "border-[#f5c242] bg-[rgba(245,194,66,0.09)] text-[#f5c242]" : "border-[rgba(255,255,255,0.08)] bg-transparent text-[rgba(255,255,255,0.60)]"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results column */}
          <div className="space-y-3">
            <StatCard label="Total / Year" value={Math.round(totalAnnual)} sub={`Incl. reserves + location (${locationMult.fuel}× fuel)`} icon={TrendingUp} />
            <StatCard label="Monthly Ownership" value={Math.round(monthly)} sub="Year ÷ 12" icon={Calculator} accent="#4e8ef7" />
            <StatCard label="Cost / Flight Hour" value={Math.round(perHour)} sub="True $/hr" icon={Gauge} accent="#5dcaa5" />
            <StatCard label="Variable (fuel + maint)" value={Math.round(variable)} sub={`${annualHours} hr (adj.)`} icon={Fuel} accent="#4e8ef7" />
            <StatCard label="Fixed (insurance + hangar)" value={Math.round(fixed)} sub="Adjusted for region" icon={Wrench} accent="#f5c242" />

            <div className="pt-2">
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#f5c242] mb-2">Reserves (per-hour accrual)</p>
              <div className="space-y-2">
                <ReserveCard
                  label="Engine Reserve"
                  perHour={reserves.engine}
                  annualCost={engineReserveYr}
                  hoursRemaining={engineHoursToTBO}
                  status={engineHoursToTBO < 200 ? "Due Soon" : engineHoursToTBO < 500 ? "Plan Ahead" : "Healthy"}
                  color={engineHoursToTBO < 200 ? "#e24b4a" : engineHoursToTBO < 500 ? "#D4A017" : "#5dcaa5"}
                />
                <ReserveCard
                  label="Prop Reserve"
                  perHour={reserves.prop}
                  annualCost={propReserveYr}
                  hoursRemaining={propHoursToTBO}
                  status={propHoursToTBO < 200 ? "Due Soon" : "Healthy"}
                  color={propHoursToTBO < 200 ? "#e24b4a" : "#5dcaa5"}
                />
                <ReserveCard
                  label="Inspection Reserve"
                  perHour={reserves.inspection}
                  annualCost={inspectionReserveYr}
                  status={annualOverdue ? "Overdue" : "On Track"}
                  color={annualOverdue ? "#e24b4a" : "#5dcaa5"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Schedule + Compliance */}
        <div className="grid lg:grid-cols-2 gap-4 mt-5">
          <MaintenanceSchedule
            annualHours={annualHours}
            engineHours={engineHours}
            engineTBO={preset.tbo}
            annualOverdue={annualOverdue}
          />
          <ComplianceTracker
            adsb={adsb}
            altimeterCert={altimeterCert}
            transponderCert={transponderCert}
            staticPortCert={staticPortCert}
            annualInspection={annualInspection}
            airworthinessAlert={airworthinessAlert}
          />
        </div>

        {/* Compliance controls (hidden in accordion) */}
        <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-3" style={{ color: "#4e8ef7" }}>Certification Status</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { label: "ADS-B", state: adsb, setState: setAdsb },
              { label: "Altimeter Cert", state: altimeterCert, setState: setAltimeterCert },
              { label: "Transponder Cert", state: transponderCert, setState: setTransponderCert },
              { label: "Static Port Cert", state: staticPortCert, setState: setStaticPortCert },
              { label: "Annual Inspection", state: annualInspection, setState: setAnnualInspection },
              { label: "Airworthiness Alert", state: airworthinessAlert, setState: setAirworthinessAlert },
            ].map(item => (
              <label key={item.label} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.state}
                  onChange={e => item.setState(e.target.checked)}
                  className={`accent-${item.state ? "[#5dcaa5]" : "[#e24b4a]"}`}
                />
                <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.60)" }}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Fleet Panel */}
        <div className="mt-5">
          <FleetPanel
            presets={AIRCRAFT_PRESETS}
            customAircraft={customAircraft}
            location={location}
          />
        </div>

        {/* Hints */}
        {hints.length > 0 && (
          <div className="mt-5 space-y-2">
            {hints.map((h, i) => (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${
                h.type === "alert" ? "bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)] text-[#e24b4a]" :
                h.type === "warn" ? "bg-[rgba(232,168,58,0.08)] border-[rgba(232,168,58,0.25)] text-[#f5c242]" :
                "bg-[rgba(24,95,165,0.06)] border-[rgba(24,95,165,0.2)] text-[#4e8ef7]"
              }`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{h.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Buyer / Seller insight */}
        <div className="mt-5 grid md:grid-cols-2 gap-3">
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4" style={{ color: "#5dcaa5" }} />
              <p className="text-[11px] uppercase tracking-[0.15em] font-bold" style={{ color: "#5dcaa5" }}>For the Buyer</p>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.70)" }}>
              Understand the <b>real operating burden</b>. Beyond purchase price, factor in <b>${Math.round(reservesTotal).toLocaleString()}/yr in reserves</b> and near-term maintenance exposure.
            </p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4" style={{ color: "#4e8ef7" }} />
              <p className="text-[11px] uppercase tracking-[0.15em] font-bold" style={{ color: "#4e8ef7" }}>For the Seller</p>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.70)" }}>
              Present the aircraft with <b>logic and credibility</b>. A <b>{clarity.label}</b> clarity score builds buyer confidence and defends asking price.
            </p>
          </div>
        </div>

        {/* Custom Aircraft Modal */}
        <CustomAircraftModal open={showCustomModal} onClose={() => setShowCustomModal(false)} onSave={handleAddCustom} />

        {/* CTA — Service finder */}
        <div className="mt-5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.20)" }}>
          <div>
            <GoldLabel>Need real quotes?</GoldLabel>
            <p className="text-sm font-bold mt-1" style={{ color: "rgba(255,255,255,0.90)" }}>Compare insurance, MRO & hangar rates from verified providers near you.</p>
          </div>
          <a href="/service-finder" className="shrink-0 font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-opacity hover:opacity-90" style={{ background: "#f5c242", color: "#04060a" }}>
            <FileText className="w-4 h-4" /> Find services
          </a>
        </div>
      </div>
    </div>
  );
}
import { useState, useMemo } from "react";
import { Calculator, TrendingUp, Fuel, Wrench, FileText, Plane, Info, ShieldCheck, MapPin, Gauge, Cpu } from "lucide-react";
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

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">{children}</p>;
}

function Slider({ label, value, onChange, min, max, step, hint, suffix = "" }) {
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <label className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold">{label}</label>
        <span className="text-sm font-black text-[#1A1814]">{value.toLocaleString()}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="w-full mt-1 accent-[#0B2D5B]" />
      {hint && <p className="text-[10px] text-[#AAA49C] mt-1 flex items-center gap-1"><Info className="w-2.5 h-2.5" /> {hint}</p>}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, accent = "#0B2D5B" }) {
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

function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-2.5 pb-3 border-b border-black/[0.06]">
      <div className="w-8 h-8 rounded-lg bg-[#0B2D5B] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-[13px] font-black text-[#1A1814] uppercase tracking-tight">{title}</p>
        {desc && <p className="text-[10px] text-[#6B6560]">{desc}</p>}
      </div>
    </div>
  );
}

export default function OpexCalculator() {
  useAutoTrack("opex_calculator");

  // --- Aircraft state ---
  const [preset, setPreset] = useState(AIRCRAFT_PRESETS[1]);
  const [annualHours, setAnnualHours] = useState(200);
  const [totalTime, setTotalTime] = useState(1800);
  const [engineHours, setEngineHours] = useState(900);
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
  const [location, setLocation] = useState("north-america");
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
    setPropHours(Math.min(propHours, p.tbo_prop));
  };

  // --- Calculations ---
  const reserves = RESERVE_RATES[preset.id] || RESERVE_RATES.cirrus_sr22;
  const engineHoursToTBO = preset.tbo - engineHours;
  const propHoursToTBO = preset.tbo_prop - propHours;

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
    <div className="min-h-screen bg-[#F7F4EF] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <GoldLabel>Cost Intelligence · Buyer & Seller Transparency</GoldLabel>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight mt-1 uppercase">
          Aircraft Operational Cost Calculator
        </h1>
        <p className="text-[#6B6560] text-sm mt-1 max-w-3xl">
          Not just what the aircraft costs to buy — <b>what it costs to own.</b> Combines flight hours, reserves,
          inspections, maintenance exposure, and service availability into a transparent ownership picture.
        </p>

        {/* Ownership Clarity Summary — front & center */}
        <div className="mt-6">
          <ClaritySummary clarity={clarity} maintenance={maintenance} service={service} totalAnnual={totalAnnual} perHour={perHour} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mt-5">
          {/* Inputs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Aircraft & Utilization */}
            <div className="bg-white border border-black/[0.07] rounded-2xl p-5 space-y-4">
              <SectionHeader icon={Plane} title="Aircraft & Utilization" desc="Core aircraft profile" />
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-2">Aircraft preset</label>
                <div className="flex flex-wrap gap-2">
                  {AIRCRAFT_PRESETS.map(p => (
                    <button key={p.id} onClick={() => pickPreset(p)}
                      className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${preset.id === p.id ? "border-[#0B2D5B] bg-[rgba(11,45,91,0.06)] text-[#0B2D5B]" : "border-black/10 bg-white text-[#6B6560] hover:border-black/20"}`}>
                      <Plane className="w-3 h-3 inline mr-1" /> {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <Slider label="Annual flight hours" value={annualHours} onChange={setAnnualHours} min={50} max={1500} step={10} suffix=" hr" />

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-2">Crew profile</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "private", label: "Private (Part 91)" },
                    { id: "commercial_single", label: "Comm. single-pilot" },
                    { id: "commercial_multi", label: "Comm. multi-crew" },
                  ].map(o => (
                    <button key={o.id} onClick={() => setCrewType(o.id)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${crewType === o.id ? "border-[#0B2D5B] bg-[rgba(11,45,91,0.06)] text-[#0B2D5B]" : "border-black/10 bg-white text-[#6B6560]"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#AAA49C] mt-1.5">{limit.label}</p>
              </div>
            </div>

            {/* Airframe state — reserves & inspections */}
            <div className="bg-white border border-black/[0.07] rounded-2xl p-5 space-y-4">
              <SectionHeader icon={Gauge} title="Airframe & Engine State" desc="Hours, reserves & inspections" />
              <div className="grid md:grid-cols-2 gap-4">
                <Slider label="Total Time (TT)" value={totalTime} onChange={setTotalTime} min={0} max={15000} step={50} suffix=" hr" />
                <Slider label={`Engine SMOH (TBO ${preset.tbo} hr)`} value={engineHours} onChange={setEngineHours} min={0} max={preset.tbo} step={25} suffix=" hr" />
                <Slider label={`Prop SPOH (TBO ${preset.tbo_prop} hr)`} value={propHours} onChange={setPropHours} min={0} max={preset.tbo_prop} step={25} suffix=" hr" />
                <Slider label="Known upcoming maintenance ($)" value={upcomingCost} onChange={setUpcomingCost} min={0} max={100000} step={500} suffix=" $" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={annualOverdue} onChange={e => setAnnualOverdue(e.target.checked)} className="accent-[#C0392B]" />
                <span className="text-sm text-[#1A1814] font-medium">Annual inspection overdue or expiring within 30 days</span>
              </label>
            </div>

            {/* Operating rates */}
            <div className="bg-white border border-black/[0.07] rounded-2xl p-5 space-y-4">
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
            <div className="bg-white border border-black/[0.07] rounded-2xl p-5 space-y-4">
              <SectionHeader icon={MapPin} title="Service Accessibility" desc="Support network in your region" />

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-2">
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
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${serviceCenters === o.v ? "border-[#0B2D5B] bg-[rgba(11,45,91,0.06)] text-[#0B2D5B]" : "border-black/10 bg-white text-[#6B6560]"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-2">Parts accessibility</label>
                <div className="flex flex-wrap gap-2">
                  {["poor", "fair", "good", "excellent"].map(o => (
                    <button key={o} onClick={() => setPartsAccessibility(o)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border capitalize transition-all ${partsAccessibility === o ? "border-[#0B2D5B] bg-[rgba(11,45,91,0.06)] text-[#0B2D5B]" : "border-black/10 bg-white text-[#6B6560]"}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-2">Avionics support status</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "legacy", label: "Legacy (out of support)" },
                    { v: "supported", label: "Supported" },
                    { v: "modern", label: "Modern / current" },
                  ].map(o => (
                    <button key={o.v} onClick={() => setAvionicsSupport(o.v)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${avionicsSupport === o.v ? "border-[#0B2D5B] bg-[rgba(11,45,91,0.06)] text-[#0B2D5B]" : "border-black/10 bg-white text-[#6B6560]"}`}>
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
            <StatCard label="Monthly Ownership" value={Math.round(monthly)} sub="Year ÷ 12" icon={Calculator} accent="#185FA5" />
            <StatCard label="Cost / Flight Hour" value={Math.round(perHour)} sub="True $/hr" icon={Gauge} accent="#0F7A56" />
            <StatCard label="Variable (fuel + maint)" value={Math.round(variable)} sub={`${annualHours} hr (adj.)`} icon={Fuel} accent="#185FA5" />
            <StatCard label="Fixed (insurance + hangar)" value={Math.round(fixed)} sub="Adjusted for region" icon={Wrench} accent="#A67C00" />

            <div className="pt-2">
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#E8A83A] mb-2">Reserves (per-hour accrual)</p>
              <div className="space-y-2">
                <ReserveCard
                  label="Engine Reserve"
                  perHour={reserves.engine}
                  annualCost={engineReserveYr}
                  hoursRemaining={engineHoursToTBO}
                  status={engineHoursToTBO < 200 ? "Due Soon" : engineHoursToTBO < 500 ? "Plan Ahead" : "Healthy"}
                  color={engineHoursToTBO < 200 ? "#C0392B" : engineHoursToTBO < 500 ? "#E8A83A" : "#0F7A56"}
                />
                <ReserveCard
                  label="Prop Reserve"
                  perHour={reserves.prop}
                  annualCost={propReserveYr}
                  hoursRemaining={propHoursToTBO}
                  status={propHoursToTBO < 200 ? "Due Soon" : "Healthy"}
                  color={propHoursToTBO < 200 ? "#C0392B" : "#0F7A56"}
                />
                <ReserveCard
                  label="Inspection Reserve"
                  perHour={reserves.inspection}
                  annualCost={inspectionReserveYr}
                  status={annualOverdue ? "Overdue" : "On Track"}
                  color={annualOverdue ? "#C0392B" : "#0F7A56"}
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
        <div className="mt-4 bg-white border border-black/[0.07] rounded-2xl p-4">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#0B2D5B] mb-3">Certification Status</p>
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
                  className={`accent-${item.state ? "[#0F7A56]" : "[#C0392B]"}`}
                />
                <span className="text-[11px] text-[#6B6560] font-medium">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hints */}
        {hints.length > 0 && (
          <div className="mt-5 space-y-2">
            {hints.map((h, i) => (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${
                h.type === "alert" ? "bg-[rgba(192,57,43,0.06)] border-[rgba(192,57,43,0.2)] text-[#C0392B]" :
                h.type === "warn" ? "bg-[rgba(232,168,58,0.08)] border-[rgba(232,168,58,0.25)] text-[#A67C00]" :
                "bg-[rgba(24,95,165,0.06)] border-[rgba(24,95,165,0.2)] text-[#185FA5]"
              }`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{h.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Buyer / Seller insight */}
        <div className="mt-5 grid md:grid-cols-2 gap-3">
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-[#0F7A56]" />
              <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#0F7A56]">For the Buyer</p>
            </div>
            <p className="text-[13px] text-[#4A4845] leading-relaxed">
              Understand the <b>real operating burden</b>. Beyond purchase price, factor in <b>${Math.round(reservesTotal).toLocaleString()}/yr in reserves</b> and near-term maintenance exposure.
            </p>
          </div>
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-[#0B2D5B]" />
              <p className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#0B2D5B]">For the Seller</p>
            </div>
            <p className="text-[13px] text-[#4A4845] leading-relaxed">
              Present the aircraft with <b>logic and credibility</b>. A <b>{clarity.label}</b> clarity score builds buyer confidence and defends asking price.
            </p>
          </div>
        </div>

        {/* CTA — Service finder */}
        <div className="mt-5 bg-[#0B2D5B] text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <GoldLabel>Need real quotes?</GoldLabel>
            <p className="text-sm font-bold mt-1">Compare insurance, MRO & hangar rates from verified providers near you.</p>
          </div>
          <a href="/service-finder" className="shrink-0 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] font-bold text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Find services
          </a>
        </div>
      </div>
    </div>
  );
}
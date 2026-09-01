import { useState } from "react";
import { X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = [
  { id: "identity", label: "Aircraft Identity", desc: "Basic info & registration" },
  { id: "pricing", label: "Pricing & Value", desc: "Ask price & market context" },
  { id: "times", label: "Airframe & Engine", desc: "Hours, SMOH, condition" },
  { id: "critical", label: "Critical Systems", desc: "Autopilot, O2, gear status" },
  { id: "maintenance", label: "Maintenance History", desc: "Post-2018 upgrades & work" },
  { id: "photos", label: "Photos & Documents", desc: "Visual proof of condition" },
  { id: "review", label: "Final Review", desc: "Quality checklist & publish" },
];

const CRITICAL_FIELDS = {
  identity: ["make", "model", "year", "registration"],
  pricing: ["asking_price"],
  times: ["total_time", "engine_hours", "tbo"],
  critical: ["autopilot_status", "o2_system", "useful_load"],
  maintenance: ["post_2018_narrative"],
  photos: [],
  review: [],
};

export default function AircraftWizard({ open, onClose, onPublish }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    // Identity
    make: "", model: "", year: "", registration: "",
    // Pricing
    asking_price: "", currency: "USD",
    // Times
    total_time: "", engine_hours: "", tbo: "",
    // Critical
    autopilot_status: "", o2_system: "", useful_load: "",
    // Maintenance
    post_2018_narrative: "",
    // General
    condition_summary: "", avionics: "", source_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const stepId = STEPS[currentStep].id;
  const required = CRITICAL_FIELDS[stepId] || [];
  const isComplete = required.every(f => form[f]?.toString().trim());

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (!isComplete) return;
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handlePublish = async () => {
    setSaving(true);
    setError(null);
    try {
      const me = await base44.auth.me();
      const listing = await base44.entities.AircraftListing.create({
        make: form.make,
        model: form.model,
        year: parseInt(form.year),
        registration: form.registration,
        asking_price: parseFloat(form.asking_price),
        currency: form.currency,
        total_time: parseFloat(form.total_time),
        engine_hours: parseFloat(form.engine_hours),
        tbo: parseFloat(form.tbo),
        avionics: form.avionics,
        ai_summary: form.condition_summary,
        source_url: form.source_url,
        status: "draft",
        visibility: "private",
        owner: me?.id,
        // Custom fields stored in ai_summary metadata
        _wizard_metadata: JSON.stringify({
          autopilot_status: form.autopilot_status,
          o2_system: form.o2_system,
          useful_load: form.useful_load,
          post_2018_narrative: form.post_2018_narrative,
        }),
      });
      onPublish?.(listing);
      onClose();
    } catch (e) {
      setError(e.message || "Failed to create listing");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.07] flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-black text-[#E8A83A]">
              {currentStep + 1} / {STEPS.length}
            </p>
            <h2 className="text-xl font-black text-[#1A1814] mt-1">{STEPS[currentStep].label}</h2>
          </div>
          <button onClick={onClose} className="text-[#AAA49C] hover:text-[#1A1814] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-black/5">
          <div className="h-full bg-[#0B2D5B] transition-all" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {stepId === "identity" && (
            <div className="space-y-4">
              <p className="text-[11px] text-[#3a3530] mb-4">Enter the aircraft's basic identification information.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Manufacturer</label>
                  <input type="text" value={form.make} onChange={e => handleChange("make", e.target.value)} placeholder="Beechcraft, Cessna..." className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Model</label>
                  <input type="text" value={form.model} onChange={e => handleChange("model", e.target.value)} placeholder="B36TC, 172, P-28..." className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Year</label>
                  <input type="number" value={form.year} onChange={e => handleChange("year", e.target.value)} placeholder="2000" className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Registration (N-Number)</label>
                  <input type="text" value={form.registration} onChange={e => handleChange("registration", e.target.value)} placeholder="N12345" className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
                </div>
              </div>
            </div>
          )}

          {stepId === "pricing" && (
            <div className="space-y-4">
              <div className="bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.2)] rounded-lg p-3 mb-4">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#A67C00] mb-1">💡 Pricing Tip</p>
                <p className="text-[11px] text-[#3a3530]">Missing asking price eliminates 70% of serious buyers. Be specific: "$245,000" beats "negotiable".</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Asking Price (USD)</label>
                <div className="flex gap-2">
                  <input type="number" value={form.asking_price} onChange={e => handleChange("asking_price", e.target.value)} placeholder="250000" className="flex-1 px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
                  <select value={form.currency} onChange={e => handleChange("currency", e.target.value)} className="px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]">
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Brief Condition Summary</label>
                <textarea value={form.condition_summary} onChange={e => handleChange("condition_summary", e.target.value)} placeholder="Well-maintained, recent avionics upgrade, no damage history..." rows={4} className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017] resize-none" />
              </div>
            </div>
          )}

          {stepId === "times" && (
            <div className="space-y-4">
              <p className="text-[11px] text-[#3a3530] mb-4">Engine hours since major overhaul (SMOH) are critical for buyer financing and value.</p>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Total Airframe Hours (TT)</label>
                <input type="number" value={form.total_time} onChange={e => handleChange("total_time", e.target.value)} placeholder="4171" className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Engine Hours Since Major Overhaul (SMOH)</label>
                <input type="number" value={form.engine_hours} onChange={e => handleChange("engine_hours", e.target.value)} placeholder="283" className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Engine TBO (Hours)</label>
                <input type="number" value={form.tbo} onChange={e => handleChange("tbo", e.target.value)} placeholder="2000" className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
              </div>
            </div>
          )}

          {stepId === "critical" && (
            <div className="space-y-4">
              <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.15)] rounded-lg p-3 mb-4">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#C0392B] mb-1">⚠️ Critical Data</p>
                <p className="text-[11px] text-[#3a3530]">Missing any of these creates buyer friction & lost inquiries.</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Autopilot Status</label>
                <input type="text" value={form.autopilot_status} onChange={e => handleChange("autopilot_status", e.target.value)} placeholder="King KFC 150 with altitude hold  OR  None installed" className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
                <p className="text-[9px] text-[#AAA49C] mt-1">Be specific: brand/model or state if not equipped</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">O2 System Status</label>
                <input type="text" value={form.o2_system} onChange={e => handleChange("o2_system", e.target.value)} placeholder="Built-in O2 system, bottle hydro current to 2026" className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Useful Load (lbs)</label>
                <input type="text" value={form.useful_load} onChange={e => handleChange("useful_load", e.target.value)} placeholder="850 lbs (equipped weight 3,600 lbs)" className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
              </div>
            </div>
          )}

          {stepId === "maintenance" && (
            <div className="space-y-4">
              <div className="bg-[rgba(15,122,86,0.08)] border border-[rgba(15,122,86,0.15)] rounded-lg p-3 mb-4">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#0F7A56] mb-1">✓ Buyer Confidence Signal</p>
                <p className="text-[11px] text-[#3a3530]">Recent maintenance shows ongoing care. Include specific dates & work.</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Post-2018 Maintenance Narrative</label>
                <textarea value={form.post_2018_narrative} onChange={e => handleChange("post_2018_narrative", e.target.value)} placeholder="2023: Concorde battery installed. 2024: Gear swing & brake inspection. 2025: Annual compressions 75+/80, cowl flaps rebuilt." rows={4} className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017] resize-none" />
                <p className="text-[9px] text-[#AAA49C] mt-1">List major work with years. Buyers want proof of care since last major refresh.</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Avionics Package</label>
                <input type="text" value={form.avionics} onChange={e => handleChange("avionics", e.target.value)} placeholder="IFD 440, King HSI 525, S-Tec 55 autopilot..." className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
              </div>
            </div>
          )}

          {stepId === "photos" && (
            <div className="space-y-4">
              <p className="text-[11px] text-[#3a3530] mb-4">Photos & documents aren't required to create the listing, but they increase buyer confidence & inquiries by 3-5x.</p>
              <div className="bg-[#F7F4EF] rounded-lg p-4 text-center">
                <p className="text-[12px] font-semibold text-[#3a3530]">High-Impact Photo Checklist:</p>
                <ul className="text-[11px] text-[#3a3530] mt-2 space-y-1 text-left">
                  <li>✓ Panel closeup (avionics clarity)</li>
                  <li>✓ Engine compartment (condition proof)</li>
                  <li>✓ Cabin looking aft (interior quality)</li>
                  <li>✓ Exterior profile (overall condition)</li>
                  <li>✓ Logbook sample page (authenticity)</li>
                </ul>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#3d3840] font-semibold block mb-1">Original Listing URL (if importing)</label>
                <input type="url" value={form.source_url} onChange={e => handleChange("source_url", e.target.value)} placeholder="https://..." className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#D4A017]" />
              </div>
            </div>
          )}

          {stepId === "review" && (
            <div className="space-y-3">
              <p className="text-[11px] text-[#3a3530] mb-4">Review your listing before publishing. Quality check:</p>
              <div className="space-y-2">
                {[
                  { label: "Price stated", value: form.asking_price },
                  { label: "Autopilot status clear", value: form.autopilot_status },
                  { label: "Useful load provided", value: form.useful_load },
                  { label: "O2 system documented", value: form.o2_system },
                  { label: "Recent maintenance listed", value: form.post_2018_narrative },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 p-2.5 bg-[#F7F4EF] rounded-lg">
                    {item.value ? (
                      <CheckCircle2 className="w-4 h-4 text-[#0F7A56] shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#C0392B] shrink-0" />
                    )}
                    <span className={`text-[11px] font-medium ${item.value ? "text-[#0F7A56]" : "text-[#C0392B]"}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-[rgba(24,95,165,0.08)] border border-[rgba(24,95,165,0.15)] rounded-lg p-3 mt-4">
                <p className="text-[10px] font-bold text-[#185FA5] mb-1">📊 Estimated Buyer Reach</p>
                <p className="text-[11px] text-[#3a3530]">With all critical fields: 80-90% of qualified buyer pool. Missing fields: 30-40%.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] rounded-lg p-3 text-[#C0392B] text-[11px]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-black/[0.07] flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-black/10 text-[#3a3530] hover:border-[#D4A017] disabled:opacity-40 text-sm font-semibold transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isComplete}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-40 text-white text-sm font-black transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#D4A017] hover:bg-[#A67C00] disabled:opacity-40 text-white text-sm font-black transition-colors"
            >
              <Zap className="w-4 h-4" />
              {saving ? "Publishing…" : "Create Listing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
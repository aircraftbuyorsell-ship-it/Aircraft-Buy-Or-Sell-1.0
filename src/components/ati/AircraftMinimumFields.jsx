import { AlertCircle, CheckCircle2 } from "lucide-react";
import { resolveTboFromForm } from "@/lib/aircraftInput";

const FIELDS = [
  ["year", "Year", true, "2005"], ["make", "Make", true, "Cessna"], ["model", "Model", true, "172S"],
  ["engine_model", "Engine model", false, "IO-360-L2A"],
  ["total_time", "Airframe TT", false, "3200"], ["engine_hours", "Engine SMOH", false, "850"],
  ["tbo", "Engine TBO", false, "2000"], ["asking_price", "Asking Price", false, "85000"],
];
const NUMERIC = new Set(["year", "total_time", "engine_hours", "tbo", "asking_price"]);

export default function AircraftMinimumFields({ details, onChange, status }) {
  const found = status === "found";
  const tboInfo = resolveTboFromForm(details);

  return (
    <section className="space-y-4" aria-labelledby="minimum-details-title">
      <div className={`flex gap-3 rounded-lg border p-3 ${found ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
        {found ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />}
        <div><p className="text-sm font-semibold text-foreground">{found ? "FAA registry record verified" : "No complete FAA record found"}</p><p className="text-sm text-muted-foreground">{found ? "Review the returned identity details and add any missing information." : "Enter year, make and model to continue with a free valuation."}</p></div>
      </div>
      <div><h2 id="minimum-details-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Confirm Aircraft Details</h2><p className="mt-1 text-sm text-muted-foreground">Year, make and model are required. TBO auto-resolves from the engine model.</p></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map(([key, label, required, placeholder]) => (
          <label key={key} className="text-sm font-medium text-foreground">{label}{required && <span className="text-primary"> *</span>}
            <input value={details[key] || ""} onChange={(event) => onChange(key, event.target.value)} placeholder={placeholder} inputMode={NUMERIC.has(key) ? "numeric" : "text"} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
          </label>
        ))}
      </div>
      {tboInfo.matched && (
        <div className="inline-flex items-center gap-1 rounded-full bg-[#D4A017]/10 border border-[#D4A017]/30 px-2.5 py-1 text-[11px] font-black text-[#A67C00]">
          {tboInfo.matched_prefix} · TBO {tboInfo.tbo}h · {tboInfo.fuel}
        </div>
      )}
      {!tboInfo.matched && tboInfo.engineModel && (
        <p className="text-xs text-muted-foreground">Engine “{tboInfo.engineModel}” not in TBO table — enter TBO manually.</p>
      )}
    </section>
  );
}
import { AlertCircle, CheckCircle2 } from "lucide-react";

const FIELDS = [
  ["year", "Year", true, "2005"], ["make", "Make", true, "Cessna"], ["model", "Model", true, "172S"],
  ["total_time", "Airframe TT", false, "3200"], ["engine_hours", "Engine SMOH", false, "850"],
  ["tbo", "Engine TBO", false, "1800"], ["asking_price", "Asking Price", false, "85000"],
];

export default function AircraftMinimumFields({ details, onChange, status }) {
  const found = status === "found";
  return (
    <section className="space-y-4" aria-labelledby="minimum-details-title">
      <div className={`flex gap-3 rounded-lg border p-3 ${found ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
        {found ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />}
        <div><p className="text-sm font-semibold text-foreground">{found ? "Aircraft record found" : "No complete record found"}</p><p className="text-sm text-muted-foreground">{found ? "Review the known details and fill any gaps." : "Enter the 3 required identity fields to continue."}</p></div>
      </div>
      <div><h2 id="minimum-details-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Confirm Aircraft Details</h2><p className="mt-1 text-sm text-muted-foreground">Year, make and model are the minimum required for ATI Quick Score.</p></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map(([key, label, required, placeholder]) => <label key={key} className="text-sm font-medium text-foreground">{label}{required && <span className="text-primary"> *</span>}<input value={details[key] || ""} onChange={(event) => onChange(key, event.target.value)} placeholder={placeholder} inputMode={["year","total_time","engine_hours","tbo","asking_price"].includes(key) ? "numeric" : "text"} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" /></label>)}
      </div>
    </section>
  );
}
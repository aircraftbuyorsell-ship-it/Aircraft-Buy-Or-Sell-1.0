import { CalendarDays, FileText, Gauge, GitBranch, Landmark, Mail, Plane } from "lucide-react";

const nodes = [
  { label: "ATI Score", value: "84", icon: Gauge },
  { label: "Valuation", value: "Market range", icon: GitBranch },
  { label: "Documents", value: "12/12", icon: FileText },
  { label: "Registry", value: "Verified", icon: Landmark },
];

export default function IntraZonePreview({ aircraft }) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-slate-950 p-4 text-slate-100 shadow-2xl">
      <div className="mb-3 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
        <span>{aircraft.model}</span><span>ATI {aircraft.score}</span>
      </div>
      <div className="grid grid-cols-4 items-center gap-2">
        {nodes.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-center">
            <Icon className="mx-auto mb-1 h-4 w-4 text-primary" /><p className="truncate text-[9px] font-semibold">{label}</p><p className="truncate text-[8px] text-slate-400">{value}</p>
          </div>
        ))}
      </div>
      <div className="my-3 flex items-center justify-center gap-3 text-primary"><Mail className="h-4 w-4" /><span className="h-px flex-1 bg-slate-700" /><Plane className="h-8 w-8" /><span className="h-px flex-1 bg-slate-700" /><CalendarDays className="h-4 w-4" /></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full w-2/3 rounded-full bg-primary" /></div>
    </div>
  );
}
import { BarChart3, CheckCircle2, CircleDollarSign, FileText, UserRound } from "lucide-react";

const rows = [
  { label: "ATI Report", icon: FileText },
  { label: "Owner", icon: UserRound },
  { label: "Costs", icon: CircleDollarSign },
];

export default function AircraftDataCard({ aircraft }) {
  return (
    <aside className="w-full max-w-[280px] rounded-2xl border border-border bg-card/90 p-5 text-card-foreground shadow-xl backdrop-blur-xl">
      <p className="text-2xl font-black tracking-tight">{aircraft.registration}</p>
      <p className="mb-4 text-sm text-muted-foreground">{aircraft.model}</p>
      <div className="mb-3 flex items-center justify-between border-y border-border py-3">
        <span className="font-semibold">ATI {aircraft.score}</span><BarChart3 className="h-5 w-5 text-accent" />
      </div>
      <div className="mb-4 flex items-center gap-2 text-xs font-medium text-foreground">
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />{aircraft.status}
      </div>
      <div className="mb-4">
        <div className="mb-2 flex justify-between text-xs"><span>Deal readiness</span><b>{aircraft.readiness}%</b></div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${aircraft.readiness}%` }} /></div>
      </div>
      {rows.map(({ label, icon: Icon }) => (
        <div key={label} className="flex min-h-11 items-center justify-between border-t border-border text-xs font-semibold">
          <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span><span aria-hidden="true">→</span>
        </div>
      ))}
    </aside>
  );
}
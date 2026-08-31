import { Plane, ShieldCheck } from "lucide-react";

export default function AircraftIdentityChip({ aircraft }) {
  if (!aircraft?.registration) return null;
  const score = aircraft.ati_score ?? aircraft.atiScore;
  return <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold-bg px-3 py-2.5">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/15 text-gold"><Plane className="h-4 w-4" /></div>
    <div className="min-w-0 flex-1"><p className="font-mono text-xs font-black tracking-wider text-foreground">{aircraft.registration}</p><p className="truncate text-[11px] text-muted-foreground">{[aircraft.make, aircraft.model, aircraft.year].filter(Boolean).join(" · ") || "Digital Twin initialized"}</p></div>
    {score !== undefined && <div className="flex h-10 w-10 flex-col items-center justify-center rounded-full border-2 border-gold bg-card"><ShieldCheck className="h-3 w-3 text-gold" /><span className="text-[10px] font-black text-foreground">{Math.round(score)}</span></div>}
  </div>;
}
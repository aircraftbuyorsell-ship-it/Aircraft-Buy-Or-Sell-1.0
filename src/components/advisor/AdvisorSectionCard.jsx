import { LockKeyhole, ShieldCheck } from "lucide-react";
import SourcePill from "./SourcePill";

export default function AdvisorSectionCard({ title, source, icon: Icon = ShieldCheck, children, locked = false }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold"><Icon className="h-4 w-4 text-primary" />{title}</h3>
        {source && <SourcePill source={source} />}
      </div>
      <div className={locked ? "pointer-events-none select-none blur-[7px]" : ""}>{children}</div>
      {locked && <div className="absolute inset-0 flex items-center justify-center bg-card/30 backdrop-blur-[2px]"><div className="mx-5 flex max-w-sm items-center justify-center rounded-xl border border-primary/40 bg-secondary px-5 py-4 text-center text-xs font-bold text-secondary-foreground shadow-lg"><LockKeyhole className="mr-2 h-4 w-4 shrink-0 text-primary" />Unlock verified evidence in your aircraft report</div></div>}
    </div>
  );
}
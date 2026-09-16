import { LockKeyhole, ShieldCheck } from "lucide-react";
import SourcePill from "./SourcePill";

export default function AdvisorSectionCard({ title, source, icon: Icon = ShieldCheck, children, locked = false }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#102033]/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-black tracking-tight"><Icon className="h-4 w-4 text-[#b98427]" />{title}</h3>
        {source && <SourcePill source={source} />}
      </div>
      <div className={locked ? "pointer-events-none select-none blur-[6px]" : ""}>{children}</div>
      {locked && <div className="absolute inset-x-5 bottom-5 flex items-center justify-center rounded-xl border border-primary/30 bg-secondary/95 px-4 py-3 text-xs font-bold text-secondary-foreground shadow-md"><LockKeyhole className="mr-2 h-4 w-4 text-primary" />Included in the paid aircraft report</div>}
    </div>
  );
}
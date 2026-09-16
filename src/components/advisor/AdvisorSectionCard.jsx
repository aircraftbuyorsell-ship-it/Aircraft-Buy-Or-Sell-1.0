import { ShieldCheck } from "lucide-react";
import SourcePill from "./SourcePill";

export default function AdvisorSectionCard({ title, source, icon: Icon = ShieldCheck, children }) {
  return (
    <div className="rounded-2xl border border-[#102033]/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-black tracking-tight">
          <Icon className="h-4 w-4 text-[#b98427]" />
          {title}
        </h3>
        {source && <SourcePill source={source} />}
      </div>
      {children}
    </div>
  );
}
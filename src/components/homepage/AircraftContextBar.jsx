import { ArrowRight, CircleCheck, Plane } from "lucide-react";
import { Link } from "react-router-dom";

export default function AircraftContextBar() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 border-y border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-14 max-w-[1440px] items-center gap-4 overflow-x-auto px-5 text-[11px] sm:px-10">
        <Plane size={15} className="shrink-0" />
        <strong className="whitespace-nowrap">N721AB</strong><span>·</span><span className="whitespace-nowrap">Phenom 300E</span>
        <span className="flex items-center gap-1 whitespace-nowrap rounded-full border border-border px-2 py-1"><CircleCheck size={12} className="text-emerald-600" /> Serial verified</span>
        <span className="flex items-center gap-1 whitespace-nowrap rounded-full border border-border px-2 py-1"><CircleCheck size={12} className="text-emerald-600" /> Owner matched</span>
        <span className="whitespace-nowrap rounded-full border border-border px-2 py-1 text-accent">ATI 84</span>
        <Link to="/intrazone" className="ml-auto flex shrink-0 items-center gap-2 font-semibold text-primary">Open in IntraZone <ArrowRight size={14} /></Link>
      </div>
    </div>
  );
}
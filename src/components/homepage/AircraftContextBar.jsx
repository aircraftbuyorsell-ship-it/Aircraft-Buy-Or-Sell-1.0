import {
  ArrowRight,
  CheckCircle2,
  CircleGauge,
  Plane,
} from "lucide-react";
import { Link } from "react-router-dom";

function ContextChip({ icon: Icon, children }) {
  return (
    <div
      className="
        inline-flex h-9 items-center gap-2 rounded-[6px]
        border border-black/[0.08] bg-white/72
        px-3 text-[12px] text-[#4e5359]
      "
    >
      <Icon size={14} strokeWidth={1.8} className="text-emerald-600" />
      {children}
    </div>
  );
}

export default function AircraftContextBar() {
  return (
    <div
      className="
        flex min-h-[64px] items-center gap-4 px-4 py-3
        sm:px-5 lg:px-6
      "
    >
      <div
        className="
          flex h-10 w-10 shrink-0 items-center justify-center
          border-r border-black/[0.08]
        "
      >
        <Plane size={19} strokeWidth={1.7} className="text-[#1e2227]" />
      </div>

      <div className="flex shrink-0 items-center gap-2 text-[13px]">
        <strong className="font-semibold text-[#171717]">N721AB</strong>
        <span className="text-black/35">·</span>
        <span className="text-[#363a3e]">Phenom 300E</span>
      </div>

      <div className="hidden h-7 w-px bg-black/[0.08] md:block" />

      <div className="hidden flex-1 items-center gap-3 overflow-hidden md:flex">
        <ContextChip icon={CheckCircle2}>Serial verified</ContextChip>
        <ContextChip icon={CheckCircle2}>Owner matched</ContextChip>

        <div
          className="
            inline-flex h-9 items-center gap-2 rounded-[6px]
            border border-black/[0.08] bg-white/72
            px-3 text-[12px] text-[#4e5359]
          "
        >
          <CircleGauge
            size={14}
            strokeWidth={1.8}
            className="text-sky-600"
          />
          ATI 84
        </div>
      </div>

      <Link
        to="/intrazone"
        className="
          ml-auto inline-flex shrink-0 items-center gap-3
          px-2 text-[12px] font-medium text-[#a67908]
          transition hover:text-[#7a5700]
        "
      >
        <span className="hidden sm:inline">Open in IntraZone</span>
        <ArrowRight size={17} strokeWidth={1.7} />
      </Link>
    </div>
  );
}
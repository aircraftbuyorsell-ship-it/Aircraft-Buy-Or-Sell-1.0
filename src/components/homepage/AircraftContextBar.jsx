import {
  ArrowRight,
  CheckCircle2,
  CircleGauge,
  Plane,
} from "lucide-react";
import { Link } from "react-router-dom";

function ContextChip({ icon: Icon, iconClass = "text-emerald-600", children }) {
  return (
    <div
      className="
        inline-flex h-9 items-center gap-2 rounded-[6px]
        border border-black/[0.08] bg-white/72
        px-3 text-[12px] text-[#4e5359]
      "
    >
      <Icon size={14} strokeWidth={1.8} className={iconClass} />
      {children}
    </div>
  );
}

function SkeletonBar() {
  return (
    <div className="flex min-h-[64px] items-center gap-4 px-4 py-3 sm:px-5 lg:px-6">
      <div className="h-5 w-32 animate-pulse rounded bg-black/[0.06]" />
      <div className="hidden h-9 w-28 animate-pulse rounded-[6px] bg-black/[0.05] md:block" />
      <div className="hidden h-9 w-28 animate-pulse rounded-[6px] bg-black/[0.05] md:block" />
    </div>
  );
}

export default function AircraftContextBar({ aircraft, isLoading }) {
  if (isLoading) return <SkeletonBar />;

  if (!aircraft) {
    return (
      <div className="flex min-h-[64px] items-center gap-4 px-4 py-3 sm:px-5 lg:px-6">
        <Plane size={19} strokeWidth={1.7} className="shrink-0 text-[#1e2227]" />
        <span className="text-[13px] font-semibold text-[#171717]">Aircraft Intelligence</span>
        <span className="hidden text-[12px] text-[#6b7075] md:inline">
          Registry · Verification · Market Context
        </span>
        <Link
          to="/listings"
          className="ml-auto inline-flex shrink-0 items-center gap-3 px-2 text-[12px] font-medium text-[#a67908] transition hover:text-[#7a5700]"
        >
          <span className="hidden sm:inline">Explore aircraft</span>
          <ArrowRight size={17} strokeWidth={1.7} />
        </Link>
      </div>
    );
  }

  const typeLabel = [aircraft.manufacturer, aircraft.model].filter(Boolean).join(" ");
  const hasAti = aircraft.atiScore != null;
  const intelLink = hasAti ? "/intrazone" : `/twin/${aircraft.registration}`;
  const intelLabel = hasAti ? "Open in IntraZone" : "Open Aircraft Intelligence";

  return (
    <div className="flex min-h-[64px] items-center gap-4 px-4 py-3 sm:px-5 lg:px-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border-r border-black/[0.08]">
        <Plane size={19} strokeWidth={1.7} className="text-[#1e2227]" />
      </div>

      <div className="flex shrink-0 items-center gap-2 text-[13px]">
        <strong className="font-semibold text-[#171717]">{aircraft.registration}</strong>
        {typeLabel ? (
          <>
            <span className="text-black/35">·</span>
            <span className="text-[#363a3e]">{typeLabel}</span>
          </>
        ) : (
          <>
            <span className="text-black/35">·</span>
            <span className="text-[#363a3e]">Aircraft record</span>
          </>
        )}
      </div>

      <div className="hidden h-7 w-px bg-black/[0.08] md:block" />

      <div className="hidden flex-1 items-center gap-3 overflow-hidden md:flex">
        {aircraft.serialVerified ? (
          <ContextChip icon={CheckCircle2}>Serial verified</ContextChip>
        ) : aircraft.serialNumber ? (
          <ContextChip icon={CheckCircle2}>Serial available</ContextChip>
        ) : null}

        {aircraft.registryMatched && (
          <ContextChip icon={CheckCircle2}>Registry matched</ContextChip>
        )}

        {aircraft.ownerContextAvailable && (
          <ContextChip icon={CheckCircle2}>Owner context available</ContextChip>
        )}

        <ContextChip icon={CircleGauge} iconClass="text-sky-600">
          {hasAti ? `ATI ${Math.round(aircraft.atiScore)}` : "ATI available"}
        </ContextChip>
      </div>

      <Link
        to={intelLink}
        className="
          ml-auto inline-flex shrink-0 items-center gap-3
          px-2 text-[12px] font-medium text-[#a67908]
          transition hover:text-[#7a5700]
        "
      >
        <span className="hidden sm:inline">{intelLabel}</span>
        <ArrowRight size={17} strokeWidth={1.7} />
      </Link>
    </div>
  );
}
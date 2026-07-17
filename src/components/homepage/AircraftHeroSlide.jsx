import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import AircraftDataCard from "@/components/homepage/AircraftDataCard";

export default function AircraftHeroSlide({ aircraft }) {
  return (
    <div className="relative min-h-[860px] overflow-hidden rounded-[28px] border border-border bg-card shadow-xl lg:min-h-[720px]">
      <img src={aircraft.image} alt={`${aircraft.registration} ${aircraft.model} on an airport apron`} width="1600" height="900" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/45 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/40 to-transparent" />
      <div className="relative z-10 grid min-h-[660px] items-center gap-8 px-6 pb-28 pt-24 sm:px-10 lg:min-h-[720px] lg:grid-cols-[1fr_300px] lg:px-14">
        <div className="max-w-[610px]">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-foreground">Aviation Intelligence Platform</p>
          <h2 className="mb-5 text-balance text-4xl font-black leading-[1.06] tracking-[-0.04em] text-foreground sm:text-6xl">Aircraft intelligence.<br />From first signal to closed deal.</h2>
          <p className="mb-7 max-w-md text-base leading-7 text-muted-foreground">Search, verify, value and transact with one connected aviation workspace.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/listings" className="inline-flex min-h-11 items-center rounded-lg bg-foreground px-6 text-sm font-bold text-background focus-visible:ring-2 focus-visible:ring-ring">Search an aircraft</Link>
            <Link to="/marketplace" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card/80 px-6 text-sm font-bold text-foreground backdrop-blur">Explore the market <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-card/85 px-3 py-2">{aircraft.type}</span><span className="flex items-center gap-1 rounded-full bg-card/85 px-3 py-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{aircraft.detail}</span></div>
          <div className="mt-6 flex lg:hidden"><AircraftDataCard aircraft={aircraft} /></div>
        </div>
        <div className="hidden justify-end lg:flex"><AircraftDataCard aircraft={aircraft} /></div>
      </div>
    </div>
  );
}
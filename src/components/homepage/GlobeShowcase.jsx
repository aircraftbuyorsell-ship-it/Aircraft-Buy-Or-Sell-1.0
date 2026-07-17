import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import AircraftContextBar from "@/components/homepage/AircraftContextBar";

export default function GlobeShowcase() {
  return (
    <section className="relative isolate min-h-[650px] overflow-hidden sm:min-h-[calc(100vh-4rem)]" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundImage: "radial-gradient(circle, #B8B8B8 1px, transparent 1px)", backgroundSize: "24px 24px", WebkitMaskImage: "linear-gradient(90deg, black 0%, transparent 70%)", maskImage: "linear-gradient(90deg, black 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 z-0" style={{ backgroundImage: "radial-gradient(circle, #D4A017 1px, transparent 1px)", backgroundSize: "24px 24px", WebkitMaskImage: "linear-gradient(90deg, transparent 30%, black 100%)", maskImage: "linear-gradient(90deg, transparent 30%, black 100%)" }} />
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none font-black leading-none" style={{ fontSize: "25vw", color: "rgba(212, 160, 23, 0.07)" }}>ABOS</div>
      <div className="absolute -right-[24%] top-0 z-10 h-[86%] w-[90%] sm:-right-[12%] sm:w-[72%]"><HeroGlobe forceLight /></div>
      <div className="relative z-20 mx-auto max-w-[1440px] px-5 pb-28 pt-20 sm:px-10 sm:pt-28">
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-6xl">Aircraft intelligence.<br />From first signal to closed deal.</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">Search, verify, value and transact with<br className="hidden sm:block" /> one connected aviation workspace.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/listings" className="rounded-md bg-primary px-6 py-3 text-xs font-bold text-primary-foreground">Search an aircraft</Link>
            <Link to="/marketplace" className="rounded-md border border-border bg-card px-6 py-3 text-xs font-semibold">Explore the market</Link>
          </div>
          <Link to="/listings" className="mt-6 flex max-w-md items-center gap-3 rounded-md border border-border bg-card/80 px-4 py-3 text-xs text-muted-foreground backdrop-blur"><Search size={15} /> Search aircraft, N-Reg, serial or owner...</Link>
        </div>
      </div>
      <div className="absolute right-[20%] top-[25%] z-20 hidden rounded-md border border-border bg-card/90 px-3 py-2 text-[10px] shadow-sm backdrop-blur md:block"><strong>N721AB</strong> · Registry matched</div>
      <AircraftContextBar />
    </section>
  );
}
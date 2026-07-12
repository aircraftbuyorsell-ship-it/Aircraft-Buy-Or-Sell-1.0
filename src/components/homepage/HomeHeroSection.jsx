import { Link } from "react-router-dom";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import SmartAircraftSearch from "@/components/search/SmartAircraftSearch";

const STATS = [
  { value: "312,845", label: "Aircraft" },
  { value: "280,000", label: "ATI Passports" },
  { value: "4,891", label: "Verified Listings" },
  { value: "2,341", label: "Verified Dealers" },
];

export default function HomeHeroSection() {
  return (
    <section className="relative w-full overflow-hidden" style={{ height: "100vh", minHeight: "600px" }}>
      <HeroGlobe />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(245,194,66,0.12) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 lg:hidden" style={{ background: "linear-gradient(180deg, rgba(4,6,10,0.35) 0%, rgba(4,6,10,0.55) 50%, rgba(4,6,10,0.85) 100%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="relative z-10 flex h-full flex-col justify-center px-4 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <div className="flex w-full max-w-[680px] flex-col items-start pt-16 text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">ABOS™ Platform</span>
            </div>

            <h1 className="mb-6 text-white tracking-[-0.03em] leading-[1.04]" style={{ fontSize: "clamp(36px, 5.5vw, 62px)", fontWeight: 500 }}>
              The Aviation<br /><span className="font-bold text-primary">Intelligence</span> Platform
            </h1>

            <div className="mb-7 flex flex-wrap items-center gap-3">
              <Link to="/listings" className="rounded-xl bg-primary px-6 py-3 text-[13px] font-bold text-primary-foreground hover:opacity-90">Browse Aircraft</Link>
              <Link to="/ati-center" className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-[13px] font-bold text-white/85 hover:bg-white/10">Explore ABOS Intelligence</Link>
            </div>

            <p className="mb-8 max-w-[480px] text-[14px] leading-relaxed text-white/60 sm:text-[16px]">
              Search. Analyze. Negotiate. Buy. Sell. — verified aircraft identity, AI valuations and end-to-end deal tools in one platform.
            </p>

            <div className="mb-10 w-full max-w-[560px]">
              <SmartAircraftSearch variant="hero" />
            </div>

            <div className="w-full">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="whitespace-nowrap rounded-full border border-primary/20 bg-primary/5 px-3.5 py-2 text-[10px] font-bold uppercase leading-snug tracking-[0.14em] text-primary/70">The global aircraft identity &amp; sales network</span>
                {STATS.map((stat) => (
                  <div key={stat.label} className="flex items-baseline gap-1.5 rounded-full border border-primary/20 bg-white/[0.03] px-3.5 py-2">
                    <span className="text-[15px] font-black tabular-nums leading-none text-primary sm:text-[18px]">{stat.value}</span>
                    <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.12em] text-white/45">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-20 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex lg:bottom-8">
        <span className="text-[9px] uppercase tracking-[0.2em] text-white/35">Scroll</span>
        <div className="h-8 w-px bg-gradient-to-b from-primary/40 to-transparent" />
      </div>
    </section>
  );
}
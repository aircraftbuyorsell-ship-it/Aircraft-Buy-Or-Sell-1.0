import { Link } from "react-router-dom";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import SmartAircraftSearch from "@/components/search/SmartAircraftSearch";

const STATS = [
  { value: "8", label: "ATI Dimensions" },
  { value: "9", label: "Tools From One Search" },
  { value: "3+", label: "Sources Cross-Checked" },
  { value: "0", label: "Repeat Lookup Steps" },
];

export default function HomeHeroSection() {
  return (
    <section className="relative w-full h-[900px] lg:h-[max(100vh,780px)] overflow-visible">
      <HeroGlobe />
      <div className="pointer-events-none absolute inset-0" style={{ background: "#F5F2ED" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(212,160,23,0.10) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.18) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

      <div className="relative z-10 flex h-full flex-col justify-center px-4 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <div className="flex w-full max-w-[680px] flex-col items-start pt-16 text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: "#A67C00" }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white">ABOS™ Platform</span>
            </div>

            <h1 className="mb-6 tracking-[-0.03em] leading-[1.04]" style={{ fontSize: "clamp(36px, 5.5vw, 62px)", fontWeight: 500, color: "#1A1A1A" }}>
              The Aviation<br /><span className="font-bold" style={{ color: "#A67C00" }}>Intelligence</span> Platform
            </h1>

            <div className="mb-7 flex flex-wrap items-center gap-3">
              <Link to="/listings" className="rounded-xl px-6 py-3 text-[13px] font-bold hover:opacity-90" style={{ background: "#A67C00", color: "#fff" }}>Browse Aircraft</Link>
              <Link to="/ati-center" className="rounded-xl px-6 py-3 text-[13px] font-bold hover:opacity-90" style={{ border: "1px solid rgba(166,124,0,0.3)", background: "rgba(166,124,0,0.06)", color: "#A67C00" }}>Explore ABOS Intelligence</Link>
            </div>

            <p className="mb-8 max-w-[480px] text-[14px] leading-relaxed sm:text-[16px]" style={{ color: "#4D4D4D" }}>
              Search. Analyze. Negotiate. Buy. Sell. — verified aircraft identity, AI valuations and end-to-end deal tools in one platform.
            </p>

            <div className="mb-10 w-full max-w-[560px]">
              <SmartAircraftSearch variant="hero" />
            </div>

            <div className="w-full">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="whitespace-nowrap rounded-full px-3.5 py-2 text-[10px] font-bold uppercase leading-snug tracking-[0.14em]" style={{ background: "rgba(166,124,0,0.08)", color: "#A67C00", border: "1px solid rgba(166,124,0,0.2)" }}>The global aircraft identity &amp; sales network</span>
                {STATS.map((stat) => (
                  <div key={stat.label} className="flex items-baseline gap-1.5 rounded-full px-3.5 py-2" style={{ background: "#fff", border: "1px solid rgba(166,124,0,0.15)" }}>
                    <span className="text-[15px] font-black tabular-nums leading-none sm:text-[18px]" style={{ color: "#A67C00" }}>{stat.value}</span>
                    <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.12em]" style={{ color: "#4D4D4D" }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-20 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex lg:bottom-8">
        <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "rgba(77,77,77,0.5)" }}>Scroll</span>
        <div className="h-8 w-px" style={{ background: "linear-gradient(to bottom, rgba(166,124,0,0.4), transparent)" }} />
      </div>
    </section>
  );
}
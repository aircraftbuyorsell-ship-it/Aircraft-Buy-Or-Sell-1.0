import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import NRegLookup from "@/components/dashboard/NRegLookup";

export default function HeroSection({ listings = [], atiCards = [], activeAti = [] }) {
  const counters = [
  { value: listings.length, label: "Active Listings" },
  { value: atiCards.length, label: "ATI Passports" },
  { value: activeAti.length, label: "Active ATI" }];

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[auto] lg:min-h-screen px-4 sm:px-6 py-10 sm:py-16 lg:py-20">
      {/* Globe background */}
      <div className="absolute inset-0 z-0">
        <SkyBossGlobe className="w-full h-full" listings={listings} />
      </div>

      {/* Frosted glass card */}
      <div
        className="relative z-10 w-full max-w-[680px] rounded-2xl px-6 sm:px-10 py-8 sm:py-10 flex flex-col items-center text-center opacity-15"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 0 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"
        }}>
        
        <p className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-white/70 font-medium mb-4">
          Global Aircraft Identity &amp; Intelligence
        </p>
        <h1 className="text-[clamp(28px,5vw,52px)] font-bold tracking-[-0.03em] leading-[1.08] text-white mb-4">
          Aircraft Intelligence,{" "}
          <span style={{ color: "#FFB300" }}>Verified by Data.</span>
        </h1>
        <p className="text-[14px] sm:text-[15px] text-white/60 leading-[1.6] max-w-[480px] mb-6">
          The operating system for aircraft transactions. Identity, valuation,
          and market intelligence — trusted by dealers, brokers, and owners
          worldwide.
        </p>
        <div className="w-full max-w-[420px]">
          <NRegLookup />
        </div>
      </div>

      {/* Stats bar with gold separator line */}
      <div className="relative z-10 w-full max-w-[680px] mt-8">
        <div className="w-full h-[2px] mb-6" style={{ background: "#FFB300" }} />
        <div className="flex items-center justify-center gap-0">
          {counters.map((c, i) =>
          <div
            key={c.label}
            className={`flex-1 flex flex-col items-center px-2 sm:px-4 ${
            i < counters.length - 1 ?
            "border-r border-white/20" :
            ""}`
            }>
            
              <div className="text-[clamp(20px,3vw,32px)] font-bold tabular-nums leading-none" style={{ color: "#FFB300" }}>
                {c.value.toLocaleString()}
              </div>
              <div className="text-[9px] sm:text-[10px] tracking-[0.12em] uppercase text-white/60 mt-1.5 font-medium text-center">
                {c.label}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}
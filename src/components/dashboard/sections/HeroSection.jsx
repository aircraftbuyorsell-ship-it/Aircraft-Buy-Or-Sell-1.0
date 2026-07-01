import SkyBossGlobe from "@/components/dashboard/SkyBossGlobe";
import NRegLookup from "@/components/dashboard/NRegLookup";

export default function HeroSection({ listings = [], atiCards = [], activeAti = [] }) {
  const counters = [
    { value: listings.length, label: "Active Listings" },
    { value: atiCards.length, label: "ATI Passports" },
    { value: activeAti.length, label: "Active ATI" },
  ];
  return (
    <section className="relative flex flex-col min-h-[auto] lg:min-h-screen">
      <div className="absolute inset-0 z-0">
        <SkyBossGlobe className="w-full h-full" listings={listings} />
      </div>
      <div
        className="relative z-2 w-full max-w-[1280px] mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-12 px-4 sm:px-8 lg:px-16 pt-8 sm:pt-12 lg:pt-24 flex-1"
      >
        <div className="relative max-w-[520px] w-full lg:w-auto">
          <div className="absolute -inset-x-6 -inset-y-6 -z-10 hidden lg:block"
            style={{ background: "linear-gradient(to right, rgba(4,6,10,0.45) 0%, rgba(4,6,10,0.20) 70%, transparent 100%)", borderRadius: "20px", pointerEvents: "none" }} />
          <p className="text-[10px] tracking-[0.18em] uppercase text-[#D4A017] mb-4">
            Global Aircraft Identity &amp; Intelligence
          </p>
          <h1 className="text-[clamp(32px,4.5vw,56px)] font-medium tracking-[-0.04em] leading-[1.08] text-white mb-5">
            Aircraft Intelligence,
            <br />
            Verified by Data.
          </h1>
          <p className="text-[15px] text-white/50 leading-[1.6] max-w-[440px]">
            The operating system for aircraft transactions. Identity, valuation,
            and market intelligence — trusted by dealers, brokers, and owners
            worldwide.
          </p>
        </div>
        <div className="w-full max-w-[360px] lg:shrink-0">
          <NRegLookup />
        </div>
      </div>
      <div className="relative z-2 w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-16 pb-6 lg:pb-10">
        <div className="relative flex gap-8 flex-wrap">
          <div className="absolute -inset-x-6 -inset-y-3 -z-10 hidden lg:block"
            style={{ background: "linear-gradient(to right, rgba(4,6,10,0.40) 0%, transparent 80%)", borderRadius: "12px", pointerEvents: "none" }} />
          {counters.map((c) => (
            <div key={c.label}>
              <div className="text-[36px] font-medium tracking-[-0.04em] text-[#D4A017] leading-none tabular-nums">
                {c.value}
              </div>
              <div className="text-[10px] tracking-[0.12em] uppercase text-white/40 mt-1">
                {c.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
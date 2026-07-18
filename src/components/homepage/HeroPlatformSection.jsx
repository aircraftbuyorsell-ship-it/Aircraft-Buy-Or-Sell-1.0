import { Link } from "react-router-dom";
import { CircleCheck, Search } from "lucide-react";
import HeroGlobe from "@/components/globe/HeroGlobe";

export default function HeroPlatformSection() {
  return (
    <section className="relative isolate min-h-[680px] overflow-hidden bg-[#fbfaf7]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="absolute -right-[26%] top-0 z-10 h-[88%] w-[92%] sm:-right-[12%] sm:w-[70%]"><HeroGlobe /></div>

      <div className="absolute right-[16%] top-[22%] z-20 hidden rounded-xl border border-black/[0.08] bg-white/95 px-4 py-3 text-[11px] shadow-lg backdrop-blur md:block">
        <div className="font-bold text-[#1a1a1a]">N721AB</div>
        <div className="mt-1 flex items-center gap-1 text-[#3a3a3a]"><CircleCheck size={11} className="text-emerald-600" /> Registry matched</div>
        <div className="flex items-center gap-1 text-[#3a3a3a]"><CircleCheck size={11} className="text-emerald-600" /> Serial identified</div>
        <div className="mt-1 font-semibold text-[#D4A017]">ATI Score 84</div>
        <Link to="/ati-center" className="mt-2 block text-[10px] font-bold text-[#D4A017]">Open Intelligence →</Link>
      </div>

      <div className="relative z-20 mx-auto max-w-[1360px] px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold leading-[1.06] tracking-[-0.035em] text-[#1a1a1a] sm:text-6xl">
            The Aviation<br /><span className="font-bold text-[#D4A017]">Intelligence</span> Platform
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-[#555]">
            Search aircraft. Verify critical information. Understand market value. Make better aviation decisions.
          </p>
          <p className="mt-3 max-w-md text-[13px] leading-6 text-[#777]">
            ABOS connects aircraft listings, trusted data, valuation, verification, market intelligence and professional workflows in one platform.
          </p>

          <Link to="/listings" className="mt-7 flex max-w-md items-center gap-3 rounded-xl border border-black/[0.09] bg-white px-4 py-3.5 text-xs text-[#888] shadow-sm hover:border-[#D4A017]/40">
            <Search size={15} className="text-[#D4A017]" /> Search aircraft, registration, serial, owner, model or ATI code →
          </Link>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/listings" className="rounded-xl bg-[#D4A017] px-6 py-3 text-[13px] font-bold text-white hover:opacity-90">Search Aircraft</Link>
            <Link to="/ati-center" className="rounded-xl border border-black/[0.12] bg-white px-6 py-3 text-[13px] font-semibold text-[#1a1a1a] hover:bg-black/[0.03]">Explore Aircraft Intelligence</Link>
          </div>

          <p className="mt-8 text-[11px] uppercase tracking-[0.14em] text-[#999]">
            Built for buyers, sellers, brokers, dealers, aviation professionals, developers and intelligent apps.
          </p>
        </div>
      </div>
    </section>
  );
}
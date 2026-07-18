import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, CornerDownLeft } from "lucide-react";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import PlatformHeader from "@/components/homepage/PlatformHeader";

export default function HeroPlatformSection() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#fbfaf7]">
      <PlatformHeader />

      <section className="relative isolate overflow-hidden">
        {/* 3D globe — full-bleed background shifted right, behind content */}
        <div className="pointer-events-none absolute right-[-10%] top-1/2 z-0 h-[130%] w-[75%] -translate-y-1/2 sm:w-[62%]">
          <HeroGlobe
            mode="hero"
            interactive={false}
            activeAircraft={{ registration: "N721AB" }}
            signalLabel="🟢 N721AB · Registry matched"
          />
        </div>

        {/* Subtle dot-grid underlay */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(rgba(15,23,42,0.05) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        {/* Content */}
        <div className="relative z-20 mx-auto flex min-h-[640px] max-w-[1360px] flex-col justify-center px-5 pb-10 pt-16 sm:px-8 sm:pt-24">
          <div className="max-w-xl">
            <h1 className="max-w-xl text-[42px] font-bold leading-[1.1] tracking-tight text-[#0f172a] font-sans sm:text-[48px]">
              Aircraft intelligence.
              <br />
              From first signal to closed deal.
            </h1>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 sm:text-base">
              Search, verify, value and transact with one connected aviation workspace.
            </p>

            {/* Row 1 — action buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/listings"
                className="rounded-lg bg-[#e0a938] px-5 py-3 text-xs font-bold text-[#0f172a] shadow-xs hover:bg-[#cb952b]"
              >
                Search an aircraft
              </Link>
              <Link
                to="/marketplace"
                className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-[#0f172a] hover:bg-slate-50"
              >
                Explore the market
              </Link>
            </div>

            {/* Row 2 — inline search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/listings?q=${encodeURIComponent(q)}`);
              }}
              className="mt-6 flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm focus-within:ring-1 focus-within:ring-slate-400"
            >
              <Search size={14} className="shrink-0 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search aircraft, N-Reg, serial or owner..."
                className="w-full bg-transparent text-xs text-[#0f172a] placeholder:text-slate-400 focus:outline-none"
              />
              <span className="flex shrink-0 items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                <CornerDownLeft size={9} />
              </span>
            </form>
          </div>

          {/* Bottom real-time operational telemetry strip */}
          <div className="mt-12 flex w-full flex-wrap items-center justify-between gap-3 bg-white/90 px-6 py-3 text-xxs font-semibold text-slate-700 backdrop-blur-md sm:border-y sm:border-slate-200/60">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-900">✈️ N721AB · Phenom 300E</span>
              <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                ✓ Serial verified
              </span>
              <span className="rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700">
                ✓ Owner matched
              </span>
              <span className="rounded-md border border-blue-200/60 bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                ⊙ ATI 84
              </span>
            </div>
            <Link to="/intrazone" className="text-xxs font-bold tracking-wide text-[#e0a938] hover:underline">
              Open in IntraZone →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
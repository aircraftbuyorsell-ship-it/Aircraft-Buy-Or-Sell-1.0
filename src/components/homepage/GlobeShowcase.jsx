import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";

import HeroGlobe from "@/components/homepage/HeroGlobe";
import AircraftContextBar from "@/components/homepage/AircraftContextBar";

export default function GlobeShowcase() {
  return (
    <section
      className="
        relative isolate min-h-[650px] overflow-hidden
        border-b border-black/[0.06] bg-[#fbfaf7]
        lg:min-h-[calc(100vh-64px)]
      "
    >
      {/* Soft page atmosphere */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 z-0
          bg-[radial-gradient(circle_at_22%_38%,rgba(255,255,255,0.98)_0%,rgba(251,250,247,0.86)_38%,rgba(244,245,246,0.44)_67%,transparent_100%)]
        "
      />

      {/* Subtle dot-grid background */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 z-[1] opacity-[0.24]
          [background-image:radial-gradient(rgba(31,35,40,0.13)_0.7px,transparent_0.7px)]
          [background-size:22px_22px]
          [mask-image:linear-gradient(to_right,black,transparent_42%,transparent)]
        "
      />

      {/* Full-bleed globe */}
      <div
        className="
          pointer-events-none absolute z-10
          -right-[62%] top-[14%]
          h-[72%] w-[145%]

          sm:-right-[42%]
          sm:top-[7%]
          sm:h-[82%]
          sm:w-[124%]

          lg:-right-[18%]
          lg:-top-[2%]
          lg:h-[96%]
          lg:w-[78%]

          xl:-right-[12%]
          xl:h-[100%]
          xl:w-[73%]

          2xl:-right-[7%]
          2xl:w-[70%]
        "
      >
        <HeroGlobe />
      </div>

      {/* Left-side readability wash */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-y-0 left-0 z-[12] w-full
          bg-gradient-to-r
          from-[#fbfaf7]
          via-[#fbfaf7]/95
          to-transparent

          sm:w-[76%]
          lg:w-[58%]
          xl:w-[50%]
        "
      />

      {/* Main hero content */}
      <div
        className="
          relative z-20 mx-auto flex min-h-[650px] max-w-[1600px]
          items-start px-5 pb-36 pt-16

          sm:min-h-[720px]
          sm:px-10
          sm:pb-40
          sm:pt-24

          lg:min-h-[calc(100vh-64px)]
          lg:items-center
          lg:px-16
          lg:pb-36
          lg:pt-10

          xl:px-20
        "
      >
        <div className="w-full max-w-[670px] lg:-translate-y-6">
          <h1
            className="
              max-w-[650px] text-[42px] font-semibold
              leading-[1.05] tracking-[-0.045em] text-[#151515]

              sm:text-[58px]
              lg:text-[64px]
              xl:text-[70px]
            "
          >
            Aircraft intelligence.
            <br />
            From first signal to closed deal.
          </h1>

          <p
            className="
              mt-6 max-w-[440px] text-[16px] leading-[1.55]
              tracking-[-0.01em] text-[#575757]

              sm:text-[18px]
            "
          >
            Search, verify, value and transact with
            <br className="hidden sm:block" /> one connected aviation workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/listings"
              className="
                inline-flex min-h-12 items-center justify-center rounded-[6px]
                bg-[#D4A017] px-7 py-3 text-[14px] font-semibold
                text-[#1b1607] shadow-[0_8px_24px_rgba(212,160,23,0.22)]
                transition duration-200
                hover:-translate-y-0.5 hover:bg-[#dfad22]
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[#D4A017] focus-visible:ring-offset-2
              "
            >
              Search an aircraft
            </Link>

            <Link
              to="/marketplace"
              className="
                inline-flex min-h-12 items-center justify-center rounded-[6px]
                border border-black/20 bg-white/70 px-7 py-3
                text-[14px] font-semibold text-[#202020]
                backdrop-blur-xl transition duration-200
                hover:-translate-y-0.5 hover:bg-white
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-black/25 focus-visible:ring-offset-2
              "
            >
              Explore the market
            </Link>
          </div>

          {/* Hero search */}
          <Link
            to="/listings"
            aria-label="Search aircraft, registration, serial number or owner"
            className="
              group mt-8 flex min-h-[58px] w-full max-w-[490px]
              items-center gap-4 rounded-[8px]
              border border-black/[0.13] bg-white/72 px-5
              text-[14px] text-[#7a7a7a]
              shadow-[0_10px_35px_rgba(20,24,32,0.05)]
              backdrop-blur-2xl transition duration-200
              hover:border-black/20 hover:bg-white
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[#D4A017]/50
            "
          >
            <Search
              size={19}
              strokeWidth={1.8}
              className="shrink-0 text-[#62676d]"
            />

            <span className="min-w-0 flex-1 truncate text-left">
              Search aircraft, N-Reg, serial or owner...
            </span>

            <ArrowRight
              size={17}
              strokeWidth={1.7}
              className="
                shrink-0 text-black/25 transition-transform
                group-hover:translate-x-1 group-hover:text-black/50
              "
            />
          </Link>
        </div>
      </div>

      {/* Floating signal card attached to globe */}
      <div
        className="
          absolute right-[17%] top-[31%] z-30 hidden
          items-center gap-1.5 rounded-[5px]
          border border-black/[0.08] bg-white/90
          px-4 py-2.5 text-[12px] text-[#555]
          shadow-[0_10px_30px_rgba(20,24,32,0.12)]
          backdrop-blur-xl

          lg:flex
          xl:right-[20%]
          xl:top-[34%]
        "
      >
        <strong className="font-semibold text-[#181818]">N721AB</strong>
        <span className="text-black/35">·</span>
        <span>Registry matched</span>
      </div>

      {/* Pulse behind floating card */}
      <div
        aria-hidden="true"
        className="
          absolute right-[31.4%] top-[37.2%] z-20 hidden
          h-4 w-4 rounded-full border border-emerald-400/80
          bg-emerald-300/70 shadow-[0_0_0_8px_rgba(52,211,153,0.12),0_0_28px_rgba(52,211,153,0.75)]
          lg:block
          xl:right-[34.4%]
          xl:top-[39.5%]
        "
      />

      {/* Full-width bottom aircraft context bar */}
      <div className="absolute inset-x-0 bottom-0 z-40 px-4 sm:px-8 lg:px-16">
        <div
          className="
            mx-auto max-w-[1530px] overflow-hidden rounded-t-[10px]
            border border-black/[0.1] border-b-0 bg-white/82
            shadow-[0_-14px_38px_rgba(22,27,35,0.08)]
            backdrop-blur-2xl
          "
        >
          <AircraftContextBar />
        </div>
      </div>
    </section>
  );
}
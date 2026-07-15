import { Link } from "react-router-dom";
import { ArrowRight, CircleCheck, Plane, Radio, ShieldCheck } from "lucide-react";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import SmartAircraftSearch from "@/components/search/SmartAircraftSearch";
import { useTheme } from "@/lib/useTheme";

const STATS = [
  { value: "8", label: "ATI dimensions" },
  { value: "9", label: "connected tools" },
  { value: "3+", label: "verified sources" },
];

export default function HomeHeroSection() {
  const isDark = useTheme();
  const foreground = isDark ? "#f7f8fa" : "#15171a";
  const muted = isDark ? "rgba(247,248,250,0.66)" : "#555d67";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(21,23,26,0.12)";
  const panel = isDark ? "rgba(10,12,16,0.88)" : "rgba(255,255,255,0.82)";

  return (
    <section
      className="relative min-h-[780px] w-full overflow-hidden sm:min-h-[840px] lg:min-h-[max(100vh,800px)]"
      style={{ background: isDark ? "#05070a" : "#f4f5f6" }}
    >
      <div className="absolute inset-0 opacity-65 sm:opacity-80 lg:opacity-100">
        <HeroGlobe variant="hero" />
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(90deg, rgba(5,7,10,0.98) 0%, rgba(5,7,10,0.88) 42%, rgba(5,7,10,0.36) 72%, transparent 100%)"
            : "linear-gradient(90deg, rgba(244,245,246,0.99) 0%, rgba(244,245,246,0.95) 38%, rgba(244,245,246,0.54) 64%, rgba(244,245,246,0.04) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(5,7,10,0.28), rgba(5,7,10,0.92) 70%)"
            : "linear-gradient(180deg, rgba(244,245,246,0.22), rgba(244,245,246,0.96) 70%)",
        }}
      />

      <div className="pointer-events-none absolute right-[12%] top-[30%] z-10 hidden items-center gap-2 lg:flex">
        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.8)]" />
        <span className="rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] backdrop-blur-md"
          style={{ color: foreground, borderColor: border, background: panel }}>
          Live network
        </span>
      </div>

      <div className="pointer-events-none relative z-10 mx-auto flex min-h-[780px] w-full max-w-[1280px] flex-col px-4 pb-24 pt-40 sm:min-h-[840px] sm:px-8 sm:pt-44 lg:min-h-[max(100vh,800px)] lg:justify-center lg:pb-28 lg:pt-28">
        <div className="pointer-events-auto max-w-[660px]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2">
            <Radio size={13} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">ABOS Aviation Intelligence</span>
          </div>

          <h1
            className="max-w-[650px] text-[clamp(2.65rem,5.4vw,4.9rem)] font-semibold leading-[1.01]"
            style={{ color: foreground, letterSpacing: 0 }}
          >
            Know the aircraft. Control the deal.
          </h1>

          <p className="mt-6 max-w-[560px] text-[15px] leading-relaxed sm:text-[17px]" style={{ color: muted }}>
            Search, verify and value any aircraft in the public ABOS network, then carry the same context into a professional transaction workspace.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a href="#aircraft-search" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-[13px] font-bold text-primary-foreground hover:opacity-90">
              Search an aircraft <ArrowRight size={15} />
            </a>
            <Link
              to="/intrazone"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-6 py-3 text-[13px] font-bold backdrop-blur-md"
              style={{ color: foreground, borderColor: border, background: panel }}
            >
              Enter IntraZone <ArrowRight size={15} />
            </Link>
          </div>

          <div id="aircraft-search" className="mt-7 w-full max-w-[590px] scroll-mt-40">
            <SmartAircraftSearch variant="hero" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-1.5 rounded-md border px-3 py-2 backdrop-blur-md" style={{ background: panel, borderColor: border }}>
                <span className="text-[16px] font-black leading-none text-primary">{stat.value}</span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: muted }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="pointer-events-auto absolute inset-x-4 bottom-5 grid gap-3 rounded-md border p-3 backdrop-blur-xl sm:inset-x-8 sm:grid-cols-[1fr_auto] sm:items-center sm:p-4 lg:inset-x-8 lg:bottom-6"
          style={{ background: panel, borderColor: border, boxShadow: "0 18px 60px rgba(15,23,42,0.12)" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Plane size={19} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-primary">Aircraft context</p>
              <p className="truncate text-[13px] font-bold sm:text-[14px]" style={{ color: foreground }}>One aircraft record across discovery, verification and execution</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: muted }}><CircleCheck size={14} className="text-emerald-500" /> Context preserved</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: muted }}><ShieldCheck size={14} className="text-primary" /> Permission scoped</span>
            <Link to="/intrazone" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#101318] px-4 py-2 text-[11px] font-bold text-white">
              Open workspace <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

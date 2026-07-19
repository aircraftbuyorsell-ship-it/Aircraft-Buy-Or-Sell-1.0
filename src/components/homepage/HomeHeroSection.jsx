import { Link } from "react-router-dom";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import SmartAircraftSearch from "@/components/search/SmartAircraftSearch";
import { useTheme } from "@/lib/useTheme";

const STATS = [
  { value: "8", label: "ATI Dimensions" },
  { value: "9", label: "Tools From One Search" },
  { value: "3+", label: "Sources Cross-Checked" },
  { value: "0", label: "Repeat Lookup Steps" },
];

export default function HomeHeroSection() {
  const isDark = useTheme();

  const mobileOverlay = isDark
    ? "linear-gradient(180deg, rgba(4,6,10,0.35) 0%, rgba(4,6,10,0.55) 50%, rgba(4,6,10,0.85) 100%)"
    : "linear-gradient(180deg, rgba(251,250,247,0.2) 0%, rgba(251,250,247,0.45) 50%, rgba(251,250,247,0.75) 100%)";

  const dotPattern = isDark
    ? "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)"
    : "radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)";

  const h1Class = isDark ? "text-white" : "text-foreground";
  const pClass = isDark ? "text-white/60" : "text-muted-foreground";
  const statsLabelClass = isDark ? "text-white/45" : "text-muted-foreground";
  const statsPillClass = isDark
    ? "border-primary/20 bg-white/[0.03]"
    : "border-border bg-card";
  const btnSecondaryClass = isDark
    ? "border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
    : "border-border bg-card text-foreground hover:bg-muted/50";
  const scrollClass = isDark ? "text-white/35" : "text-muted-foreground/50";

  return (
    <section className="relative w-full min-h-[640px] h-auto py-14 sm:py-0 sm:h-[900px] lg:h-[max(100vh,780px)] overflow-visible">
      <HeroGlobe />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(245,194,66,0.12) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 lg:hidden" style={{ background: mobileOverlay }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: dotPattern, backgroundSize: "24px 24px" }} />

      <div className="relative z-10 flex h-full flex-col justify-center px-4 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <div className="flex w-full max-w-[680px] flex-col items-start text-left pt-24 sm:pt-28 px-3">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 sm:mb-6">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">ABOS™ Platform</span>
            </div>

            <h1 className={`mb-4 tracking-[-0.03em] leading-[1.04] sm:mb-6 ${h1Class}`} style={{ fontSize: "clamp(30px, 8vw, 62px)", fontWeight: 500 }}>
              The Aviation<br /><span className="font-bold text-primary">Intelligence</span> Platform
            </h1>

            <div className="mb-5 flex w-full flex-col gap-2.5 sm:mb-7 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Link to="/listings" className="rounded-xl bg-primary px-6 py-3 text-center text-[13px] font-bold text-primary-foreground hover:opacity-90">Browse Aircraft</Link>
              <Link to="/ati-center" className={`rounded-xl border px-6 py-3 text-center text-[13px] font-bold transition-colors ${btnSecondaryClass}`}>Explore ABOS Intelligence</Link>
            </div>

            <p className={`mb-5 max-w-[480px] text-[14px] leading-relaxed sm:mb-8 sm:text-[16px] ${pClass}`}>
              Search. Analyze. Negotiate. Buy. Sell. — verified aircraft identity, AI valuations and end-to-end deal tools in one platform.
            </p>

            <div className="mb-6 w-full max-w-[560px] sm:mb-10">
              <SmartAircraftSearch variant="hero" />
            </div>

            <div className="w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="hidden whitespace-nowrap rounded-full border border-primary/20 bg-primary/5 px-3.5 py-2 text-[10px] font-bold uppercase leading-snug tracking-[0.14em] text-primary/70 sm:inline-block">The global aircraft identity &amp; sales network</span>
                {STATS.map((stat) => (
                  <div key={stat.label} className={`flex items-baseline gap-1.5 rounded-full border px-3 py-1.5 sm:px-3.5 sm:py-2 ${statsPillClass}`}>
                    <span className="text-[15px] font-black tabular-nums leading-none text-primary sm:text-[18px]">{stat.value}</span>
                    <span className={`text-[8px] font-semibold uppercase leading-none tracking-[0.12em] ${statsLabelClass}`}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-20 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex lg:bottom-8">
        <span className={`text-[9px] uppercase tracking-[0.2em] ${scrollClass}`}>Scroll</span>
        <div className="h-8 w-px bg-gradient-to-b from-primary/40 to-transparent" />
      </div>
    </section>
  );
}
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

  const mobileOverlay = "linear-gradient(180deg, rgba(251,250,247,0.2) 0%, rgba(251,250,247,0.45) 50%, rgba(251,250,247,0.75) 100%)";

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
    <section className="relative w-full min-h-[560px] h-auto pt-24 pb-14 sm:pt-20 sm:pb-0 sm:h-[min(80vh,720px)] lg:h-[max(80vh,680px)] overflow-hidden">
      <HeroGlobe />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 20%, rgba(245,194,66,0.12) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute inset-0 lg:hidden" style={{ background: mobileOverlay }} />
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] lg:block" style={{ background: isDark ? "linear-gradient(90deg, rgba(4,6,10,0.82) 0%, rgba(4,6,10,0.5) 55%, transparent 100%)" : "linear-gradient(90deg, rgba(251,250,247,0.92) 0%, rgba(251,250,247,0.72) 55%, transparent 100%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: dotPattern, backgroundSize: "24px 24px" }} />

      <div className="relative z-10 flex h-full flex-col justify-center px-4 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <div className="flex w-full max-w-[680px] flex-col items-start text-left px-3">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 sm:mb-5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">ABOS™ · Global aircraft identity &amp; sales network</span>
            </div>

            <h1 className={`mb-4 tracking-[-0.03em] leading-[1.04] sm:mb-5 ${h1Class}`} style={{ fontSize: "clamp(30px, 7vw, 58px)", fontWeight: 500 }}>
              The Aviation<br /><span className="font-bold text-primary">Intelligence</span> Platform
            </h1>

            <p className={`mb-6 max-w-[480px] text-[15px] leading-relaxed sm:mb-7 sm:text-[17px] ${pClass}`}>
              Search. Analyze. Negotiate. Buy. Sell. — verified aircraft identity, AI valuations and end-to-end deal tools in one platform.
            </p>

            <div className="mb-4 w-full max-w-[560px] sm:mb-6">
              <SmartAircraftSearch variant="hero" />
            </div>

            <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 sm:mb-10">
              <Link to="/listings" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-[13px] font-bold text-primary-foreground hover:opacity-90">Browse Aircraft</Link>
              <Link to="/ati-center" className={`inline-flex items-center text-[13px] font-semibold underline-offset-4 hover:underline ${isDark ? "text-white/70 hover:text-white" : "text-foreground/70 hover:text-foreground"}`}>Explore ABOS Intelligence →</Link>
            </div>

            <div className="w-full">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                {STATS.map((stat, i) => (
                  <div key={stat.label} className="flex items-center gap-5">
                    {i > 0 && <span className={`hidden h-6 w-px sm:block ${isDark ? "bg-white/10" : "bg-black/10"}`} />}
                    <div className="flex flex-col">
                      <span className="text-[18px] font-black tabular-nums leading-none text-primary sm:text-[22px]">{stat.value}</span>
                      <span className={`mt-1 text-[9px] font-semibold uppercase leading-none tracking-[0.14em] ${statsLabelClass}`}>{stat.label}</span>
                    </div>
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
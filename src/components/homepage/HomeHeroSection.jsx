import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import SmartAircraftSearch from "@/components/search/SmartAircraftSearch";
import { useTheme } from "@/lib/useTheme";

const STATS = [
  { value: "8", label: "ATI Dimensions" },
  { value: "9", label: "Tools From One Search" },
  { value: "3+", label: "Sources Cross-Checked" },
  { value: "0", label: "Repeat Lookup Steps" },
];

const WORKFLOW = [
  { label: "Identify", detail: "Registration and serial" },
  { label: "Verify", detail: "Ownership and records" },
  { label: "Value", detail: "Market and operating data" },
  { label: "Transact", detail: "Pipeline and settlement" },
];

export default function HomeHeroSection() {
  const isDark = useTheme();
  const foreground = isDark ? "#ffffff" : "#111827";
  const muted = isDark ? "rgba(255,255,255,0.64)" : "#4b5563";
  const panel = isDark ? "rgba(12,17,27,0.84)" : "rgba(255,255,255,0.92)";
  const panelBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)";

  return (
    <section className="relative min-h-[760px] w-full overflow-hidden sm:min-h-[820px] lg:min-h-[max(100vh,780px)]">
      {isDark ? (
        <HeroGlobe />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-[68%_center] sm:bg-center"
          style={{ backgroundImage: "url('/assets/hero-aircraft-light.webp')" }}
          role="img"
          aria-label="Business aircraft on an airport apron"
        />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(90deg, rgba(4,6,10,0.88) 0%, rgba(4,6,10,0.58) 48%, rgba(4,6,10,0.16) 78%, transparent 100%)"
            : "linear-gradient(90deg, rgba(247,248,250,0.98) 0%, rgba(247,248,250,0.94) 36%, rgba(247,248,250,0.68) 55%, rgba(247,248,250,0.12) 82%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(4,6,10,0.42) 0%, rgba(4,6,10,0.76) 62%, rgba(4,6,10,0.96) 100%)"
            : "linear-gradient(180deg, rgba(247,248,250,0.76) 0%, rgba(247,248,250,0.92) 58%, rgba(247,248,250,0.99) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-[760px] w-full max-w-[1240px] items-center gap-10 px-4 pb-14 pt-40 sm:min-h-[820px] sm:px-8 sm:pt-44 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-20 lg:pt-32">
        <div className="max-w-[700px]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Aviation Intelligence Platform</span>
          </div>

          <h1
            className="max-w-[680px] text-[clamp(2.45rem,6vw,4.7rem)] font-semibold leading-[1.02]"
            style={{ color: foreground, letterSpacing: 0 }}
          >
            Aircraft intelligence. From first signal to closed deal.
          </h1>

          <p className="mt-6 max-w-[570px] text-[15px] leading-relaxed sm:text-[17px]" style={{ color: muted }}>
            Search, verify, value and transact with one connected aviation workspace built for professionals.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#aircraft-search" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-[13px] font-bold text-primary-foreground hover:opacity-90">
              Search an aircraft <ArrowRight size={15} />
            </a>
            <Link
              to="/listings"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border px-6 py-3 text-[13px] font-bold"
              style={{ color: foreground, borderColor: panelBorder, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.78)" }}
            >
              Explore the market
            </Link>
          </div>

          <div id="aircraft-search" className="mt-7 w-full max-w-[580px] scroll-mt-40">
            <SmartAircraftSearch variant="hero" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-1.5 rounded-full border px-3 py-2" style={{ background: panel, borderColor: panelBorder }}>
                <span className="text-[16px] font-black leading-none text-primary">{stat.value}</span>
                <span className="text-[8px] font-semibold uppercase tracking-[0.1em]" style={{ color: muted }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside
          className="hidden rounded-lg p-5 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl lg:block"
          style={{ background: panel, border: `1px solid ${panelBorder}`, color: foreground }}
        >
          <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: panelBorder }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Connected workflow</p>
              <h2 className="mt-1 text-lg font-bold">Aircraft workspace</h2>
            </div>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-600">Ready</span>
          </div>

          <div className="py-2">
            {WORKFLOW.map((item) => (
              <div key={item.label} className="flex items-center gap-3 border-b py-3 last:border-b-0" style={{ borderColor: panelBorder }}>
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                <div className="min-w-0">
                  <p className="text-[12px] font-bold">{item.label}</p>
                  <p className="text-[10px]" style={{ color: muted }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <Link to="/intrazone" className="mt-2 inline-flex min-h-11 w-full items-center justify-between rounded-lg bg-foreground px-4 py-3 text-[12px] font-bold text-background">
            Open Workspace <ArrowRight size={15} />
          </Link>
        </aside>
      </div>
    </section>
  );
}

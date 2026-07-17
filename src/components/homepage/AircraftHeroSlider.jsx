import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AircraftHeroSlide from "@/components/homepage/AircraftHeroSlide";
import IntraZonePreview from "@/components/homepage/IntraZonePreview";
import { AIRCRAFT_HERO_SLIDES } from "@/components/homepage/aircraftHeroData";

export default function AircraftHeroSlider() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % AIRCRAFT_HERO_SLIDES.length), 7000);
    return () => window.clearInterval(timer);
  }, []);
  const move = (step) => setActive((active + step + AIRCRAFT_HERO_SLIDES.length) % AIRCRAFT_HERO_SLIDES.length);

  return (
    <section className="dot-grid relative overflow-hidden bg-gradient-to-br from-background via-card to-secondary px-4 py-16 md:px-8" aria-roledescription="carousel" aria-label="Featured aircraft intelligence">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-muted/40" />
      <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 text-[22vw] font-black leading-none tracking-[-0.08em] text-primary/5">ABOS</div>
      <div className="relative mx-auto max-w-[1440px]">
        <AircraftHeroSlide aircraft={AIRCRAFT_HERO_SLIDES[active]} />
        <div className="relative z-20 -mt-20 grid gap-3 px-3 md:grid-cols-[48px_1fr_1fr_1fr_48px] md:px-8">
          <button onClick={() => move(-1)} aria-label="Previous aircraft" className="hidden min-h-12 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus-visible:ring-2 focus-visible:ring-ring md:block"><ChevronLeft className="mx-auto h-5 w-5" /></button>
          {AIRCRAFT_HERO_SLIDES.map((slide, index) => (
            <button key={slide.registration} onClick={() => setActive(index)} aria-label={`Show ${slide.model}`} aria-current={index === active} className={`cursor-pointer rounded-2xl text-left focus-visible:ring-2 focus-visible:ring-ring ${index === active ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"}`}><IntraZonePreview aircraft={slide} /></button>
          ))}
          <button onClick={() => move(1)} aria-label="Next aircraft" className="hidden min-h-12 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus-visible:ring-2 focus-visible:ring-ring md:block"><ChevronRight className="mx-auto h-5 w-5" /></button>
        </div>
        <div className="mt-5 flex justify-center gap-2 md:hidden">{AIRCRAFT_HERO_SLIDES.map((slide, index) => <button key={slide.registration} onClick={() => setActive(index)} aria-label={`Show ${slide.model}`} className={`h-3 min-h-0 w-10 rounded-full ${index === active ? "bg-primary" : "bg-muted"}`} />)}</div>
      </div>
    </section>
  );
}
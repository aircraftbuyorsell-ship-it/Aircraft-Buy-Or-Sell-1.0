import { Link } from "react-router-dom";
import HeroGlobe from "@/components/homepage/HeroGlobe";
import EditorialHudCard from "@/components/homepage/EditorialHudCard";
import EditorialStatsBar from "@/components/homepage/EditorialStatsBar";

export default function HomepageEditorialHero() {
  return (
    <>
      <section aria-label="Global aviation network" className="relative h-[52vh] min-h-[360px] overflow-hidden border-b border-border bg-secondary">
        <HeroGlobe forceLight />
      </section>
      <section className="bg-background">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 py-14 md:grid-cols-[minmax(0,1fr)_310px] md:items-center md:px-10 md:py-20">
          <div className="max-w-2xl"><p className="mb-5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Aviation intelligence platform</p><h1 className="max-w-xl text-balance text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-foreground md:text-6xl">Aircraft intelligence.<br />From first signal to closed deal.</h1><p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">Search, verify, value and transact with one connected aviation workspace.</p><EditorialStatsBar embedded /><div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3"><Link to="/listings" className="inline-flex items-center justify-center rounded-md bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-85">Search an aircraft</Link><Link to="/listings" className="inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline-offset-4 hover:underline">Explore the market →</Link></div></div>
          <div className="md:justify-self-end"><EditorialHudCard /></div>
        </div>
      </section>
    </>
  );
}
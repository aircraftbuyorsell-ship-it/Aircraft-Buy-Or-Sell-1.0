import HeroGlobe from "@/components/homepage/HeroGlobe";

const PlaneIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>;
const RadarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/></svg>;

export default function HubHero({ kind, eyebrow, title, subtitle, toolCount }) {
  const Icon = kind === "marketspace" ? PlaneIcon : RadarIcon;
  return <section className="relative mb-6 overflow-hidden rounded-xl border border-border bg-card">
    <div className="grid min-h-[260px] lg:grid-cols-[1.15fr_.85fr]">
      <div className="relative z-10 flex flex-col justify-center p-6 md:p-10">
        <span className="abos-badge-promo mb-5 w-fit"><span className="abos-badge-promo-dot" aria-hidden="true" />{eyebrow}</span>
        <div className="mb-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/[0.06]"><Icon /></div><span className="abos-badge-category">{toolCount} intelligence tools</span></div>
        <h1 className="max-w-2xl text-3xl font-bold text-foreground md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">{subtitle}</p>
      </div>
      <div className="relative min-h-[240px] border-t border-border bg-background lg:min-h-full lg:border-l lg:border-t-0"><HeroGlobe /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-5"><p className="text-xs font-semibold text-primary">Global aircraft intelligence network</p></div></div>
    </div>
  </section>;
}
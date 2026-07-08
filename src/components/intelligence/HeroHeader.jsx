import SectionHeader from "./SectionHeader";

/**
 * ABOS Intelligence — page hero. Eyebrow + title + subtitle + CTA row.
 * primaryAction / secondaryAction: { label, icon: Icon, onClick } or { label, icon, to } (renders <a>/<Link> handled by caller via onClick).
 */
export default function HeroHeader({ eyebrow, icon: Icon, title, titleAccent, subtitle, primaryAction, secondaryAction, children }) {
  return (
    <section className="relative px-4 md:px-8 pt-10 pb-8 md:pt-14 md:pb-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,160,23,0.35) 0%, transparent 60%)" }} />
      <div className="max-w-6xl mx-auto relative z-10">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-[10px] font-bold tracking-[0.15em] uppercase border border-gold-official/30 bg-gold-bg text-gold-official">
            {Icon && <Icon className="w-3 h-3" />} {eyebrow}
          </div>
        )}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
          {title}{titleAccent && <> <span className="text-gold-official">{titleAccent}</span></>}
        </h1>
        {subtitle && (
          <p className="text-sm md:text-base max-w-2xl mt-3 leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap gap-3 mt-6">
            {primaryAction && (
              <button onClick={primaryAction.onClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold bg-gold-official text-white hover:opacity-90 transition-opacity cursor-pointer">
                {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />} {primaryAction.label}
              </button>
            )}
            {secondaryAction && (
              <button onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold border border-gold-official/40 text-gold-official hover:bg-gold-bg transition-colors cursor-pointer">
                {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />} {secondaryAction.label}
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export { SectionHeader };
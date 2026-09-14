/**
 * Instrument-panel header — cockpit style bar used by the Intelligence hub.
 * Icon tile left, title block center-left, metric readouts right, gauge tick rule below.
 */
export default function InstrumentHubHeader({ icon: Icon, eyebrow, title, subtitle, readouts = [] }) {
  return (
    <div className="mb-5 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 px-4 py-4 md:px-6">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-deep dark:text-primary">{eyebrow}</p>
          )}
          <h1 className="truncate text-lg font-bold text-foreground md:text-xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {readouts.length > 0 && (
          <div className="flex shrink-0 divide-x divide-border">
            {readouts.map((r) => (
              <div key={r.label} className="px-3 first:pl-0 last:pr-0 md:px-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{r.label}</p>
                <p className="mt-0.5 font-mono text-sm font-bold tabular-nums text-gold-deep dark:text-gold-bright md:text-base">{r.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gauge scale — hairline gold rule with tick marks */}
      <div className="relative h-2 border-t border-primary/40">
        <div className="absolute inset-x-0 top-0 flex justify-between px-2">
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i} className={`w-px bg-primary/40 ${i % 5 === 0 ? "h-2" : "h-1"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
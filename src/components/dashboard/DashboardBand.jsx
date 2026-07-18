/**
 * DashboardBand — sjednocený obal pro sekce dashboardu.
 * Poskytuje kotvu pro jump bar, eyebrow + nadpis + intro a konzistentní vertikální rytmus.
 * Potomci si keepují vlastní layout/max-width — band pouze rámuje skupinu sekcí.
 */
export default function DashboardBand({ id, eyebrow, title, intro, children }) {
  return (
    <section id={id} className="scroll-mt-32 py-10 md:py-14">
      {(eyebrow || title) && (
        <div className="mx-auto mb-8 max-w-[1360px] px-4 md:mb-10 md:px-8">
          {eyebrow && (
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4A017]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4A017]">
                {eyebrow}
              </span>
            </div>
          )}
          {title && (
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-[30px]">
              {title}
            </h2>
          )}
          {intro && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              {intro}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-8 md:gap-12">{children}</div>
    </section>
  );
}
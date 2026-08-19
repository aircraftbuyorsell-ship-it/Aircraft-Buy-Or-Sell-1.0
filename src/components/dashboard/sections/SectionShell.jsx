/**
 * SectionShell — Core Platform section wrapper.
 * Provides consistent max-width, padding, eyebrow/title/subtitle, and top border.
 * Uses semantic Tailwind tokens for automatic light/dark mode support.
 */
export default function SectionShell({
  eyebrow,
  title,
  subtitle,
  children,
  bg = "transparent",
  action,
  topBorder = true,
  padding = "80px 0",
}) {
  return (
    <section
      className={topBorder ? "border-t border-border" : ""}
      style={{ background: bg, padding }}
    >
      <div className="max-w-[1280px] mx-auto px-4 md:px-8">
        {(eyebrow || title) && (
          <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
            <div>
              {eyebrow && (
                <p className="text-[10px] tracking-[0.14em] uppercase text-gold-official mb-2">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="text-2xl md:text-[28px] font-medium tracking-[-0.03em] text-foreground m-0">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-[13px] text-muted-foreground max-w-[560px] leading-[1.6] mt-2">
                  {subtitle}
                </p>
              )}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
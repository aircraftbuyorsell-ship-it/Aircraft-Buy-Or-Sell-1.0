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
      <div className="mx-auto max-w-[1500px] px-4 md:px-8">
        {(eyebrow || title) && (
          <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
            <div>
              {eyebrow && (
                <p className="abos-badge-category mb-2">{eyebrow}</p>
              )}
              {title && (
                <h2 className="m-0 text-2xl font-semibold text-foreground md:text-[28px]">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-2 max-w-[560px] text-sm text-muted-foreground">
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
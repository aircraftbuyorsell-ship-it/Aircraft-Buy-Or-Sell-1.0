/**
 * SectionShell — Core Platform section wrapper.
 * Provides consistent max-width, padding, eyebrow/title/subtitle, and top border.
 * Use across all Core Platform pages for uniform spacing & typography.
 */
export default function SectionShell({
  eyebrow,
  title,
  subtitle,
  children,
  bg = "#0B1220",
  action,
  topBorder = true,
  padding = "80px 0",
}) {
  return (
    <section
      style={{
        background: bg,
        padding,
        borderTop: topBorder ? "0.5px solid rgba(212,160,23,0.08)" : "none",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
        {(eyebrow || title) && (
          <div
            style={{
              marginBottom: 32,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              {eyebrow && (
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#D4A017",
                    marginBottom: 8,
                  }}
                >
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2
                  style={{
                    fontSize: 28,
                    fontWeight: 500,
                    letterSpacing: "-0.03em",
                    color: "#fff",
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.4)",
                    maxWidth: 560,
                    lineHeight: 1.6,
                    marginTop: 8,
                  }}
                >
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
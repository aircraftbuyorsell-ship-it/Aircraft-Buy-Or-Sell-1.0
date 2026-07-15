import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/lib/useTheme";

/** Shared marketing layout for /solutions/* role landing pages. */
export default function SolutionLanding({ eyebrow, title, accent, subtitle, features, primary, secondary }) {
  const isDark = useTheme();
  const colors = isDark
    ? {
        text: "#fff",
        muted: "rgba(255,255,255,0.60)",
        card: "rgba(255,255,255,0.03)",
        cardBorder: "rgba(255,255,255,0.07)",
        secondary: "rgba(255,255,255,0.05)",
        secondaryBorder: "rgba(255,255,255,0.14)",
        secondaryText: "rgba(255,255,255,0.85)",
      }
    : {
        text: "#111827",
        muted: "#5b6472",
        card: "#ffffff",
        cardBorder: "rgba(15,23,42,0.10)",
        secondary: "#ffffff",
        secondaryBorder: "rgba(15,23,42,0.14)",
        secondaryText: "#1f2937",
      };

  return (
    <div data-theme-surface="adaptive" className="min-h-screen px-4 pb-24 pt-24 sm:px-8 sm:pt-28" style={{ color: colors.text }}>
      <div className="mx-auto max-w-[1080px]">
        <div className="max-w-[680px]">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{ background: "rgba(212,160,23,0.09)", border: "1px solid rgba(212,160,23,0.24)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</span>
          </div>

          <h1 className="mb-5 leading-[1.06]" style={{ fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 600, letterSpacing: 0 }}>
            {title} <span className="font-bold text-primary">{accent}</span>
          </h1>

          <p className="mb-8 max-w-[560px] text-[15px] leading-relaxed" style={{ color: colors.muted }}>
            {subtitle}
          </p>

          <div className="mb-14 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              to={primary.to}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-[13px] font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {primary.label} <ArrowRight size={14} />
            </Link>
            <Link
              to={secondary.to}
              className="inline-flex min-h-11 items-center justify-center rounded-lg px-6 py-3 text-[13px] font-bold transition-colors"
              style={{ background: colors.secondary, border: `1px solid ${colors.secondaryBorder}`, color: colors.secondaryText }}
            >
              {secondary.label}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-lg p-5" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
                  <Icon size={16} className="text-primary" />
                </div>
                <h3 className="mb-1.5 text-[14px] font-bold" style={{ color: colors.text }}>{feature.title}</h3>
                <p className="m-0 text-[12px] leading-relaxed" style={{ color: colors.muted }}>{feature.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

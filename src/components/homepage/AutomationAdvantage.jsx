import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";

const pillars = [
  { status: "Available Now", title: "ATI Scoring", copy: "One decision-ready score across 8 evidence-based aircraft dimensions, protected by deterministic scoring controls." },
  { status: "Phased Roadmap", title: "APL Protocol", copy: "The provenance and trust layer designed to explain why aircraft data, ownership records, and maintenance evidence can be trusted." },
  { status: "Available Now", title: "Core API Gateway", copy: "Scoped API access to search, valuation, structured listings, and aviation intelligence for partner workflows." },
];

export default function AutomationAdvantage() {
  const isDark = useTheme();
  const palette = isDark
    ? {
        panel: "#090B10",
        border: "#3E4953",
        text: "#D7DCE2",
        muted: "#F0F2F4",
        card: "rgba(32,40,49,0.95)",
        cardHeader: "#172028",
        cardBorder: "#51606C",
        button: "#D7DCE2",
        buttonText: "#090B10",
      }
    : {
        panel: "#ffffff",
        border: "rgba(15,23,42,0.12)",
        text: "#111827",
        muted: "#5b6472",
        card: "#f8fafc",
        cardHeader: "#f1f4f7",
        cardBorder: "rgba(15,23,42,0.10)",
        button: "#111827",
        buttonText: "#ffffff",
      };

  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 py-12 md:px-8 md:py-16">
      <div
        className="overflow-hidden rounded-lg px-5 py-12 sm:px-10 md:px-14 md:py-16"
        style={{
          background: palette.panel,
          border: `1px solid ${palette.border}`,
          color: palette.text,
          boxShadow: isDark ? "0 24px 70px rgba(0,0,0,0.36)" : "0 18px 50px rgba(15,23,42,0.08)",
        }}
      >
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Connected aviation workflow</p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3.6rem)] font-bold leading-[1.02]" style={{ color: palette.text, letterSpacing: 0 }}>
            The Automation Advantage
          </h2>
          <p className="mt-4 text-[clamp(1.1rem,2vw,1.55rem)] font-semibold leading-tight text-primary">
            From raw aircraft data to decision-ready trust.
          </p>
          <p className="mx-auto mt-6 max-w-[780px] text-[clamp(0.95rem,1.3vw,1.12rem)] leading-relaxed" style={{ color: palette.muted }}>
            ABOS connects aircraft identity, transparency scoring and partner-ready data in one traceable workflow.
          </p>
        </div>

        <div className="mx-auto mt-9 grid max-w-[980px] gap-4 md:grid-cols-3">
          {pillars.map(({ status, title, copy }) => (
            <article key={title} className="overflow-hidden rounded-lg" style={{ background: palette.card, border: `1px solid ${palette.cardBorder}` }}>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs" style={{ background: palette.cardHeader, borderBottom: `1px solid ${palette.cardBorder}` }}>
                <span style={{ color: palette.muted }}>Status</span>
                <span className="whitespace-nowrap text-primary">{status}</span>
              </div>
              <div className="px-4 pb-5 pt-4">
                <h3 className="text-lg font-bold leading-tight" style={{ color: palette.text }}>{title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: palette.muted }}>{copy}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-7">
          <Link to="/developers/core-api" className="inline-flex min-h-11 items-center rounded-lg px-5 py-2.5 text-sm font-bold" style={{ background: palette.button, color: palette.buttonText }}>
            Explore Core API
          </Link>
          <Link to="/escrow" className="inline-flex min-h-11 items-center px-2 py-2.5 text-sm font-bold" style={{ color: palette.text }}>
            View Settlement Roadmap
          </Link>
        </div>
      </div>
    </section>
  );
}

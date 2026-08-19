import { Link } from "react-router-dom";

/* Brand icons */
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
  </svg>
);
const SparklesIcon = ({ color = "#D4A017" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

export default function CtaSection() {
  return (
    <section style={{ background: "var(--brand-background)" }}>
      <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 md:py-24">
        <div
          className="relative overflow-hidden p-6 md:p-14"
          style={{
            background: "linear-gradient(135deg, rgba(212,160,23,0.08) 0%, var(--brand-surface) 50%, var(--brand-surface) 100%)",
            border: "1px solid rgba(212,160,23,0.2)",
            borderRadius: "var(--brand-radius-lg)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />

          <div className="relative max-w-2xl">
            <div className="mb-4">
              <span className="abos-badge-promo">
                <span className="abos-badge-promo-dot" aria-hidden="true" />
                Get started today
              </span>
            </div>

            <h2 className="mb-4 text-2xl text-foreground md:text-4xl" style={{ lineHeight: "1.1" }}>
              Verify your first aircraft
              <br />
              <span style={{ color: "var(--brand-primary)" }}>in under 60 seconds.</span>
            </h2>

            <p className="mb-8 max-w-lg text-sm text-muted-foreground md:text-base" style={{ lineHeight: "1.6" }}>
              No account required to search. Enter a tail number, get a Digital Twin report with ATI score,
              valuation, and verification status — instantly.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/verify" className="abos-btn-arrow">
                Start Searching
                <ArrowRightIcon />
              </Link>
              <Link to="/pricing" className="abos-btn-outline">
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
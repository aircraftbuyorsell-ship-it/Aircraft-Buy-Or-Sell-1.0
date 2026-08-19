import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-[1500px] px-4 py-16 md:px-8 md:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-[#D4A017]/20 bg-gradient-to-br from-[#D4A017]/[0.08] via-card to-card p-8 md:p-14">
          {/* Decorative dots */}
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />

          <div className="relative max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4A017]/20 bg-[#D4A017]/[0.08] px-3 py-1">
              <Sparkles className="h-3 w-3 text-[#D4A017]" />
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A67C00] dark:text-[#D4A017]">
                Get started today
              </span>
            </div>

            <h2 className="mb-4 text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">
              Verify your first aircraft
              <br />
              <span className="bg-gradient-to-r from-[#D4A017] to-[#F5C842] bg-clip-text text-transparent">
                in under 60 seconds.
              </span>
            </h2>

            <p className="mb-8 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
              No account required to search. Enter a tail number, get a Digital Twin report with ATI score,
              valuation, and verification status — instantly.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/verify"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D4A017] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#C9A22F]"
              >
                Start Searching
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:border-[#D4A017]/40"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
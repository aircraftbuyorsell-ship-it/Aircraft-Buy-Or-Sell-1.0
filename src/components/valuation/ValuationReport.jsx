import { BadgeDollarSign, BarChart3, CheckCircle2, TrendingUp } from "lucide-react";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-2xl p-5 bg-card border border-border">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-[#D4A017]" />
      </div>
      <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-foreground">{value}</p>
      {note && <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>}
    </div>
  );
}

export default function ValuationReport({ result, aircraft }) {
  if (!result) {
    return (
      <div className="rounded-2xl p-6 text-sm leading-7 bg-muted/40 border border-dashed border-border text-muted-foreground">
        Your AI-driven valuation report will appear here with pricing guidance, confidence level, and sales-positioning insights.
      </div>
    );
  }

  const confidenceCopy = result.confidence === "HIGH"
    ? "Strong comparable depth supports premium sales confidence."
    : result.confidence === "MEDIUM"
      ? "Moderate comparable depth supports a directional market position."
      : "Limited comparable depth; use this estimate as an initial pricing signal.";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#D4A017]/30 bg-card p-6 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#E8A83A]">Automated market conclusion</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">{aircraft.year} {aircraft.make} {aircraft.model}</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          OMVM positions this aircraft at an estimated market value of <strong className="text-foreground">{money.format(result.omvm_value)}</strong>. This figure can support seller pricing strategy, buyer negotiation framing, and broker-level market conversations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard icon={BadgeDollarSign} label="OMVM estimate" value={money.format(result.omvm_value)} note="Automated price estimation based on depreciation, engine life, avionics, and comparable market data." />
        <MetricCard icon={BarChart3} label="Confidence" value={result.confidence || "LOW"} note={confidenceCopy} />
        <MetricCard icon={TrendingUp} label="Deal position" value={result.deal_label ? result.deal_label.toUpperCase() : "Market guidance"} note={result.discount_pct != null ? `${Math.abs(result.discount_pct)}% ${result.discount_pct >= 0 ? "below" : "above"} estimated market value.` : "Add an asking price to calculate deal positioning."} />
        <MetricCard icon={CheckCircle2} label="Engine remaining" value={`${result.engine_remaining_pct}%`} note="Engine life is factored into the valuation as a key buyer confidence driver." />
      </div>

      <div className="rounded-2xl p-5 text-sm leading-7 bg-card border border-border text-muted-foreground">
        <h3 className="text-lg font-black tracking-tight text-foreground" style={{ letterSpacing: "-0.01em" }}>Sales advisory note</h3>
        <p className="mt-2">
          Position the aircraft with a value-led narrative: highlight documented condition, remaining engine life, avionics quality, and price discipline versus comparable inventory. For buyer conversations, use the OMVM range as a professional anchor rather than a fixed appraisal.
        </p>
      </div>
    </div>
  );
}
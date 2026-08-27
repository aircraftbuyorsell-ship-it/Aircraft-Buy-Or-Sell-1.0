import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import SectionShell from "./SectionShell";

const PLANS = [
  {
    key: "ati_score",
    name: "ATI Score",
    price: "Free",
    tagline: "Know the aircraft at a glance.",
    features: [
      "ATI transparency score",
      "Key risk signals",
      "Data-quality indicators",
      "Locked report preview",
    ],
    cta: "Get ATI Score free",
    to: "/ati-verify",
    featured: false,
  },
  {
    key: "ati_report",
    name: "ATI Report",
    price: "$49",
    priceNote: "per aircraft",
    tagline: "Aircraft due diligence before you buy.",
    features: [
      "Identity & provenance",
      "Registry & verification signals",
      "History and risk indicators",
      "Data gaps and confidence",
      "Sources and methodology",
    ],
    cta: "Buy ATI Report",
    to: "/pricing",
    featured: true,
    flag: "Most popular",
  },
  {
    key: "ati_pro",
    name: "ATI Pro",
    price: "$199",
    priceNote: "per aircraft",
    tagline: "Financial Advisor + Investment Brief.",
    features: [
      "Everything in ATI Report",
      "Market valuation & comparables",
      "CAPEX / OPEX analysis",
      "Engine, MRO & avionics economics",
      "Lease, financing & ownership scenarios",
    ],
    cta: "Get Investment Brief",
    to: "/pricing",
    featured: false,
  },
];

export default function PricingLadder() {
  return (
    <SectionShell
      eyebrow="Aircraft Intelligence"
      title="Pay Only For What You Need To Know"
      subtitle="Start with a free ATI Score. Buy a full due-diligence report or an investment-grade brief only for the aircraft you're actually considering."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className="relative rounded-xl p-6 flex flex-col bg-card border"
            style={
              plan.featured
                ? { borderColor: "rgba(212,160,23,0.45)", background: "rgba(212,160,23,0.05)" }
                : { borderColor: "var(--border)" }
            }
          >
            {plan.flag && (
              <span
                className="absolute -top-3 left-6 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{ background: "#D4A017", color: "#0B1220" }}
              >
                {plan.flag}
              </span>
            )}
            <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{plan.tagline}</p>
            <div className="flex items-baseline gap-1.5 mb-5">
              <span className="text-3xl font-black text-foreground">{plan.price}</span>
              {plan.priceNote && (
                <span className="text-[11px] text-muted-foreground">{plan.priceNote}</span>
              )}
            </div>
            <ul className="flex flex-col gap-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 size={14} className="text-gold-official mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to={plan.to}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] py-3 text-sm font-bold no-underline hover:opacity-90"
              style={
                plan.featured
                  ? { background: "#D4A017", color: "#0B1220" }
                  : { background: "rgba(212,160,23,0.10)", border: "1px solid rgba(212,160,23,0.30)", color: "#D4A017" }
              }
            >
              {plan.cta} <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-muted-foreground pt-4 border-t border-border">
        <span>Report packs from $25/report · API & white-label for teams from €690/month</span>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-gold-official"
        >
          View full pricing <ArrowRight size={14} />
        </Link>
      </div>
    </SectionShell>
  );
}

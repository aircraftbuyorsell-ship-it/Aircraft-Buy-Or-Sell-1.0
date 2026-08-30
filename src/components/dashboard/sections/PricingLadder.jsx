import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import SectionShell from "./SectionShell";
import { ABOS_PRODUCTS } from "@/lib/abosProducts";

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
    price: ABOS_PRODUCTS.ATI_REPORT.displayPrice,
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
    key: "deal_analysis",
    name: ABOS_PRODUCTS.DEAL_ANALYSIS.name,
    price: ABOS_PRODUCTS.DEAL_ANALYSIS.displayPrice,
    priceNote: "per aircraft",
    tagline: "Know whether the aircraft is actually a good deal.",
    features: [
      "Everything in ATI Report",
      "Market valuation & comparables",
      "Deal score and price position",
      "Risk and negotiation analysis",
      "Buy / negotiate / review / pass guidance",
    ],
    cta: "Analyze This Deal",
    to: "/pricing",
    featured: false,
  },
  {
    key: "investment",
    name: ABOS_PRODUCTS.INVESTMENT.name,
    price: ABOS_PRODUCTS.INVESTMENT.displayPrice,
    priceNote: "per aircraft",
    tagline: "Understand the ownership economics before committing.",
    features: [
      "Complete Deal Analysis",
      "CAPEX / OPEX economics",
      "Ownership and financing scenarios",
      "Investment risk assessment",
      "3–5 year ownership outlook",
    ],
    cta: "Run Investment Analysis",
    to: "/pricing",
    featured: false,
  },
  {
    key: "professional",
    name: ABOS_PRODUCTS.PROFESSIONAL.name,
    price: ABOS_PRODUCTS.PROFESSIONAL.displayPrice,
    priceNote: "per review",
    tagline: "Have an aviation professional review the ABOS analysis.",
    features: [
      "AI analysis package",
      "Identified risks and questions",
      "Professional comments",
      "Credentialed review workflow",
      "Review status and audit trail",
    ],
    cta: "Request Professional Review",
    to: "/experts",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
        <span>Investment $149 · Professional Review from $499</span>
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

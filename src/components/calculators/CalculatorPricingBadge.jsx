import { Link } from "react-router-dom";
import { CheckCircle2, Lock, Sparkles, Gift, Coins } from "lucide-react";
import { useMonetization } from "@/hooks/useMonetization";
import { ABOS_PRODUCTS } from "@/lib/abosProducts";

/**
 * CalculatorPricingBadge — smart pricing display.
 *
 * - FREE: green "Free" badge
 * - PAID + registered: member price with strikethrough list price
 * - PAID + unregistered: fiat price + "Register to save X%" nudge
 * - BUNDLED with OPEX: "Included with OPEX" badge
 */
export default function CalculatorPricingBadge({ featureId, compact = false }) {
  const { getPrice } = useMonetization();
  const price = getPrice(featureId);
  const isDecisionIncluded = [
    "opex_calculator", "insurance_calculator", "leasing_calculator", "tax_benefit",
    "avionics_upgrade", "exterior_refurb", "interior_refurb", "detailing", "fractional"
  ].includes(featureId);

  if (!price) return null;

  // Calculator tools are not separate V1 products. They are included in the $99 Deal Analysis decision workflow.
  if (isDecisionIncluded) {
    return (
      <div className="flex flex-col gap-0.5">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit"
          style={{ background: "rgba(245,194,66,0.10)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.22)" }}
        >
          <CheckCircle2 className="w-2.5 h-2.5" /> Included with Deal Analysis
        </span>
        {!compact && <span className="text-[9px] text-white/40">Full decision analysis: {ABOS_PRODUCTS.DEAL_ANALYSIS.displayPrice}</span>}
      </div>
    );
  }

  // Free feature
  if (price?.is_free) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
        style={{ background: "rgba(93,202,165,0.12)", color: "#5dcaa5", border: "0.5px solid rgba(93,202,165,0.25)" }}
      >
        <Gift className="w-2.5 h-2.5" /> Free
      </span>
    );
  }

  // Bundled with OPEX
  const feature = null;
  if (feature?.bundled_with === "opex_calculator") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
        style={{ background: "rgba(78,142,247,0.12)", color: "#4e8ef7", border: "0.5px solid rgba(78,142,247,0.25)" }}
      >
        <CheckCircle2 className="w-2.5 h-2.5" /> Incl. with OPEX
      </span>
    );
  }

  // Paid — registered member
  if (false && price.member_price_eur) {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1.5">
          {price.list_price_eur && (
            <span className="text-[10px] line-through" style={{ color: "rgba(255,255,255,0.30)" }}>
              ${price.list_price_eur}
            </span>
          )}
          <span className="text-sm font-black" style={{ color: "#5dcaa5" }}>
            ${price.member_price_eur}
          </span>
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.40)" }}>
            or {price.credits} cr
          </span>
        </div>
        {!compact && (
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider w-fit"
            style={{ background: "rgba(93,202,165,0.10)", color: "#5dcaa5" }}
          >
            <Sparkles className="w-2 h-2" /> Member price
          </span>
        )}
      </div>
    );
  }

  // Paid — unregistered (show full price + registration nudge)
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-black" style={{ color: "rgba(255,255,255,0.90)" }}>
          ${price.fiat_eur}
        </span>
        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.40)" }}>
          or {price.credits} cr
        </span>
      </div>
      {!compact && (
        <Link
          to="/pricing"
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80 w-fit"
          style={{ background: "rgba(245,194,66,0.10)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.20)" }}
        >
          <Lock className="w-2 h-2" /> Register — save {price.discount_pct || 30}%
        </Link>
      )}
    </div>
  );
}
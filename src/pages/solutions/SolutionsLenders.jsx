import SolutionLanding from "@/components/solutions/SolutionLanding";
import { TrendingUp, Shield, Landmark, BarChart2 } from "lucide-react";

export default function SolutionsLenders() {
  return (
    <SolutionLanding
      eyebrow="Solutions · For Lenders"
      title="Underwrite aircraft with"
      accent="independent data"
      subtitle="Collateral decisions need more than an asking price. OMVM valuations, registry verification and transaction visibility give lenders and lessors a defensible data trail."
      features={[
        { icon: TrendingUp, title: "OMVM Valuation", desc: "Market-calibrated value model with comparable sales and confidence scoring for every airframe." },
        { icon: Shield, title: "Registry Verification", desc: "FAA and international registry cross-checks with data-integrity conflict detection." },
        { icon: Landmark, title: "Transaction Visibility", desc: "Milestone-level insight into escrow and closing status for financed deals." },
        { icon: BarChart2, title: "Market Analytics", desc: "Fleet-level price trends, liquidity and days-on-market data for portfolio monitoring." },
      ]}
      primary={{ to: "/valuation", label: "Run a Valuation" }}
      secondary={{ to: "/analytics", label: "Market Analytics" }}
    />
  );
}
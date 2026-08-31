import SolutionLanding from "@/components/solutions/SolutionLanding";
import { Shield, Zap, Radar, CheckCircle } from "lucide-react";

export default function SolutionsBuyers() {
  return (
    <SolutionLanding
      eyebrow="Solutions · For Buyers"
      title="Buy aircraft with"
      accent="verified intelligence"
      subtitle="Every aircraft comes with a Digital Twin — registry-verified identity, AI scoring and market-calibrated valuation — so you know exactly what you're buying before the first call."
      features={[
        { icon: Shield, title: "ATI Passport", desc: "Registry-verified aircraft identity with 8-dimension transparency scoring on every listing." },
        { icon: Zap, title: "AI Quick Score", desc: "Instant scorecard from any listing text or N-number — spot red flags in seconds." },
        { icon: Radar, title: "Deal Radar", desc: "Automated alerts when aircraft matching your criteria hit the market below OMVM value." },
        { icon: CheckCircle, title: "Pre-buy Coordination", desc: "Verified A&P / IA experts, inspection scheduling and document verification in one flow." },
      ]}
      primary={{ to: "/listings", label: "Browse Aircraft" }}
      secondary={{ to: "/ati-quick-score", label: "Run a Quick Score" }}
    />
  );
}
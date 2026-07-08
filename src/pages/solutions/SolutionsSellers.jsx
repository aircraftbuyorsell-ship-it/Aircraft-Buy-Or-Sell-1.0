import SolutionLanding from "@/components/solutions/SolutionLanding";
import { Plane, BadgeCheck, GitBranch, Users } from "lucide-react";

export default function SolutionsSellers() {
  return (
    <SolutionLanding
      eyebrow="Solutions · For Sellers"
      title="Sell faster with a"
      accent="verified listing"
      subtitle="An ATI-verified aircraft sells on trust, not promises. Build the Digital Twin, get the verification badge and let the automated sales pipeline carry the deal to closing."
      features={[
        { icon: Plane, title: "Digital Twin Listing", desc: "Your aircraft's registry data, specs and history assembled automatically into one verified profile." },
        { icon: BadgeCheck, title: "ATI Verification Badge", desc: "Independent transparency score that separates your listing from unverified inventory." },
        { icon: GitBranch, title: "Sales Pipeline", desc: "Milestone-driven workflow — documents, valuation, signing and closing orchestrated end-to-end." },
        { icon: Users, title: "Qualified Leads", desc: "Buyer interest scored and matched, so you spend time only on serious prospects." },
      ]}
      primary={{ to: "/sales-pipeline", label: "Start a Sales Pipeline" }}
      secondary={{ to: "/listings", label: "View Listings" }}
    />
  );
}
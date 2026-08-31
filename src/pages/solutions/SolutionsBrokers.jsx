import SolutionLanding from "@/components/solutions/SolutionLanding";
import { Briefcase, GitBranch, Landmark, FileText } from "lucide-react";

export default function SolutionsBrokers() {
  return (
    <SolutionLanding
      eyebrow="Solutions · For Brokers"
      title="Run your brokerage on"
      accent="ABOS Intelligence"
      subtitle="Broker agreements, deal pipelines, commission tracking and market intelligence — the operating system for professional aircraft brokers."
      features={[
        { icon: Briefcase, title: "Broker Profile & Agreements", desc: "Verified broker identity with e-signed exclusivity agreements anchored to each aircraft." },
        { icon: GitBranch, title: "Deal Pipeline CRM", desc: "Every mandate tracked milestone-by-milestone with AI-assisted execution at each step." },
        { icon: Landmark, title: "Commission Tracking", desc: "Transparent commission waterfall from offer to settlement — no spreadsheet reconciliation." },
        { icon: FileText, title: "Market Reports", desc: "Client-ready market intelligence and valuation reports generated on demand." },
      ]}
      primary={{ to: "/sales-pipeline", label: "Open Deal Pipeline" }}
      secondary={{ to: "/market-reports", label: "Market Reports" }}
    />
  );
}
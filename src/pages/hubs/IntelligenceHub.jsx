import { BarChart2, BrainCircuit } from "lucide-react";
import HubTabs, { lazyPage } from "@/components/hub/HubTabs";
import InstrumentHubHeader from "@/components/hub/InstrumentHubHeader";

const FinanceAdvisorChat = lazyPage(() => import("@/pages/FinanceAdvisorChat"));

// ABOS Assistant is the single conversational entry point for the Intelligence stack.
// The underlying specialist pages remain available through direct routes, but are
// treated as assistant capabilities rather than separate Intelligence products.
const TABS = [
  { key: "assistant", label: "ABOS Assistant", icon: BrainCircuit, Component: FinanceAdvisorChat },
];

export default function IntelligenceHub() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <InstrumentHubHeader
        icon={BarChart2}
        eyebrow="Intelligence"
        title="ABOS Assistant"
        subtitle="One conversational intelligence layer for valuation, market reports, investment briefing, calculators, and service intelligence."
        readouts={[
          { label: "Capabilities", value: "6" },
          { label: "Currency", value: "EUR" },
          { label: "Engine", value: "OMVM v5" },
        ]}
      />
      <HubTabs tabs={TABS} defaultTab="assistant" />
    </div>
  );
}
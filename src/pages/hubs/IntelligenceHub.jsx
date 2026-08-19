import {
  BarChart2, SlidersHorizontal, FileText, Brain, BrainCircuit,
  Calculator, Wrench,
} from "lucide-react";
import HubTabs, { lazyPage } from "@/components/hub/HubTabs";
import HubPageHeader from "@/components/hub/HubPageHeader";

const Analytics = lazyPage(() => import("@/pages/Analytics"));
const ValuationStudio = lazyPage(() => import("@/pages/ValuationStudio"));
const MarketReports = lazyPage(() => import("@/pages/MarketReports"));
const InvestmentBrief = lazyPage(() => import("@/pages/InvestmentBrief"));
const FinanceAdvisorChat = lazyPage(() => import("@/pages/FinanceAdvisorChat"));
const ServiceIntelligence = lazyPage(() => import("@/pages/ServiceIntelligence"));
const CalculatorsHub = lazyPage(() => import("@/pages/CalculatorsHub"));

const TABS = [
  { key: "analytics", label: "Market Analytics", icon: BarChart2, Component: Analytics },
  { key: "valuation", label: "Valuation Studio", icon: SlidersHorizontal, Component: ValuationStudio },
  { key: "reports", label: "Market Reports", icon: FileText, Component: MarketReports },
  { key: "investment", label: "Investment Brief", icon: Brain, Component: InvestmentBrief },
  { key: "finance-advisor", label: "Finance Advisor", icon: BrainCircuit, Component: FinanceAdvisorChat },
  { key: "calculators", label: "Calculators", icon: Calculator, Component: CalculatorsHub },
  { key: "service-intel", label: "Service Intel", icon: Wrench, Component: ServiceIntelligence },
];

export default function IntelligenceHub() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <HubPageHeader
        icon={BarChart2}
        eyebrow="Intelligence"
        title="Market Intelligence & Valuation"
        subtitle="Run valuations, analyze market trends, calculate operating costs, and generate investment briefs — all from one workbench."
        tabCount={TABS.length}
      />
      <HubTabs tabs={TABS} defaultTab="analytics" />
    </div>
  );
}
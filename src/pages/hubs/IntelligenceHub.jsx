import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  BarChart2, SlidersHorizontal, FileText, Brain, BrainCircuit,
  Calculator, Wrench,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import HubTabs, { lazyPage } from "@/components/hub/HubTabs";
import InstrumentHubHeader from "@/components/hub/InstrumentHubHeader";
import AircraftContextBar from "@/components/intelligence/AircraftContextBar";
import RecentAnalysisStrip from "@/components/intelligence/RecentAnalysisStrip";

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

const ageLabel = (date) => {
  if (!date) return "—";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
};

export default function IntelligenceHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const registration = searchParams.get("registration") || "";
  const { data: market } = useQuery({ queryKey: ["intelligence-hub-market"], queryFn: async () => (await base44.functions.invoke("computeMarketAnalytics", {})).data, staleTime: 300000 });
  const { data: history = [] } = useQuery({
    queryKey: ["intelligence-hub-history"],
    queryFn: async () => {
      const [valuations, passports, reports] = await Promise.all([
        base44.entities.OmvmValuation.list("-created_date", 5),
        base44.entities.ATIPassport.list("-created_date", 5),
        base44.entities.MarketReport.list("-created_date", 5),
      ]);
      return { valuations, passports, reports };
    },
    staleTime: 60000,
  });
  const recent = useMemo(() => [...(history.valuations || []).map((x) => ({ key: `v-${x.id}`, label: x.aircraft_registration, registration: x.aircraft_registration, kind: "OMVM valuation", tab: "valuation", at: x.created_at || x.created_date })), ...(history.passports || []).map((x) => ({ key: `p-${x.id}`, label: x.registration, registration: x.registration, kind: "ATI passport", tab: "investment", at: x.updated_date || x.created_date })), ...(history.reports || []).map((x) => ({ key: `r-${x.id}`, label: x.title || `${x.scope} report`, kind: "Market report", tab: "reports", at: x.generated_at || x.created_date }))].filter((x) => x.label).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5), [history]);
  const setContext = (nextRegistration, tab) => {
    const next = new URLSearchParams(searchParams);
    if (nextRegistration) next.set("registration", nextRegistration); else next.delete("registration");
    if (tab) next.set("tab", tab);
    setSearchParams(next, { replace: true });
  };
  const latestValuation = history.valuations?.[0];

  return (
    <div className="px-4 py-4 md:px-8 md:py-8">
      <InstrumentHubHeader icon={BarChart2} eyebrow="Intelligence" title="Market Intelligence & Valuation" subtitle="Run valuations, analyze market trends, calculate operating costs, and generate investment briefs — all from one workbench." readouts={[
        { label: "Live listings", value: market?.summary?.active?.toLocaleString() || "—" },
        { label: "Last valuation", value: ageLabel(latestValuation?.created_at || latestValuation?.created_date) },
        { label: "Market data", value: ageLabel(market?.generated_at) },
      ]} />
      <AircraftContextBar registration={registration} onChange={setContext} />
      <RecentAnalysisStrip items={recent} onSelect={(item) => setContext(item.registration || registration, item.tab)} />
      <HubTabs tabs={TABS} defaultTab="analytics" contentKey={registration} />
    </div>
  );
}
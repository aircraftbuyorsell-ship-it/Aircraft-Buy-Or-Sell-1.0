import { useOutletContext } from "react-router-dom";
import LeadEngine from "@/components/intrazone/LeadEngine";
import DealPipeline from "@/components/intrazone/DealPipeline";
import AssetIntelligence from "@/components/intrazone/AssetIntelligence";
import MatchingEngine from "@/components/intrazone/MatchingEngine";
import NegotiationEngine from "@/components/intrazone/NegotiationEngine";
import SalesDashboard from "@/components/intrazone/SalesDashboard";
import IntraZoneOverview from "@/components/intrazone/IntraZoneOverview";

function WorkspaceLinkPanel({ title, description, path, label }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4A017]">IntraZone</p><h2 className="mt-2 text-xl font-black text-white">{title}</h2><p className="mt-2 text-sm text-white/50">{description}</p><a href={path} className="mt-5 inline-flex rounded-xl bg-[#D4A017] px-4 py-2.5 text-sm font-black text-[#05060a]">{label}</a></div>;
}

export default function IntraZone() {
  const { activeTab } = useOutletContext();
  const sections = {
    overview: <IntraZoneOverview />,
    aircraft: <AssetIntelligence />,
    workflow: <DealPipeline />,
    leads: <LeadEngine />,
    match: <MatchingEngine />,
    negotiation: <NegotiationEngine />,
    insights: <SalesDashboard />,
    documents: <WorkspaceLinkPanel title="Documents" description="Use the existing ABOS Bill of Sale and inspection document workflows." path="/bill-of-sale" label="Open Bill of Sale" />,
    integrations: <WorkspaceLinkPanel title="Integrations" description="Review existing connected tools and partner integrations." path="/integration-kit" label="Open Integration Kit" />,
    escrow: <WorkspaceLinkPanel title="Escrow Status" description="Manage current transaction and escrow records in the existing ABOS flow." path="/escrow" label="Open Escrow" />,
  };
  return sections[activeTab] || sections.overview;
}
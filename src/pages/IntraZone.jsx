import { useState } from "react";
import LeadEngine from "@/components/intrazone/LeadEngine";
import DealPipeline from "@/components/intrazone/DealPipeline";
import AssetIntelligence from "@/components/intrazone/AssetIntelligence";
import MatchingEngine from "@/components/intrazone/MatchingEngine";
import NegotiationEngine from "@/components/intrazone/NegotiationEngine";
import SalesDashboard from "@/components/intrazone/SalesDashboard";
import { BarChart2, Zap, TrendingUp, Shield, Target, MessageSquare } from "lucide-react";

const TAB_GROUPS = [
  {
    label: "Intelligence",
    tabs: [
      { id: "dashboard",    label: "Sales Dashboard",   icon: BarChart2,      accent: true },
      { id: "intelligence", label: "Asset Intel",       icon: Shield },
    ]
  },
  {
    label: "Pipeline",
    tabs: [
      { id: "leads",        label: "Lead Engine",       icon: Zap },
      { id: "pipeline",     label: "Deal Pipeline",     icon: TrendingUp },
      { id: "matching",     label: "Match Engine",      icon: Target },
    ]
  },
  {
    label: "Deals",
    tabs: [
      { id: "negotiation",  label: "Negotiation Brief", icon: MessageSquare },
    ]
  },
];

const ALL_TABS = TAB_GROUPS.flatMap(g => g.tabs);

export default function IntraZone() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="bg-[#0B2D5B] px-4 md:px-8 pt-6 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#E8A83A] flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#0B2D5B]" />
          </div>
          <div>
            <p className="text-[#E8A83A]/70 text-[9px] uppercase tracking-[0.25em] font-bold">Deal Origination & Execution</p>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">IntraZone</h1>
          </div>
        </div>
        <p className="text-white/40 text-xs mt-1.5 ml-11 mb-4">Qualify leads faster. Structure better deals. Close with data-driven confidence.</p>

        {/* Grouped Tabs */}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {TAB_GROUPS.map(group => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <p className="text-[8px] uppercase tracking-[0.22em] font-black text-white/25 px-1 mb-0.5">{group.label}</p>
              <div className="flex gap-1">
                {group.tabs.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-xl text-[11px] font-bold border-b-2 transition-all ${
                        active
                          ? tab.accent
                            ? "bg-[#E8A83A] text-[#0B2D5B] border-[#E8A83A]"
                            : "bg-white/10 text-white border-white"
                          : "bg-transparent text-white/45 border-transparent hover:text-white/75 hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6">
        {activeTab === "dashboard"    && <SalesDashboard />}
        {activeTab === "leads"        && <LeadEngine />}
        {activeTab === "pipeline"     && <DealPipeline />}
        {activeTab === "intelligence" && <AssetIntelligence />}
        {activeTab === "matching"     && <MatchingEngine />}
        {activeTab === "negotiation"  && <NegotiationEngine />}
      </div>
    </div>
  );
}
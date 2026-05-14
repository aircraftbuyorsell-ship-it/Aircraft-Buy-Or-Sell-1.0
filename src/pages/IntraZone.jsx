import { useState } from "react";
import LeadEngine from "@/components/intrazone/LeadEngine";
import DealPipeline from "@/components/intrazone/DealPipeline";
import AssetIntelligence from "@/components/intrazone/AssetIntelligence";
import MatchingEngine from "@/components/intrazone/MatchingEngine";
import NegotiationEngine from "@/components/intrazone/NegotiationEngine";
import { Zap, TrendingUp, Shield, Target, MessageSquare } from "lucide-react";

const TABS = [
  { id: "leads",        label: "Lead Engine",      icon: Zap,           status: "live" },
  { id: "pipeline",     label: "Deal Pipeline",    icon: TrendingUp,    status: "live" },
  { id: "intelligence", label: "Asset Intel",      icon: Shield,        status: "live" },
  { id: "matching",     label: "Match Engine",     icon: Target,        status: "live" },
  { id: "negotiation",  label: "Negotiation Brief", icon: MessageSquare, status: "live" },
];

export default function IntraZone() {
  const [activeTab, setActiveTab] = useState("leads");

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="bg-[#0B2D5B] px-4 md:px-8 py-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#E8A83A] flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#0B2D5B]" />
          </div>
          <div>
            <p className="text-[#E8A83A]/70 text-[9px] uppercase tracking-[0.25em] font-bold">Sales Acceleration Platform</p>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase leading-none">IntraZone</h1>
          </div>
        </div>
        <p className="text-white/40 text-xs mt-2 ml-11">Sell more. Sell faster. Negotiate with data.</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 mt-5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[11px] font-bold border transition-all ${
                  activeTab === tab.id
                    ? "bg-[#E8A83A] text-[#0B2D5B] border-[#E8A83A]"
                    : "bg-white/[0.07] text-white/55 border-white/10 hover:border-white/25 hover:text-white/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 py-6">
        {activeTab === "leads"        && <LeadEngine />}
        {activeTab === "pipeline"     && <DealPipeline />}
        {activeTab === "intelligence" && <AssetIntelligence />}
        {activeTab === "matching"     && <MatchingEngine />}
        {activeTab === "negotiation"  && <NegotiationEngine />}
      </div>
    </div>
  );
}
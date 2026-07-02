import { useState } from "react";
import BridgeMatrix from "@/components/crossborder/BridgeMatrix";
import TransferOrchestrator from "@/components/crossborder/TransferOrchestrator";
import CustomsLogistics from "@/components/crossborder/CustomsLogistics";
import { Plane, ArrowLeftRight, Truck, Globe2 } from "lucide-react";

const TABS = [
  { id: "bridges",   label: "Authority Bridges",   icon: ArrowLeftRight },
  { id: "transfer",  label: "Transfer Workflow",   icon: Plane },
  { id: "customs",   label: "Customs & Freight",   icon: Truck },
];

export default function CrossBorderBridge() {
  const [activeTab, setActiveTab] = useState("bridges");

  return (
    <div className="min-h-screen" style={{ background: "transparent", color: "rgba(255,255,255,0.90)" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
            <Globe2 size={20} style={{ color: "#f5c242" }} />
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)" }}>
              Cross-Border Transfer OS
            </p>
            <h1 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 500, letterSpacing: "-0.04em", color: "rgba(255,255,255,0.90)", lineHeight: 1.06 }}>
              Bureaucratic Bridges
            </h1>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.60)", maxWidth: 640 }}>
          Regulatory transfer pathways, deregistration/registration workflows, customs clearance,
          and international freight orchestration for aircraft moving between FAA, UK CAA, and EASA jurisdictions.
        </p>
      </div>

      {/* Tab bar */}
      <div className="px-4 md:px-8 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap"
                style={{
                  background: active ? "rgba(245,194,66,0.09)" : "rgba(255,255,255,0.04)",
                  border: active ? "0.5px solid rgba(245,194,66,0.22)" : "0.5px solid rgba(255,255,255,0.08)",
                  color: active ? "#f5c242" : "rgba(255,255,255,0.60)",
                  fontSize: 12,
                  fontWeight: 600,
                  minHeight: 36,
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-8 pb-10">
        {activeTab === "bridges" && <BridgeMatrix />}
        {activeTab === "transfer" && <TransferOrchestrator />}
        {activeTab === "customs" && <CustomsLogistics />}
      </div>
    </div>
  );
}
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, FileText, Scale, PenTool, Flag } from "lucide-react";
import SectionShell from "./SectionShell";

const STEPS = [
{ icon: ShieldCheck, label: "Digital Twin", desc: "Registry, ADS-B & engine data from a single N-Number", color: "#4e8ef7" },
{ icon: FileText, label: "AI Document Review", desc: "Logbooks, damage history and AD/SB compliance", color: "#f5c242" },
{ icon: Scale, label: "Valuation & Contract", desc: "OMVM pricing and auto-generated purchase agreement", color: "#a78bfa" },
{ icon: PenTool, label: "E-Signatures &  USDC ", desc: "Digital signing with Stripe or USDC escrow", color: "#5dcaa5" },
{ icon: Flag, label: "Closing", desc: "Bill of Sale, registration transfer and handover", color: "#e2a44b" }];


export default function SalesPipelinePromo() {
  return (
    <SectionShell
      eyebrow="Sales Pipeline · Autonomous"
      title="Sell an Aircraft End-to-End, in One Workflow"
      subtitle="From Digital Twin verification to closing — AI handles document review, contracts and scheduling while you keep control of every milestone.">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {STEPS.map((s, i) =>
        <div key={s.label} className="relative rounded-xl p-4"
        style={{ background: "#fff", border: "0.5px solid rgba(166,124,0,0.15)" }}>
            <span className="absolute top-3 right-3 text-[10px] font-black" style={{ color: "#A67C00" }}>
              {i + 1}
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
          style={{ background: "rgba(166,124,0,0.08)" }}>
              <s.icon className="w-4 h-4" style={{ color: "#A67C00" }} />
            </div>
            <p className="text-[12px] font-bold mb-1" style={{ color: "#1A1A1A" }}>{s.label}</p>
            <p className="text-[10.5px] leading-relaxed" style={{ color: "#4D4D4D" }}>{s.desc}</p>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Link to="/sales-pipeline"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-black transition-transform hover:scale-[1.02]"
        style={{ background: "#A67C00", color: "#fff" }}>
          Start a Deal Pipeline <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </SectionShell>);

}
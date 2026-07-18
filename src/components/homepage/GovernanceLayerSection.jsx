import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const GROUPS = [
  { title: "Regulatory Governance", chips: ["DSA Support", "AI Act Governance", "GDPR Privacy"] },
  { title: "Protocol Governance", chips: ["APL Conformance", "ADL Validation", "Capability Registry", "Protocol Versions", "Contract Testing"] },
  { title: "Agent & Tool Governance", chips: ["Identity", "Capability", "Permissions", "Third-party Validation", "Credential Control", "Revocation"] },
  { title: "Automation Governance", chips: ["Workflow Validation", "Pipeline Validation", "Risk Gates", "Human Approval", "Runtime Policy Enforcement"] },
  { title: "Trust & Security", chips: ["Audit & Logging", "AI Transparency", "Explainability", "Data Provenance", "Security Controls", "Incident Response"] },
];

export default function GovernanceLayerSection() {
  return (
    <section className="bg-[#fbfaf7]">
      <div className="mx-auto max-w-[1100px] px-5 py-24 sm:px-8">
        <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.24em] text-[#D4A017]">ABOS Governance Layer</h2>
        <p className="mt-3 text-center text-2xl font-semibold tracking-[-0.02em] text-[#1a1a1a] sm:text-4xl">Trust, Control and Accountability by Design</p>

        <div className="mt-12 space-y-4">
          {GROUPS.map((g) => (
            <div key={g.title} className="rounded-2xl border border-black/[0.08] bg-white p-6 shadow-sm">
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]">{g.title}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {g.chips.map((c) => (
                  <span key={c} className="rounded-full border border-black/[0.08] bg-[#fbfaf7] px-3.5 py-1.5 text-[11px] font-semibold text-[#555]">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-[12px] leading-6 text-[#888]">
          Designed to support compliance with applicable European digital, AI, privacy and platform-governance requirements.
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-[11px] leading-5 text-[#aaa]">
          Actual obligations depend on the specific service, processing activity, jurisdiction, platform role, AI use case and deployment context.
        </p>

        <div className="mt-8 text-center">
          <Link to="/legal/ai-transparency" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#D4A017] hover:gap-3">
            Explore Trust & Governance <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
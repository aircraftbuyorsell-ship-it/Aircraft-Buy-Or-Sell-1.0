import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const OUTCOMES = ["Allow", "Allow with limits", "Require approval", "Sandbox", "Deny"];

export default function GovernedAutomationSection() {
  return (
    <section className="border-t border-black/[0.06] bg-white">
      <div className="mx-auto max-w-[1100px] px-5 py-24 sm:px-8">
        <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.24em] text-[#D4A017]">Governed Automation</h2>
        <p className="mt-3 text-center text-2xl font-semibold tracking-[-0.02em] text-[#1a1a1a] sm:text-4xl">Built for People, Applications and AI Agents</p>
        <p className="mx-auto mt-5 max-w-2xl text-center text-[13px] leading-7 text-[#666]">
          Authorized applications, tools, workflows and AI agents can access aviation capabilities through controlled ABOS interfaces.
        </p>

        <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#999]">Runtime evaluation inputs</p>
        <p className="mt-2 text-center text-[12px] text-[#666]">
          Actor identity · Capability · Permission scope · Target resource · Data classification · Execution risk · Evidence · Human approval
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {OUTCOMES.map((o) => (
            <span key={o} className="rounded-full border border-black/[0.09] bg-[#fbfaf7] px-4 py-1.5 text-[11px] font-bold text-[#3a3a3a]">{o}</span>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-black/[0.08] bg-[#fbfaf7] p-7">
            <div className="text-[16px] font-black text-[#1a1a1a]">APL</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D4A017]">Agent Protocol Language</div>
            <p className="mt-3 text-[13px] leading-6 text-[#666]">
              Standard communication for agents, applications, tools, workflows, pipelines, SDK clients, MCP and the ABOS Core API.
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.08] bg-[#fbfaf7] p-7">
            <div className="text-[16px] font-black text-[#1a1a1a]">ADL</div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#D4A017]">Agent & Automation Description and Validation Layer</div>
            <p className="mt-3 text-[13px] leading-6 text-[#666]">
              Describes and validates identities, capabilities, permissions, data use, risk and execution boundaries.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-[12px] leading-6 text-[#888]">
          Together, APL and ADL support interoperable, controlled and accountable automation across the ABOS ecosystem.
        </p>

        <div className="mt-8 text-center">
          <Link to="/developers" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#D4A017] hover:gap-3">
            Explore ABOS Protocols <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
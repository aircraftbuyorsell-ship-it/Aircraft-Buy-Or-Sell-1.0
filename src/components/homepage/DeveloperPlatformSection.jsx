import { Link } from "react-router-dom";

const SDKS = ["JavaScript SDK", "Python SDK", "MCP Layer"];
const TARGETS = ["Websites", "CRM", "Partner Apps", "Enterprise Workflows", "Agents"];

export default function DeveloperPlatformSection() {
  return (
    <section className="bg-[#fbfaf7]">
      <div className="mx-auto max-w-[1100px] px-5 py-24 sm:px-8">
        <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.24em] text-[#D4A017]">Platform & Developer Layer</h2>
        <p className="mt-3 text-center text-2xl font-semibold tracking-[-0.02em] text-[#1a1a1a] sm:text-4xl">Build Aviation Applications on ABOS</p>

        <div className="mt-12 rounded-2xl border border-black/[0.08] bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="text-[14px] font-black uppercase tracking-[0.16em] text-[#1a1a1a]">ABOS Core API</div>
          <p className="mt-2 text-[12px] leading-6 text-[#777]">
            Search · Identity · Listings · ATI · Valuation · Verification · Documents · Matching · Reports · Governed Workflow Execution
          </p>
        </div>

        <div className="mx-auto mt-2 h-6 w-px bg-black/[0.15]" />

        <div className="grid gap-3 sm:grid-cols-3">
          {SDKS.map((s) => (
            <div key={s} className="rounded-xl border border-black/[0.08] bg-white px-4 py-4 text-center text-[13px] font-bold text-[#1a1a1a] shadow-sm">{s}</div>
          ))}
        </div>

        <div className="mx-auto mt-2 h-6 w-px bg-black/[0.15]" />

        <div className="flex flex-wrap justify-center gap-2.5">
          {TARGETS.map((t) => (
            <span key={t} className="rounded-full border border-black/[0.09] bg-white px-4 py-2 text-[12px] font-semibold text-[#3a3a3a]">{t}</span>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/developers" className="rounded-xl bg-[#D4A017] px-6 py-3 text-[13px] font-bold text-white hover:opacity-90">View Developer Platform</Link>
          <Link to="/developers/core-api" className="rounded-xl border border-black/[0.12] bg-white px-6 py-3 text-[13px] font-semibold text-[#1a1a1a] hover:bg-black/[0.03]">Read API Documentation</Link>
        </div>
      </div>
    </section>
  );
}
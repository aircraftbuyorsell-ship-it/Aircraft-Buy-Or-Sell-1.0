import { Link } from "react-router-dom";
import { Plane } from "lucide-react";

const TABS = ["Overview", "Aircraft", "Workflow", "Documents", "Integrations", "Reports"];
const STEPS = ["1 Identity", "2 Evidence Intake", "3 Verification", "4 Intelligence", "5 Valuation", "6 Decision Support"];
const SERVICES = ["Core API", "Registry", "Documents", "Email", "Calendar"];
const DIAGRAM = [
  ["ATI Assessment", "Registry Evidence"],
  ["Market Valuation", "Ownership Context"],
  ["Documents", "Workflow / Calendar"],
  ["Integrations", "Reports / Transaction"],
];

export default function IntraZonePreview() {
  return (
    <section className="relative bg-[#0b111a] pb-24">
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(rgba(140,160,190,0.14) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8">
        <div className="rounded-2xl border border-white/[0.08] bg-[#070b12] p-5 shadow-[0_40px_120px_rgba(0,0,0,0.6)] sm:p-8" style={{ boxShadow: "0 40px 120px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8ab4f8]">IntraZone · Aircraft Intelligence Workspace</div>

          <div className="mt-4 flex flex-wrap gap-1 border-b border-white/[0.07] pb-3 text-[11px]">
            {TABS.map((t, i) => (
              <span key={t} className={`rounded-lg px-3 py-1.5 ${i === 0 ? "bg-white/[0.08] font-bold text-white" : "text-white/40"}`}>{t}</span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] font-bold text-white"><Plane size={15} className="text-[#F5C842]" /> N721AB · Phenom 300E · Opportunity AB-1042</div>
            <span className="rounded-full border border-[#F5C842]/25 bg-[#F5C842]/10 px-3 py-1 text-[10px] font-bold text-[#F5C842]">ATI 84 · Verification in progress</span>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="rounded-xl border border-[#F5C842]/30 bg-gradient-to-b from-[#F5C842]/[0.12] to-transparent px-8 py-5 text-center">
              <div className="text-[12px] font-black uppercase tracking-[0.18em] text-[#F5C842]">ATI Card</div>
              <div className="mt-1 text-[11px] text-white/50">Aircraft Digital Twin</div>
            </div>
          </div>

          <div className="mx-auto mt-6 grid max-w-xl gap-2">
            {DIAGRAM.map(([a, b]) => (
              <div key={a} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px]">
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-center text-white/70">{a}</span>
                <span className="h-px w-6 bg-white/20" />
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-center text-white/70">{b}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Aircraft Workflow</div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex shrink-0 items-center gap-2">
                <span className={`whitespace-nowrap rounded-lg border px-3 py-2 text-[11px] font-semibold ${i < 3 ? "border-[#49d7c6]/30 bg-[#49d7c6]/[0.08] text-[#49d7c6]" : "border-white/[0.08] bg-white/[0.02] text-white/50"}`}>{s}</span>
                {i < STEPS.length - 1 && <span className="text-white/25">→</span>}
              </div>
            ))}
          </div>

          <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Connected Services</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <span key={s} className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-[11px] font-semibold text-white/70">{s}</span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/demo" className="rounded-xl border border-white/[0.15] bg-white/[0.05] px-6 py-3 text-[13px] font-semibold text-white hover:bg-white/[0.1]">Open Interactive Demo</Link>
          <Link to="/intrazone" className="rounded-xl bg-[#D4A017] px-6 py-3 text-[13px] font-bold text-white hover:opacity-90">Enter Workspace</Link>
        </div>
      </div>
    </section>
  );
}
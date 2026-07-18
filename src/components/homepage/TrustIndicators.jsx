import { Cpu, Database, Eye, Radar, Workflow } from "lucide-react";

const PILLARS = [
  { icon: Radar, label: "Aircraft Intelligence" },
  { icon: Database, label: "Verified Data Sources" },
  { icon: Eye, label: "Transparent Outputs" },
  { icon: Workflow, label: "Professional Workflows" },
  { icon: Cpu, label: "API & Agent Ready" },
];

export default function TrustIndicators() {
  return (
    <section className="border-y border-black/[0.06] bg-white">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-6 sm:px-8">
        {PILLARS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666]">
            <Icon size={14} className="text-[#D4A017]" /> {label}
          </div>
        ))}
      </div>
    </section>
  );
}
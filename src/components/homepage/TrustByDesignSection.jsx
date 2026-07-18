import { Eye, FileSearch, Gauge, Lock, UserCheck } from "lucide-react";

const CARDS = [
  { icon: FileSearch, title: "Evidence & Provenance", desc: "Sources, timestamps, status and evidence history." },
  { icon: Gauge, title: "Confidence & Limits", desc: "Uncertainty, missing data and assumptions." },
  { icon: UserCheck, title: "Human Oversight", desc: "Approval and review for higher-risk tasks." },
  { icon: Eye, title: "Auditable Execution", desc: "Actor, intent, inputs, decision and result." },
  { icon: Lock, title: "Controlled Access", desc: "Identity, capability, permissions and scope." },
];

export default function TrustByDesignSection() {
  return (
    <section className="relative bg-[#0b111a]">
      <div className="relative mx-auto max-w-[1100px] px-5 pb-24 sm:px-8">
        <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.24em] text-[#49d7c6]">Trust by Design</h2>
        <p className="mt-3 text-center text-2xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">Intelligence That Shows Its Work</p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
              <Icon size={18} className="text-[#F5C842]" />
              <div className="mt-3 text-[13px] font-bold text-white">{title}</div>
              <div className="mt-2 text-[12px] leading-5 text-white/45">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
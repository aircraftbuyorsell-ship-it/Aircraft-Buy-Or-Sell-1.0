import { Link } from "react-router-dom";
import { ShieldCheck, FileCheck, BadgeCheck, ArrowRight, Lock, Globe } from "lucide-react";
import SectionShell from "./SectionShell";

const FEATURES = [
  {
    icon: FileCheck,
    title: "Document Verification",
    desc: "Remote identity & ownership verification with blockchain-anchored proof.",
    color: "#22c55e",
  },
  {
    icon: BadgeCheck,
    title: "8-Dimension Score",
    desc: "Objective ATI score covering airframe, engine, avionics, records & more.",
    color: "#D4A017",
  },
  {
    icon: Globe,
    title: "Global Registry Access",
    desc: "Cross-referenced with FAA, ADS-B, and international registry sources.",
    color: "#4e8ef7",
  },
  {
    icon: Lock,
    title: "Blockchain Anchoring",
    desc: "Every verification permanently recorded on Polygon for tamper-proof provenance.",
    color: "#a855f7",
  },
];

export default function ATIPassportVerification() {
  return (
    <SectionShell
      eyebrow="ATI Passport"
      title="Verify Before You Buy"
      subtitle="The Aircraft Transaction Intelligence Passport is the industry standard for pre-purchase verification — trusted by dealers, brokers, and owners across 150+ countries."
    >
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="glass-card p-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-4"
              style={{ background: `${color}12`, border: `1px solid ${color}28` }}
            >
              <Icon size={18} style={{ color }} />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <div className="text-center">
        <Link
          to="/ati-verify"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[10px] text-sm font-bold bg-gold-official text-white hover:opacity-90 transition-opacity"
        >
          <ShieldCheck size={16} /> Start Verification <ArrowRight size={16} />
        </Link>
      </div>
    </SectionShell>
  );
}
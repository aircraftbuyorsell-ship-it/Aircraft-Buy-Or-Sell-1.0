import { Link } from "react-router-dom";
import { ShieldCheck, FileCheck, BadgeCheck, ArrowRight, Lock, Globe } from "lucide-react";
import SectionShell from "./SectionShell";

const FEATURES = [
  { icon: FileCheck, title: "Document Verification", desc: "Remote identity & ownership verification with blockchain-anchored proof.", color: "#22c55e" },
  { icon: BadgeCheck, title: "8-Dimension Score", desc: "Objective ATI score covering airframe, engine, avionics, records & more.", color: "#D4A017" },
  { icon: Globe, title: "Global Registry Access", desc: "Cross-referenced with FAA, ADS-B, and international registry sources.", color: "#4e8ef7" },
  { icon: Lock, title: "Blockchain Anchoring", desc: "Every verification permanently recorded on Polygon for tamper-proof provenance.", color: "#a855f7" },
];

export default function ATIPassportVerification() {
  return (
    <SectionShell
      eyebrow="ATI Passport"
      title="Verify Before You Buy"
      subtitle="The Aircraft Transparency Index Passport is the industry standard for pre-purchase verification — trusted by dealers, brokers, and owners across 150+ countries."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="rounded-xl p-6 bg-card border border-border">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-4"
              style={{ background: `${color}12`, border: `1px solid ${color}28` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <div className="text-center">
        <Link to="/ati-verify"
          className="inline-flex items-center gap-2 bg-gold-official text-[#0B1220] px-7 py-3.5 rounded-[10px] text-sm font-bold no-underline hover:opacity-90">
          <ShieldCheck size={16} /> Start Verification <ArrowRight size={16} />
        </Link>
      </div>
    </SectionShell>
  );
}
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 32 }}>
        {FEATURES.map(({ icon: Icon, title, desc, color }) => (
          <div key={title}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "0.5px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              padding: 24,
            }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${color}12`,
              border: `1px solid ${color}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <Icon size={18} style={{ color }} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <Link to="/ati-verify"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#D4A017", color: "#0B1220",
            padding: "14px 28px", borderRadius: 10,
            fontSize: 14, fontWeight: 700, textDecoration: "none",
          }}>
          <ShieldCheck size={16} /> Start Verification <ArrowRight size={16} />
        </Link>
      </div>
    </SectionShell>
  );
}
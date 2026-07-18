import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const NODES = [
  { top: "18%", left: "12%", color: "#F5C842", delay: "0s" },
  { top: "34%", left: "78%", color: "#63c7ed", delay: ".6s" },
  { top: "52%", left: "28%", color: "#49d7c6", delay: "1.1s" },
  { top: "66%", left: "64%", color: "#F5C842", delay: ".3s" },
  { top: "80%", left: "42%", color: "#8ab4f8", delay: ".9s" },
];

export default function IntelligenceTransition() {
  return (
    <section className="intelligence-transition relative min-h-[520px] overflow-hidden">
      <div className="homepage-grid-layer" />
      <svg className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-30 sm:block" aria-hidden="true">
        <line x1="14%" y1="22%" x2="76%" y2="38%" stroke="#8a94a6" strokeWidth="0.7" strokeDasharray="4 6" />
        <line x1="30%" y1="55%" x2="64%" y2="68%" stroke="#c9a94e" strokeWidth="0.7" strokeDasharray="4 6" />
        <line x1="76%" y1="40%" x2="44%" y2="80%" stroke="#8a94a6" strokeWidth="0.7" strokeDasharray="4 6" />
      </svg>
      {NODES.map((n, i) => (
        <span key={i} className="hp-node pointer-events-none absolute hidden h-1.5 w-1.5 rounded-full sm:block" style={{ top: n.top, left: n.left, background: n.color, animationDelay: n.delay, boxShadow: `0 0 8px ${n.color}` }} />
      ))}

      <div className="relative z-10 mx-auto flex min-h-[520px] max-w-[820px] flex-col items-center justify-center px-5 py-24 text-center">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#8a7328]">Enter ABOS IntraZone</h2>
        <p className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-[#2a2f3a] sm:text-4xl" style={{ textShadow: "0 1px 12px rgba(251,250,247,0.5)" }}>
          Professional aircraft verification,<br />intelligence and execution.
        </p>
        <p className="mt-5 max-w-lg text-[14px] leading-7 text-[#5d6472]" style={{ textShadow: "0 1px 10px rgba(251,250,247,0.4)" }}>
          Every aircraft becomes a connected Aircraft Digital Twin combining identity, evidence, valuation, documents, workflows and transaction intelligence.
        </p>
        <Link to="/intrazone" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#D4A017] px-7 py-3.5 text-[13px] font-bold text-white shadow-lg hover:opacity-90">
          Explore IntraZone <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
import { Link } from "react-router-dom";
import { Search, PlaneTakeoff, ArrowRight, CheckCircle2 } from "lucide-react";

const AMBER = "#F8C73E";
const TEAL = "#53C4A2";
const SKY = "#8EB7DC";

const CARDS = [
  {
    to: "/listings",
    icon: Search,
    accent: TEAL,
    kicker: "For Buyers",
    title: "Browse verified aircraft",
    desc: "Search the register with ATI scores, verification status and pricing context on every listing.",
    bullets: ["247+ verified listings", "Live ATI scoring", "Compare & shortlist"],
    cta: "Browse aircraft",
  },
  {
    to: "/my-account",
    icon: PlaneTakeoff,
    accent: AMBER,
    kicker: "For Sellers",
    title: "List your aircraft",
    desc: "Get an ATI score, verify ownership and reach qualified buyers through ABOS IntraZone.",
    bullets: ["Free ATI scorecard", "Owner verification", "Qualified buyer leads"],
    cta: "List your aircraft",
    primary: true,
  },
];

export default function PathCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {CARDS.map((c) => (
        <Link
          key={c.to}
          to={c.to}
          className="group rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: "#0C1620",
            border: `1px solid ${c.primary ? "rgba(248,199,62,0.3)" : "rgba(255,255,255,0.11)"}`,
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `${c.accent}1f`, border: `1px solid ${c.accent}55` }}
            >
              <c.icon className="w-5 h-5" style={{ color: c.accent }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: c.accent }}>{c.kicker}</p>
              <p className="text-[17px] font-black text-white tracking-tight">{c.title}</p>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed mb-4" style={{ color: SKY }}>{c.desc}</p>

          <div className="space-y-1.5 mb-5">
            {c.bullets.map((b) => (
              <div key={b} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: c.accent }} />
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>{b}</span>
              </div>
            ))}
          </div>

          <div
            className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg text-[13px] font-bold transition-all"
            style={
              c.primary
                ? { background: AMBER, color: "#071018", boxShadow: "0 2px 14px rgba(248,199,62,0.3)" }
                : { background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)" }
            }
          >
            {c.cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      ))}
    </div>
  );
}
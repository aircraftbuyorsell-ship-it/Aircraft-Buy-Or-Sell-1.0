import { Search, ShieldCheck, Handshake } from "lucide-react";

const STEPS = [
  {
    n: 1,
    color: "#53C4A2",
    icon: Search,
    title: "Search & discover",
    desc: "Filter verified aircraft by model, region, budget and hours — with pricing context up front.",
  },
  {
    n: 2,
    color: "#F8C73E",
    icon: ShieldCheck,
    title: "ATI score & verify",
    desc: "Every listing carries an ATI Intelligence score, risk flags and verified ownership status.",
  },
  {
    n: 3,
    color: "#8EB7DC",
    icon: Handshake,
    title: "Deal & close",
    desc: "Connect, negotiate with data on your side, and close confidently through secure escrow.",
  },
];

export default function HowItWorks() {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: "#F8C73E" }}>
        How it works
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STEPS.map(({ n, color, icon: Icon, title, desc }) => (
          <div
            key={n}
            className="relative rounded-2xl p-5 md:p-6"
            style={{ background: "#0C1620", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span
              className="absolute top-5 right-5 text-3xl font-black"
              style={{ color: `${color}26` }}
            >
              {n}
            </span>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${color}1f`, border: `1px solid ${color}40` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <h3 className="text-[15px] font-black text-white mb-1.5">{title}</h3>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
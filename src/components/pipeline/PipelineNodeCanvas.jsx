import { Plane, ShieldCheck, TrendingUp, FileText, Mail, CalendarDays, Landmark } from "lucide-react";

// n8n / Duvo-style node canvas — central hub with connected tool nodes,
// dashed elbow connectors and animated pulse dots.

const NODES = (pipeline, passport, completed, total) => [
  { id: "ati", icon: ShieldCheck, label: "ATI Score", value: passport?.ati_total ? `${passport.ati_total}/120` : "—", color: "#4e8ef7", x: 12, y: 22 },
  { id: "val", icon: TrendingUp, label: "Valuation", value: passport?.omvm_value ? `$${(passport.omvm_value / 1000).toFixed(0)}K` : "—", color: "#f5c242", x: 8, y: 58 },
  { id: "docs", icon: FileText, label: "Google Docs", value: "Contract", color: "#a78bfa", x: 22, y: 88 },
  { id: "gmail", icon: Mail, label: "Gmail", value: "Notify", color: "#5dcaa5", x: 88, y: 20 },
  { id: "cal", icon: CalendarDays, label: "Calendar", value: "Inspection", color: "#4e8ef7", x: 92, y: 56 },
  { id: "escrow", icon: Landmark, label: "Escrow", value: `${completed}/${total}`, color: "#e2a44b", x: 80, y: 88 },
];

function elbowPath(x, y) {
  // orthogonal path from node to center (50,50), n8n style
  const midX = x < 50 ? x + (50 - x) / 2 : x - (x - 50) / 2;
  return `M ${x} ${y} L ${midX} ${y} L ${midX} 50 L 50 50`;
}

export default function PipelineNodeCanvas({ pipeline, passport }) {
  const steps = pipeline.steps || [];
  const completed = steps.filter(s => s.status === "completed").length;
  const nodes = NODES(pipeline, passport, completed, steps.length);

  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(245,194,66,0.04), transparent 60%), rgba(255,255,255,0.02)" }}>
      <div className="relative w-full" style={{ height: 320 }}>

        {/* Connections layer */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {nodes.map(n => (
            <g key={n.id}>
              <path d={elbowPath(n.x, n.y)} fill="none" stroke="rgba(255,255,255,0.12)"
                strokeWidth="0.35" strokeDasharray="1.4 1.4" vectorEffect="non-scaling-stroke" />
              <circle r="0.9" fill={n.color} opacity="0.9">
                <animateMotion dur={`${3 + (n.x % 3)}s`} repeatCount="indefinite" path={elbowPath(n.x, n.y)} />
              </circle>
            </g>
          ))}
        </svg>

        {/* Central hub node */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: "50%", top: "50%" }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(145deg, #f5c242, #d9a22c)",
              boxShadow: "0 0 40px rgba(245,194,66,0.35), 0 8px 24px rgba(0,0,0,0.4)",
            }}>
            <Plane className="w-9 h-9 text-[#04060a]" />
          </div>
          <p className="mt-2 text-[13px] font-black font-mono tracking-wider text-[rgba(255,255,255,0.92)]">
            {pipeline.registration?.toUpperCase()}
          </p>
          <p className="text-[10px] font-bold text-[#f5c242]">{pipeline.progress_pct || 0}% complete</p>
        </div>

        {/* Satellite tool nodes */}
        {nodes.map(n => (
          <div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${n.color}40`,
                boxShadow: `0 0 18px ${n.color}22`,
                backdropFilter: "blur(8px)",
              }}>
              <n.icon className="w-5 h-5" style={{ color: n.color }} />
            </div>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.5)] whitespace-nowrap">{n.label}</span>
            <span className="text-[10px] font-black whitespace-nowrap" style={{ color: n.color }}>{n.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
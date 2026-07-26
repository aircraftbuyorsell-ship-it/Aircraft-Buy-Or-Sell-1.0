import { CheckCircle, ArrowRight } from "lucide-react";

function CircularProgress({ value, color = "#3B82F6" }) {
  const size = 56, stroke = 4, r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="15" fontWeight="800" className="fill-foreground">{value}</text>
    </svg>
  );
}

export default function HomeDataCard() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-5 shadow-xl backdrop-blur-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[20px] font-black tracking-tight text-foreground">N721AB</p>
          <p className="text-[13px] font-semibold text-muted-foreground">Phenom 300E</p>
        </div>
        <div className="flex flex-col items-center">
          <CircularProgress value={84} />
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">ATI</span>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1.5">
        <CheckCircle className="h-4 w-4 text-[#10B981]" />
        <span className="text-[12px] font-semibold text-[#10B981]">Serial verified</span>
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground">Deal readiness</span>
          <span className="text-[13px] font-black text-[#10B981]">72%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-[#10B981]" style={{ width: "72%" }} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {["ATI Report", "Owner", "Costs"].map((label) => (
          <a key={label} href="#" className="inline-flex items-center gap-1 text-[11px] font-bold text-foreground transition-colors hover:text-primary">
            {label} <ArrowRight className="h-3 w-3" />
          </a>
        ))}
      </div>
    </div>
  );
}
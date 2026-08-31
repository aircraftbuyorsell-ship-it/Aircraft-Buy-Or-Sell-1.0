import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const STATES = {
  verified: { Icon: CheckCircle2, color: "#22c55e", label: "Verified" },
  caution: { Icon: AlertTriangle, color: "#f5c242", label: "Caution" },
  unverified: { Icon: XCircle, color: "#ef4444", label: "Unverified" },
};

export default function ConfidenceBadge({ confidence, sourcesMatched }) {
  const s = STATES[confidence] || STATES.unverified;
  const { Icon } = s;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider"
      style={{ color: s.color, background: `${s.color}10`, border: `0.5px solid ${s.color}35` }}
      title="Data Confidence — agreement across FAA registry, adsbdb, and ADS-B traffic sources"
    >
      <Icon size={12} />
      Data Confidence: {s.label}
      {sourcesMatched != null && (
        <span style={{ color: `${s.color}99` }} className="font-bold normal-case tracking-normal">
          · {sourcesMatched}/3 sources
        </span>
      )}
    </span>
  );
}
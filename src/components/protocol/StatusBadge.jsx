import { RFC_STATUS } from "@/components/protocol/protocolData";

export default function StatusBadge({ status, protocol = false }) {
  const protocolColors = { Normative: "#5dcaa5", Draft: "#a7adb8", Planned: "#a879ff" };
  const label = protocol ? status : RFC_STATUS[status]?.[0] || status;
  const color = protocol ? protocolColors[status] : RFC_STATUS[status]?.[1];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color, background: `${color}12`, border: `1px solid ${color}35` }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />{label}
    </span>
  );
}
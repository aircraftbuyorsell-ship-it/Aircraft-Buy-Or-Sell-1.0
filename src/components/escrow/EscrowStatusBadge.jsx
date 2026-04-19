import { ESCROW_STATUS } from "@/lib/escrow";

export default function EscrowStatusBadge({ status, size = "sm" }) {
  const cfg = ESCROW_STATUS[status] || ESCROW_STATUS.draft;
  const sizeCls = size === "lg" ? "text-[11px] px-3 py-1.5" : "text-[9px] px-2.5 py-1";
  return (
    <span
      className={`${sizeCls} uppercase tracking-wider font-bold rounded-full whitespace-nowrap`}
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}
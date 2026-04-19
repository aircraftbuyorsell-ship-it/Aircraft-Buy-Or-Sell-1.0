import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, DollarSign, FileDown } from "lucide-react";
import { format } from "date-fns";
import { ROLE_META } from "@/lib/commission";

const STATUS_STYLE = {
  draft:     "bg-black/5 text-[#6B6560] border-black/10",
  approved:  "bg-[rgba(24,95,165,0.08)] text-[#185FA5] border-[rgba(24,95,165,0.2)]",
  paid:      "bg-[rgba(15,122,86,0.08)] text-[#0F7A56] border-[rgba(15,122,86,0.2)]",
  cancelled: "bg-black/5 text-[#AAA49C] border-black/10",
};

/**
 * A single settlement batch row — expands to show all commission entries.
 * Admins can mark as paid via onMarkPaid(batch, { method, reference }).
 */
export default function SettlementRow({ batch, entries = [], onMarkPaid, onExportSummary }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("wire");
  const [reference, setReference] = useState("");
  const [processing, setProcessing] = useState(false);

  const fmt = (n) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const meta = ROLE_META[batch.payee_role] || { label: batch.payee_role, color: "#6B6560" };

  const handlePay = async () => {
    setProcessing(true);
    try { await onMarkPaid(batch, { method, reference }); }
    finally { setProcessing(false); }
  };

  return (
    <div className="bg-white border border-black/[0.07] rounded-xl overflow-hidden">
      {/* Row header */}
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#F7F4EF] transition-colors">
        {open ? <ChevronDown className="w-4 h-4 text-[#6B6560] shrink-0" /> : <ChevronRight className="w-4 h-4 text-[#6B6560] shrink-0" />}
        <span className="font-mono text-[12px] font-black text-[#0B2D5B] shrink-0">{batch.batch_code}</span>
        <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded shrink-0"
          style={{ backgroundColor: meta.color + "15", color: meta.color }}>
          {meta.label}
        </span>
        <span className="text-[12px] text-[#1A1814] truncate flex-1 min-w-0">{batch.payee_email}</span>
        <span className="text-[10px] text-[#AAA49C] hidden sm:inline whitespace-nowrap">
          {batch.entry_count} {batch.entry_count === 1 ? "entry" : "entries"}
        </span>
        <span className="text-[14px] font-black text-[#1A1814] whitespace-nowrap">{fmt(batch.total_amount)}</span>
        <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLE[batch.status]}`}>
          {batch.status}
        </span>
      </button>

      {open && (
        <div className="border-t border-black/[0.06] bg-[#F7F4EF]/40 p-4 space-y-3">
          {/* Entries list */}
          <div className="space-y-1">
            {entries.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-3 py-1.5 bg-white rounded border border-black/[0.04] text-[12px]">
                <span className="font-mono text-[11px] text-[#0B2D5B] w-40 truncate">{e.public_card_code || "—"}</span>
                <span className="text-[10px] text-[#6B6560] flex-1 truncate">L{e.level} · {ROLE_META[e.role]?.label}</span>
                <span className="text-[10px] text-[#AAA49C] whitespace-nowrap">{(e.percentage || 0).toFixed(0)}% of {fmt(e.commission_pool)}</span>
                <span className="font-black text-[#1A1814] whitespace-nowrap">{fmt(e.amount)}</span>
              </div>
            ))}
            {entries.length === 0 && <p className="text-center text-[11px] text-[#AAA49C] py-2">Loading entries…</p>}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Period</p>
              <p className="text-[#1A1814] font-semibold">
                {batch.period_start || "—"} → {batch.period_end || "—"}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Created</p>
              <p className="text-[#1A1814] font-semibold">
                {batch.created_date ? format(new Date(batch.created_date), "MMM d, HH:mm") : "—"}
              </p>
            </div>
            {batch.paid_at && (
              <>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Paid At</p>
                  <p className="text-[#0F7A56] font-semibold">{format(new Date(batch.paid_at), "MMM d, HH:mm")}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">Reference</p>
                  <p className="text-[#1A1814] font-mono text-[10px]">{batch.payment_reference || "—"}</p>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/[0.06]">
            {batch.status !== "paid" && batch.status !== "cancelled" && (
              <>
                <select value={method} onChange={e => setMethod(e.target.value)}
                  className="px-2 py-1.5 bg-white border border-black/10 rounded text-[11px] font-semibold">
                  <option value="wire">Wire</option>
                  <option value="ach">ACH</option>
                  <option value="stripe">Stripe</option>
                  <option value="manual">Manual</option>
                  <option value="credit">Credit to Balance</option>
                </select>
                <input value={reference} onChange={e => setReference(e.target.value)}
                  placeholder="Payment reference (wire ID / txn)"
                  className="flex-1 min-w-[140px] px-2 py-1.5 bg-white border border-black/10 rounded text-[11px]" />
                <button onClick={handlePay} disabled={processing}
                  className="flex items-center gap-1.5 bg-[#0F7A56] hover:bg-[#0d6548] disabled:opacity-50 text-white text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {processing ? "…" : "Mark Paid"}
                </button>
              </>
            )}
            <button onClick={() => onExportSummary?.(batch, entries)}
              className="flex items-center gap-1.5 bg-white border border-black/10 hover:border-[#0B2D5B] text-[#0B2D5B] text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded">
              <FileDown className="w-3.5 h-3.5" /> Export Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
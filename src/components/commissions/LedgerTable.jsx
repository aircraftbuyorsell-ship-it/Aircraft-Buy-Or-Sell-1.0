import { ROLE_META } from "@/lib/commission";
import { CheckSquare, Square, Zap } from "lucide-react";

const STATUS_STYLE = {
  pending:   "bg-black/5 text-[#6B6560] border-black/10",
  allocated: "bg-[rgba(24,95,165,0.08)] text-[#185FA5] border-[rgba(24,95,165,0.2)]",
  batched:   "bg-[rgba(232,168,58,0.12)] text-[#A67C00] border-[rgba(232,168,58,0.3)]",
  paid:      "bg-[rgba(15,122,86,0.08)] text-[#0F7A56] border-[rgba(15,122,86,0.2)]",
  disputed:  "bg-[rgba(192,57,43,0.08)] text-[#C0392B] border-[rgba(192,57,43,0.2)]",
  cancelled: "bg-black/5 text-[#AAA49C] border-black/10",
};

/**
 * Commission ledger table — shows all commission entries with multi-select
 * so admins can batch-settle. Selected rows bubble up via onSelectionChange.
 */
export default function LedgerTable({ entries = [], selectable = false, selected = new Set(), onSelectionChange, onBatch }) {
  const fmt = (n) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onSelectionChange?.(next);
  };
  const toggleAll = () => {
    const selectable = entries.filter(e => e.status === "allocated").map(e => e.id);
    if (selectable.every(id => selected.has(id))) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(selectable));
    }
  };

  const selectedTotal = entries
    .filter(e => selected.has(e.id))
    .reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
      {selectable && selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[#0B2D5B] text-white px-4 py-2.5">
          <Zap className="w-4 h-4 text-[#E8A83A]" />
          <p className="text-[12px] font-black">{selected.size} selected · {fmt(selectedTotal)}</p>
          <button onClick={onBatch}
            className="ml-auto bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded">
            Build Settlement Batch →
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F7F4EF] border-b border-black/[0.06]">
              {selectable && (
                <th className="px-3 py-2 w-8">
                  <button onClick={toggleAll} className="text-[#6B6560] hover:text-[#0B2D5B]">
                    <CheckSquare className="w-4 h-4" />
                  </button>
                </th>
              )}
              {["Card", "Role", "Payee", "Pool", "%", "Amount", "Status"].map(h => (
                <th key={h} className="text-left px-3 py-2 text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={selectable ? 8 : 7} className="text-center py-10 text-[#AAA49C] text-sm">No commission entries yet.</td></tr>
            ) : entries.map(e => {
              const meta = ROLE_META[e.role] || { label: e.role, color: "#6B6560" };
              const isSelectable = selectable && e.status === "allocated";
              return (
                <tr key={e.id} className="border-b border-black/[0.04] hover:bg-[#F7F4EF]/50">
                  {selectable && (
                    <td className="px-3 py-2">
                      {isSelectable ? (
                        <button onClick={() => toggle(e.id)} className="text-[#0B2D5B]">
                          {selected.has(e.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#AAA49C]" />}
                        </button>
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                    </td>
                  )}
                  <td className="px-3 py-2 font-mono text-[11px] text-[#0B2D5B] whitespace-nowrap">{e.public_card_code || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded"
                      style={{ backgroundColor: meta.color + "15", color: meta.color }}>
                      L{e.level} · {meta.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[12px] text-[#1A1814] max-w-[200px] truncate">
                    {e.payee_email}
                    {e.payee_slug && <span className="font-mono text-[10px] text-[#AAA49C] ml-1">({e.payee_slug})</span>}
                  </td>
                  <td className="px-3 py-2 text-[12px] text-[#6B6560] whitespace-nowrap">{fmt(e.commission_pool)}</td>
                  <td className="px-3 py-2 text-[12px] text-[#6B6560] whitespace-nowrap">{(e.percentage || 0).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-[13px] font-black text-[#1A1814] whitespace-nowrap">{fmt(e.amount)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[e.status] || "bg-black/5 text-[#AAA49C] border-black/10"}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
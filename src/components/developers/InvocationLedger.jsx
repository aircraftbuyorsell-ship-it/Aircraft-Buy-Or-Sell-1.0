import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

const STATUS_ICON = {
  success: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
  failed:  <XCircle      className="w-3.5 h-3.5 text-red-500" />,
  pending: <Clock        className="w-3.5 h-3.5 text-amber-500" />,
  refunded:<Clock        className="w-3.5 h-3.5 text-gray-400" />,
};

const STATUS_STYLE = {
  success:  "text-green-700 bg-green-50",
  failed:   "text-red-700 bg-red-50",
  pending:  "text-amber-700 bg-amber-50",
  refunded: "text-gray-500 bg-gray-100",
};

export default function InvocationLedger({ invocations, isLoading }) {
  if (isLoading) return <p className="text-sm text-[#6B6560]">Loading ledger…</p>;

  return (
    <div>
      <h3 className="font-black text-sm uppercase tracking-wide text-[#1A1814] mb-3">
        Invocation Ledger ({invocations.length})
      </h3>

      {invocations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center">
          <p className="text-sm text-[#6B6560]">No invocations yet. Earnings will appear here once your tools are called.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F4EF] border-b border-black/8">
                <tr>
                  {["Date", "Tool", "Called by", "Charged", "Your Share", "Status", "Latency"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#6B6560] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {invocations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F7F4EF]/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-[#AAA49C] whitespace-nowrap">
                      {inv.invoked_at ? format(new Date(inv.invoked_at), "MMM d, HH:mm") : "—"}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#1A1814] max-w-[140px] truncate">{inv.tool_name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#6B6560] max-w-[140px] truncate">{inv.user_email}</td>
                    <td className="px-4 py-3 font-black text-[#1A1814]">{inv.tokens_charged} tk</td>
                    <td className="px-4 py-3 font-black text-[#A67C00]">{(inv.developer_revenue || 0).toFixed(1)} tk</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black w-fit ${STATUS_STYLE[inv.status] || "bg-gray-100 text-gray-500"}`}>
                        {STATUS_ICON[inv.status]} {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#AAA49C]">
                      {inv.duration_ms != null ? `${inv.duration_ms}ms` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
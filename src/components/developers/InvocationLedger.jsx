import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const RED = "#e24b4a";
const CARD = "rgba(255,255,255,0.04)";

const STATUS_ICON = {
  success: <CheckCircle2 className="w-3.5 h-3.5" style={{ color: TEAL }} />,
  failed:  <XCircle      className="w-3.5 h-3.5" style={{ color: RED }} />,
  pending: <Clock        className="w-3.5 h-3.5" style={{ color: AMBER }} />,
  refunded:<Clock        className="w-3.5 h-3.5" style={{ color: W3 }} />,
};

const STATUS_STYLE = {
  success:  { bg: "rgba(93,202,165,0.09)", text: TEAL },
  failed:   { bg: "rgba(226,75,74,0.09)", text: RED },
  pending:  { bg: "rgba(245,194,66,0.09)", text: AMBER },
  refunded: { bg: "rgba(255,255,255,0.06)", text: W3 },
};

export default function InvocationLedger({ invocations, isLoading }) {
  if (isLoading) return <p className="text-sm" style={{ color: W2 }}>Loading ledger…</p>;

  return (
    <div>
      <h3 className="font-black text-sm uppercase tracking-wide mb-3" style={{ color: W1 }}>
        Invocation Ledger ({invocations.length})
      </h3>

      {invocations.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: CARD, border: `0.5px dashed ${BORDER}` }}>
          <p className="text-sm" style={{ color: W2 }}>No invocations yet. Earnings will appear here once your tools are called.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "rgba(255,255,255,0.03)", borderBottom: `0.5px solid ${BORDER}` }}>
                <tr>
                  {["Date", "Tool", "Called by", "Charged", "Your Share", "Status", "Latency"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider whitespace-nowrap" style={{ color: W3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invocations.map((inv) => {
                  const ss = STATUS_STYLE[inv.status] || STATUS_STYLE.refunded;
                  return (
                    <tr key={inv.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: W3 }}>
                        {inv.invoked_at ? format(new Date(inv.invoked_at), "MMM d, HH:mm") : "—"}
                      </td>
                      <td className="px-4 py-3 font-bold max-w-[140px] truncate" style={{ color: W1 }}>{inv.tool_name || "—"}</td>
                      <td className="px-4 py-3 text-xs max-w-[140px] truncate" style={{ color: W2 }}>{inv.user_email}</td>
                      <td className="px-4 py-3 font-black" style={{ color: W1 }}>{inv.tokens_charged} tk</td>
                      <td className="px-4 py-3 font-black" style={{ color: AMBER }}>{(inv.developer_revenue || 0).toFixed(1)} tk</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black w-fit" style={{ background: ss.bg, color: ss.text }}>
                          {STATUS_ICON[inv.status]} {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: W3 }}>
                        {inv.duration_ms != null ? `${inv.duration_ms}ms` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
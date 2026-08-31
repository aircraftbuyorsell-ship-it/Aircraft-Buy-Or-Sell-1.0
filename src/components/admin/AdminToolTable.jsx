import { CheckCircle2, XCircle, Pause, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const STATUS_LIGHT = { pending: "bg-amber-50 text-amber-700", active: "bg-green-50 text-green-700", rejected: "bg-gray-100 text-gray-500", suspended: "bg-red-50 text-red-700" };
const STATUS_DARK  = { pending: "bg-amber-900/30 text-amber-300", active: "bg-green-900/30 text-green-300", rejected: "bg-gray-800/50 text-gray-400", suspended: "bg-red-900/30 text-red-300" };
const CAT_LIGHT = { data: "bg-blue-50 text-blue-700", analytics: "bg-purple-50 text-purple-700", ai: "bg-amber-50 text-amber-700", compliance: "bg-red-50 text-red-700", valuation: "bg-green-50 text-green-700", communication: "bg-indigo-50 text-indigo-700", other: "bg-gray-100 text-gray-500" };
const CAT_DARK  = { data: "bg-blue-900/30 text-blue-300", analytics: "bg-purple-900/30 text-purple-300", ai: "bg-amber-900/30 text-amber-300", compliance: "bg-red-900/30 text-red-300", valuation: "bg-green-900/30 text-green-300", communication: "bg-indigo-900/30 text-indigo-300", other: "bg-gray-800/50 text-gray-400" };

export default function AdminToolTable({ tools, isLoading, onApprove, onReject, onSuspend, isUpdating, isDark = false }) {
  const textPrimary = isDark ? "#ffffff" : "#1A1814";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "#6B6560";
  const tableBg = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
  const tableBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const theadBg = isDark ? "rgba(255,255,255,0.05)" : "#F7F4EF";
  const rowHover = isDark ? "rgba(255,255,255,0.04)" : "rgba(247,244,239,0.5)";
  const divider = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const statusStyle = isDark ? STATUS_DARK : STATUS_LIGHT;
  const catStyle = isDark ? CAT_DARK : CAT_LIGHT;

  if (isLoading) return <p className="text-sm" style={{ color: textMuted }}>Loading…</p>;

  if (tools.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: tableBorder }}>
        <p className="text-sm" style={{ color: textMuted }}>No tool submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: tableBg, borderColor: tableBorder }}>
      <table className="w-full text-sm">
        <thead style={{ background: theadBg, borderBottom: `1px solid ${divider}` }}>
          <tr>
            {["Tool", "Developer", "Category", "Cost", "Status", "Submitted", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: textMuted }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tools.map((tool) => (
            <tr key={tool.id} className="transition-colors" style={{ borderTop: `1px solid ${divider}` }}
              onMouseEnter={e => e.currentTarget.style.background = rowHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <td className="px-4 py-3">
                <p className="font-bold" style={{ color: textPrimary }}>{tool.name}</p>
                <p className="text-[11px] line-clamp-1 max-w-[200px]" style={{ color: textMuted }}>{tool.description}</p>
                {tool.webhook_url && (
                  <a href={tool.webhook_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] flex items-center gap-0.5 hover:underline mt-0.5"
                    style={{ color: isDark ? "#00f5ff" : "#0B2D5B" }}>
                    <ExternalLink className="w-2.5 h-2.5" /> Webhook
                  </a>
                )}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: textMuted }}>{tool.developer_id}</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${catStyle[tool.category] || catStyle.other}`}>
                  {tool.category}
                </span>
              </td>
              <td className="px-4 py-3 font-black text-[#A67C00]">{tool.token_cost} tk</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${statusStyle[tool.status] || (isDark ? "bg-gray-800/50 text-gray-400" : "bg-gray-100 text-gray-500")}`}>
                  {tool.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.30)" : "#AAA49C" }}>
                {tool.created_date ? format(new Date(tool.created_date), "MMM d, yyyy") : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {tool.status === "pending" && (
                    <>
                      <button onClick={() => onApprove(tool)} disabled={isUpdating}
                        className="flex items-center gap-1 h-7 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-black disabled:opacity-50">
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </button>
                      <button onClick={() => onReject(tool)} disabled={isUpdating}
                        className={`flex items-center gap-1 h-7 px-3 rounded-lg text-[11px] font-black disabled:opacity-50 ${isDark ? "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}
                  {tool.status === "active" && (
                    <button onClick={() => onSuspend(tool)} disabled={isUpdating}
                      className={`flex items-center gap-1 h-7 px-3 rounded-lg text-[11px] font-black border disabled:opacity-50 ${isDark ? "bg-red-900/30 hover:bg-red-900/50 text-red-300 border-red-700/50" : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"}`}>
                      <Pause className="w-3 h-3" /> Suspend
                    </button>
                  )}
                  {(tool.status === "rejected" || tool.status === "suspended") && (
                    <button onClick={() => onApprove(tool)} disabled={isUpdating}
                      className={`flex items-center gap-1 h-7 px-3 rounded-lg text-[11px] font-black border disabled:opacity-50 ${isDark ? "bg-green-900/30 hover:bg-green-900/50 text-green-300 border-green-700/50" : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"}`}>
                      <CheckCircle2 className="w-3 h-3" /> Re-activate
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
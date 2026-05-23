import { CheckCircle2, XCircle, Pause, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLE = {
  pending:   "bg-amber-50 text-amber-700",
  active:    "bg-green-50 text-green-700",
  rejected:  "bg-gray-100 text-gray-500",
  suspended: "bg-red-50 text-red-700",
};

const CAT_STYLE = {
  data: "bg-blue-50 text-blue-700", analytics: "bg-purple-50 text-purple-700",
  ai: "bg-amber-50 text-amber-700", compliance: "bg-red-50 text-red-700",
  valuation: "bg-green-50 text-green-700", communication: "bg-indigo-50 text-indigo-700",
  other: "bg-gray-100 text-gray-500",
};

export default function AdminToolTable({ tools, isLoading, onApprove, onReject, onSuspend, isUpdating }) {
  if (isLoading) return <p className="text-sm text-[#6B6560]">Loading…</p>;

  if (tools.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center">
        <p className="text-sm text-[#6B6560]">No tool submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#F7F4EF] border-b border-black/8">
          <tr>
            {["Tool", "Developer", "Category", "Cost", "Status", "Submitted", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#6B6560]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {tools.map((tool) => (
            <tr key={tool.id} className="hover:bg-[#F7F4EF]/50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-bold text-[#1A1814]">{tool.name}</p>
                <p className="text-[11px] text-[#6B6560] line-clamp-1 max-w-[200px]">{tool.description}</p>
                {tool.webhook_url && (
                  <a href={tool.webhook_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-[#0B2D5B] flex items-center gap-0.5 hover:underline mt-0.5">
                    <ExternalLink className="w-2.5 h-2.5" /> Webhook
                  </a>
                )}
              </td>
              <td className="px-4 py-3 text-[#6B6560] text-xs">{tool.developer_id}</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${CAT_STYLE[tool.category] || CAT_STYLE.other}`}>
                  {tool.category}
                </span>
              </td>
              <td className="px-4 py-3 font-black text-[#A67C00]">{tool.token_cost} tk</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_STYLE[tool.status] || "bg-gray-100 text-gray-500"}`}>
                  {tool.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[#AAA49C] text-xs">
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
                        className="flex items-center gap-1 h-7 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-black disabled:opacity-50">
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}
                  {tool.status === "active" && (
                    <button onClick={() => onSuspend(tool)} disabled={isUpdating}
                      className="flex items-center gap-1 h-7 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-black border border-red-200 disabled:opacity-50">
                      <Pause className="w-3 h-3" /> Suspend
                    </button>
                  )}
                  {(tool.status === "rejected" || tool.status === "suspended") && (
                    <button onClick={() => onApprove(tool)} disabled={isUpdating}
                      className="flex items-center gap-1 h-7 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-[11px] font-black border border-green-200 disabled:opacity-50">
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
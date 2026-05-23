import { CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLE = {
  pending:   "bg-amber-50 text-amber-700",
  active:    "bg-green-50 text-green-700",
  suspended: "bg-red-50 text-red-700",
};

export default function AdminDeveloperTable({ developers, isLoading, onApprove, onSuspend, isUpdating }) {
  if (isLoading) return <p className="text-sm text-[#6B6560]">Loading…</p>;

  if (developers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center">
        <p className="text-sm text-[#6B6560]">No developer applications yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/8 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#F7F4EF] border-b border-black/8">
          <tr>
            {["Company", "Email", "Contact", "Status", "Applied", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#6B6560]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {developers.map((dev) => (
            <tr key={dev.id} className="hover:bg-[#F7F4EF]/50 transition-colors">
              <td className="px-4 py-3">
                <p className="font-bold text-[#1A1814]">{dev.company_name}</p>
                {dev.website_url && (
                  <a href={dev.website_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-[#0B2D5B] flex items-center gap-0.5 hover:underline">
                    <ExternalLink className="w-2.5 h-2.5" /> Website
                  </a>
                )}
              </td>
              <td className="px-4 py-3 text-[#6B6560]">{dev.user_email}</td>
              <td className="px-4 py-3 text-[#6B6560]">{dev.contact_email || "—"}</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${STATUS_STYLE[dev.status] || "bg-gray-100 text-gray-500"}`}>
                  {dev.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[#AAA49C] text-xs">
                {dev.created_date ? format(new Date(dev.created_date), "MMM d, yyyy") : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {dev.status !== "active" && (
                    <button
                      onClick={() => onApprove(dev)}
                      disabled={isUpdating}
                      className="flex items-center gap-1 h-7 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-black disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                  )}
                  {dev.status !== "suspended" && (
                    <button
                      onClick={() => onSuspend(dev)}
                      disabled={isUpdating}
                      className="flex items-center gap-1 h-7 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-black border border-red-200 disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" /> Suspend
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
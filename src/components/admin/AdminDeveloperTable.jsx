import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLE_LIGHT = { pending: "bg-amber-50 text-amber-700", active: "bg-green-50 text-green-700", suspended: "bg-red-50 text-red-700" };
const STATUS_STYLE_DARK  = { pending: "bg-amber-900/30 text-amber-300", active: "bg-green-900/30 text-green-300", suspended: "bg-red-900/30 text-red-300" };

export default function AdminDeveloperTable({ developers, isLoading, onApprove, onSuspend, isUpdating, isDark = false }) {
  const textPrimary = isDark ? "#ffffff" : "#1A1814";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "#6B6560";
  const tableBg = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
  const tableBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const theadBg = isDark ? "rgba(255,255,255,0.05)" : "#F7F4EF";
  const rowHover = isDark ? "rgba(255,255,255,0.04)" : "rgba(247,244,239,0.5)";
  const divider = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const statusStyle = isDark ? STATUS_STYLE_DARK : STATUS_STYLE_LIGHT;

  if (isLoading) return <p className="text-sm" style={{ color: textMuted }}>Loading…</p>;

  if (developers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: tableBorder }}>
        <p className="text-sm" style={{ color: textMuted }}>No developer applications yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border" style={{ background: tableBg, borderColor: tableBorder }}>
      <table className="w-full text-sm">
        <thead style={{ background: theadBg, borderBottom: `1px solid ${divider}` }}>
          <tr>
            {["Company", "Email", "Contact", "Status", "Applied", "Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: textMuted }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {developers.map((dev) => (
            <tr key={dev.id} className="transition-colors" style={{ borderTop: `1px solid ${divider}` }}
              onMouseEnter={e => e.currentTarget.style.background = rowHover}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <td className="px-4 py-3">
                <p className="font-bold" style={{ color: textPrimary }}>{dev.company_name}</p>
                {dev.website_url && (
                  <a href={dev.website_url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] flex items-center gap-0.5 hover:underline"
                    style={{ color: isDark ? "#00f5ff" : "#0B2D5B" }}>
                    <ExternalLink className="w-2.5 h-2.5" /> Website
                  </a>
                )}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: textMuted }}>{dev.user_email}</td>
              <td className="px-4 py-3 text-xs" style={{ color: textMuted }}>{dev.contact_email || "—"}</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${statusStyle[dev.status] || (isDark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500")}`}>
                  {dev.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: isDark ? "rgba(255,255,255,0.30)" : "#AAA49C" }}>
                {dev.created_date ? format(new Date(dev.created_date), "MMM d, yyyy") : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {dev.status !== "active" && (
                    <button onClick={() => onApprove(dev)} disabled={isUpdating}
                      className="flex items-center gap-1 h-7 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-black disabled:opacity-50">
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>
                  )}
                  {dev.status !== "suspended" && (
                    <button onClick={() => onSuspend(dev)} disabled={isUpdating}
                      className={`flex items-center gap-1 h-7 px-3 rounded-lg text-[11px] font-black border disabled:opacity-50 ${isDark ? "bg-red-900/30 hover:bg-red-900/50 text-red-300 border-red-700/50" : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"}`}>
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
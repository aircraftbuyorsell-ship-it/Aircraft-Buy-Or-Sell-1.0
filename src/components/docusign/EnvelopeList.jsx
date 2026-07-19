import { RefreshCw, Mail, CheckCircle2, Clock, XCircle, FileText, Inbox } from "lucide-react";

const STATUS = {
  completed: { icon: CheckCircle2, color: "#5dcaa5", label: "Completed" },
  sent: { icon: Clock, color: "#f5c242", label: "Awaiting Signature" },
  delivered: { icon: Mail, color: "#4e8ef7", label: "Delivered" },
  declined: { icon: XCircle, color: "#e24b4a", label: "Declined" },
  voided: { icon: XCircle, color: "#e24b4a", label: "Voided" },
  created: { icon: Clock, color: "#888", label: "Draft" },
};

function formatDate(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts;
  }
}

export default function EnvelopeList({ envelopes, onRefresh }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div>
          <h2 className="text-sm font-bold text-white/90">Sent Agreements</h2>
          <p className="text-[10px] uppercase tracking-wider text-white/30">Last 30 days</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-white/5"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.60)" }}
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="p-3">
        {envelopes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <Inbox className="w-5 h-5 text-white/30" />
            </div>
            <p className="text-[12px] text-white/40">No agreements sent yet</p>
            <p className="text-[10px] text-white/25 mt-0.5">Use the form to send your first aircraft purchase agreement.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {envelopes.map((env) => {
              const cfg = STATUS[env.status] || { icon: FileText, color: "#888", label: env.status || "Unknown" };
              const Icon = cfg.icon;
              return (
                <div
                  key={env.envelopeId}
                  className="p-3 rounded-lg flex items-start gap-3"
                  style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${cfg.color}15` }}
                  >
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white/80 truncate">{env.emailSubject || "Untitled Envelope"}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: `${cfg.color}15`, color: cfg.color, border: `0.5px solid ${cfg.color}30` }}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-white/30">{formatDate(env.statusChangedDateTime || env.createdDateTime)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}